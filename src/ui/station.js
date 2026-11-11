function drawHangarWeaponPicker(b,cw,ch){
  const slot=b.weaponSlot||0,weapons=Object.values(SHIP_WEAPONS),selected=b.weaponSel||0;
  const left=cw/2-410,width=820,mountNames=['','Light','Medium','Heavy'];
  const current=SHIP_WEAPONS[G.installedWeapons[slot]];
  ctx.textAlign='center';ctx.font='bold 19px Courier New';ctx.fillStyle='#44aaff';
  ctx.fillText('HANGAR / ARMAMENT',cw/2,28);
  ctx.font='12px Courier New';ctx.fillStyle='#8297ab';
  ctx.fillText('MOUNT '+(slot+1)+'  ·  '+mountNames[shipMountSize(slot)]+'  ·  '+(current?current.name:'Empty'),cw/2,46);
  ctx.fillStyle='#223344';ctx.fillRect(left,52,width,1);
  const rowHeight=62,top=60;
  weapons.forEach((weapon,index)=>{
    const y=top+index*rowHeight,active=index===selected,fitted=G.installedWeapons[slot]===weapon.id;
    const owned=ownedShipWeaponCount(weapon.id);
    canvasMenuTarget(left,y,width,56,()=>{b.weaponSel=index;renderAll();},{label:weapon.name});
    ctx.fillStyle=active?'#0e1a2a':'#080f17';ctx.fillRect(left,y,width,56);
    ctx.strokeStyle=active?'#44aaff':'#233344';ctx.lineWidth=active?1.5:1;ctx.strokeRect(left,y,width,56);
    ctx.textAlign='left';ctx.font='bold 13px Courier New';ctx.fillStyle=active?'#ffffff':'#b3c9dd';
    if(active)ctx.fillText('▶',left+7,y+18);
    ctx.fillText(weapon.name,left+24,y+18,width-260);
    ctx.textAlign='right';ctx.font='bold 11px Courier New';ctx.fillStyle=fitted?'#80b8d9':'#e5c478';
    ctx.fillText(fitted?'FITTED HERE':weapon.placeholder?'UNAVAILABLE':owned?owned+' IN STORES · FREE TO FIT':weapon.cost+' cr',left+width-12,y+18,225);
    ctx.textAlign='left';ctx.font='11px Courier New';ctx.fillStyle='#98adbf';
    ctx.fillText(weapon.minDmg+'–'+weapon.maxDmg+' damage · Range '+weapon.range+' · '+mountNames[weapon.mountSize]+' mount · '+weapon.power+' power · '+weapon.heat+' heat · Reload '+weapon.cooldown+'t',left+24,y+34,width-48);
    ctx.fillStyle='#657d91';ctx.fillText(weapon.desc,left+24,y+49,width-48);
  });
  const weapon=weapons[selected],reason=weapon.placeholder?'This weapon is not available.':shipWeaponInstallReason(slot,weapon);
  const price=shipWeaponInstallPrice(weapon),afford=G.credits>=price;
  ctx.textAlign='left';ctx.font='12px Courier New';ctx.fillStyle=reason?'#b7a284':'#8ca9bf';
  ctx.fillText(reason||(!afford?'Insufficient credits: need '+price+' cr.':weapon.name+' · '+(price?'Installation '+price+' cr':'Owned equipment; no fitting charge')),left,392,width);
  if(!reason&&afford)canvasMenuButton(price?'Buy and install [Enter]':'Fit from stores [Enter]',left,416,()=>handleStationKey('Enter'));
  ctx.textAlign='left';
}

function drawBaseOverlay(){
  const cw = canvasWidth, ch = canvasHeight;
  ctx.fillStyle='rgba(0,0,0,0.88)'; ctx.fillRect(0,0,cw,ch);

  const b = G.base;
  const back = ()=>handleStationKey('Escape');

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
    canvasMenuTarget(cx-154,246,146,26,()=>handleStationKey('Enter'));
    canvasMenuTarget(cx+27,246,146,26,back);
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
    canvasMenuTarget(cx-180,ch-48,360,26,()=>handleStationKey('Enter'));
    ctx.textAlign='left';
    return;
  }

  if(b.screen === 'main'){
    canvasMenuScroll = step=>handleStationKey(step<0?'ArrowUp':'ArrowDown');
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
      canvasMenuTarget(bx,by,bw,bh,()=>{ b.sel=i; handleStationKey('Enter'); });
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

  } else if(b.screen === 'sub'){
    canvasMenuScroll = step=>handleStationKey(step<0?'ArrowUp':'ArrowDown');
    const bldg = STATION_BUILDINGS[b.sel];
    const actions = bldg.actions();

    // Header
    ctx.font='bold 19px Courier New'; ctx.fillStyle=bldg.col; ctx.textAlign='center';
    ctx.fillText((typeof bldg.name==='function' ? bldg.name(G.base.stationName) : bldg.name).toUpperCase(), cw/2, 30);
    ctx.font='14px Courier New'; ctx.fillStyle='#445566';
    ctx.fillText(G.base.stationName||'', cw/2, 46);
    ctx.fillStyle='#223344'; ctx.fillRect(cw/2-410, 52, 820, 1);

    // Action list — scrollable (compact rows: label + detail on one line)
    const armament=bldg.id==='hangar'&&b.hangarSub==='armament';
    const ROW_H = armament?46:36, LIST_TOP = 56, LIST_BOT = ch - (armament?44:28);
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
      const ax = cw/2 - 410, ay = LIST_TOP + visIdx*ROW_H, aw = 820, ah = armament?40:30;
      const dim = act.disabled;
      if(!dim && !act._header) canvasMenuTarget(ax,ay,aw,ah,()=>{ b.subSel=i; handleStationKey('Enter'); });
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
      if(sel && !dim){ ctx.fillStyle=bldg.col; ctx.font='bold 12px Courier New'; ctx.textAlign='left'; ctx.fillText('▶', ax+6, ay+(armament?16:19)); }
      // Label
      ctx.font='bold 13px Courier New';
      ctx.fillStyle = dim ? '#333344' : sel ? '#ffffff' : '#cccccc';
      ctx.textAlign='left'; ctx.fillText(act.label, ax+20, ay+(armament?16:19),armament?aw-40:aw);
      // Armament descriptions get their own aligned line, leaving room for long weapon names.
      ctx.font='11px Courier New';
      ctx.fillStyle = armament?(dim?'#526070':sel?'#889aaa':'#65788b'):(dim?'#222233':sel?'#889aaa':'#445566');
      ctx.textAlign=armament?'left':'right';
      ctx.fillText(act.detail,armament?ax+20:ax+aw-8,ay+(armament?32:19),armament?aw-40:aw);
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
      canvasMenuTarget(ax,ay,aw,ah,()=>{ b.recruitSel=i; renderAll(); });
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
    if(canAfford) canvasMenuTarget(cx-250,listTop+HIRE_ROLES.length*rowH,500,22,()=>handleStationKey('Enter'));

  } else if(b.screen === 'installweapon'){
    drawHangarWeaponPicker(b,cw,ch);
  } else if(b.screen === 'changehull'){
    drawHullShipyard(b,cw,ch);
  }

  canvasMenuButton(b.screen==='main'?'Undock [Esc]':'Back [Esc]',40,ch-27,back);
  ctx.textAlign='left';
}


function handleStationKey(key){
  const b = G.base;
  // Retirement confirm screen
  if(b.confirm==='retire'){
    if(key==='Enter'||key===' '){
      b.confirm='retire_story';
      // Pick a random story variant now and lock it so redraws stay consistent
      const _tier = RETIREMENT_TIERS.find(t=>G.credits>=t.min&&G.credits<=t.max)||RETIREMENT_TIERS[0];
      G.retirementStoryIdx     = Math.floor(Math.random() * _tier.story.length);
      const _picked = _tier.story[G.retirementStoryIdx];
      G.retirementNoEpilogue  = !!(_picked && _picked.noEpilogue);
      G.retirementEpilogueIdx = Math.floor(Math.random() * RETIREMENT_EPILOGUES.length);
      // DEAD — pre-roll humanity arc indices ready for when the screen is wired in
      G.retirementHumanityIdx      = Math.floor(Math.random() * HUMANITY_OUTCOMES.length);
      G.retirementHumanityCodaIdx  = Math.floor(Math.random() * HUMANITY_CODAS_ALIVE.length);
      renderAll(); return;
    }
    if(key==='Escape'){ b.confirm=null; renderAll(); return; }
    return;
  }
  // Retirement story screen — press Enter to proceed to stats
  if(b.confirm==='retire_story'){
    if(key==='Enter'||key===' '){ G.retired=true; renderAll(); return; }
    return;
  }
  if(b.screen==='main'){
    if(key==='ArrowUp'){   b.sel=Math.max(0,b.sel-1); renderAll(); return; }
    if(key==='ArrowDown'){ b.sel=Math.min(STATION_BUILDINGS.length-1,b.sel+1); renderAll(); return; }
    if(key==='Enter'){ b.screen='sub'; b.subSel=0; b.subScroll=0; b.medbaySub=null; b.scienceCorpSub=false; renderAll(); return; }
    if(key==='Escape'){ G.mode='galaxy'; addLog('Undocked.','li'); renderAll(); return; }
  } else if(b.screen==='recruit'){
    const HIRE_COUNT = 6;
    if(key==='ArrowUp'){   b.recruitSel=Math.max(0,(b.recruitSel||0)-1); renderAll(); return; }
    if(key==='ArrowDown'){ b.recruitSel=Math.min(HIRE_COUNT-1,(b.recruitSel||0)+1); renderAll(); return; }
    if(key==='Enter'){ executeBaseAction('recruit_confirm'); renderAll(); return; }
    if(key==='Escape'){ b.screen='sub'; renderAll(); return; }
  } else if(b.screen==='installweapon'){
    const weapons3 = Object.values(SHIP_WEAPONS);
    if(key==='ArrowUp'){   b.weaponSel=Math.max(0,(b.weaponSel||0)-1); renderAll(); return; }
    if(key==='ArrowDown'){ b.weaponSel=Math.min(weapons3.length-1,(b.weaponSel||0)+1); renderAll(); return; }
    if(key==='Enter'){ executeBaseAction('confirminstall'); renderAll(); return; }
    if(key==='Escape'){ b.screen='sub'; renderAll(); return; }
  } else if(b.screen==='changehull'){
    const ids=hangarHullIds();
    const deltas={ArrowLeft:-1,ArrowUp:-1,ArrowRight:1,ArrowDown:1,PageUp:-4,PageDown:4};
    if(key in deltas){selectHullForPurchase(Math.max(0,Math.min(ids.length-1,(b.hullSel||0)+deltas[key])));return;}
    if(key==='Enter'){executeBaseAction('confirmhull');renderAll();return;}
    if(key==='Escape'){b.hullQuoteKey=null;b.screen='sub';renderAll();return;}
  } else if(b.screen==='sub'){
    const actions = STATION_BUILDINGS[b.sel].actions();
    // Skip over header rows and disabled rows when navigating
    function subStep(dir){
      let next = b.subSel + dir;
      while(next >= 0 && next < actions.length && (actions[next]._header || actions[next].disabled)){
        next += dir;
      }
      if(next >= 0 && next < actions.length) b.subSel = next;
    }
    if(key==='ArrowUp'){   subStep(-1); renderAll(); return; }
    if(key==='ArrowDown'){ subStep(1);  renderAll(); return; }
    if(key==='Enter'){
      const act = actions[b.subSel];
      if(act && !act.disabled && !act._header) executeBaseAction(act.id);
      return;
    }
    if(key==='Escape'){
      if(b.medbaySub === 'vend'){
        b.medbaySub = null;
        b.subSel = 0;
        b.subScroll = 0;
        renderAll(); return;
      }
      b.screen='main'; b.subScroll=0; b.medbaySub=null; b.scienceCorpSub=false; if(b.hangarSub) b.hangarSub='top'; renderAll(); return;
    }
  }
  return;
}
