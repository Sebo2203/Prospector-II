function shipCombatRectContains(rect,point){
  return point.x>=rect.x && point.x<rect.x+rect.width && point.y>=rect.y && point.y<rect.y+rect.height;
}

function shipCombatGas(combat,point){
  return combat.environment?.type==='nebula' && combat.environment.pockets.some(pocket=>shipCombatRectContains(pocket,point));
}

function shipCombatGasPenalty(combat,from,to){
  return shipCombatGas(combat,from) || buildTileLine(from.x,from.y,to.x,to.y).some(point=>shipCombatGas(combat,point)) ? 0.15 : 0;
}

function initializeShipCombatEnvironment(combat){
  const target=combat.enemies[0]?.ship;
  const playerCell=G.galaxy?.[G.ship.y]?.[G.ship.x],targetCell=G.galaxy?.[target?.y]?.[target?.x];
  const cell=playerCell?.type==='NEBULA'?playerCell:targetCell?.type==='NEBULA'?targetCell:null;
  combat.environment={type:'space'};
  if(!cell)return;
  let seed=((G.seed||1)^Math.imul(G.ship.x+1,3266489917)^Math.imul(G.ship.y+1,668265263))>>>0;
  const next=()=>seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  const environment=combat.environment={type:'nebula',variant:cell.nebulaVariant==='blue'?'blue':'pink',
    layout:next()%2?'gas':'mixed',pockets:[],lastTurn:G.turn,nextChargeAt:G.turn+2,charge:null,lastStrike:null};
  for(let attempt=0;attempt<64 && environment.pockets.length<7;attempt++){
    const roll=next(),width=roll%3===0?3:2,height=width===2 && roll%3===1?3:2;
    const pocket={x:2+(next()>>>8)%22,y:1+(next()>>>8)%13,width,height};
    const tiles=[];for(let y=pocket.y;y<pocket.y+height;y++)for(let x=pocket.x;x<pocket.x+width;x++)tiles.push({x,y});
    if(tiles.some(point=>point.x>=COMBAT_MAP.width || point.y>=COMBAT_MAP.height ||
      shipCombatDistance(point,combat.player)<=1 || combat.enemies.some(enemy=>shipCombatDistance(point,enemy)<=1) ||
      shipCombatGas(combat,point)))continue;
    environment.pockets.push(pocket);
  }
}

function advanceShipCombatEnvironment(combat){
  const environment=combat.environment;
  if(environment?.type!=='nebula' || environment.lastTurn>=G.turn)return;
  environment.lastTurn=G.turn;environment.lastStrike=null;
  if(environment.charge && environment.charge.dueTurn<=G.turn){
    const index=environment.charge.pocket,pocket=environment.pockets[index];
    environment.charge=null;environment.lastStrike={pocket:index,turn:G.turn};environment.nextChargeAt=G.turn+4;
    SFX.lightning();
    addCombatLog('NEBULA LIGHTNING strikes charged gas at '+pocket.x+','+pocket.y+'!','lw');
    const impact=ship=>Math.max(1,Math.round((4+rnd(7))*(ship===G.ship?hullSize():(SHIP_CLASSES[shipSystemStats(ship).classId]?.size||1))));
    if(shipCombatRectContains(pocket,combat.player)){
      const damage=impact(G.ship),hull=damageShipCombatPlayer(combat,damage,false,'nebula lightning');
      addCombatLog('Nebula lightning hits your ship for '+damage+' ('+hull+' hull).','lc');
      if(G.ship.hp===0)G.deathCause='The ship was destroyed by a nebula lightning strike.';
      if(G.dead)return;
    }
    for(const enemy of livingShipCombatEnemies(combat)){
      if(!shipCombatRectContains(pocket,enemy))continue;
      const damage=impact(enemy.ship),hull=damageShipCombatEnemy(combat,enemy,damage);
      addCombatLog('Nebula lightning hits '+enemy.ship.name+' for '+damage+' ('+hull+' hull).','lc');
    }
  }
  if(!environment.charge && environment.pockets.length && G.turn>=environment.nextChargeAt && Math.random()<0.1){
    const pocket=rnd(environment.pockets.length);
    environment.charge={pocket,dueTurn:G.turn+1};
  }
}
