function generatePlanet(key, biomeKey){
  const B = BIOMES[biomeKey] || BIOMES.DESERT;
  const W = PLANET_W, H = PLANET_H;
  if(biomeKey === 'HABITABLE'){
    return generateHabitablePlanet(key);
  }
  if(biomeKey === 'BLOOM'){
    return generateBloomPlanet(key);
  }
  if(biomeKey === 'TALKING_TREES'){
    return generateTalkingTreesPlanet(key);
  }
  if(biomeKey === 'RINGWORLD'){
    return generateRingworld(key);
  }
  if(biomeKey === 'DESTROYED_RINGWORLD'){
    return generateDestroyedRingworld(key);
  }
  if(biomeKey === 'NUCLEAR_WAR'){
    return generateNuclearPlanet(key);
  }

  const grid=[];
  for(let y=0;y<H;y++){
    const row=[];
    for(let x=0;x<W;x++){
      // Volcanic biome gets 50/50 split between hot and cooled floor tiles
      // Toxic biome gets 3-way split: base sludge / acid pool / cracked crust
      const floorType = (B.floor === 'VOLCANIC_FLOOR' && Math.random() < 0.5)
        ? 'VOLCANIC_FLOOR2'
        : (B.floor === 'TOXIC_FLOOR')
          ? (() => { const r = Math.random(); return r < 0.45 ? 'TOXIC_FLOOR' : r < 0.72 ? 'TOXIC_FLOOR2' : 'TOXIC_FLOOR3'; })()
          : B.floor;
      row.push({type: floorType});
    }
    grid.push(row);
  }

  // ── ANCIENT: heightmap-based terrain for natural feel ──────────
  if(biomeKey === 'ANCIENT'){
    const apx1=Math.random()*99, apy1=Math.random()*99;
    const apx2=Math.random()*99, apy2=Math.random()*99;
    const apx3=Math.random()*99, apy3=Math.random()*99;
    function aHeight(x,y){
      const nx=x/W, ny=y/H;
      let h  = Math.sin((nx+apx1)*2.3*Math.PI)*Math.cos((ny+apy1)*1.9*Math.PI)*0.40;
          h += Math.sin((nx+apx2)*4.7*Math.PI)*Math.cos((ny+apy2)*3.9*Math.PI)*0.30;
          h += Math.sin((nx+apx3)*8.9*Math.PI)*Math.cos((ny+apy3)*7.3*Math.PI)*0.20;
      return h;
    }
    // Fill everything as open floor first
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        grid[y][x] = {type:'EARTH_FLOOR'};
      }
    }
    // No scattered ruin/rock objects — structures only come from the ruins generator below
  }

  if(biomeKey === 'VOLCANIC'){
    // ── Per-planet hilliness: continuous spectrum 0.0–0.9 ────
    // Weighted toward 0.5–0.9 (hilly); flat planets are rare
    const h01 = Math.random();
    const hilliness = h01 < 0.10 ? Math.random() * 0.20          // 10% chance: flat (0.0–0.20)
                    : h01 < 0.25 ? 0.20 + Math.random() * 0.30   // 15% chance: moderate (0.20–0.50)
                    : 0.50 + Math.random() * 0.40;                // 75% chance: hilly (0.50–0.90)
    const numRanges    = Math.max(1, Math.round(1 + hilliness * 4));
    const rangeLen     = Math.round(4 + hilliness * 18 + rnd(4));
    const numBoulders  = Math.round(8 + hilliness * 14 + rnd(6));
    const thickenChance= 0.15 + hilliness * 0.50;
    const stampRock = (x,y) => {
      if(x<0||y<0||x>=W||y>=H) return;
      if(grid[y][x].type===B.floor||grid[y][x].type==='VOLCANIC_FLOOR2'){
        grid[y][x] = {type: Math.random()<0.6 ? B.rock : B.rock2};
      }
    };

    // Phase 1: mountain ranges — long drunken walks with occasional width
    for(let r=0;r<numRanges;r++){
      let rx = rnd(W);
      let ry = rnd(H);
      const len = rangeLen;
      const biasDx = Math.random()<0.5 ? 1 : 0;
      const biasDy = biasDx ? 0 : 1;
      for(let step=0;step<len;step++){
        stampRock(rx, ry);
        if(Math.random()<thickenChance){
          stampRock((rx+(biasDy?rnd(3)-1:0)+W)%W, (ry+(biasDx?rnd(3)-1:0)+H)%H);
        }
        if(Math.random()<thickenChance*0.45){
          stampRock((rx+(biasDy?(rnd(3)-1)*2:0)+W)%W, (ry+(biasDx?(rnd(3)-1)*2:0)+H)%H);
        }
        const roll = Math.random();
        if(roll < 0.55){
          rx += biasDx * (Math.random()<0.8?1:-1);
          ry += biasDy * (Math.random()<0.8?1:-1);
        } else if(roll < 0.85){
          rx += biasDy * (rnd(3)-1);
          ry += biasDx * (rnd(3)-1);
        } else {
          rx += rnd(3)-1; ry += rnd(3)-1;
        }
        rx = (rx+W)%W;
        ry = (ry+H)%H;
      }
    }

    // Phase 2: lone boulders and small clusters scattered around
    for(let b=0;b<numBoulders;b++){
      const bx = rnd(W);
      const by = rnd(H);
      const clusterSize = Math.random()<0.3 ? 1 : 2+rnd(3);
      for(let c=0;c<clusterSize;c++){
        stampRock((bx+rnd(3)-1+W)%W, (by+rnd(3)-1+H)%H);
      }
    }
  } else if(biomeKey === 'DESERT' || biomeKey === 'TOXIC'){
    // ── Cluster + range placement for desert and toxic ────────
    const h01 = Math.random();
    const hilliness = h01 < 0.10 ? Math.random() * 0.20
                    : h01 < 0.25 ? 0.20 + Math.random() * 0.30
                    : 0.50 + Math.random() * 0.40;
    const numRanges    = Math.max(1, Math.round(1 + hilliness * 3.5));
    const rangeLen     = Math.round(4 + hilliness * 14 + rnd(4));
    const numBoulders  = Math.round(8 + hilliness * 12 + rnd(6));
    const thickenChance= 0.12 + hilliness * 0.45;
    const stampRock2 = (sx,sy) => {
      if(sx<0||sy<0||sx>=W||sy>=H) return;
      const ct = grid[sy][sx].type;
      if(ct===B.floor || ct==='TOXIC_FLOOR2' || ct==='TOXIC_FLOOR3'){
        grid[sy][sx] = {type: Math.random()<0.5 ? B.rock : B.rock2};
      }
    };
    for(let r=0;r<numRanges;r++){
      let rx=rnd(W), ry=rnd(H);
      const biasDx=Math.random()<0.5?1:0, biasDy=biasDx?0:1;
      for(let step=0;step<rangeLen;step++){
        stampRock2(rx,ry);
        if(Math.random()<thickenChance) stampRock2((rx+(biasDy?rnd(3)-1:0)+W)%W,(ry+(biasDx?rnd(3)-1:0)+H)%H);
        if(Math.random()<thickenChance*0.4) stampRock2((rx+(biasDy?(rnd(3)-1)*2:0)+W)%W,(ry+(biasDx?(rnd(3)-1)*2:0)+H)%H);
        const roll=Math.random();
        if(roll<0.55){ rx+=biasDx*(Math.random()<0.8?1:-1); ry+=biasDy*(Math.random()<0.8?1:-1); }
        else if(roll<0.85){ rx+=biasDy*(rnd(3)-1); ry+=biasDx*(rnd(3)-1); }
        else { rx+=rnd(3)-1; ry+=rnd(3)-1; }
        rx=(rx+W)%W; ry=(ry+H)%H;
      }
    }
    for(let b=0;b<numBoulders;b++){
      const bx=rnd(W), by=rnd(H);
      const cs=Math.random()<0.35?1:2+rnd(3);
      for(let ci=0;ci<cs;ci++) stampRock2((bx+rnd(3)-1+W)%W,(by+rnd(3)-1+H)%H);
    }
  } else if(['FROZEN','ASTEROID','BLOOM','MOON_ROCK','MOON_ICE','MOON_TOXIC'].includes(biomeKey)){
    // ── Cluster + hilliness for these biomes ─────────────────
    const h01 = Math.random();
    const hilliness = h01 < 0.10 ? Math.random() * 0.20
                    : h01 < 0.25 ? 0.20 + Math.random() * 0.30
                    : 0.50 + Math.random() * 0.40;
    // Each biome has a character: asteroid is dense, frozen is spaced, moons mid
    const baseDensity = B.rockDensity || 0.18;
    // Scale range count and length by base density so dense biomes stay dense
    const densityScale = baseDensity / 0.18;
    const numRanges   = Math.max(1, Math.round((1 + hilliness * 4) * densityScale));
    const rangeLen    = Math.round((4 + hilliness * 14 + rnd(4)) * densityScale);
    const numBoulders = Math.round((8 + hilliness * 12 + rnd(6)) * densityScale);
    const thickenChance = 0.10 + hilliness * 0.48;
    const stampRock3 = (sx,sy) => {
      if(sx<0||sy<0||sx>=W||sy>=H) return;
      if(grid[sy][sx].type===B.floor||grid[sy][sx].type===B.floor+'2'){
        grid[sy][sx] = {type: Math.random()<0.5 ? B.rock : B.rock2};
      }
    };
    for(let r=0;r<numRanges;r++){
      let rx=rnd(W), ry=rnd(H);
      const biasDx=Math.random()<0.5?1:0, biasDy=biasDx?0:1;
      for(let step=0;step<rangeLen;step++){
        stampRock3(rx,ry);
        if(Math.random()<thickenChance) stampRock3((rx+(biasDy?rnd(3)-1:0)+W)%W,(ry+(biasDx?rnd(3)-1:0)+H)%H);
        if(Math.random()<thickenChance*0.4) stampRock3((rx+(biasDy?(rnd(3)-1)*2:0)+W)%W,(ry+(biasDx?(rnd(3)-1)*2:0)+H)%H);
        const roll=Math.random();
        if(roll<0.55){ rx+=biasDx*(Math.random()<0.8?1:-1); ry+=biasDy*(Math.random()<0.8?1:-1); }
        else if(roll<0.85){ rx+=biasDy*(rnd(3)-1); ry+=biasDx*(rnd(3)-1); }
        else { rx+=rnd(3)-1; ry+=rnd(3)-1; }
        rx=(rx+W)%W; ry=(ry+H)%H;
      }
    }
    for(let b=0;b<numBoulders;b++){
      const bx=rnd(W), by=rnd(H);
      const cs=Math.random()<0.35?1:2+rnd(3);
      for(let ci=0;ci<cs;ci++) stampRock3((bx+rnd(3)-1+W)%W,(by+rnd(3)-1+H)%H);
    }
  } else {
    // ── Remaining biomes (HABITABLE, etc.): original scatter ─
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        if(Math.random()<B.rockDensity){
          grid[y][x] = {type: Math.random()<0.5 ? B.rock : B.rock2};
        }
      }
    }
  }

  // ── Compute rockMask + grid position for procedural draw variation ──
  if(biomeKey === 'VOLCANIC' || biomeKey === 'DESERT' || biomeKey === 'TOXIC'){
    const isRock2 = (gx,gy) => {
      if(gx<0||gy<0||gx>=W||gy>=H) return false;
      const t=grid[gy][gx].type;
      return t===B.rock||t===B.rock2;
    };
    const prefix = biomeKey==='VOLCANIC'?'volcanic_rock':biomeKey==='DESERT'?'desert_rock':'toxic_rock';
    for(let gy=0;gy<H;gy++){
      for(let gx=0;gx<W;gx++){
        if(isRock2(gx,gy)){
          grid[gy][gx]._gx=gx;
          grid[gy][gx]._gy=gy;
          grid[gy][gx].rockMask=
            (isRock2(gx,gy-1)?1:0)|
            (isRock2(gx+1,gy)?2:0)|
            (isRock2(gx,gy+1)?4:0)|
            (isRock2(gx-1,gy)?8:0);
          // Assign pre-rendered variant sprite
          const vi=(gx*7+gy*13)%16;
          grid[gy][gx]._sprite=prefix+'_v'+vi;
        }
      }
    }
  }
  // ── Hazard placement ─────────────────────────────────────────
  const hazards = B.hazards || [];

  // Helper: is this cell a walkable floor tile for this biome (including variants)?
  const isFloorCell = (t) => t===B.floor || t==='VOLCANIC_FLOOR2' || t==='TOXIC_FLOOR2' || t==='TOXIC_FLOOR3';

  if(B.special==='LAVA' || hazards.includes('LAVA_FLOOR')){
    for(let i=0;i<12;i++){
      let lx=2+rnd(W-4), ly=2+rnd(H-4);
      const len=2+rnd(4);
      for(let j=0;j<len;j++){
        if(lx>=0&&lx<W&&ly>=0&&ly<H && isFloorCell(grid[ly][lx].type)) grid[ly][lx].type='LAVA_FLOOR';
        lx+=rnd(3)-1; ly+=rnd(3)-1;
        lx=Math.max(1,Math.min(W-2,lx)); ly=Math.max(1,Math.min(H-2,ly));
      }
    }
    for(let i=0;i<8;i++){
      let lx=2+rnd(W-4), ly=2+rnd(H-4);
      const len=3+rnd(5);
      for(let j=0;j<len;j++){
        if(lx>=0&&lx<W&&ly>=0&&ly<H && isFloorCell(grid[ly][lx].type))
          grid[ly][lx].type='LAVA_FLOOR';
        lx+=rnd(3)-1; ly+=rnd(3)-1;
        lx=Math.max(1,Math.min(W-2,lx)); ly=Math.max(1,Math.min(H-2,ly));
      }
    }
  }

  if(hazards.includes('GEYSER')){
    const numGeysers = 3 + rnd(4);
    for(let i=0;i<numGeysers;i++){
      let gx,gy,t=0;
      do{ gx=2+rnd(W-4); gy=2+rnd(H-4); t++; }
      while(( !isFloorCell(grid[gy][gx].type) ) && t<100);
      if(t<100) grid[gy][gx].type='GEYSER';
    }
  }

  if(hazards.includes('AMMONIA') && Math.random()<0.6){
    for(let i=0;i<5+rnd(5);i++){
      let ax=2+rnd(W-4), ay=2+rnd(H-4);
      const len=2+rnd(6);
      for(let j=0;j<len;j++){
        if(ax>=0&&ax<W&&ay>=0&&ay<H && isFloorCell(grid[ay][ax].type))
          grid[ay][ax].type='AMMONIA';
        ax+=rnd(3)-1; ay+=rnd(3)-1;
        ax=Math.max(1,Math.min(W-2,ax)); ay=Math.max(1,Math.min(H-2,ay));
      }
    }
  }

  // Place loot — add per-planet variance (±~40% of base, min 1 if base > 0)
  const _mVar = B.minerals > 0 ? Math.max(1, Math.floor(B.minerals * 0.4)) : 0;
  const _sVar = (B.mineralSamples||0) > 0 ? Math.max(1, Math.floor((B.mineralSamples||0) * 0.4)) : 0;
  const _mCount = B.minerals > 0 ? B.minerals + rnd(_mVar*2+1) - _mVar : 0;
  const _sCount = (B.mineralSamples||0) > 0 ? (B.mineralSamples||0) + rnd(_sVar*2+1) - _sVar : 0;
  for(let i=0;i<_mCount;i++) placeTile(grid,'MINERAL',B.floor,{oreType:pickOreForBiome(biomeKey)});
  for(let i=0;i<_sCount;i++) placeTile(grid,'MINERAL_SAMPLE',B.floor,{biome:biomeKey});
  // ANCIENT artifacts are placed inside buildings (see below), not on open floor

  // ── Ancient ruins: roads, buildings, outposts, statues, overgrowth ──────────
  if(biomeKey==='ANCIENT'){
    placeAncientRuinsOnPlanet(grid, W, H, key, B.floor);
  }

  // 10% chance of a cave entrance on rocky planets
  if(B.rockDensity > 0 && Math.random() < 0.10){
    // Place on a rock tile — visually distinct from regular rocks
    let cex,cey,ct=0;
    do{ cex=2+rnd(W-4); cey=2+rnd(H-4); ct++; }
    while(ct<300 && grid[cey][cex].type!==B.rock && grid[cey][cex].type!==B.rock2);
    if(ct<300) grid[cey][cex]={type:'CAVE_ENTRANCE', caveKey:key+':cave'};
  }

  // Enemies — procedurally generated per planet
  const enemies = spawnCreatures(key, biomeKey, grid, B.aliens, B.floor, B.bossAlways);
  // Biodata only on planets that actually have lifeforms
  if(enemies.length > 0){
    for(let i=0;i<B.biodata;i++) placeTile(grid,'BIODATA',B.floor);
  }

  // ── Scattered ancient ruins — rare independent chance on eligible biomes ──────
  const _ruinEligible = ['HABITABLE','FROZEN','DESERT','MOON_ROCK'];
  if(_ruinEligible.includes(biomeKey) && Math.random() < 0.04){
    placeAncientRuinsOnPlanet(grid, W, H, key, B.floor);
    G._scatteredRuinsCount = (G._scatteredRuinsCount || 0) + 1;
  }

  // Ship landing pad — spawn on floor tile
  let sx,sy,st=0;
  do{ sx=1+rnd(W-2); sy=1+rnd(H-2); st++; }
  while(grid[sy][sx].type!==B.floor && grid[sy][sx].type!=='VOLCANIC_FLOOR2' && grid[sy][sx].type!=='TOXIC_FLOOR2' && grid[sy][sx].type!=='TOXIC_FLOOR3' && grid[sy][sx].type!=='ANCIENT_ROAD' && grid[sy][sx].type!=='ANCIENT_OUTPOST' &&st<200);
  const _underShip = grid[sy][sx].type;
  grid[sy][sx] = { type:'SHIP', _underFloor: _underShip };

  G.planets[key]={ grid, spawnX:sx, spawnY:sy, biome:biomeKey, visited: new Array(W*H).fill(false), explored: new Array(W*H).fill(false), planetTurn:0, surveySoldValue:0, spawnedAliens: enemies.length };
  G.enemies[key]=enemies;
  if(spawnCreatures._pendingTemplates){
    G.planets[key].creatureTemplates = spawnCreatures._pendingTemplates;
    spawnCreatures._pendingTemplates = null;
  }
  initPlanetHazards(key, biomeKey);
}

// Returns true if it is currently night on the given planet
// Returns 'day' | 'dawn' | 'dusk' | 'night'
// Derived from the cosine vision curve so the label always matches the actual light level.
// vr>=8 = day, vr>=5.5 = dawn or dusk (rising vs falling), vr<5.5 = night side
// Fire phase-transition log messages based on vr crossing perceptual thresholds.
// Called after planetTurn is incremented; vrBefore/vrAfter are raw cosine vr values.
