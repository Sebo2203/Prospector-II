const INVENTORY_TABS = ['inventory','crew','ship','log'];

function selectInventoryTab(tab){
  if(G._viewTab===tab) return;
  G._viewTab = tab;
  G._viewCrewSel = 0;
  G._inventoryExamine = false;
  G._cargoExamine = false;
  G._crewExamine = false;
  G._logScroll = Infinity;
  G._jettisonConfirm = false;
  renderAll();
}

function canToggleInventoryMenu(){
  return !!G && ['galaxy','planet','system','scanview','inventory'].includes(G.mode) &&
    !G.dead && !G.retired && !G.showOptions && !G.dialogue && !G.examine && !G.rangeTarget &&
    !G._itemAimMode && !DEBUG.on;
}

function toggleInventoryMenu(){
  if(!canToggleInventoryMenu() || canvasMenuBlocked()) return;
  if(G.mode==='inventory') G.mode=G._prevMode;
  else {
    if(G.mode!=='system') G._viewTab='inventory';
    G._prevMode=G.mode;
    G.mode='inventory';
  }
  G._inventoryExamine=false;
  G._crewExamine=false;
  renderAll();
}

function closeInventoryMenu(){
  if(G._cargoExamine) G._cargoExamine=false;
  else if(G._crewExamine) G._crewExamine=false;
  else if(G._inventoryExamine) G._inventoryExamine=false;
  else {
    G.mode=G._prevMode;
    G._equipGunIdx=G._equipArmorIdx=G._equipImplantIdx=G._equipStimIdx=undefined;
    G._jettisonConfirm=false;
  }
  renderAll();
}

function inventoryEquipType(item){
  const key=item?.usable;
  if(['gun','gun_sniper','knife','gun_shotgun','gun_burst','gun_plasma','stun_baton','vibroblade','tranq_darts'].includes(key)) return 'weapon';
  if(['armor_flight','armor_reinforced','armor_diving','armor_exosuit','armor_plate'].includes(key)) return 'armor';
  if(key?.startsWith('implant_')) return 'implant';
  if(key==='stim_pack') return 'stim';
}

function inventoryItemCanBeUsed(item){
  return ['medikit','trauma_kit','mild_antidepressants','iodine_pills','antibiotics','oxytank','morale_drug',
    'grapple','jetpack','capture_net','contain_crate','field_rations','rad_flush','sensor_drone','repair_kit'].includes(item?.usable);
}

function drawInventoryOverlay(){
  const cw = canvasWidth, ch = canvasHeight;
  ctx.fillStyle='rgba(0,0,0,0.88)'; ctx.fillRect(0,0,cw,ch);
  ensureCrewMoraleState();
  updateCrewLowMoraleFlags();

  const tab = G._viewTab || 'inventory';

  // Tab headers — 4 tabs, evenly spaced
  const tabs = INVENTORY_TABS;
  const tw=110, tgap=8, totalW=tabs.length*(tw+tgap)-tgap;
  const tabsStartX = Math.round((cw-totalW)/2);
  tabs.forEach((t,i)=>{
    const sel = tab===t;
    const tx = tabsStartX + i*(tw+tgap), ty = 10, th = 26;
    canvasMenuTarget(tx,ty,tw,th,()=>selectInventoryTab(t));
    ctx.fillStyle = sel ? '#0e1a2a' : '#06060e';
    ctx.fillRect(tx, ty, tw, th);
    ctx.strokeStyle = sel ? '#ffe066' : '#2a2a4a';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(tx, ty, tw, th);
    ctx.font = 'bold 12px Courier New';
    ctx.fillStyle = sel ? '#ffe066' : '#445566';
    ctx.textAlign = 'center';
    ctx.fillText(t.toUpperCase(), tx+tw/2, ty+17);
  });
  ctx.fillStyle='#1a1a2a'; ctx.fillRect(40,40,cw-80,1);
  canvasMenuScroll = step=>handleInventoryKey(step<0?'ArrowUp':'ArrowDown');
  canvasMenuButton('Close [Esc]',cw-125,12,closeInventoryMenu);

  if(tab==='inventory'){
    // ── INVENTORY tab — usable/personal items ────────────────────
    ctx.textAlign='left';
    if(!G.inventory.length){
      ctx.font='16px Courier New'; ctx.fillStyle='#555';
      ctx.fillText('(empty — find medkits, weapons and gear on planets)', 40, 80);
    } else {
      // ── Categorise items ────────────────────────────────────────
      const getCategory = (item) => {
        const u = item.usable || '';
        if(u.startsWith('gun') || u==='knife' || u==='stun_baton' || u==='vibroblade' || u==='tranq_darts') return 'Weapons';
        if(u.startsWith('armor_')) return 'Armour';
        if(u.startsWith('implant_')) return 'Implants';
        if(u==='medikit'||u==='trauma_kit'||u==='stim_pack'||u==='antibiotics'||u==='iodine_pills'||u==='rad_flush'||u==='mild_antidepressants'||u==='field_rations'||u==='morale_drug') return 'Medical';
        if(u==='oxytank'||u==='repair_kit') return 'Supplies';
        if(u==='mining_tool'||u==='ore_scanner'||u==='floodlight'||u==='jetpack'||u==='grapple'||u==='sensor_drone'||u==='capture_net'||u==='contain_crate') return 'Equipment';
        if(item.value > 0 && !u) return 'Valuables';
        return 'Misc';
      };
      // Build stacks
      const stacks = [];
      const seen = {};
      G.inventory.forEach((item, idx)=>{
        if(seen[item.name] !== undefined){ stacks[seen[item.name]].count++; }
        else { seen[item.name] = stacks.length; stacks.push({ item, firstIdx: idx, count: 1 }); }
      });
      // Determine categories present
      const catsPresent = new Set(stacks.map(s=>getCategory(s.item)));
      const catOrder = ['Weapons','Armour','Implants','Medical','Supplies','Equipment','Valuables','Misc'];
      const doSort = catsPresent.size >= 2;
      // Build display rows: either plain stacks or sorted+divided
      const rows = []; // { type:'item', stack } or { type:'header', label }
      if(doSort){
        stacks.sort((a,b)=>{
          const ca = catOrder.indexOf(getCategory(a.item));
          const cb = catOrder.indexOf(getCategory(b.item));
          return ca !== cb ? ca - cb : a.item.name.localeCompare(b.item.name);
        });
        let lastCat = null;
        for(const stack of stacks){
          const cat = getCategory(stack.item);
          if(cat !== lastCat){ rows.push({ type:'header', label: cat }); lastCat = cat; }
          rows.push({ type:'item', stack });
        }
      } else {
        stacks.forEach(stack => rows.push({ type:'item', stack }));
      }
      const rawSel = Math.min(G._viewInvSel||0, G.inventory.length-1);
      const selName = G.inventory[rawSel]?.name;
      const stackSel = rows.findIndex(r=>r.type==='item' && r.stack.item.name===selName);
      const rowH = 28;
      const headerH = 20;
      const maxVisible = Math.max(1, Math.floor((ch - 160) / rowH));
      const startIdx = Math.max(0, Math.min(stackSel - Math.floor(maxVisible/2), rows.length - maxVisible));
      const endIdx = Math.min(rows.length, startIdx + maxVisible);
      let yOffset = 52;
      for(let ri=startIdx;ri<endIdx;ri++){
        const row = rows[ri];
        if(row.type==='header'){
          ctx.font='bold 11px Courier New';
          ctx.fillStyle='#445566';
          ctx.fillText(row.label.toUpperCase(), 44, yOffset+13);
          ctx.fillStyle='#223344';
          ctx.fillRect(44+ctx.measureText(row.label.toUpperCase()).width+6, yOffset+7, cw-120, 1);
          yOffset += headerH;
        } else {
          const {item, count} = row.stack;
          const isSel = ri===stackSel;
          const ax=40, ay=yOffset, aw=cw-80, ah=26;
          canvasMenuTarget(ax,ay,aw,ah,()=>{
            G._viewInvSel=row.stack.firstIdx;
            renderAll();
          });
          ctx.fillStyle = isSel ? '#0e1a2a' : '#08080f';
          ctx.fillRect(ax, ay, aw, ah);
          ctx.strokeStyle = isSel ? (item.usable ? '#ff6688' : '#ffe066') : '#1a1a2a';
          ctx.lineWidth = isSel ? 2 : 1;
          ctx.strokeRect(ax, ay, aw, ah);
          if(isSel){ ctx.fillStyle=item.usable?'#ff6688':'#ffe066'; ctx.font='bold 15px Courier New'; ctx.fillText('▶', ax+6, ay+18); }
          ctx.font='15px Courier New';
          ctx.fillStyle=item.col;
          const label = count > 1 ? item.name+' ×'+count : item.name;
          ctx.fillText(label, ax+22, ay+18);
          yOffset += rowH;
        }
      }
      const tot=G.inventory.reduce((s,i)=>s+(i.value||0),0);
      const listBottom = yOffset + 8;
      ctx.fillStyle='#223344'; ctx.fillRect(40, listBottom, cw-80, 1);
      ctx.fillStyle='#aaaaaa'; ctx.font='15px Courier New';
      ctx.fillText('Total value: '+tot+' cr', 40, listBottom+18);
      canvasMenuButton(G._inventoryExamine?'Close details [X]':'Examine [X]',240,listBottom+4,()=>handleInventoryKey('x'));
      if(!G._inventoryExamine && inventoryEquipType(G.inventory[rawSel])){
        canvasMenuButton('Select crew [Enter]',400,listBottom+4,()=>handleInventoryKey('Enter'));
      }
      if(startIdx>0){ ctx.fillStyle='#667788'; ctx.fillText('^ more', cw-120, 44); }
      if(endIdx<rows.length){ ctx.fillStyle='#667788'; ctx.fillText('v more', cw-120, listBottom+18); }
    }

  } else if(tab==='crew'){
    // ── CREW tab ─────────────────────────────────────────────────
    const living = G.crew.filter(c=>c.hp>0);
    const sel = Math.max(0,Math.min(G._viewCrewSel||0, living.length-1));
    const equipMode = G._equipGunIdx !== undefined || G._equipArmorIdx !== undefined || G._equipImplantIdx !== undefined || G._equipStimIdx !== undefined;
    const equipGun = G._equipGunIdx !== undefined ? G.inventory[G._equipGunIdx] : null;
    const equipArmor = G._equipArmorIdx !== undefined ? G.inventory[G._equipArmorIdx] : null;
    const equipImplant = G._equipImplantIdx !== undefined ? G.inventory[G._equipImplantIdx] : null;
    const equipStim = G._equipStimIdx !== undefined ? G.inventory[G._equipStimIdx] : null;
    const equipItem = equipGun || equipArmor || equipImplant || equipStim;

    // Equip mode banner
    if(equipMode && equipItem){
      ctx.font='bold 14px Courier New'; ctx.textAlign='center'; ctx.fillStyle='#aaaaff';
      ctx.fillRect(40, 46, cw-80, 22);
      ctx.fillStyle='#aaaaff';
      ctx.fillText('EQUIPPING: '+equipItem.name+' — select crew member, press Enter  (ESC to cancel)', cw/2, 61);
    }

    if(!living.length){
      ctx.font='16px Courier New'; ctx.fillStyle='#f07070'; ctx.textAlign='left';
      ctx.fillText('All crew dead!', 40, 80);
    } else {
      const top = equipMode ? 74 : 54;
      const visibleCount = Math.max(1,Math.floor((ch-top-55)/58));
      const start = Math.max(0,Math.min(sel-Math.floor(visibleCount/2),living.length-visibleCount));
      living.slice(start,start+visibleCount).forEach((c,offset)=>{
        const i = start+offset;
        const isSel = i===sel;
        const roleData = CREW_ROLES[c.role];
        const roleCol = roleData ? roleData.col : '#aaaaaa';
        const by = top + offset*58;
        canvasMenuTarget(40,by,200,50,()=>{ G._viewCrewSel=i; renderAll(); });
        ctx.fillStyle = isSel ? '#0e1a2a' : '#08080f';
        ctx.fillRect(40, by, 200, 50);
        ctx.strokeStyle = isSel ? (equipMode ? '#aaaaff' : roleCol) : '#1a1a2a';
        ctx.lineWidth = isSel ? 2 : 1;
        ctx.strokeRect(40, by, 200, 50);
        if(isSel){ ctx.fillStyle=equipMode?'#aaaaff':roleCol; ctx.font='bold 15px Courier New'; ctx.textAlign='left'; ctx.fillText('▶', 46, by+18); }
        ctx.font='bold 15px Courier New'; ctx.fillStyle = isSel ? '#fff' : roleCol;
        ctx.textAlign='left';
        const roleLabel = roleData ? roleData.label : 'Crew';
        ctx.fillText(roleLabel, 60, by+18);
        const roleTextW = ctx.measureText(roleLabel).width;
        ctx.font='bold 12px Courier New';
        ctx.fillStyle = crewMoraleScore(c) >= 45 ? '#88dd88' : crewMoraleScore(c) >= 22 ? '#ffaa44' : '#ff7777';
        ctx.fillText(crewMoodFace(c), 202, by+18);
        const statusText = crewStatusSummary(c);
        if(statusText){
          ctx.font='bold 10px Courier New'; ctx.fillStyle='#d488ff';
          const statusX = Math.min(166, 60 + roleTextW + 16);
          ctx.fillText(statusText, statusX, by+18);
        }
        // Row 2 — HP
        const p=c.hp/c.maxHp;
        const hcol=p<0.3?'#ff3300':p<0.6?'#ffaa00':'#44ff88';
        ctx.font='12px Courier New'; ctx.fillStyle=hcol;
        ctx.fillText(c.hp+'/'+c.maxHp+' HP', 60, by+32);
        // Row 3 — weapon (left) | armor (right)
        if(c.weapon && c.weapon !== 'Bare hands'){
          ctx.fillStyle='#aaaaff'; ctx.font='10px Courier New';
          ctx.fillText(c.weapon, 60, by+46);
        }
        if(!c.armorUsable){
          ctx.fillStyle='#ff4444'; ctx.font='10px Courier New';
          ctx.fillText('NAKED', 150, by+46);
        } else {
          ctx.fillStyle = c.armorUsable === 'armor_reinforced' ? '#ffcc44' : '#88ddff';
          ctx.font='10px Courier New';
          ctx.fillText(c.armor, 150, by+46);
        }
      });
      if(start>0) canvasMenuButton('↑ More',40,ch-49,()=>handleInventoryKey('ArrowUp',true));
      if(start+visibleCount<living.length) canvasMenuButton('↓ More',132,ch-49,()=>handleInventoryKey('ArrowDown',true));
      if(equipMode) canvasMenuButton('Confirm [Enter]',270,ch-49,()=>handleInventoryKey('Enter'));
      else canvasMenuButton('Crew details [X]',270,ch-49,()=>handleInventoryKey('x'));

      // Right: detail panel for selected crew
      const c = living[sel];
      if(c){
        const roleData = CREW_ROLES[c.role];
        const roleCol = roleData ? roleData.col : '#aaaaaa';
        const px = 270, py = 54, pw = cw-310, ph = 230;
        ctx.fillStyle='#08080f'; ctx.fillRect(px, py, pw, ph);
        ctx.strokeStyle=roleCol; ctx.lineWidth=1; ctx.strokeRect(px, py, pw, ph);

        // ── Left half: identity + combat stats + equipment ──────────
        const leftW = 290;
        ctx.textAlign='left';
        // Role badge
        ctx.font='bold 18px Courier New'; ctx.fillStyle=roleCol;
        ctx.fillText((roleData ? roleData.label : 'Crew').toUpperCase(), px+16, py+24);
        ctx.font='16px Courier New'; ctx.fillStyle='#dddddd';
        ctx.fillText(crewDisplayName(c), px+16, py+42);
        ctx.font='13px Courier New'; ctx.fillStyle='#445566';
        ctx.fillText(c.name, px+16, py+56);
        ctx.font='bold 18px Courier New';
        ctx.fillStyle = crewMoraleScore(c) >= 45 ? '#88dd88' : crewMoraleScore(c) >= 22 ? '#ffaa44' : '#ff7777';
        ctx.fillText(crewMoodFace(c), px+leftW-34, py+24);
        // Divider
        ctx.fillStyle='#1a1a2a'; ctx.fillRect(px+16, py+64, leftW-20, 1);
        // Stats
        const stats = [
          ['HP',      c.hp+' / '+c.maxHp],
          ['Attack', (()=>{ const wBonus = c.weapon&&c.weapon!=='Bare hands' ? (c.weaponUsable==='gun_sniper'?5:c.weaponUsable==='gun_breacher'?4:c.weaponUsable==='vibroblade'?4:c.weaponUsable==='knife'?1:c.weaponUsable==='stun_baton'?2:c.weaponUsable==='tranq_darts'?0:3) : 0; const iBonus = crewImplantAtkBonus(c); const sBonus = (c._stimAtk||0)>0&&G.turn<=(c._stimUntil||0) ? c._stimAtk : 0; const total = c.atk + wBonus + iBonus + sBonus; const parts = [wBonus?'+'+wBonus+'w':'', iBonus?'+'+iBonus+'i':'', sBonus?'+'+sBonus+'s':''].filter(Boolean).join(' '); return total + (parts ? ' ('+parts+')' : ''); })()],
          ['Defence', (()=>{ const aBonus = armorDefBonus(c); const iBonus = crewImplantDefBonus(c); const total = c.def + aBonus + iBonus; const parts = [aBonus?'+'+aBonus+'a':'', iBonus?'+'+iBonus+'i':''].filter(Boolean).join(' '); return total > 0 ? total + (parts ? ' ('+parts+')' : '') : '0 — unprotected'; })()],
        ];
        stats.forEach((s,i)=>{
          ctx.fillStyle='#445566'; ctx.font='14px Courier New';
          ctx.fillText(s[0], px+16, py+80+i*20);
          ctx.fillStyle='#aaccee';
          ctx.fillText(s[1], px+100, py+80+i*20);
        });
        // Divider
        ctx.fillStyle='#1a1a2a'; ctx.fillRect(px+16, py+142, leftW-20, 1);
        // Equipment
        ctx.font='14px Courier New'; ctx.fillStyle='#445566';
        ctx.fillText('Weapon', px+16, py+158);
        ctx.fillStyle='#ffcc66'; ctx.fillText(c.weapon||'Bare hands', px+100, py+158);
        ctx.fillStyle='#445566';
        ctx.fillText('Armor', px+16, py+176);
        ctx.fillStyle = c.armorUsable ? '#66aaff' : '#ff4444';
        ctx.fillText(c.armor||'Naked', px+100, py+176);
        // Background details
        ctx.fillStyle='#1a1a2a'; ctx.fillRect(px+16, py+188, leftW-20, 1);
        ctx.fillStyle='#334455'; ctx.font='13px Courier New';
        ctx.fillText('Age '+(c.age||'?')+'  ·  Born: '+(c.birthplace||'Unknown'), px+16, py+202);
        ctx.fillStyle='#2d3d2d'; ctx.font='13px Courier New';
        ctx.fillText(c.trait||'', px+16, py+216);
        // ── Implants section (below detail box) ──
        const slots = c.implants || [];
        const MAX_IMPLANTS = 2;
        const implSlotH = 26;
        const implPadding = 4;
        const implBlockH = 14 + MAX_IMPLANTS * (implSlotH + implPadding) + 4;
        const implSlotY = py + ph + 6;
        const implW = pw;
        ctx.fillStyle='#060610'; ctx.fillRect(px, implSlotY, implW, implBlockH);
        ctx.strokeStyle='#1a1a3a'; ctx.lineWidth=1; ctx.strokeRect(px, implSlotY, implW, implBlockH);
        ctx.font='bold 10px Courier New'; ctx.fillStyle='#334466'; ctx.textAlign='left';
        ctx.fillText('IMPLANTS  ('+slots.length+'/'+MAX_IMPLANTS+')', px+10, implSlotY+11);
        for(let si=0; si<MAX_IMPLANTS; si++){
          const slotX = px + 10;
          const slotW = implW - 20;
          const slotH = implSlotH;
          const slotY = implSlotY + 14 + si * (slotH + implPadding);
          if(slots[si]){
            const imp = IMPLANT_CATALOG.find(i=>i.id===slots[si]);
            ctx.fillStyle='#0a0a1c'; ctx.fillRect(slotX, slotY, slotW, slotH);
            ctx.strokeStyle = imp ? imp.col : '#334455'; ctx.lineWidth=1;
            ctx.strokeRect(slotX, slotY, slotW, slotH);
            ctx.font='bold 11px Courier New'; ctx.fillStyle = imp ? imp.col : '#aaaacc';
            ctx.fillText(imp ? imp.name : slots[si], slotX+8, slotY+11);
            ctx.font='10px Courier New'; ctx.fillStyle='#445566';
            ctx.fillText(imp ? imp.detail : '', slotX+8, slotY+22);
          } else {
            ctx.fillStyle='#050510'; ctx.fillRect(slotX, slotY, slotW, slotH);
            ctx.strokeStyle='#1a1a2e'; ctx.lineWidth=1; ctx.strokeRect(slotX, slotY, slotW, slotH);
            ctx.font='11px Courier New'; ctx.fillStyle='#222233';
            ctx.fillText('[ empty implant slot ]', slotX+8, slotY+16);
          }
        }
        ctx.textAlign='left';
        // ── Vertical divider ────────────────────────────────────────
        const divX = px + leftW + 8;
        ctx.fillStyle='#1a1a2a'; ctx.fillRect(divX, py+10, 1, ph-20);

        // ── Right half: skill table ──────────────────────────────────
        const sx = divX + 16;
        const skills = c.skills || {};

        ctx.font='bold 12px Courier New'; ctx.fillStyle='#334455';
        ctx.textAlign='left';
        ctx.fillText('SKILLS', sx, py+22);

        const skillRowH = 32;
        const barW = 120;
        const MAX_SKILL = 10;

        CREW_SKILLS.forEach((sk, i)=>{
          const val = skills[sk.id] || 0;
          const ry = py + 34 + i * skillRowH;

          // Skill label
          ctx.font='bold 12px Courier New'; ctx.fillStyle=sk.col;
          ctx.fillText(sk.abbr, sx, ry + 13);

          // Numeric value
          ctx.font='bold 14px Courier New'; ctx.fillStyle= val===0 ? '#2a2a3a' : sk.col;
          ctx.textAlign='right';
          ctx.fillText(val, sx + 36, ry + 13);
          ctx.textAlign='left';

          // Bar background
          ctx.fillStyle='#0e0e1a'; ctx.fillRect(sx + 42, ry + 4, barW, 10);
          ctx.strokeStyle='#1e1e2e'; ctx.lineWidth=1; ctx.strokeRect(sx + 42, ry + 4, barW, 10);

          // Bar fill — segmented, one segment per point
          const segW = Math.floor(barW / MAX_SKILL);
          for(let seg=0; seg<MAX_SKILL; seg++){
            const filled = seg < val;
            const sx2 = sx + 42 + seg * segW + 1;
            ctx.fillStyle = filled
              ? `rgba(${parseInt(sk.col.slice(1,3),16)},${parseInt(sk.col.slice(3,5),16)},${parseInt(sk.col.slice(5,7),16)},${0.35+val/MAX_SKILL*0.55})`
              : '#111120';
            ctx.fillRect(sx2, ry + 5, segW - 2, 8);
          }
          // XP progress on next segment — faint partial fill
          if(val < MAX_SKILL){
            const xpCurrent = (c._skillXp?.[sk.id] || 0);
            const xpNeeded  = skillXpForLevel(val + 1);
            const xpFrac    = xpNeeded > 0 ? Math.min(1, xpCurrent / xpNeeded) : 0;
            if(xpFrac > 0){
              const nextSeg = sx + 42 + val * segW + 1;
              ctx.fillStyle = `rgba(${parseInt(sk.col.slice(1,3),16)},${parseInt(sk.col.slice(3,5),16)},${parseInt(sk.col.slice(5,7),16)},0.22)`;
              ctx.fillRect(nextSeg, ry + 5, Math.round((segW - 2) * xpFrac), 8);
            }
          }

          // Skill level label (0–10 text descriptions)
          const SKILL_LABELS = ['None','Novice','Basic','Trained','Skilled',
                                 'Proficient','Expert','Senior','Veteran','Elite','Master'];
          ctx.font='11px Courier New'; ctx.fillStyle = val===0 ? '#222233' : '#445566';
          ctx.fillText(SKILL_LABELS[Math.min(val, 10)], sx + 42 + barW + 6, ry + 13);
        });
      }
    }
  } else if(tab==='ship'){
    // ── SHIP tab ─────────────────────────────────────────────────
    const ss = G.shipStats || buildShipStats('LIGHT_SCOUT');
    const sh = G.ship;
    const atHangar = G.mode === 'base';
    ctx.textAlign='left';

    // Hull type header
    ctx.font='bold 20px Courier New'; ctx.fillStyle='#aaddff';
    const shipLabel = ss.hullType.toUpperCase() + (G.shipName ? '  "' + G.shipName + '"' : '');
    ctx.fillText(shipLabel, 40, 68, cw-280);
    ctx.font='13px Courier New'; ctx.fillStyle='#445566';
    ctx.fillText(ss.desc, 40, 86);
    ctx.fillStyle='#1a1a2a'; ctx.fillRect(40, 96, cw-80, 1);

    // Two-column stat layout — tighter rowH to leave more space for loadout tables
    const col1x=40, col2x=cw/2+20, rowH=20, startY=110;

    function statRow(label, val, maxVal, x, y, col){
      ctx.font='12px Courier New'; ctx.fillStyle='#445566';
      ctx.fillText(label, x, y);
      // Outside hangar: hide max, show only current value
      const vStr = (atHangar && maxVal !== undefined) ? val+' / '+maxVal : String(val);
      ctx.fillStyle = col||'#aaccee';
      ctx.font='bold 14px Courier New';
      ctx.fillText(vStr, x+172, y);
    }
    function upgradeBar(current, max, x, y, col){
      if(!max || !atHangar) return;
      const bw=70, bh=5;
      ctx.fillStyle='#111122'; ctx.fillRect(x, y+3, bw, bh);
      ctx.fillStyle=col||'#3366aa';
      ctx.fillRect(x, y+3, Math.round((current/max)*bw), bh);
      ctx.strokeStyle='#2a2a4a'; ctx.lineWidth=1;
      ctx.strokeRect(x, y+3, bw, bh);
    }

    // Left column
    statRow('Max HP',         sh.maxHp,       ss.maxUpgradeHp,    col1x, startY+rowH*0, '#aaccee');
    upgradeBar(sh.maxHp, ss.maxUpgradeHp,     col1x+172,          startY+rowH*0,        '#3388ff');
    statRow('Max Fuel',       G.maxFuel,      ss.maxUpgradeFuel,  col1x, startY+rowH*1, '#ddaa33');
    upgradeBar(G.maxFuel, ss.maxUpgradeFuel,  col1x+172,          startY+rowH*1,        '#aa7700');
    statRow('Shield capacity',shipShieldCapacity(), undefined,   col1x, startY+rowH*2, '#88ccff');
    statRow('Engine Rating',  effectiveEngineRating(), ss.maxUpgradeEngine,  col1x, startY+rowH*3, '#ffcc44');
    upgradeBar(ss.engineRating, ss.maxUpgradeEngine, col1x+172,        startY+rowH*3,        '#aa8800');
    statRow('Sensor Range',   effectiveSensorRange(), ss.maxUpgradeSensor,  col1x, startY+rowH*4, '#70d8ff');
    upgradeBar(ss.sensorRange, ss.maxUpgradeSensor, col1x+172,         startY+rowH*4,        '#2288aa');

    // Right column
    statRow('Weapon Mounts',  ss.weaponSlots, ss.maxWeaponSlots,  col2x, startY+rowH*0, '#ff8866');
    upgradeBar(ss.weaponSlots, ss.maxWeaponSlots, col2x+172,      startY+rowH*0,        '#aa4422');
    statRow('Module Slots',   ss.moduleSlots, ss.maxModuleSlots,  col2x, startY+rowH*1, '#cc88ff');
    upgradeBar(ss.moduleSlots, ss.maxModuleSlots, col2x+172,      startY+rowH*1,        '#664488');
    statRow('Cargo Capacity', ss.cargoCapacity, ss.maxUpgradeCargo??ss.cargoCapacity, col2x, startY+rowH*2, '#ffdd88');
    upgradeBar(ss.cargoCapacity, ss.maxUpgradeCargo??ss.cargoCapacity, col2x+172,      startY+rowH*2,       '#886600');
    statRow('Max Crew',       G.crew.filter(c=>c.hp>0).length, ss.maxUpgradeCrew??ss.maxCrew, col2x, startY+rowH*3, '#70f090');

    // Weapon loadout + Module loadout — side by side below the stat columns
    // Core readouts are passive. Only Inspect / repair opens the detailed board;
    // an unfitted shield generator leaves an empty slot.
    ctx.fillStyle='#708b9c';ctx.font='bold 12px Courier New';
    ctx.fillText('CORE SYSTEMS',40,217);
    canvasMenuButton('Inspect / repair [F3]',cw-210,202,openShipSystems);
    const coreNames={engine:'Engines',reactor:'Reactor',shields:'Shields',cooling:'Cooling',sensors:'Sensors',fuelTank:'Fuel tank'};
    const coreValues={
      engine:'Rating '+effectiveEngineRating()+'/'+ss.engineRating,
      reactor:shipReactorOutput()+' power',
      shields:Math.floor(sh.shieldCharge)+'/'+shipShieldCapacity()+' charge',
      cooling:shipCoolingRate()+'/turn',
      sensors:effectiveSensorRange()?'Range '+effectiveSensorRange():'OFFLINE',
      fuelTank:G.maxFuel+'/'+ss.maxFuel+' capacity',
    };
    const coreWidth=(cw-110)/6;
    Object.keys(SHIP_SYSTEMS).forEach((id,index)=>{
      const x=40+index*(coreWidth+6), y=230, component=sh.systems[id];
      const failed=(id==='engine' && effectiveEngineRating()===0) || (id==='sensors' && effectiveSensorRange()===0);
      ctx.fillStyle='#080b10';ctx.fillRect(x,y,coreWidth,35);
      const installed=id!=='shields' || ss.shields>0;
      ctx.strokeStyle=installed && component.condition<100?'#66513a':'#2a3541';ctx.lineWidth=1;ctx.strokeRect(x,y,coreWidth,35);
      if(!installed) return;
      ctx.font='bold 11px Courier New';ctx.fillStyle='#9eb5c5';
      ctx.fillText(coreNames[id]+' '+component.condition+'%',x+5,y+13,coreWidth-10);
      ctx.font='11px Courier New';ctx.fillStyle=failed || component.condition<=50?'#edaa77':'#8193a1';
      ctx.fillText(coreValues[id],x+5,y+28,coreWidth-10);
    });
    const loadoutY = 280;
    const midX = col1x + (col2x - col1x) / 2 + 20;
    const slotRowH = 26; // bigger row height for readability

    // ── Weapon loadout (left half) ────────────────────────────────
    ctx.fillStyle='#2a2a3a'; ctx.fillRect(col1x, loadoutY, midX-col1x-10, 1);
    ctx.font='bold 13px Courier New'; ctx.fillStyle='#554433';
    ctx.fillText('WEAPON MOUNTS', col1x, loadoutY+16);
    for(let slot=0; slot<ss.weaponSlots; slot++){
      const wy = loadoutY+34+slot*slotRowH;
      const wid = (G.installedWeapons||[])[slot];
      const wdef = wid ? SHIP_WEAPONS[wid] : null;
      ctx.font='13px Courier New'; ctx.fillStyle='#334455';
      ctx.fillText('['+(slot+1)+']', col1x, wy);
      if(wdef){
        ctx.fillStyle = wdef.placeholder ? '#886644' : '#ff9966';
        ctx.font='bold 13px Courier New';
        ctx.fillText(wdef.name, col1x+30, wy);
        if(!wdef.placeholder){
          ctx.font='12px Courier New'; ctx.fillStyle='#556644';
          ctx.fillText(wdef.minDmg+'–'+wdef.maxDmg+' dmg', col1x+30+ctx.measureText(wdef.name).width+8, wy);
        } else {
          ctx.font='12px Courier New'; ctx.fillStyle='#664422';
          ctx.fillText('(no ammo)', col1x+30+ctx.measureText(wdef.name).width+8, wy);
        }
      } else {
        ctx.fillStyle='#333344'; ctx.font='13px Courier New';
        ctx.fillText('— empty —', col1x+30, wy);
      }
    }
    // Locked slots: only show at hangar
    if(atHangar){
      for(let slot=ss.weaponSlots; slot<ss.maxWeaponSlots; slot++){
        const wy = loadoutY+34+slot*slotRowH;
        ctx.font='13px Courier New'; ctx.fillStyle='#252535';
        ctx.fillText('['+(slot+1)+'] locked', col1x, wy);
      }
    }

    // ── Module loadout (right half) ───────────────────────────────
    ctx.fillStyle='#2a2a3a'; ctx.fillRect(col2x, loadoutY, cw-col2x-40, 1);
    ctx.font='bold 13px Courier New'; ctx.fillStyle='#443355';
    ctx.fillText('MODULE LOADOUT', col2x, loadoutY+16);
    const MODULE_DEFS = [
      { id:'tractor_beam', name:'Tractor Beam' },
      { id:'fuel_scoop',   name:'Fuel Scoop'   },
      { id:'mining_drill', name:'Mining Drill'  },
    ];
    for(let slot=0; slot<ss.moduleSlots; slot++){
      const my = loadoutY+34+slot*slotRowH;
      const mid2 = (G.installedModules||[])[slot];
      const mdef = mid2 ? MODULE_DEFS.find(m=>m.id===mid2) : null;
      ctx.font='13px Courier New'; ctx.fillStyle='#334455';
      ctx.fillText('['+(slot+1)+']', col2x, my);
      if(mdef){
        ctx.fillStyle='#cc88ff'; ctx.font='bold 13px Courier New';
        ctx.fillText(mdef.name, col2x+30, my);
      } else {
        ctx.fillStyle='#333344'; ctx.font='13px Courier New';
        ctx.fillText('— empty —', col2x+30, my);
      }
    }
    // Locked slots: only show at hangar
    if(atHangar){
      for(let slot=ss.moduleSlots; slot<ss.maxModuleSlots; slot++){
        const my = loadoutY+34+slot*slotRowH;
        ctx.font='13px Courier New'; ctx.fillStyle='#252535';
        ctx.fillText('['+(slot+1)+'] locked', col2x, my);
      }
    }

    // Cargo hold — pinned to bottom, drawn as horizontal boxes
    const divY = ch - 76;
    ctx.fillStyle='#1a1a2a'; ctx.fillRect(40, divY, cw-80, 1);
    ctx.font='bold 12px Courier New'; ctx.fillStyle='#556677';
    ctx.fillText('CARGO HOLD  —  '+(G.cargo?.length||0)+' / '+ss.cargoCapacity+' units', 40, divY+14);

    const inSpace = G.mode !== 'base' && G.mode !== 'planet';
    const cargoSel = Math.max(0, Math.min(G._cargoSel||0, (G.cargo?.length||0) - 1));
    if((G.cargo?.length||0) > 0 && cargoSel !== G._cargoSel) G._cargoSel = cargoSel;

    const boxSize = 44, boxGap = 6, boxStartX = 40, boxY = divY + 22;
    for(let i = 0; i < ss.cargoCapacity; i++){
      const bx = boxStartX + i * (boxSize + boxGap);
      const item = G.cargo?.[i];
      const isSel = inSpace && item && i === cargoSel;
      ctx.fillStyle = item ? '#0e1a10' : '#080810';
      ctx.fillRect(bx, boxY, boxSize, boxSize);
      ctx.strokeStyle = isSel ? (G._jettisonConfirm ? '#ff4444' : '#ffe066') : (item ? '#336633' : '#1a1a2a');
      ctx.lineWidth = isSel ? 2.5 : (item ? 1.5 : 1);
      ctx.strokeRect(bx, boxY, boxSize, boxSize);
      if(item){
        canvasMenuTarget(bx,boxY,boxSize,boxSize,()=>{
          if(G._cargoSel!==i) G._jettisonConfirm=false;
          G._cargoSel=i;
          G._cargoExamine=true;
          renderAll();
        },{title:item.name+(item.desc?' — '+item.desc:'')});
        ctx.font = 'bold 20px Courier New';
        ctx.fillStyle = item.col || '#aaaaaa';
        ctx.textAlign = 'center';
        ctx.fillText(item.symbol || '?', bx + boxSize/2, boxY + boxSize/2 + 4);
        ctx.font = '9px Courier New';
        ctx.fillStyle = '#556677';
        const label = item.shortName || item.name;
        ctx.fillText(label.length > 7 ? label.slice(0,6)+'…' : label, bx + boxSize/2, boxY + boxSize - 5);
      } else {
        ctx.font = '11px Courier New';
        ctx.fillStyle = '#1a1a2a';
        ctx.textAlign = 'center';
        ctx.fillText('·', bx + boxSize/2, boxY + boxSize/2 + 4);
      }
      ctx.textAlign = 'left';
    }

    // Jettison hint / confirmation line below cargo boxes
    if(inSpace && (G.cargo?.length||0) > 0){
      const selItem = G.cargo[cargoSel];
      const hintY = boxY + boxSize + 16;
      canvasMenuButton(G._cargoExamine?'Close details [X]':'Examine cargo [X]',cw-365,46,()=>handleInventoryKey('x'));
      canvasMenuButton(G._jettisonConfirm?'Confirm jettison [J]':'Jettison [J]',cw-190,46,()=>handleInventoryKey('j'));
      if(G._jettisonConfirm && selItem){
        ctx.font = 'bold 13px Courier New';
        ctx.fillStyle = '#ff4444';
        ctx.textAlign = 'center';
        ctx.fillText('Jettison '+selItem.name+'? Press J again to confirm, ESC to cancel.', cw/2, hintY);
        ctx.textAlign = 'left';
      } else if(selItem){
        ctx.font = '12px Courier New';
        ctx.fillStyle = '#445566';
        ctx.textAlign = 'center';
        ctx.fillText('↑/↓ select cargo', cw/2, hintY);
        ctx.textAlign = 'left';
      }
    }
  } else if(tab==='log'){
    // ── LOG tab ──────────────────────────────────────────────────────
    // Filter buttons
    const FILTERS = LOG_FILTERS;
    if(!FILTERS.some(filter=>filter.id===G._logFilter)) G._logFilter = 'records';

    // Draw filter buttons
    const fBtnW = 90, fBtnH = 22, fBtnGap = 6;
    const fTotalW = FILTERS.length*(fBtnW+fBtnGap)-fBtnGap;
    const fStartX = Math.round((cw-fTotalW)/2);
    const fY = 52;
    FILTERS.forEach((f,i)=>{
      const fx = fStartX + i*(fBtnW+fBtnGap);
      canvasMenuTarget(fx,fY,fBtnW,fBtnH,()=>handleInventoryKey(String(i+1)));
      const sel = G._logFilter === f.id;
      ctx.fillStyle = sel ? '#1a2a1a' : '#0a0a12';
      ctx.fillRect(fx, fY, fBtnW, fBtnH);
      ctx.strokeStyle = sel ? '#88ff88' : '#2a3a2a';
      ctx.lineWidth = sel ? 2 : 1;
      ctx.strokeRect(fx, fY, fBtnW, fBtnH);
      ctx.font = 'bold 11px Courier New';
      ctx.fillStyle = sel ? '#88ff88' : '#445544';
      ctx.textAlign = 'center';
      ctx.fillText(f.label, fx+fBtnW/2, fY+15);
    });
    ctx.textAlign = 'left';

    // Filter the log entries
    function logMatchesFilter(entry, fid){
      if(fid==='all') return true;
      const m = entry.msg.toLowerCase();
      const c = entry.cls || '';
      if(fid==='critical') return c==='lc';
      if(fid==='crew'){
        // Build a set of known crew identifiers from G.crew at filter time
        const crewTokens = new Set();
        (G.crew||[]).forEach(c=>{
          if(!c||!c.name) return;
          // Last name (always shown)
          const lastName = c.name.split(' ').slice(-1)[0].toLowerCase();
          if(lastName) crewTokens.add(lastName);
          // Full name parts
          c.name.split(' ').forEach(p=>{ if(p.length>1) crewTokens.add(p.toLowerCase()); });
          // Role label e.g. "engineer", "navigator"
          const role = (window.CREW_ROLES||{})[c.role];
          if(role) crewTokens.add(role.label.toLowerCase());
        });
        // Also allow general crew-state messages that don't name a person
        const generalCrew = m.includes('the crew') || m.includes('all crew') || m.includes('crew member') || m.includes('terminates their contract') || m.includes('recruit');
        if(generalCrew) return true;
        // Match if any crew token appears at word boundary in message
        for(const tok of crewTokens){
          if(m.includes(tok)) return true;
        }
        return false;
      }
      if(fid==='combat'){
        // Explicit combat-tagged messages we now pipe from doShipFire use pirate name in brackets
        if(/^\[.+\] (You fire|They fire|They reject)/.test(entry.msg)) return true;
        // Keyword sweep for everything else combat-related
        return m.includes('intercepted') || m.includes('prepare for combat') ||
               m.includes('hull dmg') || m.includes('hull damage') || m.includes('hull takes') ||
               m.includes('ship destroyed') || m.includes('destroyed!') || m.includes('destroyed.') ||
               m.includes('pirate') || m.includes('corsair') || m.includes('destroyer') || m.includes('battleship') ||
               m.includes('surrend') || m.includes('took ') && m.includes('damage') ||
               m.includes('retreat') || m.includes('escaped from') ||
               m.includes('volley hits') || m.includes('defense turret') ||
               m.includes('homing in') || m.includes('closes in') ||
               m.includes('you fire') || m.includes('they fire') ||
               m.includes('combat') || m.includes('patrol') && (m.includes('fire') || m.includes('stand down') || m.includes('arrest')) ||
               m.includes('nebula gas damages') || m.includes('meteor impact') ||
               m.includes('weapons fire detected') || m.includes('hostile transponder');
      }
      if(fid==='mission'){
        return entry.category==='mission' || m.includes('contract') || m.includes('science office') ||
               m.includes('survey bonus') || m.includes('survey data') ||
               m.includes('mission') || m.includes('debrief') ||
               m.includes('retired') || m.includes('10,000 cr') ||
               m.includes('artifact') || m.includes('data box') ||
               m.includes('research ship') || m.includes('alien corpse') || m.includes('biodata') ||
               m.includes('civilization') && (m.includes('contact') || m.includes('survey') || m.includes('locate')) ||
               m.includes('sector cleared') || m.includes('+3000 cr') ||
               m.includes('intel is vague') || m.includes('lies ') && m.includes('sector') ||
               m.includes('last fix:') || m.includes('signal cut out') ||
               m.includes('job complete') || m.includes('jobs exhausted') ||
               m.includes('salvaged') && m.includes('fuel') ||
               m.includes('secured data box delivered') ||
               // credit rewards: "+NNN cr" pattern (job payouts, bounties, bonuses)
               /\+\d+ cr\.?$/.test(m) || /\+\d+ cr\b/.test(m);
      }
      return true;
    }

    const records = G._logFilter==='records';
    const allEntries = gameLogEntries(G._logFilter);
    const entries = records ? allEntries : allEntries.filter(e=>logMatchesFilter(e,G._logFilter)).reverse();
    ctx.font='12px Courier New';
    const filtered = wrapGameLog(entries,
      cw-48-62-16,text=>ctx.measureText(text).width);

    // Scrollable list
    const listTop = fY + fBtnH + 12;
    const listBottom = ch - 30;
    const rowH = 20;
    const visRows = Math.floor((listBottom - listTop) / rowH);
    const maxScroll = Math.max(0, filtered.length - visRows);
    // Records starts at its active work. History opens on the latest entries.
    if(G._logScroll === undefined || G._logScroll === Infinity) G._logScroll = records ? 0 : maxScroll;
    G._logScroll = Math.max(0, Math.min(G._logScroll, maxScroll));

    if(!filtered.length){
      ctx.font='15px Courier New'; ctx.fillStyle='#445544'; ctx.textAlign='center';
      ctx.fillText('No log entries match this filter.', cw/2, listTop+40);
      ctx.textAlign='left';
    } else {
      // Colour map matching sidebar log colours
      const logColors = { lc:'#ff4444', ll:'#ffcc44', lw:'#ff9955', lg:'#44ff88', li:'#7788aa', '':'#99aaaa' };
      // Entries were ordered chronologically before wrapping so continuation
      // lines stay below the first line of their message.
      const slice = filtered.slice(G._logScroll, G._logScroll+visRows);
      slice.forEach((entry, i)=>{
        const ey = listTop + i*rowH;
        const col = logColors[entry.cls||''] || '#99aaaa';
        // Turn stamp
        const turnStr = '[T'+String(entry.turn||1).padStart(4,' ')+']';
        ctx.font = '11px Courier New';
        ctx.fillStyle = '#334455';
        if(!entry.continuation && !entry.heading) ctx.fillText(turnStr, 48, ey+14);
        // Message
        ctx.font = (entry.heading?'bold ':'')+'12px Courier New';
        ctx.fillStyle = col;
        ctx.fillText(entry.msg, 48+62, ey+14);
      });
      // Scroll indicator — thumb at bottom when showing newest
      if(filtered.length > visRows){
        const pct = G._logScroll / maxScroll;
        const trackH = listBottom - listTop;
        const thumbH = Math.max(20, trackH * visRows/filtered.length);
        const thumbY = listTop + pct*(trackH-thumbH);
        ctx.fillStyle='#1a2a1a'; ctx.fillRect(cw-20, listTop, 10, trackH);
        ctx.fillStyle='#44aa44'; ctx.fillRect(cw-20, thumbY, 10, thumbH);
      }
    }
  }

  // Footer hint
  if(tab==='log'){
    ctx.font='14px Courier New'; ctx.fillStyle='#334455'; ctx.textAlign='center';
    ctx.fillText('↑/↓ scroll   Shift+↑/↓ fast   [1-6] filter', cw/2, ch-14);
    ctx.textAlign='left';
  }
}


function handleInventoryKey(key,shiftKey=false){
  if((key==='x'||key==='X') && G._viewTab==='inventory'){
    if(G.inventory.length){
      G._inventoryExamine = !G._inventoryExamine;
      renderAll(); return;
    }
    addLog('Inventory is empty.','li');
    renderAll(); return;
  }
  // ── D — drop item on planet floor ──────────────────────────
  if((key==='d'||key==='D') && G._viewTab==='inventory' && G._prevMode==='planet'){
    if(!G.inventory.length){ addLog('Inventory is empty.','li'); renderAll(); return; }
    const idx = Math.max(0, Math.min(G._viewInvSel||0, G.inventory.length-1));
    const item = G.inventory[idx];
    if(!item){ renderAll(); return; }
    G.inventory.splice(idx, 1);
    G._viewInvSel = Math.max(0, Math.min(idx, G.inventory.length-1));
    dropPlanetLoot(G.player.x, G.player.y, [item]);
    renderAll(); return;
  }
  if((key==='x'||key==='X') && G._viewTab==='ship'){
    if((G.cargo?.length||0) > 0){
      G._cargoExamine = !G._cargoExamine;
      renderAll(); return;
    }
    addLog('Cargo hold is empty.','li');
    renderAll(); return;
  }
  if((key==='x'||key==='X') && G._viewTab==='crew' && G._equipGunIdx===undefined && G._equipArmorIdx===undefined){
    if(selectedCrewMember()){
      startCrewDialogue('root');
      return;
    }
    addLog('No living crew selected.','li');
    renderAll(); return;
  }
  if(key==='ArrowLeft'||key==='ArrowRight'){
    const cur = INVENTORY_TABS.indexOf(G._viewTab||'inventory');
    const dir = key==='ArrowRight' ? 1 : -1;
    selectInventoryTab(INVENTORY_TABS[(cur+dir+INVENTORY_TABS.length)%INVENTORY_TABS.length]); return;
  }
  // ── Ship tab — cargo navigation (Up/Down) and jettison ─────────
  if(G._viewTab==='ship' && G.mode !== 'base' && G.mode !== 'planet'){
    if((key==='ArrowUp'||key==='ArrowDown') && (G.cargo?.length||0) > 0){
      const dir = key==='ArrowDown' ? 1 : -1;
      G._cargoSel = ((G._cargoSel||0) + dir + G.cargo.length) % G.cargo.length;
      G._jettisonConfirm = false;
      // Leave _cargoExamine open so details update live
      renderAll(); return;
    }
    if(key==='j'||key==='J'){
      const cargo = G.cargo||[];
      if(!cargo.length){ addLog('Cargo hold is empty.','li'); renderAll(); return; }
      const sel = Math.max(0, Math.min(G._cargoSel||0, cargo.length-1));
      const item = cargo[sel];
      if(!item){ renderAll(); return; }
      if(!G._jettisonConfirm){
        G._jettisonConfirm = true;
        addLog('Jettison '+item.name+'? Press J again to confirm, ESC to cancel.','lw');
        renderAll(); return;
      }
      G.cargo.splice(sel, 1);
      noteQuarantinePodLoss(item);
      G._cargoSel = Math.max(0, Math.min(G._cargoSel||0, G.cargo.length-1));
      G._jettisonConfirm = false;
      addLog(item.name+' jettisoned into space.','lw');
      renderAll(); return;
    }
    if(G._jettisonConfirm && key==='Escape'){
      G._jettisonConfirm = false;
      addLog('Jettison cancelled.','li');
      renderAll(); return;
    }
  }
  if(G._viewTab==='log'){
    if(key==='ArrowUp')  { G._logScroll = Math.max(0,(G._logScroll||0)-(shiftKey?10:1)); renderAll(); return; }
    if(key==='ArrowDown'){ G._logScroll = (G._logScroll||0)+(shiftKey?10:1); renderAll(); return; }
    if(key>='1'&&Number(key)<=LOG_FILTERS.length){ G._logFilter=LOG_FILTERS[Number(key)-1].id; G._logScroll=Infinity; renderAll(); return; }
    renderAll(); return;
  }
  if(G._viewTab==='crew'){
    const living = G.crew.filter(c=>c.hp>0);
    if(key==='ArrowUp'||key==='ArrowDown'){
      const step = (key==='ArrowUp'?-1:1)*(shiftKey?5:1);
      G._viewCrewSel=Math.max(0,Math.min(living.length-1,(G._viewCrewSel||0)+step));
      renderAll(); return;
    }
    if(key==='Enter' && G._equipGunIdx !== undefined){
      const target = living[G._viewCrewSel||0];
      const gun = G.inventory[G._equipGunIdx];
      if(target && gun){
        // Unequip any existing gun from this crew member first
        const oldGun = target.weapon;
        if(oldGun && oldGun !== 'Bare hands'){
          const oldIsSniper = target.weaponUsable === 'gun_sniper';
          const oldIsKnife  = target.weaponUsable === 'knife';
          const oldUsable   = target.weaponUsable || 'gun';
          const oldDesc     = oldIsSniper ? '+5 ATK when equipped.' : oldIsKnife ? '+1 ATK when equipped.' : '+2 ATK when equipped.';
          const oldCol      = oldIsSniper ? '#ffaa44' : oldIsKnife ? '#ccccaa' : '#aaaaff';
          G.inventory.push({name:oldGun, col:oldCol, desc:oldDesc, value:0, usable:oldUsable});
          addLog(crewDisplayName(target)+' unequips '+oldGun+'.','li');
        }
        const atkBonus = gun.usable === 'gun_sniper' ? 5 : gun.usable === 'gun_breacher' ? 4 : gun.usable === 'vibroblade' ? 4 : gun.usable === 'knife' ? 1 : gun.usable === 'stun_baton' ? 2 : gun.usable === 'tranq_darts' ? 0 : (gun.usable === 'gun_shotgun' || gun.usable === 'gun_burst' || gun.usable === 'gun_plasma') ? 3 : 2;
        target.weapon = gun.name;
        target.weaponUsable = gun.usable;
        G.inventory.splice(G._equipGunIdx, 1);
        G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
        G._equipGunIdx = undefined;
        addLog(crewDisplayName(target)+' equipped '+gun.name+'. ATK +'+atkBonus+'.','lg');
      }
      renderAll(); return;
    }
    if(key==='Enter' && G._equipArmorIdx !== undefined){
      const target = living[G._viewCrewSel||0];
      const armor = G.inventory[G._equipArmorIdx];
      if(target && armor){
        // Return old armor to inventory if not naked
        if(target.armorUsable){
          const oldDef = armorDefBonus(target);
          const oldCol = target.armorUsable === 'armor_exosuit' ? '#ff8833' : target.armorUsable === 'armor_reinforced' ? '#ffcc44' : target.armorUsable === 'armor_plate' ? '#aaaacc' : '#88ddff';
          G.inventory.push({name:target.armor, col:oldCol, desc:'+'+oldDef+' DEF when equipped.', value:0, usable:target.armorUsable});
          addLog(crewDisplayName(target)+' removes '+target.armor+'.','li');
        }
        const defBonus = armor.usable === 'armor_exosuit' ? 3 : armor.usable === 'armor_reinforced' ? 2 : 1;
        target.armor = armor.name;
        target.armorUsable = armor.usable;
        G.inventory.splice(G._equipArmorIdx, 1);
        G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
        G._equipArmorIdx = undefined;
        addLog(crewDisplayName(target)+' equipped '+armor.name+'. DEF +'+defBonus+'.','lg');
      }
      renderAll(); return;
    }
    if(key==='Escape' && G._equipGunIdx !== undefined){
      G._equipGunIdx = undefined;
      G._viewTab = 'inventory';
      addLog('Equip cancelled.','li');
      renderAll(); return;
    }
    if(key==='Escape' && G._equipArmorIdx !== undefined){
      G._equipArmorIdx = undefined;
      G._viewTab = 'inventory';
      addLog('Equip cancelled.','li');
      renderAll(); return;
    }
    // Implant install — Enter confirms on selected crew member
    if(key==='Enter' && G._equipImplantIdx !== undefined){
      const target = living[G._viewCrewSel||0];
      const implantItem = G.inventory[G._equipImplantIdx];
      if(target && implantItem){
        if(!target.implants) target.implants = [];
        const MAX_IMPLANTS = 2;
        if(target.implants.length >= MAX_IMPLANTS){
          addLog(crewDisplayName(target)+' already has '+MAX_IMPLANTS+' implants (maximum). Remove one first.','lw');
        } else {
          const impId = implantItem.implantId || implantItem.usable.slice('implant_'.length);
          if(target.implants.includes(impId)){
            addLog(crewDisplayName(target)+' already has this implant installed.','lw');
          } else {
            const imp = IMPLANT_CATALOG.find(i=>i.id===impId);
            target.implants.push(impId);
            // Apply permanent stat effects
            if(imp?.effect?.maxHp) target.maxHp = (target.maxHp||10) + imp.effect.maxHp;
            G.inventory.splice(G._equipImplantIdx, 1);
            G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0, G.inventory.length-1));
            G._equipImplantIdx = undefined;
            addLog(crewDisplayName(target)+': '+imp.name+' installed. ['+(target.implants.length)+'/'+MAX_IMPLANTS+']','lg');
          }
        }
      }
      renderAll(); return;
    }
    if(key==='Escape' && G._equipImplantIdx !== undefined){
      G._equipImplantIdx = undefined;
      G._viewTab = 'inventory';
      addLog('Implant install cancelled.','li');
      renderAll(); return;
    }
    // ── Combat Stim — apply to selected crew member ────────
    if(key==='Enter' && G._equipStimIdx !== undefined){
      const target = living[G._viewCrewSel||0];
      const stimItem = G.inventory[G._equipStimIdx];
      if(target && stimItem){
        if((target._stimAtk||0) > 0 && G.turn <= (target._stimUntil||0)){
          addLog(crewDisplayName(target)+' is already stimmed — wait for it to wear off.','lw');
        } else {
          target._stimUntil = G.turn + 8;
          target._stimAtk = 3;
          G.inventory.splice(G._equipStimIdx, 1);
          G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0, G.inventory.length-1));
          G._equipStimIdx = undefined;
          addLog('Combat Stim administered to '+crewDisplayName(target)+'. +3 ATK for 8 turns.','lg');
        }
      }
      renderAll(); return;
    }
    if(key==='Escape' && G._equipStimIdx !== undefined){
      G._equipStimIdx = undefined;
      G._viewTab = 'inventory';
      addLog('Stim administration cancelled.','li');
      renderAll(); return;
    }
    // W — unequip weapon (changed from U to avoid conflict with fuel scoop), S — strip armor
    if((key==='w'||key==='W') && G._equipGunIdx===undefined && G._equipArmorIdx===undefined && G._equipStimIdx===undefined){
      const sc = living[G._viewCrewSel||0];
      if(sc && sc.weapon && sc.weapon !== 'Bare hands'){
        const oldIsSniper = sc.weaponUsable === 'gun_sniper';
        const oldIsKnife  = sc.weaponUsable === 'knife';
        const oldUsable   = sc.weaponUsable || 'gun';
        const oldDesc     = oldIsSniper ? '+5 ATK when equipped.' : oldIsKnife ? '+1 ATK when equipped.' : '+2 ATK when equipped.';
        const oldCol      = oldIsSniper ? '#ffaa44' : oldIsKnife ? '#ccccaa' : '#aaaaff';
        G.inventory.push({name:sc.weapon, col:oldCol, desc:oldDesc, value:0, usable:oldUsable});
        addLog(crewDisplayName(sc)+' unequips '+sc.weapon+'.','li');
        sc.weapon = 'Bare hands';
        sc.weaponUsable = null;
      } else addLog('No weapon to unequip.','li');
      renderAll(); return;
    }
    if((key==='s'||key==='S') && G._equipGunIdx===undefined && G._equipArmorIdx===undefined && G._equipStimIdx===undefined){
      const sc = living[G._viewCrewSel||0];
      if(sc && sc.armorUsable){
        const oldDef = armorDefBonus(sc);
        const oldCol = sc.armorUsable === 'armor_exosuit' ? '#ff8833' : sc.armorUsable === 'armor_reinforced' ? '#ffcc44' : sc.armorUsable === 'armor_plate' ? '#aaaacc' : '#88ddff';
        G.inventory.push({name:sc.armor, col:oldCol, desc:'+'+oldDef+' DEF when equipped.', value:0, usable:sc.armorUsable});
        addLog(crewDisplayName(sc)+' strips off '+sc.armor+'.','lw');
        sc.armor = 'Naked';
        sc.armorUsable = null;
      } else addLog('Already unarmored.','li');
      renderAll(); return;
    }
  }
  if(G._viewTab==='inventory'){
    if(key==='ArrowUp'||key==='ArrowDown'){
      // Navigate by the sorted display order, not raw G.inventory order
      // Re-derive the same category sort used in rendering
      const getCategory2 = (item) => {
        const u = item.usable || '';
        if(u.startsWith('gun')||u==='knife'||u==='stun_baton'||u==='vibroblade'||u==='tranq_darts') return 'Weapons';
        if(u.startsWith('armor_')) return 'Armour';
        if(u.startsWith('implant_')) return 'Implants';
        if(u==='medikit'||u==='trauma_kit'||u==='stim_pack'||u==='antibiotics'||u==='iodine_pills'||u==='rad_flush'||u==='mild_antidepressants'||u==='field_rations'||u==='morale_drug') return 'Medical';
        if(u==='oxytank'||u==='repair_kit') return 'Supplies';
        if(u==='mining_tool'||u==='ore_scanner'||u==='floodlight'||u==='jetpack'||u==='grapple'||u==='sensor_drone'||u==='capture_net'||u==='contain_crate') return 'Equipment';
        if(item.value > 0 && !u) return 'Valuables';
        return 'Misc';
      };
      const catOrder2 = ['Weapons','Armour','Implants','Medical','Supplies','Equipment','Valuables','Misc'];
      const stacks2 = [];
      const seen2 = {};
      G.inventory.forEach((item,idx)=>{ if(!seen2[item.name]){ seen2[item.name]=true; stacks2.push({name:item.name,idx}); } });
      const catsPresent2 = new Set(G.inventory.map(getCategory2));
      if(catsPresent2.size >= 2){
        stacks2.sort((a,b)=>{
          const ca = catOrder2.indexOf(getCategory2(G.inventory[a.idx]));
          const cb = catOrder2.indexOf(getCategory2(G.inventory[b.idx]));
          return ca !== cb ? ca - cb : a.name.localeCompare(b.name);
        });
      }
      const curName = G.inventory[G._viewInvSel||0]?.name;
      const stackPos = stacks2.findIndex(s=>s.name===curName);
      if(key==='ArrowUp'){
        G._viewInvSel = stacks2[Math.max(0, stackPos-1)]?.idx ?? 0;
      } else {
        G._viewInvSel = stacks2[Math.min(stacks2.length-1, stackPos+1)]?.idx ?? 0;
      }
      renderAll(); return;
    }
    if(G._inventoryExamine){
      renderAll(); return;
    }
    if(key==='Enter'){
      const item = G.inventory[G._viewInvSel||0];
      const equipType = inventoryEquipType(item);
      if(item?.usable==='c4'){
        if(item._armed){
          addLog('C4 is already armed — '+item._c4Timer+' turns remaining. Drop it!','lw');
        } else if(G.mode !== 'planet' && G._prevMode !== 'planet'){
          addLog('C4 can only be armed on a planet surface.','lw');
        } else {
          item._armed = true;
          item._c4Timer = 5;
          addLog('C4 armed. 5 turns until detonation — DROP IT before it blows!','lc');
        }
        renderAll(); return;
      }
      if(item?.usable==='medikit'){
        const injured = G.crew.filter(c=>c.hp>0&&c.hp<c.maxHp).sort((a,b)=>a.hp-b.hp);
        if(!injured.length){ addLog('All crew are at full health.','li'); }
        else {
          const target = injured[0];
          target.hp = Math.min(target.maxHp, target.hp+10);
          G.inventory.splice(G._viewInvSel||0, 1);
          G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
          addLog('Medikit used on '+target.name+'. +10 HP.','lg');
          // Best medic gains XP from the treatment
          const _medUser = G.crew.filter(c=>c.hp>0).sort((a,b)=>(b.skills?.med||0)-(a.skills?.med||0))[0];
          if(_medUser) giveSkillXP(_medUser, 'med', 2);
        }
        renderAll(); return;
      }
      if(item?.usable==='trauma_kit'){
        const candidates = G.crew.filter(c=>c.hp>0 && (c.hp<c.maxHp || hasCrewInjury(c)))
          .sort((a,b)=>{
            const bi = hasCrewInjury(b) ? 1 : 0;
            const ai = hasCrewInjury(a) ? 1 : 0;
            if(bi !== ai) return bi - ai;
            return a.hp - b.hp;
          });
        if(!candidates.length){ addLog('No crew member needs trauma care.','li'); renderAll(); return; }
        const target = candidates[0];
        const hadInjury = removeCrewInjuries(target, true) > 0;
        target.hp = Math.min(target.maxHp, target.hp + 20);
        G.inventory.splice(G._viewInvSel||0, 1);
        G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
        addLog('Advanced Trauma Kit used on '+target.name+'. '+(hadInjury ? 'Injury treated. ' : '')+'+20 HP.','lg');
        const _medUser = G.crew.filter(c=>c.hp>0).sort((a,b)=>(b.skills?.med||0)-(a.skills?.med||0))[0];
        if(_medUser) giveSkillXP(_medUser, 'med', 4);
        renderAll(); return;
      }
      if(item?.usable==='mild_antidepressants'){
        const livingCrew = G.crew.filter(c=>c.hp>0);
        if(!livingCrew.length){ addLog('No living crew can use that.','lw'); renderAll(); return; }
        boostCrewFromMildAntidepressants();
        G.inventory.splice(G._viewInvSel||0, 1);
        G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
        addLog('Mild Anti-depressants used. Crew morale steadies.','lg');
        renderAll(); return;
      }
      if(item?.usable==='iodine_pills'){
        const treated = reduceCrewRadiation(2);
        if(!treated){ addLog('No crew member has radiation sickness.','li'); renderAll(); return; }
        G.inventory.splice(G._viewInvSel||0, 1);
        G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
        addLog('Iodine Pills used. Radiation sickness reduced for '+treated+' crew.','lg');
        renderAll(); return;
      }
      if(item?.usable==='antibiotics'){
        let treated = 0;
        G.crew.forEach(c=>{
          if(c.hp>0 && removeCrewDiseases(c, true)>0) treated++;
        });
        if(!treated){ addLog('No crew member needs antibiotics.','li'); renderAll(); return; }
        G.inventory.splice(G._viewInvSel||0, 1);
        G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
        addLog('Antibiotics used. Disease treated for '+treated+' crew.','lg');
        const _medUser = G.crew.filter(c=>c.hp>0).sort((a,b)=>(b.skills?.med||0)-(a.skills?.med||0))[0];
        if(_medUser) giveSkillXP(_medUser, 'med', 4);
        renderAll(); return;
      }
      if(item?.usable==='oxytank'){
        const onPlanet = G.mode==='planet' || G._prevMode==='planet';
        if(!onPlanet){ addLog('Oxygen Tank can only be used on a planet surface.','lw'); renderAll(); return; }
        if(G.oxygen>=100){ addLog('Oxygen already full.','li'); renderAll(); return; }
        G.oxygen = 100;
        G.inventory.splice(G._viewInvSel||0, 1);
        G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
        addLog('Oxygen Tank used. O₂ refilled to 100%.','lg');
        renderAll(); return;
      }
      if(item?.usable==='morale_drug'){
        const livingCrew = G.crew.filter(c=>c.hp>0);
        if(!livingCrew.length){ addLog('No living crew can use that.','lw'); renderAll(); return; }
        boostCrewFromDrugs();
        G.inventory.splice(G._viewInvSel||0, 1);
        G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0,G.inventory.length-1));
        addLog(item.name+' used. Crew morale surges into dangerous good humor.','lg');
        renderAll(); return;
      }
      if(equipType==='weapon'){
        G._viewTab = 'crew';
        G._viewCrewSel = 0;
        G._equipGunIdx = G._viewInvSel||0;
        addLog('Select a crew member to equip the '+item.name+'.','li');
        renderAll(); return;
      }
      if(equipType==='armor'){
        G._viewTab = 'crew';
        G._viewCrewSel = 0;
        G._equipArmorIdx = G._viewInvSel||0;
        addLog('Select a crew member to equip the '+item.name+'.','li');
        renderAll(); return;
      }
      if(equipType==='implant'){
        G._viewTab = 'crew';
        G._viewCrewSel = 0;
        G._equipImplantIdx = G._viewInvSel||0;
        addLog('Select a crew member to install '+item.name+' (max 2 implants per crew).','li');
        renderAll(); return;
      }
      // ── Combat Stim — crew selection ───────────────────────
      if(equipType==='stim'){
        const living2 = G.crew.filter(c=>c.hp>0);
        if(!living2.length){ addLog('No living crew to administer stim to.','lw'); renderAll(); return; }
        G._viewTab = 'crew';
        G._viewCrewSel = 0;
        G._equipStimIdx = G._viewInvSel||0;
        addLog('Select a crew member to administer the Combat Stim.','li');
        renderAll(); return;
      }
      // ── Grappling Hook ─────────────────────────────────────
      if(item?.usable==='grapple'){
        const onPlanet = G.mode==='planet' || G._prevMode==='planet';
        if(!onPlanet){ addLog('Grappling Hook can only be used on a planet surface.','lw'); renderAll(); return; }
        G._itemAimMode = { usable:'grapple', invIdx: G._viewInvSel||0 };
        G.mode = 'planet';
        addLog('GRAPPLE AIM \u2014 arrow keys to pick direction, [Esc] to cancel.','li');
        renderAll(); return;
      }
      // ── Jetpack ────────────────────────────────────────────
      if(item?.usable==='jetpack'){
        const onPlanetJ = G.mode==='planet' || G._prevMode==='planet';
        if(!onPlanetJ){ addLog('Jetpack can only be used on a planet surface.','lw'); renderAll(); return; }
        if((item.fuel||0) <= 0){ addLog('Jetpack is out of fuel \u2014 find a refuel station or buy a new one.','lw'); renderAll(); return; }
        G._itemAimMode = { usable:'jetpack', invIdx: G._viewInvSel||0 };
        G.mode = 'planet';
        addLog('JETPACK AIM \u2014 arrow keys to pick direction, [Esc] to cancel.','li');
        renderAll(); return;
      }

      // ── Capture Net ────────────────────────────────────────
      if(item?.usable==='capture_net'){
        const onPlanetC = G.mode==='planet' || G._prevMode==='planet'; if(!onPlanetC){ addLog('Capture Net can only be used on a planet surface.','lw'); renderAll(); return; }
        const pdata4 = G.planets[G.curPlanet];
        const nearEnemies2 = (G.enemies[G.curPlanet]||[]).filter(e=>e.alive && !e.hidden && Math.max(Math.abs(e.x-G.player.x),Math.abs(e.y-G.player.y)) <= 1);
        if(!nearEnemies2.length){ addLog('No creature adjacent (net requires melee range).','lw'); renderAll(); return; }
        const target3 = nearEnemies2.sort((a,b)=>(Math.abs(a.x-G.player.x)+Math.abs(a.y-G.player.y))-(Math.abs(b.x-G.player.x)+Math.abs(b.y-G.player.y)))[0];
        target3.stunTurns = (target3.stunTurns||0) + 5;
        target3.netted = true;
        addLog(target3.name+' tangled in capture net — stunned for 5 turns and ready for containment.','lg');
        G.inventory.splice(G._viewInvSel||0, 1);
        G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0, G.inventory.length-1));
        G.mode = G._prevMode;
        completeSurfaceAction();
        renderAll(); return;
      }
      // ── Containment Crate ──────────────────────────────────
      if(item?.usable==='contain_crate'){
        const onPlanetCR = G.mode==='planet' || G._prevMode==='planet'; if(!onPlanetCR){ addLog('Containment Crate can only be used on a planet surface.','lw'); renderAll(); return; }
        const anyNetted = (G.enemies[G.curPlanet]||[]).find(e=>e.alive && e.netted);
        const nettedEnemy = (G.enemies[G.curPlanet]||[]).find(e=>e.alive && e.netted && Math.max(Math.abs(e.x-G.player.x),Math.abs(e.y-G.player.y)) <= 1);
        if(!anyNetted){ addLog('No netted creature on this planet. Use Capture Net on a creature first.','lw'); renderAll(); return; }
        if(!nettedEnemy){ addLog('Netted creature is too far — move adjacent to it first.','lw'); renderAll(); return; }
        const bounty = 150 + Math.floor(Math.random()*200);
        nettedEnemy.alive = false;
        G.mode = G._prevMode;
        G.inventory.push({ name:'Contained: '+nettedEnemy.name, isCapturedCreature:true, creatureName:nettedEnemy.name, bounty, boughtPrice:0, col:'#44ffcc', desc:'Live specimen secured. Deliver to Margo Security for '+bounty+' cr bounty.', value:bounty });
        G.inventory.splice(G._viewInvSel||0, 1);
        G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0, G.inventory.length-1));
        addLog(nettedEnemy.name+' secured in containment crate. Deliver to Margo Security for '+bounty+' cr bounty.','lg');
        renderAll(); return;
      }
      // ── Field Rations ──────────────────────────────────────
      if(item?.usable==='field_rations'){
        const injured2 = G.crew.filter(c=>c.hp>0&&c.hp<c.maxHp).sort((a,b)=>a.hp-b.hp);
        if(!injured2.length){ addLog('All crew are at full health.','li'); renderAll(); return; }
        injured2[0].hp = Math.min(injured2[0].maxHp, injured2[0].hp+5);
        G.inventory.splice(G._viewInvSel||0, 1);
        G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0, G.inventory.length-1));
        addLog('Field Rations used on '+injured2[0].name+'. +5 HP.','lg');
        renderAll(); return;
      }
      // ── Rad-Flush Tablet ───────────────────────────────────
      if(item?.usable==='rad_flush'){
        const treated2 = (typeof reduceCrewRadiation === 'function') ? reduceCrewRadiation(99) : 0;
        if(!treated2){ addLog('No crew member has radiation sickness.','li'); renderAll(); return; }
        G.inventory.splice(G._viewInvSel||0, 1);
        G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0, G.inventory.length-1));
        addLog('Rad-Flush Tablet used. Radiation cleared for '+treated2+' crew.','lg');
        renderAll(); return;
      }
      // ── Sensor Drone ───────────────────────────────────────
      // Galaxy-only: use Rovers for planetside scouting instead.
      if(item?.usable==='sensor_drone'){
        const inGalaxy = G.mode==='galaxy' || G._prevMode==='galaxy';
        if(!inGalaxy){
          addLog('Sensor Drone can only be launched from galaxy view. Use a Rover for planetside scouting.','lw'); renderAll(); return;
        }
        const facing = G.ship?.facing || { dx:0, dy:-1 };
        const fdx = facing.dx||0, fdy = facing.dy||0;
        if(fdx===0 && fdy===0){ addLog('Move the ship first to set a launch direction.','lw'); renderAll(); return; }
        if(!G._activeDrones) G._activeDrones = [];
        G._activeDrones.push({ x: G.ship.x, y: G.ship.y, dx: fdx, dy: fdy, turnsLeft: 4 + Math.floor(Math.random() * 4) });
        G.inventory.splice(G._viewInvSel||0, 1);
        G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0, G.inventory.length-1));
        addLog('Sensor Drone launched — flying ahead, revealing galaxy fog.','lg');
        G.mode = 'galaxy';
        renderAll(); return;
      }
      // ── Repair Kit ─────────────────────────────────────────
      if(item?.usable==='repair_kit'){
        if(G.ship.hp >= G.ship.maxHp){ addLog('Ship hull is already at full integrity.','li'); renderAll(); return; }
        G.ship.hp = Math.min(G.ship.maxHp, G.ship.hp + 15);
        SFX.repair();
        G.inventory.splice(G._viewInvSel||0, 1);
        G._viewInvSel = Math.min(G._viewInvSel||0, Math.max(0, G.inventory.length-1));
        addLog('Repair Kit applied. Ship hull +15 HP.','lg');
        renderAll(); return;
      }
      // floodlight is passive — no activation needed
    }
  }
  return;
}
