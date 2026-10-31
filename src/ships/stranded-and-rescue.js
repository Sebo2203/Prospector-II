// ─────────────────────────────────────────────────────────────────
//  STRANDED — wait a turn, drain crew, check rescue
// ─────────────────────────────────────────────────────────────────
function doStrandedWait(){
  if(!G.stranded) return;
  const st = G.stranded;

  // If a rescue offer is on the table, don't advance the turn — just remind the player
  if(st.rescuePhase==='offer'){
    addLog('Rescue offer pending — press [Y] to accept or [N] to decline.','lw');
    renderAll(); return;
  }
  if(st.rescuePhase==='broke'){
    st.rescuePhase = null;
    st.rescueShip  = null;
  }
  st.turnsStranded++;
  G.turn++;

  // Crew oxygen drain — 3 HP per crew member per turn stranded
  const dmgPerCrew = 3;
  G.crew.filter(c=>c.hp>0).forEach(c=>{
    c.hp = Math.max(0, c.hp - dmgPerCrew);
    if(c.hp<=0) addLog(crewDisplayName(c)+' has succumbed to oxygen depletion!','lc');
  });
  SFX.suffocate();
  pruneDead();
  checkDeath();
  if(G.dead){ renderAll(); return; }

  // Every 3 turns, log a status message
  if(st.turnsStranded % 3 === 0){
    const hpTotal = G.crew.filter(c=>c.hp>0).reduce((s,c)=>s+c.hp,0);
    addLog('Turn '+st.turnsStranded+' stranded. Crew HP: '+hpTotal+'. Reserves failing.','lw');
  }

  // Move neutral ships + pirates
  moveNeutralShips();
  movePirates();
  moveGasEntities();
  tickNpcStranded();

  // SOS makes pirates in range more aggressive (treat as if distance halved)
  if(st.sos && !DEBUG.shipInvisible){
    const aggressivePirate = G.pirates.find(p=>{
      if(!p.alive) return false;
      const dist = Math.abs(p.x-G.ship.x)+Math.abs(p.y-G.ship.y);
      return dist <= 12; // doubled aggression range
    });
    if(aggressivePirate && Math.random()<0.35){
      // The pirate notices the SOS and moves directly toward you this turn
      stepToward(aggressivePirate, G.ship.x, G.ship.y);
      const distNow = Math.abs(aggressivePirate.x-G.ship.x)+Math.abs(aggressivePirate.y-G.ship.y);
      if(distNow<=3) addLog('WARNING: '+aggressivePirate.name+' homing in on your SOS signal!','lc');
    }
  }

  // Check if any pirate has reached our tile → combat even stranded
  const pirateArrived = G.pirates.find(p=>p.alive&&p.x===G.ship.x&&p.y===G.ship.y);
  if(pirateArrived && !DEBUG.shipInvisible){
    addLog(pirateArrived.name+' closes in on your disabled ship!','lc');
    G.stranded = null;
    startShipCombat(pirateArrived);
    if(G.shipCombat) G.shipCombat.foughtWhileStranded = true;
    return;
  }

  // Check if a neutral ship is now adjacent or on our tile → offer rescue
  if(!st.rescuePhase){
    const rescuer = (G.neutralShips||[]).find(ns=>{
      const dist = Math.abs(ns.x-G.ship.x)+Math.abs(ns.y-G.ship.y);
      return dist <= 1;
    });
    if(rescuer){
      // Mark it rescuing in case it wasn't already
      rescuer.rescuing = true;
      st.rescueShip = rescuer;
      st.rescuePhase = 'offer';
      const costStr = rescuer.rescueCost > 0 ? 'for '+rescuer.rescueCost+' cr' : 'at no charge';
      addLog(rescuer.name+' pulls alongside your ship! They offer '+rescuer.fuelGift+' fuel '+costStr+'.','lg');
      renderAll(); return;
    }

    // No rescuer yet — occasionally a nearby neutral ship notices you (or SOS attracts)
    const noticeRange = st.sos ? 18 : 8;
    const noticedShip = (G.neutralShips||[]).find(ns=>{
      if(ns.rescuing) return false;
      const dist = Math.abs(ns.x-G.ship.x)+Math.abs(ns.y-G.ship.y);
      const chance = st.sos ? 0.45 : 0.12;
      return dist <= noticeRange && Math.random() < chance;
    });
    if(noticedShip){
      noticedShip.rescuing = true;
      const timeStr = Math.ceil(Math.abs(noticedShip.x-G.ship.x)+Math.abs(noticedShip.y-G.ship.y));
      const eta = Math.ceil(timeStr / noticedShip.speed);
      const costStr = noticedShip.rescueCost>0 ? ' (rescue fee: '+noticedShip.rescueCost+' cr)' : ' (no charge)';
      addLog(noticedShip.name+' has spotted your situation. ETA ~'+eta+' turns.'+costStr,'lg');
    }
  }

  renderAll();
}

function doAcceptRescue(){
  const st = G.stranded;
  if(!st||!st.rescueShip) return;
  const ns = st.rescueShip;
  if(ns.rescueCost > 0 && G.credits < ns.rescueCost){
    addLog('Cannot afford the rescue fee of '+ns.rescueCost+' cr!','lc');
    st.rescuePhase = 'broke';
    renderAll(); return;
  }
  if(ns.rescueCost > 0) G.credits -= ns.rescueCost;
  G.fuel = Math.min(G.maxFuel, G.fuel + ns.fuelGift);
  G._alarmFuelWarn = false;
  G._alarmFuelCrit = false;
  ns.rescuing = false;
  const costMsg = ns.rescueCost>0 ? ' Paid '+ns.rescueCost+' cr.' : ' No charge.';
  addLog(ns.name+' transferred '+ns.fuelGift+' units of fuel.'+costMsg+' Engines back online!','lg');
  addLog('Crew HP damage from exposure cannot be undone. Seek medical attention.','lw');
  G.stranded = null;
  renderAll();
}

function doDeclineRescue(){
  const st = G.stranded;
  if(!st||!st.rescueShip) return;
  const ns = st.rescueShip;
  ns.rescuing = false;
  st.rescueShip = null;
  st.rescuePhase = null;
  addLog(ns.name+' acknowledged. They will not return.','li');
  renderAll();
}

// ─────────────────────────────────────────────────────────────────
//  STRANDED OVERLAY — drawn over galaxy map
// ─────────────────────────────────────────────────────────────────
function drawStrandedOverlay(){
  if(!G.stranded) return;
  const st = G.stranded;
  const cw = canvas.width, ch = canvas.height;
  const cx = cw/2;

  // Dark tinted panel bottom-left
  const px2 = 20, py2 = ch-190, pw = 440, ph = 170;
  ctx.fillStyle='rgba(20,0,0,0.88)'; ctx.fillRect(px2, py2, pw, ph);
  ctx.strokeStyle = st.sos ? '#ff4400' : '#552222';
  ctx.lineWidth = st.sos ? 2 : 1;
  ctx.strokeRect(px2, py2, pw, ph);

  ctx.textAlign='left';
  ctx.font='bold 15px Courier New';
  ctx.fillStyle='#ff4444';
  ctx.fillText('⚠  STRANDED — ENGINES DEAD', px2+12, py2+20);

  ctx.fillStyle='#2a0808'; ctx.fillRect(px2+10, py2+26, pw-20, 1);

  // SOS status
  const sosCol = st.sos ? '#ff6600' : '#555566';
  const sosLabel = st.sos ? '● SOS BEACON: ACTIVE' : '○ SOS BEACON: OFF';
  ctx.font='bold 14px Courier New'; ctx.fillStyle=sosCol;
  ctx.fillText(sosLabel, px2+12, py2+44);
  ctx.font='13px Courier New'; ctx.fillStyle='#443333';
  ctx.fillText('[T] toggle', px2+260, py2+44);

  // Crew drain status
  const living = G.crew.filter(c=>c.hp>0);
  ctx.font='14px Courier New'; ctx.fillStyle='#cc6666';
  ctx.fillText('Crew: '+living.length+' alive  —  -3 HP/crew/turn', px2+12, py2+64);

  // HP bars for crew
  living.forEach((c,i)=>{
    const hpPct = c.hp/c.maxHp;
    const bx2 = px2+12+i*80, by2 = py2+74, bw2=70, bh2=10;
    ctx.fillStyle='#1a0808'; ctx.fillRect(bx2,by2,bw2,bh2);
    ctx.fillStyle = hpPct<0.3?'#ff3300':hpPct<0.6?'#ff8800':'#44ff88';
    ctx.fillRect(bx2,by2,Math.round(bw2*hpPct),bh2);
    ctx.font='11px Courier New'; ctx.fillStyle='#aaa';
    ctx.fillText(c.hp, bx2, by2+22);
  });

  // Nearest rescue ship
  const rescuer = (G.neutralShips||[]).find(ns=>ns.rescuing);
  const y3 = py2+102;
  if(rescuer){
    const dist2 = Math.abs(rescuer.x-G.ship.x)+Math.abs(rescuer.y-G.ship.y);
    const eta2 = Math.max(1, Math.ceil(dist2/rescuer.speed));
    ctx.font='13px Courier New'; ctx.fillStyle=rescuer.col;
    ctx.fillText('► '+rescuer.name+' inbound — ~'+eta2+' turn'+(eta2!==1?'s':''), px2+12, y3);
    const feeStr = rescuer.rescueCost>0 ? '  Fee: '+rescuer.rescueCost+' cr' : '  No charge';
    ctx.fillStyle='#666677'; ctx.fillText(feeStr, px2+12, y3+16);
  } else {
    ctx.font='13px Courier New'; ctx.fillStyle='#444455';
    ctx.fillText('No rescue vessel inbound.', px2+12, y3);
    ctx.fillStyle='#332222';
    ctx.fillText(st.sos ? 'SOS active — chances improved.' : 'Enable SOS to improve chances.', px2+12, y3+16);
  }

  // Turn counter
  ctx.font='13px Courier New'; ctx.fillStyle='#553333';
  ctx.fillText('Turns stranded: '+st.turnsStranded, px2+12, y3+36);

  // Rescue offer panel
  if(st.rescuePhase==='offer' && st.rescueShip){
    const ns2 = st.rescueShip;
    const opx=px2, opy=py2-80, opw=pw, oph=72;
    ctx.fillStyle='rgba(0,20,10,0.95)'; ctx.fillRect(opx,opy,opw,oph);
    ctx.strokeStyle='#44ff88'; ctx.lineWidth=2; ctx.strokeRect(opx,opy,opw,oph);
    ctx.font='bold 14px Courier New'; ctx.fillStyle='#44ff88';
    ctx.fillText(ns2.name+' offers '+ns2.fuelGift+' fuel', opx+12, opy+20);
    const fee2 = ns2.rescueCost>0 ? 'Cost: '+ns2.rescueCost+' cr  (you have '+G.credits+' cr)' : 'No charge';
    ctx.font='13px Courier New'; ctx.fillStyle='#778899';
    ctx.fillText(fee2, opx+12, opy+38);
    ctx.font='bold 14px Courier New';
    ctx.fillStyle='#44ff88'; ctx.fillText('[Y] Accept', opx+12, opy+58);
    ctx.fillStyle='#ff6644'; ctx.fillText('[N] Decline', opx+160, opy+58);
  }
  if(st.rescuePhase==='broke'){
    const opx=px2, opy=py2-52, opw=pw, oph=44;
    ctx.fillStyle='rgba(30,0,0,0.95)'; ctx.fillRect(opx,opy,opw,oph);
    ctx.strokeStyle='#ff4444'; ctx.lineWidth=1; ctx.strokeRect(opx,opy,opw,oph);
    ctx.font='bold 13px Courier New'; ctx.fillStyle='#ff6666';
    ctx.fillText('Insufficient credits — '+st.rescueShip.name+' moves on.', opx+12, opy+18);
    ctx.font='13px Courier New'; ctx.fillStyle='#553333';
    ctx.fillText('Press any movement key to continue waiting.', opx+12, opy+34);
    // Auto-dismiss broke state after showing it
    G.stranded.rescueShip = null;
    G.stranded.rescuePhase = null;
  }

  ctx.textAlign='left';
  ctx.lineWidth=1;
}

