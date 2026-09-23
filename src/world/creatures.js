// ─────────────────────────────────────────────────────────────────
//  PLANET GENERATION  (once per planet per game — key = "sx,sy:pIdx")
// ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────
//  PROCEDURAL CREATURE SYSTEM
//  generateCreatureTemplates(biomeKey) → array of species templates
//  spawnCreatures(key, biomeKey, grid, B) → populates G.enemies[key]
// ─────────────────────────────────────────────────────────────────

const CREATURE_NAME_PARTS = {
  prefix: ['Vorr','Sketh','Grall','Ixan','Thuul','Brax','Mekk','Solv','Drenn','Fael','Quor','Hesh','Zith','Aunk','Pelk'],
  mid:    ['ar','ek','ul','ith','on','ax','ei','or','un','al','ix','en','ok','ir','ym'],
  suffix: ['kai','tor','nak','vis','rel','don','zar','pel','win','oth','sur','fel','das','rek','ith'],
  adj:    ['Greater','Lesser','Common','Pale','Dark','Giant','Tiny','Crested','Horned','Scaled','Furred','Spined','Bloated','Swift','Silent'],
};

const CREATURE_BODY_TYPES = [
  { key:'quadruped', sprite:'creature_quadruped', sizeRange:[0.6,1.4], label:'four-legged creature' },
  { key:'serpent',   sprite:'creature_serpent',   sizeRange:[0.4,1.2], label:'serpentine creature' },
  { key:'floater',   sprite:'creature_floater',   sizeRange:[0.5,1.5], label:'floating organism' },
  { key:'crawler',   sprite:'creature_crawler',   sizeRange:[0.3,0.9], label:'many-legged crawler' },
  { key:'biped',     sprite:'creature_biped',     sizeRange:[0.8,1.8], label:'upright creature' },
  { key:'spiker',    sprite:'creature_spiker',    sizeRange:[0.4,1.0], label:'spined creature' },
  { key:'grazer',    sprite:'creature_grazer',    sizeRange:[1.0,2.2], label:'large grazing creature' },
  { key:'stalker',   sprite:'creature_stalker',   sizeRange:[0.7,1.6], label:'low-slung predator' },
];

// Colours per biome for creature tinting
const CREATURE_BIOME_COLS = {
  HABITABLE: ['#7a9e4a','#a0c060','#6b8c35','#c8a050','#88aa44'],
  DESERT:    ['#c8a050','#b08020','#d4b060','#a07030','#e0c070'],
  FROZEN:    ['#aaccee','#88aacc','#ccddff','#7799bb','#ddeeff'],
  VOLCANIC:  ['#cc4411','#aa2200','#dd6622','#883300','#ff5500'],
  TOXIC:     ['#44aa22','#22881a','#66cc33','#337711','#88ee44'],
  ASTEROID:  ['#888888','#aaaaaa','#666666','#999977','#777788'],
  ANCIENT:   ['#998877','#776655','#aa9988','#554433','#ccbbaa'],
  MOON_ROCK: ['#888899','#667788','#aabbcc','#556677','#99aabb'],
  MOON_ICE:  ['#aaccdd','#88bbcc','#ccddee','#77aacc','#bbddee'],
  MOON_TOXIC:['#556644','#667755','#778866','#445533','#889966'],
};

function creatureName(){
  const P = CREATURE_NAME_PARTS;
  const useAdj = Math.random() < 0.4;
  const base = pick(P.prefix) + pick(P.mid) + pick(P.suffix);
  return useAdj ? pick(P.adj)+' '+base : base;
}

function generateCreatureTemplates(biomeKey){
  // How many species on this planet? 1-4
  const numSpecies = 1 + Math.floor(Math.random()*4);
  const cols = CREATURE_BIOME_COLS[biomeKey] || CREATURE_BIOME_COLS.ASTEROID;
  const templates = [];

  // Always generate herbivores first — carnivores need them to exist
  const numHerb = Math.max(1, Math.ceil(numSpecies * (0.4 + Math.random()*0.4)));
  const numCarn = Math.random()<0.5 ? 0 : Math.min(numSpecies-numHerb, 1+Math.floor(Math.random()*2));
  const numOmni = numSpecies - numHerb - numCarn;

  const usedBodies = [];
  function pickBody(){
    const remaining = CREATURE_BODY_TYPES.filter(b=>!usedBodies.includes(b.key));
    const b = pick(remaining.length ? remaining : CREATURE_BODY_TYPES);
    usedBodies.push(b.key);
    return b;
  }

  // Herbivores
  for(let i=0;i<numHerb;i++){
    const body = pickBody();
    const [sMin,sMax] = body.sizeRange;
    const size = sMin + Math.random()*(sMax-sMin);
    // Herbivore behaviour: territorial (50%), coward (35%), docile (15%)
    const roll = Math.random();
    const behaviour = roll<0.5 ? 'TERRITORIAL' : roll<0.85 ? 'COWARD' : 'DOCILE';
    const territoryRange = 2 + Math.floor(Math.random()*3); // 2-4 tiles
    const calmRange = territoryRange + 3;
    // HP scales with size
    const maxHp = Math.round(size * (4 + Math.random()*6));
    templates.push({
      name: creatureName(),
      diet: 'herbivore',
      body: body.key,
      sprite: body.sprite,
      bodyLabel: body.label,
      size,
      colour: pick(cols),
      behaviour,
      speedRating: planetCritterSpeedRating({ body:body.key, size, behaviour }),
      hostileByDefault: false,
      territoryRange,
      calmRange,
      maxHp,
      atk: Math.max(1, Math.round(size * (1 + Math.random()*2))),
      def: Math.round(size * Math.random()),
    });
  }

  // Carnivores
  for(let i=0;i<numCarn;i++){
    const body = pickBody();
    const [sMin,sMax] = body.sizeRange;
    const size = sMin + Math.random()*(sMax-sMin);
    const behaviour = Math.random()<0.4 ? 'STALK' : 'HUNT';
    const maxHp = Math.round(size * (6 + Math.random()*8));
    templates.push({
      name: creatureName(),
      diet: 'carnivore',
      body: body.key,
      sprite: body.sprite,
      bodyLabel: body.label,
      size,
      colour: pick(cols),
      behaviour,
      speedRating: planetCritterSpeedRating({ body:body.key, size, behaviour }),
      hostileByDefault: true,
      territoryRange: 0,
      calmRange: 0,
      maxHp,
      atk: Math.max(2, Math.round(size * (2 + Math.random()*3))),
      def: Math.round(size * Math.random()),
    });
  }

  // Omnivores
  for(let i=0;i<numOmni;i++){
    const body = pickBody();
    const [sMin,sMax] = body.sizeRange;
    const size = sMin + Math.random()*(sMax-sMin);
    const maxHp = Math.round(size * (4 + Math.random()*7));
    templates.push({
      name: creatureName(),
      diet: 'omnivore',
      body: body.key,
      sprite: body.sprite,
      bodyLabel: body.label,
      size,
      colour: pick(cols),
      behaviour: 'TERRITORIAL',
      speedRating: planetCritterSpeedRating({ body:body.key, size, behaviour:'TERRITORIAL' }),
      hostileByDefault: false,
      territoryRange: 2 + Math.floor(Math.random()*2),
      calmRange: 5,
      maxHp,
      atk: Math.max(1, Math.round(size * (1.5 + Math.random()*2))),
      def: Math.round(size * Math.random()),
    });
  }

  return templates;
}

function spawnCreatures(key, biomeKey, grid, numAliens, floorType, bossAlways, anyLand=false){
  const B = BIOMES[biomeKey] || {};
  const isHostile = HOSTILE_BIOMES.has(biomeKey);
  // Roll whether this planet has creatures at all
  const alienChance = B.alienChance !== undefined ? B.alienChance : 1.0;
  if(Math.random() > alienChance) numAliens = 0;
  else {
    numAliens = 1 + Math.floor(Math.random() * numAliens);
    // Hostile biomes cap at 3 — these are solitary apex predators
    if(isHostile) numAliens = Math.min(numAliens, 3);
  }

  // For habitable planets, build a list of all valid land tiles upfront
  // so we never fail to place due to sparse floor type
  const WATER_TILES = new Set(['EARTH_WATER','LAVA','LAVA_FLOOR','AMMONIA']);
  let landTiles = null;
  if(anyLand){
    landTiles = [];
    for(let y=1;y<grid.length-1;y++)
      for(let x=1;x<grid[0].length-1;x++){
        const t = grid[y][x].type;
        if(TILE[t]?.pass && !WATER_TILES.has(t)) landTiles.push({x,y});
      }
  }

  const templates = isHostile
    ? generateHostileCreatureTemplates(biomeKey)
    : generateCreatureTemplates(biomeKey);

  // Place one nest per species template on the map (habitable only, anyLand mode)
  // Nests are placed on passable non-water tiles; each creature remembers its nest
  const nestPositions = []; // one per template index
  if(anyLand && landTiles && landTiles.length){
    templates.forEach((tmpl, ti) => {
      // Prefer forest tiles for nests on habitable planets, fall back to any land
      const forestTiles = landTiles.filter(t => grid[t.y][t.x].type === 'EARTH_FOREST');
      const pool = forestTiles.length ? forestTiles : landTiles;
      const nestTile = pool[Math.floor(Math.random()*pool.length)];
      // Don't overwrite special tiles
      if(grid[nestTile.y][nestTile.x].type === 'EARTH_FLOOR' ||
         grid[nestTile.y][nestTile.x].type === 'EARTH_FOREST'){
        grid[nestTile.y][nestTile.x].type = 'NEST';
      }
      nestPositions.push({ x: nestTile.x, y: nestTile.y, templateIdx: ti });
    });
  }
  const enemies = [];
  const usedPositions = new Set();
  for(let i=0;i<numAliens;i++){
    let ex, ey;
    const tmplIdx = Math.floor(Math.random()*templates.length);
    const tmpl = bossAlways && i===0
      ? templates.reduce((a,b)=>a.maxHp>b.maxHp?a:b)
      : templates[tmplIdx];
    const nest = nestPositions[templates.indexOf(tmpl)] || nestPositions[0];

    if(anyLand && landTiles && landTiles.length){
      // Spawn within 5 tiles of nest if possible, else anywhere on land
      const nearNest = nest
        ? landTiles.filter(t => Math.abs(t.x-nest.x)+Math.abs(t.y-nest.y) <= 5)
        : [];
      const pool = nearNest.length ? nearNest : landTiles;
      let attempts = 0;
      do {
        const t = pool[Math.floor(Math.random()*pool.length)];
        ex = t.x; ey = t.y;
        attempts++;
      } while(usedPositions.has(ey*grid[0].length+ex) && attempts < 50);
      if(usedPositions.has(ey*grid[0].length+ex)) continue;
    } else {
      let t=0;
      do{ ex=1+rnd(grid[0].length-2); ey=1+rnd(grid.length-2); t++; }
      while(grid[ey][ex].type!==floorType&&t<100);
      if(t>=100) continue;
    }
    usedPositions.add(ey*grid[0].length+ex);

    const hp = tmpl.maxHp;
    enemies.push({
      x:ex, y:ey,
      hp, maxHp:tmpl.maxHp,
      atk:tmpl.atk, def:tmpl.def||0,
      type:'CREATURE',
      sprite:tmpl.sprite,
      name:tmpl.name,
      diet:tmpl.diet,
      behaviour:tmpl.behaviour,
      speedRating:tmpl.speedRating || planetCritterSpeedRating(tmpl),
      hostileByDefault:tmpl.hostileByDefault,
      currentlyHostile:tmpl.hostileByDefault,
      territoryRange:tmpl.territoryRange,
      calmRange:tmpl.calmRange,
      bodyLabel:tmpl.bodyLabel,
      size:tmpl.size,
      colour:tmpl.colour,
      alive:true,
      nestX: nest ? nest.x : ex,
      nestY: nest ? nest.y : ey,
      hidden: false,
      desc: tmpl.desc || generateCreatureDesc(tmpl),
    });
  }
  // Store unique species templates on the planet for later reference
  if(G.planets[key]){
    G.planets[key].creatureTemplates = templates;
  } else {
    spawnCreatures._pendingTemplates = templates;
  }
  return enemies;
}
// Health description — context-aware (ratio AND absolute HP)
function creatureHealthDesc(hp, maxHp){
  const ratio = hp / maxHp;
  if(ratio >= 0.95) return 'Appears uninjured';
  if(ratio >= 0.75) return 'Minor wounds visible';
  if(ratio >= 0.50) return 'Noticeably injured';
  if(ratio >= 0.25) return 'Badly wounded';
  if(ratio >= 0.10) return 'Critically injured';
  return 'On the verge of death';
}

function planetCritterSpeedRating(e){
  if(!e) return 2;
  const explicit = e.speedModelVersion >= 2 ? (e.speedRating ?? e.moveRating ?? e.speed) : undefined;
  if(Number.isFinite(explicit)) return Math.max(1, Math.min(5, Math.round(explicit)));
  if(e.civLocal){
    if(e.civCombatant) return 2;
    return { primitive:1, tribal:1, medieval:2, industrial:2, information:2 }[G.planets?.[e.civPlanetKey || G.curPlanet]?.civilization?.tier] || 2;
  }
  let rating = ({
    crawler:1,
    grazer:1,
    quadruped:2,
    biped:2,
    spiker:2,
    serpent:2,
    floater:2,
    stalker:3,
  })[e.body] || 2;
  if(e.behaviour === 'DOCILE') rating -= 1;
  if(e.behaviour === 'COWARD') rating -= 1;
  if(e.behaviour === 'STALK' && (e.size || 1) <= 1.0) rating += 1;
  if((e.size || 1) >= 1.6) rating -= 1;
  if((e.size || 1) <= 0.5) rating += 1;
  if(e.isBoss || e.shipboardAlien) rating += 1;
  return Math.max(1, Math.min(5, rating));
}

function planetCritterSpeedLabel(e){
  return ['','Slow','Steady','Fast','Very fast','Extreme'][planetCritterSpeedRating(e)] || 'Steady';
}

function consumePlanetCritterMoveBudget(e){
  const rating = planetCritterSpeedRating(e);
  e.speedRating = rating;
  e.speedModelVersion = 2;
  e._moveEnergy = (Number.isFinite(e._moveEnergy) ? e._moveEnergy : 0) + rating;
  const moves = Math.min(3, Math.floor(e._moveEnergy / 2));
  e._moveEnergy -= moves * 2;
  e._lastMoveBudget = moves;
  debugCombatLog('MOVE_BUDGET', { entity: e.name, behaviour: e.behaviour||'HUNT', speedRating: rating, budget: moves, energyLeft: e._moveEnergy });
  return moves;
}

function generateCreatureDesc(tmpl){
  const sizes = tmpl.size < 0.5 ? 'tiny' : tmpl.size < 0.9 ? 'small' : tmpl.size < 1.3 ? 'medium-sized' : tmpl.size < 1.8 ? 'large' : 'enormous';
  const bodyDescs = {
    quadruped: ['stocky build and short fur','muscular haunches and a broad skull','heavy-set frame and small ears'],
    serpent:   ['coiled musculature and overlapping scales','fluid segmented body and lidless eyes','sinuous form that moves in smooth waves'],
    floater:   ['translucent membrane and trailing tendrils','pulsing bell and bioluminescent fringe','gas-filled body that drifts on air currents'],
    crawler:   ['segmented carapace and articulated limbs','chitinous shell and compound eyes','low profile and rapid sideways movement'],
    biped:     ['upright stance and long forelimbs','hunched posture and wide-set eyes','bipedal gait and thickened hide'],
    spiker:    ['dense cluster of hollow spines','radially symmetric body covered in barbs','slow movement that belies the reach of its spines'],
    grazer:    ['wide barrel chest and long neck','heavy haunches built for sustained walking','broad flat teeth visible when it opens its mouth'],
    stalker:   ['elongated jaw and splayed claws','flat skull and forward-facing eyes','low crouching stance that keeps it close to the ground'],
  };
  const dietDescs = {
    herbivore: ['grazes on the local vegetation','feeds on plant matter and fungi','browses slowly, head low to the ground'],
    carnivore: ['moves with predatory purpose','scans the surroundings with unsettling focus','pauses and sniffs the air periodically'],
    omnivore:  ['forages opportunistically for anything edible','roots through the ground as it moves','alternates between grazing and alertness'],
  };
  const bodyDesc = pick(bodyDescs[tmpl.body] || bodyDescs.quadruped);
  const dietDesc = pick(dietDescs[tmpl.diet]);
  return `A ${sizes} ${tmpl.bodyLabel} with ${bodyDesc}. ${dietDesc.charAt(0).toUpperCase()+dietDesc.slice(1)}.`;
}

