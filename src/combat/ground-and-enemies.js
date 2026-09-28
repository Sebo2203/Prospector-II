function doCombat(enemy){
  if(!crewAlive()) return;
  if(enemy?.civLocal){
    makeCivilizationHostileFromLocal(enemy, 'Responding to crew violence');
  }
  if(enemy?.canCommunicate){
    makeCommunicableAlienHostile(enemy, 'Defending itself from the crew');
  }
  const livingAttackers = G.crew.filter(c=>c.hp>0);
  const attackers = livingAttackers.filter(c=>crewCanContributeCombat(c));
  if(livingAttackers.length && !attackers.length){
    addLog('All crew are stunned — enemies seize the opening!','lc');
    G.turn++;
    if(applyOxygenDrain()){ renderAll(); return; }
    applyOxygenWarnings();
    moveEnemies();
    moveEnemies();
    processPlanetHazards();
    checkDeath();
    renderAll();
    return;
  }
  if(!attackers.length) return;

  // -- All crew attack simultaneously ---------------------------
  let totalDmg = 0;
  const hitters = [];
  let stunBatonHit = false;
  attackers.forEach(c=>{
    const weaponBonus = c.weaponUsable === 'gun_sniper' ? 5 : c.weaponUsable === 'gun_breacher' ? 4 : c.weaponUsable === 'knife' ? 1 : c.weaponUsable === 'vibroblade' ? 4 : c.weaponUsable === 'stun_baton' ? 2 : c.weaponUsable === 'gun_shotgun' ? 3 : c.weaponUsable === 'gun_burst' ? 3 : c.weaponUsable === 'gun_plasma' ? 3 : c.weaponUsable === 'tranq_darts' ? 0 : (c.weapon && c.weapon !== 'Bare hands') ? 2 : 0;
    const stimBonus = (c._stimAtk||0) > 0 && G.turn <= (c._stimUntil||0) ? c._stimAtk : 0;
    const implantAtkBonus = crewImplantAtkBonus(c);
    // CBT skill: base hit chance 70% + 3% per skill point (max 100% at CBT 10)
    const cbtSkill = crewSkillValue(c, 'cbt');
    const hitChanceGround = Math.min(1.0, 0.70 + cbtSkill * 0.03);
    if(Math.random() < hitChanceGround){
      if(c.weaponUsable === 'stun_baton'){
        // Stun baton: fixed 1-2 damage, ignores ATK bonus, 65% stun chance
        const dmg = 1 + rnd(2);
        totalDmg += dmg;
        hitters.push(c);
        if(Math.random() < 0.65 * (10 / (10 + (enemy.maxHp || enemy.hp || 10)))) stunBatonHit = true;
      } else {
        const dmg = Math.max(1, c.atk + weaponBonus + stimBonus + implantAtkBonus + rnd(1));
        totalDmg += dmg;
        hitters.push(c);
      }
    }
  });
  // Guarantee at least 1 damage so combat always progresses
  if(totalDmg === 0) totalDmg = 1;

  // CBT XP — crew who landed hits. Captain gains SOC from coordinating the team.
  hitters.forEach(c => giveSkillXP(c, 'cbt', 2));
  const _capSoc = G.crew.find(c=>c.role==='captain'&&c.hp>0);
  if(_capSoc) giveSkillXP(_capSoc, 'soc', hitters.includes(_capSoc) ? 2 : 1);
  enemy.hp -= totalDmg;

  // Apply stun baton effect
  if(stunBatonHit && enemy.hp > 0){
    enemy.stunTurns = (enemy.stunTurns || 0) + 2;
  }

  // Combined attack log
  debugCombatLog('CREW_ATTACK', { target: enemy.name, dmg: totalDmg, enemyHp: enemy.hp, hitters: hitters.map(c=>c.name) });
  G.turn++;
  if(applyOxygenDrain()){ renderAll(); return; }
  applyOxygenWarnings();
  if(enemy.hp > 0){
    const stunNote = stunBatonHit ? ' '+enemy.name+' is stunned!' : '';
    addLog('Your crew strikes '+enemy.name+' for '+totalDmg+' damage.'+stunNote,'lc');
    // Enemy counter-attack is handled by moveEnemies() on the same turn,
    // so there is no inline retaliation here — one exchange per turn.

  } else {
    // Killed on crew's turn
    enemy.alive = false;
    addLog('Your crew strikes '+enemy.name+' for '+totalDmg+'. '+enemy.name+' defeated!','lg');
    dropAlienDeathLoot(enemy);
  }

  moveEnemies();
  processPlanetHazards();
  checkDeath();
  renderAll();
}

function tryEnemyRangedAttack(e, pdata){
  const gun = e.rangedWeapon;
  if(!gun || !crewAlive()) return false;
  const dx = G.player.x - e.x, dy = G.player.y - e.y;
  const dist = Math.max(Math.abs(dx), Math.abs(dy));
  if(dist < 1 || dist > gun.maxRange) return false;
  if(!hasPlanetLOS(pdata, e.x, e.y, G.player.x, G.player.y)) return false;

  const targets = G.crew.filter(c=>c.hp>0);
  const crew = targets.length ? targets[rnd(targets.length)] : null;
  if(!crew) return false;

  addPlanetBulletTracer(e.x, e.y, G.player.x, G.player.y, '#ffee88');

  const baseAcc = Math.max(0.08, (gun.accuracy ?? 0.65) - Math.max(0, dist-1) * (gun.falloff ?? 0.06));
  const hit = Math.random() < Math.min(0.95, baseAcc);
  if(!hit){
    addLog(e.name+' fires '+(gun.name||'a weapon')+' at range '+dist+' — misses.','li');
    return true;
  }

  const minDmg = gun.minDmg ?? 1;
  const maxDmg = Math.max(minDmg, gun.maxDmg ?? minDmg);
  const rawDmg = minDmg + rnd(maxDmg - minDmg + 1);
  const dmg = Math.max(0, rawDmg - armorDefBonus(crew) - crewImplantDefBonus(crew));
  if(!DEBUG.infiniteCrewHp) crew.hp -= dmg; else crew.hp = crew.maxHp;
  if(dmg > 0){
    SFX.crewHit();
    addLog(e.name+' shoots '+crewDisplayName(crew)+' for '+dmg+'!','lc');
    maybeApplyCombatInjury(crew, dmg, 'ranged');
  } else {
    addLog(e.name+' shoots '+crewDisplayName(crew)+', but the armor holds.','li');
  }
  if(crew.hp<=0) addLog(crewDisplayName(crew)+' is down!','lc');
  return true;
}

function moveEnemies(){
  const enemies=(G.enemies[G.curPlanet]||[]).filter(e=>e.alive);
  const pdata=G.planets[G.curPlanet];
  if(!pdata) return;
  const attackQueue = [];

  enemies.forEach(e=>{
    // Stun: skip this creature's turn
    if(e.stunTurns > 0){ e.stunTurns--; return; }
    const initialBehaviour = e.behaviour || 'HUNT';
    if(e.hidden){
      if(initialBehaviour === 'TERRITORIAL' || initialBehaviour === 'COWARD'){
        const nestX = e.nestX ?? e.x, nestY = e.nestY ?? e.y;
        const distFromNest = Math.abs(G.player.x-nestX)+Math.abs(G.player.y-nestY);
        if(distFromNest >= (e.calmRange||8)){
          e.hidden = false;
          e.x = nestX; e.y = nestY;
          if(distFromNest <= 12 && canSeePlanetTile(e.x, e.y)) addLog(e.name+' emerges from its nest.','li');
        } else {
          return; // hiding in nest until the crew backs away
        }
      } else {
        return;
      }
    }
    const moveBudget = consumePlanetCritterMoveBudget(e);
    if(moveBudget <= 0) return;
    let rangedActed = false;
    for(let moveStep=0; moveStep<moveBudget; moveStep++){
    if(e.hidden) break;
    const dx=G.player.x-e.x, dy=G.player.y-e.y;
    const dist=Math.abs(dx)+Math.abs(dy);

    // -- Determine hostility state ---------------------------------
    const behaviour = e.behaviour || 'HUNT';

    if(behaviour==='TERRITORIAL' || behaviour==='COWARD'){
      // Re-emerge from nest if hiding and player is far away
      if(e.hidden){
        const nestX = e.nestX ?? e.x, nestY = e.nestY ?? e.y;
        const distFromNest = Math.abs(G.player.x-nestX)+Math.abs(G.player.y-nestY);
        if(distFromNest >= (e.calmRange||8)){
          e.hidden = false;
          e.x = nestX; e.y = nestY;
        } else {
          continue; // still hiding
        }
      }
      // Check proximity triggers
      if(e.pacifiedByComm && !e.hostileByDefault){
        if(e.commBoundaryDist && dist <= e.commBoundaryDist){
          makeCommunicableAlienHostile(e, 'Defending its distance from the crew', false);
          addLog(e.name+' breaks contact and raises its weapon!','lw');
        } else {
          e.currentlyHostile = false;
        }
      } else if(!e.currentlyHostile && dist <= e.territoryRange){
        // If within comm range and hasn't refused contact, give a grace window warning instead of going immediately hostile
        if(e.canCommunicate && !e.commRefused && dist <= (e.commRange ?? 1)){
          if(!e._warnedApproach){
            e._warnedApproach = true;
            e.attitude = 'Threatening';
            e.intent = 'Watching — ready to fire if the crew closes in further';
            addLog(e.name+' raises its weapon and signals: keep distance. [T] Communicate now.','lw');
          }
          // Goes hostile only if player steps into melee range without talking
          if(dist <= 1){
            makeCommunicableAlienHostile(e, 'Crew closed in without communicating', false);
            addLog(e.name+' opens fire — too close!','lc');
          }
        } else {
          if(e.canCommunicate) makeCommunicableAlienHostile(e, 'Defending its distance from the crew', false);
          else e.currentlyHostile = true;
          if(behaviour==='TERRITORIAL') addLog(e.name+' turns aggressive!','lw');
          else addLog(e.name+' panics at your approach!','lw');
        }
      }
      // Calm down if far enough away
      if(e.currentlyHostile && dist>=(e.calmRange||8)){
        e.currentlyHostile = false;
        e._warnedApproach = false;
        if(e.canCommunicate && !e.commRefused){
          e.attitude = e.pacifiedByComm ? (e.attitude || 'Wary') : 'Wary';
          e.intent = 'Keeping distance while monitoring the crew';
        }
        if(behaviour==='TERRITORIAL') addLog(e.name+' backs off.','li');
      }
      // Also reset warning if player backs out of territory range while in grace window
      if(!e.currentlyHostile && e._warnedApproach && dist > e.territoryRange){
        e._warnedApproach = false;
        e.attitude = 'Wary';
        e.intent = 'Keeping distance while monitoring the crew';
      }
    }

    const isHostile = e.currentlyHostile || e.hostileByDefault;

    // -- Build move candidate list ---------------------------------
    const steps=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]];

    const IMPASSABLE_FOR_CREATURES = new Set(['EARTH_WATER','LAVA','LAVA_FLOOR','LAVA_CRUST','AMMONIA']);
    function canStep(nx,ny){
      if(nx<0||nx>=PW(pdata)||ny<0||ny>=PH(pdata)) return false;
      const tileType = pdata.grid[ny]?.[nx]?.type;
      if(tileType==='rw_void'||tileType==='ancient_st_void') return false;
      if(!TILE[tileType]?.pass) return false;
      if(IMPASSABLE_FOR_CREATURES.has(tileType)) return false;
      if(enemies.find(o=>o!==e&&o.alive&&!o.hidden&&o.x===nx&&o.y===ny)) return false;
      return true;
    }

    if(e.backingOff && !isHostile){
      const targetDist = e.backOffUntilDist || 7;
      if(dist >= targetDist){
        e.backingOff = false;
        e.intent = 'Keeping distance while monitoring the crew';
      } else {
        const awaySteps = steps
          .filter(([sx,sy])=>canStep(e.x+sx,e.y+sy))
          .map(([sx,sy])=>({
            sx, sy,
            d:Math.abs(G.player.x-(e.x+sx))+Math.abs(G.player.y-(e.y+sy))
          }))
          .sort((a,b)=>b.d-a.d);
        if(awaySteps.length){
          e.x += awaySteps[0].sx;
          e.y += awaySteps[0].sy;
        }
        continue;
      }
    }

    if(behaviour==='CIV_LOCAL' && isHostile){
      const civState = ensureCivilizationState(pdata);
      if(civState?.hostileResponse === 'flee' && !e.civCombatant){
        e.intent = 'Fleeing in terror';
        const awaySteps = steps
          .filter(([sx,sy])=>canStep(e.x+sx,e.y+sy))
          .filter(([sx,sy])=>!(e.x+sx === G.player.x && e.y+sy === G.player.y))
          .map(([sx,sy])=>({
            sx, sy,
            d:Math.abs(G.player.x-(e.x+sx))+Math.abs(G.player.y-(e.y+sy))
          }))
          .sort((a,b)=>b.d-a.d);
        if(awaySteps.length && awaySteps[0].d > dist){
          e.x += awaySteps[0].sx;
          e.y += awaySteps[0].sy;
        } else if(dist <= 1){
          attackQueue.push(e);
        }
        continue;
      }
    }

    if(isHostile && !rangedActed && tryEnemyRangedAttack(e, pdata)){
      rangedActed = true;
      continue;
    }

    if(behaviour==='CIV_LOCAL' && !isHostile){
      const civState = ensureCivilizationState(pdata);
      const civ = pdata?.civilization;
      if(civ && civState && !civState.contacted && !civState.hostile && e.intent === 'Attempting to intercept the away team')
        e.intent = 'Watching the away team from a cautious distance';
      if(Math.random() < 0.35) continue;
      const buildings = civilizationBuildingPositions(pdata);
      if(!buildings.length) continue;
      if(!e.civDest || Math.max(Math.abs(e.x-e.civDest.x), Math.abs(e.y-e.civDest.y)) <= 1){
        const choices = buildings.filter(b=>Math.max(Math.abs(e.x-b.x), Math.abs(e.y-b.y)) > 2);
        e.civDest = (choices.length ? choices : buildings)[rnd((choices.length ? choices : buildings).length)];
        e.intent = 'Moving between settlement structures';
      }
      const dest = e.civDest;
      const pathSteps = steps
        .filter(([sx,sy])=>canStep(e.x+sx,e.y+sy))
        .filter(([sx,sy])=>!(e.x+sx === G.player.x && e.y+sy === G.player.y))
        .map(([sx,sy])=>({
          sx, sy,
          d:Math.max(Math.abs(dest.x-(e.x+sx)), Math.abs(dest.y-(e.y+sy)))
        }))
        .sort((a,b)=>a.d-b.d);
      if(pathSteps.length && pathSteps[0].d <= Math.max(Math.abs(dest.x-e.x), Math.abs(dest.y-e.y))){
        e.x += pathSteps[0].sx;
        e.y += pathSteps[0].sy;
      }
      continue;
    }

    // -- DOCILE — wander randomly, ignore player -------------------
    if(behaviour==='DOCILE'){
      if(Math.random()<0.4){ // only move some turns
        const wanderSteps = steps.filter(([sx,sy])=>canStep(e.x+sx,e.y+sy));
        if(wanderSteps.length){
          const [sx,sy]=wanderSteps[Math.floor(Math.random()*wanderSteps.length)];
          e.x+=sx; e.y+=sy;
        }
      }
      continue;
    }

    // -- COWARD — flee toward own nest, hide when reached ----------
    if(behaviour==='COWARD' && isHostile){
      const nestX = e.nestX ?? e.x, nestY = e.nestY ?? e.y;
      const distToNest = Math.abs(e.x-nestX)+Math.abs(e.y-nestY);

      // Already at nest — hide
      if(distToNest === 0){
        e.hidden = true;
        e.currentlyHostile = false;
        addLog(e.name+' retreats into its nest!','li');
        continue;
      }

      // Flee toward nest
      const fleeSteps = steps
        .filter(([sx,sy])=>canStep(e.x+sx,e.y+sy))
        .map(([sx,sy])=>({sx,sy,d:Math.abs((e.x+sx)-nestX)+Math.abs((e.y+sy)-nestY)}))
        .sort((a,b)=>a.d-b.d);

      if(fleeSteps.length===0){
        // Completely blocked — last stand
        if(Math.max(Math.abs(dx),Math.abs(dy))<=1) attackQueue.push(e);
      } else if(fleeSteps[0].d >= distToNest && Math.max(Math.abs(dx),Math.abs(dy))<=1){
        // Can move but no step gets closer to nest — cornered, fight back
        attackQueue.push(e);
      } else {
        e.x+=fleeSteps[0].sx; e.y+=fleeSteps[0].sy;
      }
      continue;
    }

    // -- STALK — only charge within 2 tiles, otherwise shadow -----
    if(behaviour==='STALK'){
      if(dist>10) continue;
      if(dist<=2){
        // Charge
        let bestNx=null,bestNy=null,bestDist=Infinity;
        for(const [sx,sy] of steps){
          const nx=e.x+sx,ny=e.y+sy;
          if(!canStep(nx,ny)) continue;
          const d=Math.max(Math.abs(G.player.x-nx),Math.abs(G.player.y-ny));
          if(d<bestDist){bestDist=d;bestNx=nx;bestNy=ny;}
        }
        if(bestNx===null) continue;
        if(bestNx===G.player.x&&bestNy===G.player.y) attackQueue.push(e);
        else {e.x=bestNx;e.y=bestNy;}
      } else {
        // Shadow — try to maintain exactly 3 tiles away
        const targetDist = 3;
        const shadowSteps = steps
          .filter(([sx,sy])=>canStep(e.x+sx,e.y+sy))
          .map(([sx,sy])=>{
            const nd=Math.abs(G.player.x-(e.x+sx))+Math.abs(G.player.y-(e.y+sy));
            return {sx,sy,score:Math.abs(nd-targetDist)};
          })
          .sort((a,b)=>a.score-b.score);
        if(shadowSteps.length){const {sx,sy}=shadowSteps[0];e.x+=sx;e.y+=sy;}
      }
      continue;
    }

    // -- HUNT / TERRITORIAL (hostile) — pursue player --------------
    if(!isHostile || dist>12) continue;

    let bestNx=null,bestNy=null,bestDist=Infinity;
    for(const [sx,sy] of steps){
      const nx=e.x+sx,ny=e.y+sy;
      if(!canStep(nx,ny)) continue;
      const d=Math.max(Math.abs(G.player.x-nx),Math.abs(G.player.y-ny));
      if(d<bestDist){bestDist=d;bestNx=nx;bestNy=ny;}
    }
    if(bestNx===null) continue;
    if(bestNx===G.player.x&&bestNy===G.player.y) attackQueue.push(e);
    else {e.x=bestNx;e.y=bestNy;}
    }
  });

  // -- Process attacks -------------------------------------------
  const attackedThisTurn = new Set();
  attackQueue.forEach(e=>{
    if(attackedThisTurn.has(e)) return;
    attackedThisTurn.add(e);
    if(!crewAlive()) return;
    const targets = G.crew.filter(c=>c.hp>0);
    const crew = targets.length ? targets[rnd(targets.length)] : null;
    if(!crew) return;
    const dmg=Math.max(0,e.atk+rnd(3)-armorDefBonus(crew)-crewImplantDefBonus(crew));
    if(!DEBUG.infiniteCrewHp) crew.hp-=dmg; else crew.hp=crew.maxHp;
    if(dmg>0){ SFX.crewHit(); addLog(e.name+' strikes '+crewDisplayName(crew)+' for '+dmg+'!','lc'); }
    maybeApplyCombatInjury(crew, dmg, 'melee');
    maybeExposeAnimalAttackInfection(e, crew, dmg);
    if(crew.hp<=0) addLog(crewDisplayName(crew)+' is down!','lc');
    debugCombatLog('ENEMY_ATTACK', {
      attacker: e.name, behaviour: e.behaviour || 'HUNT',
      speedRating: e.speedRating ?? '?', moveBudgetUsed: e._lastMoveBudget ?? '?',
      target: crewDisplayName(crew), dmg, crewHp: crew.hp,
    });
  });
}

// -----------------------------------------------------------------
//  PIRATE PATROL
// -----------------------------------------------------------------
// -----------------------------------------------------------------
//  NEBULA GAS ENTITY MOVEMENT
// -----------------------------------------------------------------
// -----------------------------------------------------------------
//  NEBULA LOOT COLLECTION
//  Called when ship moves onto a tile, or player presses E on it.
// -----------------------------------------------------------------
