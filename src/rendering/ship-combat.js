function drawShipCombatOverlay(combat=G.shipCombat){
  if(!combat) return;
  const map = COMBAT_MAP;
  const w = map.width*TS, h = map.height*TS;
  const {player} = combat;
  const selected = combat.enemies[combat.target];
  const living = livingShipCombatEnemies(combat);
  const weapons = shipCombatWeapons();
  const px = point=>map.x+point.x*TS, py = point=>map.y+point.y*TS;
  ctx.fillStyle='#03050a';ctx.fillRect(0,0,canvasWidth,canvasHeight);
  drawShipCombatSpace();
  drawShipCombatPlasma(combat);
  for(const rock of combat.asteroids){
    if(!DEBUG.fullVision && !combat.seenTiles[rock.y*map.width+rock.x]) continue;
    const x=px(rock), y=py(rock);
    if(OPTIONS.asciiMode){
      ctx.fillStyle='#c5ceda';ctx.font='bold 18px Courier New';ctx.textAlign='left';ctx.fillText('#',x+6,y+18);
    } else drawSprite('combat_asteroid_'+((Math.imul(rock.x+1,7)+rock.y*11)>>>0)%4,x,y);
  }
  ctx.strokeStyle=shipCombatEscapeReady(combat)?'#87d8a6':shipCombatEdge(player)?'#995c60':'#457661';
  ctx.strokeRect(map.x+0.5,map.y+0.5,w-1,h-1);

  drawDirectionalShip(G.shipStats.sprite||'player_ship',px(player),py(player),player.dx,player.dy);
  for(const enemy of living){
    if(!shipCombatContactVisible(combat,enemy)) continue;
    const x=px(enemy), y=py(enemy), ship=enemy.ship;
    if(ship._homeCluster){
      if(OPTIONS.asciiMode) drawAsciiTile('gas_entity',x,y);
      else DRAW.gas_entity(ctx,x,y,ship.variant);
    } else if(enemy.collection==='neutralShips'){
      const art=neutralShipArt(ship);
      drawSpriteTinted(OPTIONS.asciiMode?art.sprite:shipDirectionKey(art.sprite,enemy.dx,enemy.dy),x,y,art.tint);
    } else {
      drawDirectionalShip('pirate_ship',x,y,enemy.dx,enemy.dy);
    }
    if(enemy===selected){
      ctx.strokeStyle='#ffe097';ctx.lineWidth=1;
      ctx.beginPath();
      for(const [xx,yy,sx,sy] of [[x+1,y+1,1,1],[x+TS-1,y+1,-1,1],[x+1,y+TS-1,1,-1],[x+TS-1,y+TS-1,-1,-1]]){
        ctx.moveTo(xx,yy+sy*5);ctx.lineTo(xx,yy);ctx.lineTo(xx+sx*5,yy);
      }
      ctx.stroke();
    }
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
  drawShipCombatShotFeedback(combat);
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
  ctx.font='11px Courier New';ctx.fillStyle='#8e9daa';ctx.textAlign='right';
  ctx.fillText(shipCombatSensorRange()?'Sensor range '+shipCombatSensorRange():'Sensors offline',x+width-10,30,textWidth-90);
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

  // Keep the former heading's breathing room between ship and target.
  y+=21;
  if(target && shipCombatContactVisible(combat,target)){
    const ship=target.ship, natural=!!ship._homeCluster;
    ctx.font='bold 12px Courier New';ctx.fillStyle='#f3dfaa';ctx.textAlign='left';
    y=drawWrappedText(ship.name,textX,y,textWidth,14,2)+2;
    y=meter('Hull',ship.hp,ship.maxHp,y,'#e4b98c');
    const targetShields=shipShieldReadout(ship);
    if(targetShields)y=meter('Shields',targetShields.charge,targetShields.capacity,y,'#81c5df',targetShields.state);
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
  const selected=weapons[combat.weapon];
  if(selected){
    const reload=Math.max(0,(G.ship.weaponReadyAt[selected.slot]||0)-G.turn);
    text('Peak heat '+(G.ship.heat+selected.weapon.heat)+'/'+shipHeatCapacity()+
      (reload?' · Reload in '+reload+'t':''),y+10,'#8e9daa','11px Courier New');
  }
}

// Space and its star field are continuous; neither fog nor weapon range paints tile backgrounds.
function drawShipCombatSpace(){
  const map=COMBAT_MAP;
  let seed=((G.seed||1)^Math.imul(G.ship.x+1,73856093)^Math.imul(G.ship.y+1,19349663))>>>0;
  for(let i=0;i<38;i++){
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const x=map.x+2+seed%(map.width*TS-4);
    seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const y=map.y+2+seed%(map.height*TS-4);
    ctx.fillStyle=i%7===0?'#46505d':'#222b38';ctx.fillRect(x,y,1,1);
  }
}

function drawShipCombatPlasma(combat){
  const visible=combat.trails.filter(trail=>shipCombatInSensorRange(combat,trail));
  for(const trail of visible){
    const life=Math.max(1,trail.damage/2),remaining=Math.max(0,trail.expires-combat.round);
    const stage=Math.min(3,Math.max(0,Math.floor((1-Math.min(1,remaining/life))*4)));
    const x=COMBAT_MAP.x+trail.x*TS,y=COMBAT_MAP.y+trail.y*TS;
    drawSprite('combat_plasma_'+stage,x,y);
    if(!livingShipCombatEnemies(combat).some(enemy=>enemy.x===trail.x && enemy.y===trail.y)){
      canvasMenuTarget(x,y,TS,TS,null,{title:'Plasma exhaust · '+trail.damage+' damage · '+remaining+' rounds left'});
    }
  }
}
