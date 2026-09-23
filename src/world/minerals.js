const MINERAL_SAMPLE_TYPES = [
  // ── Geological / geochemical samples (indices 0-7) ──────────────────────
  { name:'Rock Sample',         col:'#ffe066', value:40,  desc:'Powdered stone and metallic grit in a labeled vial.' },
  { name:'Crystalline Sample',  col:'#aaddff', value:55,  desc:'A cluster of pale crystals, still embedded in matrix rock.' },
  { name:'Volcanic Sample',     col:'#ff7744', value:50,  desc:'Dark igneous rock threaded with glassy mineral veins.' },
  { name:'Sediment Core',       col:'#bb9966', value:35,  desc:'A compressed plug of layered sediment. Dull but dateable.' },
  { name:'Metallic Nodule',     col:'#99bbcc', value:60,  desc:'A dense rounded concretion. Heavier than it looks.' },
  { name:'Frost Mineral',       col:'#cceeff', value:50,  desc:'Pale mineral deposit precipitated from subsurface ice melt.' },
  { name:'Sulphide Chunk',      col:'#aacc44', value:45,  desc:'Yellow-green sulphide mineral with a faint chemical smell.' },
  { name:'Slag Fragment',       col:'#887766', value:30,  desc:'Partially fused rock. Exposure to extreme heat, ancient or otherwise.' },
  // ── Ore hand-sample fragments (indices 8-15) — small loose pieces, no cargo needed ──
  { name:'Iron Fragment',      col:'#b07848', value:45,  oreSymbol:'Fe', desc:'A hand-sized lump of iron ore. Too small for bulk extraction, sellable as a survey specimen.' },
  { name:'Copper Fragment',    col:'#cc7733', value:55,  oreSymbol:'Cu', desc:'A chunk of copper ore, green-stained at the edges. Light enough to pocket.' },
  { name:'Silicon Fragment',   col:'#7799bb', value:50,  oreSymbol:'Si', desc:'A wafer of silicon-bearing rock. Smooth faces where it cleaved naturally.' },
  { name:'Titanium Fragment',  col:'#8aaabb', value:75,  oreSymbol:'Ti', desc:'Dense titanium-bearing nodule. Surprisingly light for its apparent mass.' },
  { name:'Gold Fragment',      col:'#ffe066', value:140, oreSymbol:'Au', desc:'A fleck of native gold still embedded in quartz matrix. The survey office pays well for provenance.' },
  { name:'Platinum Fragment',  col:'#ddeeff', value:175, oreSymbol:'Pt', desc:'A platinum-group nugget. Rare, heavy, unremarkable to look at.' },
  { name:'Uranium Fragment',   col:'#88ff66', value:160, oreSymbol:'U',  desc:'A sealed fragment of uranium-bearing ore. Properly contained; the counter ticks anyway.' },
  { name:'Xenocrystal Fragment', col:'#44ffee', value:200, oreSymbol:'Xc', desc:'A shard of xenocrystal matrix. The geometry of the crystal faces does not match any known lattice.' },
];

// Ore-fragment picks keyed by biome — maps to indices 8-15 in MINERAL_SAMPLE_TYPES
const ORE_FRAGMENT_BIOME_POOLS = {
  HABITABLE:   [8,8,8,9,9,10,12],       // Fe, Cu common; hint of Au
  DESERT:      [8,8,10,10,11,12],        // Fe, Si, Ti, Au
  FROZEN:      [8,10,10,11,11,13],       // Si, Ti, Pt
  VOLCANIC:    [8,8,11,11,13,14],        // Fe, Ti, Pt, U
  ASTEROID:    [8,10,10,11,11,13],       // Si, Ti, Pt
  MOON_ROCK:   [8,10,11,15,15],          // Fe, Si, Ti, Xc
  TOXIC:       [8,9,14,14,13],           // Fe, Cu, U, Pt
  BLOOM:       [8,9,9,10,12,15],         // Cu, Si, Au, Xc
  ANCIENT:     [12,12,13,15,15,15],      // Au, Pt, Xc heavy
  NUCLEAR_WAR: [8,9,14,14,8],            // Fe, Cu, U
  _default:    [8,9,10,11,12,13,14,15],
};

function pickMineralSample(biomeKey){
  // ~40% chance to pull an ore fragment instead of a geological sample
  if(Math.random() < 0.4){
    const pool = ORE_FRAGMENT_BIOME_POOLS[biomeKey] || ORE_FRAGMENT_BIOME_POOLS._default;
    return MINERAL_SAMPLE_TYPES[pool[Math.floor(Math.random()*pool.length)]];
  }
  const pools = {
    VOLCANIC:    [2,2,2,6,3,0,6],
    FROZEN:      [0,1,5,5,3,4],
    ASTEROID:    [0,4,2,1,3],
    HABITABLE:   [0,0,1,3,4,0,6,7],
    DESERT:      [0,1,2,3,0,6,7],
    NUCLEAR_WAR: [7,7,6,0,3],
    _default:    [0,1,2,3,4,5,6,7],
  };
  const pool = pools[biomeKey] || pools._default;
  return MINERAL_SAMPLE_TYPES[pool[Math.floor(Math.random()*pool.length)]];
}

