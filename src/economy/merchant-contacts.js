function radioRange(){
  const sensors=effectiveSensorRange();
  return sensors>0?sensors+5:0;
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
  G.inventory.push(inventoryItemFromStock(item));
}
