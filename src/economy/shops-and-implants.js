// ─────────────────────────────────────────────────────────────────
//  IMPLANTS — crew augmentations from BioVance Collective
//  Each implant occupies one implant slot per crew member (max 2).
//  Effects are applied via crewImplantBonus() at combat/stat time.
// ─────────────────────────────────────────────────────────────────
const IMPLANT_CATALOG = [
  { id:'neural_acc',   name:'Neural Accelerator',  col:'#44ffcc', cost:600,
    detail:'enhances cognition; +2 SCI & +1 ENG permanently',
    desc:'A cortical mesh threaded behind the temporal lobe. Runs warm.',
    effect:{ sci:2, eng:1 }, tier:'uncommon' },
  { id:'adrenal_amp',  name:'Adrenal Amplifier',   col:'#ff6644', cost:500,
    detail:'+2 ATK, +1 CBT skill in combat',
    desc:'Sub-dermal gland implant. Floods the system on threat detection.',
    effect:{ atk:2, cbt:1 }, tier:'uncommon' },
  { id:'bone_lace',    name:'Bone Lace',            col:'#aaaacc', cost:450,
    detail:'+1 DEF (stacks with armor)',
    desc:'Latticed ceramic reinforcement of the skeletal structure.',
    effect:{ def:1 }, tier:'common' },
  { id:'lung_filter',  name:'Lung Filter Implant',  col:'#66ddff', cost:380,
    detail:'oxygen consumption -25% on planet surface',
    desc:'Titanium mesh supplementing the pulmonary filter. Quiet hiss on deep breaths.',
    effect:{ oxyRate:0.75 }, tier:'common' },
  { id:'subdermal_hud',name:'Subdermal HUD',        col:'#ffe066', cost:420,
    detail:'+1 SCI, reveals creature health in combat',
    desc:'A pressure-sensitive display etched beneath the forearm skin.',
    effect:{ sci:1, creatureHud:true }, tier:'uncommon' },
  { id:'pain_block',   name:'Pain Suppressor',      col:'#ff88cc', cost:350,
    detail:'crew member does not flinch; +10 max HP',
    desc:'Blocks ascending pain signals. Crew fight at full efficiency until zero HP.',
    effect:{ maxHp:10 }, tier:'common' },
  { id:'reflex_coil',  name:'Reflex Coil',          col:'#88ff88', cost:700,
    detail:'+2 CBT, ranged accuracy +10%',
    desc:'Myomer-wound coil along the motor cortex. Reaction time: inhuman.',
    effect:{ cbt:2, accuracy:0.10 }, tier:'rare' },
  { id:'biosense_skin',name:'Biosense Skin Graft',  col:'#44cc88', cost:480,
    detail:'+2 MED, +1 SCI; detect alien biology passively',
    desc:'A grafted secondary epithelium threaded with chemoreceptors.',
    effect:{ med:2, sci:1 }, tier:'uncommon' },
];

// ─────────────────────────────────────────────────────────────────
//  CORP SHOP POOLS — each corporation sells exclusive stock
// ─────────────────────────────────────────────────────────────────
const CORP_ITEM_POOLS = {
  eridani: [
    { name:'Sensor Drone',        cost:300, detail:'galaxy only: flies ahead of ship for 4–7 turns, revealing fog', usable:'sensor_drone', col:'#44ffcc', tier:'uncommon' },
    { name:'Grappling Hook',      cost:50, detail:'one-use: hook over 1 obstacle tile; enter target mode to aim', usable:'grapple',       col:'#ccaa88', tier:'uncommon' },
    { name:'Jetpack',             cost:800, detail:'leap 2 tiles over any terrain; enter target mode to aim; 15 charges', usable:'jetpack',      col:'#ff9922', tier:'rare'     },
    { name:'Floodlight',          cost:200, detail:'passive: always +2 tile vision radius',  usable:'floodlight',      col:'#ffffaa', tier:'uncommon' },
    { name:'Repair Kit',          cost:150, detail:'patch the hull for +15 HP',              usable:'repair_kit',      col:'#66aaff', tier:'common'   },
  ],
  margo: [
    { name:'Plasma Pistol',       cost:400, detail:'equip crew (+3 ATK, range 7)',          usable:'gun_plasma',      col:'#ff66cc', tier:'rare'     },
    { name:'Capture Net',         cost:220, detail:'stuns one adjacent creature for 5 turns — then use Containment Crate',  usable:'capture_net',     col:'#ffaa44', tier:'uncommon' },
    { name:'Containment Crate',   cost:300, detail:'hold 1 live alien; bounty on return',   usable:'contain_crate',   col:'#ff8833', tier:'uncommon' },
    { name:'Tranq Dart Kit',      cost:160, detail:'equip crew — ranged stun (range 5, single use)', usable:'tranq_darts', col:'#aaff44', tier:'common'   },
    { name:'Assault Carbine',     cost:600, detail:'equip crew (+4 ATK, range 4)',          usable:'gun_breacher',    col:'#ff3333', tier:'rare'     },
  ],
  biovance: [
    ...IMPLANT_CATALOG.map(imp => ({
      name: imp.name,
      cost: imp.cost,
      detail: imp.detail,
      usable: 'implant_'+imp.id,
      col: imp.col,
      tier: imp.tier,
      implantId: imp.id,
    })),
  ],
};

function generateCorpStock(corpId, stationName){
  const pool = CORP_ITEM_POOLS[corpId] || CORP_ITEM_POOLS.eridani;
  return pool.filter(item => {
    if(item.tier === 'rare')     return Math.random() < 0.40;
    if(item.tier === 'uncommon') return Math.random() < 0.70;
    return Math.random() < 0.85; // common
  }).map(item => ({
    ...item,
    stock: item.tier === 'rare' ? 1 : 1 + Math.floor(Math.random()*2),
  }));
}

// Returns ATK bonus from implants for a crew member
function crewImplantAtkBonus(c){
  return (c.implants||[]).reduce((sum,id)=>{
    const imp = IMPLANT_CATALOG.find(i=>i.id===id);
    return sum + (imp?.effect?.atk||0);
  }, 0);
}

// Returns DEF bonus from implants for a crew member
function crewImplantDefBonus(c){
  return (c.implants||[]).reduce((sum,id)=>{
    const imp = IMPLANT_CATALOG.find(i=>i.id===id);
    return sum + (imp?.effect?.def||0);
  }, 0);
}

// Returns skill bonus from implants for a given skill id
function crewImplantSkillBonus(c, skillId){
  return (c.implants||[]).reduce((sum,id)=>{
    const imp = IMPLANT_CATALOG.find(i=>i.id===id);
    return sum + (imp?.effect?.[skillId]||0);
  }, 0);
}

// Returns total max HP bonus from implants
function crewImplantMaxHpBonus(c){
  return (c.implants||[]).reduce((sum,id)=>{
    const imp = IMPLANT_CATALOG.find(i=>i.id===id);
    return sum + (imp?.effect?.maxHp||0);
  }, 0);
}

// ─────────────────────────────────────────────────────────────────
//  SUPPLY DEPOT — randomised per-station stock (formerly pawn shop)
// ─────────────────────────────────────────────────────────────────
const PAWN_ITEM_POOL = [
  // ── Consumables ──────────────────────────────────────────────
  { name:'Medikit',            cost:100,  detail:'heals lowest HP crew member by 10',    usable:'medikit',         col:'#ff6688', tier:'common' },
  { name:'Oxygen Tank',        cost:100,  detail:'refill O₂ to full on surface',          usable:'oxytank',         col:'#44ddff', tier:'common' },
  { name:'Field Rations',      cost:60,   detail:'stabilises one injured crew member +5 HP', usable:'field_rations', col:'#aacc66', tier:'common' },
  { name:'Combat Stim',        cost:200,  detail:'one crew member: +3 ATK for 8 turns',   usable:'stim_pack',       col:'#ffee44', tier:'uncommon' },
  { name:'Rad-Flush Tablet',   cost:140,  detail:'clears radiation from one crew member', usable:'rad_flush',       col:'#88ff88', tier:'uncommon' },
  { name:'Repair Kit',         cost:150,  detail:'patch the hull for +15 HP',             usable:'repair_kit',      col:'#66aaff', tier:'uncommon' },
  { name:'C4 Charge',          cost: 200, detail:'Military explosive.',					 	usable:'c4', 			col:'#ff4400', tier:'rare' },
  // ── Sidearms ─────────────────────────────────────────────────
  { name:'Simple Handgun',     cost:150,  detail:'equip crew (+2 ATK, range 6)',           usable:'gun',             col:'#aaaaff', tier:'common' },
  { name:'Shotgun',            cost:220,  detail:'equip crew (+3 ATK, range 3, high acc)', usable:'gun_shotgun',     col:'#cc9966', tier:'uncommon' },
  { name:'Burst Carbine',      cost:280,  detail:'equip crew (+3 ATK, range 5, rapid)',    usable:'gun_burst',       col:'#88ccff', tier:'uncommon' },
  { name:'Sniper Rifle',       cost:1000, detail:'equip crew (+5 ATK, range 12)',          usable:'gun_sniper',      col:'#ffaa44', tier:'rare' },
  // ── Melee ─────────────────────────────────────────────────────
  { name:'Combat Knife',       cost:80,   detail:'equip crew (+1 ATK, silent, melee)',     usable:'knife',           col:'#ccccaa', tier:'common' },
  { name:'Stun Baton',         cost:160,  detail:'equip crew (melee, 1-2 dmg, 65% stun)',  usable:'stun_baton',      col:'#aaffdd', tier:'uncommon' },
  { name:'Vibroblade',         cost:350,  detail:'equip crew (+4 ATK, melee precision)',   usable:'vibroblade',      col:'#ff88ff', tier:'rare' },
  // ── Armour ────────────────────────────────────────────────────
  { name:'Flight Suit',        cost:80,   detail:'equip crew (+1 DEF)',                    usable:'armor_flight',    col:'#88ddff', tier:'common' },
  { name:'Reinforced Suit',    cost:200,  detail:'equip crew (+2 DEF)',                    usable:'armor_reinforced', col:'#ffcc44', tier:'uncommon' },
  { name:'Combat Exosuit',     cost:500,  detail:'equip crew (+3 DEF, heavy plating)',     usable:'armor_exosuit',   col:'#ff8833', tier:'rare' },
  // ── Equipment ─────────────────────────────────────────────────
  { name:'Floodlight',         cost:200,  detail:'passive: always +2 tile vision radius',  usable:'floodlight',      col:'#ffffaa', tier:'uncommon' },
  { name:'Sensor Drone',       cost:300,  detail:'galaxy only: flies ahead of ship for 4–7 turns, revealing fog',       usable:'sensor_drone',    col:'#44ffcc', tier:'uncommon' },
  { name:'Grappling Hook',     cost:250,  detail:'one-use: hook over 1 obstacle; enter target mode to aim', usable:'grapple',       col:'#ccaa88', tier:'uncommon' },
  { name:'Jetpack',            cost:800,  detail:'leap 2 tiles over any terrain; enter target mode to aim; 15 charges', usable:'jetpack',      col:'#ff9922', tier:'rare'     },
  { name:'Handheld Drill',     cost:280,  detail:'extract ore deposits from planet surface', usable:'mining_tool',   col:'#cc9944', tier:'common',   miningMult:1.0 },
  { name:'Mining Laser',       cost:650,  detail:'fast ore extraction — significantly fewer presses', usable:'mining_tool', col:'#44eeff', tier:'rare', miningMult:2.5 },
  { name:'Ore Scanner',        cost:400,  detail:'passive: marks ore deposits within 8 tiles with ? on the map', usable:'ore_scanner', col:'#88ff44', tier:'uncommon' },
];

function generatePawnStock(stationName){
  const pool = PAWN_ITEM_POOL.filter(item => {
    if(item.usable === 'gun_sniper')    return stationName === 'Waypoint Omega' || Math.random() < 0.15;
    if(item.usable === 'vibroblade')    return Math.random() < 0.25;
    if(item.usable === 'plasma_pistol') return Math.random() < 0.25;
    if(item.usable === 'armor_exosuit') return Math.random() < 0.30;
    if(item.tier === 'rare')            return Math.random() < 0.30;
    if(item.tier === 'uncommon')        return Math.random() < 0.65;
    return Math.random() < 0.75; // common
  });
  return pool.map(item => ({
    ...item,
    stock: item.tier === 'rare' ? 1 : 1 + Math.floor(Math.random() * 3),
  }));
}

// ─────────────────────────────────────────────────────────────────
//  MEDBAY SUPPLY SHOP — different pool at each starbase
// ─────────────────────────────────────────────────────────────────
const MEDBAY_ITEM_POOL = [
  {
    name:'Advanced Trauma Kit',
    cost:350,
    detail:'treats one serious injury and restores 20 HP',
    usable:'trauma_kit',
    col:'#ff8866',
    desc:'A surgical field kit for serious crew injuries.',
  },
  {
    name:'Mild Anti-depressants',
    cost:120,
    detail:'lower-grade Joy Dust; steadies crew morale',
    usable:'mild_antidepressants',
    col:'#cc88ff',
    desc:'A controlled mood stabilizer.',
  },
  {
    name:'Iodine Pills',
    cost:160,
    detail:'anti-radiation tablets; lowers crew RAD by 2',
    usable:'iodine_pills',
    col:'#aaff44',
    desc:'Potassium iodide tablets for radiation exposure.',
  },
  {
    name:'Antibiotics',
    cost:220,
    detail:'treats infection, fever, sepsis, and parasites',
    usable:'antibiotics',
    col:'#66ddff',
    desc:'Broad-spectrum antibiotics and antiparasitic compounds.',
  },
];

function generateMedbayStock(stationName){
  const picked = MEDBAY_ITEM_POOL.filter(item=>{
    const r = stationMarketSeed(stationName || 'Starbase Alpha', 'medbay_'+item.usable);
    if(item.usable === 'trauma_kit') return r > 0.18;
    if(item.usable === 'iodine_pills') return r > 0.25;
    if(item.usable === 'antibiotics') return r > 0.22;
    return r > 0.35;
  });
  if(!picked.length){
    const fallback = Math.floor(stationMarketSeed(stationName || 'Starbase Alpha', 'medbay_fallback') * MEDBAY_ITEM_POOL.length);
    picked.push(MEDBAY_ITEM_POOL[fallback] || MEDBAY_ITEM_POOL[0]);
  }
  return picked.map(item=>{
    const r = stationMarketSeed(stationName || 'Starbase Alpha', 'medbay_stock_'+item.usable);
    return { ...item, stock:1 + Math.floor(r * 3) };
  });
}

function addPurchasedMedbayItem(item){
  G.inventory.push({
    name:item.name,
    col:item.col,
    desc:item.desc || item.detail,
    value:0,
    usable:item.usable,
  });
}

