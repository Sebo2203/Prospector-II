// ── COMMODITY TRADING SYSTEM ────────────────────────────────────────
const COMMODITIES = {
  // ── Station commodities ──────────────────────────────────────────────────
  ammo:        { id:'ammo',        name:'Bulk Ammunition',    shortName:'Ammo',    symbol:'⬡', col:'#ff8866', basePrice:80,  volatility:0.35, giftCat:'weapon'   },
  food:        { id:'food',        name:'Food Supplies',      shortName:'Food',    symbol:'◈', col:'#88ee66', basePrice:50,  volatility:0.20, giftCat:'food'     },
  luxuries:    { id:'luxuries',    name:'Luxury Goods',       shortName:'Lux.',    symbol:'◆', col:'#ffdd44', basePrice:150, volatility:0.50, giftCat:'ornament' },
  microelec:   { id:'microelec',   name:'Microelectronics',   shortName:'M-Elec',  symbol:'◉', col:'#66ccff', basePrice:120, volatility:0.40, giftCat:'tech'     },
  // ── Cultural / material goods — acquired from civs and planet exploration ─
  pelts:       { id:'pelts',       name:'Raw Pelts',          shortName:'Pelts',   symbol:'◭', col:'#b08860', basePrice:30,  volatility:0.25, giftCat:'bio'      },
  herbs:       { id:'herbs',       name:'Dried Herbs',        shortName:'Herbs',   symbol:'✿', col:'#a8d86a', basePrice:25,  volatility:0.20, giftCat:'food'     },
  carvings:    { id:'carvings',    name:'Bone Carvings',      shortName:'Carving', symbol:'✦', col:'#d8c48a', basePrice:40,  volatility:0.20, giftCat:'ornament' },
  seeds:       { id:'seeds',       name:'Native Seeds',       shortName:'Seeds',   symbol:'⬟', col:'#88d860', basePrice:15,  volatility:0.20, giftCat:'food'     },
  fabric:      { id:'fabric',      name:'Woven Fabric',       shortName:'Fabric',  symbol:'◇', col:'#d488ff', basePrice:50,  volatility:0.25, giftCat:'ornament' },
  totems:      { id:'totems',      name:'Carved Totems',      shortName:'Totems',  symbol:'⬡', col:'#d8c48a', basePrice:70,  volatility:0.20, giftCat:'ornament' },
  medicine:    { id:'medicine',    name:'Tribal Medicine',    shortName:'Med.',    symbol:'✚', col:'#88ee66', basePrice:60,  volatility:0.30, giftCat:'food'     },
  ore:         { id:'ore',         name:'Refined Ore',        shortName:'Ore',     symbol:'◉', col:'#cccccc', basePrice:80,  volatility:0.25, giftCat:'tech'     },
  rations:     { id:'rations',     name:'Preserved Rations',  shortName:'Rations', symbol:'◈', col:'#cc9944', basePrice:65,  volatility:0.20, giftCat:'food'     },
  lenses:      { id:'lenses',      name:'Optical Lenses',     shortName:'Lenses',  symbol:'◎', col:'#aaeeff', basePrice:110, volatility:0.30, giftCat:'tech'     },
  reagents:    { id:'reagents',    name:'Alchemical Reagents',shortName:'Reagents',symbol:'⬡', col:'#aaff44', basePrice:95,  volatility:0.35, giftCat:'tech'     },
  parts:       { id:'parts',       name:'Machine Parts',      shortName:'Parts',   symbol:'◉', col:'#aab8cc', basePrice:100, volatility:0.25, giftCat:'tech'     },
  solvents:    { id:'solvents',    name:'Chemical Solvents',  shortName:'Solvnts', symbol:'◆', col:'#44ddaa', basePrice:85,  volatility:0.30, giftCat:'tech'     },
  metal:       { id:'metal',       name:'Structural Metal',   shortName:'Metal',   symbol:'◭', col:'#8899aa', basePrice:115, volatility:0.20, giftCat:'tech'     },
  instruments: { id:'instruments', name:'Survey Instruments', shortName:'Survey',  symbol:'◎', col:'#88ffcc', basePrice:155, volatility:0.25, giftCat:'tech'     },
  datadrives:  { id:'datadrives',  name:'Encrypted Drives',   shortName:'Drives',  symbol:'◈', col:'#70d8ff', basePrice:160, volatility:0.30, giftCat:'tech'     },
  // ── Mineral extraction — found on planets, sold at stations ──────────────
  ore_fe: { id:'ore_fe', name:'Iron Ore',       shortName:'Iron',   symbol:'Fe', col:'#b07848', basePrice:55,  volatility:0.25, giftCat:'tech' },
  ore_cu: { id:'ore_cu', name:'Copper Ore',     shortName:'Copper', symbol:'Cu', col:'#cc7733', basePrice:70,  volatility:0.30, giftCat:'tech' },
  ore_si: { id:'ore_si', name:'Silicon Ore',    shortName:'Silicon',symbol:'Si', col:'#7799bb', basePrice:60,  volatility:0.25, giftCat:'tech' },
  ore_ti: { id:'ore_ti', name:'Titanium Ore',   shortName:'Titan.', symbol:'Ti', col:'#8aaabb', basePrice:95,  volatility:0.30, giftCat:'tech' },
  ore_au: { id:'ore_au', name:'Gold Ore',       shortName:'Gold',   symbol:'Au', col:'#ffe066', basePrice:180, volatility:0.45, giftCat:'tech' },
  ore_pt: { id:'ore_pt', name:'Platinum Ore',   shortName:'Plat.',  symbol:'Pt', col:'#ddeeff', basePrice:220, volatility:0.40, giftCat:'tech' },
  ore_ur: { id:'ore_ur', name:'Uranium Ore',    shortName:'Uran.',  symbol:'U',  col:'#88ff66', basePrice:200, volatility:0.50, giftCat:'tech' },
  ore_xc:        { id:'ore_xc',        name:'Xenocrystal',       shortName:'Xeno.',   symbol:'Xc', col:'#44ffee', basePrice:250, volatility:0.55, giftCat:'tech' },
  nebula_crystal:{ id:'nebula_crystal', name:'Nebula Crystal',    shortName:'NebCrys', symbol:'✦', col:'#cc88ff', basePrice:420, volatility:0.60, giftCat:'tech' },
};

// ── Ore type definitions: element symbol, display colour, commodity id ───────
// Each entry: { sym, col, id }  — id must match a key in COMMODITIES
const ORE_TYPES = {
  fe: { sym:'Fe', col:'#b07848', id:'ore_fe' },
  cu: { sym:'Cu', col:'#cc7733', id:'ore_cu' },
  si: { sym:'Si', col:'#7799bb', id:'ore_si' },
  ti: { sym:'Ti', col:'#8aaabb', id:'ore_ti' },
  au: { sym:'Au', col:'#ffe066', id:'ore_au' },
  pt: { sym:'Pt', col:'#ddeeff', id:'ore_pt' },
  ur: { sym:'U',  col:'#88ff66', id:'ore_ur' },
  xc: { sym:'Xc', col:'#44ffee', id:'ore_xc' },
};

// Biome → weighted pool of ore keys.  Format: [key, weight, ...]
const ORE_BIOME_POOLS = {
  HABITABLE:   ['fe',6,'cu',5,'si',3,'au',1,'ur',1],
  DESERT:      ['fe',5,'si',6,'cu',3,'ti',2,'au',1],
  FROZEN:      ['fe',4,'si',4,'ti',5,'au',2,'pt',2],
  VOLCANIC:    ['fe',5,'ti',5,'pt',3,'ur',3,'au',2],
  ASTEROID:    ['fe',4,'si',6,'ti',4,'pt',3,'au',1],
  MOON_ROCK:   ['fe',5,'si',5,'ti',3,'xc',3,'au',1],
  TOXIC:       ['fe',4,'si',4,'cu',3,'ur',4,'pt',2],
  BLOOM:       ['fe',5,'cu',5,'si',3,'xc',2,'au',1],
  ANCIENT:     ['si',4,'au',4,'xc',5,'pt',3,'ur',2],
  NUCLEAR_WAR: ['fe',5,'cu',4,'si',3,'ur',5,'au',1],
  _default:    ['fe',6,'cu',4,'si',4,'ti',2,'au',1],
};

function pickOreForBiome(biomeKey){
  const pool = ORE_BIOME_POOLS[biomeKey] || ORE_BIOME_POOLS._default;
  let total = 0;
  for(let i=1; i<pool.length; i+=2) total += pool[i];
  let r = Math.random() * total;
  for(let i=0; i<pool.length; i+=2){
    r -= pool[i+1];
    if(r <= 0) return pool[i];
  }
  return pool[0];
}

// Seeded-random so prices are stable per station per game, but vary between games
function stationMarketSeed(stationName, commodityId){
  let h = 0;
  const s = (G.seed||12345) + stationName + commodityId;
  for(let i=0;i<s.length;i++){ h = Math.imul(31, h) + s.charCodeAt(i) | 0; }
  return (h >>> 0) / 0xFFFFFFFF;
}

function getMarketPrice(stationName, commodityId){
  const com = COMMODITIES[commodityId];
  if(!com) return 0;
  const r = stationMarketSeed(stationName, commodityId);
  // Price swings within volatility band around base, each station has its own fixed offset
  const swing = (r * 2 - 1) * com.volatility; // -vol to +vol
  return Math.round(com.basePrice * (1 + swing));
}

// Buy price is market price; sell price is the same (simple model for now)
function getBuyPrice(stationName, commodityId)  { return getMarketPrice(stationName, commodityId); }
function getSellPrice(stationName, commodityId) { return getMarketPrice(stationName, commodityId); }

// Return a cargo item object for the hold
function makeCommodityItem(commodityId, boughtAt, boughtPrice){
  const com = COMMODITIES[commodityId];
  return {
    name:       com.name,
    shortName:  com.shortName,
    symbol:     com.symbol,
    col:        com.col,
    commodityId,
    boughtAt,
    boughtPrice,
    value:      0,  // G.inventory value field unused for bulk cargo
    isCommodity: true,
  };
}

// Pick a random commodity id
function randomCommodityId(){
  const ids = Object.keys(COMMODITIES);
  return ids[Math.floor(Math.random() * ids.length)];
}

