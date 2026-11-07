const shipSystemsDialog=document.getElementById('ship-systems-dialog');

function openShipSystems(){
  if(!G || AUTOSAVE_STATE.transition || G.dead || G.retired || G.showOptions || G.dialogue) return;
  renderShipSystems();
  if(!shipSystemsDialog.open) shipSystemsDialog.showModal();
}

function closeShipSystems(){
  if(shipSystemsDialog.open) shipSystemsDialog.close();
}

function renderShipSystems(){
  if(!G) return;
  if(G.dead || G.retired){closeShipSystems();return;}
  const focus=document.activeElement?.dataset.systemAction;
  const stats=G.shipStats, systems=ensureShipSystems();
  const atStation=(G.mode==='inventory'?G._prevMode:G.mode)==='base';
  const engineer=G.crew.some(crew=>crew.hp>0 && crew.role==='engineer');
  const kits=G.inventory.filter(item=>item.usable==='repair_kit').length;
  const rows=Object.entries(SHIP_SYSTEMS).map(([id,definition])=>{
    if(id==='shields' && !stats.shields) return '';
    const component=systems[id], bypass=Math.max(0,component.bypassUntil-G.turn);
    let effect='Installed '+(stats[definition.stat]??1)+' · Effective '+shipSystemRating(G.ship,id);
    if(id==='reactor') effect='Output '+shipReactorOutput()+' · Fitted demand '+shipWeaponPowerUsed();
    if(id==='cooling') effect='Cooling '+shipCoolingRate()+'/turn · Heat capacity '+shipHeatCapacity();
    if(id==='shields'){const shield=shipShieldReadout();effect='Charge '+shield.charge+' / '+shield.capacity+' · '+shield.state;}
    if(id==='sensors') effect='Installed '+stats.sensorRange+' · Effective '+effectiveSensorRange();
    if(id==='engine') effect='Installed '+stats.engineRating+' · Effective '+effectiveEngineRating();
    if(id==='sensors' && effectiveSensorRange()===0) effect='OFFLINE · Existing charts retained; new terrain and live contacts hidden';
    if(id==='fuelTank') effect='Usable '+G.maxFuel+' / '+stats.maxFuel+' · Fuel '+Math.floor(G.fuel)+(component.condition<=50?' · RUPTURED':'');
    const button=(method,label,disabled)=>'<button type="button" data-system-action="'+id+':'+method+'" '+(disabled?'disabled':'')+'>'+label+'</button>';
    return '<section class="ship-system-row"><div><strong>'+definition.name+'</strong>'+
      '<span class="'+(component.condition<=50?'system-damaged':'')+'"> '+component.condition+'% integrity'+
      (bypass?' · bypass '+bypass+' turns':'')+'</span><p>'+htmlEsc(effect)+'</p></div><div class="system-actions">'+
      (atStation?button('station','Restore ('+((100-component.condition)*2)+' cr)',component.condition>=100 || G.credits<(100-component.condition)*2):
        button('kit','Repair kit',!engineer || !kits || component.condition>=85 || !shipRepairAccess())+
        button('bypass','Bypass 15 turns',!engineer || !shipSystemCanBypass(G.ship,id) || !shipRepairAccess()))+
      '</div></section>';
  }).join('');
  const mounts=Array.from({length:stats.maxWeaponSlots||stats.weaponSlots},(_,slot)=>{
    const weapon=SHIP_WEAPONS[G.installedWeapons?.[slot]];
    const locked=slot>=stats.weaponSlots;
    const reason=weapon && !shipWeaponOnline(G.ship,slot)?shipWeaponFitReason(slot,weapon):'';
    return '<li>Mount '+(slot+1)+' · '+['','Light','Medium','Heavy'][shipMountSize(slot)]+
      ' · '+htmlEsc(locked?'Locked':weapon?.name||'Empty')+
      (weapon && !locked?' · '+(reason||((shipWeaponOnline(G.ship,slot)?'Online':'Offline')+' · '+weapon.power+' power · '+weapon.heat+' heat · reload '+weapon.cooldown+' · '+shipWeaponAvailability(G.ship,slot))):'')+'</li>';
  }).join('');
  document.getElementById('ship-systems-content').innerHTML=
    '<p class="ship-system-summary">Heat '+Math.ceil(G.ship.heat)+' / '+shipHeatCapacity()+
    ' · Reactor '+shipWeaponPowerUsed()+' / '+shipReactorOutput()+' · Repair kits '+kits+'</p>'+
    '<p>Engineer field repairs consume a kit and one turn, restoring up to 85%. A bypass supports a damaged core for 15 turns. Tank ruptures require a kit or station repair. Station technicians restore full integrity.</p>'+
    rows+'<h3>Weapon mounts</h3><p>Core services reserve 2 power; shields reserve their installed grade. Remaining power feeds mounts in order. Waiting doubles cooling.</p><ul>'+mounts+'</ul><p>Utility slots '+(G.installedModules||[]).length+' / '+stats.moduleSlots+
    ' · '+htmlEsc((G.installedModules||[]).join(', ')||'No utility equipment')+'</p>';
  if(focus) Array.from(shipSystemsDialog.querySelectorAll('[data-system-action]'))
    .find(button=>button.dataset.systemAction===focus && !button.disabled)?.focus();
}

shipSystemsDialog.addEventListener('click',event=>{
  const action=event.target.closest('[data-system-action]');
  if(!action) return;
  const [id,method]=action.dataset.systemAction.split(':');
  repairShipSystem(id,method);
  renderShipSystems();
});
shipSystemsDialog.addEventListener('cancel',event=>{event.preventDefault();closeShipSystems();});
