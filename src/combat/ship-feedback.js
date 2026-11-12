// Disposable audiovisual playback. Rules, RNG and saves still resolve on the career turn.
const SHIP_FEEDBACK={career:null,combat:null,active:null,pending:[],timer:null};

function clearShipCombatFeedback(){
  clearTimeout(SHIP_FEEDBACK.timer);
  SHIP_FEEDBACK.career=SHIP_FEEDBACK.combat=SHIP_FEEDBACK.active=null;
  SHIP_FEEDBACK.pending.length=0;
}

function activeShipCombatFeedback(){
  if(SHIP_FEEDBACK.career!==G || !G ||
     (G.shipCombat && G.shipCombat!==SHIP_FEEDBACK.combat) || !['shipcombat','galaxy'].includes(G.mode)){
    clearShipCombatFeedback();return null;
  }
  return SHIP_FEEDBACK.active;
}

function queueShipCombatFeedback(combat,from,to,result){
  activeShipCombatFeedback();
  if(SHIP_FEEDBACK.combat && SHIP_FEEDBACK.combat!==combat)clearShipCombatFeedback();
  SHIP_FEEDBACK.career=G;SHIP_FEEDBACK.combat=combat;
  SFX.prepare();
  SHIP_FEEDBACK.pending.push({combat,from:{x:from.x,y:from.y},to:{x:to.x,y:to.y},
    visible:result.visible??shipCombatInSensorRange(combat,from),...result});
  // Rapid repeat input must not leave seconds of obsolete presentation behind.
  if(SHIP_FEEDBACK.pending.length>12)SHIP_FEEDBACK.pending.shift();
  if(!SHIP_FEEDBACK.active)playNextShipCombatFeedback();
}

function playNextShipCombatFeedback(){
  if(SHIP_FEEDBACK.career!==G){clearShipCombatFeedback();return;}
  const event=SHIP_FEEDBACK.pending.shift();
  SHIP_FEEDBACK.active=event||null;
  if(!event){if(G)renderAll();return;}
  event.born=performance.now();
  event.flight=event.impactOnly?0:event.guided?230:110;
  event.hold=event.critical?430:event.side==='enemy' && event.hit?300:190;
  if(event.weapon && !event.impactOnly && (event.side==='player'||event.visible))SFX.shipFire(event.weapon,event.combat);
  SHIP_FEEDBACK.timer=setTimeout(()=>{
    if(activeShipCombatFeedback()!==event)return;
    if(event.hit){
      if(event.impact==='ram')SFX.ram(event.combat);
      else if(event.impact==='asteroid')SFX.asteroid(event.combat);
      else if(event.impact==='wraith')SFX.wraith(event.combat);
      else if(event.hull===0)SFX.shieldHit();
      else if(event.side==='player')SFX.shipHit();
      else if(event.critical)SFX.coreHit();
      else if(event.hull>0)SFX.hullHit();
      else SFX.shieldHit();
    }
    if(G)drawCanvas();
    SHIP_FEEDBACK.timer=setTimeout(playNextShipCombatFeedback,event.hold);
  },event.flight);
}

function drawShipCombatShotFeedback(combat){
  const event=activeShipCombatFeedback();
  if(!event || event.combat!==combat)return;
  const age=performance.now()-event.born;
  const from={x:COMBAT_MAP.x+(event.from.x+0.5)*TS,y:COMBAT_MAP.y+(event.from.y+0.5)*TS};
  const to={x:COMBAT_MAP.x+(event.to.x+0.5)*TS,y:COMBAT_MAP.y+(event.to.y+0.5)*TS};
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  ctx.save();
  ctx.beginPath();ctx.rect(COMBAT_MAP.x,COMBAT_MAP.y,COMBAT_MAP.width*TS,COMBAT_MAP.height*TS);ctx.clip();
  if(age<event.flight && event.visible && !reduced){
    const progress=Math.min(1,age/event.flight),dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy)||1;
    const bend=event.guided?Math.sin(progress*Math.PI)*TS*2:0;
    const x=from.x+dx*progress-dy/length*bend,y=from.y+dy*progress+dx/length*bend+(event.hit?0:8*progress);
    const tangentX=dx-dy/length*(event.guided?Math.cos(progress*Math.PI)*Math.PI*TS*2:0);
    const tangentY=dy+dx/length*(event.guided?Math.cos(progress*Math.PI)*Math.PI*TS*2:0);
    const tangentLength=Math.hypot(tangentX,tangentY)||1;
    ctx.strokeStyle=event.guided?'#ffc06b':event.side==='player'?'#9dedd4':'#ff9974';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(x-tangentX/tangentLength*8,y-tangentY/tangentLength*8);ctx.lineTo(x,y);ctx.stroke();
    ctx.fillStyle='#fff3c9';ctx.fillRect(Math.round(x)-1,Math.round(y)-1,3,3);
  } else if(event.hit && age>=event.flight && age<event.flight+85 && (event.visible || event.side==='enemy')){
    ctx.fillStyle=event.critical?'#ff6655':event.side==='player'?'#aaffcc':'#ffbb88';
    ctx.globalAlpha=1-(age-event.flight)/85;
    ctx.fillRect(to.x-4,to.y-4,8,8);
  }
  ctx.restore();
}
