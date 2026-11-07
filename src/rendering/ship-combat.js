function drawShipCombatOverlay(){
  const combat = G.shipCombat;
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
    ctx.fillStyle='#38414f'; ctx.fillRect(x+3,y+5,18,14);
    ctx.fillStyle='#788797'; ctx.fillRect(x+6,y+4,10,4);
    ctx.fillStyle='#252f3a'; ctx.fillRect(x+13,y+13,8,6);
    if(OPTIONS.asciiMode){
      ctx.fillStyle='#c5ceda';ctx.font='bold 18px Courier New';ctx.textAlign='left';ctx.fillText('#',x+6,y+18);
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
  drawShipCombatNearbyPlasma(combat);
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
  const center=point=>({x:COMBAT_MAP.x+point.x*TS+TS/2,y:COMBAT_MAP.y+point.y*TS+TS/2});
  ctx.save();
  if(!OPTIONS.asciiMode){
    ctx.lineCap='round';
    for(const trail of visible){
      if(!trail.dx && !trail.dy) continue;
      const next={x:trail.x+(trail.dx||0),y:trail.y+(trail.dy||0)};
      const follows=visible.some(other=>other.x===next.x && other.y===next.y) ||
        (next.x===combat.player.x && next.y===combat.player.y) ||
        livingShipCombatEnemies(combat).some(enemy=>shipCombatContactVisible(combat,enemy) && enemy.x===next.x && enemy.y===next.y);
      if(!follows) continue;
      const from=center(trail),to=center(next);
      const remaining=Math.max(0,trail.expires-combat.round),life=Math.max(1,trail.damage/2);
      ctx.globalAlpha=Math.min(1,remaining/life);
      for(const [width,color] of [[8,'#47220f'],[4,'#9c4016'],[1,'#e78c36']]){
        ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();
        ctx.moveTo(from.x,from.y);ctx.lineTo(to.x,to.y);ctx.stroke();
      }
    }
  }
  ctx.globalAlpha=1;
  for(const trail of visible){
    const life=Math.max(1,trail.damage/2),remaining=Math.max(0,trail.expires-combat.round);
    const stage=Math.min(3,Math.max(0,Math.floor((1-Math.min(1,remaining/life))*4)));
    const x=COMBAT_MAP.x+trail.x*TS,y=COMBAT_MAP.y+trail.y*TS;
    drawSprite('combat_plasma_'+stage,x,y);
    if(!livingShipCombatEnemies(combat).some(enemy=>enemy.x===trail.x && enemy.y===trail.y)){
      canvasMenuTarget(x,y,TS,TS,null,{title:'Plasma exhaust · '+trail.damage+' damage · '+remaining+' rounds left'});
    }
  }
  ctx.restore();
}

function drawShipCombatNearbyPlasma(combat){
  const player=combat.player,boostEnd={x:player.x+player.dx*2,y:player.y+player.dy*2};
  const hazards=combat.trails.filter(trail=>shipCombatInSensorRange(combat,trail) &&
    (shipCombatDistance(player,trail)<=1 || (trail.x===boostEnd.x && trail.y===boostEnd.y)));
  if(!hazards.length) return;
  const entries=hazards.map(trail=>{
    const dx=trail.x-player.x,dy=trail.y-player.y;
    const direction=Math.abs(dx)>1 || Math.abs(dy)>1?'Boost end':dx===0 && dy===0?'Here':
      (dy<0?'N':dy>0?'S':'')+(dx<0?'W':dx>0?'E':'');
    return direction+' '+trail.damage+'/'+Math.max(0,trail.expires-combat.round);
  });
  const x=COMBAT_MAP.x+4,y=COMBAT_MAP.y+COMBAT_MAP.height*TS+17;
  ctx.font='11px Courier New';ctx.textAlign='left';ctx.fillStyle='#bb9778';
  ctx.fillText('Nearby plasma: direction · damage / rounds remaining',x,y);
  ctx.fillStyle='#d8ad80';drawWrappedText(entries.join(' · '),x,y+14,COMBAT_MAP.width*TS-8,12,2);
}
