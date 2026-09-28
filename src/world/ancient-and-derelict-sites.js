// ── DERELICT STATION MAP GENERATOR ──────────────────────────────────
const DEATH_CAUSES = [
  'Cause of death: asphyxiation.',
  'Cause of death: blunt force trauma.',
  'Cause of death: explosive decompression.',
  'Cause of death: blunt force trauma. Multiple fractures.',
  'Cause of death: asphyxiation. Suit breach detected.',
  'Cause of death: unknown. Body partially decomposed.',
  'Cause of death: blunt force trauma. Defensive wounds present.',
  'Cause of death: asphyxiation. Emergency mask not deployed.',
];


// ── ANCIENT REFUELING STATION MAP GENERATOR ─────────────────────────
// Open platform in deep space — platforms connected by walkways,
// surrounded by void (instant death). Alien traps invisible to non-scouts.
function generateAncientStation(key){
  const W = PLANET_W, H = PLANET_H; // 40 × 20

  // Open space as background — stepping on void = death prompt
  const grid = Array.from({length:H}, ()=>
    Array.from({length:W}, ()=>({type:'ancient_st_void'}))
  );

  function setTile(x,y,t){ if(x>=0&&x<W&&y>=0&&y<H) grid[y][x]={type:t}; }
  function setFloor(x,y){ setTile(x,y,'ancient_st_floor'); }
  function isWalkable(x,y){
    const t=grid[y]?.[x]?.type;
    return t && t!=='ancient_st_void';
  }

  // ── Fixed platform layout — guaranteed positions, generous size ──
  // 8 platforms distributed across the map
  const PLATFORM_DEFS = [
    [2, 2, 7, 4],   // top-left
    [13, 1, 8, 4],  // top-centre-left
    [25, 2, 8, 4],  // top-centre-right
    [3, 8, 6, 4],   // mid-left
    [15, 8, 8, 4],  // mid-centre
    [28, 8, 7, 4],  // mid-right
    [4, 14, 7, 4],  // bottom-left
    [26, 14, 8, 4], // bottom-right
  ];
  // Randomly drop 1-2 platforms for variety
  const numDrop = rnd(3);
  const usedDefs = PLATFORM_DEFS.filter(()=>Math.random()>0.15).slice(0, PLATFORM_DEFS.length - numDrop);
  if(usedDefs.length < 4) usedDefs.push(...PLATFORM_DEFS.slice(0,4-usedDefs.length));

  const platforms = usedDefs.map(([ox,oy,pw,ph])=>{
    // Carve floor
    for(let dy=0;dy<ph;dy++) for(let dx=0;dx<pw;dx++) setFloor(ox+dx,oy+dy);
    // Edge borders (decorative, passable)
    for(let dx=0;dx<pw;dx++){
      setTile(ox+dx, oy,    'ancient_st_edge');
      setTile(ox+dx, oy+ph-1, 'ancient_st_edge');
    }
    for(let dy=1;dy<ph-1;dy++){
      setTile(ox,      oy+dy, 'ancient_st_edge');
      setTile(ox+pw-1, oy+dy, 'ancient_st_edge');
    }
    // Corners
    [[ox,oy],[ox+pw-1,oy],[ox,oy+ph-1],[ox+pw-1,oy+ph-1]]
      .forEach(([cx,cy])=>setTile(cx,cy,'ancient_st_corner'));
    const cx=ox+Math.floor(pw/2), cy=oy+Math.floor(ph/2);
    return {x:ox,y:oy,w:pw,h:ph,cx,cy};
  });

  // ── Walkways: spanning tree, 1-tile catwalks between platforms ──
  const connected=new Set([0]);
  while(connected.size<platforms.length){
    let bestD=Infinity,bestA=-1,bestB=-1;
    connected.forEach(a=>{
      platforms.forEach((_,b)=>{
        if(connected.has(b)) return;
        const d=Math.abs(platforms[a].cx-platforms[b].cx)+Math.abs(platforms[a].cy-platforms[b].cy);
        if(d<bestD){bestD=d;bestA=a;bestB=b;}
      });
    });
    if(bestA<0) break;
    let cx=platforms[bestA].cx, cy=platforms[bestA].cy;
    const tx=platforms[bestB].cx, ty=platforms[bestB].cy;
    // Carve L-shaped catwalk — go horizontal first, then vertical
    while(cx!==tx){ if(!isWalkable(cx,cy)) setFloor(cx,cy); cx+=cx<tx?1:-1; }
    while(cy!==ty){ if(!isWalkable(cx,cy)) setFloor(cx,cy); cy+=cy<ty?1:-1; }
    if(!isWalkable(cx,cy)) setFloor(cx,cy);
    connected.add(bestB);
  }

  // ── Collect interior floor tiles (not edges/corners) for features ──
  const interior=[];
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const t=grid[y][x].type;
    if(t==='ancient_st_floor') interior.push({x,y});
  }

  function placeOne(type,extra){
    if(!interior.length) return null;
    const idx=rnd(interior.length);
    const {x,y}=interior.splice(idx,1)[0];
    grid[y][x]=Object.assign({type},extra||{});
    return {x,y};
  }

  // ── Node markers at each platform centre (decorative) ─────────
  platforms.forEach(p=>{
    if(grid[p.cy]?.[p.cx]?.type==='ancient_st_floor')
      grid[p.cy][p.cx]={type:'ancient_st_node'};
  });

  // ── Glow sources: 6-8, placed on edges/corridors ──────────────
  const glowPool=[];
  for(let y=0;y<H;y++) for(let x=0;x<W;x++){
    const t=grid[y][x].type;
    if(t==='ancient_st_edge'||t==='ancient_st_corner') glowPool.push({x,y});
  }
  const numGlows=6+rnd(3);
  for(let g=0;g<numGlows&&glowPool.length;g++){
    const idx=rnd(glowPool.length);
    const {x,y}=glowPool.splice(idx,1)[0];
    grid[y][x]={type:'ancient_st_glow'};
  }

  // ── Loot: artifact OR fuel cache ──────────────────────────────
  const hasFuel=Math.random()<0.5;
  if(hasFuel){
    const fuelAmt=40+rnd(21);
    placeOne('ancient_st_fuel',{fuelAmount:fuelAmt});
  } else {
    placeOne('ARTIFACT',{});
  }

  // ── Alien traps: look identical to floor, scout spots them ────
  const numTraps=3+rnd(3);
  const traps=[];
  for(let i=0;i<numTraps;i++){
    const pos=placeOne('ancient_st_trap',{isTrap:true,trapDmg:15+rnd(20)});
    if(pos) traps.push(pos);
  }

  // ── Ship spawn on first platform centre ──────────────────────
  const p0=platforms[0];
  grid[p0.cy][p0.cx]={type:'SHIP'};

  G.planets[key]={
    grid,
    spawnX:p0.cx, spawnY:p0.cy,
    biome:'ANCIENT_STATION', isAncientStation:true,
    visited:  new Array(W*H).fill(false),
    explored: new Array(W*H).fill(false),
    planetTurn:0, surveySoldValue:0, spawnedAliens:0,
    trapPositions:traps,
  };
  G.enemies[key]=[];
}

// ── Sentinel orb spawn on ancient building entry ──────────────────────────
// Called when the player steps into ANCIENT_OUTPOST or unlocks an ancient_locked_door.
// Works on any biome that has ancient building tiles (ANCIENT biome or scattered ruins).
//
// Per-planet budget is decided once on the first trigger:
//   30% — planet is sentinel-free (budget 0, nothing ever spawns)
//   70% — budget of 1, 2, or 3 total orbs for the whole planet
// Each individual trigger has a 50% chance to actually consume a budget slot,
// so the budget is a hard ceiling, not a guarantee.
function maybeSpawnAncientSentinel(pdata, triggerX, triggerY){
  if(!pdata) return;

  // Decide the planet's total orb budget on the first call
  if(pdata._sentinelBudget === undefined){
    pdata._sentinelBudget = Math.random() < 0.30 ? 0 : 1 + rnd(3); // 0, 1, 2, or 3
    pdata._sentinelSpawned = 0;
  }
  if(pdata._sentinelBudget === 0 || pdata._sentinelSpawned >= pdata._sentinelBudget) return;

  // 50% per-trigger chance
  if(Math.random() < 0.50) return;

  // Find a floor tile inside the building near the trigger to place the orb
  const _W = PW(pdata), _H = PH(pdata);
  const candidates = [];
  for(let dy=-4; dy<=4; dy++) for(let dx=-4; dx<=4; dx++){
    const tx=triggerX+dx, ty=triggerY+dy;
    if(tx<0||tx>=_W||ty<0||ty>=_H) continue;
    if(tx===G.player.x && ty===G.player.y) continue;
    const ct = pdata.grid[ty][tx].type;
    if(ct!=='ANCIENT_OUTPOST' && ct!=='ANCIENT_ROAD') continue;
    if((G.enemies[G.curPlanet]||[]).some(e=>e.alive&&!e.hidden&&e.x===tx&&e.y===ty)) continue;
    candidates.push({x:tx,y:ty});
  }
  if(!candidates.length) return;

  pdata._sentinelSpawned++;
  const pos = candidates[rnd(candidates.length)];
  if(!G.enemies[G.curPlanet]) G.enemies[G.curPlanet]=[];
  G.enemies[G.curPlanet].push({
    x: pos.x, y: pos.y,
    hp: 25, maxHp: 25,
    atk: 10, def: 0,
    type: 'CREATURE',
    sprite: null,
    drawFn: 'ancient_sentinel_orb',
    name: 'Sentinel Orb',
    behaviour: 'HUNT',
    speedRating: 3,
    speedModelVersion: 2,
    hostileByDefault: true,
    currentlyHostile: true,
    alive: true,
    hidden: false,
    nestX: pos.x, nestY: pos.y,
    desc: 'A compact robotic orb of ancient manufacture. Its single lens tracks you with cold precision. The energy emitter at its base is already charged.',
    rangedWeapon: { name:'energy pulse', maxRange:6, accuracy:0.70, falloff:0.04, minDmg:8, maxDmg:12 },
    colour: '#00ddcc',
    size: 0.6,
  });
  addLog('A Sentinel Orb activates — ancient defence systems are online!','lc');
  if(pdata._sentinelSpawned >= pdata._sentinelBudget)
    addLog('The ruins fall silent — all sentinels are now active.','lm');
}


function generateDerelict(key){
  const W = PLANET_W, H = PLANET_H; // 40 × 20

  // All walls to start
  const grid = Array.from({length:H}, ()=>
    Array.from({length:W}, ()=>({type:'station_wall'}))
  );

  function carve(x,y){
    if(x>=1&&x<W-1&&y>=1&&y<H-1) grid[y][x]={type:'station_floor'};
  }
  function isFloor(x,y){
    return x>=0&&x<W&&y>=0&&y<H && grid[y][x].type==='station_floor';
  }
  function carveRect(rx,ry,rw,rh){
    for(let dy=0;dy<rh;dy++)
      for(let dx=0;dx<rw;dx++)
        carve(rx+dx,ry+dy);
  }
  function carveCorridor(ax,ay,bx,by){
    // Widen corridor to 2 tiles so it's walkable
    let cx=ax,cy=ay;
    const dx=bx>cx?1:-1, dy=by>cy?1:-1;
    while(cx!==bx){ carve(cx,cy); carve(cx,cy+1); cx+=dx; }
    while(cy!==by){ carve(cx,cy); carve(cx+1,cy); cy+=dy; }
    carve(cx,cy); carve(cx+1,cy); carve(cx,cy+1);
  }

  // ── Deterministic grid-based room layout ─────────────────────
  // Divide map into a 4×3 grid of cells, place rooms inside cells
  const COLS=4, ROWS=3;
  const cellW = Math.floor((W-2)/COLS);
  const cellH = Math.floor((H-2)/ROWS);
  const rooms = [];

  for(let row=0;row<ROWS;row++){
    for(let col=0;col<COLS;col++){
      if(Math.random()<0.25) continue; // 25% chance to skip cell = gaps
      const margin=1;
      const maxW=cellW-margin*2, maxH=cellH-margin*2;
      const rw=Math.max(3, Math.floor(maxW*0.5 + rnd(Math.floor(maxW*0.5))));
      const rh=Math.max(3, Math.floor(maxH*0.5 + rnd(Math.floor(maxH*0.5))));
      const ox=1 + col*cellW + margin + rnd(Math.max(1,maxW-rw));
      const oy=1 + row*cellH + margin + rnd(Math.max(1,maxH-rh));
      carveRect(ox,oy,rw,rh);
      rooms.push({x:ox,y:oy,w:rw,h:rh,cx:ox+Math.floor(rw/2),cy:oy+Math.floor(rh/2)});
    }
  }

  // Guarantee at least 4 rooms
  if(rooms.length < 4){
    const fallbacks=[[2,2,6,4],[14,2,7,4],[2,12,6,4],[26,2,8,4]];
    fallbacks.slice(0,4-rooms.length).forEach(([ox,oy,rw,rh])=>{
      carveRect(ox,oy,rw,rh);
      rooms.push({x:ox,y:oy,w:rw,h:rh,cx:ox+Math.floor(rw/2),cy:oy+Math.floor(rh/2)});
    });
  }

  // Connect every room to its nearest neighbour
  const connected=new Set([0]);
  while(connected.size<rooms.length){
    let bestDist=Infinity,bestA=-1,bestB=-1;
    connected.forEach(a=>{
      rooms.forEach((_,b)=>{
        if(connected.has(b)) return;
        const d=Math.abs(rooms[a].cx-rooms[b].cx)+Math.abs(rooms[a].cy-rooms[b].cy);
        if(d<bestDist){bestDist=d;bestA=a;bestB=b;}
      });
    });
    if(bestA<0) break;
    carveCorridor(rooms[bestA].cx,rooms[bestA].cy,rooms[bestB].cx,rooms[bestB].cy);
    connected.add(bestB);
  }
  // Add 1-2 extra connections for loops
  for(let e=0;e<1+rnd(2);e++){
    const a=rooms[rnd(rooms.length)], b=rooms[rnd(rooms.length)];
    if(a!==b) carveCorridor(a.cx,a.cy,b.cx,b.cy);
  }

  // ── Scatter damage detail ────────────────────────────────────
  for(let i=0;i<8+rnd(8);i++){
    const cx2=1+rnd(W-2), cy2=1+rnd(H-2);
    if(isFloor(cx2,cy2)) grid[cy2][cx2]={type:'station_crack'};
  }

  // ── Collect all floor tiles for item placement ───────────────
  const room0=rooms[0];
  const sx=room0.cx, sy=room0.cy;
  const floorTiles=[];
  for(let y=0;y<H;y++) for(let x=0;x<W;x++)
    if(grid[y][x].type==='station_floor' && (x!==sx || y!==sy)) floorTiles.push({x,y});

  function placeRandom(type,count,extra){
    for(let i=0;i<count;i++){
      if(!floorTiles.length) break;
      const idx=rnd(floorTiles.length);
      const {x,y}=floorTiles.splice(idx,1)[0];
      grid[y][x]=Object.assign({type},extra||{});
    }
  }

  placeRandom('station_console',2+rnd(3));
  placeRandom('station_locker', 3+rnd(3));
  placeRandom('station_door',   2+rnd(2));
  placeRandom('BIODATA',        1+rnd(2));

  // Corpses with death causes
  const numCorpses=3+rnd(3);
  for(let i=0;i<numCorpses;i++){
    if(!floorTiles.length) break;
    const idx=rnd(floorTiles.length);
    const {x,y}=floorTiles.splice(idx,1)[0];
    const cause=DEATH_CAUSES[rnd(DEATH_CAUSES.length)];
    const credits=[0,0,0,20,20,30,30,30][rnd(8)];
    grid[y][x]={type:'station_corpse',deathCause:cause,credits};
  }

  // Ship spawn — centre of first room
  grid[sy][sx]={type:'SHIP'};

  G.planets[key]={
    grid, spawnX:sx, spawnY:sy,
    biome:'DERELICT', isDerelict:true,
    visited:  new Array(W*H).fill(false),
    explored: new Array(W*H).fill(false),
    planetTurn:0, surveySoldValue:0, spawnedAliens:0,
  };
  G.enemies[key]=[];
}

// Old saves can contain ore placed on metal floors by earlier interior generators.
function removeInteriorOreDeposits(planets){
  if(!planets) return;
  Object.values(planets).forEach(pdata=>{
    if(!pdata || !(pdata.isDerelict || pdata.isStrandedShip || pdata.isAncientStation ||
      pdata.biome==='DERELICT' || pdata.biome==='ANCIENT_STATION')) return;
    const floor = pdata.isAncientStation || pdata.biome==='ANCIENT_STATION' ? 'ancient_st_floor' : 'station_floor';
    (pdata.grid||[]).forEach(row=>row?.forEach((cell,x)=>{
      if(cell?.type==='MINERAL' || cell?.type==='MINERAL_SAMPLE') row[x]={type:cell._underFloor||floor};
    }));
  });
}


// ── Ancient ruins placement ───────────────────────────────────────────────────
// Stamps roads, buildings, outposts, statues and organic overgrowth onto an
// already-generated grid. Called by the ANCIENT biome path in generatePlanet()
// and by the debug regen tool and the scattered-ruins chance on other biomes.
function placeAncientRuinsOnPlanet(grid, W, H, key, floorType){
  const setIfOpen = (tx,ty,type) => {
    if(tx<0||tx>=W||ty<0||ty>=H) return;
    const cur = grid[ty][tx].type;
    if(['SHIP','ARTIFACT','MINERAL','MINERAL_SAMPLE','BIODATA'].includes(cur)) return;
    grid[ty][tx] = {type};
  };

  // -- Roads --
  const numRoads = 3 + rnd(3);
  for(let r=0;r<numRoads;r++){
    const x1 = 3+rnd(W-6), y1 = 3+rnd(H-6);
    const len = 6 + rnd(12);
    const horiz = Math.random()<0.5;
    for(let i=0;i<len;i++){
      const rx = horiz ? x1+i : x1;
      const ry = horiz ? y1   : y1+i;
      if(rx<0||rx>=W||ry<0||ry>=H) break;
      setIfOpen(rx,ry,'ANCIENT_ROAD');
    }
    if(Math.random()<0.6){
      const turnLen = 4 + rnd(8);
      for(let i=0;i<turnLen;i++){
        const rx = horiz ? x1+len-1 : x1+i;
        const ry = horiz ? y1+i     : y1+len-1;
        if(rx<0||rx>=W||ry<0||ry>=H) break;
        setIfOpen(rx,ry,'ANCIENT_ROAD');
      }
    }
  }

  // -- Buildings --
  const numBuildings = 2 + rnd(2);
  const buildingInteriors = [];
  for(let b=0;b<numBuildings;b++){
    const bw = 4 + rnd(4), bh = 4 + rnd(4);
    let bx, by, attempts=0;
    do{ bx = 2+rnd(W-bw-4); by = 2+rnd(H-bh-4); attempts++; }
    while(attempts<40 && grid[by][bx].type==='ANCIENT_ROAD');
    for(let wx=bx;wx<bx+bw;wx++){
      setIfOpen(wx,by,'ANCIENT_WALL');
      setIfOpen(wx,by+bh-1,'ANCIENT_WALL');
    }
    for(let wy=by;wy<by+bh;wy++){
      setIfOpen(bx,wy,'ANCIENT_WALL');
      setIfOpen(bx+bw-1,wy,'ANCIENT_WALL');
    }
    const thisInterior = [];
    for(let wy=by+1;wy<by+bh-1;wy++)
      for(let wx=bx+1;wx<bx+bw-1;wx++){
        setIfOpen(wx,wy,'ANCIENT_OUTPOST');
        if(grid[wy][wx].type==='ANCIENT_OUTPOST') thisInterior.push({x:wx,y:wy});
      }
    buildingInteriors.push(...thisInterior);
    const side = rnd(4);
    const doorPos = side<2 ? bx+1+rnd(bw-2) : by+1+rnd(bh-2);
    let doorX, doorY;
    if(side===0){ doorX=doorPos; doorY=by;      }
    if(side===1){ doorX=doorPos; doorY=by+bh-1; }
    if(side===2){ doorX=bx;      doorY=doorPos; }
    if(side===3){ doorX=bx+bw-1; doorY=doorPos; }
    if(doorX!==undefined && doorY!==undefined)
      grid[doorY][doorX] = { type:'ancient_locked_door', _bx:bx, _by:by };
  }
  if(buildingInteriors.length > 0){
    const spot = buildingInteriors.slice().sort(()=>Math.random()-0.5)[0];
    grid[spot.y][spot.x] = {type:'ARTIFACT', _underFloor:'ANCIENT_OUTPOST'};
  }

  // -- Outposts --
  const numOutposts = 2 + rnd(2);
  for(let o=0;o<numOutposts;o++){
    let ox, oy, attempts=0;
    do{ ox=3+rnd(W-6); oy=3+rnd(H-6); attempts++; }
    while(attempts<40 && grid[oy][ox].type==='ANCIENT_WALL');
    for(let wy=oy;wy<oy+3;wy++)
      for(let wx=ox;wx<ox+3;wx++)
        setIfOpen(wx,wy, (wx===ox||wx===ox+2||wy===oy||wy===oy+2) ? 'ANCIENT_WALL' : 'ANCIENT_OUTPOST');
    const entranceSide = rnd(4);
    if(entranceSide===0) setIfOpen(ox+1, oy,   'ANCIENT_ROAD');
    if(entranceSide===1) setIfOpen(ox+1, oy+2, 'ANCIENT_ROAD');
    if(entranceSide===2) setIfOpen(ox,   oy+1, 'ANCIENT_ROAD');
    if(entranceSide===3) setIfOpen(ox+2, oy+1, 'ANCIENT_ROAD');
    if(Math.random()<0.5){
      const _msX=ox+1, _msY=oy+1;
      if(grid[_msY]?.[_msX] && !['SHIP','ARTIFACT','MINERAL','MINERAL_SAMPLE','BIODATA'].includes(grid[_msY][_msX].type))
        grid[_msY][_msX] = { type:'MINERAL_SAMPLE', _underFloor:'ANCIENT_OUTPOST', _sampleType: pickMineralSample('ANCIENT') };
    }
  }

  // -- Statues --
  if(Math.random() < 0.55){
    const numStatues = Math.random() < 0.5 ? 1 : 3;
    const roadAdjacentFloor = [];
    for(let sy=1;sy<H-1;sy++){
      for(let sx=1;sx<W-1;sx++){
        const t = grid[sy][sx].type;
        if(t !== floorType && t !== 'EARTH_FLOOR' && t !== 'EARTH_FOREST') continue;
        const nearRoad = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]]
          .some(([ndx,ndy])=>grid[sy+ndy]?.[sx+ndx]?.type==='ANCIENT_ROAD');
        if(nearRoad) roadAdjacentFloor.push({x:sx,y:sy});
      }
    }
    const shuffledRoad = roadAdjacentFloor.sort(()=>Math.random()-0.5);
    for(let si=0;si<numStatues && si<shuffledRoad.length;si++){
      const sp = shuffledRoad[si];
      grid[sp.y][sp.x] = {type:'ancient_statue'};
    }
  }

  // -- Organic overgrowth (only where EARTH_FLOOR exists) --
  const forestCount = 18 + rnd(14);
  for(let i=0;i<forestCount;i++){
    const fx=1+rnd(W-2), fy=1+rnd(H-2);
    if(grid[fy][fx].type==='EARTH_FLOOR') grid[fy][fx]={type:'EARTH_FOREST'};
  }
  for(let pass=0;pass<2;pass++){
    for(let y=1;y<H-1;y++) for(let x=1;x<W-1;x++){
      if(grid[y][x].type==='EARTH_FLOOR' && Math.random()<0.18){
        const neighbours=[grid[y-1][x],grid[y+1][x],grid[y][x-1],grid[y][x+1]];
        if(neighbours.some(n=>n.type==='EARTH_FOREST')) grid[y][x]={type:'EARTH_FOREST'};
      }
    }
  }
}

