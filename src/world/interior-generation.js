// ── CAVE MAP GENERATOR ───────────────────────────────────────────────
function generateCave(key, sourceBiome){
  const W = PLANET_W, H = PLANET_H;
  G.enemies[key]=[];

  const caveRoll = Math.random();
  const caveShape = caveRoll < 0.25 ? {
    size:'small', floorChance:0.38, smoothPasses:5, depthMin:4, depthVar:6,
    branches:2+rnd(3), branchLenMin:3, branchLenVar:6,
    mainChamberChance:0.08, branchChamberChance:0.06, endChamber:1,
    mineralsBase:3, mineralsVar:4, nestChance:0.25,
  } : caveRoll < 0.75 ? {
    size:'medium', floorChance:0.42, smoothPasses:4, depthMin:8, depthVar:8,
    branches:5+rnd(4), branchLenMin:5, branchLenVar:10,
    mainChamberChance:0.18, branchChamberChance:0.12, endChamber:2,
    mineralsBase:6, mineralsVar:6, nestChance:0.50,
  } : {
    size:'large', floorChance:0.45, smoothPasses:3, depthMin:12, depthVar:14,
    branches:8+rnd(7), branchLenMin:8, branchLenVar:16,
    mainChamberChance:0.28, branchChamberChance:0.18, endChamber:2,
    mineralsBase:9, mineralsVar:8, nestChance:0.70,
  };

  // Start a bit more open than before, then smooth into organic chambers.
  let cells = [];
  for(let y=0;y<H;y++){
    const row=[];
    for(let x=0;x<W;x++){
      if(x===0||x===W-1||y===0||y===H-1) row.push(1);
      else row.push(Math.random()<caveShape.floorChance?0:1);
    }
    cells.push(row);
  }

  // Fewer smoothing passes keeps caves larger and less blobby.
  for(let pass=0;pass<caveShape.smoothPasses;pass++){
    const next=cells.map(r=>[...r]);
    for(let y=1;y<H-1;y++){
      for(let x=1;x<W-1;x++){
        let walls=0;
        for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++) walls+=cells[y+dy][x+dx];
        next[y][x]=walls>=5?1:0;
      }
    }
    cells=next;
  }

  const grid=cells.map(row=>row.map(v=>({type:v?'cave_wall':'cave_floor'})));
  const protectedFloors = new Set();
  const protectKey = (x,y)=>y*W+x;
  function carveFloor(x,y,r=1,protect=true){
    for(let yy=y-r; yy<=y+r; yy++){
      for(let xx=x-r; xx<=x+r; xx++){
        if(xx<=0||xx>=W-1||yy<=0||yy>=H-1) continue;
        if(Math.abs(xx-x)+Math.abs(yy-y) > r+1) continue;
        grid[yy][xx]={type:'cave_floor'};
        cells[yy][xx]=0;
        if(protect) protectedFloors.add(protectKey(xx,yy));
      }
    }
  }

  const entryPos={x:Math.floor(W/2), y:Math.floor(H/2)};
  const angle=Math.random()*Math.PI*2;
  const depth=caveShape.depthMin+rnd(caveShape.depthVar);
  const deepPos={
    x:Math.max(2,Math.min(W-3,Math.round(entryPos.x+Math.cos(angle)*depth))),
    y:Math.max(2,Math.min(H-3,Math.round(entryPos.y+Math.sin(angle)*depth))),
  };
  if(deepPos.x===entryPos.x && deepPos.y===entryPos.y) deepPos.x=Math.min(W-3,entryPos.x+2);
  const entryStepX = Math.abs(deepPos.x-entryPos.x) >= Math.abs(deepPos.y-entryPos.y)
    ? (deepPos.x>entryPos.x ? 1 : -1) : 0;
  const entryStepY = entryStepX===0 ? (deepPos.y>entryPos.y ? 1 : -1) : 0;
  const spawnPos={x:entryPos.x+entryStepX, y:entryPos.y+entryStepY};

  // Guaranteed main passage from the cave mouth into a deeper chamber.
  let cx=entryPos.x, cy=entryPos.y;
  carveFloor(cx,cy,2);
  let guard=0;
  while((cx!==deepPos.x || cy!==deepPos.y) && guard++<W*H){
    const stepTowardX = cx<deepPos.x ? 1 : cx>deepPos.x ? -1 : 0;
    const stepTowardY = cy<deepPos.y ? 1 : cy>deepPos.y ? -1 : 0;
    if(Math.random()<0.58 && stepTowardX) cx += stepTowardX;
    else if(stepTowardY) cy += stepTowardY;
    else if(stepTowardX) cx += stepTowardX;
    if(Math.random()<0.28){
      if(Math.random()<0.5) cx += rnd(3)-1;
      else cy += rnd(3)-1;
    }
    cx=Math.max(2,Math.min(W-3,cx));
    cy=Math.max(2,Math.min(H-3,cy));
    carveFloor(cx,cy,Math.random()<caveShape.mainChamberChance?2:1);
  }
  carveFloor(deepPos.x,deepPos.y,caveShape.endChamber);

  // Side passages make caves feel more expansive while staying narrow.
  for(let b=0;b<caveShape.branches;b++){
    const starts=[...protectedFloors];
    const start=starts[rnd(starts.length)];
    let bx=start%W, by=Math.floor(start/W);
    let dx=rnd(3)-1, dy=rnd(3)-1;
    if(dx===0&&dy===0) dx=1;
    const len=caveShape.branchLenMin+rnd(caveShape.branchLenVar);
    for(let i=0;i<len;i++){
      if(Math.random()<0.35){ dx=rnd(3)-1; dy=rnd(3)-1; if(dx===0&&dy===0) dx=1; }
      bx=Math.max(2,Math.min(W-3,bx+dx));
      by=Math.max(2,Math.min(H-3,by+dy));
      carveFloor(bx,by,Math.random()<caveShape.branchChamberChance?2:1,false);
    }
  }

  // Scatter stalactites on non-critical floor tiles adjacent to walls.
  for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){
    if(grid[y][x].type==='cave_floor' && !protectedFloors.has(protectKey(x,y))){
      let adj=0;
      for(let dy=-1;dy<=1;dy++) for(let dx=-1;dx<=1;dx++)
        if(cells[y+dy]?.[x+dx]) adj++;
      if(adj>=3 && Math.random()<0.10) grid[y][x]={type:'cave_stalagtite'};
    }
  }

  const floors=[];
  for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){
    if(grid[y][x].type==='cave_floor' && !protectedFloors.has(protectKey(x,y))) floors.push({x,y});
  }

  function placeRnd(type,count,extra){
    for(let i=0;i<count&&floors.length;i++){
      const idx=rnd(floors.length);
      const {x,y}=floors.splice(idx,1)[0];
      const cell = Object.assign({type},extra||{});
      if(type==='MINERAL_SAMPLE') cell._sampleType = pickMineralSample((extra&&extra.biome)||'_default');
      grid[y][x]=cell;
    }
  }

  placeRnd('MINERAL', caveShape.mineralsBase+rnd(caveShape.mineralsVar), {revealed:false, oreType: pickOreForBiome(sourceBiome)});
  placeRnd('MINERAL_SAMPLE', 1+rnd(2), {biome:sourceBiome});
  if(Math.random()<0.25) placeRnd('ARTIFACT',1);

  if(Math.random()<caveShape.nestChance && floors.length>10){
    const nestIdx=rnd(floors.length);
    const nestPos=floors.splice(nestIdx,1)[0];
    grid[nestPos.y][nestPos.x]={type:'CAVE_NEST',revealed:false};
    if(!G.enemies[key]) G.enemies[key]=[];
    const numBugs=3+rnd(4);
    for(let b=0;b<numBugs&&floors.length;b++){
      const near=floors.filter(f=>Math.abs(f.x-nestPos.x)+Math.abs(f.y-nestPos.y)<=8);
      const pool=near.length?near:floors;
      const fidx=rnd(pool.length);
      const pos=pool[fidx];
      const idx=floors.indexOf(pos);
      if(idx>=0) floors.splice(idx,1);
      const isBoss = b===0 && Math.random()<0.3;
      G.enemies[key].push({
        x:pos.x,y:pos.y,hp:isBoss?40:12,maxHp:isBoss?40:12,
        atk:isBoss?8:4,def:0,
        name:isBoss?'Cave Spider Queen':'Cave Bug',
        type:'CREATURE',
        diet:'carnivore',
        behaviour:isBoss?'HUNT':'STALK',
        speedRating:isBoss?2:3,
        hostileByDefault:true,
        currentlyHostile:true,
        territoryRange:8, calmRange:12,
        bodyLabel:isBoss?'massive cave arachnid':'skittering cave arthropod',
        size:isBoss?2.2:0.7,
        colour:isBoss?'#d28a36':'#b06a2a',
        alive:true,
        sprite:isBoss?'cave_queen':'cave_bug',
        nestX:nestPos.x,nestY:nestPos.y,
        isBoss,hidden:false,
      });
    }
  } else {
    if(!G.enemies[key]) G.enemies[key]=[];
  }

  grid[entryPos.y][entryPos.x]={type:'cave_exit'};
  grid[spawnPos.y][spawnPos.x]={type:'cave_floor'};

  G.planets[key]={
    grid,
    spawnX:spawnPos.x, spawnY:spawnPos.y,
    biome:'CAVE', isCave:true, sourceBiome:sourceBiome||'EARTH_FLOOR',
    visited:  new Array(W*H).fill(false),
    explored: new Array(W*H).fill(false),
    planetTurn:0, surveySoldValue:0, spawnedAliens:(G.enemies[key]||[]).length,
    caveGenVersion:2, caveSize:caveShape.size,
  };
  if(!G.enemies[key]) G.enemies[key]=[];
}

function generateUnderwaterMap(key, surfaceKey){
  // The underwater map mirrors the surface grid exactly.
  // EARTH_WATER tiles become walkable seabed; all other tiles become impassable uw_wall.
  // Player coordinates are identical — dive at (x,y), appear at (x,y) underwater.
  const W = PLANET_W, H = PLANET_H;
  G.enemies[key] = [];

  const surfaceGrid = G.planets[surfaceKey]?.grid;
  if(!surfaceGrid){ return; }

  // Build overlay grid
  const grid = [];
  const floors = [];
  for(let y=0;y<H;y++){
    const row=[];
    for(let x=0;x<W;x++){
      const surfType = surfaceGrid[y][x]?.type;
      const isWater = surfType === 'EARTH_WATER';
      const cell = isWater ? {type:'uw_floor'} : {type:'uw_wall'};
      row.push(cell);
      if(isWater) floors.push({x,y});
    }
    grid.push(row);
  }

  // Shuffle for random feature placement
  for(let i=floors.length-1;i>0;i--){
    const j=rnd(i+1); [floors[i],floors[j]]=[floors[j],floors[i]];
  }

  function placeRnd(type,count,extra){
    for(let i=0;i<count&&floors.length;i++){
      const {x,y}=floors.splice(0,1)[0];
      grid[y][x]=Object.assign({type},extra||{});
    }
  }

  // Kelp beds — organic clusters on water tiles
  const kelpSeeds = 3 + rnd(4);
  for(let k=0;k<kelpSeeds&&floors.length;k++){
    const {x:cx,y:cy} = floors[rnd(floors.length)];
    const r = 2+rnd(3);
    for(let dy=-r;dy<=r;dy++) for(let dx=-r;dx<=r;dx++){
      if(dx*dx+dy*dy>r*r+r) continue;
      const tx=cx+dx, ty=cy+dy;
      if(tx<0||ty<0||tx>=W||ty>=H) continue;
      if(grid[ty][tx].type==='uw_floor' && Math.random()<0.50){
        grid[ty][tx]={type:'uw_kelp'};
        const fi=floors.findIndex(f=>f.x===tx&&f.y===ty);
        if(fi>=0) floors.splice(fi,1);
      }
    }
  }

  placeRnd('uw_coral', 4+rnd(6));
  placeRnd('uw_vent',  1+rnd(2));
  if(Math.random() < 0.28 && floors.length){
    const {x,y}=floors.splice(0,1)[0];
    const wreckDescs = [
      { kind:'alien vessel',    desc:'The hull geometry is wrong — curved where it should be straight, sealed with no visible seam. Whatever built this did not think the way humans do.' },
      { kind:'survey drone',    desc:'A scientific survey drone, hull number still legible under the algae. Someone lost this a long time ago. The data core is cracked but something survived.' },
      { kind:'escape pod',      desc:'A single-occupancy escape pod, hatch forced from the inside. Whatever was in here got out. Or tried to.' },
      { kind:'cargo container', desc:'A standard interstellar freight container, registration markings corroded away. The seal held. The contents did not all make it.' },
      { kind:'military probe',  desc:'Compact, armoured, no markings. The design suggests military origin. Nothing about it suggests it was supposed to end up here.' },
      { kind:'alien structure', desc:'Not a vessel — a structure, or a piece of one. Grown rather than built. The material resists your instruments and your eyes equally.' },
    ];
    const wd = wreckDescs[rnd(wreckDescs.length)];
    grid[y][x]={type:'uw_wreck', hasLoot:true, wrecKind:wd.kind, wrecDesc:wd.desc};
  }

  G.planets[key]={
    grid,
    biome:'UNDERWATER', isUnderwater:true, sourcePlanet:surfaceKey,
    visited:  new Array(W*H).fill(false),
    explored: new Array(W*H).fill(false),
    planetTurn:0, surveySoldValue:0, spawnedAliens:0,
  };
  if(!G.enemies[key]) G.enemies[key]=[];

  // Aquatic civilization — place their buildings/roam-center on the seabed
  const surfaceCiv = G.planets[surfaceKey]?.civilization;
  if(surfaceCiv && surfaceCiv.species === 'Aquatic'){
    G.planets[key].civilization = surfaceCiv;
    const uwPdata = G.planets[key];
    const uwFloors = [];
    for(let fy=1;fy<H-1;fy++) for(let fx=1;fx<W-1;fx++){
      if(grid[fy][fx]?.type === 'uw_floor') uwFloors.push({x:fx,y:fy});
    }
    for(let i=uwFloors.length-1;i>0;i--){ const j=rnd(i+1); [uwFloors[i],uwFloors[j]]=[uwFloors[j],uwFloors[i]]; }
    if(surfaceCiv.tier === 'primitive'){
      if(uwFloors.length > 0){
        const center = uwFloors[rnd(uwFloors.length)];
        surfaceCiv.roamCenter = { x:center.x, y:center.y };
        surfaceCiv.roamRadius = 8 + rnd(6);
      }
    } else {
      const toPlace = Math.min(surfaceCiv.count, uwFloors.length);
      for(let i=0;i<toPlace;i++){
        const {x,y} = uwFloors[i];
        const surfaceTile = surfaceCiv.tiles[rnd(surfaceCiv.tiles.length)];
        grid[y][x] = { type: aquaticCivTileType(surfaceTile), civKey: key, surfaceCivKey: surfaceKey, surfaceCivTile: surfaceTile };
      }
      if(toPlace === 0) G.planets[key].civilization = null;
    }
    if(G.planets[key].civilization){
      const locals = spawnCivilizationLocals(key, uwPdata);
      G.enemies[key].push(...locals);
      uwPdata.spawnedAliens = locals.length;
    }
  }
}
function generateStrandedShipMap(key){
  const W = PLANET_W, H = PLANET_H;
  const grid = Array.from({length:H}, ()=>
    Array.from({length:W}, ()=>({type:'station_wall'}))  // walls as default — NO void bg
  );
  function carve(x,y,t='station_floor'){
    if(x>=0&&x<W&&y>=0&&y<H) grid[y][x]={type:t};
  }

  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    if(x<2||x>W-3||y<1||y>H-2) grid[y][x]={type:'station_wall'};
  }

  // Central corridor — stays away from map edge so the bow is always sealed
  const spineY = Math.floor(H/2);
  const spineX1 = 3, spineX2 = W-7;
  for(let x=spineX1;x<=spineX2;x++){
    carve(x,spineY);
    carve(x,spineY-1);
  }

  // Tapered bow with a closed nose cap.
  const bowLen = 2 + rnd(2);
  for(let i=1;i<=bowLen;i++){
    carve(spineX2+i, spineY);
    if(i < bowLen) carve(spineX2+i, spineY-1);
  }

  // Randomized room modules above and below the spine.
  const modules = 3 + rnd(2);
  const roomDefs = [];
  let cursorX = 4;
  for(let i=0;i<modules && cursorX < spineX2-4;i++){
    const rw = 5 + rnd(4);
    const topH = 3 + rnd(2);
    const botH = 3 + rnd(2);
    const rx = cursorX;
    const topY = Math.max(1, spineY - topH - 2 - rnd(2));
    const botY = Math.min(H-2-botH, spineY + 2 + rnd(2));
    roomDefs.push([rx, topY, rw, topH]);
    roomDefs.push([rx, botY, rw, botH]);
    cursorX += rw + 2 + rnd(2);
  }

  roomDefs.forEach(([rx,ry,rw,rh])=>{
    for(let dy=1;dy<rh-1;dy++) for(let dx=1;dx<rw-1;dx++) carve(rx+dx,ry+dy);
    for(let dx=0;dx<rw;dx++){
      grid[ry][rx+dx]={type:'station_wall'};
      grid[ry+rh-1][rx+dx]={type:'station_wall'};
    }
    for(let dy=0;dy<rh;dy++){
      grid[ry+dy][rx]={type:'station_wall'};
      grid[ry+dy][rx+rw-1]={type:'station_wall'};
    }
    const doorX = rx + 1 + rnd(Math.max(1, rw-2));
    if(ry < spineY){
      for(let y=ry+rh-1; y<=spineY-1; y++) carve(doorX, y);
    } else {
      for(let y=spineY; y<=ry; y++) carve(doorX, y);
    }
  });

  // Small side damage so interiors don't all read as pristine rectangles.
  for(let i=0;i<3+rnd(4);i++){
    const cutX = 4 + rnd(Math.max(2, spineX2-6));
    const cutY = (Math.random()<0.5) ? spineY-2-rnd(3) : spineY+1+rnd(3);
    if(cutX>2 && cutX<W-3 && cutY>1 && cutY<H-2) grid[cutY][cutX]={type:'station_crack'};
  }

  // Feature placement
  const floorTiles=[];
  for(let y=0;y<H;y++) for(let x=0;x<W;x++)
    if(grid[y][x].type==='station_floor') floorTiles.push({x,y});

  function placeRnd(type,count,extra){
    for(let i=0;i<count&&floorTiles.length;i++){
      const idx=rnd(floorTiles.length);
      const {x,y}=floorTiles.splice(idx,1)[0];
      grid[y][x]=Object.assign({type},extra||{});
    }
  }

  placeRnd('station_crack',   5+rnd(5));
  placeRnd('station_console', 2+rnd(2));
  placeRnd('MINERAL',         1+rnd(2), {revealed:false, oreType: pickOreForBiome('_default')});

  const numCorpses=2+rnd(3);
  for(let i=0;i<numCorpses&&floorTiles.length;i++){
    const idx=rnd(floorTiles.length);
    const {x,y}=floorTiles.splice(idx,1)[0];
    const cause=DEATH_CAUSES[rnd(DEATH_CAUSES.length)];
    const credits=[0,0,20,30][rnd(4)];
    grid[y][x]={type:'station_corpse',deathCause:cause,credits};
  }

  // Guaranteed spawn on spine near bow
  const spawnX = spineX1+2, spawnY = spineY;
  grid[spawnY][spawnX] = {type:'SHIP'};

  G.planets[key]={
    grid, spawnX, spawnY,
    biome:'DERELICT', isDerelict:true, isStrandedShip:true,
    visited:  new Array(W*H).fill(false),
    explored: new Array(W*H).fill(false),
    planetTurn:0, surveySoldValue:0, spawnedAliens:0,
  };
  G.enemies[key]=[];
}

