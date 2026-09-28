function hasPlanetLOS(pdata, fromX, fromY, toX, toY){
  if(!pdata) return false;
  if(toX===fromX && toY===fromY) return true;
  const W = PW(pdata);
  const smokePositions = new Set();
  if(pdata.smokeClouds) pdata.smokeClouds.forEach(c => smokePositions.add(c.y*W+c.x));
  if(pdata.mistClouds)  pdata.mistClouds.forEach(c  => smokePositions.add(c.y*W+c.x));

  let x0=fromX, y0=fromY, x1=toX, y1=toY;
  const dx=Math.abs(x1-x0), dy=Math.abs(y1-y0);
  const sx=x0<x1?1:-1, sy=y0<y1?1:-1;
  let err=dx-dy;
  const maxSteps=(dx+dy+2)*2;
  let steps=0;
  while(steps++<maxSteps){
    if(x0===x1 && y0===y1) return true;
    const e2=2*err;
    if(e2>-dy || dx===0){ err-=dy; x0+=sx; }
    if(e2< dx || dy===0){ err+=dx; y0+=sy; }
    if(x0===x1 && y0===y1) return true;
    if(TILE[pdata.grid[y0]?.[x0]?.type]?.pass===false) return false;
    if((x0!==fromX||y0!==fromY) && pdata.grid[y0]?.[x0]?.type==='EARTH_FOREST') return false;
    if((x0!==fromX||y0!==fromY) && pdata.grid[y0]?.[x0]?.type==='NEST' && !pdata.grid[y0]?.[x0]?.revealed) return false;
    if((x0!==fromX||y0!==fromY) && smokePositions.has(y0*W+x0)) return false;
  }
  return true;
}

function canSeePlanetTile(tx, ty){
  if(!G || G.mode!=='planet' || !G.player) return false;
  const pdata = G.planets?.[G.curPlanet];
  if(!pdata) return false;
  const W = PW(pdata), H = PH(pdata);
  if(tx<0 || tx>=W || ty<0 || ty>=H) return false;
  if(!pdata.visited || !pdata.visited[ty*W+tx]) return false;
  const px = G.player.x, py = G.player.y;
  const dist = Math.sqrt((tx-px)*(tx-px)+(ty-py)*(ty-py));
  const vr = planetVisionRadius(G.curPlanet);
  if(dist > vr) return false;
  return dist < 1.5 || hasPlanetLOS(pdata, px, py, tx, ty);
}

function dropPlanetLoot(x, y, items){
  const pdata = G.planets?.[G.curPlanet];
  if(!pdata || !items || !items.length) return false;
  const cell = pdata.grid?.[y]?.[x];
  if(!cell) return false;
  if(!cell.drops) cell.drops = [];
  items.forEach(item=>cell.drops.push({...item}));
  if(items.length === 1) addLog('Dropped: '+items[0].name+'.','ll');
  else addLog('Dropped '+items.length+' items.','ll');
  return true;
}

function collectPlanetDrops(cell){
  if(!cell?.drops?.length) return false;
  const drops = cell.drops.splice(0);
  drops.forEach(item=>G.inventory.push(item));
  const names = drops.map(item=>item.name).join(', ');
  addLog('Picked up: '+names+'.','ll');
  return true;
}

function drawPlanetDrops(cell, sx, sy, bg){
  if(!cell?.drops?.length) return;
  const col = cell.drops[0].col || '#ffcc66';
  if(OPTIONS.asciiMode){
    ctx.font='bold '+(TS-2)+'px Courier New';
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillStyle=col;
    ctx.fillText('*', sx+TS/2, sy+TS/2+1);
    ctx.textBaseline='alphabetic';
    ctx.textAlign='left';
    return;
  }
  ctx.fillStyle='rgba(0,0,0,0.45)';
  ctx.fillRect(sx+7, sy+13, 10, 5);
  ctx.fillStyle=col;
  ctx.fillRect(sx+8, sy+9, 8, 7);
  ctx.fillStyle='#ffe8aa';
  ctx.fillRect(sx+10, sy+7, 4, 3);
  if(cell.drops.length > 1){
    ctx.fillStyle='#ffffff';
    ctx.fillRect(sx+15, sy+7, 3, 3);
  }
}

function rollAlienLoot(enemy){
  const isCreature = !!enemy.diet;
  return isCreature ? (
    enemy.diet==='herbivore' ? pick([
      {name:enemy.name+' Hide',   col:'#f09090',desc:'Worth 30 cr',value:30},
      {name:enemy.name+' Tissue', col:'#ee8888',desc:'Worth 20 cr',value:20},
    ]) :
    enemy.diet==='carnivore' ? pick([
      {name:enemy.name+' Fang',   col:'#ff8844',desc:'Worth 60 cr',value:60},
      {name:enemy.name+' Core',   col:'#ff6633',desc:'Worth 50 cr',value:50},
    ]) :
    pick([
      {name:enemy.name+' Sample', col:'#ffaa55',desc:'Worth 40 cr',value:40},
      {name:enemy.name+' Organ',  col:'#ee9944',desc:'Worth 35 cr',value:35},
    ])
  ) : pick([
    {name:'Alien Hide',col:'#f09090',desc:'Worth 30 cr',value:30},
    {name:'Alien Core',col:'#ff8888',desc:'Worth 50 cr',value:50},
  ]);
}

function dropAlienDeathLoot(enemy){
  const drops = [];
  const activeScienceJob = ensureScienceJobState().active;
  if(activeScienceJob?.type === 'alien_corpses'){
    drops.push({name:'Alien Corpse',col:'#bb6655',desc:'Science Office specimen',value:0});
  }
  if(enemy.bodyLabel === 'ancient plant'){
    drops.push({name:'Phonetic Bark Sample',col:'#7cd89f',desc:'Resonant bark from a talking-tree world. Valuable to xenolinguists.',value:85});
  } else if(Math.random()>0.4){
    drops.push(rollAlienLoot(enemy));
  }
  dropPlanetLoot(enemy.x, enemy.y, drops);
}

function buildTileLine(fromX, fromY, toX, toY, maxSteps){
  const path = [];
  const dx = toX - fromX, dy = toY - fromY;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  if(steps <= 0) return path;
  const limit = maxSteps ? Math.min(steps, maxSteps) : steps;
  for(let i=1; i<=limit; i++){
    path.push({
      x: Math.round(fromX + (dx/steps)*i),
      y: Math.round(fromY + (dy/steps)*i),
    });
  }
  return path;
}

function addPlanetBulletTracer(fromX, fromY, toX, toY, col){
  const pdata = G.planets?.[G.curPlanet];
  if(!pdata) return;
  if(!pdata.bulletTracers) pdata.bulletTracers = [];
  if(!pdata.muzzleFlashes) pdata.muzzleFlashes = [];
  pdata.muzzleFlashes.push({ x:fromX, y:fromY, born:Date.now(), col:col || '#ffdd66' });
  pdata.bulletTracers.push({
    path: buildTileLine(fromX, fromY, toX, toY),
    col: col || '#ffdd66',
    born: Date.now(),
  });
}

