function drawShipCombatOverlay(){
  const combat = G.shipCombat;
  if(!combat) return;
  const map = COMBAT_MAP;
  const w = map.width*TS, h = map.height*TS;
  const {player} = combat;
  const selected = combat.enemies[combat.target];
  const living = livingShipCombatEnemies(combat);
  const weapons = shipCombatWeapons();
  const activeWeapon = weapons[combat.weapon]?.weapon;
  const px = point=>map.x+point.x*TS, py = point=>map.y+point.y*TS;
  ctx.fillStyle='#090c13'; ctx.fillRect(0,0,canvasWidth,canvasHeight);
  ctx.fillStyle='#050811'; ctx.fillRect(map.x,map.y,w,h);

  ctx.save();
  ctx.beginPath();
  ctx.rect(map.x,map.y,w,h);
  ctx.clip();
  if(activeWeapon && effectiveSensorRange()>0){
    const range=activeWeapon.range;
    const available=shipWeaponAvailability(G.ship,weapons[combat.weapon].slot)==='Ready';
    ctx.fillStyle=available?'#101c2a':'#11151d';
    for(let y=0;y<map.height;y++) for(let x=0;x<map.width;x++){
      const point={x,y}, occupant=living.find(enemy=>enemy.x===x && enemy.y===y);
      if(shipCombatDistance(player,point)<=range && shipCombatShotClear(combat,player,occupant||point)){
        ctx.fillRect(px(point),py(point),TS,TS);
      }
    }
  }
  ctx.strokeStyle='#202734'; ctx.lineWidth=1;
  ctx.beginPath();
  for(let x=1;x<map.width;x++){
    ctx.moveTo(map.x+x*TS,map.y); ctx.lineTo(map.x+x*TS,map.y+h);
  }
  for(let y=1;y<map.height;y++){
    ctx.moveTo(map.x,map.y+y*TS); ctx.lineTo(map.x+w,map.y+y*TS);
  }
  ctx.stroke();
  ctx.restore();

  for(const trail of combat.trails){
    if(!DEBUG.fullVision && (effectiveSensorRange()===0 || shipCombatDistance(player,trail)>6+effectiveSensorRange()*3)) continue;
    const x=px(trail), y=py(trail);
    ctx.fillStyle='#563322'; ctx.fillRect(x+2,y+2,TS-4,TS-4);
    ctx.fillStyle='#e09a52'; ctx.font='bold 14px Courier New';
    ctx.fillText(String(trail.damage),x+5,y+16);
    if(!living.some(enemy=>shipCombatDistance(enemy,trail)===0)){
      canvasMenuTarget(x,y,TS,TS,null,{title:'Plasma exhaust · '+trail.damage+' damage · '+(trail.expires-combat.round)+' rounds left'});
    }
  }
  for(const rock of combat.asteroids){
    if(!DEBUG.fullVision && !combat.seenTiles[rock.y*map.width+rock.x]) continue;
    const x=px(rock), y=py(rock);
    ctx.fillStyle='#38414f'; ctx.fillRect(x+3,y+5,18,14);
    ctx.fillStyle='#788797'; ctx.fillRect(x+6,y+4,10,4);
    ctx.fillStyle='#252f3a'; ctx.fillRect(x+13,y+13,8,6);
    if(OPTIONS.asciiMode){
      ctx.fillStyle='#c5ceda'; ctx.fillText('#',x+8,y+16);
    }
  }
  for(let y=0;y<map.height;y++) for(let x=0;x<map.width;x++){
    if(!DEBUG.fullVision && !combat.seenTiles[y*map.width+x]){
      ctx.fillStyle='#020409';ctx.fillRect(px({x}),py({y}),TS,TS);
    }
  }
  ctx.strokeStyle=shipCombatEscapeReady(combat)?'#87d8a6':shipCombatEdge(player)?'#995c60':'#457661';
  ctx.strokeRect(map.x+0.5,map.y+0.5,w-1,h-1);

  if(selected && shipCombatContactVisible(combat,selected)){
    ctx.strokeStyle=weapons[combat.weapon] && shipCombatWeaponStatus(combat,weapons[combat.weapon])==='Ready'?'#81d7aa':'#a18159';
    ctx.setLineDash([3,5]);
    ctx.beginPath();
    ctx.moveTo(px(player)+TS/2,py(player)+TS/2);
    ctx.lineTo(px(selected)+TS/2,py(selected)+TS/2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle='#20495d'; ctx.fillRect(px(player)+2,py(player)+2,TS-4,TS-4);
  drawDirectionalShip(G.shipStats.sprite||'player_ship',px(player),py(player),player.dx,player.dy);
  for(const enemy of living){
    if(!shipCombatContactVisible(combat,enemy)) continue;
    const x=px(enemy), y=py(enemy), ship=enemy.ship;
    ctx.fillStyle='#501d27'; ctx.fillRect(x+2,y+2,TS-4,TS-4);
    if(ship._homeCluster){
      if(OPTIONS.asciiMode) drawAsciiTile('gas_entity',x,y);
      else DRAW.gas_entity(ctx,x,y,ship.variant);
    } else if(enemy.collection==='neutralShips'){
      const art=neutralShipArt(ship);
      drawSpriteTinted(OPTIONS.asciiMode?art.sprite:shipDirectionKey(art.sprite,enemy.dx,enemy.dy),x,y,art.tint);
    } else {
      drawDirectionalShip('pirate_ship',x,y,enemy.dx,enemy.dy);
    }
    ctx.strokeStyle=enemy===selected?'#ffe097':'#a44d52';
    ctx.strokeRect(x+1,y+1,TS-2,TS-2);
    canvasMenuTarget(x,y,TS,TS,()=>{
      if(pointerShipCombatAim?.combat===combat && pointerShipCombatAim.enemy===enemy && enemy===selected){
        doShipFire();
      } else {
        selectShipCombatTarget(combat.enemies.indexOf(enemy));
        pointerShipCombatAim={combat,enemy};
      }
    },{title:ship.name+' · '+ship.hp+' hull · Range '+shipCombatDistance(player,enemy)});
  }
  drawShipCombatReadout(combat,weapons);
}

function drawShipCombatReadout(combat,weapons){
  const x=674, width=274, textX=x+10, textWidth=width-20;
  const target=combat.enemies[combat.target];
  const text=(value,y,color='#aebdd0',font='12px Courier New')=>{
    ctx.fillStyle=color;ctx.font=font;ctx.textAlign='left';
    ctx.fillText(value,textX,y,textWidth);
  };
  const heading=(value,y)=>{text(value,y,'#a8d8f8','bold 13px Courier New');return y+20;};
  const meter=(label,value,max,y,color,right='')=>{
    text(label+' '+value+'/'+max,y,color);
    if(right){
      ctx.fillStyle='#8e9daa';ctx.font='11px Courier New';ctx.textAlign='right';
      ctx.fillText(right,x+width-10,y);
    }
    ctx.fillStyle='#171e27';ctx.fillRect(textX,y+5,textWidth,3);
    ctx.fillStyle=color;ctx.fillRect(textX,y+5,Math.round(textWidth*Math.max(0,Math.min(1,max?value/max:0))),3);
    return y+25;
  };
  ctx.fillStyle='#0c111a';ctx.fillRect(x,12,width,460);
  let y=heading('YOUR SHIP',30);
  y=meter('Hull',G.ship.hp,G.ship.maxHp,y,'#9acde8');
  const shields=shipShieldReadout();
  if(shields){
    y=meter('Shields',shields.charge,shields.capacity,y,'#81c5df');
    text(shields.state+(shields.damaged?' · damaged':''),y-8,'#8eaabb','11px Courier New');
    y+=13;
  }
  y=meter('Heat',G.ship.heat,shipHeatCapacity(),y,G.ship.heat>=shipHeatCapacity()*0.8?'#f0ad76':'#aebdd0','Cooling '+shipCoolingRate()+'/turn');
  const faults=[];
  if(effectiveEngineRating()===0) faults.push('Engines offline');
  else if(G.fuel<=0 && !DEBUG.infiniteFuel) faults.push('No fuel for thrust');
  if(effectiveSensorRange()===0) faults.push('Sensors offline');
  if(shipWeaponPowerUsed()>shipReactorOutput()) faults.push('Power shortfall');
  if(shipSystemCondition(G.ship,'cooling')===0) faults.push('Cooling failed');
  ctx.font='11px Courier New';ctx.fillStyle='#edaa77';ctx.textAlign='left';
  if(faults.length) y=drawWrappedText(faults.join(' · '),textX,y,textWidth,13,2)+3;

  y=heading('SELECTED TARGET',y+1);
  if(target && shipCombatContactVisible(combat,target)){
    const ship=target.ship, natural=!!ship._homeCluster;
    ctx.font='bold 12px Courier New';ctx.fillStyle='#f3dfaa';ctx.textAlign='left';
    y=drawWrappedText(ship.name,textX,y,textWidth,14,2)+2;
    text('Hull '+ship.hp+'/'+ship.maxHp,y);y+=16;
    const targetShields=shipShieldReadout(ship);
    if(targetShields){text('Shields '+targetShields.charge+'/'+targetShields.capacity+' · '+targetShields.state,y,'#8eaabb','11px Courier New');y+=16;}
    text('Distance '+shipCombatDistance(combat.player,target)+' · '+(natural?'Ram range 1':'Weapon range '+shipCombatEnemyRange(target)),y);y+=16;
    const status=shipCombatEnemyActionStatus(combat,target);
    text(status,y,status==='Can fire'||status==='Can ram'?'#f0a9a6':'#aebdd0');y+=16;
    if(!natural && actorShipCombatWeapons(ship).length){text('Heat '+ship.heat+'/'+shipHeatCapacity(ship),y,'#8e9daa','11px Courier New');y+=16;}
  } else {text('No live sensor contact',y,'#b8a487');y+=16;}

  y=heading('WEAPON MOUNTS',y+1);
  if(!weapons.length) text('No weapons installed',y,'#b8a487');
  weapons.forEach((entry,index)=>{
    const selected=index===combat.weapon, status=shipCombatWeaponStatus(combat,entry);
    ctx.fillStyle=selected?'#1b3040':'#111b25';ctx.fillRect(textX,y,textWidth,34);
    const label=combatStatusText(status);
    ctx.font='11px Courier New';const statusWidth=ctx.measureText(label).width;
    ctx.fillStyle=selected?'#e2f2ff':'#9fafbf';ctx.font='bold 12px Courier New';ctx.textAlign='left';
    ctx.fillText((index+1)+' '+entry.weapon.name,textX+6,y+13,textWidth-statusWidth-20);
    ctx.font='11px Courier New';ctx.fillStyle=status==='Ready'?'#89dfaa':'#d6b482';ctx.textAlign='right';
    ctx.fillText(label,textX+textWidth-6,y+13);
    ctx.textAlign='left';ctx.fillStyle='#94a8ba';
    ctx.fillText(entry.weapon.minDmg+'–'+entry.weapon.maxDmg+' dmg · Range '+entry.weapon.range+' · Heat '+entry.weapon.heat,textX+6,y+27,textWidth-12);
    canvasMenuTarget(textX,y,textWidth,34,()=>selectShipCombatWeapon(index));
    y+=37;
  });
  const selected=weapons[combat.weapon]?.weapon;
  if(selected) text('Peak heat '+(G.ship.heat+selected.heat)+'/'+shipHeatCapacity()+' · Reload '+selected.cooldown+' action'+(selected.cooldown===1?'':'s'),y+10,'#8e9daa','11px Courier New');
}
