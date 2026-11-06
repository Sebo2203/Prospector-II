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
  ctx.fillStyle='#e2eafb'; ctx.font='bold 16px Courier New'; ctx.textAlign='left';
  ctx.fillText('TACTICAL COMBAT',12,23);
  ctx.fillStyle='#879bb2'; ctx.font='12px Courier New';
  ctx.fillText('Round '+combat.round+'  ·  Disengage at the edge  ·  Gray: asteroid  ·  Amber: exhaust',213,23);
  ctx.fillStyle='#050811'; ctx.fillRect(map.x,map.y,w,h);

  ctx.save();
  ctx.beginPath();
  ctx.rect(map.x,map.y,w,h);
  ctx.clip();
  if(activeWeapon){
    const range=activeWeapon.range;
    ctx.fillStyle='#101c2a';
    ctx.fillRect(px(player)-range*TS,py(player)-range*TS,(range*2+1)*TS,(range*2+1)*TS);
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
    const x=px(trail), y=py(trail);
    ctx.fillStyle='#563322'; ctx.fillRect(x+2,y+2,TS-4,TS-4);
    ctx.fillStyle='#e09a52'; ctx.font='bold 14px Courier New';
    ctx.fillText(String(trail.damage),x+5,y+16);
    if(!living.some(enemy=>shipCombatDistance(enemy,trail)===0)){
      canvasMenuTarget(x,y,TS,TS,null,{title:'Plasma exhaust · '+trail.damage+' damage · '+(trail.expires-combat.round)+' rounds left'});
    }
  }
  for(const rock of combat.asteroids){
    const x=px(rock), y=py(rock);
    ctx.fillStyle='#38414f'; ctx.fillRect(x+3,y+5,18,14);
    ctx.fillStyle='#788797'; ctx.fillRect(x+6,y+4,10,4);
    ctx.fillStyle='#252f3a'; ctx.fillRect(x+13,y+13,8,6);
    if(OPTIONS.asciiMode){
      ctx.fillStyle='#c5ceda'; ctx.fillText('#',x+8,y+16);
    }
  }
  ctx.strokeStyle=shipCombatEscapeReady(combat)?'#87d8a6':shipCombatEdge(player)?'#995c60':'#457661';
  ctx.strokeRect(map.x+0.5,map.y+0.5,w-1,h-1);

  if(selected){
    ctx.strokeStyle=activeWeapon && shipCombatDistance(player,selected)<=activeWeapon.range &&
      shipCombatShotClear(combat,player,selected) ? '#7fb6ca' : '#595d69';
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
  const target = combat.enemies[combat.target];
  const text=(value,y,color='#aebdd0',font='12px Courier New')=>{
    ctx.fillStyle=color; ctx.font=font; ctx.textAlign='left';
    ctx.fillText(value,textX,y,textWidth);
  };
  ctx.fillStyle='#101924'; ctx.fillRect(x,42,width,408);
  text('YOUR SHIP',60,'#a8d8f8','bold 13px Courier New');
  text('Hull '+G.ship.hp+'/'+G.ship.maxHp+'   Shields '+combat.playerShields+'/'+G.shipStats.shields,78);
  if(G.fuel<=0 && !DEBUG.infiniteFuel) text('Engines offline',96,'#f09878');

  if(target){
    text('TARGET · '+livingShipCombatEnemies(combat).length+' CONTACTS',116,'#f0a9a6','bold 13px Courier New');
    text(target.ship.name,134,'#f3dfaa');
    text('Hull '+target.ship.hp+'/'+target.ship.maxHp+'   Shields '+target.shields,151);
    text('Distance '+shipCombatDistance(combat.player,target)+'  ·  Enemy range '+shipCombatEnemyRange(target),168);
  }
  text('WEAPONS',195,'#a8d8f8','bold 13px Courier New');
  if(!weapons.length) text('No weapons installed',217,'#b8a487');
  weapons.forEach((entry,index)=>{
    const y=204+index*29;
    const selected=index===combat.weapon;
    ctx.fillStyle=selected?'#263d4c':'#17242f'; ctx.fillRect(textX,y,textWidth,26);
    const status=shipCombatWeaponStatus(combat,entry);
    ctx.fillStyle=selected?'#e2f2ff':'#9fafbf'; ctx.font='bold 12px Courier New';
    ctx.fillText((index+1)+'  '+entry.weapon.name,textX+6,y+11,textWidth-12);
    ctx.font='10px Courier New'; ctx.fillStyle=status==='Ready'?'#89dfaa':'#d6b482';
    ctx.fillText('Range '+entry.weapon.range+' · '+status,textX+6,y+22,textWidth-12);
    canvasMenuTarget(textX,y,textWidth,26,()=>selectShipCombatWeapon(index));
  });
  const y=306;
  text('COMMS LOG',y,'#a8d8f8','bold 13px Courier New');
  if(combat.logFontSize>9) canvasMenuButton('−',x+width-60,y-16,()=>adjustCombatLogFont(-1));
  if(combat.logFontSize<16) canvasMenuButton('+',x+width-32,y-16,()=>adjustCombatLogFont(1));
  const font=combat.logFontSize+'px Courier New', lineH=combat.logFontSize+3;
  ctx.font=font; ctx.textAlign='left';
  let logY=y+22;
  for(const message of combat.log){
    logY=drawWrappedText(message,textX,logY,textWidth,lineH,Math.floor((443-logY)/lineH)+1)+3;
    if(logY>443) break;
  }
  ctx.fillStyle='#7e90a3'; ctx.font='12px Courier New';
  ctx.fillText('Move with compass or keys  ·  Wait to reload  ·  Select a ship or press Tab',12,472);
}
