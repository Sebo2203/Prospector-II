// Inspection is a menu over the current location, never a new gameplay mode.
// Keep its cursor outside the career save and discard it when the career/location changes.
let shipSystemsView=null;

function shipSystemsActive(){
  if(shipSystemsView && (shipSystemsView.career!==G || (shipSystemsView.mode!==G?.mode && !shipSystemsView.repairing) ||
     G.dead || G.retired || G.showOptions || G.dialogue)) shipSystemsView=null;
  return !!shipSystemsView;
}

function shipSystemsIds(){
  return Object.keys(SHIP_SYSTEMS).filter(id=>id!=='shields' || G.shipStats.shields);
}

function openShipSystems(){
  if(!G || canvasMenuBlocked() || G.dead || G.retired || G.showOptions || G.dialogue || DEBUG.on) return;
  const origin=G.mode==='base'?'hangar':G.mode==='inventory'?'ship':'flight';
  if(origin==='ship') G._viewTab='ship';
  shipSystemsView={career:G,mode:G.mode,origin,id:'engine',method:0};
  selectShipSystem('engine');
}

function closeShipSystems(){
  shipSystemsView=null;
  renderAll();
}

function selectShipSystem(id){
  shipSystemsView.id=id;
  const actions=shipSystemsActions();
  shipSystemsView.method=Math.max(0,actions.findIndex(action=>!action.reason));
  renderAll();
}

function shipSystemsActions(){
  const id=shipSystemsView.id,component=ensureShipSystems()[id];
  const mode=G.mode==='inventory'?G._prevMode:G.mode;
  if(mode==='base'){
    const cost=(100-component.condition)*2;
    return [{method:'station',label:'Restore ('+cost+' cr)',
      detail:'Station technicians restore full integrity. No turn cost.',
      reason:component.condition>=100?'Already at full integrity':G.credits<cost?'Need '+cost+' credits':''}];
  }
  const engineer=G.crew.some(crew=>crew.hp>0 && crew.role==='engineer');
  const kits=G.inventory.filter(item=>item.usable==='repair_kit').length;
  const access=!shipRepairAccess()?'Return to your ship':!engineer?'Requires a living engineer':'';
  const actions=[
    {method:'kit',label:'Repair kit',detail:'Consumes 1 kit and 1 turn. Restores up to 85% integrity.',
      reason:access || (component.condition>=85?'At the 85% field repair limit':!kits?'No repair kits aboard':'')}
  ];
  if(id!=='fuelTank') actions.push({method:'improvised',label:'Attempt improvised repair',detail:'',
    reason:access || (component.bypassUntil>G.turn?'Improvised repair already active':
      !shipSystemCanImprovise(G.ship,id)?'No repair needed':'')});
  return actions;
}

function activateShipSystemRepair(method){
  const action=shipSystemsActions().find(action=>action.method===method);
  if(!action || action.reason) return;
  const view=shipSystemsView;
  // Field actions briefly restore the underlying location while advancing its turn.
  view.repairing=true;
  try{repairShipSystem(view.id,method);}
  finally{view.repairing=false;renderAll();}
}

function handleShipSystemsKey(key){
  if(key==='Escape'){closeShipSystems();return;}
  const ids=shipSystemsIds(),view=shipSystemsView;
  if(key==='ArrowUp' || key==='ArrowDown'){
    selectShipSystem(ids[(ids.indexOf(view.id)+(key==='ArrowUp'?-1:1)+ids.length)%ids.length]);
  } else if(key==='ArrowLeft' || key==='ArrowRight' || key==='Tab'){
    const count=shipSystemsActions().length;
    view.method=(view.method+(key==='ArrowLeft'?-1:1)+count)%count;
    renderAll();
  } else if(key==='Enter' || key===' '){
    activateShipSystemRepair(shipSystemsActions()[view.method].method);
  }
}

function shipSystemRomanRating(value){
  if(!Number.isSafeInteger(value)||value<=0)return 'None';
  let text='';
  for(const [number,roman] of [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]){
    while(value>=number){text+=roman;value-=number;}
  }
  return text;
}

function shipSystemEffect(id){
  const stats=G.shipStats,component=ensureShipSystems()[id];
  if(id==='reactor') return 'Output '+shipReactorOutput()+' / fitted demand '+shipWeaponPowerUsed();
  if(id==='cooling') return 'Cooling '+shipCoolingRate()+'/turn / heat capacity '+shipHeatCapacity();
  if(id==='shields'){
    const shield=shipShieldReadout();
    return 'Charge '+shield.charge+' / '+shield.capacity+' / '+shield.state;
  }
  if(id==='sensors') return effectiveSensorRange()===0?'OFFLINE · Existing charts retained; new terrain and live contacts hidden':
    'Installed range '+stats.sensorRange+' / effective '+effectiveSensorRange();
  if(id==='engine'){
    const effective=effectiveEngineRating(),reason=shipReactorOutput()<2?' · reactor power offline':
      effective<stats.engineRating?' · reduced by engine damage':'';
    return 'Installed '+shipSystemRomanRating(stats.engineRating)+' / effective '+(effective?shipSystemRomanRating(effective):'OFFLINE')+reason+
      ' · Drive pace '+shipDrivePerformance()+' · Hull limit '+shipSystemRomanRating(stats.maxUpgradeEngine);
  }
  return 'Usable capacity '+G.maxFuel+' / '+stats.maxFuel+' / fuel '+Math.floor(G.fuel)+(component.condition<=50?' / RUPTURED':'');
}

function drawShipSystems(){
  const cw=canvasWidth,ch=canvasHeight,view=shipSystemsView;
  if(!shipSystemsIds().includes(view.id)){view.id='engine';view.method=0;}
  const hangar=view.origin==='hangar',accent=hangar?'#44aaff':'#ffe066';
  const x=hangar?cw/2-410:40,w=hangar?820:cw-80,top=hangar?78:110;
  ctx.fillStyle='#030308';ctx.fillRect(0,0,cw,ch);
  if(view.origin==='ship') drawInventoryFrame(closeShipSystems,'Back [Esc]');
  ctx.textAlign=hangar?'center':'left';
  ctx.font='bold '+(hangar?19:20)+'px Courier New';ctx.fillStyle=hangar?accent:'#aaddff';
  ctx.fillText(hangar?'HANGAR / CORE SYSTEMS':'SHIP SYSTEMS',hangar?cw/2:x,hangar?30:68);
  ctx.font='13px Courier New';ctx.fillStyle='#667788';
  ctx.fillText(hangar?G.base.stationName:G.shipStats.hullType+' · '+(G.shipName||'Vessel'),hangar?cw/2:x,hangar?46:86,w);
  ctx.fillStyle=hangar?'#223344':'#1a1a2a';ctx.fillRect(x,hangar?52:96,w,1);
  if(view.origin!=='ship') canvasMenuButton('Back [Esc]',40,ch-27,closeShipSystems);
  canvasMenuScroll=step=>handleShipSystemsKey(step<0?'ArrowUp':'ArrowDown');

  const systems=ensureShipSystems(),listW=260,detailX=x+listW+24,detailW=w-listW-24;
  const text=(value,tx,ty,color='#aabbcc',font='12px Courier New',maxW)=>{
    ctx.textAlign='left';ctx.font=font;ctx.fillStyle=color;
    if(maxW) ctx.fillText(value,tx,ty,maxW);else ctx.fillText(value,tx,ty);
  };
  text('CORE SYSTEMS',x,top-8,'#667788','bold 11px Courier New');
  shipSystemsIds().forEach((id,index)=>{
    const y=top+index*36,sel=id===view.id,condition=systems[id].condition;
    const offline=id!=='fuelTank' && shipSystemRating(G.ship,id)===0;
    ctx.fillStyle=sel?'#0e1a2a':'#08080f';ctx.fillRect(x,y,listW,30);
    ctx.strokeStyle=sel?accent:'#1a1a2a';ctx.lineWidth=sel?1.5:1;ctx.strokeRect(x,y,listW,30);
    if(sel) text('▶',x+6,y+19,accent);
    text(SHIP_SYSTEMS[id].name,x+20,y+19,sel?accent:'#99aabb','bold 13px Courier New',listW-100);
    ctx.textAlign='right';ctx.fillStyle=offline || condition<=50?'#ff9977':'#7799aa';ctx.fillText((offline?'OFF ':'')+condition+'%',x+listW-10,y+19);
    canvasMenuTarget(x,y,listW,30,()=>selectShipSystem(id),{label:SHIP_SYSTEMS[id].name});
  });
  const component=systems[view.id],temporary=Math.max(0,component.bypassUntil-G.turn);
  const installed=G.shipStats[SHIP_SYSTEMS[view.id].stat];
  text(SHIP_SYSTEMS[view.id].name+(view.id==='fuelTank'?' · Capacity '+installed:' '+shipSystemRomanRating(installed)),detailX,top+14,'#aaddff','bold 16px Courier New');
  text(component.condition+'% integrity'+(temporary?' · improvised repair '+temporary+' turns':''),detailX,top+35,
    component.condition<=50?'#ff9977':'#99bbaa');
  ctx.fillStyle='#11151d';ctx.fillRect(detailX,top+43,detailW,5);
  ctx.fillStyle=component.condition<=50?'#bb6644':'#448877';ctx.fillRect(detailX,top+43,detailW*component.condition/100,5);
  ctx.font='12px Courier New';ctx.fillStyle='#99aabb';ctx.textAlign='left';
  drawWrappedText(shipSystemEffect(view.id),detailX,top+67,detailW,15,3);
  shipSystemsActions().forEach((action,index)=>{
    const y=top+112+index*51,sel=index===view.method;
    ctx.fillStyle=action.reason?'#050508':sel?'#0e1a2a':'#08080f';ctx.fillRect(detailX,y,detailW,30);
    ctx.strokeStyle=sel?accent:'#1a1a2a';ctx.lineWidth=sel?1.5:1;ctx.strokeRect(detailX,y,detailW,30);
    text((sel?'▶ ':'')+action.label+(sel?' [Enter]':''),detailX+10,y+19,action.reason?'#556677':sel?accent:'#aabbcc','bold 13px Courier New');
    canvasMenuTarget(detailX,y,detailW,30,action.reason?undefined:()=>activateShipSystemRepair(action.method),
      {label:action.label,shortcut:sel?'Enter':undefined});
    text(action.reason || action.detail,detailX+2,y+44,action.reason?'#aa8866':'#667788','11px Courier New',detailW-4);
  });

  // Loadout stays visible without making the passive ship-overview cards interactive.
  const footer=ch-116;
  ctx.fillStyle='#1a1a2a';ctx.fillRect(x,footer,w,1);
  text('Heat '+Math.ceil(G.ship.heat)+' / '+shipHeatCapacity()+'   Power '+shipWeaponPowerUsed()+' / '+shipReactorOutput()+
    '   Repair kits '+G.inventory.filter(item=>item.usable==='repair_kit').length,x,footer+17,'#88aabb');
  const slots=G.shipStats.maxWeaponSlots||G.shipStats.weaponSlots,colW=w/Math.max(1,slots);
  for(let slot=0;slot<slots;slot++){
    const weapon=SHIP_WEAPONS[G.installedWeapons?.[slot]],locked=slot>=G.shipStats.weaponSlots,tx=x+slot*colW;
    text('M'+(slot+1)+' '+['','Light','Medium','Heavy'][shipMountSize(slot)]+' · '+(locked?'Locked':weapon?.name||'Empty'),tx,footer+37,'#aabbcc','bold 11px Courier New',colW-10);
    if(weapon && !locked){
      text(weapon.power+' power / '+weapon.heat+' heat / reload '+weapon.cooldown,tx,footer+52,'#667788','11px Courier New',colW-10);
      const reason=!shipWeaponOnline(G.ship,slot)?shipWeaponFitReason(slot,weapon):'';
      text(reason || shipWeaponAvailability(G.ship,slot)+(weapon.ammo?' · '+(G.ship.ammo?.[weapon.ammo]||0)+' missiles':''),tx,footer+67,reason?'#bb8866':'#779988','11px Courier New',colW-10);
    }
  }
  const modules=G.installedModules||[];
  text('Utilities '+modules.length+' / '+G.shipStats.moduleSlots+' · '+(modules.map(id=>id.replaceAll('_',' ')).join(', ')||'None'),x,footer+85,'#667788','11px Courier New',w);
  const guideX=x+(view.origin==='ship'?0:130);
  text('Core reserve: 2 power + shield grade. Mounts draw in order. Waiting doubles cooling.',guideX,footer+100,'#556677','10px Courier New',x+w-guideX);
  ctx.lineWidth=1;
}
