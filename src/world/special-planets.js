function generateHabitablePlanet(key){
  const W = PLANET_W, H = PLANET_H;
  const B = BIOMES.HABITABLE;

  // ── Heightmap using layered sine waves (cheap coherent noise) ──
  // Random phase offsets per generation
  const px1=Math.random()*99, py1=Math.random()*99;
  const px2=Math.random()*99, py2=Math.random()*99;
  const px3=Math.random()*99, py3=Math.random()*99;
  const px4=Math.random()*99, py4=Math.random()*99;

  function height(x, y){
    const nx = x/W, ny = y/H;
    // Layer 1 — large continental features
    let h  = Math.sin((nx+px1)*2.1*Math.PI) * Math.cos((ny+py1)*1.8*Math.PI) * 0.40;
    // Layer 2 — medium landmass detail
        h += Math.sin((nx+px2)*4.3*Math.PI) * Math.cos((ny+py2)*3.7*Math.PI) * 0.25;
    // Layer 3 — small features
        h += Math.sin((nx+px3)*7.9*Math.PI) * Math.cos((ny+py3)*6.1*Math.PI) * 0.20;
    // Layer 4 — fine noise
        h += Math.sin((nx+px4)*13.1*Math.PI)* Math.cos((ny+py4)*11.3*Math.PI)* 0.15;
    return h; // range roughly -1..1
  }

  // ── Water level — randomise ocean coverage 0% / ~30% / ~60% / ~90% ──
  const coverageRoll = Math.random();
  let waterLevel;
  if(coverageRoll < 0.2)       waterLevel = -2.0;   // 0% water — full land
  else if(coverageRoll < 0.45) waterLevel = -0.15;  // ~25% water — mostly land
  else if(coverageRoll < 0.70) waterLevel =  0.05;  // ~50% water — balanced
  else if(coverageRoll < 0.90) waterLevel =  0.25;  // ~75% water — island world
  else                         waterLevel =  2.0;   // 100% water — ocean world

  // ── Build grid ───────────────────────────────────────────────────
  const grid = [];
  for(let y=0;y<H;y++){
    const row=[];
    for(let x=0;x<W;x++){
      const h = height(x,y);
      let type;
      if(h < waterLevel){
        type = 'EARTH_WATER';
      } else {
        // On land: elevation drives terrain type
        // High elevation → mountains, medium → forest, low → open ground
        const landH = h - waterLevel; // 0..~2
        const r = Math.random();
        if(landH > 0.45){
          // High ground — mountain ridges (higher chance)
          type = r < 0.55 ? (Math.random()<0.5 ? 'EARTH_ROCK' : 'EARTH_ROCK2') : 'EARTH_FLOOR';
        } else if(landH > 0.20){
          // Mid elevation — forest likely
          type = r < 0.35 ? 'EARTH_FOREST' :
                 r < 0.42 ? (Math.random()<0.5 ? 'EARTH_ROCK' : 'EARTH_ROCK2') :
                 'EARTH_FLOOR';
        } else {
          // Low flat land — mostly open with some forest patches
          type = r < 0.10 ? 'EARTH_FOREST' : 'EARTH_FLOOR';
        }
      }
      row.push({type});
    }
    grid.push(row);
  }

  // ── Loot (only on walkable non-water tiles) ─────────────────────
  const floor = 'EARTH_FLOOR';
  for(let i=0;i<B.minerals;i++) placeTile(grid,'MINERAL',floor);

  // ── Enemies + Nests ──────────────────────────────────────────────
  const enemies = spawnCreatures(key, 'HABITABLE', grid, B.aliens, floor, false, true);
  // Biodata only on planets that actually have lifeforms
  if(enemies.length > 0){
    for(let i=0;i<B.biodata;i++) placeTile(grid,'BIODATA',floor);
  }

  // ── Ship landing pad — must be on open ground ────────────────────
  let sx,sy,st=0;
  do{ sx=1+rnd(W-2); sy=1+rnd(H-2); st++; }
  while(grid[sy][sx].type!==floor && st<500);
  // Fallback: if no open ground found (ocean world), place on water
  if(st>=500){
    do{ sx=1+rnd(W-2); sy=1+rnd(H-2); st++; }
    while(grid[sy][sx].type!=='EARTH_WATER' && st<1000);
  }
  grid[sy][sx].type='SHIP';

  G.planets[key]={ grid, spawnX:sx, spawnY:sy, biome:'HABITABLE', visited: new Array(W*H).fill(false), explored: new Array(W*H).fill(false), planetTurn:0, surveySoldValue:0, spawnedAliens: enemies.length };
  G.enemies[key]=enemies;
  if(spawnCreatures._pendingTemplates){
    G.planets[key].creatureTemplates = spawnCreatures._pendingTemplates;
    spawnCreatures._pendingTemplates = null;
  }
  // Place civilization structures (habitable planets only)
  const civData = placeCivilization(key, grid);
  if(civData){
    G.planets[key].civilization = civData;
    G.enemies[key].push(...spawnCivilizationLocals(key, G.planets[key]));
    G.planets[key].spawnedAliens = G.enemies[key].length;
    // A civilisation harvests its own resources — remove free mineral and biodata pickups.
    for(let gy=0;gy<grid.length;gy++){
      for(let gx=0;gx<grid[gy].length;gx++){
        if(grid[gy][gx].type==='MINERAL' || grid[gy][gx].type==='MINERAL_SAMPLE' || grid[gy][gx].type==='BIODATA') grid[gy][gx].type='EARTH_FLOOR';
      }
    }
  }
  // ── Scattered ancient ruins — rare chance on habitable planets without a civ ──
  if(!civData && Math.random() < 0.04){
    const _pdata = G.planets[key];
    placeAncientRuinsOnPlanet(_pdata.grid, W, H, key, 'EARTH_FLOOR');
    G._scatteredRuinsCount = (G._scatteredRuinsCount || 0) + 1;
  }
  initPlanetHazards(key, 'HABITABLE');
}

function generateBloomPlanet(key){
  generateHabitablePlanet(key);
  const pdata = G.planets[key];
  if(!pdata) return;
  pdata.biome = 'BLOOM';
  pdata.hallucinogenic = true;
  pdata.hallucinationExposure = 0;
  const W = PW(pdata), H = PH(pdata);
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const cell = pdata.grid[y][x];
      if(cell.type === 'EARTH_FLOOR'){
        const r = Math.random();
        cell.type = r < 0.48 ? 'BLOOM_FLOOR' : r < 0.88 ? 'BLOOM_FLOOR2' : 'BLOOM_THICKET';
      } else if(cell.type === 'EARTH_FOREST' && Math.random() < 0.55){
        cell.type = 'BLOOM_THICKET';
      }
    }
  }
  if(pdata.grid[pdata.spawnY]?.[pdata.spawnX]){
    pdata.grid[pdata.spawnY][pdata.spawnX].type = 'SHIP';
  }
  const sampleFloors = ['BLOOM_FLOOR','BLOOM_FLOOR2','BLOOM_THICKET','EARTH_FLOOR','EARTH_FOREST'];
  for(let i=0;i<12+rnd(8);i++){
    let placed = false;
    for(let tries=0;tries<160 && !placed;tries++){
      const x=1+rnd(W-2), y=1+rnd(H-2);
      if(sampleFloors.includes(pdata.grid[y][x].type)){
        pdata.grid[y][x].type = 'BIODATA';
        placed = true;
      }
    }
  }
  initPlanetHazards(key, 'BLOOM');
}

function generateTalkingTreesPlanet(key){
  generateHabitablePlanet(key);
  const pdata = G.planets[key];
  if(!pdata) return;
  pdata.biome = 'TALKING_TREES';
  pdata.talkingTreesHeard = 0;
  const W = PW(pdata), H = PH(pdata);
  for(let y=0;y<H;y++){
    for(let x=0;x<W;x++){
      const cell = pdata.grid[y][x];
      if(cell.type === 'EARTH_FLOOR' && Math.random() < 0.12){
        cell.type = 'EARTH_FOREST';
      }
    }
  }
  
  // Set up the Walking Tree civilization
  pdata.civilization = {
    tier: 'primitive',
    tierLabel: 'Primitive',
    species: 'Walking Tree',
    aggression: 'Peaceful',
    count: 0,
    traits: { diet:'herbivore', social:'collective', curiosity:'curious', honor:'honorable' },
    groupSize: 10 + rnd(8),
    roamCenter: { x: Math.floor(W/2), y: Math.floor(H/2) },
    roamRadius: Math.floor(Math.min(W, H) / 2) - 2
  };
  ensureCivilizationLocals(key);

  if(pdata.grid[pdata.spawnY]?.[pdata.spawnX]){
    pdata.grid[pdata.spawnY][pdata.spawnX].type = 'SHIP';
  }
  initPlanetHazards(key, 'TALKING_TREES');
}

// ── RINGWORLD SURFACE MAP GENERATOR ─────────────────────────────────
function generateRingworld(key){
  const W = PLANET_W * 2;
  const H = PLANET_H;
  const HALL_TOP = 3;
  const HALL_BOT = H - 4;

  const grid = Array.from({length:H}, ()=>Array.from({length:W}, ()=>({type:'rw_floor'})));

  // Outer walls
  for(let x=0;x<W;x++){
    grid[0][x]   = {type:'rw_wall'};
    grid[H-1][x] = {type:'rw_wall'};
  }
  // Dividing walls between hallways and surface
  for(let x=0;x<W;x++){
    grid[HALL_TOP-1][x] = {type:'rw_wall'};
    grid[HALL_BOT+1][x] = {type:'rw_wall'};
  }
  // Locked doors every 12 tiles, staggered top/bottom
  for(let x=6; x<W; x+=12)
    grid[HALL_TOP-1][x] = {type:'rw_locked_door', doorId:'rw_top_'+x};
  for(let x=12; x<W; x+=12)
    grid[HALL_BOT+1][x] = {type:'rw_locked_door', doorId:'rw_bot_'+x};

  // Surface terrain via layered sine noise (rows HALL_TOP .. HALL_BOT)
  const px1=Math.random()*99, py1=Math.random()*99;
  const px2=Math.random()*99, py2=Math.random()*99;
  const px3=Math.random()*99, py3=Math.random()*99;
  function height(x,y){
    const nx=x/W, ny=(y-HALL_TOP)/(HALL_BOT-HALL_TOP+1);
    let h  = Math.sin((nx+px1)*3.1*Math.PI)*Math.cos((ny+py1)*2.4*Math.PI)*0.40;
        h += Math.sin((nx+px2)*6.5*Math.PI)*Math.cos((ny+py2)*5.1*Math.PI)*0.30;
        h += Math.sin((nx+px3)*11.3*Math.PI)*Math.cos((ny+py3)*9.7*Math.PI)*0.20;
    return h;
  }
  const wRoll = Math.random();
  const waterLevel = wRoll<0.2?-2.0:wRoll<0.45?-0.15:wRoll<0.70?0.05:wRoll<0.90?0.25:2.0;

  for(let y=HALL_TOP; y<=HALL_BOT; y++){
    for(let x=0; x<W; x++){
      const h=height(x,y);
      let type;
      if(h<waterLevel){ type='EARTH_WATER'; }
      else {
        const landH=h-waterLevel, r=Math.random();
        if(landH>0.45)      type=r<0.55?(Math.random()<0.5?'EARTH_ROCK':'EARTH_ROCK2'):'EARTH_FLOOR';
        else if(landH>0.20) type=r<0.35?'EARTH_FOREST':r<0.42?(Math.random()<0.5?'EARTH_ROCK':'EARTH_ROCK2'):'EARTH_FLOOR';
        else                type=r<0.10?'EARTH_FOREST':'EARTH_FLOOR';
      }
      grid[y][x]={type};
    }
  }

  // Loot and creatures
  const floor='EARTH_FLOOR';
  for(let i=0;i<6+rnd(6);i++) placeTile(grid,'MINERAL',floor,{oreType:pickOreForBiome('HABITABLE')});
  for(let i=0;i<6+rnd(6);i++) placeTile(grid,'MINERAL_SAMPLE',floor,{biome:'HABITABLE'});
  for(let i=0;i<4+rnd(4);i++) placeTile(grid,'BIODATA',floor);
  const enemies=spawnCreatures(key,'HABITABLE',grid,6+rnd(4),floor,false,true);

  // Ship landing pad
  let sx,sy,st=0;
  do{ sx=1+rnd(W-2); sy=HALL_TOP+rnd(HALL_BOT-HALL_TOP+1); st++; }
  while(grid[sy][sx].type!==floor && st<500);
  if(st>=500){ sx=Math.floor(W/2); sy=Math.floor((HALL_TOP+HALL_BOT)/2); grid[sy][sx]={type:floor}; }
  grid[sy][sx].type='SHIP';

  // Hallway lore items
  const hallItems=['station_locker','rw_console','rw_console'];
  for(let i=0;i<4;i++){
    const hx=1+rnd(W-2);
    const hy=Math.random()<0.5?1:H-2;
    if(grid[hy][hx].type==='rw_floor') grid[hy][hx]={type:hallItems[rnd(hallItems.length)]};
  }

  G.planets[key]={
    grid, spawnX:sx, spawnY:sy,
    biome:'RINGWORLD', isRingworld:true,
    width:W, height:H,
    visited:  new Array(W*H).fill(false),
    explored: new Array(W*H).fill(false),
    planetTurn:0, surveySoldValue:0,
    spawnedAliens:enemies.length,
  };
  G.enemies[key]=enemies;
  if(spawnCreatures._pendingTemplates){
    G.planets[key].creatureTemplates=spawnCreatures._pendingTemplates;
    spawnCreatures._pendingTemplates=null;
  }
}


// ── NUCLEAR WAR PLANET GENERATOR ────────────────────────────────────
// Dead world — city ruins, poisoned water, craters, no survivors.
function generateNuclearPlanet(key){
  const W = PLANET_W, H = PLANET_H;

  // ── Heightmap for terrain variation (reuse sine-noise approach) ──
  const px1=Math.random()*99, py1=Math.random()*99;
  const px2=Math.random()*99, py2=Math.random()*99;
  const px3=Math.random()*99, py3=Math.random()*99;
  function height(x,y){
    const nx=x/W, ny=y/H;
    let h  = Math.sin((nx+px1)*2.3*Math.PI)*Math.cos((ny+py1)*1.9*Math.PI)*0.40;
        h += Math.sin((nx+px2)*5.1*Math.PI)*Math.cos((ny+py2)*4.3*Math.PI)*0.30;
        h += Math.sin((nx+px3)*9.7*Math.PI)*Math.cos((ny+py3)*8.1*Math.PI)*0.20;
    return h;
  }

  // Water level — small pockets of contaminated water ~25% coverage
  const waterLevel = -0.10;

  // ── Build base grid ─────────────────────────────────────────────
  const grid = [];
  for(let y=0;y<H;y++){
    const row=[];
    for(let x=0;x<W;x++){
      const h=height(x,y);
      let type;
      if(h < waterLevel){
        type='nuke_water';
      } else {
        // Mostly dirt, some rubble, occasional craters via noise
        const r=Math.random();
        const landH=h-waterLevel;
        if(landH > 0.35 && r<0.30) type='nuke_rock';
        else                        type='nuke_dirt';
      }
      row.push({type});
    }
    grid.push(row);
  }

  // ── Scatter craters — 8–14, circular depressions ───────────────
  const numCraters = 8 + rnd(7);
  for(let c=0;c<numCraters;c++){
    const cx2 = 2+rnd(W-4), cy2 = 2+rnd(H-4);
    const cr = 1 + rnd(3); // radius 1–3
    for(let dy=-cr;dy<=cr;dy++){
      for(let dx=-cr;dx<=cr;dx++){
        if(dx*dx+dy*dy > cr*cr) continue;
        const tx=cx2+dx, ty=cy2+dy;
        if(tx<0||tx>=W||ty<0||ty>=H) continue;
        if(grid[ty][tx].type!=='nuke_water') grid[ty][tx]={type:'nuke_crater'};
      }
    }
  }

  // ── City ruins — clustered rectangular building footprints ──────
  const numDistricts = 4 + rnd(4);
  for(let d=0;d<numDistricts;d++){
    // District centre
    const dcx = 3+rnd(W-6), dcy = 3+rnd(H-6);
    const numBuildings = 3 + rnd(5);
    for(let b=0;b<numBuildings;b++){
      const bx2 = dcx + rnd(9)-4;
      const by2 = dcy + rnd(7)-3;
      const bw = 2 + rnd(4); // 2–5 wide
      const bh = 2 + rnd(3); // 2–4 tall
      const ruinType = Math.random()<0.5 ? 'nuke_ruin' : 'nuke_ruin2';
      for(let dy=0;dy<bh;dy++){
        for(let dx=0;dx<bw;dx++){
          const tx=bx2+dx, ty=by2+dy;
          if(tx<0||tx>=W||ty<0||ty>=H) continue;
          if(grid[ty][tx].type==='nuke_water') continue;
          // Outer walls only — hollow interior becomes dirt
          const isWall=(dx===0||dx===bw-1||dy===0||dy===bh-1);
          if(isWall) grid[ty][tx]={type:ruinType};
          else if(grid[ty][tx].type!=='nuke_crater') grid[ty][tx]={type:'nuke_dirt'};
        }
      }
    }
  }

  // ── Dead trees — scattered, not in water or ruins ───────────────
  const numTrees = 12 + rnd(10);
  for(let t=0;t<numTrees;t++){
    let tx,ty,tries=0;
    do{ tx=1+rnd(W-2); ty=1+rnd(H-2); tries++; }
    while(tries<40 && grid[ty][tx].type!=='nuke_dirt');
    if(tries<40) grid[ty][tx]={type:'nuke_dead_tree'};
  }

  // ── Mineral samples — a few, on accessible dirt/crater tiles ───
  for(let i=0;i<3+rnd(4);i++) placeTile(grid,'MINERAL','nuke_dirt',{oreType:pickOreForBiome('NUCLEAR_WAR')});
  // A couple in craters too
  for(let i=0;i<1+rnd(2);i++) placeTile(grid,'MINERAL','nuke_crater',{oreType:pickOreForBiome('NUCLEAR_WAR')});

  // ── Ship landing pad — on open dirt ────────────────────────────
  let sx,sy,st=0;
  do{ sx=1+rnd(W-2); sy=1+rnd(H-2); st++; }
  while(grid[sy][sx].type!=='nuke_dirt' && st<500);
  if(st>=500){
    // Fallback — clear a spot
    sx=Math.floor(W/2); sy=Math.floor(H/2);
    grid[sy][sx]={type:'nuke_dirt'};
  }
  grid[sy][sx].type='SHIP';

  G.planets[key]={
    grid, spawnX:sx, spawnY:sy,
    biome:'NUCLEAR_WAR', isNuclearWar:true,
    visited:  new Array(W*H).fill(false),
    explored: new Array(W*H).fill(false),
    planetTurn:0, surveySoldValue:0,
    spawnedAliens:0,
  };
  G.enemies[key]=[];
}


// ── DESTROYED RINGWORLD MAP GENERATOR ───────────────────────────────
// Double-wide (80×20) void field with jagged metal fragment islands.
// rw_void tiles = lethal hard vacuum. Fragments may not be connected.
function generateDestroyedRingworld(key){
  const W = PLANET_W * 2;  // 80 wide
  const H = PLANET_H;       // 20 tall

  // Start as pure void
  const grid = Array.from({length:H}, ()=>
    Array.from({length:W}, ()=>({type:'rw_void'}))
  );

  function setTile(x,y,t){ if(x>=0&&x<W&&y>=0&&y<H) grid[y][x]={type:t}; }
  function isDebris(x,y){ const t=grid[y]?.[x]?.type; return t&&t!=='rw_void'; }

  // ── Fragment definitions — irregular island shapes ──────────────
  // Each fragment: [cx, cy, w, h, jaggedness]
  const NUM_FRAGMENTS = 9 + rnd(5);
  const fragments = [];

  // Spread fragments across the wide map — use a loose grid to avoid clumping
  const cols = 5, rows = 3;
  const cellW = Math.floor(W / cols), cellH = Math.floor(H / rows);
  let cellIdx = 0;
  const cellSlots = [];
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++) cellSlots.push([c,r]);
  // Shuffle slots
  for(let i=cellSlots.length-1;i>0;i--){
    const j=rnd(i+1);[cellSlots[i],cellSlots[j]]=[cellSlots[j],cellSlots[i]];
  }

  const usedSlots = cellSlots.slice(0, Math.min(NUM_FRAGMENTS, cellSlots.length));

  usedSlots.forEach(([col, row])=>{
    const fw = 4 + rnd(8);   // fragment width 4–11
    const fh = 3 + rnd(5);   // fragment height 3–7
    // Position within cell with margin
    const margin = 1;
    const cx = col*cellW + margin + rnd(Math.max(1, cellW - fw - margin*2));
    const cy = row*cellH + margin + rnd(Math.max(1, cellH - fh - margin*2));

    // Carve jagged fragment shape — erode corners randomly
    for(let dy=0;dy<fh;dy++){
      for(let dx=0;dx<fw;dx++){
        const ex=cx+dx, ey=cy+dy;
        // Corner erosion — probabilistic
        const isCorner=(dx<2||dx>=fw-2)&&(dy<2||dy>=fh-2);
        const isEdge=(dx===0||dx===fw-1||dy===0||dy===fh-1);
        if(isCorner && Math.random()<0.55) continue;  // eat corners
        if(isEdge && Math.random()<0.18) continue;    // nibble edges
        // Random interior holes — structural damage
        if(!isEdge && Math.random()<0.06) continue;
        setTile(ex, ey, 'rw_debris');
      }
    }
    // Add some rw_wall chunks (thicker plating)
    const wallCount = 1 + rnd(3);
    for(let w=0;w<wallCount;w++){
      const wx=cx+1+rnd(Math.max(1,fw-2));
      const wy=cy+1+rnd(Math.max(1,fh-2));
      if(isDebris(wx,wy)) setTile(wx,wy,'rw_wall');
    }
    fragments.push({cx,cy,fw,fh});
  });

  // ── Occasional narrow walkways between nearby fragments ─────────
  // Only connect some pairs — not guaranteed traversable
  for(let i=0;i<fragments.length-1;i++){
    if(Math.random()<0.45) continue; // 55% skip — leave gaps
    const a=fragments[i], b=fragments[i+1];
    const ax=a.cx+Math.floor(a.fw/2), ay=a.cy+Math.floor(a.fh/2);
    const bx=b.cx+Math.floor(b.fw/2), by=b.cy+Math.floor(b.fh/2);
    const dist=Math.abs(ax-bx)+Math.abs(ay-by);
    if(dist>18) continue; // too far — no bridge
    // Lay a 1-tile-wide L-shaped walkway
    const midX=ax, midY=by;
    for(let px=Math.min(ax,midX);px<=Math.max(ax,midX);px++)
      if(grid[ay]?.[px]?.type==='rw_void') setTile(px,ay,'rw_debris');
    for(let py=Math.min(ay,midY);py<=Math.max(ay,midY);py++)
      if(grid[py]?.[midX]?.type==='rw_void') setTile(midX,py,'rw_debris');
  }

  // ── Scatter mineral samples on debris tiles ──────────────────────
  const allDebris=[];
  for(let y=0;y<H;y++) for(let x=0;x<W;x++)
    if(grid[y][x].type==='rw_debris') allDebris.push({x,y});

  const mineralCount = 4 + rnd(6);
  for(let i=0;i<mineralCount&&allDebris.length;i++){
    const idx=rnd(allDebris.length);
    const {x,y}=allDebris.splice(idx,1)[0];
    grid[y][x]={type:'MINERAL', revealed:false, oreType:pickOreForBiome('ASTEROID')};
  }

  // ── Wreckage items — consoles and lockers ────────────────────────
  const wreckItems=['rw_console','station_locker'];
  const wreckCount = 2 + rnd(3);
  for(let i=0;i<wreckCount;i++){
    const debris=[];
    for(let y=0;y<H;y++) for(let x=0;x<W;x++)
      if(grid[y][x].type==='rw_debris') debris.push({x,y});
    if(!debris.length) break;
    const {x,y}=debris[rnd(debris.length)];
    grid[y][x]={type:wreckItems[rnd(wreckItems.length)]};
  }

  // ── Ship landing pad — find any walkable debris tile ────────────
  const landable=[];
  for(let y=0;y<H;y++) for(let x=0;x<W;x++)
    if(grid[y][x].type==='rw_debris') landable.push({x,y});
  let sx=Math.floor(W/2), sy=Math.floor(H/2);
  if(landable.length){
    // Pick tile on fragment closest to map centre
    const best=landable.reduce((a,b)=>{
      const da=Math.abs(a.x-W/2)+Math.abs(a.y-H/2);
      const db=Math.abs(b.x-W/2)+Math.abs(b.y-H/2);
      return da<db?a:b;
    });
    sx=best.x; sy=best.y;
  }
  grid[sy][sx]={type:'SHIP'};

  G.planets[key]={
    grid, spawnX:sx, spawnY:sy,
    biome:'DESTROYED_RINGWORLD', isDestroyedRingworld:true,
    width:W, height:H,
    visited:  new Array(W*H).fill(false),
    explored: new Array(W*H).fill(false),
    planetTurn:0, surveySoldValue:0,
    spawnedAliens:0,
  };
  G.enemies[key]=[];
}


