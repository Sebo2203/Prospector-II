function drawBaseOverlay(){
  const cw = canvas.width, ch = canvas.height;
  ctx.fillStyle='rgba(0,0,0,0.88)'; ctx.fillRect(0,0,cw,ch);

  const b = G.base;

  // Retirement confirm screen
  if(b.confirm === 'retire'){
    const cx = cw/2;
    ctx.textAlign='center';
    ctx.font='bold 17px Courier New'; ctx.fillStyle='#557799';
    ctx.fillText('— ' + stationCorpOffice(G.base?.stationName).toUpperCase() + ' —', cx, 36);
    ctx.font='bold 25px Courier New'; ctx.fillStyle='#aaaacc';
    ctx.fillText('FILE FOR RETIREMENT', cx, 72);
    ctx.fillStyle='#223344'; ctx.fillRect(cx-280, 84, 560, 1);

    ctx.font='16px Courier New'; ctx.fillStyle='#778899';
    ctx.fillText('You have accumulated', cx, 122);
    ctx.font='bold 26px Courier New'; ctx.fillStyle='#ffe066';
    ctx.fillText(G.credits+' credits', cx, 154);

    ctx.fillStyle='#223344'; ctx.fillRect(cx-280, 172, 560, 1);

    ctx.font='15px Courier New'; ctx.fillStyle='#556677';
    ctx.fillText('Are you sure you want to retire?', cx, 198);
    ctx.font='14px Courier New'; ctx.fillStyle='#334455';
    ctx.fillText('This will permanently end your career.', cx, 220);

    ctx.fillStyle='#223344'; ctx.fillRect(cx-280, 240, 560, 1);
    ctx.font='bold 16px Courier New';
    ctx.fillStyle='#44ff88'; ctx.fillText('[ ENTER ]  Confirm', cx-80, 264);
    ctx.fillStyle='#ff6644'; ctx.fillText('[ ESC ]  Cancel', cx+90, 264);
    ctx.textAlign='left';
    return;
  }

  // Retirement story screen — full narrative, then ENTER to see stats
  if(b.confirm === 'retire_story'){
    const tier = RETIREMENT_TIERS.find(t=>G.credits>=t.min && G.credits<=t.max) || RETIREMENT_TIERS[0];
    const cx = cw/2;
    ctx.textAlign='center';

    // Top accent
    ctx.fillStyle='#001830'; ctx.fillRect(0,0,cw,6);
    ctx.fillStyle='#003060'; ctx.fillRect(0,6,cw,2);

    ctx.font='bold 27px Courier New'; ctx.fillStyle=tier.col;
    ctx.fillText('— FINAL LOG —', cx, 52);
    ctx.font='bold 16px Courier New'; ctx.fillStyle='#556677';
    ctx.fillText(tier.title.toUpperCase(), cx, 74);
    ctx.fillStyle='#112233'; ctx.fillRect(cx-320, 84, 640, 1);

    // Pick story block by turn parity
    const storyIdx = G.retirementStoryIdx ?? Math.floor(Math.random() * tier.story.length);
    const storyRaw = tier.story[storyIdx];
    // Story entries are either a plain array of lines, or {noEpilogue, lines}
    const noEpilogue = G.retirementNoEpilogue || (storyRaw && storyRaw.noEpilogue);
    const storyBlock = Array.isArray(storyRaw) ? storyRaw : storyRaw.lines;

    // Inject actual credits into any {credits} placeholder
    const resolvedBlock = storyBlock.map(l => l.replace('{credits}', G.credits+' cr'));

    // Render each line of the story block with word-wrap
    let y = 106;
    const lineMax = 62;
    for(const rawLine of resolvedBlock){
      if(rawLine === ''){
        y += 14;
        continue;
      }
      const words = rawLine.split(' ');
      let cur='', wrapped=[];
      for(const w of words){ if((cur+w).length>lineMax){wrapped.push(cur.trim());cur='';} cur+=w+' '; }
      if(cur.trim()) wrapped.push(cur.trim());
      ctx.font='16px Courier New'; ctx.fillStyle='#aabbcc';
      for(const wl of wrapped){
        ctx.fillText(wl, cx, y);
        y += 22;
      }
    }

    // Epilogue — skipped for noEpilogue (fatal/dark) endings
    if(!noEpilogue){
      y += 10;
      ctx.fillStyle='#112233'; ctx.fillRect(cx-320, y, 640, 1);
      y += 18;
      const epilogueBlock = RETIREMENT_EPILOGUES[G.retirementEpilogueIdx ?? Math.floor(Math.random() * RETIREMENT_EPILOGUES.length)];
      for(const el of epilogueBlock){
        if(!el){ y+=8; continue; }
        ctx.font='14px Courier New'; ctx.fillStyle='#556677';
        ctx.fillText(el, cx, y);
        y += 20;
      }
    }

    // Prompt
    ctx.font='bold 15px Courier New'; ctx.fillStyle='#ffe066';
    ctx.fillText('[ ENTER ]  See your career stats', cx, ch-30);
    ctx.textAlign='left';
    return;
  }

  if(b.screen === 'main'){
    // Header
    ctx.font='bold 21px Courier New'; ctx.fillStyle='#ffe066'; ctx.textAlign='center';
    ctx.fillText((G.base.stationName||'STARBASE').toUpperCase(), cw/2, 36);
    ctx.fillStyle='#223344'; ctx.fillRect(cw/2-410, 44, 820, 1);

    // Scrollable building list
    const BLDG_ROW_H = 40, BLDG_GAP = 4, BLDG_TOP = 48, BLDG_BOT = ch - 42;
    const bldgVisible = Math.floor((BLDG_BOT - BLDG_TOP) / (BLDG_ROW_H + BLDG_GAP));
    b.mainScroll = b.mainScroll || 0;
    if(b.sel < b.mainScroll) b.mainScroll = b.sel;
    if(b.sel >= b.mainScroll + bldgVisible) b.mainScroll = b.sel - bldgVisible + 1;
    b.mainScroll = Math.max(0, Math.min(b.mainScroll, Math.max(0, STATION_BUILDINGS.length - bldgVisible)));

    ctx.save();
    ctx.beginPath(); ctx.rect(0, BLDG_TOP, cw, BLDG_BOT - BLDG_TOP); ctx.clip();
    STATION_BUILDINGS.forEach((bldg, i)=>{
      const visIdx = i - b.mainScroll;
      if(visIdx < 0 || visIdx >= bldgVisible) return;
      const sel = i === b.sel;
      const bx = cw/2 - 410, by = BLDG_TOP + visIdx*(BLDG_ROW_H+BLDG_GAP), bw = 820, bh = BLDG_ROW_H;
      ctx.fillStyle = sel ? '#0e1a2a' : '#08080f';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = sel ? bldg.col : '#1a1a2a';
      ctx.lineWidth = sel ? 1.5 : 1;
      ctx.strokeRect(bx, by, bw, bh);
      if(sel){ ctx.fillStyle=bldg.col; ctx.font='bold 13px Courier New'; ctx.textAlign='left'; ctx.fillText('▶', bx+8, by+16); }
      ctx.font = 'bold 13px Courier New'; ctx.fillStyle = sel ? '#ffffff' : bldg.col;
      ctx.textAlign='left'; ctx.fillText(typeof bldg.name==='function' ? bldg.name(G.base.stationName) : bldg.name, bx+24, by+16);
      ctx.font = '11px Courier New'; ctx.fillStyle = sel ? '#aaaaaa' : '#555566';
      ctx.fillText(bldg.desc, bx+24, by+31);
    });
    ctx.restore();

    // Scroll indicators
    if(b.mainScroll > 0){
      ctx.fillStyle='#667788'; ctx.font='13px Courier New'; ctx.textAlign='center';
      ctx.fillText('▲ more', cw/2, BLDG_TOP - 4);
    }
    if(b.mainScroll + bldgVisible < STATION_BUILDINGS.length){
      ctx.fillStyle='#667788'; ctx.font='13px Courier New'; ctx.textAlign='center';
      ctx.fillText('▼ more', cw/2, BLDG_BOT - 2);
    }

    // Footer
    ctx.font='14px Courier New'; ctx.fillStyle='#334455'; ctx.textAlign='center';

  } else if(b.screen === 'sub'){
    const bldg = STATION_BUILDINGS[b.sel];
    const actions = bldg.actions();

    // Header
    ctx.font='bold 19px Courier New'; ctx.fillStyle=bldg.col; ctx.textAlign='center';
    ctx.fillText((typeof bldg.name==='function' ? bldg.name(G.base.stationName) : bldg.name).toUpperCase(), cw/2, 30);
    ctx.font='14px Courier New'; ctx.fillStyle='#445566';
    ctx.fillText(G.base.stationName||'', cw/2, 46);
    ctx.fillStyle='#223344'; ctx.fillRect(cw/2-410, 52, 820, 1);

    // Action list — scrollable (compact rows: label + detail on one line)
    const ROW_H = 36, LIST_TOP = 56, LIST_BOT = ch - 28;
    const visibleRows = Math.floor((LIST_BOT - LIST_TOP) / ROW_H);
    // Clamp scroll so selected item is always visible
    b.subScroll = b.subScroll || 0;
    if(b.subSel < b.subScroll) b.subScroll = b.subSel;
    if(b.subSel >= b.subScroll + visibleRows) b.subScroll = b.subSel - visibleRows + 1;
    b.subScroll = Math.max(0, Math.min(b.subScroll, Math.max(0, actions.length - visibleRows)));

    // Clip drawing to list area
    ctx.save();
    ctx.beginPath(); ctx.rect(0, LIST_TOP, cw, LIST_BOT - LIST_TOP); ctx.clip();

    actions.forEach((act, i)=>{
      const visIdx = i - b.subScroll;
      if(visIdx < 0 || visIdx >= visibleRows) return;
      const sel = i === b.subSel;
      const ax = cw/2 - 410, ay = LIST_TOP + visIdx*ROW_H, aw = 820, ah = 30;
      const dim = act.disabled;
      // Section headers — compact divider row
      if(act._header){
        ctx.fillStyle='#0a0a12'; ctx.fillRect(ax, ay, aw, ah);
        ctx.fillStyle='#2a2a3a'; ctx.fillRect(ax, ay+ah-1, aw, 1);
        ctx.font='bold 11px Courier New'; ctx.fillStyle='#ffe066';
        ctx.textAlign='left'; ctx.fillText(act.label, ax+10, ay+13);
        ctx.font='10px Courier New'; ctx.fillStyle='#445566';
        ctx.fillText(act.detail, ax+10, ay+25);
        return;
      }
      ctx.fillStyle = dim ? '#050508' : sel ? '#0e1a2a' : '#08080f';
      ctx.fillRect(ax, ay, aw, ah);
      ctx.strokeStyle = dim ? '#111118' : sel ? bldg.col : '#1a1a2a';
      ctx.lineWidth = sel ? 1.5 : 1;
      ctx.strokeRect(ax, ay, aw, ah);
      if(sel && !dim){ ctx.fillStyle=bldg.col; ctx.font='bold 12px Courier New'; ctx.textAlign='left'; ctx.fillText('▶', ax+6, ay+19); }
      // Label
      ctx.font='bold 13px Courier New';
      ctx.fillStyle = dim ? '#333344' : sel ? '#ffffff' : '#cccccc';
      ctx.textAlign='left'; ctx.fillText(act.label, ax+20, ay+19);
      // Detail — right-aligned, smaller, muted
      ctx.font='11px Courier New';
      ctx.fillStyle = dim ? '#222233' : sel ? '#889aaa' : '#445566';
      ctx.textAlign='right'; ctx.fillText(act.detail, ax+aw-8, ay+19);
      ctx.textAlign='left';
    });

    ctx.restore();

    // Scroll indicators
    if(b.subScroll > 0){
      ctx.fillStyle='#667788'; ctx.font='13px Courier New'; ctx.textAlign='center';
      ctx.fillText('▲ more', cw/2, LIST_TOP - 4);
    }
    if(b.subScroll + visibleRows < actions.length){
      ctx.fillStyle='#667788'; ctx.font='13px Courier New'; ctx.textAlign='center';
      ctx.fillText('▼ more', cw/2, LIST_BOT + 12);
    }

    // Footer
    ctx.font='14px Courier New'; ctx.fillStyle='#334455'; ctx.textAlign='center';

  } else if(b.screen === 'recruit'){
    const HIRE_ROLES = [
      { key:'scout',     cost:200, label:'Navigator', desc:'Explorer, pilot & scanner. Starts NAV '+Math.floor(3/2)+' SCI '+Math.floor(3/2)+' CBT '+Math.floor(1/2)+' SOC '+Math.floor(1/2) },
      { key:'engineer',  cost:200, label:'Engineer',  desc:'Ship tech & hull repair. Starts ENG '+Math.floor(3/2)+' NAV 0 SCI '+Math.floor(1/2) },
      { key:'scientist', cost:200, label:'Scientist', desc:'Research & analysis. Starts SCI '+Math.floor(4/2)+' MED '+Math.floor(1/2) },
      { key:'medic',     cost:150, label:'Medic',     desc:'Crew healer. Starts MED '+Math.floor(4/2)+' SCI '+Math.floor(2/2) },
      { key:'mercenary', cost:150, label:'Mercenary', desc:'Combat specialist. Starts CBT '+Math.floor(4/2)+' ENG '+Math.floor(1/2) },
      { key:'redshirt',  cost:100, label:'Redshirt',  desc:'General crew. Modest starting skills.' },
    ];
    const sel = b.recruitSel || 0;
    const cx = cw/2;

    ctx.textAlign='center';
    ctx.font='bold 17px Courier New'; ctx.fillStyle='#ffaa44';
    ctx.fillText('— RECRUIT CREW —', cx, 28);
    ctx.font='13px Courier New'; ctx.fillStyle='#445566';
    ctx.fillText('Hired crew start at half the skill level of your original specialists.', cx, 46);
    ctx.fillStyle='#1a1a2a'; ctx.fillRect(cx-300, 52, 600, 1);

    const rowH=62, listTop=60;
    HIRE_ROLES.forEach((r, i)=>{
      const isSel = i === sel;
      const roleData = CREW_ROLES[r.key];
      const ax=cx-280, ay=listTop+i*rowH, aw=560, ah=54;
      ctx.fillStyle = isSel ? '#0e1a10' : '#080810';
      ctx.fillRect(ax,ay,aw,ah);
      ctx.strokeStyle = isSel ? (roleData?.col||'#aaa') : '#1a1a2a';
      ctx.lineWidth = isSel ? 2 : 1; ctx.strokeRect(ax,ay,aw,ah);
      if(isSel){ ctx.fillStyle=roleData?.col||'#aaa'; ctx.font='bold 14px Courier New'; ctx.textAlign='left'; ctx.fillText('▶', ax+8, ay+22); }
      ctx.font='bold 15px Courier New'; ctx.fillStyle=isSel ? (roleData?.col||'#fff') : '#aaaaaa';
      ctx.textAlign='left'; ctx.fillText(r.label, ax+28, ay+21);
      ctx.font='12px Courier New'; ctx.fillStyle='#556677';
      ctx.fillText(r.desc, ax+28, ay+38);
      ctx.textAlign='right'; ctx.font='bold 14px Courier New';
      ctx.fillStyle = G.credits>=r.cost ? '#ffe066' : '#664422';
      ctx.fillText(r.cost+' cr', ax+aw-12, ay+21);
      ctx.textAlign='left';
    });
    const canAfford = G.credits >= (HIRE_ROLES[sel]?.cost||999);
    ctx.textAlign='center'; ctx.font='13px Courier New';
    ctx.fillStyle = canAfford ? '#ffaa44' : '#662222';
    ctx.fillText(canAfford ? '[ ENTER ]  Hire '+HIRE_ROLES[sel]?.label+' for '+HIRE_ROLES[sel]?.cost+' cr' : 'Not enough credits', cx, listTop+HIRE_ROLES.length*rowH+16);
    ctx.fillStyle='#334455'; ctx.fillText('↑ ↓ navigate   Enter confirm   ESC back', cx, ch-14);

  } else if(b.screen === 'installweapon'){
    {
    const slot = b.weaponSlot || 0;
    const cx = cw/2;
    const weapons = Object.values(SHIP_WEAPONS);
    const sel = b.weaponSel || 0;

    ctx.textAlign='center';
    ctx.fillStyle='#1a1a2a'; ctx.fillRect(cx-340, 8, 680, 1);

    const rowH=64, listTop=14;
    weapons.forEach((wdef, i)=>{
      const isSel = i === sel;
      const isInstalled = (G.installedWeapons||[]).includes(wdef.id);
      const ax=cx-300, ay=listTop+i*rowH, aw=600, ah=56;
      ctx.fillStyle = isSel ? '#0e1a10' : '#080810';
      ctx.fillRect(ax,ay,aw,ah);
      ctx.strokeStyle = isSel ? '#ff9944' : '#1a1a2a';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.strokeRect(ax,ay,aw,ah);
      if(isSel){ ctx.fillStyle='#ff9944'; ctx.font='bold 14px Courier New'; ctx.textAlign='left'; ctx.fillText('▶', ax+8, ay+22); }
      ctx.font='bold 14px Courier New'; ctx.fillStyle= wdef.placeholder ? '#886644' : (isSel ? '#ffcc88' : '#aa7744');
      ctx.textAlign='left'; ctx.fillText(wdef.name, ax+28, ay+20);
      ctx.font='12px Courier New'; ctx.fillStyle='#445566';
      ctx.fillText(wdef.desc, ax+28, ay+36);
      ctx.textAlign='right';
      if(wdef.placeholder){
        ctx.fillStyle='#554422'; ctx.fillText('NOT YET AVAILABLE', ax+aw-12, ay+20);
      } else {
        ctx.fillStyle='#ffe066'; ctx.fillText(wdef.cost+' cr', ax+aw-12, ay+20);
        ctx.fillStyle='#556644'; ctx.fillText(wdef.minDmg+'–'+wdef.maxDmg+' dmg', ax+aw-12, ay+36);
      }
      if(isInstalled && !wdef.placeholder){
        ctx.fillStyle='#335533'; ctx.font='11px Courier New'; ctx.fillText('installed', ax+aw-12, ay+50);
      }
      ctx.textAlign='left';
    });

    const selW = weapons[sel];
    ctx.textAlign='center'; ctx.font='13px Courier New';
    if(selW.placeholder){
      ctx.fillStyle='#554422'; ctx.fillText('This weapon is not yet available.', cx, listTop+weapons.length*rowH+16);
    } else if(G.credits < selW.cost){
      ctx.fillStyle='#662222'; ctx.fillText('Insufficient credits (need '+selW.cost+' cr, have '+G.credits+').', cx, listTop+weapons.length*rowH+16);
    } else {
      ctx.fillStyle='#ff9944'; ctx.fillText('[ ENTER ]  Install '+selW.name+' for '+selW.cost+' cr', cx, listTop+weapons.length*rowH+16);
    }
    ctx.fillStyle='#334455'; ctx.fillText('↑ ↓ navigate   ESC cancel', cx, ch-14);
    }
  } else if(b.screen === 'changehull'){
    const HULL_IDS = ['LIGHT_SCOUT','BULK_FREIGHTER','ATTACK_CORVETTE'];
    const hullSel = b.hullSel || 0;
    const cx = cw/2;
    const HULL_COST = 3000;

    ctx.textAlign='center';
    ctx.font='bold 17px Courier New'; ctx.fillStyle='#44aaff';
    ctx.fillText('— CHANGE HULL TYPE —', cx, 28);
    ctx.font='13px Courier New'; ctx.fillStyle='#445566';
    ctx.fillText('Cost: '+HULL_COST+' cr  ·  All upgrades reset to new hull base  ·  HP ratio preserved', cx, 46);
    ctx.fillStyle='#1a2a3a'; ctx.fillRect(cx-340, 52, 680, 1);

    const cardW=200, cardH=260, cardGap=20;
    const totalCardW = HULL_IDS.length*(cardW+cardGap)-cardGap;
    const cardStartX = cx - totalCardW/2;

    HULL_IDS.forEach((id, i)=>{
      const cls = SHIP_CLASSES[id];
      const isSel = i === hullSel;
      const isCurrent = id === G.shipStats?.classId;
      const bx = cardStartX + i*(cardW+cardGap), by = 62;

      ctx.fillStyle = isCurrent ? '#0a0a18' : isSel ? '#0a1a2a' : '#080810';
      ctx.fillRect(bx, by, cardW, cardH);
      ctx.strokeStyle = isCurrent ? '#334488' : isSel ? '#44aaff' : '#1a1a2a';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.strokeRect(bx, by, cardW, cardH);

      // Hull name
      ctx.font='bold 13px Courier New'; ctx.fillStyle= isSel ? '#aaddff' : '#556677';
      ctx.textAlign='center';
      ctx.fillText(cls.hullType.toUpperCase(), bx+cardW/2, by+14);
      if(isCurrent){ ctx.font='10px Courier New'; ctx.fillStyle='#334466'; ctx.fillText('(current)', bx+cardW/2, by+26); }

      // Sprite
      const sprKey = cls.sprite || 'player_ship';
      if(IMG[sprKey] && IMG[sprKey].complete){
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(IMG[sprKey], bx+cardW/2-24, by+(isCurrent?30:22), 48, 48);
      }

      // Stats
      const stats = [
        ['HP',      cls.baseHp+' → '+cls.maxUpgradeHp],
        ['Fuel',    cls.baseFuel+' → '+cls.maxUpgradeFuel],
        ['Cargo',   cls.cargoCapacity+' (base)'],
        ['Sensors', cls.sensorRange+' → '+cls.maxUpgradeSensor],
        ['Shields', cls.shields+' → '+cls.maxShields],
        ['Engine',  cls.engineRating+(cls.maxUpgradeEngine>cls.engineRating?' → '+cls.maxUpgradeEngine:'')],
        ['Weapons', cls.weaponSlots+' → '+cls.maxWeaponSlots+' slots'],
        ['Modules', cls.moduleSlots+' → '+cls.maxModuleSlots+' slots'],
        ['Crew',    cls.maxCrew+(cls.maxUpgradeCrew>cls.maxCrew?' → '+cls.maxUpgradeCrew:'')+' max'],
      ];
      ctx.textAlign='left';
      stats.forEach((s, si)=>{
        const sy = by + (isCurrent ? 82 : 74) + si*16;
        ctx.font='11px Courier New'; ctx.fillStyle='#334455';
        ctx.fillText(s[0], bx+10, sy);
        ctx.fillStyle= isSel ? '#8899bb' : '#445566';
        ctx.fillText(s[1], bx+70, sy);
      });

      // Desc — word-wrapped
      ctx.font='10px Courier New'; ctx.fillStyle='#2a3a4a';
      ctx.textAlign='center';
      const descWords = cls.desc.split(' ');
      const descMaxW = cardW - 16;
      let descLine = '', descY = by + cardH - 30;
      const descLines = [];
      descWords.forEach(w => {
        const test = descLine ? descLine+' '+w : w;
        if(ctx.measureText(test).width > descMaxW && descLine){ descLines.push(descLine); descLine=w; }
        else descLine = test;
      });
      if(descLine) descLines.push(descLine);
      const descLineH = 13;
      const descStartY = by + cardH - 8 - (descLines.length-1)*descLineH;
      descLines.forEach((dl,di) => ctx.fillText(dl, bx+cardW/2, descStartY+di*descLineH));
    });

    // Confirm prompt
    const selCls = SHIP_CLASSES[HULL_IDS[hullSel]];
    const isCurr = HULL_IDS[hullSel] === G.shipStats?.classId;
    ctx.textAlign='center';
    ctx.font='13px Courier New';
    if(isCurr){
      ctx.fillStyle='#334455'; ctx.fillText('Already flying this hull type.', cx, 62+260+22);
    } else if(G.credits < HULL_COST){
      ctx.fillStyle='#662222'; ctx.fillText('Insufficient credits (need '+HULL_COST+' cr, have '+G.credits+').', cx, 62+260+22);
    } else {
      ctx.fillStyle='#44aaff';
      ctx.fillText('[ ENTER ]  Purchase '+selCls.hullType+' for '+HULL_COST+' cr', cx, 62+260+22);
    }
    ctx.font='13px Courier New'; ctx.fillStyle='#334455';
    ctx.fillText('← → navigate   ESC cancel', cx, ch-14);
  }

  ctx.textAlign='left';
}

