// ─────────────────────────────────────────────────────────────────
//  BIOME DEFINITIONS
//  Each galaxy tile type maps to one or more possible biomes.
//  biome properties:
//    floor      — tile type for open ground
//    rock/rock2 — two wall tile variants (placed ~50/50)
//    special    — extra tile type (lava, etc) or null
//    oxyDrain   — oxygen lost per step (0 = breathable)
//    rockDensity— chance 0-1 a cell starts as wall
//    minerals, aliens, biodata — loot/enemy counts
//    bossAlways — always spawn a boss enemy
//    name       — display name shown on landing
//    tempLabel  — shown in landing message
//    lootTable  — extra loot types
// ─────────────────────────────────────────────────────────────────
const BIOMES = {
  NUCLEAR_WAR: {
    floor:'nuke_dirt', rock:'nuke_rock', rock2:'nuke_ruin', special:'nuke_crater',
    oxyDrain:2.0, rockDensity:0,
    minerals:3, mineralSamples:3, aliens:0, biodata:0, bossAlways:false,
    alienChance:0,
    name:'Dead World', tempLabel:'Irradiated ruins. Suit required.', scanDifficulty:0.85,
    dayLength:90, tidalLock:null, galaxy:'PLANET',
  },
  RINGWORLD: {
    floor:'rw_floor', rock:'rw_wall', rock2:'rw_wall', special:null,
    oxyDrain:0, rockDensity:0,
    minerals:0, mineralSamples:0, aliens:0, biodata:0, bossAlways:false,
    alienChance:0,
    name:'Ringworld', tempLabel:'Artificial structure. Pressurised interior.', scanDifficulty:1.0,
    dayLength:0, tidalLock:null, galaxy:'PLANET',
  },
  DESTROYED_RINGWORLD: {
    floor:'rw_floor', rock:'rw_wall', rock2:'rw_wall', special:null,
    oxyDrain:3.0, rockDensity:0,
    minerals:0, mineralSamples:0, aliens:0, biodata:0, bossAlways:false,
    alienChance:0,
    name:'Destroyed Ringworld', tempLabel:'Fractured debris field. Suit required. Void gaps lethal.', scanDifficulty:1.0,
    dayLength:0, tidalLock:null, galaxy:'PLANET',
  },
  HABITABLE: {
    floor:'EARTH_FLOOR', rock:'EARTH_ROCK', rock2:'EARTH_ROCK2', special:null,
    oxyDrain:0, rockDensity:0.14,
    minerals:4, mineralSamples:4, aliens:10, biodata:6, bossAlways:false,
    alienChance:0.9,   // 90% chance planet has any aliens at all
    name:'Habitable', tempLabel:'Temperate, breathable atmosphere.', scanDifficulty:0.9,
    dayLength:120, tidalLock:null, galaxy:'PLANET',
  },
  BLOOM: {
    floor:'BLOOM_FLOOR', rock:'EARTH_ROCK', rock2:'EARTH_ROCK2', special:null,
    oxyDrain:0, rockDensity:0.12,
    minerals:3, mineralSamples:3, aliens:10, biodata:18, bossAlways:false,
    alienChance:0.9, hallucinogenic:true,
    name:'Bloom World', tempLabel:'Breathable garden world. Heavy floral growth.', scanDifficulty:0.9,
    dayLength:120, tidalLock:null, galaxy:'SPECIAL',
  },
  TALKING_TREES: {
    floor:'EARTH_FLOOR', rock:'EARTH_ROCK', rock2:'EARTH_ROCK2', special:null,
    oxyDrain:0, rockDensity:0.13,
    minerals:2, mineralSamples:2, aliens:6, biodata:10, bossAlways:false,
    alienChance:0.7,
    name:'Whispering World', tempLabel:'Dense old-growth forests. The wind sounds like speech.', scanDifficulty:0.88,
    dayLength:130, tidalLock:null, galaxy:'SPECIAL',
  },
  DESERT: {
    floor:'DESERT_FLOOR', rock:'DESERT_ROCK', rock2:'DESERT_ROCK2', special:null,
    oxyDrain:1.5, rockDensity:0.15,
    minerals:5, mineralSamples:5, aliens:6, biodata:3, bossAlways:false,
    alienChance:0.4,
    name:'Desert', tempLabel:'Arid. Suit required.', scanDifficulty:0.8,
    dayLength:210, tidalLock:null, galaxy:'PLANET',
  },
  FROZEN: {
    floor:'FROZEN_FLOOR', rock:'FROZEN_ROCK', rock2:'FROZEN_ROCK2', special:null,
    oxyDrain:1.5, rockDensity:0.20,
    minerals:8, mineralSamples:8, aliens:5, biodata:2, bossAlways:false,
    alienChance:0.35, hazards:['METEOR','AMMONIA'],
    name:'Frozen', tempLabel:'Sub-zero. Suit required.', scanDifficulty:0.65,
    dayLength:270, tidalLock:null, galaxy:'RICH',
  },
  ASTEROID: {
    floor:'ASTEROID_FLOOR', rock:'ASTEROID_ROCK', rock2:'ASTEROID_ROCK2', special:null,
    oxyDrain:3.0, rockDensity:0.25,
    minerals:12, mineralSamples:12, aliens:4, biodata:0, bossAlways:false,
    alienChance:0.2, hazards:['METEOR'],
    name:'Asteroid', tempLabel:'Vacuum. O₂ depletes fast.', scanDifficulty:0.75,
    dayLength:48, tidalLock:null, galaxy:'RICH',
  },
  VOLCANIC: {
    floor:'VOLCANIC_FLOOR', rock:'VOLCANIC_ROCK', rock2:'VOLCANIC_ROCK2', special:'LAVA_FLOOR',
    oxyDrain:2.5, rockDensity:0.18,
    minerals:6, mineralSamples:6, aliens:7, biodata:1, bossAlways:false,
    alienChance:0.2, hazards:['LAVA_FLOOR','SMOKE'],
    name:'Volcanic', tempLabel:'Extreme heat. Lava flows active.', scanDifficulty:0.35,
    dayLength:0, tidalLock:'day', galaxy:'DANGER',
  },
  TOXIC: {
    floor:'TOXIC_FLOOR', rock:'TOXIC_ROCK', rock2:'TOXIC_ROCK2', special:null,
    oxyDrain:2.0, rockDensity:0.16,
    minerals:3, mineralSamples:3, aliens:9, biodata:8, bossAlways:false,
    alienChance:0.25, hazards:['GEYSER','SMOKE'],
    name:'Toxic', tempLabel:'Corrosive atmosphere. Rich biodata.', scanDifficulty:0.45,
    dayLength:72, tidalLock:null, galaxy:'DANGER',
  },
  DERELICT: {
    name:'Derelict Station',
    floor:'station_floor', rock:'station_wall', rock2:'station_wall', special:null,
    oxyDrain:0, rockDensity:0, minerals:0, mineralSamples:0, aliens:0, alienChance:0, biodata:0,
    hazards:[], bossAlways:false,
  },
  CAVE: {
    name:'Cave System',
    floor:'cave_floor', rock:'cave_wall', rock2:'cave_stalagtite', special:null,
    oxyDrain:0.3, rockDensity:0, minerals:0, mineralSamples:2, aliens:0, alienChance:0, biodata:0,
    hazards:[], bossAlways:false, tidalLock:'night',
    tempLabel:'Dark cave. Damp air.', scanDifficulty:0.8,
  },
  ANCIENT_STATION: {
    name:'Ancient Refueling Station',
    floor:'station_floor', rock:'station_wall', rock2:'station_wall', special:null,
    oxyDrain:2.0, rockDensity:0, minerals:0, mineralSamples:0, aliens:0, alienChance:0, biodata:0,
    hazards:[], bossAlways:false,
    tempLabel:'Hard vacuum. Suit critical.',
  },
  ANCIENT: {
    floor:'EARTH_FLOOR', rock:'EARTH_ROCK',   rock2:'EARTH_ROCK2', special:null,
    oxyDrain:0.5, rockDensity:0.18,
    minerals:3, mineralSamples:3, aliens:7, biodata:4, bossAlways:false,
    alienChance:0.5,
    name:'Ancient Ruins', tempLabel:'Anomalous readings. Tread carefully.', scanDifficulty:0.50,
    dayLength:320, tidalLock:null, galaxy:'SPECIAL',
    hazards:['MIST'],
  },
  // ── Gas giant — scannable only, not landable ──────────────────
  GAS_GIANT: {
    floor:null, rock:null, rock2:null, special:null,
    oxyDrain:0, rockDensity:0,
    minerals:0, mineralSamples:0, aliens:0, biodata:0, bossAlways:false,
    name:'Gas Giant', tempLabel:'Massive gas planet. Cannot land.', scanDifficulty:0.6,
    dayLength:0, tidalLock:null,
    galaxy:'PLANET',
    gasGiant:true,   // flag: no landing, may have moons
    scanReveals:'moon', // scanning reveals moon if present
  },
  // ── Moon biomes (children of gas giants) ──────────────────────
  MOON_ROCK: {
    floor:'ASTEROID_FLOOR', rock:'ASTEROID_ROCK', rock2:'FROZEN_ROCK', special:null,
    oxyDrain:2.5, rockDensity:0.22,
    minerals:9, mineralSamples:9, aliens:4, biodata:0, bossAlways:false,
    alienChance:0.15,
    name:'Rocky Moon', tempLabel:'Barren rock. Suit required.', scanDifficulty:0.7,
    dayLength:32, tidalLock:null,
    galaxy:'RICH',
    isMoon:true,
  },
  MOON_ICE: {
    floor:'FROZEN_FLOOR', rock:'FROZEN_ROCK', rock2:'ASTEROID_ROCK', special:null,
    oxyDrain:2.0, rockDensity:0.20,
    minerals:6, mineralSamples:6, aliens:6, biodata:3, bossAlways:false,
    alienChance:0.25,
    name:'Ice Moon', tempLabel:'Frozen surface. Suit required.', scanDifficulty:0.65,
    dayLength:28, tidalLock:null,
    galaxy:'RICH',
    isMoon:true,
  },
  MOON_TOXIC: {
    floor:'TOXIC_FLOOR', rock:'TOXIC_ROCK', rock2:'ASTEROID_ROCK', special:null,
    oxyDrain:2.5, rockDensity:0.18,
    minerals:4, mineralSamples:4, aliens:10, biodata:6, bossAlways:false,
    alienChance:0.3,
    name:'Toxic Moon', tempLabel:'Corrosive fog. Suit required.', scanDifficulty:0.45,
    dayLength:36, tidalLock:null,
    galaxy:'DANGER',
    isMoon:true,
  },
};

