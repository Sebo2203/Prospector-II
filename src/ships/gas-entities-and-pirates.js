function collectNebulaLootAt(x, y){
  if(!G.nebulaLoot || !G.nebulaLoot.length) return false;
  const idx = G.nebulaLoot.findIndex(l=>l.x===x && l.y===y);
  if(idx === -1) return false;
  const loot = G.nebulaLoot[idx];
  const stored = addCargo(loot.item);
  if(stored){
    G.nebulaLoot.splice(idx, 1);
    addLog('Nebula Crystal recovered and loaded into cargo hold.','lg');
    renderAll();
    return true;
  } else {
    addLog('Nebula Crystal detected here, cargo hold still full. Offload cargo first.','lw');
    renderAll();
    return false;
  }
}

function moveGasEntities(){
  if(!G.gasEntities || G.mode !== 'galaxy') return;
  if((G.turn || 0) < 300) return;  // Entities dormant until turn 300

  const playerCell = G.galaxy?.[G.ship.y]?.[G.ship.x];
  const playerInNebula = playerCell?.type === 'NEBULA';

  function inBounds(x,y){ return x>=0&&x<MAP_W&&y>=0&&y<MAP_H; }
  function isNebula(x,y){ return inBounds(x,y) && G.galaxy[y][x].type==='NEBULA'; }
  // Diagonal-aware step: returns {mx,my} each -1/0/+1
  function stepToward(fx,fy,tx,ty){
    return { mx: tx>fx?1:tx<fx?-1:0, my: ty>fy?1:ty<fy?-1:0 };
  }
  // Try a diagonal move, fall back to each cardinal axis if blocked by non-nebula
  function tryMoveNebula(ge, mx, my){
    if(mx===0&&my===0) return;
    if(isNebula(ge.x+mx, ge.y+my)){ ge.x+=mx; ge.y+=my; return; }
    // Diagonal blocked: try each axis independently
    if(mx!==0&&my!==0){
      if(isNebula(ge.x+mx, ge.y)){ ge.x+=mx; return; }
      if(isNebula(ge.x, ge.y+my)){ ge.y+=my; return; }
    }
    // All nebula-safe options blocked — stay put
  }

  G.gasEntities.forEach(ge=>{
    if(!ge.alive) return;

    const dist = Math.abs(ge.x - G.ship.x) + Math.abs(ge.y - G.ship.y);
    const geInNebula = isNebula(ge.x, ge.y);

    // ── Off-nebula: drift back to nearest cluster tile (diagonal OK, any terrain) ─
    if(!geInNebula){
      if(ge._homeCluster && ge._homeCluster.length){
        const nearest = ge._homeCluster.reduce((best,t)=>{
          const d=Math.abs(t.x-ge.x)+Math.abs(t.y-ge.y);
          return d<best.d?{d,t}:best;
        },{d:Infinity,t:null});
        if(nearest.t){
          const {mx,my} = stepToward(ge.x,ge.y,nearest.t.x,nearest.t.y);
          if(inBounds(ge.x+mx, ge.y+my)){ ge.x+=mx; ge.y+=my; }
        }
      }
      return;
    }

    // ── Chase: player in nebula and within 6 tiles ─────────────────────────────
    if(playerInNebula && dist <= 6){
      ge._chaseTurns = (ge._chaseTurns||0) + 1;
      const {mx,my} = stepToward(ge.x,ge.y,G.ship.x,G.ship.y);
      tryMoveNebula(ge, mx, my);
      const newDist = Math.abs(ge.x-G.ship.x)+Math.abs(ge.y-G.ship.y);
      if(newDist <= 2 && newDist > 0 && ge._chaseTurns <= 2){
        addLog('WARNING: Something vast stirs in the nebula. '+(ge.isMassive?'A colossal living gas cloud':'A nebula wraith')+' is converging on your position!','lc');
      }

    // ── Wander: idle drift within home cluster ─────────────────────────────
    } else {
      ge._chaseTurns = 0;
      if(ge._homeCluster && ge._homeCluster.length && Math.random()<0.5){
        const tgt = ge._homeCluster[Math.floor(Math.random()*ge._homeCluster.length)];
        const {mx,my} = stepToward(ge.x,ge.y,tgt.x,tgt.y);
        tryMoveNebula(ge, mx, my);
      }
    }
  });

  // Check if any gas entity has reached the player tile → initiate combat
  if(playerInNebula){
    const arrived = G.gasEntities.find(ge=>ge.alive && ge.x===G.ship.x && ge.y===G.ship.y);
    if(arrived && G.mode==='galaxy'){
      addLog(arrived.name+' ENGULFS your ship, attempting to devour the hull!','lc');
      startShipCombat(arrived);
    }
  }
}

function movePirates(){
  // -- Deferred initial spawn — guards and roamers fill in from turn 50 --
  if(G.turn >= 50){
    const PIRATE_CLASSES_SPAWN=[
      { name:'Corvette',     hp:30,  maxHp:30,  atk:4,  engineRating:3, shields:0, maxShields:0, guns:1 },
      { name:'Frigate',      hp:50,  maxHp:50,  atk:6,  engineRating:3, shields:0, maxShields:0, guns:1 },
      { name:'Gunship',      hp:70,  maxHp:70,  atk:8,  engineRating:2, shields:1, maxShields:1, guns:2 },
      { name:'Heavy Cruiser',hp:100, maxHp:100, atk:11, engineRating:2, shields:1, maxShields:2, guns:2 },
      { name:'Dreadnought',  hp:160, maxHp:160, atk:16, engineRating:1, shields:3, maxShields:3, guns:3 },
      { name:'Flagship',     hp:260, maxHp:260, atk:21, engineRating:1, shields:5, maxShields:5, guns:4 },
    ];
    // Spawn guards slowly, filling each base up to its own quota.
    const activeBasesForGuards = (G.pirateBases||[]).filter(b=>!b.destroyed);
    const guardTarget = G._pirateGuardTarget || 0;
    const perBaseGuardTarget = G._pirateGuardPerBaseTarget || Math.max(1, Math.ceil(guardTarget / Math.max(1, activeBasesForGuards.length)));
    const liveGuards = G.pirates.filter(p=>p.alive && p.pirateType==='guard').length;
    const basesNeedingGuards = activeBasesForGuards.filter(base =>
      G.pirates.filter(p=>p.alive && p.pirateType==='guard' && p.homeX===base.x && p.homeY===base.y).length < perBaseGuardTarget
    );
    if(liveGuards < guardTarget && basesNeedingGuards.length > 0){
      if(!G._lastGuardSpawn) G._lastGuardSpawn = 50;
      if(G.turn - G._lastGuardSpawn >= 10){
        const base = basesNeedingGuards[rnd(basesNeedingGuards.length)];
        let px, py, t=0;
        do{
          px = base.x + rnd(9)-4; py = base.y + rnd(9)-4;
          px = Math.max(1,Math.min(MAP_W-2,px)); py = Math.max(1,Math.min(MAP_H-2,py));
          t++;
        } while(t<100 && G.galaxy[py][px].type!=='VOID');
        if(t<100){
          const bx = G.bases?.[0]?.x ?? Math.floor(MAP_W/2);
          const by = G.bases?.[0]?.y ?? Math.floor(MAP_H/2);
          const dist = Math.floor((Math.abs(base.x-bx)+Math.abs(base.y-by)) / 12);
          const rawIdx = dist + rnd(2);
          const classIdx = rawIdx >= PIRATE_CLASSES_SPAWN.length-1
            ? (Math.random()<0.05 ? PIRATE_CLASSES_SPAWN.length-1 : PIRATE_CLASSES_SPAWN.length-2)
            : Math.min(PIRATE_CLASSES_SPAWN.length-2, rawIdx);
          const pc = PIRATE_CLASSES_SPAWN[classIdx];
          G.pirates.push({ x:px, y:py, homeX:base.x, homeY:base.y,
            hp:pc.hp, maxHp:pc.maxHp, atk:pc.atk, engineRating:pc.engineRating,
            shields:pc.shields, maxShields:pc.maxShields, guns:pc.guns||1,
            name:pc.name, alive:true, pirateType:'guard' });
          G._lastGuardSpawn = G.turn;
        }
      }
    }

    // Spawn roamers slowly — one every 15 turns until target reached
    const roamerTarget = G._pirateRoamerTarget || 0;
    const liveRoamers = G.pirates.filter(p=>p.pirateType==='roamer').length;
    if(liveRoamers < roamerTarget && (G.pirateBases||[]).some(b=>!b.destroyed)){
      if(!G._lastRoamerSpawn) G._lastRoamerSpawn = 50;
      if(G.turn - G._lastRoamerSpawn >= 15){
      const activeBases = G.pirateBases.filter(b=>!b.destroyed);
      const base = activeBases[rnd(activeBases.length)];
      let rx, ry, t=0;
      do{
        rx = base.x + rnd(9)-4; ry = base.y + rnd(9)-4;
        rx = Math.max(1,Math.min(MAP_W-2,rx)); ry = Math.max(1,Math.min(MAP_H-2,ry));
        t++;
      } while(t<100 && G.galaxy[ry][rx].type!=='VOID');
      if(t<100){
        const classIdx = Math.min(3, 1+rnd(3));
        const pc = PIRATE_CLASSES_SPAWN[classIdx];
        G.pirates.push({ x:rx, y:ry, homeX:rx, homeY:ry,
          hp:pc.hp, maxHp:pc.maxHp, atk:pc.atk, engineRating:pc.engineRating,
          shields:pc.shields, maxShields:pc.maxShields, guns:pc.guns||1,
          name:'Raider '+pc.name, alive:true, pirateType:'roamer', roamTarget:null });
        G._lastRoamerSpawn = G.turn;
      }
      }
    }
  }

  // -- Respawn dead guards slowly ----------------------------------
  (G.pirateBases||[]).forEach(base=>{
    if(base.destroyed) return;
    const RESPAWN_INTERVAL = 250; // turns between spawns
    if(!base.lastRespawn) base.lastRespawn = 0;
    if(G.turn - base.lastRespawn < RESPAWN_INTERVAL) return;
    // Only respawn if this base is under-defended (fewer than 2 live guards)
    const guards = G.pirates.filter(p=>p.alive && p.pirateType==='guard' && p.homeX===base.x && p.homeY===base.y);
    if(guards.length >= 2) return;
    // Spawn one new guard near the base
    let rx=base.x+rnd(5)-2, ry=base.y+rnd(5)-2;
    rx=Math.max(1,Math.min(MAP_W-2,rx)); ry=Math.max(1,Math.min(MAP_H-2,ry));
    const PIRATE_CLASSES=[
      { name:'Corvette',hp:30,maxHp:30,atk:4,engineRating:3,shields:0,maxShields:0,guns:1 },
      { name:'Frigate', hp:50,maxHp:50,atk:6,engineRating:3,shields:0,maxShields:0,guns:1 },
      { name:'Cruiser', hp:80,maxHp:80,atk:9,engineRating:2,shields:1,maxShields:1,guns:2 },
    ];
    const pc = PIRATE_CLASSES[rnd(2)];
    G.pirates.push({ x:rx, y:ry, homeX:base.x, homeY:base.y,
      hp:pc.hp, maxHp:pc.maxHp, atk:pc.atk, engineRating:pc.engineRating,
      shields:pc.shields, maxShields:pc.maxShields, guns:pc.guns||1,
      name:pc.name, alive:true, pirateType:'guard' });
    base.lastRespawn = G.turn;
  });

  const playerEngine = G.shipStats?.engineRating ?? 2;

  G.pirates.forEach(p=>{
    if(!p.alive) return;
    const distToPlayer = Math.abs(p.x-G.ship.x)+Math.abs(p.y-G.ship.y);
    let tx, ty;
    let isChasing = false;
    const satisfied = isPirateSatisfied(p);

    if(satisfied){
      p._chaseTurns = 0;
      p._gaveUp = 0;
      if(p.pirateType==='roamer'){
        if(!p.roamTarget || (Math.abs(p.x-p.roamTarget.x)+Math.abs(p.y-p.roamTarget.y))<2)
          p.roamTarget = { x:5+rnd(MAP_W-10), y:5+rnd(MAP_H-10) };
        tx=p.roamTarget.x; ty=p.roamTarget.y;
      } else {
        const distToHome = Math.abs(p.x-p.homeX)+Math.abs(p.y-p.homeY);
        if(distToHome>3){ tx=p.homeX; ty=p.homeY; }
        else { tx=p.homeX+rnd(5)-2; ty=p.homeY+rnd(5)-2;
               tx=Math.max(1,Math.min(MAP_W-2,tx)); ty=Math.max(1,Math.min(MAP_H-2,ty)); }
      }
    } else if(p.pirateType==='roamer'){
      // Sanctuary: stop chasing when player is within 6 tiles of any starbase
      const nearBase = G.galaxy && G.pirateBases !== undefined && (() => {
        for(let y=0;y<MAP_H;y++) for(let x=0;x<MAP_W;x++)
          if(G.galaxy[y][x].type==='BASE' &&
             Math.abs(x-G.ship.x)<=6 && Math.abs(y-G.ship.y)<=6) return true;
        return false;
      })();

      // Pursuit cap: roamers give up after 10 consecutive chase turns
      if(!DEBUG.shipInvisible && distToPlayer<=10 && !nearBase){
        p._chaseTurns = (p._chaseTurns||0) + 1;
        if(p._chaseTurns <= 10){
          tx=G.ship.x; ty=G.ship.y;
          isChasing = true;
        } else {
          // Gave up — wander away, reset counter after 5 turns
          p._gaveUp = (p._gaveUp||0) + 1;
          if(p._gaveUp >= 5){ p._chaseTurns=0; p._gaveUp=0; }
          if(!p.roamTarget || (Math.abs(p.x-p.roamTarget.x)+Math.abs(p.y-p.roamTarget.y))<2)
            p.roamTarget = { x:5+rnd(MAP_W-10), y:5+rnd(MAP_H-10) };
          tx=p.roamTarget.x; ty=p.roamTarget.y;
        }
      } else {
        // Not in range or near sanctuary — reset chase counter, wander
        if(!isChasing) p._chaseTurns=0;
        if(!p.roamTarget || (Math.abs(p.x-p.roamTarget.x)+Math.abs(p.y-p.roamTarget.y))<2)
          p.roamTarget = { x:5+rnd(MAP_W-10), y:5+rnd(MAP_H-10) };
        tx=p.roamTarget.x; ty=p.roamTarget.y;
      }
    } else {
      // Guard: patrol near home base, chase if player gets close
      const distToHome = Math.abs(p.x-p.homeX)+Math.abs(p.y-p.homeY);
      if(!DEBUG.shipInvisible && distToPlayer<=6 && distToHome<=10){
        tx=G.ship.x; ty=G.ship.y;
        isChasing = true;
      } else {
        if(distToHome>3){ tx=p.homeX; ty=p.homeY; }
        else { tx=p.homeX+rnd(5)-2; ty=p.homeY+rnd(5)-2;
               tx=Math.max(1,Math.min(MAP_W-2,tx)); ty=Math.max(1,Math.min(MAP_H-2,ty)); }
      }
    }

    // Engine-rated movement. While chasing, speed is relative to the player's
    // engine: equal engines trade one tile for one tile, faster pirates gain,
    // and slower pirates only move on some chase turns.
    const pirateEngine = p.engineRating || 2;
    let steps;
    if(isChasing){
      p._chaseMoveBank = (p._chaseMoveBank || 0) + (pirateEngine / Math.max(1, playerEngine));
      steps = Math.floor(p._chaseMoveBank);
      p._chaseMoveBank -= steps;
    } else {
      p._chaseMoveBank = 0;
      steps = Math.max(1, Math.min(pirateEngine, 2)); // relaxed max 2 steps when wandering
    }

    for(let s=0; s<steps; s++){
      const ctx2 = { tx, ty }; // need current target each step
      const ddx=ctx2.tx-p.x, ddy=ctx2.ty-p.y;
      if(ddx===0&&ddy===0) break;
      let mx=0,my=0;
      if(Math.abs(ddx)>=Math.abs(ddy)) mx=ddx>0?1:-1;
      else my=ddy>0?1:-1;
      const nx=p.x+mx, ny=p.y+my;
      if(nx<0||nx>=MAP_W||ny<0||ny>=MAP_H) break;
      if(G.pirates.some(o=>o!==p&&o.alive&&o.x===nx&&o.y===ny)) break;
      p.x=nx; p.y=ny;
      // Stop multi-stepping if we landed on the player — combat will trigger
      if(p.x===G.ship.x && p.y===G.ship.y) break;
    }
  });

}

// -----------------------------------------------------------------
//  SHIP WEAPON CATALOG
// -----------------------------------------------------------------
