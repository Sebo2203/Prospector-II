// ═════════════════════════════════════════════════════════════════
// END DEAD CODE — HUMANITY ARC SCREEN
// ═════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────
const STAR_TYPES = {
  YELLOW: {
    col:'#ffcc44', glowCol:'#ff9900', size:5,
    label:'Yellow Dwarf',
    // inner→outer biome pools by orbit slot
    orbitBiomes: [
      ['VOLCANIC','DESERT','DESERT'],         // slot 0 — close, hot
      ['DESERT','HABITABLE','HABITABLE'],     // slot 1
      ['HABITABLE','FROZEN','FROZEN'],        // slot 2
      ['FROZEN','GAS_GIANT','ASTEROID'],      // slot 3 — far, cold
    ],
  },
  RED: {
    col:'#ff4422', glowCol:'#cc2200', size:7,
    label:'Red Giant',
    orbitBiomes: [
      ['VOLCANIC','VOLCANIC','TOXIC'],
      ['VOLCANIC','DESERT','TOXIC'],
      ['DESERT','FROZEN','TOXIC'],
      ['FROZEN','GAS_GIANT','ASTEROID'],
    ],
  },
  BLUE: {
    col:'#aaccff', glowCol:'#4488ff', size:4,
    label:'Blue Star',
    orbitBiomes: [
      ['VOLCANIC','ASTEROID','TOXIC'],
      ['TOXIC','ASTEROID','FROZEN'],
      ['FROZEN','GAS_GIANT','ASTEROID'],
      ['ASTEROID','ANCIENT'],               // slot 3 — rare ruins only here
    ],
  },
  WHITE: {
    col:'#eeeeff', glowCol:'#aaaacc', size:3,
    label:'White Dwarf',
    orbitBiomes: [
      ['ASTEROID','VOLCANIC','TOXIC'],
      ['ASTEROID','FROZEN','ANCIENT'],      // slot 1 — one chance at ruins
      ['FROZEN','GAS_GIANT','FROZEN'],
      ['GAS_GIANT','HABITABLE','FROZEN'],
    ],
  },
};

const SYSTEM_NAMES = [
  'Kepler','Sigma Draconis','Tau Ceti','Vega','Proxima',
  'Sirius','Rigel','Deneb','Antares','Arcturus','Aldebaran',
  'Castor','Pollux','Regulus','Spica','Altair','Fomalhaut',
  'Capella','Betelgeuse','Canopus','Achernar','Hadar','Acrux',
  'Mimosa','Gacrux','Shaula','Sargas','Kaus Australis','Atria',
  'Alnair','Regor','Alsephina','Avior','Suhail','Miaplacidus',
  'Nunki','Sabik','Phecda','Naos','Almach','Alnitak','Saiph',
  'Wezen','Adhara','Aludra','Alhena','Menkib','Hassaleh',
  'Eltanin','Rasalhague',
  // Additional real stars
  'Procyon','Acrab','Dschubba','Jabbah','Graffias','Zubenelgenubi',
  'Zubeneschamali','Unukalhai','Alya','Kochab','Pherkad','Thuban',
  'Alderamin','Alfirk','Errai','Caph','Shedar','Achird','Ruchbah',
  'Segin','Navi','Mirach','Almach','Adhil','Alpherg','Alrescha',
  'Mesarthim','Hamal','Sheratan','Botein','Teegarden','Lacaille',
  'Barnard','Wolf','Luyten','Kapteyn','Groombridge','Gliese',
  'Mira','Menkar','Kaffaljidhma','Baten Kaitos','Diphda','Ankaa',
  'Albereo','Rukh','Sadr','Gienah','Azelfafage','Fawaris','Sualocin',
  'Rotanev','Tarazed','Okab','Alshain','Enif','Homam','Sadalbari',
  'Biham','Markab','Scheat','Matar','Sadachbia','Sadalsuud','Albali',
  'Ancha','Situla','Sadalmelik','Nashira','Dabih','Algedi','Deneb Algedi',
  'Nusakan','Alphecca','Gemma','Muphrid','Seginus','Izar','Merga',
  'Nekkar','Alkalurops','Xuange','Pulcherrima','Asellus Primus','Ceginus',
  // Fictional / procedural feel
  'Vorthaan','Kurell','Dessik','Pyreth','Valconis','Naerath','Soreth',
  'Drevon','Isharaan','Quellis','Tharux','Obelvane','Zettari','Corvaal',
  'Melvorn','Haxxis','Druunal','Sherath','Vantecor','Iorath','Quelanthos',
  'Borethis','Ylessian','Praxidus','Umbrael','Crethis','Zolvath','Aethon',
].sort(()=>Math.random()-0.5);

// ─────────────────────────────────────────────────────────────────
//  GALAXY GENERATION — star systems
// ─────────────────────────────────────────────────────────────────
function generateGalaxy() {
  const grid = [];
  for (let y=0;y<MAP_H;y++){
    const row=[];
    for(let x=0;x<MAP_W;x++) row.push({type:'VOID'});
    grid.push(row);
  }
  // Nebula clusters: organic blobs, with at most one rare massive cloud.
  const numNebulae = scaledGalaxyCount(4, 4); // scales with galaxy area
  const massiveNebulaIndex = Math.random() < 0.10 ? rnd(numNebulae) : -1;
  for(let n=0; n<numNebulae; n++){
    const cx = 5 + rnd(MAP_W-10);
    const cy = 3 + rnd(MAP_H-8);
    const nebulaVariant = Math.random() < 0.4 ? 'blue' : 'pink';
    const massive = n === massiveNebulaIndex;
    const expansive = massive || Math.random() < 0.3;
    const size = massive
      ? Math.floor(MAP_W * MAP_H * (0.12 + Math.random() * 0.08))
      : (expansive ? 36 + rnd(50) : 15 + rnd(21)); // 15-35, sometimes 36-85 tiles; rare clouds reach 12-20% of the map
    const cells = [{x:cx,y:cy}];
    grid[cy][cx] = { type:'NEBULA', nebulaVariant, expansive, massive };
    for(let s=1, guard=0; s<size && guard<size*24; guard++){
      const src = cells[rnd(cells.length)];
      const dirs = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]];
      const [ddx,ddy] = dirs[rnd(dirs.length)];
      const nx = src.x+ddx, ny = src.y+ddy;
      if(nx>=1&&nx<MAP_W-1&&ny>=1&&ny<MAP_H-1&&grid[ny][nx].type==='VOID'){
        grid[ny][nx] = { type:'NEBULA', nebulaVariant, expansive, massive };
        cells.push({x:nx,y:ny});
        s++;
      }
    }
  }

  // ── Nebula Gas Entities — predatory cloud beings ──────────────────────────
  // Spawn 1-2 entities per game. Each inhabits a nebula region — massive nebulae
  // always spawn one; normal/expansive nebulae have a small chance.
  G.gasEntities = [];
  {
    // Collect all nebula tiles grouped by their nebula cluster (flood-fill by adjacency)
    const nebulaTiles = [];
    for(let gy=0;gy<MAP_H;gy++) for(let gx=0;gx<MAP_W;gx++)
      if(grid[gy][gx].type==='NEBULA') nebulaTiles.push({x:gx,y:gy,cell:grid[gy][gx]});

    // Build cluster groups via simple union-find (label connected components)
    const label = new Array(MAP_W*MAP_H).fill(-1);
    let clusterCount = 0;
    for(let i=0;i<nebulaTiles.length;i++){
      const {x,y} = nebulaTiles[i];
      if(label[y*MAP_W+x] !== -1) continue;
      // BFS
      const queue = [{x,y}];
      label[y*MAP_W+x] = clusterCount;
      let qi=0;
      while(qi<queue.length){
        const {x:cx2,y:cy2}=queue[qi++];
        for(const [ox,oy] of [[-1,0],[1,0],[0,-1],[0,1]]){
          const nx2=cx2+ox,ny2=cy2+oy;
          if(nx2<0||nx2>=MAP_W||ny2<0||ny2>=MAP_H) continue;
          if(label[ny2*MAP_W+nx2]!==-1) continue;
          if(grid[ny2][nx2].type!=='NEBULA') continue;
          label[ny2*MAP_W+nx2]=clusterCount;
          queue.push({x:nx2,y:ny2});
        }
      }
      clusterCount++;
    }

    // Group tiles by cluster id
    const clusters = [];
    for(let cl=0;cl<clusterCount;cl++) clusters.push([]);
    nebulaTiles.forEach(({x,y,cell})=>{ const l=label[y*MAP_W+x]; if(l>=0) clusters[l].push({x,y,cell}); });

    // Decide which clusters spawn a gas entity
    clusters.forEach(tiles=>{
      if(!tiles.length) return;
      const isMassive = tiles.some(t=>t.cell.massive);
      const isExpansive = tiles.some(t=>t.cell.expansive);
      const spawnChance = isMassive ? 1.0 : (isExpansive ? 0.35 : 0.08);
      if(Math.random() > spawnChance) return;
      // Pick a random tile in this cluster as spawn point
      const tile = tiles[Math.floor(Math.random()*tiles.length)];
      const variant = tiles[0].cell.nebulaVariant || 'pink';
      // Stats scale with cluster size: large clusters = stronger entity
      const sizeFactor = Math.min(1.0, tiles.length / 60);
      const hp = Math.round(120 + sizeFactor * 140);  // 120-260 HP
      const atk = Math.round(16 + sizeFactor * 10);   // 16-26 ATK (flagship level+)
      G.gasEntities.push({
        x: tile.x, y: tile.y,
        alive: true,
        variant,          // 'blue' or 'pink' — matches host nebula
        isMassive,
        hp, maxHp:hp,
        atk,
        engineRating: 3,  // fast inside nebula — always pursues at full speed
        shields: 0, maxShields: 0,
        guns: 1,
        name: isMassive ? 'Void Devourer' : 'Nebula Wraith',
        _chaseTurns: 0,
        _homeCluster: tiles.map(t=>({x:t.x,y:t.y})),  // all tiles of its home nebula
      });
    });
  }

  // Stations are random, but always far enough apart to matter and close enough
  // that the shortest-range starter ship can make the direct trip on one tank.
  const stationPair = chooseStationPair(grid);
  const bx=stationPair.alpha.x, by=stationPair.alpha.y;
  grid[by][bx]={type:'BASE', name:'Starbase Alpha'};

  const b2x=stationPair.omega.x, b2y=stationPair.omega.y;
  grid[b2y][b2x]={type:'BASE', name:'Waypoint Omega'};
  G.bases = [
    { x:bx, y:by, name:'Starbase Alpha' },
    { x:b2x, y:b2y, name:'Waypoint Omega' },
  ];

  // Casino station — one random location, away from both bases
  let casinoPlaced = false;
  for(let attempt=0; attempt<200 && !casinoPlaced; attempt++){
    const cx2 = 8 + rnd(MAP_W-16);
    const cy2 = 4 + rnd(MAP_H-10);
    const distB1 = Math.abs(cx2-bx)+Math.abs(cy2-by);
    const distB2 = Math.abs(cx2-b2x)+Math.abs(cy2-b2y);
    if(grid[cy2][cx2].type==='VOID' && distB1>12 && distB2>12){
      grid[cy2][cx2] = { type:'CASINO', name:'The Void Royale' };
      casinoPlaced = true;
    }
  }

  // Spawn 1-2 derelict stations
  const DERELICT_NAMES = [
    'DSS Erebus','DSS Vanguard','Station Threnody','Station Morrow',
    'DSS Koval','Outpost Silica','DSS Heliodor','Station Lacuna',
  ];
  const numDerelicts = scaledGalaxyCount(1, 2);
  G.derelicts = G.derelicts || [];
  for(let di=0; di<numDerelicts; di++){
    let dx, dy, dt=0;
    do{
      dx = 8 + rnd(MAP_W-16);
      dy = 4 + rnd(MAP_H-10);
      dt++;
    } while(dt<300 && (grid[dy][dx].type !== 'VOID' ||
      Math.abs(dx-bx)<10 || Math.abs(dy-by)<10 ||
      Math.abs(dx-b2x)<10 || Math.abs(dy-b2y)<10));
    if(dt >= 300) continue;
    const dname = DERELICT_NAMES[(di + rnd(DERELICT_NAMES.length)) % DERELICT_NAMES.length];
    grid[dy][dx] = { type:'DERELICT', name:dname };
    G.derelicts.push({ x:dx, y:dy, name:dname });
  }

  // Black holes — 1 to 3 per galaxy, deadly to enter
  const numBlackHoles = 1 + rnd(3);
  G.blackHoles = [];
  for(let bhi=0; bhi<numBlackHoles; bhi++){
    let bhx, bhy, bht=0;
    do{
      bhx = 10 + rnd(MAP_W-20);
      bhy = 4  + rnd(MAP_H-10);
      bht++;
    } while(bht<300 && (
      grid[bhy][bhx].type !== 'VOID' ||
      Math.abs(bhx-bx)+Math.abs(bhy-by) < 12 ||
      Math.abs(bhx-b2x)+Math.abs(bhy-b2y) < 12 ||
      G.blackHoles.some(h=>Math.abs(bhx-h.x)+Math.abs(bhy-h.y)<8)
    ));
    if(bht>=300) continue;
    grid[bhy][bhx] = { type:'BLACK_HOLE', name:'Singularity' };
    G.blackHoles.push({ x:bhx, y:bhy });
  }

  // Pulsars — rare (0–2 per galaxy, ~30% chance of any spawning), lethal radiation source
  G.pulsars = [];
  const numPulsars = Math.random() < 0.30 ? 1 + (Math.random() < 0.25 ? 1 : 0) : 0;
  for(let pui=0; pui<numPulsars; pui++){
    let pux, puy, put=0;
    do{
      pux = 10 + rnd(MAP_W-20);
      puy = 4  + rnd(MAP_H-10);
      put++;
    } while(put<300 && (
      grid[puy][pux].type !== 'VOID' ||
      Math.abs(pux-bx)+Math.abs(puy-by) < 14 ||
      Math.abs(pux-b2x)+Math.abs(puy-b2y) < 14 ||
      G.pulsars.some(p=>Math.abs(pux-p.x)+Math.abs(puy-p.y)<10) ||
      G.blackHoles.some(h=>Math.abs(pux-h.x)+Math.abs(puy-h.y)<8)
    ));
    if(put >= 300) continue;
    const puNames = [
      'PSR J-0437','PSR Verdant','Neutron Scar','PSR Ashfall',
      'The Whispering Star','PSR Koval-7','Spindown Echo','PSR Ironveil',
    ];
    const puName = puNames[pui % puNames.length];
    grid[puy][pux] = { type:'PULSAR', name:puName };
    G.pulsars.push({ x:pux, y:puy, name:puName });
  }

  // Rogue planet — rare (~15% chance), a single sunless world drifting alone
  G.roguePlanets = [];
  if(Math.random() < 0.15){
    let rpx, rpy, rpt=0;
    do{
      rpx = 8 + rnd(MAP_W-16);
      rpy = 4  + rnd(MAP_H-10);
      rpt++;
    } while(rpt<300 && (
      grid[rpy][rpx].type !== 'VOID' ||
      Math.abs(rpx-bx)+Math.abs(rpy-by) < 10 ||
      Math.abs(rpx-b2x)+Math.abs(rpy-b2y) < 10
    ));
    if(rpt < 300){
      const rpNames = [
        'Erebus Vagrant','The Dark Wanderer','Nox Drifter',
        'Pale Vagrant','The Unmoored','Void Pilgrim',
        'Tenebris Body','The Cold One',
      ];
      const rpName = pick(rpNames);
      // Give it a landable FROZEN planet descriptor — no star, just one cold world
      const rpBiome = pick(['FROZEN','MOON_ROCK','MOON_ICE','ASTEROID']);
      const rpBiomeName = BIOMES[rpBiome]?.name || rpBiome;
      const rpPlanetDesc = {
        name: rpName,
        biome: rpBiome,
        biomeName: rpBiomeName,
        orbitSlot: 0,
        scanState: 'none',
        avgTemp: -200 + rnd(60),
        gravity: (1.5 + Math.random()*5).toFixed(1),
        atmosphere: 'None',
        radius: (0.4 + Math.random()*0.8).toFixed(2),
      };
      grid[rpy][rpx] = { type:'ROGUE_PLANET', name:rpName, planets:[rpPlanetDesc] };
      G.roguePlanets.push({ x:rpx, y:rpy, name:rpName });
    }
  }

  // Generate 50-100 star systems on the expanded galaxy map.
  const numSystems = 50 + rnd(51);
  const starTypeKeys = Object.keys(STAR_TYPES);
  for(let i=0; i<numSystems; i++){
    let sx,sy,t=0;
    do{ sx=5+rnd(MAP_W-10); sy=2+rnd(MAP_H-6); t++; }
    while(grid[sy][sx].type!=='VOID' && t<200);
    if(t>=200) continue;

    const starType = pick(starTypeKeys);
    const ST = STAR_TYPES[starType];
    const numPlanets = 1 + rnd(4);  // 1–4 planets
    const sysName = SYSTEM_NAMES[i] || ('System-'+i);

    // Build planet descriptors (biomes chosen by orbit slot)
    const planets = [];

    // Temperature ranges by biome (°C, min..max)
    const BIOME_TEMP = {
      HABITABLE:[-10,35], DESERT:[60,140], FROZEN:[-180,-40],
      ASTEROID:[-160,120], VOLCANIC:[300,900], TOXIC:[-20,80],
      ANCIENT:[-30,20], GAS_GIANT:[-140,-80],
      MOON_ROCK:[-150,80], MOON_ICE:[-200,-60], MOON_TOXIC:[-40,60],
    };
    // Gravity ranges by biome (m/s², Earth=9.8)
    const BIOME_GRAV = {
      HABITABLE:[7.5,12.0], DESERT:[2.5,6.5], FROZEN:[3.0,7.0],
      ASTEROID:[0.1,1.2], VOLCANIC:[5.0,10.5], TOXIC:[4.0,9.0],
      ANCIENT:[6.0,10.0], GAS_GIANT:[18.0,45.0],
      MOON_ROCK:[0.8,3.5], MOON_ICE:[0.5,2.5], MOON_TOXIC:[1.0,4.0],
    };
    // Atmosphere types by biome
    const BIOME_ATM = {
      HABITABLE:'Nitrogen/Oxygen', DESERT:'Thin CO₂', FROZEN:'Trace Nitrogen',
      ASTEROID:'None', VOLCANIC:'SO₂/CO₂', TOXIC:'Corrosive',
      ANCIENT:'Thin Argon', GAS_GIANT:'H₂/Helium',
      MOON_ROCK:'None', MOON_ICE:'Trace', MOON_TOXIC:'Acidic',
    };

    for(let p=0; p<numPlanets; p++){
      const slot = Math.min(p, ST.orbitBiomes.length-1);
      const biomeKey = pick(ST.orbitBiomes[slot]);
      const B = BIOMES[biomeKey];
      const romanSuffixes = ['I','II','III','IV','V','VI','VII','VIII','IX','X'];
      const suffix = numPlanets>1 ? ' '+(romanSuffixes[p] || (p+1).toString()) : '';

      // Generate planet stats
      const [tMin,tMax] = BIOME_TEMP[biomeKey]||[-50,50];
      const [gMin,gMax] = BIOME_GRAV[biomeKey]||[3,12];
      const avgTemp = Math.round(tMin + Math.random()*(tMax-tMin));
      const gravity = (gMin + Math.random()*(gMax-gMin)).toFixed(1);
      const atmosphere = BIOME_ATM[biomeKey]||'Unknown';
      // Planet radius 0.3x–2.5x Earth (1.0 = Earth)
      const radius = biomeKey==='GAS_GIANT' ? (8+Math.random()*14).toFixed(1)
                   : biomeKey==='ASTEROID'  ? (0.05+Math.random()*0.3).toFixed(2)
                   : (0.4+Math.random()*1.8).toFixed(2);

      const desc = {
        name:       sysName + suffix,
        biome:      biomeKey,
        biomeName:  B.name,
        orbitSlot:  p,
        // Planet stats
        avgTemp, gravity, atmosphere, radius,
      };
      // Special planet — independent 2% roll on any orbit slot.
      // The special type fully replaces the base planet, so no HABITABLE prerequisite.
      const _specialPool = ['RINGWORLD','DESTROYED_RINGWORLD','NUCLEAR_WAR','BLOOM','TALKING_TREES'];
      if(Math.random() < 0.02){
        const spt = _specialPool[rnd(_specialPool.length)];
        if(spt==='RINGWORLD'){
          desc.isRingworld = true;
          desc.biome = 'RINGWORLD';
          desc.biomeName = 'Ringworld Segment';
          desc.name = sysName + suffix + ' Ring';
          desc.atmosphere = 'Pressurised (artificial)';
          desc.gravity = '1.0';
          desc.radius = '—';
        } else if(spt==='DESTROYED_RINGWORLD'){
          desc.isDestroyedRingworld = true;
          desc.biome = 'DESTROYED_RINGWORLD';
          desc.biomeName = 'Destroyed Ringworld';
          desc.name = sysName + suffix + ' Ring (Debris)';
          desc.atmosphere = 'Hard Vacuum';
          desc.gravity = '0.0';
          desc.radius = '—';
        } else if(spt==='NUCLEAR_WAR'){
          desc.isNuclearWar = true;
          desc.biome = 'NUCLEAR_WAR';
          desc.biomeName = 'Dead World (Nuclear)';
          desc.name = sysName + suffix + ' (Dead)';
          desc.atmosphere = 'Irradiated CO₂';
          desc.gravity = (7.5+Math.random()*2.5).toFixed(1);
          desc.radius = (0.4+Math.random()*1.8).toFixed(2);
        } else if(spt==='BLOOM'){
          desc.isBloomWorld = true;
          desc.biome = 'BLOOM';
          desc.biomeName = 'Bloom World';
          desc.name = sysName + suffix + ' (Bloom)';
          desc.atmosphere = 'Nitrogen/Oxygen';
          desc.gravity = (7.5+Math.random()*2.5).toFixed(1);
          desc.radius = (0.4+Math.random()*1.8).toFixed(2);
        } else if(spt==='TALKING_TREES'){
          desc.isTalkingTreesWorld = true;
          desc.biome = 'TALKING_TREES';
          desc.biomeName = 'Whispering World';
          desc.name = sysName + suffix + ' (Whispering)';
          desc.atmosphere = 'Nitrogen/Oxygen';
          desc.gravity = (7.0+Math.random()*2.0).toFixed(1);
          desc.radius = (0.4+Math.random()*1.8).toFixed(2);
        }
      }

      // Gas giants may have 1–2 moons
      if(biomeKey==='GAS_GIANT'){
        const moonBiomes = ['MOON_ROCK','MOON_ICE','MOON_TOXIC'];
        const numMoons = 1 + rnd(2);
        desc.moons = [];
        for(let m=0; m<numMoons; m++){
          const mb = pick(moonBiomes);
          const [mtMin,mtMax] = BIOME_TEMP[mb]||[-150,50];
          const [mgMin,mgMax] = BIOME_GRAV[mb]||[0.5,3.5];
          desc.moons.push({
            name: desc.name + (numMoons>1 ? ' '+'abcd'[m] : ' Moon'),
            biome: mb, biomeName: BIOMES[mb].name, moonIdx: m,
            avgTemp: Math.round(mtMin + Math.random()*(mtMax-mtMin)),
            gravity: (mgMin + Math.random()*(mgMax-mgMin)).toFixed(1),
            atmosphere: BIOME_ATM[mb]||'Trace',
            radius: (0.1+Math.random()*0.4).toFixed(2),
          });
        }
        // 25% chance of an Ancient Refueling Station as an extra moon — one per galaxy
        if(Math.random() < 0.25 && !(G._ancientStationPlaced)){
          G._ancientStationPlaced = true;
          desc.moons.push({
            name: desc.name + ' Station',
            biome: 'ANCIENT_STATION',
            biomeName: 'Ancient Refueling Station',
            moonIdx: desc.moons.length,
            avgTemp: -60,
            gravity: '0.4',
            atmosphere: 'Vacuum',
            radius: '0.12',
            isAncientStation: true,
          });
        }
      }
      planets.push(desc);
    }

    grid[sy][sx] = {
      type:     'SYSTEM',
      name:     sysName,
      starType: starType,
      planets:  planets,
    };
  }

  G.ship.x = bx; G.ship.y = by;
  G.galaxy  = grid;

  // ── Pirate bases — placed first, pirates orbit them ──────────
  const PIRATE_BASE_NAMES = [
    'Scrapyard Station','The Wreck','Raider Outpost','Dead Anchor',
    'Corsair Hold','Salvager\'s Rest','Black Spur',
  ];
  const numBases = 1 + rnd(2); // 1-2 pirate bases per game
  G.pirateBases = [];
  for(let i=0; i<numBases; i++){
    let pbx, pby, t=0;
    do{
      pbx = 10 + rnd(MAP_W-20);
      pby = 4  + rnd(MAP_H-10);
      t++;
    } while(t<300 && (
      grid[pby][pbx].type!=='VOID' ||
      Math.abs(pbx-bx)+Math.abs(pby-by) < 15 ||   // away from friendly bases
      Math.abs(pbx-b2x)+Math.abs(pby-b2y) < 15 ||
      G.pirateBases.some(pb=>Math.abs(pbx-pb.x)+Math.abs(pby-pb.y)<10) // spread out
    ));
    if(t>=300) continue;
    const name = PIRATE_BASE_NAMES[i % PIRATE_BASE_NAMES.length];
    grid[pby][pbx] = { type:'PIRATE_BASE', name };
    G.pirateBases.push({ x:pbx, y:pby, name, hp:1000, maxHp:1000, destroyed:false, lastRespawn:0 });
  }

  // Pirate ship classes — strength scales with distance from friendly starbase
  const PIRATE_CLASSES = [
    { name:'Corvette',       hp:30,  maxHp:30,  atk:4,  engineRating:3, shields:0, maxShields:0, guns:1 },
    { name:'Frigate',        hp:50,  maxHp:50,  atk:6,  engineRating:3, shields:0, maxShields:0, guns:1 },
    { name:'Cruiser',        hp:80,  maxHp:80,  atk:9,  engineRating:2, shields:1, maxShields:1, guns:2 },
    { name:'Heavy Cruiser',  hp:120, maxHp:120, atk:12, engineRating:2, shields:2, maxShields:2, guns:2 },
    { name:'Battleship',     hp:180, maxHp:180, atk:16, engineRating:1, shields:3, maxShields:3, guns:3 },
    { name:'Flagship',       hp:260, maxHp:260, atk:21, engineRating:1, shields:5, maxShields:5, guns:4 },
  ];
  // Pirates start spawning at turn 50 — none at game start
  G.pirates = [];
  const pirateGuardTotalTarget = scaledGalaxyCount(8, 5); // scales with galaxy area
  G._pirateGuardPerBaseTarget = Math.max(1, Math.ceil(pirateGuardTotalTarget / 2)); // max two bases per game
  G._pirateGuardTarget = G._pirateGuardPerBaseTarget * Math.max(1, G.pirateBases.length);
  G._pirateRoamerTarget = scaledGalaxyCount(2, 2); // scales with galaxy area

  // ── Neutral ships ─────────────────────────────────────────────
  G.neutralShips = [];

  // Helper: build a patrol circuit of waypoints around a base
  function makePatrolRoute(bsx, bsy, radius, steps){
    const pts = [];
    for(let i=0; i<steps; i++){
      const angle = (i / steps) * Math.PI * 2;
      const px3 = Math.round(bsx + Math.cos(angle) * radius);
      const py3 = Math.round(bsy + Math.sin(angle) * (radius * 0.55)); // flatter ellipse
      pts.push({
        x: Math.max(1, Math.min(MAP_W-2, px3)),
        y: Math.max(1, Math.min(MAP_H-2, py3)),
      });
    }
    return pts;
  }

  // Roaming neutral ships: traders, cargo, science — 2 of each type
  const roamTypes = [
    { type:'trader',  name:'Merchant Vessel', rescueCost:200, fuelGift:60 },
    { type:'trader',  name:'Free Trader',     rescueCost:150, fuelGift:50 },
    { type:'cargo',   name:'Cargo Hauler',    rescueCost:0,   fuelGift:40 },
    { type:'cargo',   name:'Supply Runner',   rescueCost:0,   fuelGift:50 },
    { type:'science', name:'Survey Vessel',   rescueCost:0,   fuelGift:30 },
    { type:'science', name:'Research Ship',   rescueCost:0,   fuelGift:30 },
  ];
  roamTypes.forEach(tmpl=>{
    let nx2,ny2,t2=0;
    do{ nx2=5+rnd(MAP_W-10); ny2=2+rnd(MAP_H-6); t2++; }
    while(grid[ny2][nx2].type==='SYSTEM' && t2<200);

    const ns = {
      x:nx2, y:ny2,
      type:tmpl.type, name:tmpl.name,
      speed:1, rescueCost:tmpl.rescueCost, fuelGift:tmpl.fuelGift,
      rescuing:false,
      // cargo/trader: shuttle between bases; 0=heading to base1, 1=heading to base2
      destBase: rnd(2),
      // science: random wander target
      destX: 5+rnd(MAP_W-10), destY: 2+rnd(MAP_H-6),
    };
    G.neutralShips.push(ns);
  });

  // 2 patrol ships — one per base, each with its own circuit
  [[bx,by],[b2x,b2y]].forEach(([bsx,bsy])=>{
    const route = makePatrolRoute(bsx, bsy, 10, 10);
    G.neutralShips.push({
      x: route[0].x, y: route[0].y,
      type:'patrol', name:'Station Patrol',
      speed:2, rescueCost:0, fuelGift:70, rescuing:false,
      // patrol: step through waypoints
      patrolRoute: route,
      patrolIdx: 0,
      destBase: -1, destX:0, destY:0,
      homeX: bsx, homeY: bsy,   // home base coords for respawn
      lastRespawn: 0,            // turn when last respawned/spawned
    });
  });

  revealAround(bx, by, 5);
  revealAround(b2x, b2y, 1);
  addLog('Docked at '+grid[by][bx].name+'. Ready for departure.','li');
  addLog('Fly to a star system and press Enter to enter orbit.','li');
}

function revealAround(cx,cy,r){
  // Nebula tiles are visible (border shows) but block vision behind them
  function isNebula(x,y){
    if(x<0||x>=MAP_W||y<0||y>=MAP_H) return false;
    return G.galaxy[y][x].type==='NEBULA';
  }

  // Always reveal the origin tile
  G.visited[cy*MAP_W+cx]=true;

  // Shadowcasting — 8 octants
  function castLight(row,start,end,radius,xx,xy,yx,yy){
    if(start<end) return;
    const r2=radius*radius;
    let newStart=0, blocked=false;
    for(let j=row;j<=radius&&!blocked;j++){
      const dy=-j;
      for(let dx=-j;dx<=0;dx++){
        const lSlope=(dx-0.5)/(dy+0.5);
        const rSlope=(dx+0.5)/(dy-0.5);
        if(start<rSlope) continue;
        if(end>lSlope)   break;
        const ax=cx+dx*xx+dy*xy;
        const ay=cy+dx*yx+dy*yy;
        if(dx*dx+dy*dy<=r2){
          if(ax>=0&&ax<MAP_W&&ay>=0&&ay<MAP_H) G.visited[ay*MAP_W+ax]=true;
        }
        if(blocked){
          if(isNebula(ax,ay)){ newStart=rSlope; continue; }
          else{ blocked=false; start=newStart; }
        } else {
          if(isNebula(ax,ay)&&j<radius){
            blocked=true;
            castLight(j+1,start,lSlope,radius,xx,xy,yx,yy);
            newStart=rSlope;
          }
        }
      }
    }
  }

  const mult=[[1,0,0,-1,-1,0,0,1],[0,1,-1,0,0,-1,1,0],[0,1,1,0,0,-1,-1,0],[1,0,0,1,-1,0,0,-1]];
  for(let oct=0;oct<8;oct++)
    castLight(1,1.0,0.0,r,mult[0][oct],mult[1][oct],mult[2][oct],mult[3][oct]);
}

