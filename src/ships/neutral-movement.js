// ─────────────────────────────────────────────────────────────────
function moveNeutralShips(){
  // Base positions for cargo/trader shuttle routes
  const bases = G.galaxy ? (() => {
    const found = [];
    for(let y=0;y<MAP_H;y++) for(let x=0;x<MAP_W;x++)
      if(G.galaxy[y][x].type==='BASE') found.push({x,y});
    return found;
  })() : [];

  // ── Respawn destroyed patrol ships ──────────────────────────────
  const PATROL_RESPAWN_TURNS = 60;
  (G.neutralShips||[]).forEach(ns=>{
    if(ns.type !== 'patrol') return;
    if(ns.alive !== false) return;                          // still alive, skip
    if(!ns.lastRespawn) ns.lastRespawn = 0;
    if(G.turn - ns.lastRespawn < PATROL_RESPAWN_TURNS) return;
    // Respawn: reset stats at the first waypoint of its route
    const route = ns.patrolRoute;
    const spawnPt = (route && route.length > 0) ? route[0] : { x: ns.homeX||40, y: ns.homeY||25 };
    ns.x = spawnPt.x;
    ns.y = spawnPt.y;
    ns.patrolIdx = 0;
    ns.alive = true;
    ns.hostile = (G.stationReputation||0) <= -40; // inherit current rep state
    ns.hp = ns.maxHp;                             // maxHp was set by ensureNeutralCombatStats
    ns._wasHostileAtEngagement = false;
    ns.lastRespawn = G.turn;
    const spawnDist = Math.abs(spawnPt.x - G.ship.x) + Math.abs(spawnPt.y - G.ship.y);
    if(spawnDist <= radioRange()) addLog('Station Patrol has been replaced — new craft launched from base.','li');
  });

  (G.neutralShips||[]).forEach(ns=>{
    if(ns.alive===false) return;
    // Rescuing — always beeline to stranded player, overrides normal behaviour
    if(ns.rescuing){
      stepToward(ns, G.ship.x, G.ship.y);
      return;
    }

    if(ns.type==='patrol'){
      if((G.stationReputation||0) <= -40) ns.hostile = true;
      if(ns.hostile){
        const chaseDist = Math.abs(ns.x - G.ship.x) + Math.abs(ns.y - G.ship.y);
        const PATROL_GIVE_UP = 12;
        if(chaseDist > PATROL_GIVE_UP){
          const route = ns.patrolRoute;
          if(route && route.length > 0){
            const wp = route[ns.patrolIdx % route.length];
            stepToward(ns, wp.x, wp.y);
          }
          return;
        }
        stepToward(ns, G.ship.x, G.ship.y);
        if(ns.x===G.ship.x && ns.y===G.ship.y && G.mode==='galaxy') startShipCombat(ensureNeutralCombatStats(ns));
        return;
      }
      // Walk the pre-built circuit waypoint by waypoint
      const route = ns.patrolRoute;
      if(!route || route.length===0) return;
      const wp = route[ns.patrolIdx];
      const dist = Math.abs(ns.x-wp.x)+Math.abs(ns.y-wp.y);
      if(dist <= 1){
        // Reached this waypoint — advance to next
        ns.patrolIdx = (ns.patrolIdx + 1) % route.length;
      }
      stepToward(ns, wp.x, wp.y);

    } else if(ns.type==='cargo' || ns.type==='trader'){
      // Shuttle between the two bases
      if(bases.length < 2){ return; }
      const target = bases[ns.destBase % bases.length];
      const dist = Math.abs(ns.x-target.x)+Math.abs(ns.y-target.y);
      if(dist <= 2){
        // Arrived — flip destination
        ns.destBase = ns.destBase===0 ? 1 : 0;
      }
      stepToward(ns, target.x, target.y);

    } else if(ns.type==='science'){
      // Wander to a random destination, pick new one on arrival
      const dist = Math.abs(ns.x-ns.destX)+Math.abs(ns.y-ns.destY);
      if(dist <= 2){
        ns.destX = 5+rnd(MAP_W-10);
        ns.destY = 2+rnd(MAP_H-6);
      }
      // Science ships move every other turn — slower, more meandering
      if(G.turn % 2 === 0){
        stepToward(ns, ns.destX, ns.destY);
      }
    }
  });
}

function stepToward(ns, tx, ty){
  const dx = tx - ns.x, dy = ty - ns.y;
  if(dx===0 && dy===0) return;
  // Move `speed` steps per call
  for(let s=0; s<ns.speed; s++){
    const cx2 = tx - ns.x, cy2 = ty - ns.y;
    if(cx2===0 && cy2===0) break;
    let mx=0, my=0;
    if(Math.abs(cx2)>=Math.abs(cy2)) mx=cx2>0?1:-1;
    else my=cy2>0?1:-1;
    ns.x = Math.max(0, Math.min(MAP_W-1, ns.x+mx));
    ns.y = Math.max(0, Math.min(MAP_H-1, ns.y+my));
  }
}

