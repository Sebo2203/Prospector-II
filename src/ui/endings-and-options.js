function drawRetirementScreen(){
  const cw=canvas.width, ch=canvas.height;
  const tier = RETIREMENT_TIERS.find(t=>G.credits>=t.min&&G.credits<=t.max)||RETIREMENT_TIERS[0];

  // Background
  ctx.fillStyle='rgba(0,10,30,0.97)'; ctx.fillRect(0,0,cw,ch);
  ctx.fillStyle='#001830'; ctx.fillRect(0,0,cw,6);
  ctx.fillStyle='#003060'; ctx.fillRect(0,6,cw,2);

  const cx = cw/2;
  ctx.textAlign='center';

  // Header
  ctx.font='bold 31px Courier New'; ctx.fillStyle=tier.col;
  ctx.fillText('— CAREER RECORD —', cx, 56);
  ctx.font='bold 18px Courier New'; ctx.fillStyle='#aaaacc';
  ctx.fillText(tier.title, cx, 80);
  ctx.fillStyle='#112233'; ctx.fillRect(cx-300, 92, 600, 1);

  // Captain name + ship
  const ss = G.shipStats || {};
  const captainLine = (G.captainName||'Unknown Captain') + '  ·  ' + (ss.hullType||'Unknown Vessel') + (G.shipName ? '  "'+G.shipName+'"' : '');
  ctx.font='15px Courier New'; ctx.fillStyle='#556677';
  ctx.fillText(captainLine, cx, 112);

  ctx.fillStyle='#112233'; ctx.fillRect(cx-300, 124, 600, 1);

  // Stats table — two columns
  const stats = [
    ['Credits Saved',     G.credits+' cr',                         tier.col],
    ['Credits Earned',    (G.creditsEarned||G.credits)+' cr',      '#ffe066'],
    ['Career Length',     G.turn+' turns',                         '#aaccee'],
    ['Systems Visited',   Object.keys(G.planets||{}).length,       '#70d8ff'],
    ['Planets Scanned',   G.planetsScanned||0,                     '#70d8ff'],
    ['Crew Survived',     G.crew.filter(c=>c.hp>0).length+' / '+(G.crewHired||G.crew.length), '#70f090'],
    ['Pirates Defeated',  (G.pirates||[]).filter(p=>!p.alive).length, '#ff8866'],
    ['Fuel Spent',        (G.fuelSpent||0)+' units',               '#ddaa33'],
    ['Combats Fought',    G.combatsFought||0,                      '#ffcc44'],
  ];

  const col1x = cx-290, col2x = cx+20;
  const half = Math.ceil(stats.length/2);
  const rowH = 24;
  const tableY = 144;

  stats.forEach((s, i)=>{
    const isRight = i >= half;
    const lx = isRight ? col2x     : col1x;
    const vx = isRight ? col2x+220 : col1x+220;
    const ry = tableY + (i % half) * rowH;
    ctx.font='13px Courier New'; ctx.fillStyle='#334455'; ctx.textAlign='right';
    ctx.fillText(s[0], vx-4, ry);
    ctx.font='bold 14px Courier New'; ctx.fillStyle=s[2]||'#aaccee'; ctx.textAlign='left';
    ctx.fillText(s[1], vx+4, ry);
  });

  // Divider below stats
  const divY = tableY + half * rowH + 10;
  ctx.fillStyle='#112233'; ctx.fillRect(cx-300, divY, 600, 1);

  // Grade / medal line
  const gradeMap = [
    [20000, 'LEGEND',           '★★★★★'],
    [10000, 'PROSPECTOR\'S DREAM','★★★★☆'],
    [ 6000, 'GOOD LIFE',        '★★★☆☆'],
    [ 3000, 'COMFORTABLE',      '★★☆☆☆'],
    [ 1000, 'MODEST',           '★☆☆☆☆'],
    [    0, 'BROKE',            '☆☆☆☆☆'],
  ];
  const grade = gradeMap.find(g=>G.credits>=g[0]);
  ctx.font='bold 20px Courier New'; ctx.fillStyle=tier.col; ctx.textAlign='center';
  ctx.fillText(grade[2]+'  '+grade[1], cx, divY+28);

  ctx.fillStyle='#112233'; ctx.fillRect(cx-300, divY+38, 600, 1);

  ctx.font='bold 15px Courier New'; ctx.fillStyle='#ffe066';
  ctx.fillText('[ ENTER  or  SPACE ]  →  Main Menu', cx, ch-30);
  ctx.textAlign='left';
}

function drawInGameOptions(){
  const cw=canvas.width, ch=canvas.height;
  ctx.fillStyle='rgba(0,0,0,0.88)'; ctx.fillRect(0,0,cw,ch);
  const cx=cw/2;
  if(G._kbScreen){
    drawKeybindingsScreen(cx);
  } else {
    drawOptionsScreen(cx);
    ctx.fillStyle='rgba(0,0,0,0.92)';
    ctx.fillRect(cx-300, ch-60, 600, 50);
    ctx.font='14px Courier New'; ctx.fillStyle='#334455'; ctx.textAlign='center';
    ctx.fillText('Up/Down select   Left/Right change   Enter activate',cx,ch-36);
    ctx.fillText('F feedback   ESC close options',cx,ch-18);
    ctx.textAlign='left';
  }
}

function drawGameOverOverlay(){
  const cw=canvas.width, ch=canvas.height;
  const isJailed = !!G.jailed;

  // ── Special screen: C4 destroyed the ship, crew stranded on a planet ─────
  if(typeof G.deathCause === 'string' && G.deathCause.startsWith('__C4_STRANDED__')){
    const _planet = G.deathCause.slice('__C4_STRANDED__'.length);
    ctx.fillStyle='rgba(14,6,0,0.96)'; ctx.fillRect(0,0,cw,ch);
    for(let _yy=0;_yy<ch;_yy+=3){ ctx.fillStyle='rgba(0,0,0,0.15)'; ctx.fillRect(0,_yy,cw,1); }
    ctx.fillStyle='#1c0800'; ctx.fillRect(0,0,cw,6);
    ctx.fillStyle='#4a1400'; ctx.fillRect(0,6,cw,2);
    ctx.textAlign='center';
    ctx.font='bold 29px Courier New';
    ctx.fillStyle='#cc3300';
    ctx.fillText('— STRANDED —', cw/2, 62);
    ctx.font='12px Courier New';
    ctx.fillStyle='#4a1800';
    ctx.fillText('NO SIGNAL  ·  NO RESCUE  ·  NO WAY HOME', cw/2, 84);
    ctx.fillStyle='#2a1000'; ctx.fillRect(cw/2-220,96,440,1);
    const _flavour = [
      'The blast catches the ship square in the fuel cells.',
      'A column of fire where your ride home used to be.',
      '',
      _planet ? 'The crew is marooned on '+_planet+'.' : 'The crew is marooned.',
      '',
      'Suit reserves tick down. No beacon. No distress ping.',
      'The stars look different when you know',
      'none of them are coming for you.',
    ];
    let _fy=112; ctx.font='14px Courier New';
    for(const _fl of _flavour){
      if(!_fl){ _fy+=8; continue; }
      ctx.fillStyle = _fl.startsWith('The crew') ? '#cc6633' : '#774422';
      ctx.fillText(_fl,cw/2,_fy); _fy+=20;
    }
    ctx.fillStyle='#2a1000'; ctx.fillRect(cw/2-200,_fy+6,400,1);
    const _sy=_fy+22; ctx.font='14px Courier New';
    [['Turns survived',G.turn],['Credits earned',G.credits],['Planets visited',Object.keys(G.planets).length]].forEach((_s,_i)=>{
      ctx.fillStyle='#3a1a08'; ctx.textAlign='right'; ctx.fillText(_s[0],cw/2+10,_sy+_i*20);
      ctx.fillStyle='#996644'; ctx.textAlign='left';  ctx.fillText(_s[1],cw/2+20,_sy+_i*20);
    });
    ctx.textAlign='center';
    ctx.font='bold 15px Courier New'; ctx.fillStyle='#ffe066';
    ctx.fillText('[ ENTER  or  SPACE ]  →  Main Menu',cw/2,ch-30);
    ctx.textAlign='left';
    return;
  }
  // ─────────────────────────────────────────────────────────────────────────

  // Background tint — dark blue-grey for jail, dark red for death
  ctx.fillStyle = isJailed ? 'rgba(0,5,20,0.94)' : 'rgba(30,0,0,0.92)';
  ctx.fillRect(0,0,cw,ch);

  // Top bar
  ctx.fillStyle = isJailed ? '#001030' : '#3a0000';
  ctx.fillRect(0,0,cw,6);
  ctx.fillStyle = isJailed ? '#002266' : '#660000';
  ctx.fillRect(0,6,cw,2);

  ctx.textAlign='center';

  // Title
  ctx.font='bold 31px Courier New';
  ctx.fillStyle = isJailed ? '#4466cc' : '#cc2222';
  ctx.fillText(isJailed ? '— ARRESTED —' : '— MISSION FAILED —', cw/2, 70);

  // Flavour line for jail
  if(isJailed){
    ctx.font='15px Courier New';
    ctx.fillStyle='#334488';
    ctx.fillText('STATION DETENTION AUTHORITY  ·  CASE FILE SEALED', cw/2, 95);
  }

  // Cause
  ctx.font='18px Courier New';
  ctx.fillStyle = isJailed ? '#8899cc' : '#cc8888';
  const cause = G.deathCause || (isJailed ? 'You were taken into custody.' : 'The mission ended in failure.');
  const words=cause.split(' ');
  let line='', lines=[], maxW=60;
  for(const w of words){
    if((line+w).length>maxW){ lines.push(line.trim()); line=''; }
    line+=w+' ';
  }
  if(line.trim()) lines.push(line.trim());
  const causeStartY = isJailed ? 120 : 110;
  lines.forEach((l,i)=> ctx.fillText(l, cw/2, causeStartY+i*22));

  // Divider
  ctx.fillStyle = isJailed ? '#001a44' : '#330000';
  ctx.fillRect(cw/2-200, causeStartY+lines.length*22+10, 400, 1);

  // Stats
  const sy = causeStartY+lines.length*22+30;
  ctx.font='16px Courier New';
  const stats=[
    ['Turns survived',  G.turn],
    ['Credits earned',  G.credits],
    ['Crew lost',       3-G.crew.length],
    ['Planets visited', Object.keys(G.planets).length],
    ['Items collected', (G.inventory.length + G.log.filter(l=>l.cls==='ll').length)],
  ];
  stats.forEach((s,i)=>{
    ctx.fillStyle = isJailed ? '#445577' : '#665555';
    ctx.textAlign='right';
    ctx.fillText(s[0], cw/2+10, sy+i*24);
    ctx.fillStyle = isJailed ? '#99aadd' : '#cc9988';
    ctx.textAlign='left';
    ctx.fillText(s[1], cw/2+20, sy+i*24);
  });

  // Prompt
  ctx.textAlign='center';
  ctx.font='bold 16px Courier New';
  ctx.fillStyle='#ffe066';
  ctx.fillText('[ ENTER  or  SPACE ]  →  Main Menu', cw/2, ch-30);

  ctx.textAlign='left';
}

