function drawInventoryOverlay(){
  const cw = canvas.width, ch = canvas.height;
  ctx.fillStyle='rgba(0,0,0,0.88)'; ctx.fillRect(0,0,cw,ch);
  ensureCrewMoraleState();
  updateCrewLowMoraleFlags();

  const tab = G._viewTab || 'inventory';

  // Tab headers — 4 tabs, evenly spaced
  const tabs = [{id:'inventory',label:'INVENTORY'},{id:'crew',label:'CREW'},{id:'ship',label:'SHIP'},{id:'log',label:'LOG'}];
  const tw=110, tgap=8, totalW=tabs.length*(tw+tgap)-tgap;
  const tabsStartX = Math.round((cw-totalW)/2);
  tabs.forEach((t,i)=>{
    const sel = tab===t.id;
    const tx = tabsStartX + i*(tw+tgap), ty = 10, th = 26;
    ctx.fillStyle = sel ? '#0e1a2a' : '#06060e';
    ctx.fillRect(tx, ty, tw, th);
    ctx.strokeStyle = sel ? '#ffe066' : '#2a2a4a';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(tx, ty, tw, th);
    ctx.font = 'bold 12px Courier New';
    ctx.fillStyle = sel ? '#ffe066' : '#445566';
    ctx.textAlign = 'center';
    ctx.fillText(t.label, tx+tw/2, ty+17);
  });
  ctx.fillStyle='#1a1a2a'; ctx.fillRect(40,40,cw-80,1);

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
      ctx.fillStyle='#445566'; ctx.fillText('[X] Examine selected item', 240, listBottom+18);
      if(startIdx>0){ ctx.fillStyle='#667788'; ctx.fillText('^ more', cw-120, 44); }
      if(endIdx<rows.length){ ctx.fillStyle='#667788'; ctx.fillText('v more', cw-120, listBottom+18); }
    }

  } else if(tab==='crew'){
    // ── CREW tab ─────────────────────────────────────────────────
    const living = G.crew.filter(c=>c.hp>0);
    const sel = Math.min(G._viewCrewSel||0, living.length-1);
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
      // Left: crew list — each card is 54px tall to fit 3 rows
      living.forEach((c,i)=>{
        const isSel = i===sel;
        const roleData = CREW_ROLES[c.role];
        const roleCol = roleData ? roleData.col : '#aaaaaa';
        const by = (equipMode ? 74 : 54) + i*58;
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
    ctx.fillText(shipLabel, 40, 68);
    ctx.font='13px Courier New'; ctx.fillStyle='#445566';
    ctx.fillText(ss.desc, 40, 86);
    ctx.fillStyle='#1a1a2a'; ctx.fillRect(40, 96, cw-80, 1);

    // Two-column stat layout — tighter rowH to leave more space for loadout tables
    const col1x=40, col2x=cw/2+20, rowH=24, startY=114;

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
    statRow('Shields',        ss.shields,     ss.maxShields||0,   col1x, startY+rowH*2, '#88ccff');
    statRow('Engine Rating',  ss.engineRating, ss.maxUpgradeEngine,  col1x, startY+rowH*3, '#ffcc44');
    upgradeBar(ss.engineRating, ss.maxUpgradeEngine, col1x+172,        startY+rowH*3,        '#aa8800');
    statRow('Sensor Range',   ss.sensorRange, ss.maxUpgradeSensor,  col1x, startY+rowH*4, '#70d8ff');
    upgradeBar(ss.sensorRange, ss.maxUpgradeSensor, col1x+172,         startY+rowH*4,        '#2288aa');

    // Right column
    statRow('Weapon Slots',   ss.weaponSlots, ss.maxWeaponSlots,  col2x, startY+rowH*0, '#ff8866');
    upgradeBar(ss.weaponSlots, ss.maxWeaponSlots, col2x+172,      startY+rowH*0,        '#aa4422');
    statRow('Module Slots',   ss.moduleSlots, ss.maxModuleSlots,  col2x, startY+rowH*1, '#cc88ff');
    upgradeBar(ss.moduleSlots, ss.maxModuleSlots, col2x+172,      startY+rowH*1,        '#664488');
    statRow('Cargo Capacity', ss.cargoCapacity, ss.maxUpgradeCargo??ss.cargoCapacity, col2x, startY+rowH*2, '#ffdd88');
    upgradeBar(ss.cargoCapacity, ss.maxUpgradeCargo??ss.cargoCapacity, col2x+172,      startY+rowH*2,       '#886600');
    statRow('Max Crew',       G.crew.filter(c=>c.hp>0).length, ss.maxUpgradeCrew??ss.maxCrew, col2x, startY+rowH*3, '#70f090');

    // Weapon loadout + Module loadout — side by side below the stat columns
    const loadoutY = startY + rowH*5 + 10;
    const midX = col1x + (col2x - col1x) / 2 + 20;
    const slotRowH = 26; // bigger row height for readability

    // ── Weapon loadout (left half) ────────────────────────────────
    ctx.fillStyle='#2a2a3a'; ctx.fillRect(col1x, loadoutY, midX-col1x-10, 1);
    ctx.font='bold 13px Courier New'; ctx.fillStyle='#554433';
    ctx.fillText('WEAPON LOADOUT', col1x, loadoutY+16);
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
        ctx.fillText('↑/↓ select cargo    J  jettison selected unit', cw/2, hintY);
        ctx.textAlign = 'left';
      }
    }
  } else if(tab==='log'){
    // ── LOG tab ──────────────────────────────────────────────────────
    // Filter buttons
    const FILTERS = [
      { id:'all',     label:'ALL' },
      { id:'mission', label:'MISSION' },
      { id:'combat',  label:'COMBAT' },
      { id:'crew',    label:'CREW' },
      { id:'critical',label:'CRITICAL' },
    ];
    if(!G._logFilter) G._logFilter = 'all';

    // Draw filter buttons
    const fBtnW = 90, fBtnH = 22, fBtnGap = 6;
    const fTotalW = FILTERS.length*(fBtnW+fBtnGap)-fBtnGap;
    const fStartX = Math.round((cw-fTotalW)/2);
    const fY = 52;
    FILTERS.forEach((f,i)=>{
      const fx = fStartX + i*(fBtnW+fBtnGap);
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
        return m.includes('contract') || m.includes('science office') ||
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

    const allEntries = G.log || [];
    const filtered = allEntries.filter(e=>logMatchesFilter(e, G._logFilter));

    // Scrollable list
    const listTop = fY + fBtnH + 12;
    const listBottom = ch - 30;
    const rowH = 20;
    const visRows = Math.floor((listBottom - listTop) / rowH);
    const maxScroll = Math.max(0, filtered.length - visRows);
    // Default to bottom (newest) on first open; Infinity gets clamped to maxScroll
    if(G._logScroll === undefined || G._logScroll === Infinity) G._logScroll = maxScroll;
    G._logScroll = Math.max(0, Math.min(G._logScroll, maxScroll));

    if(!filtered.length){
      ctx.font='15px Courier New'; ctx.fillStyle='#445544'; ctx.textAlign='center';
      ctx.fillText('No log entries match this filter.', cw/2, listTop+40);
      ctx.textAlign='left';
    } else {
      // Colour map matching sidebar log colours
      const logColors = { lc:'#ff4444', ll:'#ffcc44', lw:'#ff9955', lg:'#44ff88', li:'#7788aa', '':'#99aaaa' };
      // Reverse so oldest entries are at index 0, newest at the end — matches sidebar order
      const reversed = filtered.slice().reverse();
      const slice = reversed.slice(G._logScroll, G._logScroll+visRows);
      slice.forEach((entry, i)=>{
        const ey = listTop + i*rowH;
        const col = logColors[entry.cls||''] || '#99aaaa';
        // Turn stamp
        const turnStr = '[T'+String(entry.turn||1).padStart(4,' ')+']';
        ctx.font = '11px Courier New';
        ctx.fillStyle = '#334455';
        ctx.fillText(turnStr, 48, ey+14);
        // Message
        ctx.font = '12px Courier New';
        ctx.fillStyle = col;
        const countSuffix = entry.count > 1 ? ' (×'+entry.count+')' : '';
        const maxW = cw - 48 - 62 - 16; // leave room for turn stamp
        let txt = entry.msg + countSuffix;
        // Truncate if too long
        ctx.save();
        ctx.font = '12px Courier New';
        while(txt.length>2 && ctx.measureText(txt).width > maxW) txt = txt.slice(0,-4)+'…';
        ctx.restore();
        ctx.fillText(txt, 48+62, ey+14);
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
    ctx.fillText('←/→ switch tab    ↑/↓ scroll    Shift+↑/↓ fast scroll    [1-5] filter    ESC close', cw/2, ch-14);
    ctx.textAlign='left';
  } else if(tab !== 'ship'){
    ctx.font='14px Courier New'; ctx.fillStyle='#334455'; ctx.textAlign='center';
    const extra = tab === 'crew' && G._equipGunIdx === undefined && G._equipArmorIdx === undefined ? '    X channel/log' : '';
    ctx.fillText('←/→ switch tab    ↑/↓ select'+extra+'    ESC close', cw/2, ch-14);
    ctx.textAlign='left';
  }
}

