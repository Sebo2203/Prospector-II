function drawShipCombatAsteroid(rock,x,y){
  const width=rock.width??1,height=rock.height??1;
  const variant=((Math.imul(rock.x+1,7)+rock.y*11)>>>0)%4;
  if(width===1 && height===1){drawSprite('combat_asteroid_'+variant,x,y);return;}
  // Shape-specific sprites have the exact native footprint dimensions.
  ctx.drawImage(IMG['combat_asteroid_large_'+width+'x'+height],x,y);
}

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
  drawShipCombatEnvironment(combat);
  drawShipCombatPlasma(combat);
  for(const rock of combat.asteroids){
    const visible=shipCombatAsteroidTiles(rock).filter(tile=>DEBUG.fullVision || combat.seenTiles[tile.y*map.width+tile.x]);
    if(!visible.length) continue;
    const x=px(rock), y=py(rock);
    if(OPTIONS.asciiMode){
      ctx.fillStyle='#c5ceda';ctx.font='bold 18px Courier New';ctx.textAlign='left';
      for(const tile of visible) ctx.fillText('#',px(tile)+6,py(tile)+18);
    } else {
      // Clip the silhouette to charted cells at the sensor frontier.
      ctx.save();ctx.beginPath();
      for(const tile of visible) ctx.rect(px(tile),py(tile),TS,TS);
      ctx.clip();drawShipCombatAsteroid(rock,x,y);
      ctx.restore();
    }
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
  drawShipCombatMissiles(combat);
  drawShipCombatReadout(combat);
  drawShipCombatMounts(combat,weapons);
  drawShipCombatShotFeedback(combat);
}

function drawShipCombatReadout(combat){
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
  const panelBottom=canvasHeight-8;
  ctx.fillStyle='#0c111a';ctx.fillRect(x,12,width,panelBottom-12);
  let y=heading('YOUR SHIP',30);
  ctx.font='11px Courier New';ctx.fillStyle='#8e9daa';ctx.textAlign='right';
  ctx.fillText(shipCombatSensorRange()?'Sensor range '+shipCombatSensorRange():'Sensors offline',x+width-10,30,textWidth-90);
  const shields=shipShieldReadout();
  if(shields){
    y=meter('Shields',shields.charge,shields.capacity,y,'#81c5df');
    text(shields.state+(shields.damaged?' · damaged':''),y-8,'#8eaabb','11px Courier New');
    y+=13;
  }
  y=meter('Heat',G.ship.heat,shipHeatCapacity(),y,G.ship.heat>=shipHeatCapacity()*0.8?'#f0ad76':'#aebdd0','Engine '+effectiveEngineRating()+' · Cool '+shipCoolingRate()+'/t');
  const bridge=shipBridgeSkills();
  text('Gunnery CBT '+bridge.gunnery+' · '+(bridge.gunner?crewDisplayName(bridge.gunner):'No operator'),y+3,'#a4c6d9','11px Courier New');y+=15;
  text('Helm NAV '+bridge.piloting+' · '+(bridge.pilot?crewDisplayName(bridge.pilot):'No operator'),y+3,'#a4c6d9','11px Courier New');y+=15;
  if(combat.environment?.type==='nebula'){
    text('NEBULA · '+(combat.environment.layout==='mixed'?'Gas + asteroids':'Gas pockets'),y+3,'#b2a7d5');y+=15;
    text('Gas: direct fire −15pp · guided unaffected',y+3,'#8d9daf','10px Courier New');y+=15;
  }
  const faults=[];
  if(effectiveEngineRating()===0) faults.push('Engines offline');
  else if(G.fuel<=0 && !DEBUG.infiniteFuel) faults.push('No fuel for thrust');
  if(effectiveSensorRange()===0) faults.push('Sensors offline');
  if(shipWeaponPowerUsed()>shipReactorOutput()) faults.push('Power shortfall');
  if(shipSystemCondition(G.ship,'cooling')===0) faults.push('Cooling failed');
  ctx.font='11px Courier New';ctx.fillStyle='#edaa77';ctx.textAlign='left';
  if(faults.length) y=drawWrappedText(faults.join(' · '),textX,y,textWidth,13,2)+3;
  const visibleMissiles=combat.missiles.filter(missile=>shipCombatInSensorRange(combat,missile));
  const incoming=visibleMissiles.filter(missile=>missile.target<0);
  if(incoming.length){
    const nearest=Math.min(...incoming.map(missile=>Math.max(1,Math.ceil(shipCombatDistance(missile,combat.player)/ARTEMIS_FLIGHT_SPEED))));
    text('Incoming missiles '+incoming.length+' · impact ~'+nearest+'t',y+5,'#ffc06b');y+=21;
  }
  const outgoing=visibleMissiles.length-incoming.length;
  if(outgoing){text('Your missiles in flight '+outgoing,y+5,'#91e3ca');y+=21;}
  if(!livingShipCombatEnemies(combat).length && combat.missiles.length){
    text('Enemy ships destroyed. Missiles still inbound.',y+5,'#ffc06b','11px Courier New');
  }

  if(livingShipCombatEnemies(combat).includes(target) && shipCombatContactVisible(combat,target)){
    const ship=target.ship, natural=!!ship._homeCluster;
    const targetShields=shipShieldReadout(ship);
    const armed=!natural && actorShipCombatWeapons(ship).length>0;
    ctx.font='bold 12px Courier New';ctx.fillStyle='#f3dfaa';ctx.textAlign='left';
    const nameLines=[];
    let line='';
    for(const word of ship.name.split(/\s+/)){
      const next=line?line+' '+word:word;
      if(line && ctx.measureText(next).width>textWidth){nameLines.push(line);line=word;}
      else line=next;
    }
    if(line)nameLines.push(line);
    // The last detail stays at the bottom; extra rows grow upward into the gap.
    const height=Math.min(2,nameLines.length)*14+2+25+(targetShields?25:0)+64+(armed?16:0);
    y=panelBottom-10-height+16;
    for(const name of nameLines.slice(0,2)){text(name,y,'#f3dfaa','bold 12px Courier New');y+=14;}
    y+=2;
    y=meter('Hull',ship.hp,ship.maxHp,y,'#e4b98c');
    if(targetShields)y=meter('Shields',targetShields.charge,targetShields.capacity,y,'#81c5df',targetShields.state);
    text(SHIP_TACTIC_LABELS[shipCombatTactic(target)],y,'#d0bb92','11px Courier New');y+=16;
    text('Distance '+shipCombatDistance(combat.player,target)+' · '+(natural?'Ram range 1':'Weapon range '+shipCombatEnemyRange(target)),y);y+=16;
    const mobility=shipCombatMoveRating(target);
    const pace=natural || effectiveSensorRange(ship)>0?mobility:0;
    text((natural?'Mobility ':'Drive ')+mobility+' · Move '+pace+'/'+(shipDrivePerformance()||1)+' per turn',y,'#8e9daa','11px Courier New');y+=16;
    const status=shipCombatEnemyActionStatus(combat,target);
    text(status,y,status==='Can fire'||status==='Can ram'?'#f0a9a6':'#aebdd0');y+=16;
    if(armed){text('Heat '+ship.heat+'/'+shipHeatCapacity(ship)+
      (actorShipCombatWeapons(ship).some(entry=>entry.weapon.ammo)?' · Artemis '+(ship.ammo.artemis||0):''),y,'#8e9daa','11px Courier New');y+=16;}
  } else {text('No live sensor contact',panelBottom-10,'#b8a487');}
}

function drawShipCombatMissiles(combat){
  for(const missile of combat.missiles){
    if(!shipCombatInSensorRange(combat,missile)) continue;
    const target=missile.target<0?combat.player:combat.enemies[missile.target];
    const x=COMBAT_MAP.x+missile.x*TS+TS/2+5,y=COMBAT_MAP.y+missile.y*TS+TS/2-5;
    ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(target.y-missile.y,target.x-missile.x));
    ctx.fillStyle=missile.target<0?'#ffb45e':'#87e9cb';ctx.strokeStyle='#1b2630';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(-4,-4);ctx.lineTo(-2,0);ctx.lineTo(-4,4);ctx.closePath();ctx.fill();ctx.stroke();
    ctx.fillStyle='#ffe2a0';ctx.fillRect(-7,-1,3,2);ctx.restore();
    canvasMenuTarget(x-6,y-6,12,12,null,{title:'Artemis missile → '+(missile.target<0?'your ship':target.ship.name)+
      ' · '+shipCombatDistance(missile,target)+' tiles · '+(ARTEMIS_FLIGHT_TICKS-missile.ticks)+' flight turns of fuel'});
  }
}

// Horizontal mount cards use the strip below the arena, with the same action guards.
function drawShipCombatMounts(combat,weapons){
  const x=COMBAT_MAP.x, width=COMBAT_MAP.width*TS;
  const top=COMBAT_MAP.y+COMBAT_MAP.height*TS+8, bottom=canvasHeight-8;
  ctx.font='bold 12px Courier New';ctx.fillStyle='#a8d8f8';ctx.textAlign='left';
  ctx.fillText('WEAPON MOUNTS',x,top+6);
  const selected=weapons[combat.weapon];
  if(selected){
    const reload=Math.max(0,(G.ship.weaponReadyAt[selected.slot]||0)-G.turn);
    ctx.font='11px Courier New';ctx.fillStyle='#8e9daa';ctx.textAlign='right';
    ctx.fillText('Peak heat '+(G.ship.heat+selected.weapon.heat)+'/'+shipHeatCapacity()+
      (reload?' · Reload in '+reload+'t':'')+
      (selected.weapon.ammo?' · Missiles '+(G.ship.ammo.artemis||0)+'/'+SHIP_AMMO.artemis.capacity:''),x+width,top+6,width-130);
  }
  const y=top+14, height=bottom-y, gap=6;
  if(!weapons.length){
    ctx.font='12px Courier New';ctx.fillStyle='#b8a487';ctx.textAlign='left';
    ctx.fillText('No weapons installed',x,y+18);
    return;
  }
  const cardWidth=(width-gap*(weapons.length-1))/weapons.length;
  weapons.forEach((entry,index)=>{
    const left=x+index*(cardWidth+gap), status=shipCombatWeaponStatus(combat,entry);
    const label=combatStatusText(status), selected=index===combat.weapon;
    ctx.fillStyle=selected?'#1b3040':'#111b25';ctx.fillRect(left,y,cardWidth,height);
    ctx.font='11px Courier New';const statusWidth=ctx.measureText(label).width;
    ctx.fillStyle=selected?'#e2f2ff':'#9fafbf';ctx.font='bold 12px Courier New';ctx.textAlign='left';
    ctx.fillText((index+1)+' '+entry.weapon.name,left+6,y+12,cardWidth-statusWidth-20);
    ctx.font='11px Courier New';ctx.fillStyle=status==='Ready'?'#89dfaa':'#d6b482';ctx.textAlign='right';
    ctx.fillText(label,left+cardWidth-6,y+12);
    ctx.textAlign='left';ctx.fillStyle='#94a8ba';
    ctx.fillText(entry.weapon.minDmg+'–'+entry.weapon.maxDmg+' dmg · Range '+entry.weapon.range+
      (entry.weapon.ammo?' · Guided · '+(G.ship.ammo[entry.weapon.ammo]||0)+' missiles':' · Heat '+entry.weapon.heat),left+6,y+26,cardWidth-12);
    canvasMenuTarget(left,y,cardWidth,height,()=>selectShipCombatWeapon(index));
  });
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
