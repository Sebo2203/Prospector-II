(function () {
  'use strict';

  const VERSION = '0.6.15';
  const DEFAULTS = {
    maxActions: 5000,
    delayMs: 0,
    strategy: 'balanced',
    stopOnDeath: true,
    logToConsole: true,
    freshGameIfMenu: true,
    shipClass: 'random',
    muteSound: true,
  };

  let session = null;
  let timer = null;
  let mutedSfx = null;

  const CAPTAIN_NAMES = [
    'Mara Venn', 'Ivo Kade', 'Sable Rook', 'Talia Voss',
    'Orin Vale', 'Nika Thorn', 'Cass Mire', 'Juno Stahl',
  ];
  const SHIP_NAMES = [
    'Patient Horizon', 'Copper Wake', 'Long Survey', 'Quiet Meridian',
    'Second Lantern', 'Dust Ledger', 'Far Prospect', 'Measured Risk',
  ];
  const SHIP_CLASSES_FOR_TEST = ['LIGHT_SCOUT', 'BULK_FREIGHTER', 'ATTACK_CORVETTE'];

  // Combat actions repeatedly land on the same target over several turns
  // without changing the player's own position/vitals/cargo (e.g. several
  // "Greater Heshithnak panics at your approach!" rounds in a row with no
  // crewHp/hull/oxygen/fuel change). Progress in these cases is tracked via
  // enemy HP, which posKey/coarsePosKey can't see, so an unchanged posKey
  // here doesn't mean the run is stuck - it's normal combat. Exclude these
  // actions from the position-cycle detectors (they have their own
  // ineffective-ship-fire / no-progress-streak signals instead).
  // Same rationale extends to being stranded (out of fuel): doStrandedWait()
  // intentionally holds the ship at a fixed (x,y) while it drains crew HP and
  // rolls for rescue each turn. Without this exemption, 'stranded-wait'
  // produces an identical (name, mode, x, y) coarsePosKey every action and
  // trips "repeating coarse position cycle (period 1)" after ~6 turns,
  // ending the run before a rescue (or crew death) can actually happen.
  const POSITION_CYCLE_EXEMPT_ACTIONS = new Set([
    'attack-ground', 'ship-fire', 'ship-retreat', 'ship-retreat-unarmed',
    'ship-surrender-stranded', 'stranded-wait', 'stranded-sos-on', 'stranded-accept-rescue',
  ]);

  function randomChoice(values) {
    return values[Math.floor(Math.random() * values.length)];
  }

  function muteGameSound() {
    if (mutedSfx || typeof SFX === 'undefined' || !SFX) return;
    mutedSfx = {};
    for (const key of Object.keys(SFX)) {
      if (typeof SFX[key] !== 'function') continue;
      mutedSfx[key] = SFX[key];
      SFX[key] = function () {};
    }
  }

  function restoreGameSound() {
    if (!mutedSfx || typeof SFX === 'undefined' || !SFX) return;
    for (const [key, fn] of Object.entries(mutedSfx)) SFX[key] = fn;
    mutedSfx = null;
  }

  function waitForNewGame(timeoutMs) {
    const started = Date.now();
    return new Promise((resolve, reject) => {
      function check() {
        if (typeof G !== 'undefined' && G?.galaxy && G.mode === 'galaxy') {
          resolve();
          return;
        }
        if (Date.now() - started >= timeoutMs) {
          reject(new Error('Fresh game initialization timed out.'));
          return;
        }
        setTimeout(check, 25);
      }
      check();
    });
  }

  async function ensureGameReady(options) {
    if (typeof G !== 'undefined' && G && !G.dead && !G.retired) return { created: false };
    if (!options.freshGameIfMenu) {
      throw new Error('Start or load a Prospector II game first.');
    }
    if (typeof initGame !== 'function') {
      throw new Error('Prospector II game initializer is unavailable.');
    }

    const shipClass = options.shipClass === 'random'
      ? randomChoice(SHIP_CLASSES_FOR_TEST)
      : options.shipClass;
    const captainName = randomChoice(CAPTAIN_NAMES);
    const shipName = randomChoice(SHIP_NAMES);
    initGame(shipClass, captainName, shipName);
    await waitForNewGame(10000);
    return { created: true, shipClass, captainName, shipName };
  }

  function nowState() {
    if (typeof G === 'undefined' || !G) return null;
    const living = (G.crew || []).filter(c => c.hp > 0);
    return {
      turn: G.turn || 0,
      mode: G.mode || 'unknown',
      credits: G.credits || 0,
      fuel: Number(G.fuel || 0),
      oxygen: Number(G.oxygen || 0),
      hull: Number(G.ship?.hp || 0),
      crewAlive: living.length,
      crewHp: living.reduce((sum, c) => sum + Math.max(0, c.hp || 0), 0),
      cargo: (G.cargo || []).length,
      inventory: (G.inventory || []).length,
      x: G.mode === 'planet' ? G.player?.x : G.ship?.x,
      y: G.mode === 'planet' ? G.player?.y : G.ship?.y,
      dead: !!G.dead,
      retired: !!G.retired,
      deathCause: String(G.deathCause || ''),
      message: String(G.msg || ''),
    };
  }

  function stateKey(s) {
    if (!s) return 'no-game';
    return [s.turn, s.mode, s.credits, s.fuel.toFixed(2), s.oxygen.toFixed(2),
      s.hull, s.crewHp, s.cargo, s.x, s.y, s.dead, s.retired].join('|');
  }

  function recordAction(name, detail, before, after, error) {
    const rec = {
      index: session.actions.length,
      name,
      detail: detail || '',
      before,
      after,
      error: error ? String(error.stack || error) : null,
    };
    session.actions.push(rec);
    session.actionCounts[name] = (session.actionCounts[name] || 0) + 1;
    session.modeCounts[before?.mode || 'none'] = (session.modeCounts[before?.mode || 'none'] || 0) + 1;
    if (error) session.errors.push(rec);

    const progressed = stateKey(before) !== stateKey(after);
    session.noProgressStreak = progressed ? 0 : session.noProgressStreak + 1;
    session.maxNoProgressStreak = Math.max(session.maxNoProgressStreak, session.noProgressStreak);
    if (!progressed) session.noProgressActions[name] = (session.noProgressActions[name] || 0) + 1;

    if (before && after) {
      session.losses.fuel += Math.max(0, before.fuel - after.fuel);
      session.losses.oxygen += Math.max(0, before.oxygen - after.oxygen);
      session.losses.hull += Math.max(0, before.hull - after.hull);
      session.losses.crewHp += Math.max(0, before.crewHp - after.crewHp);
      session.gains.credits += Math.max(0, after.credits - before.credits);
      if (after.mode !== before.mode) {
        session.transitions[before.mode + ' -> ' + after.mode] =
          (session.transitions[before.mode + ' -> ' + after.mode] || 0) + 1;
      }
    }

    const cycleKey = after
      ? [after.turn, after.mode, after.x, after.y, after.oxygen, after.crewHp, after.hull].join('|')
      : 'no-state';
    session.recentStateKeys.push(cycleKey);
    if (session.recentStateKeys.length > 12) session.recentStateKeys.shift();

    // cycleKey above includes `turn`, which increments on essentially every
    // action, so it can never repeat — making the alternating-cycle check
    // below it permanently dead for any loop where the turn counter keeps
    // advancing (e.g. an explore/return-to-ship ping-pong). Track a second,
    // turn-independent key (action name + resulting position/mode/vitals) so
    // that kind of oscillation can still be detected and stopped quickly.
    if (!POSITION_CYCLE_EXEMPT_ACTIONS.has(name)) {
      const posKey = after
        ? [name, after.mode, after.x, after.y, after.oxygen.toFixed(1), after.fuel.toFixed(1),
            after.crewHp, after.hull, after.cargo].join('|')
        : 'no-state';
      session.recentPosKeys.push(posKey);
      if (session.recentPosKeys.length > 16) session.recentPosKeys.shift();

      // posKey above still includes fuel/oxygen, which can drift by a fixed
      // amount on every action (e.g. galaxy travel burns ~1 fuel/turn), so a
      // pure back-and-forth in (mode, x, y) - the ship bouncing between two
      // adjacent tiles while fuel quietly drains to zero - never repeats and
      // slips past the detector above (seen as a 106-action CASINO@16,41 <->
      // (16,40) loop in prospector-playtest-11694945, caused by a separate
      // actGalaxy bug that has been fixed). Track a coarser, resource-free key
      // as a backstop against any similar future mismatch, requiring many more
      // repeats before stopping since short legitimate backtracks (e.g.
      // dodging a hazard) are more plausible at this resolution.
      const coarsePosKey = after ? [name, after.mode, after.x, after.y].join('|') : 'no-state';
      session.recentCoarsePosKeys.push(coarsePosKey);
      if (session.recentCoarsePosKeys.length > 24) session.recentCoarsePosKeys.shift();
    }
  }

  // Returns the smallest period (1..maxPeriod) for which the tail of `keys`
  // shows at least `minRepeats + 1` consecutive repeats of that period, or 0
  // if no such pattern is found. E.g. with period 2 and minRepeats 2, this
  // catches A,B,A,B,A,B (an action ping-ponging between two states).
  function detectAlternatingCycle(keys, maxPeriod, minRepeats) {
    for (let period = 1; period <= maxPeriod; period++) {
      const needed = period * (minRepeats + 1);
      if (keys.length < needed) continue;
      const recent = keys.slice(-needed);
      let ok = true;
      for (let i = 0; i < needed - period; i++) {
        if (recent[i] !== recent[i + period]) { ok = false; break; }
      }
      if (ok) return period;
    }
    return 0;
  }

  function perform(name, fn, detail) {
    const before = nowState();
    let error = null;
    try {
      fn();
    } catch (err) {
      error = err;
    }
    const after = nowState();
    recordAction(name, detail, before, after, error);
    return !error;
  }

  function pressKey(key, code) {
    document.dispatchEvent(new KeyboardEvent('keydown', {
      key,
      code: code || key,
      bubbles: true,
      cancelable: true,
    }));
  }

  function distance(a, b) {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
  }

  function nearest(items, origin, filter) {
    let best = null;
    let bestDist = Infinity;
    for (const item of items || []) {
      if (filter && !filter(item)) continue;
      const d = distance(origin, item);
      if (d < bestDist) {
        best = item;
        bestDist = d;
      }
    }
    return best;
  }

  function crewMedicalRisk() {
    const urgentIds = new Set([
      'heavy_bleeding', 'toxin_poisoning', 'sepsis', 'alien_parasite',
    ]);
    const concerningIds = new Set(['bleeding', 'fever', 'infection']);
    const statuses = [];
    for (const crew of G.crew || []) {
      if (crew.hp <= 0) continue;
      const active = typeof crewStatusList === 'function'
        ? crewStatusList(crew)
        : Object.values(crew.statuses || {});
      for (const status of active) {
        if (!status?.id) continue;
        const severity = status.severity ?? status.intensity ?? 1;
        if (urgentIds.has(status.id) || (concerningIds.has(status.id) && severity >= 2)) {
          statuses.push({
            crew: crew.name || 'crew',
            id: status.id,
            severity,
          });
        }
      }
    }
    return {
      urgent: statuses.length > 0,
      statuses,
      summary: statuses.map(s => s.id + (s.severity > 1 ? ' ' + s.severity : '')).join(', '),
    };
  }

  function hasCrewShortage() {
    return (G.crew || []).filter(c => c.hp > 0).length < session.targetCrewCount;
  }

  function stepToward(from, target) {
    return {
      dx: target.x === from.x ? 0 : target.x > from.x ? 1 : -1,
      dy: target.y === from.y ? 0 : target.y > from.y ? 1 : -1,
    };
  }

  function galaxySafeRouteStep(target) {
    const origin = { x: G.ship.x, y: G.ship.y };
    const key = (x, y) => x + ',' + y;
    const targetKey = key(target.x, target.y);
    const blocked = new Set(session.dangerousGalaxyCells);
    for (const pirate of G.pirates || []) {
      if (!pirate.alive) continue;
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          if (Math.max(Math.abs(dx), Math.abs(dy)) <= 3) {
            blocked.add(key(pirate.x + dx, pirate.y + dy));
          }
        }
      }
    }
    for (const gas of G.gasEntities || []) {
      if (!gas.alive) continue;
      for (let dy = -6; dy <= 6; dy++) {
        for (let dx = -6; dx <= 6; dx++) {
          if (Math.abs(dx) + Math.abs(dy) <= 6) {
            blocked.add(key(gas.x + dx, gas.y + dy));
          }
        }
      }
    }
    for (const blackHole of G.blackHoles || []) {
      for (let dy = -3; dy <= 3; dy++) {
        for (let dx = -3; dx <= 3; dx++) {
          if (Math.abs(dx) + Math.abs(dy) <= 3) {
            blocked.add(key(blackHole.x + dx, blackHole.y + dy));
          }
        }
      }
    }
    for (const pulsar of G.pulsars || []) {
      for (let dy = -4; dy <= 4; dy++) {
        for (let dx = -4; dx <= 4; dx++) {
          if (Math.abs(dx) + Math.abs(dy) <= 4) {
            blocked.add(key(pulsar.x + dx, pulsar.y + dy));
          }
        }
      }
    }
    blocked.delete(key(origin.x, origin.y));
    blocked.delete(targetKey);

    const queue = [origin];
    let queueIndex = 0;
    const parent = new Map([[key(origin.x, origin.y), null]]);
    const dirs = [
      [-1, -1], [0, -1], [1, -1], [-1, 0],
      [1, 0], [-1, 1], [0, 1], [1, 1],
    ];
    let found = null;
    while (queueIndex < queue.length && parent.size < MAP_W * MAP_H) {
      const cur = queue[queueIndex++];
      if (cur.x === target.x && cur.y === target.y) {
        found = cur;
        break;
      }
      for (const [dx, dy] of dirs) {
        const x = cur.x + dx;
        const y = cur.y + dy;
        if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
        const nextKey = key(x, y);
        if (parent.has(nextKey) || blocked.has(nextKey)) continue;
        const isTarget = nextKey === targetKey;
        if (!isTarget && G.galaxy?.[y]?.[x]?.type === 'NEBULA') continue;
        parent.set(nextKey, cur);
        queue.push({ x, y });
      }
    }
    if (!found) return null;

    let cursor = found;
    let previous = parent.get(key(cursor.x, cursor.y));
    while (previous && !(previous.x === origin.x && previous.y === origin.y)) {
      cursor = previous;
      previous = parent.get(key(cursor.x, cursor.y));
    }
    return {
      dx: cursor.x - origin.x,
      dy: cursor.y - origin.y,
    };
  }

  function galaxyStepToward(target) {
    const origin = { x: G.ship.x, y: G.ship.y };
    const safeRoute = galaxySafeRouteStep(target);
    if (safeRoute) return safeRoute;
    const pirateThreats = (G.pirates || []).filter(p => p.alive);
    const gasThreats = (G.gasEntities || []).filter(e => e.alive);
    const currentThreatDistance = pirateThreats.length
      ? Math.min(...pirateThreats.map(p => distance(origin, p)))
      : Infinity;
    const currentGasDistance = gasThreats.length
      ? Math.min(...gasThreats.map(e => Math.abs(origin.x - e.x) + Math.abs(origin.y - e.y)))
      : Infinity;
    const currentlyInNebula = G.galaxy?.[origin.y]?.[origin.x]?.type === 'NEBULA';
    const candidates = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const x = origin.x + dx;
        const y = origin.y + dy;
        if (x < 0 || y < 0 || x >= MAP_W || y >= MAP_H) continue;
        const key = x + ',' + y;
        const threatDistance = pirateThreats.length
          ? Math.min(...pirateThreats.map(p => distance({ x, y }, p)))
          : Infinity;
        const gasDistance = gasThreats.length
          ? Math.min(...gasThreats.map(e => Math.abs(x - e.x) + Math.abs(y - e.y)))
          : Infinity;
        const nebula = G.galaxy?.[y]?.[x]?.type === 'NEBULA';
        const occupiedByThreat = threatDistance <= 3 || (nebula && gasDistance <= 6);
        candidates.push({
          dx,
          dy,
          distance: distance({ x, y }, target),
          threatDistance,
          gasDistance,
          nebula,
          dangerous: session.dangerousGalaxyCells.has(key) || occupiedByThreat,
        });
      }
    }
    const activelyChased = currentThreatDistance <= 5;
    const gasChased = currentlyInNebula && currentGasDistance <= 6;
    candidates.sort((a, b) =>
      Number(a.dangerous) - Number(b.dangerous) ||
      (gasChased ? Number(a.nebula) - Number(b.nebula) : 0) ||
      (gasChased ? b.gasDistance - a.gasDistance : 0) ||
      (activelyChased ? b.threatDistance - a.threatDistance : 0) ||
      a.distance - b.distance);
    return candidates[0] || stepToward(origin, target);
  }

  function baseServiceBudget() {
    const living = (G.crew || []).filter(c => c.hp > 0);
    const treatmentCost = living.length * 30;
    const refuelCost = Math.round(Math.max(0, G.maxFuel - G.fuel) * 0.8);
    return {
      treatmentCost,
      refuelCost,
      canTreat: G.credits >= treatmentCost,
      canRefuel: G.credits >= refuelCost,
      canRepair: G.credits >= 50,
      canRecruit: G.credits >= 100,
    };
  }

  function shouldSeekBase(nearestBase) {
    const origin = { x: G.ship.x, y: G.ship.y };
    const baseDistance = nearestBase ? distance(origin, nearestBase) : Infinity;
    const service = baseServiceBudget();
    const medical = crewMedicalRisk();
    const living = (G.crew || []).filter(c => c.hp > 0);
    const crewRatio = living.reduce((sum, c) => sum + Math.max(0, c.hp || 0), 0) /
      Math.max(1, living.reduce((sum, c) => sum + Math.max(1, c.maxHp || 1), 0));
    return (
      (medical.urgent && service.canTreat) ||
      (hasCrewShortage() && service.canRecruit) ||
      (G.fuel <= Math.max(18, G.maxFuel * 0.28, baseDistance + 40) && service.canRefuel) ||
      (G.ship.hp <= G.ship.maxHp * 0.45 && service.canRepair) ||
      (crewRatio < 0.55 && service.canTreat)
    );
  }

  function galaxyTargets() {
    const targets = [];
    for (let y = 0; y < MAP_H; y++) {
      for (let x = 0; x < MAP_W; x++) {
        const cell = G.galaxy?.[y]?.[x];
        if (!cell) continue;
        if (['SYSTEM', 'ROGUE_PLANET', 'BASE', 'DERELICT', 'CASINO'].includes(cell.type)) {
          targets.push({ x, y, type: cell.type, cell });
        }
      }
    }
    return targets;
  }

  function chooseGalaxyTarget() {
    const origin = { x: G.ship.x, y: G.ship.y };
    const targets = galaxyTargets();
    const nearestBase = nearest(targets, origin, t => t.type === 'BASE');
    if (shouldSeekBase(nearestBase)) {
      return nearestBase;
    }

    const fresh = targets.filter(t => {
      const key = t.x + ',' + t.y;
      return t.type !== 'BASE' && !session.visitedGalaxyTargets.has(key);
    });
    return nearest(fresh.length ? fresh : targets.filter(t => t.type !== 'CASINO'), origin);
  }

  function actGalaxy() {
    // Out of fuel: G.stranded is set by tryMove() but the SOS beacon toggle
    // and rescue accept/decline prompts are wired only into the keydown
    // handler (T / Y / N), which this agent never simulates. Without this,
    // move-galaxy still calls doStrandedWait() each turn (tryMove falls into
    // its G.fuel<=0 branch), but SOS is never activated — roughly
    // quadrupling rescue-notice odds and range — and a rescue offer just
    // gets reminder-logged forever since nothing presses [Y]. See
    // prospector-playtest-16203740, which ended "stranded... Reserves
    // failing" with no rescue ever attempted.
    if (G.stranded) {
      if (G.stranded.rescuePhase === 'offer') {
        return perform('stranded-accept-rescue', () => doAcceptRescue(),
          G.stranded.rescueShip?.name || 'rescue offer');
      }
      if (!G.stranded.sos) {
        return perform('stranded-sos-on', () => {
          G.stranded.sos = true;
          addLog('SOS beacon activated. Transmitting distress signal...', 'lw');
          addLog('WARNING: Signal may attract hostile vessels.', 'lc');
          renderAll();
        }, 'enable distress beacon while stranded');
      }
      // SOS is on and no rescue offer is pending — advance the stranded wait
      // loop. tryMove() routes to doStrandedWait() while G.fuel<=0; the
      // direction is irrelevant in that branch.
      return perform('stranded-wait', () => tryMove(0, 1), 'awaiting rescue');
    }

    const cell = G.galaxy?.[G.ship.y]?.[G.ship.x];
    // Must match the cell types collected by galaxyTargets() below. CASINO was
    // previously missing here, so once the ship reached a casino tile it was
    // never marked visited and chooseGalaxyTarget() kept re-selecting it as the
    // nearest "fresh" target forever. Since the ship was already standing on
    // (distance 0 from) the target, galaxyStepToward() always picked some
    // adjacent tile (distance 1, the best available) and stepped back next turn
    // - producing an endless back-and-forth between the casino tile and one
    // neighbor (e.g. the 106-action CASINO@16,41 <-> (16,40) loop seen in
    // prospector-playtest-11694945).
    if (cell && ['SYSTEM', 'ROGUE_PLANET', 'BASE', 'DERELICT', 'CASINO'].includes(cell.type)) {
      const key = G.ship.x + ',' + G.ship.y;
      const urgentBaseService = cell.type === 'BASE' &&
        shouldSeekBase({ x: G.ship.x, y: G.ship.y });
      if (!session.visitedGalaxyTargets.has(key) || urgentBaseService) {
        session.visitedGalaxyTargets.add(key);
        return perform('interact', () => doInteract(), cell.type);
      }
    }

    const target = chooseGalaxyTarget();
    if (!target) return perform('wait-galaxy', () => doWaitGalaxy(), 'no target');
    const step = galaxyStepToward(target);
    return perform('move-galaxy', () => tryMove(step.dx, step.dy),
      target.type + '@' + target.x + ',' + target.y);
  }

  function actBase() {
    // Liquidate mined cargo and science samples for credits whenever docked.
    // Previously this only happened during a medical/crew-shortage funding
    // emergency, so a ship that was simply low on credits (but otherwise
    // fine) kept arriving at a base with sellable cargo still in the hold,
    // failing to afford a refuel ("Need 112 cr to refuel" with cargo=1
    // unsold), undocking, and immediately re-docking at the same base because
    // low fuel still counted as urgent - an interact/base-refuel/base-undock
    // loop (caught by the position-cycle detector after ~6 repeats in
    // prospector-playtest-11694945, but better avoided by actually selling
    // what's in the hold).
    if ((G.cargo || []).some(item => item.isCommodity)) {
      perform('base-sell-cargo', () => executeBaseAction('market_sell_all'), 'liquidate cargo for credits');
    }
    if ((G.inventory || []).some(item => (item.value || 0) > 0 || item.isCapturedCreature) ||
        (typeof getSurveyPayoutBreakdown === 'function' && getSurveyPayoutBreakdown().pending > 0)) {
      perform('base-sell-science', () => executeBaseAction('sell'), 'liquidate science samples for credits');
    }

    const living = (G.crew || []).filter(c => c.hp > 0);
    const crewRatio = living.reduce((sum, c) => sum + Math.max(0, c.hp || 0), 0) /
      Math.max(1, living.reduce((sum, c) => sum + Math.max(1, c.maxHp || 1), 0));
    const treatmentCost = living.length * 30;
    const medical = crewMedicalRisk();
    if ((medical.urgent || crewRatio < 0.8) && G.credits >= treatmentCost) {
      perform('base-heal-crew', () => executeBaseAction('healcrew'));
    }
    if (medical.urgent && crewMedicalRisk().urgent) {
      perform('base-medical-care-unaffordable', () => {
        session.notes.push({
          turn: G.turn,
          note: 'Playtest stopped at base: progressive medical emergency remains untreated.',
          statuses: crewMedicalRisk().summary,
          credits: G.credits,
          treatmentCost,
        });
      }, medical.summary);
      stop('medical emergency without treatment funds');
      return false;
    }
    while (hasCrewShortage() && G.credits >= 100) {
      G.base.recruitSel = 5;
      perform('base-recruit-redshirt', () => executeBaseAction('recruit_confirm'),
        'restore expedition crew');
    }
    const refuelCost = Math.round(Math.max(0, G.maxFuel - G.fuel) * 0.8);
    if (G.fuel < G.maxFuel && G.credits >= refuelCost) {
      perform('base-refuel', () => executeBaseAction('refuel'));
    }
    const postRefuelReserve = Math.round(Math.max(0, G.maxFuel - G.fuel) * 0.8);
    if (G.ship.hp < G.ship.maxHp * 0.7 && G.credits >= 50 + postRefuelReserve) {
      perform('base-repair', () => executeBaseAction('repair'));
    }

    // Get armed if currently unarmed. An unarmed ship's only response to a
    // pirate encounter is ship-retreat-unarmed (~50% chance per turn to take
    // pirate.atk + 1d6 hull damage with no way to fight back). In
    // prospector-playtest-13606319 a weaponless BULK_FREIGHTER lost 449 hull
    // (120 -> 25) this way over a single run. BULK_FREIGHTER starts with
    // weaponSlots:0, so first unlock a slot (needs an Engineer + 500cr), then
    // install the cheapest weapon (mass driver, 300cr) once a slot is free.
    const ssArm = G.shipStats || {};
    const hasArmedWeapon = (ssArm.weaponSlots || 0) > 0 && (G.installedWeapons || []).some(id =>
      id && SHIP_WEAPONS[id] && !SHIP_WEAPONS[id].placeholder);
    if (!hasArmedWeapon) {
      const hasEngineerCrew = (G.crew || []).some(c => c.role === 'engineer' && c.hp > 0);
      if ((ssArm.weaponSlots || 0) < (ssArm.maxWeaponSlots || 0) && hasEngineerCrew && G.credits >= 500) {
        perform('base-unlock-weapon-slot', () => executeBaseAction('upwslot'), 'arm an unarmed ship');
      }
      const ssAfterSlot = G.shipStats || {};
      const massDriverCost = SHIP_WEAPONS.mass_driver?.cost || 300;
      if ((ssAfterSlot.weaponSlots || 0) > 0 && G.credits >= massDriverCost) {
        let slot = (G.installedWeapons || []).findIndex((id, i) =>
          i < ssAfterSlot.weaponSlots && (!id || !SHIP_WEAPONS[id] || SHIP_WEAPONS[id].placeholder));
        if (slot === -1) slot = 0;
        // executeBaseAction('installweapon_<slot>') sets G.base.weaponSel = 0,
        // which 'confirminstall' resolves to weapons2[0] === mass_driver — the
        // cheapest option, matching massDriverCost above.
        perform('base-install-weapon', () => {
          executeBaseAction('installweapon_' + slot);
          executeBaseAction('confirminstall');
        }, 'mass driver in slot ' + (slot + 1));
      }
    }

    return perform('base-undock', () => {
      G.mode = 'galaxy';
      addLog('Autonomous playtester undocked.', 'li');
      renderAll();
    });
  }

  function actSystem() {
    const cell = G.galaxy?.[G.ship.y]?.[G.ship.x];
    const planets = cell?.planets || [];
    const medical = crewMedicalRisk();
    if (medical.urgent || hasCrewShortage()) {
      session.relocationRequest = null;
      return perform('leave-system-medical', () => {
        G.mode = 'galaxy';
        G.curSystem = '';
        G.examine = null;
        addLog('Autonomous playtester is diverting to a base for medical care.', 'lw');
        renderAll();
      }, medical.urgent ? medical.summary : 'replace lost crew');
    }
    if (!planets.length) {
      return perform('leave-empty-system', () => {
        G.mode = 'galaxy';
        G.curSystem = '';
        renderAll();
      });
    }

    const relocation = session.relocationRequest;
    if (relocation && relocation.systemKey === G.curSystem) {
      const pDesc = planets[relocation.planetIndex];
      if (!pDesc) {
        session.relocationRequest = null;
      } else {
        G.selPlanet = relocation.planetIndex;
        G.selMoon = -1;
        if (pDesc.scanState !== 'full' && pDesc.scanState !== 'partial') {
          relocation.scanAttempts++;
          if (relocation.scanAttempts <= 4 && G.fuel > 1) {
            return perform('scan-for-relocation', () => doScan(), pDesc.biome || 'unknown');
          }
          session.notes.push({
            turn: G.turn,
            note: 'Relocation abandoned: scan data unavailable.',
            planet: relocation.pKey,
          });
          session.relocationRequest = null;
        } else {
          const pdata = getOrCreateScanPlanetData(relocation.pKey, pDesc.biome, pDesc.scanState);
          let best = null;
          let bestScore = Infinity;
          for (let y = 0; y < PH(pdata); y++) {
            for (let x = 0; x < PW(pdata); x++) {
              if (!canLandAt(pdata, x, y)) continue;
              if (x === pdata.spawnX && y === pdata.spawnY) continue;
              const score = distance({ x, y }, relocation.target);
              if (score < bestScore) {
                best = { x, y };
                bestScore = score;
              }
            }
          }

          if (best && bestScore < relocation.originalDistance) {
            session.relocationAttempts[relocation.pKey] =
              (session.relocationAttempts[relocation.pKey] || 0) + 1;
            session.relocationRequest = null;
            return perform('relocate-landing', () =>
              doLandOnPlanet(relocation.pKey, pDesc, best.x, best.y),
            pDesc.biome + ' near ' + relocation.target.x + ',' + relocation.target.y);
          }

          relocation.scanAttempts++;
          if (pDesc.scanState !== 'full' && relocation.scanAttempts <= 4 && G.fuel > 1) {
            return perform('improve-relocation-scan', () => doScan(), pDesc.biome || 'unknown');
          }
          session.notes.push({
            turn: G.turn,
            note: 'Relocation abandoned: scan revealed no better landing zone.',
            planet: relocation.pKey,
          });
          session.relocationRequest = null;
        }
      }
    }

    let idx = planets.findIndex((p, i) =>
      p.biome !== 'GAS_GIANT' && !session.visitedPlanets.has(G.curSystem + ':' + i));
    if (idx < 0) {
      session.completedSystems.add(G.curSystem);
      return perform('leave-completed-system', () => {
        G.mode = 'galaxy';
        G.curSystem = '';
        G.examine = null;
        addLog('Autonomous playtester finished surveying this system.', 'li');
        renderAll();
      });
    }
    G.selPlanet = idx;
    G.selMoon = -1;
    session.visitedPlanets.add(G.curSystem + ':' + idx);
    return perform('land', () => doInteract(), planets[idx].biome || 'unknown');
  }

  function isHazardousTile(type) {
    return ['LAVA', 'LAVA_FLOOR', 'AMMONIA'].includes(type);
  }

  function isPassable(pdata, x, y, avoidHazards) {
    if (!pdata || x < 0 || y < 0 || x >= PW(pdata) || y >= PH(pdata)) return false;
    const type = pdata.grid?.[y]?.[x]?.type;
    if (!type || type === 'rw_void' || type === 'ancient_st_void') return false;
    if (avoidHazards && isHazardousTile(type)) return false;
    if (!pdata.isUnderwater && type === 'EARTH_WATER') {
      const shoreAdjacent = [
        [-1, 0], [1, 0], [0, -1], [0, 1],
        [-1, -1], [1, -1], [-1, 1], [1, 1],
      ].some(([dx, dy]) => {
        const neighbor = pdata.grid?.[y + dy]?.[x + dx]?.type;
        return neighbor && TILE[neighbor]?.pass && neighbor !== 'EARTH_WATER';
      });
      if (!shoreAdjacent) return false;
    }
    return TILE[type]?.pass !== false;
  }

  function planetObjectives(pdata) {
    const types = new Set([
      'MINERAL', 'MINERAL_SAMPLE', 'ARTIFACT', 'BIODATA', 'CAVE_ENTRANCE',
      'ANCIENT_CONSOLE', 'ANCIENT_TERMINAL', 'DERELICT_CONSOLE', 'research_console',
      'CIV_BUILDING', 'SHIP',
    ]);
    const out = [];
    for (let y = 0; y < PH(pdata); y++) {
      for (let x = 0; x < PW(pdata); x++) {
        const cell = pdata.grid?.[y]?.[x];
        if (cell && types.has(cell.type)) out.push({ x, y, type: cell.type, cell });
      }
    }
    return out;
  }

  function planetReturnTarget(pdata) {
    if (pdata?.isCave) {
      for (let y = 0; y < PH(pdata); y++) {
        for (let x = 0; x < PW(pdata); x++) {
          if (pdata.grid?.[y]?.[x]?.type === 'cave_exit') {
            return { x, y, type: 'CAVE_EXIT' };
          }
        }
      }
    }
    return { x: pdata.spawnX, y: pdata.spawnY, type: 'SHIP' };
  }

  function bfsPath(pdata, start, goals, avoidEnemies, avoidHazards = true, extraBlocked = null) {
    const key = (x, y) => x + ',' + y;
    const goalKeys = new Set(goals.map(g => key(g.x, g.y)));
    const unstable = session?.unstablePlanetCells?.get(G.curPlanet) || new Set();
    const blocked = new Set();
    if (avoidEnemies) {
      for (const e of G.enemies?.[G.curPlanet] || []) {
        if (!e.alive || e.hidden) continue;
        blocked.add(key(e.x, e.y));
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) blocked.add(key(e.x + dx, e.y + dy));
        }
      }
    }

    const queue = [{ x: start.x, y: start.y }];
    const parent = new Map([[key(start.x, start.y), null]]);
    const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0], [-1, -1], [1, -1], [1, 1], [-1, 1]];
    let found = null;
    while (queue.length && parent.size < 5000) {
      const cur = queue.shift();
      if (goalKeys.has(key(cur.x, cur.y))) {
        found = cur;
        break;
      }
      for (const [dx, dy] of dirs) {
        const nx = cur.x + dx;
        const ny = cur.y + dy;
        const nk = key(nx, ny);
        if (parent.has(nk) || !isPassable(pdata, nx, ny, avoidHazards)) continue;
        if (extraBlocked?.has(nk) && !goalKeys.has(nk)) continue;
        if (unstable.has(nk) && !goalKeys.has(nk)) continue;
        if (blocked.has(nk) && !goalKeys.has(nk)) continue;
        parent.set(nk, cur);
        queue.push({ x: nx, y: ny });
      }
    }
    if (!found) return null;
    let cur = found;
    let prev = parent.get(key(cur.x, cur.y));
    let length = 0;
    let first = cur;
    while (prev && !(prev.x === start.x && prev.y === start.y)) {
      length++;
      first = cur;
      cur = prev;
      prev = parent.get(key(cur.x, cur.y));
    }
    if (prev) {
      length++;
      first = cur;
    }
    return {
      dx: first.x - start.x,
      dy: first.y - start.y,
      length,
    };
  }

  function bfsStep(pdata, start, goals, avoidEnemies) {
    return bfsPath(pdata, start, goals, avoidEnemies);
  }

  function staticPlanetPathLength(pdata, start, goal) {
    if (!pdata || !start || !goal) return Infinity;
    const key = (x, y) => x + ',' + y;
    const queue = [{ x: start.x, y: start.y, length: 0 }];
    let queueIndex = 0;
    const visited = new Set([key(start.x, start.y)]);
    const dirs = [
      [0, -1], [1, 0], [0, 1], [-1, 0],
      [-1, -1], [1, -1], [1, 1], [-1, 1],
    ];
    while (queueIndex < queue.length && visited.size < 5000) {
      const cur = queue[queueIndex++];
      if (cur.x === goal.x && cur.y === goal.y) return cur.length;
      for (const [dx, dy] of dirs) {
        const x = cur.x + dx;
        const y = cur.y + dy;
        const nextKey = key(x, y);
        if (visited.has(nextKey) || !isPassable(pdata, x, y, true)) continue;
        visited.add(nextKey);
        queue.push({ x, y, length: cur.length + 1 });
      }
    }
    return Infinity;
  }

  function caveSurfaceReturnSteps(pdata) {
    if (!pdata?.isCave || !G._caveReturn) return 0;
    const surface = G.planets?.[G._caveReturn.planet];
    if (!surface) return Infinity;
    return staticPlanetPathLength(
      surface,
      { x: G._caveReturn.x, y: G._caveReturn.y },
      { x: surface.spawnX, y: surface.spawnY },
    );
  }

  // Standing on EARTH_WATER risks the "current pulls you off course!" event
  // (water-roll 0.15-0.30, see index.html), which shoves the player one tile
  // in a random passable direction and can repeatedly displace a return-to-ship
  // attempt back into the same spot - producing a "repeating position cycle"
  // stop even though the situation is fully survivable (per design, the player
  // can always step to the nearest dry tile). When the player is on water,
  // prioritize a short hop to the nearest non-water passable tile over the
  // normal route home; once on dry land the regular ship-directed path resumes.
  function groundEscapeStep(pdata, origin, extraBlocked = null) {
    if (pdata?.grid?.[origin.y]?.[origin.x]?.type !== 'EARTH_WATER') return null;
    const dryGoals = [];
    for (let y = 0; y < PH(pdata); y++) {
      for (let x = 0; x < PW(pdata); x++) {
        if (x === origin.x && y === origin.y) continue;
        const type = pdata.grid?.[y]?.[x]?.type;
        if (type && type !== 'EARTH_WATER' && TILE[type]?.pass !== false) dryGoals.push({ x, y });
      }
    }
    if (!dryGoals.length) return null;
    return bfsPath(pdata, origin, dryGoals, true, true, extraBlocked) ||
      bfsPath(pdata, origin, dryGoals, false, true, extraBlocked) ||
      bfsPath(pdata, origin, dryGoals, false);
  }

  function waterBacktrackBlock(pdata, origin, previousOrigin) {
    if (!previousOrigin) return null;
    const currentType = pdata.grid?.[origin.y]?.[origin.x]?.type;
    const previousType = pdata.grid?.[previousOrigin.y]?.[previousOrigin.x]?.type;
    if (currentType !== 'EARTH_WATER' && previousType !== 'EARTH_WATER') return null;
    return new Set([previousOrigin.x + ',' + previousOrigin.y]);
  }

  function oxygenRetreatPlan(pdata, origin, ship) {
    const safePath = bfsPath(pdata, origin, [ship], true);
    const directPath = bfsPath(pdata, origin, [ship], false);
    const emergencyPath = !safePath && !directPath
      ? bfsPath(pdata, origin, [ship], false, false)
      : null;
    if (!safePath && !directPath && !emergencyPath) {
      return {
        shouldReturn: true,
        path: null,
        reason: 'no path to ship',
        requiredOxygen: Infinity,
      };
    }

    const biome = typeof atmosphereBiome === 'function'
      ? atmosphereBiome(G.curPlanet)
      : (BIOMES[pdata.biome] || {});
    const drain = G.underwater ? Math.max(1, biome.oxyDrain || 1.5) : Math.max(0, biome.oxyDrain || 0);
    if (drain <= 0) {
      return {
        shouldReturn: false,
        path: safePath || directPath,
        reason: 'breathable atmosphere',
        requiredOxygen: 0,
      };
    }

    // Humans do not wait until the arithmetic reaches zero. Keep enough air
    // for a few wrong turns, one blocked tile, and extra caution in lava fields.
    const volcanic = pdata.biome === 'VOLCANIC';
    const reserveSteps = volcanic ? 12 : 5;
    const safeLength = safePath?.length ?? Infinity;
    const directLength = directPath?.length ?? Infinity;
    const safeUncertainty = Number.isFinite(safeLength) ? Math.max(2, Math.ceil(safeLength * 0.15)) : Infinity;
    const safeRequired = Number.isFinite(safeLength)
      ? (safeLength + reserveSteps + safeUncertainty) * drain
      : Infinity;
    const thinMargin = G.oxygen <= safeRequired + drain * 3;
    const chosenPath = directPath && thinMargin
      ? directPath
      : (safePath || directPath || emergencyPath);
    const routeUncertainty = Math.max(2, Math.ceil(chosenPath.length * 0.15));
    const surfaceReturnSteps = caveSurfaceReturnSteps(pdata);
    const requiredSteps = chosenPath.length + surfaceReturnSteps +
      reserveSteps + routeUncertainty;
    const requiredOxygen = requiredSteps * drain;

    return {
      shouldReturn: G.oxygen <= requiredOxygen,
      path: chosenPath,
      reason: 'need ' + requiredOxygen.toFixed(1) + ' O2 for ' + chosenPath.length +
        '-step ' + (chosenPath === directPath && safePath ? 'direct ' : '') + 'return' +
        (surfaceReturnSteps ? ' plus ' + surfaceReturnSteps + ' surface steps' : ''),
      requiredOxygen,
    };
  }

  function objectiveTripPlan(pdata, origin, objective, ship) {
    const outbound = bfsPath(pdata, origin, [objective], true) ||
      bfsPath(pdata, origin, [objective], false);
    if (!outbound) return null;
    const home = bfsPath(pdata, objective, [ship], true) ||
      bfsPath(pdata, objective, [ship], false);
    if (!home) return null;

    const biome = typeof atmosphereBiome === 'function'
      ? atmosphereBiome(G.curPlanet)
      : (BIOMES[pdata.biome] || {});
    const drain = G.underwater ? Math.max(1, biome.oxyDrain || 1.5) : Math.max(0, biome.oxyDrain || 0);
    if (drain <= 0) {
      return { outbound, home, requiredOxygen: 0, feasible: true };
    }

    const reserveSteps = pdata.biome === 'VOLCANIC' ? 12 : 5;
    const surfaceReturnSteps = caveSurfaceReturnSteps(pdata);
    const travelSteps = outbound.length + home.length + surfaceReturnSteps;
    const uncertainty = Math.max(2, Math.ceil(travelSteps * 0.15));
    const encounterSteps = pdata.biome === 'VOLCANIC' ? 4 : 2;
    const requiredOxygen = (travelSteps + reserveSteps + uncertainty + encounterSteps) * drain;
    return {
      outbound,
      home,
      requiredOxygen,
      feasible: G.oxygen >= requiredOxygen,
    };
  }

  function actPlanet() {
    const pdata = G.planets?.[G.curPlanet];
    if (!pdata) return perform('planet-missing-data', () => doLiftOff());
    const origin = { x: G.player.x, y: G.player.y };
    const enemies = (G.enemies?.[G.curPlanet] || []).filter(e => e.alive && !e.hidden);
    const adjacentEnemy = nearest(enemies, origin, e => distance(origin, e) <= 1);
    const crewRatio = (G.crew || []).reduce((sum, c) => sum + Math.max(0, c.hp), 0) /
      Math.max(1, (G.crew || []).reduce((sum, c) => sum + Math.max(1, c.maxHp), 0));
    const ship = planetReturnTarget(pdata);
    const retreatPlan = oxygenRetreatPlan(pdata, origin, ship);
    const knownDanger = adjacentEnemy && session.dangerousEnemies.has(adjacentEnemy);
    const combatRetreat = adjacentEnemy &&
      (pdata.isCave || knownDanger || crewRatio < 0.85);
    const biome = typeof atmosphereBiome === 'function'
      ? atmosphereBiome(G.curPlanet)
      : (BIOMES[pdata.biome] || {});
    const oxygenDrain = G.underwater
      ? Math.max(1, biome.oxyDrain || 1.5)
      : Math.max(0, biome.oxyDrain || 0);
    const combatOxygenRisk = adjacentEnemy && oxygenDrain > 0 &&
      G.oxygen <= retreatPlan.requiredOxygen + oxygenDrain * 6;
    const committedRetreat = session.retreatingPlanets.has(G.curPlanet);
    const medical = crewMedicalRisk();
    const caveWeariness = pdata.isCave && crewRatio < 0.9;
    const shouldReturn = committedRetreat || medical.urgent || retreatPlan.shouldReturn ||
      combatRetreat || combatOxygenRisk || caveWeariness || crewRatio < 0.55 ||
      (G.shipStats?.cargoCapacity > 0 && G.cargo.length >= G.shipStats.cargoCapacity);

    if (adjacentEnemy && !shouldReturn) {
      const hpBefore = (G.crew || []).reduce((sum, c) => sum + Math.max(0, c.hp), 0);
      const attacked = perform('attack-ground', () =>
        tryMove(adjacentEnemy.x - origin.x, adjacentEnemy.y - origin.y), adjacentEnemy.name);
      const hpAfter = (G.crew || []).reduce((sum, c) => sum + Math.max(0, c.hp), 0);
      const severeLoss = hpBefore - hpAfter >= Math.max(8, hpBefore * 0.15);
      if (severeLoss && adjacentEnemy.alive) {
        session.dangerousEnemies.add(adjacentEnemy);
        session.notes.push({
          turn: G.turn,
          note: 'Enemy marked dangerous after losing ' + (hpBefore - hpAfter) + ' crew HP in one exchange.',
          planet: G.curPlanet,
          enemy: adjacentEnemy.name,
        });
      }
      return attacked;
    }

    if (shouldReturn) {
      session.retreatingPlanets.add(G.curPlanet);
      if (origin.x === ship.x && origin.y === ship.y) {
        const retreatingPlanet = G.curPlanet;
        const lifted = perform('lift-off', () => doLiftOff(), 'committed retreat');
        session.retreatingPlanets.delete(retreatingPlanet);
        session.lastReturnOrigins.delete(retreatingPlanet);
        return lifted;
      }
      const previousOrigin = session.lastReturnOrigins.get(G.curPlanet);
      const backtrackBlock = waterBacktrackBlock(pdata, origin, previousOrigin);
      const urgentRoute = (medical.urgent || committedRetreat)
        ? (bfsPath(pdata, origin, [ship], true, true, backtrackBlock) ||
          bfsPath(pdata, origin, [ship], false, true, backtrackBlock) ||
          bfsPath(pdata, origin, [ship], false))
        : null;
      const stepHome = groundEscapeStep(pdata, origin, backtrackBlock) ||
        urgentRoute ||
        retreatPlan.path ||
        bfsStep(pdata, origin, [ship], true) ||
        bfsStep(pdata, origin, [ship], false);
      if (stepHome) {
        const reason = medical.urgent ? 'medical emergency: ' + medical.summary : retreatPlan.reason;
        const planetBefore = G.curPlanet;
        const intended = { x: origin.x + stepHome.dx, y: origin.y + stepHome.dy };
        const returned = perform('return-to-ship', () => tryMove(stepHome.dx, stepHome.dy),
          reason + ' via ' + stepHome.dx + ',' + stepHome.dy);
        session.lastReturnOrigins.set(planetBefore, origin);
        const moved = G.player.x !== origin.x || G.player.y !== origin.y;
        if (G.curPlanet === planetBefore && moved &&
            (G.player.x !== intended.x || G.player.y !== intended.y)) {
          let unstable = session.unstablePlanetCells.get(planetBefore);
          if (!unstable) {
            unstable = new Set();
            session.unstablePlanetCells.set(planetBefore, unstable);
          }
          unstable.add(intended.x + ',' + intended.y);
          session.notes.push({
            turn: G.turn,
            note: 'Return route adjusted after terrain displaced the crew.',
            planet: planetBefore,
            avoidedX: intended.x,
            avoidedY: intended.y,
            landedX: G.player.x,
            landedY: G.player.y,
          });
        }
        return returned;
      }
      return perform('emergency-lift-off', () => doLiftOff(), 'no path home');
    }

    const here = pdata.grid?.[origin.y]?.[origin.x];
    if (here?.type === 'MINERAL' && here.revealed) {
      const objectiveKey = G.curPlanet + ':' + origin.x + ',' + origin.y;
      const hasTool = (G.inventory || []).some(item => item.usable === 'mining_tool');
      const hasCargoSpace = (G.shipStats?.cargoCapacity || 0) > (G.cargo || []).length;
      if (hasTool && hasCargoSpace) {
        return perform('mine', () => pressKey('Enter', 'Enter'), here.oreType || 'mineral');
      }
      if (!session.visitedPlanetObjectives.has(objectiveKey)) {
        session.visitedPlanetObjectives.add(objectiveKey);
        return perform('skip-mineral', () => {
          session.notes.push({
            turn: G.turn,
            note: hasTool ? 'Mineral skipped: cargo unavailable.' : 'Mineral skipped: no mining tool.',
            planet: G.curPlanet,
            x: origin.x,
            y: origin.y,
          });
        }, here.oreType || 'mineral');
      }
    }

    const objectives = planetObjectives(pdata).filter(o => {
      if (o.type === 'SHIP') return false;
      return !session.visitedPlanetObjectives.has(G.curPlanet + ':' + o.x + ',' + o.y);
    });
    const plannedObjectives = objectives
      .map(target => ({ target, trip: objectiveTripPlan(pdata, origin, target, ship) }))
      .filter(entry => entry.trip?.feasible)
      .sort((a, b) => a.trip.outbound.length - b.trip.outbound.length);
    const planned = plannedObjectives[0] || null;
    if (planned) {
      const target = planned.target;
      const step = planned.trip.outbound;
      if (step) {
        if (distance(origin, target) <= 1) {
          session.visitedPlanetObjectives.add(G.curPlanet + ':' + target.x + ',' + target.y);
        }
        const turnBefore = G.turn;
        const xBefore = G.player.x;
        const yBefore = G.player.y;
        const moved = perform('explore-planet', () => tryMove(step.dx, step.dy), target.type);
        const lastAction = session.actions[session.actions.length - 1];
        const crewDamage = Math.max(0,
          (lastAction?.before?.crewHp || 0) - (lastAction?.after?.crewHp || 0));
        const standingType = pdata.grid?.[G.player.y]?.[G.player.x]?.type;
        if (crewDamage >= 8 || isHazardousTile(standingType)) {
          session.retreatingPlanets.add(G.curPlanet);
          session.notes.push({
            turn: G.turn,
            note: 'Retreat committed after hazardous terrain caused ' + crewDamage + ' crew HP damage.',
            planet: G.curPlanet,
            tile: standingType || 'unknown',
          });
        }
        if (G.turn === turnBefore && G.player.x === xBefore && G.player.y === yBefore) {
          session.visitedPlanetObjectives.add(G.curPlanet + ':' + target.x + ',' + target.y);
          session.notes.push({
            turn: G.turn,
            note: 'Objective skipped after movement was rejected by game rules.',
            planet: G.curPlanet,
            x: target.x,
            y: target.y,
            type: target.type,
          });
        }
        return moved;
      }
      session.visitedPlanetObjectives.add(G.curPlanet + ':' + target.x + ',' + target.y);
    }

    if (objectives.length && !planned) {
      const deferredKey = G.curPlanet + ':deferred';
      if (!session.planetNotes.has(deferredKey)) {
        session.planetNotes.add(deferredKey);
        session.notes.push({
          turn: G.turn,
          note: objectives.length + ' objectives deferred: unsafe oxygen round trip.',
          planet: G.curPlanet,
        });
      }
      const relocationCount = session.relocationAttempts[G.curPlanet] || 0;
      if (!pdata.isCave && !pdata.isUnderwater &&
          !session.relocationRequest && relocationCount < 3) {
        const target = objectives
          .map(objective => ({
            objective,
            path: bfsPath(pdata, origin, [objective], false),
          }))
          .filter(entry => entry.path)
          .sort((a, b) => b.path.length - a.path.length)[0];
        const planetIndex = Number.parseInt(String(G.curPlanet).split(':')[1], 10);
        if (target && Number.isInteger(planetIndex)) {
          session.relocationRequest = {
            systemKey: G.curSystem,
            pKey: G.curPlanet,
            planetIndex,
            target: { x: target.objective.x, y: target.objective.y },
            originalDistance: target.path.length,
            scanAttempts: 0,
          };
          session.notes.push({
            turn: G.turn,
            note: 'Relocation requested for distant objective.',
            planet: G.curPlanet,
            x: target.objective.x,
            y: target.objective.y,
          });
        }
      }
    }

    if (distance(origin, ship) === 0) {
      const completedPlanet = G.curPlanet;
      const lifted = perform('lift-off', () => doLiftOff(), 'objectives exhausted');
      session.lastReturnOrigins.delete(completedPlanet);
      return lifted;
    }
    const previousOrigin = session.lastReturnOrigins.get(G.curPlanet);
    const backtrackBlock = waterBacktrackBlock(pdata, origin, previousOrigin);
    const stepHome = groundEscapeStep(pdata, origin, backtrackBlock) ||
      bfsPath(pdata, origin, [ship], false, true, backtrackBlock) ||
      bfsStep(pdata, origin, [ship], false);
    if (stepHome) {
      const planetBefore = G.curPlanet;
      const returned = perform('return-to-ship', () => tryMove(stepHome.dx, stepHome.dy));
      session.lastReturnOrigins.set(planetBefore, origin);
      return returned;
    }
    return perform('wait-planet', () => doWaitPlanet(), 'no reachable objective');
  }

  function chooseDialogue() {
    const options = typeof dialogueVisibleOptions === 'function' ? dialogueVisibleOptions() : [];
    if (!options.length) {
      return perform('dialogue-close', () => { G.dialogue = null; renderAll(); });
    }
    const score = option => {
      const text = String(option?.label || option?.text || option?.title || '').toLowerCase();
      if (/attack|threaten|insult|steal/.test(text)) return -20;
      if (/leave|goodbye|depart|end/.test(text)) return -5;
      if (/trade|help|peace|learn|ask|explain|accept|agree/.test(text)) return 10;
      return 0;
    };
    let best = 0;
    for (let i = 1; i < options.length; i++) {
      if (score(options[i]) > score(options[best])) best = i;
    }
    return perform('dialogue-choice', () => chooseDialogueOption(best),
      String(options[best]?.label || options[best]?.text || best));
  }

  function actShipCombat() {
    const hullRatio = G.ship.hp / Math.max(1, G.ship.maxHp);
    const ss = G.shipStats || {};
    // A ship can have a weapon "installed" in its loadout array yet have
    // zero weapon slots (e.g. BULK_FREIGHTER) — doShipFire() then silently
    // no-ops every turn, which previously caused an infinite ship-fire loop
    // that burned the entire action budget without the pirate ever firing
    // back (doShipFire returns before the pirate's turn). Require an actual
    // usable weapon slot before treating the ship as armed.
    const hasWeapon = (ss.weaponSlots || 0) > 0 && (G.installedWeapons || []).some(id =>
      id && SHIP_WEAPONS[id] && !SHIP_WEAPONS[id].placeholder);
    const engine = ss.engineRating || 1;
    const retreatCost = Math.max(5, 12 - engine * 2) *
      (G.shipCombat?.pirate?._homeCluster ? 2 : 1);
    const gasEntityCombat = !!G.shipCombat?.pirate?._homeCluster;
    if (gasEntityCombat && G.fuel >= retreatCost) {
      const combatCell = G.ship.x + ',' + G.ship.y;
      const retreated = perform('ship-retreat', () => doShipRetreat(), 'escape gas entity early');
      if (G.mode === 'galaxy' && !G.dead) session.dangerousGalaxyCells.add(combatCell);
      return retreated;
    }
    if (!hasWeapon && G.fuel >= retreatCost) {
      const combatCell = G.ship.x + ',' + G.ship.y;
      const retreated = perform('ship-retreat-unarmed', () => doShipRetreat(), 'no installed weapon');
      if (G.mode === 'galaxy' && !G.dead) session.dangerousGalaxyCells.add(combatCell);
      return retreated;
    }
    if (!hasWeapon) {
      // No weapon and not enough fuel to flee: firing is a guaranteed no-op
      // for an unarmed hull, so the only state-changing option left is to
      // attempt surrender/negotiation, even against neutral patrols (which
      // resolves via a two-step warn-then-arrest flow) or gas entities
      // (which take a free shot at us). Either outcome ends the standoff
      // instead of looping forever.
      return perform('ship-surrender-stranded', () => doShipSurrender(),
        'unarmed and unable to retreat');
    }
    if (hullRatio < 0.3 && G.fuel >= retreatCost) {
      return perform('ship-retreat', () => doShipRetreat());
    }
    return perform('ship-fire', () => doShipFire());
  }

  function act() {
    if (!G) throw new Error('Start a game before starting the playtester.');
    if (G.dead || G.retired) return false;
    if (G.dialogue) return chooseDialogue();
    if (G.mode === 'shipcombat') return actShipCombat();
    if (G.mode === 'galaxy') return actGalaxy();
    if (G.mode === 'base') return actBase();
    if (G.mode === 'system') return actSystem();
    if (G.mode === 'planet') return actPlanet();
    if (G.mode === 'radio') return perform('close-radio', () => executeRadioTrade('close'));
    return perform('unsupported-mode', () => {
      session.unsupportedModes[G.mode] = (session.unsupportedModes[G.mode] || 0) + 1;
    }, G.mode);
  }

  function finding(severity, title, evidence, recommendation) {
    return { severity, title, evidence, recommendation };
  }

  function buildFindings() {
    const findings = [];
    const actions = session.actions.length || 1;
    const noProgress = Object.values(session.noProgressActions).reduce((a, b) => a + b, 0);
    const top = Object.entries(session.actionCounts).sort((a, b) => b[1] - a[1])[0];
    const final = nowState();

    if (session.errors.length) {
      findings.push(finding('high', 'Runtime errors during ordinary play',
        session.errors.length + ' agent actions threw exceptions.',
        'Inspect the first failing action and preserve its state snapshot as a regression test.'));
    }
    if (session.maxNoProgressStreak >= 8) {
      findings.push(finding('high', 'Possible soft lock or unclear interaction',
        'The agent repeated ' + session.maxNoProgressStreak + ' actions without any observable state change.',
        'Review the action trail around the longest stalled sequence and improve affordances or fallback actions.'));
    }
    if (noProgress / actions > 0.18) {
      findings.push(finding('medium', 'Too many ineffective actions',
        Math.round(noProgress / actions * 100) + '% of actions produced no observable progress.',
        'Check whether contextual controls, blocked-path feedback, or interaction prompts are too ambiguous.'));
    }
    if (top && top[1] / actions > 0.48 && actions > 50) {
      findings.push(finding('medium', 'A single action dominates play',
        '"' + top[0] + '" represented ' + Math.round(top[1] / actions * 100) + '% of all actions.',
        'Consider shortening traversal, increasing decision density, or adding meaningful alternatives.'));
    }
    if (session.losses.crewHp > 0 && session.actionCounts['attack-ground'] === undefined) {
      findings.push(finding('medium', 'Damage occurred without chosen combat',
        'Crew lost ' + session.losses.crewHp + ' HP without the agent intentionally initiating ground combat.',
        'Review telegraphing and escape windows for environmental or enemy damage.'));
    }
    if (session.losses.hull > 25 && session.actionCounts['ship-fire'] === undefined) {
      findings.push(finding('medium', 'Heavy hull loss outside chosen combat',
        'The ship lost ' + session.losses.hull + ' hull outside deliberate firing exchanges.',
        'Audit unavoidable travel, landing, and encounter damage for clarity and counterplay.'));
    }
    if (final?.dead) {
      findings.push(finding('high', 'Run ended in death',
        G.deathCause || 'No death cause was recorded.',
        'Replay the final 20 actions with the same seed and determine whether earlier warnings supported a fair decision.'));
    }
    if (Object.keys(session.unsupportedModes).length) {
      findings.push(finding('info', 'Agent coverage gap',
        'Unsupported modes: ' + Object.keys(session.unsupportedModes).join(', ') + '.',
        'Add semantic policies for these modes before treating aggregate balance results as representative.'));
    }
    if (!findings.length) {
      findings.push(finding('info', 'No strong anomaly detected',
        'This run completed without a clear telemetry threshold being crossed.',
        'Run a larger seed and strategy matrix before drawing balance conclusions.'));
    }
    return findings;
  }

  function report() {
    if (!session) return null;
    const end = nowState();
    return {
      agentVersion: VERSION,
      options: session.options,
      startedAt: session.startedAt,
      endedAt: new Date().toISOString(),
      durationMs: Date.now() - session.startedMs,
      stopReason: session.stopReason || null,
      seed: session.seed,
      bootstrap: session.bootstrap,
      initial: session.initial,
      final: end,
      actions: session.actions.length,
      actionCounts: session.actionCounts,
      modeCounts: session.modeCounts,
      transitions: session.transitions,
      losses: session.losses,
      gains: session.gains,
      noProgressActions: session.noProgressActions,
      maxNoProgressStreak: session.maxNoProgressStreak,
      errors: session.errors,
      findings: buildFindings(),
      notes: session.notes,
      trace: session.actions,
    };
  }

  async function downloadReport() {
    const data = report();
    if (!data) return null;
    const response = await fetch('/__playtest_report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) {
      throw new Error(result.error || 'Report save failed.');
    }
    return result;
  }

  function setControlStatus(text, color) {
    const panel = document.getElementById('prospector-playtest-controls');
    const status = panel?.querySelector('span');
    if (!status) return;
    status.textContent = text;
    if (color) status.style.color = color;
  }

  function stop(reason) {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
    if (!session) return null;
    if (!session.running && session.stopReason) return report();
    session.stopReason = reason || 'manual';
    session.running = false;
    restoreGameSound();
    const data = report();
    setControlStatus(
      'STOPPED: ' + session.stopReason.toUpperCase() + ' (' + data.actions + ' ACTIONS)',
      '#ffcc66',
    );
    if (session.options.logToConsole) {
      console.group('Prospector autonomous playtest');
      console.log('Stop reason:', session.stopReason);
      console.log('Actions:', data.actions, 'Final state:', data.final);
      console.table(data.findings);
      console.groupEnd();
    }
    return data;
  }

  function recoverWaterCycle(cycleReason) {
    if (G.mode !== 'planet' || G.underwater) return false;
    const pdata = G.planets?.[G.curPlanet];
    if (!pdata) return false;

    const recentPositions = session.actions.slice(-12).flatMap(action => [
      action.before,
      action.after,
    ]).filter(state => state?.mode === 'planet');
    const repeatedPositionKeys = new Set(recentPositions.map(state => state.x + ',' + state.y));
    const involvedWater = recentPositions.some(state =>
      pdata.grid?.[state.y]?.[state.x]?.type === 'EARTH_WATER');
    if (!involvedWater) return false;

    const origin = { x: G.player.x, y: G.player.y };
    const dryTiles = [];
    const fallbackDryTiles = [];
    for (let y = 0; y < PH(pdata); y++) {
      for (let x = 0; x < PW(pdata); x++) {
        const type = pdata.grid?.[y]?.[x]?.type;
        if (!type || type === 'EARTH_WATER' || TILE[type]?.pass === false) continue;
        if (x === origin.x && y === origin.y) continue;
        const candidate = { x, y, distance: distance(origin, { x, y }) };
        fallbackDryTiles.push(candidate);
        if (!repeatedPositionKeys.has(x + ',' + y)) dryTiles.push(candidate);
      }
    }
    dryTiles.sort((a, b) => a.distance - b.distance);
    fallbackDryTiles.sort((a, b) => a.distance - b.distance);
    const destination = dryTiles[0] || fallbackDryTiles[0];
    if (!destination) return false;

    const planet = G.curPlanet;
    perform('tester-water-recovery', () => {
      G.player.x = destination.x;
      G.player.y = destination.y;
      revealPlanet(planet, destination.x, destination.y, 2);
      addLog('Playtest recovery: moved crew from a repeated shallow-water loop to nearby dry land.', 'li');
      renderAll();
    }, cycleReason + ': ' + origin.x + ',' + origin.y + ' -> ' +
      destination.x + ',' + destination.y);
    session.notes.push({
      turn: G.turn,
      note: 'Tester-only water recovery used after repeated movement cycle.',
      planet,
      cycleReason,
      fromX: origin.x,
      fromY: origin.y,
      toX: destination.x,
      toY: destination.y,
    });
    session.lastReturnOrigins.delete(planet);
    session.recentStateKeys.length = 0;
    session.recentPosKeys.length = 0;
    session.recentCoarsePosKeys.length = 0;
    return true;
  }

  function loop() {
    if (!session?.running) return;
    if (session.actions.length >= session.options.maxActions) {
      stop('action limit');
      return;
    }
    if ((G.dead && session.options.stopOnDeath) || G.retired) {
      stop(G.dead ? 'death' : 'retirement');
      return;
    }
    act();
    if (session.recentStateKeys.length >= 8) {
      const recent = session.recentStateKeys.slice(-8);
      const alternating =
        recent[0] === recent[2] && recent[2] === recent[4] && recent[4] === recent[6] &&
        recent[1] === recent[3] && recent[3] === recent[5] && recent[5] === recent[7];
      if (alternating) {
        if (recoverWaterCycle('repeating state cycle')) {
          timer = setTimeout(loop, session.options.delayMs);
          return;
        }
        stop('repeating state cycle');
        return;
      }
    }
    const positionCyclePeriod = detectAlternatingCycle(session.recentPosKeys, 4, 2);
    if (positionCyclePeriod) {
      if (recoverWaterCycle('repeating position cycle (period ' + positionCyclePeriod + ')')) {
        timer = setTimeout(loop, session.options.delayMs);
        return;
      }
      stop('repeating position cycle (period ' + positionCyclePeriod + ')');
      return;
    }
    // Backstop for oscillations that drift fuel/oxygen every step (so posKey
    // never repeats) - require many more confirmed repeats since this key
    // ignores resources entirely.
    const coarsePositionCyclePeriod = detectAlternatingCycle(session.recentCoarsePosKeys, 4, 5);
    if (coarsePositionCyclePeriod) {
      if (recoverWaterCycle('repeating coarse position cycle (period ' +
          coarsePositionCyclePeriod + ')')) {
        timer = setTimeout(loop, session.options.delayMs);
        return;
      }
      stop('repeating coarse position cycle (period ' + coarsePositionCyclePeriod + ')');
      return;
    }
    if (session.noProgressStreak >= 15) {
      stop('possible soft lock');
      return;
    }
    timer = setTimeout(loop, session.options.delayMs);
  }

  async function start(options) {
    if (session?.running) stop('restarted');
    const opts = Object.assign({}, DEFAULTS, options || {});
    if (opts.muteSound) muteGameSound();
    let bootstrap;
    try {
      bootstrap = await ensureGameReady(opts);
    } catch (error) {
      restoreGameSound();
      throw error;
    }
    session = {
      options: opts,
      running: true,
      startedAt: new Date().toISOString(),
      startedMs: Date.now(),
      seed: G.seed,
      initial: nowState(),
      targetCrewCount: Math.min(
        G.shipStats?.maxCrew || 4,
        Math.max(3, (G.crew || []).filter(c => c.hp > 0).length),
      ),
      bootstrap,
      actions: [],
      actionCounts: {},
      modeCounts: {},
      transitions: {},
      losses: { fuel: 0, oxygen: 0, hull: 0, crewHp: 0 },
      gains: { credits: 0 },
      noProgressActions: {},
      noProgressStreak: 0,
      maxNoProgressStreak: 0,
      errors: [],
      unsupportedModes: {},
      notes: [],
      recentStateKeys: [],
      recentPosKeys: [],
      recentCoarsePosKeys: [],
      visitedGalaxyTargets: new Set(),
      visitedPlanets: new Set(),
      visitedPlanetObjectives: new Set(),
      completedSystems: new Set(),
      planetNotes: new Set(),
      relocationRequest: null,
      relocationAttempts: {},
      dangerousEnemies: new WeakSet(),
      dangerousGalaxyCells: new Set(),
      retreatingPlanets: new Set(),
      unstablePlanetCells: new Map(),
      lastReturnOrigins: new Map(),
    };
    loop();
    return session;
  }

  function createControls() {
    if (document.getElementById('prospector-playtest-controls')) return;

    const panel = document.createElement('div');
    panel.id = 'prospector-playtest-controls';
    panel.style.cssText = [
      'position:fixed',
      'right:12px',
      'bottom:12px',
      'z-index:100000',
      'display:flex',
      'gap:6px',
      'padding:8px',
      'background:#080812',
      'border:1px solid #445566',
      'font:12px Courier New,monospace',
      'color:#ccddee',
      'box-shadow:0 2px 12px #000',
    ].join(';');

    const status = document.createElement('span');
    status.textContent = 'PLAYTEST READY';
    status.style.cssText = 'align-self:center;margin-right:4px;color:#88ccff';

    function button(label, handler) {
      const el = document.createElement('button');
      el.type = 'button';
      el.textContent = label;
      el.style.cssText = [
        'padding:5px 8px',
        'border:1px solid #556677',
        'background:#151525',
        'color:#ffffff',
        'font:12px Courier New,monospace',
        'cursor:pointer',
      ].join(';');
      el.addEventListener('click', handler);
      return el;
    }

    const startButton = button('START 5000', async () => {
      startButton.disabled = true;
      status.textContent = 'STARTING FRESH RUN';
      status.style.color = '#88ccff';
      try {
        await start({ maxActions: 5000 });
        status.textContent = 'PLAYTEST RUNNING - MUTED';
        status.style.color = '#66ff99';
      } catch (error) {
        status.textContent = 'START FAILED';
        status.style.color = '#ff6677';
        console.error(error);
      } finally {
        startButton.disabled = false;
      }
    });
    const stopButton = button('STOP', () => {
      const data = stop('manual');
      status.textContent = data
        ? 'STOPPED: ' + String(data.stopReason || 'manual').toUpperCase() +
          ' (' + data.actions + ' ACTIONS)'
        : 'NOT RUNNING';
      status.style.color = '#ffcc66';
    });
    const reportButton = button('SAVE REPORT', async () => {
      try {
        const result = await downloadReport();
        status.textContent = result ? 'SAVED: ' + result.filename : 'NO PLAYTEST DATA';
        status.style.color = result ? '#66ff99' : '#ffcc66';
      } catch (error) {
        status.textContent = 'SAVE FAILED';
        status.style.color = '#ff6677';
        console.error(error);
      }
    });

    panel.append(status, startButton, stopButton, reportButton);
    document.body.appendChild(panel);
  }

  function step(count) {
    if (typeof G === 'undefined' || !G) {
      throw new Error('Use start() to create a fresh game before stepping manually.');
    }
    if (!session) {
      throw new Error('Start a playtest session before stepping manually.');
    }
    const total = Math.max(1, count || 1);
    for (let i = 0; i < total && G && !G.dead && !G.retired; i++) act();
    return report();
  }

  window.ProspectorPlaytest = Object.freeze({
    version: VERSION,
    start,
    stop,
    step,
    report,
    downloadReport,
    isRunning: () => !!session?.running,
  });

  console.info('ProspectorPlaytest ' + VERSION +
    ' ready. Start a game, then run ProspectorPlaytest.start({ maxActions: 5000 }).');

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createControls, { once: true });
  } else {
    createControls();
  }
}());
