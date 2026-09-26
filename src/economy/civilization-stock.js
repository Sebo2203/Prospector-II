function generateCivBarterStock(civ){
  if(!civ) return [];
  const tier = civ.tier;
  const rng = civRng(civ._stockSeed || (civ._stockSeed = Math.floor(Math.random()*0xFFFFFF)));

  // Each entry is either a commodityId (goes to G.cargo on purchase)
  // or an inline usable def (goes to G.inventory on purchase).
  const pools = {
    primitive: ['herbs','carvings','pelts','seeds','pelts'],
    tribal:    ['fabric','totems','medicine','carvings',
                { name:'Fermented Brew', desc:'Local spirit. Potent.', value:45, col:'#cc8833', usable:'morale_drug' }],
    medieval:  ['ore','ore_fe','ore_cu','rations','lenses','reagents',
                { name:'Armour Plate', desc:'Hammered metal plate. Provides basic protection (+1 DEF).', value:90, col:'#aaaacc', usable:'armor_plate' }],
    industrial:['parts','solvents','metal','ore','ore_fe','ore_cu',
                { name:'Medikit (local)', desc:'Basic field kit. Functional but unsterilised.', value:140, col:'#ff6688', usable:'medikit' },
                { name:'Handheld Drill', desc:'Portable percussion drill for ore extraction.', value:280, col:'#cc9944', usable:'mining_tool', miningMult:1.0 }],
    information:['datadrives','instruments','metal','parts','ore_ti','ore_si',
                { name:'Oxygen Canister', desc:'Processed O₂. Refills suit supply.', value:150, col:'#44ddff', usable:'oxytank' },
                { name:'Field Medkit', desc:'Modern first-aid kit.', value:170, col:'#ff6688', usable:'medikit' },
                { name:'Mining Laser', desc:'Focused thermal cutter for fast ore extraction.', value:650, col:'#44eeff', usable:'mining_tool', miningMult:2.5 }],
  };

  const pool = pools[tier] || pools.tribal;
  const count = 3 + Math.floor(rng() * 2);
  const shuffled = pool.slice().sort(()=>rng()-0.5);
  return shuffled.slice(0, count).map(entry => {
    if(typeof entry === 'string'){
      const com = COMMODITIES[entry];
      return { commodityId:entry, name:com.name, col:com.col, value:com.basePrice,
               isCommodity:true, qty:1+Math.floor(rng()*2), _remaining:1+Math.floor(rng()*2) };
    }
    // Inline usable
    return { ...entry, qty:1+Math.floor(rng()*2), _remaining:1+Math.floor(rng()*2) };
  });
}

