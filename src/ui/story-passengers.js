// Selection is disposable UI state, never part of a saved career.
let storyPassengerView=null;
function openStoryPassengers(){
  if(!quarantinePeople().some(s=>s.status==='onboard')){addLog('No rescue passengers aboard.','li');return;}
  storyPassengerView={career:G,index:0};G._viewTab='ship';renderAll();
}
function canTreatStoryPassenger(){
  const mode=G.mode==='inventory'?G._prevMode:G.mode;
  return ['galaxy','system','base'].includes(mode)||(mode==='planet'&&G.planets[G.curPlanet]?.grid[G.player.y]?.[G.player.x]?.type==='SHIP');
}
function treatStoryPassenger(){
  const people=quarantinePeople().filter(s=>s.status==='onboard'),s=people[storyPassengerView?.index||0];
  if(!s || !canTreatStoryPassenger()){addLog('Return to your ship to treat passengers.','lw');return;}
  if(!treatQuarantinePatient(s)){renderAll();return;}
  const mode=G._prevMode;G.mode=mode;
  if(mode==='planet')completeSurfaceAction();else {beginCareerTurn('services');finishCareerTurn();}
  if(!G.dead)G.mode='inventory';renderAll();
}
function handleStoryPassengerKey(key){
  const people=quarantinePeople().filter(s=>s.status==='onboard');
  if(key==='Escape'||key==='p'||key==='P'){storyPassengerView=null;renderAll();return;}
  if(key==='ArrowUp'||key==='ArrowDown')storyPassengerView.index=(storyPassengerView.index+(key==='ArrowDown'?1:-1)+people.length)%people.length;
  else if(key==='t'||key==='T')treatStoryPassenger();
  else if(key==='ArrowLeft'||key==='ArrowRight'){storyPassengerView=null;handleInventoryKey(key);return;}
  renderAll();
}
function drawStoryPassengers(cw,ch){
  const people=quarantinePeople().filter(s=>s.status==='onboard');
  storyPassengerView.index=Math.max(0,Math.min(people.length-1,storyPassengerView.index));
  ctx.textAlign='left';ctx.font='bold 18px Courier New';ctx.fillStyle='#aaddff';ctx.fillText('RESCUE PASSENGERS',40,72);
  ctx.font='12px Courier New';ctx.fillStyle='#8899aa';ctx.fillText(quarantineShipName()+' · emergency berths '+quarantineBerths()+' · pods use cargo space',40,94,cw-80);
  people.forEach((s,index)=>{
    const y=116+index*94,selected=index===storyPassengerView.index;
    canvasMenuTarget(40,y,cw-80,82,()=>{storyPassengerView.index=index;renderAll();});
    ctx.fillStyle=selected?'#101d2b':'#080c13';ctx.fillRect(40,y,cw-80,82);
    ctx.strokeStyle=selected?'#ccad54':'#273b4a';ctx.strokeRect(40,y,cw-80,82);
    drawQuarantinePerson(ctx,52,y+12,s,48);
    ctx.font='bold 15px Courier New';ctx.fillStyle='#e2d9b0';ctx.fillText(s.name,114,y+23);
    ctx.font='12px Courier New';ctx.fillStyle=s.infectious?'#e9ad6a':'#9ab6c5';
    ctx.fillText('Health '+s.hp+'/'+s.maxHp+' · '+(s.pod?'ISOLATED IN POD':'SHARED QUARTERS'),114,y+44,cw-170);
    ctx.fillText(s.infectious?'Feverish · antibiotics needed':s.injured?'Injured · medikit or MED III needed':'Stable · no field treatment needed',114,y+64,cw-170);
  });
  const s=people[storyPassengerView.index];
  if(s){
    if(canTreatStoryPassenger()&&(s.infectious||s.injured))canvasMenuButton('Give medical care [T]',40,ch-76,treatStoryPassenger);
    if(!canTreatStoryPassenger()){ctx.fillStyle='#cc9966';ctx.font='12px Courier New';ctx.fillText('Return to your ship to give medical care.',40,ch-92);}
  }
  canvasMenuButton('Back to ship [P]',cw-205,ch-76,()=>{storyPassengerView=null;renderAll();});
}
