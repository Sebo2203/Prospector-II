function selectHullForPurchase(index){G.base.hullSel=index;G.base.hullQuoteKey=null;renderAll();}

function drawHullShipyard(b,cw,ch){
  const ids=hangarHullIds(),selected=Math.min(b.hullSel||0,ids.length-1),page=Math.floor(selected/4);
  const cls=SHIP_CLASSES[ids[selected]],stats=buildShipStats(cls.id),profile=hullSystemProfile(cls.id),quote=getHullPurchaseQuote(cls.id);
  const text=(value,x,y,color='#a7bbcf',font='12px Courier New',width=cw-x-35)=>{
    ctx.textAlign='left';ctx.font=font;ctx.fillStyle=color;ctx.fillText(value,x,y,width);
  };
  text('SHIPYARD',40,30,'#65bdff','bold 19px Courier New');
  text('Factory hulls · equipment stays yours · trade-in reflects condition',40,50,'#8295a8');
  ids.slice(page*4,page*4+4).forEach((id,row)=>{
    const hull=SHIP_CLASSES[id],index=page*4+row,y=72+row*70;
    ctx.fillStyle=index===selected?'#142b40':'#0b111b';ctx.fillRect(40,y,265,62);
    ctx.strokeStyle=index===selected?'#4d9dd7':'#263447';ctx.strokeRect(40,y,265,62);
    text(hull.name,51,y+20,index===selected?'#e2efff':'#9caec0','bold 13px Courier New',242);
    text(hull.price+' cr · Size '+hull.size,51,y+37,'#cfb87e','11px Courier New',242);
    text(id===G.shipStats.classId?'Current hull':'Select to compare and review',51,y+53,'#8196a8','10px Courier New',242);
    canvasMenuTarget(40,y,265,62,()=>selectHullForPurchase(index));
  });
  text('Catalog '+(page+1)+' / '+Math.ceil(ids.length/4),40,369,'#8b9fb2');
  if(page)canvasMenuButton('Previous',40,390,()=>selectHullForPurchase(Math.max(0,selected-4)));
  if((page+1)*4<ids.length)canvasMenuButton('Next',165,390,()=>selectHullForPurchase(Math.min(ids.length-1,selected+4)));
  const x=330,w=cw-x-36;
  text(cls.name.toUpperCase(),x,84,'#b9e2ff','bold 17px Courier New');
  text('Size '+cls.size+' · Frame '+cls.structure+' · Engineering '+cls.engineering+' · Refit space '+stats.refitSpace,x,105,'#b7a3cd','11px Courier New');
  const pairs=[['Hull HP',cls.baseHp+' → '+stats.maxUpgradeHp],['Fuel',cls.baseFuel+' → '+stats.maxUpgradeFuel],
    ['Cargo',cls.cargoCapacity+' → '+stats.maxUpgradeCargo],['Crew',cls.maxCrew+' → '+stats.maxUpgradeCrew],
    ['Weapons',cls.weaponSlots+' → '+stats.maxWeaponSlots+' · mounts '+profile.mounts.join('/')],['Modules',cls.moduleSlots+' → '+stats.maxModuleSlots],
    ['Sensors',cls.sensorRange+' → '+stats.maxUpgradeSensor],['Engine grade',cls.engineRating+' → '+stats.maxUpgradeEngine]];
  pairs.forEach(([label,value],index)=>text(label+'  '+value,x+(index%2)*w/2,129+Math.floor(index/2)*20,'#a5b7c8','11px Courier New',w/2-8));
  const pace=Math.round(cls.engineRating*cls.geometry/Math.sqrt(cls.size)*100)/100;
  text('Drive pace '+pace+' · Fuel '+shipTravelFuelCost(stats)+'/sector · Launch '+cls.size+' fuel',x,214,'#e6c58a','12px Courier New');
  text('Individual maxima share refit space; they cannot all be fitted together.',x,234,'#8799ac','11px Courier New');
  ctx.fillStyle='#233345';ctx.fillRect(x,245,w,1);
  text('Hull '+cls.price+' + transfer 500 + required berths/cargo '+quote.extras,x,266,'#a5b7c8','11px Courier New');
  text('Trade-in: hull '+quote.tradeHull+' + refits '+quote.tradeRefits+' cr',x,286,'#a4d5b2','12px Courier New');
  text('Net exchange '+quote.net+' cr · Credits '+G.credits,x,308,'#ffe09a','bold 14px Courier New');
  text(quote.weapons+' weapons and '+quote.modules+' utilities → this station’s stores.',x,331,'#98b4cb','11px Courier New');
  text('Fuel retained '+quote.fuel+(quote.vented?' · '+quote.vented+' surplus fuel will be vented.':' · No fuel created.'),x,350,'#c2ae84','11px Courier New');
  text('New hull/cores: 100%. Weapons and utilities must be refitted from stores.',x,370,'#8799ac','10px Courier New');
  const reason=quote.reason||(G.credits<quote.net?'Insufficient credits':'');
  if(reason)text(reason,x,397,'#e2a27c','12px Courier New');
  else canvasMenuButton((b.hullQuoteKey===quote.key?'Confirm exchange':'Review exchange')+' [Enter]',x,416,()=>handleStationKey('Enter'));
}
