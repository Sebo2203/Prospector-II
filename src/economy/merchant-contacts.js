function radioRange(){
  return (G.shipStats?.sensorRange ?? 3) + 5;
}

function neutralShipDistance(ns){
  return Math.max(Math.abs(ns.x-G.ship.x),Math.abs(ns.y-G.ship.y));
}

function nearestRadioContact(){
  const rr = radioRange();
  return (G.neutralShips||[])
    .filter(ns=>neutralShipDistance(ns)<=rr)
    .sort((a,b)=>neutralShipDistance(a)-neutralShipDistance(b))[0] || null;
}

function ensureMerchantStock(ns){
  if(!ns.radioStock){
    const pool = PAWN_ITEM_POOL.filter(item => item.usable !== 'gun_sniper').filter(()=>Math.random()<0.65);
    ns.radioStock = pool.slice(0, 4 + rnd(3)).map(item=>({ ...item, cost:Math.ceil(item.cost*1.25), stock:1+rnd(3) }));
    if(Math.random() < 0.55){
      ns.radioStock.push({
        name:'Joy Dust',
        usable:'morale_drug',
        cost:190 + rnd(51),
        stock:1 + rnd(2),
        detail:'Contraband morale stimulant. Pushes crew spirits far above normal for a while.',
      });
    }
    ns.radioFuelPrice = 2 + rnd(2); // cr per fuel unit
    ns.radioFuelStock = 25 + rnd(51);
  }
}

function addPurchasedPawnItem(item){
  if(item.usable === 'medikit') G.inventory.push({name:'Medikit',col:'#ff6688',desc:'A medikit.',value:0,usable:'medikit'});
  else if(item.usable === 'oxytank') G.inventory.push({name:'Oxygen Tank',col:'#44ddff',desc:'An oxygen tank.',value:0,usable:'oxytank'});
  else if(item.usable === 'gun') G.inventory.push({name:item.name,col:'#aaaaff',desc:'+2 ATK when equipped.',value:0,usable:'gun'});
  else if(item.usable === 'gun_sniper') G.inventory.push({name:item.name,col:'#ffaa44',desc:'+5 ATK when equipped.',value:0,usable:'gun_sniper'});
  else if(item.usable === 'knife') G.inventory.push({name:item.name,col:'#ccccaa',desc:'+1 ATK when equipped.',value:0,usable:'knife'});
  else if(item.usable === 'floodlight') G.inventory.push({name:'Floodlight',col:'#ffffaa',desc:'Passive: always illuminates +2 tile radius.',value:0,usable:'floodlight'});
  else if(item.usable === 'armor_flight') G.inventory.push({name:item.name,col:'#88ddff',desc:'+1 DEF when equipped.',value:0,usable:'armor_flight'});
  else if(item.usable === 'armor_reinforced') G.inventory.push({name:item.name,col:'#ffcc44',desc:'+2 DEF when equipped.',value:0,usable:'armor_reinforced'});
  else if(item.usable === 'morale_drug') G.inventory.push({name:item.name,col:'#d488ff',desc:'A euphoric stimulant. Use from inventory to spike crew morale above normal limits.',value:0,usable:'morale_drug'});
}


