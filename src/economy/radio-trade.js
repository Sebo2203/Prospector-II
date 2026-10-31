function doRadioHailLegacy(ns){
  // Fallback for unknown ship types
  addLog(ns.name+': "Signal received. We are underway."','li');
  renderAll();
}

function doRadioHail(){
  if(G.mode!=='galaxy' || G.dead || G.retired) return;
  const ns = nearestRadioContact();
  if(!ns){ addLog('Radio sweep: no ship transponders in range.','li'); renderAll(); return; }
  startGalaxyShipDialogue(ns);
}

function radioTradeRows(){
  const ns = G.radio?.ship;
  if(!ns) return [];
  ensureMerchantStock(ns);
  const rows = [];
  const fuelBuy = Math.min(25, Math.floor(G.maxFuel-G.fuel), ns.radioFuelStock||0);
  rows.push({ label:'Close channel', detail:'Return to galaxy map', id:'close' });
  rows.push({ label:'Buy fuel '+fuelBuy+'u', detail:fuelBuy>0 ? (fuelBuy*ns.radioFuelPrice)+' cr at '+ns.radioFuelPrice+' cr/u' : 'No fuel transfer available', id:'fuel', disabled:fuelBuy<=0 });
  (ns.radioStock||[]).forEach((item,i)=>{
    rows.push({ label:'Buy '+item.name, detail:item.cost+' cr - '+item.detail+(item.stock>0?' ['+item.stock+' left]':' [OUT OF STOCK]'), id:'item_'+i, disabled:item.stock<=0 });
  });
  return rows;
}

function executeRadioTrade(id){
  const ns = G.radio?.ship;
  if(!ns){ G.mode='galaxy'; return; }
  ensureMerchantStock(ns);
  if(id==='close'){
    addLog('Radio channel closed.','li');
    G.radio=null; G.mode='galaxy'; renderAll(); return;
  }
  if(id==='fuel'){
    const amt = Math.min(25, Math.floor(G.maxFuel-G.fuel), ns.radioFuelStock||0);
    const cost = amt * ns.radioFuelPrice;
    if(amt<=0){ addLog(ns.name+': "No fuel to transfer."','lw'); renderAll(); return; }
    if(G.credits < cost){ addLog('Need '+cost+' cr for that fuel transfer.','lw'); renderAll(); return; }
    G.credits -= cost;
    G.fuel = Math.min(G.maxFuel, G.fuel + amt);
    ns.radioFuelStock -= amt;
    addLog(ns.name+' transfers '+amt+' fuel for '+cost+' cr.','lg');
    renderAll(); return;
  }
  if(id.startsWith('item_')){
    const idx = parseInt(id.slice(5));
    const item = ns.radioStock[idx];
    if(!item || item.stock<=0){ addLog('That item is no longer available.','lw'); renderAll(); return; }
    if(G.credits < item.cost){ addLog('Need '+item.cost+' cr for '+item.name+'.','lw'); renderAll(); return; }
    G.credits -= item.cost;
    item.stock--;
    addPurchasedPawnItem(item);
    addLog(ns.name+' sells you '+item.name+' for '+item.cost+' cr.','lg');
    renderAll(); return;
  }
}

function drawRadioOverlay(){
  const cw=canvas.width, ch=canvas.height;
  const ns = G.radio?.ship;
  if(!ns){ G.mode='galaxy'; return; }
  const rows = radioTradeRows();
  G.radio.sel = Math.max(0, Math.min(G.radio.sel||0, rows.length-1));
  ctx.fillStyle='rgba(0,0,0,0.86)'; ctx.fillRect(0,0,cw,ch);
  ctx.textAlign='center';
  ctx.font='bold 19px Courier New'; ctx.fillStyle='#ffdd66';
  ctx.fillText('MERCHANT RADIO LINK', cw/2, 34);
  ctx.font='14px Courier New'; ctx.fillStyle='#8899aa';
  ctx.fillText(ns.name+'  -  range '+neutralShipDistance(ns)+' / '+radioRange(), cw/2, 54);
  ctx.fillStyle='#332a11'; ctx.fillRect(cw/2-280, 66, 560, 1);
  const startY=92, rowH=42;
  rows.forEach((row,i)=>{
    const y=startY+i*rowH;
    const sel=i===G.radio.sel;
    ctx.fillStyle=sel?'#18150a':'#08080f'; ctx.fillRect(cw/2-280,y-22,560,34);
    ctx.strokeStyle=sel?'#aa8833':'#2a2414'; ctx.strokeRect(cw/2-280,y-22,560,34);
    ctx.textAlign='left'; ctx.font='bold 14px Courier New'; ctx.fillStyle=row.disabled?'#554433':sel?'#ffdd88':'#ccaa55';
    ctx.fillText(row.label, cw/2-266, y-2);
    ctx.font='12px Courier New'; ctx.fillStyle=row.disabled?'#443322':'#777766';
    ctx.fillText(row.detail, cw/2-40, y-2);
  });
  ctx.textAlign='center'; ctx.font='13px Courier New'; ctx.fillStyle='#445566';
  ctx.fillText('Up/Down select   Enter trade   Esc close channel', cw/2, ch-14);
  ctx.textAlign='left';
}
