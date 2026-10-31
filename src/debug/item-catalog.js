// ── Debug item spawn catalog ─────────────────────────────────────────────────
// Grouped by category. Each item has the full inventory object to push.
// LEFT column: inventory items (consumables, weapons, armor, field samples, botanicals, special)
const DEBUG_ITEM_CATALOG = [
  { cat:'Consumables', items:[
    { name:'Medikit',              col:'#ff6688', desc:'Restores 10 HP to most injured crew.',             value:0,   usable:'medikit' },
    { name:'Advanced Trauma Kit',  col:'#ff8866', desc:'Treats one serious injury and restores 20 HP.',    value:0,   usable:'trauma_kit' },
    { name:'Oxygen Tank',          col:'#44ddff', desc:'Refills oxygen supply.',                            value:0,   usable:'oxytank' },
    { name:'Field Rations',        col:'#aacc66', desc:'Stabilises one injured crew member +5 HP.',         value:0,   usable:'field_rations' },
    { name:'Rad-Flush Tablet',     col:'#88ff88', desc:'Clears radiation from crew.',                       value:0,   usable:'rad_flush' },
    { name:'Repair Kit',           col:'#66aaff', desc:'Patch the hull for +15 HP.',                        value:0,   usable:'repair_kit' },
    { name:'Mild Anti-depressants',col:'#cc88ff', desc:'Steadies crew morale.',                             value:0,   usable:'mild_antidepressants' },
    { name:'Iodine Pills',         col:'#aaff44', desc:'Lowers crew radiation by 2.',                       value:0,   usable:'iodine_pills' },
    { name:'Antibiotics',          col:'#66ddff', desc:'Treats infection, fever, sepsis, and parasites.',   value:0,   usable:'antibiotics' },
    { name:'Joy Dust',             col:'#d488ff', desc:'Spikes crew morale above normal limits.',           value:0,   usable:'morale_drug' },
    { name:'Combat Stim',          col:'#ffee44', desc:'+3 ATK to selected crew for 8 turns.',              value:0,   usable:'stim_pack' },
  ]},
  { cat:'Weapons', items:[
    { name:'Simple Handgun',       col:'#aaaaff', desc:'+2 ATK when equipped.',                value:0, usable:'gun' },
    { name:'Shotgun',              col:'#cc9966', desc:'+3 ATK when equipped, range 3.',        value:0, usable:'gun_shotgun' },
    { name:'Burst Carbine',        col:'#88ccff', desc:'+3 ATK when equipped, range 5.',        value:0, usable:'gun_burst' },
    { name:'Sniper Rifle',         col:'#ffaa44', desc:'+5 ATK when equipped, range 12.',       value:0, usable:'gun_sniper' },
    { name:'Plasma Pistol',        col:'#ff66cc', desc:'+3 ATK when equipped, range 7.',        value:0, usable:'gun_plasma' },
    { name:'Assault Carbine',      col:'#ff3333', desc:'+4 ATK when equipped, range 4.',        value:0, usable:'gun_breacher' },
    { name:'Combat Knife',         col:'#ccccaa', desc:'+1 ATK when equipped, melee.',          value:0, usable:'knife' },
    { name:'Stun Baton',           col:'#aaffdd', desc:'+2 ATK when equipped. Melee, non-lethal — deals 1-2 damage and 65% chance to stun.',          value:0, usable:'stun_baton' },
    { name:'Vibroblade',           col:'#ff88ff', desc:'+4 ATK when equipped, melee.',          value:0, usable:'vibroblade' },
  ]},
  { cat:'Armor', items:[
    { name:'Flight Suit',          col:'#88ddff', desc:'+1 DEF when equipped.',                            value:0, usable:'armor_flight' },
    { name:'Reinforced Suit',      col:'#ffcc44', desc:'+2 DEF when equipped.',                            value:0, usable:'armor_reinforced' },
    { name:'Combat Exosuit',       col:'#ff8833', desc:'+3 DEF when equipped.',                            value:0, usable:'armor_exosuit' },
    { name:'Armour Plate',         col:'#aaaacc', desc:'+1 DEF when equipped.',                            value:0, usable:'armor_plate' },
    { name:'Diving Suit',          col:'#44bbdd', desc:'Enables sustained underwater exploration.',         value:0, usable:'armor_diving' },
  ]},
  { cat:'Equipment', items:[
    { name:'Floodlight',           col:'#ffffaa', desc:'Passive: always +2 tile vision radius.',            value:0, usable:'floodlight' },
    { name:'Sensor Drone',         col:'#44ffcc', desc:'Galaxy use only: launches ahead of ship, revealing fog for 4–7 turns.',value:0, usable:'sensor_drone' },
    { name:'Grappling Hook',       col:'#ccaa88', desc:'One-use: hook over 1 obstacle tile. Enter target mode to aim direction.',             value:0, usable:'grapple' },
    { name:'Jetpack',              col:'#ff9922', desc:'Leap 2 tiles over terrain; enter target mode to aim direction. 15 charges.',            value:0, usable:'jetpack', fuel:15 },
    { name:'Tranq Dart Kit',       col:'#aaff44', desc:'Equip to crew. Ranged non-lethal — stuns target for 4 turns (range 5). Single use.',  value:0, usable:'tranq_darts' },
    { name:'Capture Net',          col:'#ffaa44', desc:'Stuns one adjacent creature for 5 turns. Use Containment Crate while adjacent to capture.',             value:0, usable:'capture_net' },
    { name:'Containment Crate',    col:'#ff8833', desc:'Hold 1 live alien; bounty on return.',              value:0, usable:'contain_crate' },
    { name:'Handheld Drill',       col:'#cc9944', desc:'Portable percussion drill. Extracts ore deposits with enough effort.',  value:280, usable:'mining_tool', miningMult:1.0 },
    { name:'Mining Laser',         col:'#44eeff', desc:'Focused thermal cutter. Extracts ore deposits significantly faster.', value:650, usable:'mining_tool', miningMult:2.5 },
    { name:'Ore Scanner',          col:'#88ff44', desc:'Passive: marks undiscovered ore deposits within 8 tiles with a ? marker.', value:400, usable:'ore_scanner' },
    { name:'C4 Charge',           col:'#ff4400', desc:'Military explosive. Arm from inventory, drop before detonation. 5-turn timer.',value:200, usable:'c4' },
  ]},
  { cat:'Field Samples', items:[
    ...MINERAL_SAMPLE_TYPES.map(t=>({ name:t.name, col:t.col, desc:t.desc, value:t.value, oreSymbol:t.oreSymbol||undefined })),
    { name:'Biodata Sample',       col:'#70f090', desc:'Worth 60 cr.',  value:60 },
    { name:'Alien Alloy Fragment', col:'#88ccff', desc:'Worth 60 cr.',  value:60 },
    { name:'Alien Hide',           col:'#f09090', desc:'Worth 30 cr.',  value:30 },
    { name:'Alien Core',           col:'#ff8888', desc:'Worth 50 cr.',  value:50 },
    { name:'Alien Fang',           col:'#ff8844', desc:'Worth 60 cr.',  value:60 },
    { name:'Alien Organ',          col:'#ee9944', desc:'Worth 35 cr.',  value:35 },
    { name:'Alien Sample',         col:'#ffaa55', desc:'Worth 40 cr.',  value:40 },
    { name:'Alien Tissue',         col:'#ee8888', desc:'Worth 20 cr.',  value:20 },
    { name:'Alien Corpse',         col:'#bb6655', desc:'Science Office specimen. Required for alien corpse job.', value:0 },
    { name:'Phonetic Bark Sample', col:'#7cd89f', desc:'Resonant bark from a talking-tree world.', value:85 },
    // Deposit survey items — populated lazily (ORE_TYPES defined later in file)
    { name:'Iron Deposit Survey',      col:'#b07848', desc:'Survey data for an iron ore deposit.',       value:14,  _oreKey:'fe', _isSurvey:true },
    { name:'Copper Deposit Survey',    col:'#cc7733', desc:'Survey data for a copper ore deposit.',      value:18,  _oreKey:'cu', _isSurvey:true },
    { name:'Silicon Deposit Survey',   col:'#7799bb', desc:'Survey data for a silicon ore deposit.',     value:15,  _oreKey:'si', _isSurvey:true },
    { name:'Titanium Deposit Survey',  col:'#8aaabb', desc:'Survey data for a titanium ore deposit.',    value:24,  _oreKey:'ti', _isSurvey:true },
    { name:'Gold Deposit Survey',      col:'#ffe066', desc:'Survey data for a gold ore deposit.',        value:45,  _oreKey:'au', _isSurvey:true },
    { name:'Platinum Deposit Survey',  col:'#ddeeff', desc:'Survey data for a platinum ore deposit.',    value:55,  _oreKey:'pt', _isSurvey:true },
    { name:'Uranium Deposit Survey',   col:'#88ff66', desc:'Survey data for a uranium ore deposit.',     value:50,  _oreKey:'ur', _isSurvey:true },
    { name:'Xenocrystal Deposit Survey', col:'#44ffee', desc:'Survey data for a xenocrystal deposit.',  value:63,  _oreKey:'xc', _isSurvey:true },
  ]},
  { cat:'Implants', get items(){ return IMPLANT_CATALOG.map(imp=>({ name:imp.name, col:imp.col, desc:imp.detail, value:imp.cost, usable:'implant_'+imp.id, implantId:imp.id })); } },
  { cat:'Botanicals', items:[
    { name:'Native Seeds',         col:'#88d860', desc:'Collected from local flora. Giftable to civs.', value:15 },
    { name:'Dried Flowers',        col:'#ffaad4', desc:'Pressed specimens from local plant life.',      value:20 },
  ]},
  { cat:'Special Finds', items:[
    { name:'Ancient Artifact',     col:'#e090ff', desc:'Worth 200 cr.',  value:200 },
    { name:'Ringworld Datacore',   col:'#cc44ff', desc:'Ancient alien data lattice. Worth 120 cr.',    value:120 },
    { name:'Alien Compound',       col:'#44ffcc', desc:'Unknown crystalline material. Worth 80 cr.',   value:80 },
    { name:'Research Ship Data',   col:'#66ccff', desc:'Lost Science Office field data. Quest item.',  value:0 },
  ]},
];

// RIGHT column: cargo commodities (spawned into G.cargo — listed by COMMODITIES key)
const DEBUG_CARGO_CATALOG = [
  { cat:'Station Goods', items:['ammo','food','luxuries','microelec'] },
  { cat:'Cultural Goods', items:['pelts','herbs','carvings','seeds','fabric','totems','medicine'] },
  { cat:'Industrial',     items:['ore','rations','lenses','reagents','parts','solvents','metal','instruments','datadrives'] },
  { cat:'Mineral Ore',    items:['ore_fe','ore_cu','ore_si','ore_ti','ore_au','ore_pt','ore_ur','ore_xc'] },
];

