// ─────────────────────────────────────────────────────────────────
//  BARTER OVERLAY — keyboard-navigable civilization goods exchange
// ─────────────────────────────────────────────────────────────────
// Navigation: ↑↓ move cursor within active side, ←→ switch sides,
// Enter = toggle item on either side (multi-select both), Tab = confirm, Esc = close

const BARTER = {
  active: false,
  side: 'player',     // 'player' | 'civ'
  playerSel: 0,       // cursor index in player list
  civSel: 0,          // cursor index in civ list
  offered: new Set(), // player item indices being offered
  wanted: new Set(),  // civ item indices being requested
  playerItems: [],    // filtered inventory (tradeable)
  civItems: [],       // available civ stock
  civ: null,
};

function openBarterOverlay(){
  const wrap = dialogueCivilization();
  if(!wrap) return;
  const { civ } = wrap;

  // Inventory items: offerable physical goods. Civ-specific barter value is computed below,
  // so zero-credit weapons/usables can still matter to the receiving culture.
  const invItems = (G.inventory || [])
    .map((item, idx) => ({ item, idx, source:'inventory' }))
    .filter(({ item }) => item
      && !item.questItem
      && !(item.name && item.name.includes('Civilization Report')));
  // Cargo items: all commodities in the hold
  const cargoItems = (G.cargo || [])
    .map((item, idx) => ({ item, idx, source:'cargo' }))
    .filter(({ item }) => item && item.isCommodity);
  BARTER.playerItems = [...invItems, ...cargoItems];

  // Ensure civ stock is generated
  if(!civ._barterStock || !civ._barterStock.length){
    civ._barterStock = generateCivBarterStock(civ);
  }
  BARTER.civItems = civ._barterStock.filter(s => (s._remaining ?? s.qty ?? 0) > 0);

  BARTER.active    = true;
  BARTER.side      = BARTER.playerItems.length ? 'player' : 'civ';
  BARTER.playerSel = 0;
  BARTER.civSel    = 0;
  BARTER.offered   = new Set();
  BARTER.wanted    = new Set();
  BARTER.civ       = civ;

  document.getElementById('barter-title').textContent    = 'Barter — ' + (civ.species || 'Locals');
  document.getElementById('barter-subtitle').textContent = (civ.tier || '') + ' civilization';

  const overlay = document.getElementById('barter-overlay');
  overlay.style.display = 'flex';
  renderBarterOverlay();

  document.getElementById('barter-panel').focus();
}

function closeBarterOverlay(){
  BARTER.active = false;
  const overlay = document.getElementById('barter-overlay');
  overlay.style.display = 'none';
  renderAll();
}

function renderBarterOverlay(){
  const { playerItems, civItems, offered, wanted, side, playerSel, civSel } = BARTER;

  // ── Player list ──────────────────────────────────────────────
  const playerEl = document.getElementById('barter-player-list');
  if(!playerItems.length){
    playerEl.innerHTML = '<div style="padding:10px 12px;color:#445;font-style:italic;font-size:12px;">Nothing to offer</div>';
  } else {
    playerEl.innerHTML = playerItems.map(({ item, source }, i) => {
      const sel     = side === 'player' && i === playerSel;
      const checked = offered.has(i);
      const isCargo = source === 'cargo';
      const bg  = sel ? '#1a2030' : 'transparent';
      const col = checked ? '#ffe066' : (item.col || '#aaa');
      const cargoTag = isCargo
        ? `<span style="color:${checked?'#ffaa33':'#445566'};font-size:10px;letter-spacing:0.5px;">CARGO</span>`
        : '';
      return `<div data-barter-row="${i}" style="display:flex;align-items:center;gap:6px;padding:4px 12px;background:${bg};cursor:pointer;">
        <span style="color:${checked?'#ffe066':'#333'};font-size:13px;width:12px;">${checked?'▶':'·'}</span>
        <span class="barter-item-name" style="color:${col};">${htmlEsc(item.name)}</span>
        ${cargoTag}
        <span style="color:#556;font-size:11px;">${civOfferValueForBarter(BARTER.civ, item)} cv</span>
      </div>`;
    }).join('');
  }

  // ── Civ list ─────────────────────────────────────────────────
  const civEl = document.getElementById('barter-civ-list');
  if(!civItems.length){
    civEl.innerHTML = '<div style="padding:10px 12px;color:#445;font-style:italic;font-size:12px;">Nothing available</div>';
  } else {
    civEl.innerHTML = civItems.map((stock, i) => {
      const sel     = side === 'civ' && i === civSel;
      const checked = wanted.has(i);
      const isCargo = !!stock.isCommodity;
      const bg  = sel ? '#0a2010' : 'transparent';
      const col = checked ? '#90f0a0' : (stock.col || '#aaa');
      const qty = stock._remaining ?? stock.qty ?? 1;
      const cargoTag = isCargo
        ? `<span style="color:${checked?'#55cc88':'#334455'};font-size:10px;letter-spacing:0.5px;">CARGO</span>`
        : '';
      return `<div data-barter-row="${i}" style="display:flex;align-items:center;gap:6px;padding:4px 12px;background:${bg};cursor:pointer;">
        <span style="color:${checked?'#90f0a0':'#333'};font-size:13px;width:12px;">${checked?'▶':'·'}</span>
        <span class="barter-item-name" style="color:${col};">${htmlEsc(stock.name)}</span>
        ${cargoTag}
        <span style="color:#556;font-size:11px;">×${qty} · ${stock.value} cr</span>
      </div>`;
    }).join('');
  }

  // ── Summaries ─────────────────────────────────────────────────
  const offerNames = [...offered].map(i => playerItems[i]?.item?.name).filter(Boolean);
  const offerVal   = [...offered].reduce((s, i) => s + civOfferValueForBarter(BARTER.civ, playerItems[i]?.item), 0);
  const wantNames  = [...wanted].map(i => civItems[i]?.name).filter(Boolean);
  const wantVal    = [...wanted].reduce((s, i) => s + (civItems[i]?.value || 0), 0);

  document.getElementById('barter-offer-summary').textContent =
    offerNames.length ? offerNames.join(', ') + ' (' + offerVal + ' value to them)' : '— nothing —';
  document.getElementById('barter-want-summary').textContent =
    wantNames.length  ? wantNames.join(', ')  + ' (' + wantVal  + ' cr)' : '— nothing —';

  // ── Cargo space check ─────────────────────────────────────────
  // Count incoming commodity slots needed vs space freed by offered cargo items
  const incomingCargo = [...wanted].filter(i => civItems[i]?.isCommodity).length;
  const outgoingCargo = [...offered].filter(i => playerItems[i]?.source === 'cargo').length;
  const cap     = G.shipStats?.cargoCapacity ?? 0;
  const current = G.cargo?.length ?? 0;
  const netCargoChange = incomingCargo - outgoingCargo;
  const holdAfter = current + netCargoChange;
  const holdFull  = incomingCargo > 0 && holdAfter > cap;

  // ── Value balance ─────────────────────────────────────────────
  const valueEl   = document.getElementById('barter-value-info');
  const confirmEl = document.getElementById('barter-confirm-hint');
  if(wanted.size && offered.size){
    const fair = offerVal >= wantVal;
    if(holdFull){
      valueEl.innerHTML = `<span style="color:#ff7744;">Cargo hold full</span> <span style="color:#445">(${holdAfter}/${cap} after trade — free up space)</span>`;
      confirmEl.style.color = '#442200';
    } else {
      valueEl.innerHTML = fair
        ? `<span style="color:#70f090;">Fair trade</span> <span style="color:#445">(they value your offer at ${offerVal} for ${wantVal} cr)</span>`
        : `<span style="color:#f07070;">Undervalued</span> <span style="color:#445">(they value your offer at ${offerVal}, want ${wantVal} cr)</span>`;
      confirmEl.style.color = fair ? '#ffe066' : '#664';
    }
    confirmEl.textContent = '[Tab] Confirm Trade';
  } else if(offered.size && !wanted.size){
    valueEl.innerHTML = `<span style="color:#ffe066;">Gift offer</span> <span style="color:#445">(they value your offer at ${offerVal}, asking nothing back)</span>`;
    confirmEl.style.color = '#ffe066';
    confirmEl.textContent = '[Tab] Offer Gift';
  } else {
    valueEl.textContent   = '';
    confirmEl.style.color = '#445566';
    confirmEl.textContent = '[Tab] Confirm Trade';
  }

  // The summaries can resize the lists, so scroll after updating the layout.
  for(const [list, index] of [[playerEl, playerSel], [civEl, civSel]]){
    const row = list.children[index];
    if(!row) continue;
    const bottom = row.offsetTop + row.offsetHeight;
    if(row.offsetTop < list.scrollTop) list.scrollTop = row.offsetTop;
    else if(bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }
  renderContextBar();
}

function confirmBarterTrade(){
  const { playerItems, civItems, offered, wanted } = BARTER;
  if(!offered.size){ addLog('Select something to offer.','lw'); return; }
  if(!wanted.size){
    const dlg = G.dialogue;
    const ctxData = dlg?.context || {};
    const giftEntries = [...offered]
      .map(i => playerItems[i])
      .filter(entry => entry?.item);
    if(!giftEntries.length){ addLog('Select something to offer.','lw'); return; }
    giftEntries.forEach(entry => {
      if(dialogueCivilization()?.state?.hostile) return;
      offerCivilizationGift(ctxData, entry.idx, entry);
    });
    if(dlg){
      if(!dlg.visited) dlg.visited = {};
      if(!dlg.nodeText) dlg.nodeText = {};
      delete dlg.visited.gift_given;
      delete dlg.nodeText.gift_given;
      enterDialogueNode('gift_given');
    }
    trackEvent('barter_gift', { items: giftEntries.map(e => e.item?.name || 'item').join(', ') });
    closeBarterOverlay();
    return;
  }

  const offerVal = [...offered].reduce((s, i) => s + civOfferValueForBarter(BARTER.civ, playerItems[i]?.item), 0);
  const wantVal  = [...wanted].reduce((s, i)  => s + (civItems[i]?.value  || 0), 0);
  if(offerVal < wantVal){ addLog('The trade is not balanced — offer more.','lw'); return; }

  // Cargo space check — count net commodity slots needed after trade
  const incomingCargo = [...wanted].filter(i => civItems[i]?.isCommodity).length;
  const outgoingCargo = [...offered].filter(i => playerItems[i]?.source === 'cargo').length;
  const cap = G.shipStats?.cargoCapacity ?? 0;
  if((G.cargo?.length ?? 0) + incomingCargo - outgoingCargo > cap){
    addLog('Cargo hold full — cannot receive all goods. Free up hold space first.','lw'); return;
  }

  // Remove offered items — cargo items by reference, inventory items by index (high→low)
  const invIdxs   = [...offered]
    .filter(i => playerItems[i]?.source === 'inventory')
    .map(i => playerItems[i].idx).sort((a,b) => b - a);
  const cargoRefs = [...offered]
    .filter(i => playerItems[i]?.source === 'cargo')
    .map(i => playerItems[i].item);
  invIdxs.forEach(idx => G.inventory.splice(idx, 1));
  cargoRefs.forEach(ref => { const ci = G.cargo.indexOf(ref); if(ci !== -1) G.cargo.splice(ci,1); });

  // Receive wanted items — commodities go to cargo, usables go to inventory
  const received = [];
  [...wanted].forEach(i => {
    const stock = civItems[i];
    if(!stock) return;
    stock._remaining = Math.max(0, (stock._remaining ?? stock.qty ?? 1) - 1);
    if(stock.isCommodity && stock.commodityId){
      addCargo(makeCommodityItem(stock.commodityId, 'civ_barter', stock.value));
    } else {
      const item=inventoryItemFromStock(stock);
      G.inventory.push(item);
    }
    received.push(stock.name);
  });

  addLog('Trade complete: received ' + received.join(', ') + '.', 'lg');
  trackEvent('barter_trade', { items: received.join(', ') });
  closeBarterOverlay();
}

function toggleBarterSelection(){
  const player = BARTER.side==='player';
  const list = player ? BARTER.playerItems : BARTER.civItems;
  const selected = player ? BARTER.playerSel : BARTER.civSel;
  const marked = player ? BARTER.offered : BARTER.wanted;
  if(list[selected]){
    if(marked.has(selected)) marked.delete(selected);
    else marked.add(selected);
  }
  renderBarterOverlay();
}

document.getElementById('barter-panel').addEventListener('click',event=>{
  const row = event.target.closest('[data-barter-row]');
  if(!row || !BARTER.active || AUTOSAVE_STATE.transition) return;
  const player = row.parentElement.id==='barter-player-list';
  BARTER.side=player?'player':'civ';
  if(player) BARTER.playerSel=Number(row.dataset.barterRow);
  else BARTER.civSel=Number(row.dataset.barterRow);
  toggleBarterSelection();
});

function handleBarterKey(e){
  if(!BARTER.active) return;
  const { playerItems, civItems } = BARTER;
  const key = e.key;

  if(key === 'Escape'){ e.preventDefault(); closeBarterOverlay(); return; }
  if(key === 'Tab'){    e.preventDefault(); confirmBarterTrade(); return; }

  if(key === 'ArrowLeft'  || key === 'a' || key === 'A'){
    e.preventDefault(); BARTER.side = 'player'; renderBarterOverlay(); return;
  }
  if(key === 'ArrowRight' || key === 'd' || key === 'D'){
    e.preventDefault(); BARTER.side = 'civ';    renderBarterOverlay(); return;
  }
  if(key === 'ArrowUp' || key === 'w' || key === 'W'){
    e.preventDefault();
    if(BARTER.side === 'player' && playerItems.length)
      BARTER.playerSel = (BARTER.playerSel - 1 + playerItems.length) % playerItems.length;
    else if(BARTER.side === 'civ' && civItems.length)
      BARTER.civSel = (BARTER.civSel - 1 + civItems.length) % civItems.length;
    renderBarterOverlay(); return;
  }
  if(key === 'ArrowDown' || key === 's' || key === 'S'){
    e.preventDefault();
    if(BARTER.side === 'player' && playerItems.length)
      BARTER.playerSel = (BARTER.playerSel + 1) % playerItems.length;
    else if(BARTER.side === 'civ' && civItems.length)
      BARTER.civSel = (BARTER.civSel + 1) % civItems.length;
    renderBarterOverlay(); return;
  }
  if(key === 'Enter' || key === ' '){
    e.preventDefault();
    toggleBarterSelection(); return;
  }
}

