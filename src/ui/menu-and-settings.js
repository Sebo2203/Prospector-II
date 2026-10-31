// ─────────────────────────────────────────────────────────────────
//  MAIN MENU
// ─────────────────────────────────────────────────────────────────
let MENU_STATE = { hasAutosave: false, screen: 'main' }; // screen: 'main'|'options'

// ── Options (persisted to localStorage) ─────────────────────────
const OPT_KEY = 'prospector_options';


// Human-readable label for a e.code string
function codeLabel(code){
  if(!code) return '?';
  if(code==='Space') return 'SPC';
  if(code.startsWith('Key')) return code.slice(3);
  if(code.startsWith('Digit')) return code.slice(5);
  if(code.startsWith('Numpad')) return 'NP'+code.slice(6);
  if(code==='ArrowUp') return '↑';
  if(code==='ArrowDown') return '↓';
  if(code==='ArrowLeft') return '←';
  if(code==='ArrowRight') return '→';
  return code.replace(/^(Key|Digit)/,'').slice(0,5);
}

function loadOptions(){
  try {
    const raw = localStorage.getItem(OPT_KEY);
    if(raw){
      const parsed = JSON.parse(raw);
      // Migrate: ensure keybinds exist
      if(!parsed.keybinds) parsed.keybinds = Object.assign({}, DEFAULT_KEYBINDS);
      return parsed;
    }
  } catch(e){}
  return { asciiMode: false, keybinds: Object.assign({}, DEFAULT_KEYBINDS) };
}
function saveOptions(opts){
  try { localStorage.setItem(OPT_KEY, JSON.stringify(opts)); } catch(e){}
}
let OPTIONS = loadOptions();

function setMenuCanvasMode(){
  const main = document.getElementById('main');
  const wrap = document.getElementById('canvas-wrap');
  if(main){
    main.style.height = '720px';
    main.style.minHeight = '720px';
    main.style.maxHeight = '720px';
  }
  if(wrap){
    wrap.style.width = '1400px';
    wrap.style.height = '720px';
    wrap.style.minWidth = '1400px';
    wrap.style.minHeight = '720px';
    wrap.style.maxWidth = '1400px';
    wrap.style.maxHeight = '720px';
  }
  canvas.width = 1400;
  canvas.height = 720;
  canvas.style.width = '1400px';
  canvas.style.height = '720px';
  canvas.style.top = '0';
  canvas.style.left = '0';
}

function setGameCanvasMode(){
  const main = document.getElementById('main');
  const wrap = document.getElementById('canvas-wrap');
  if(main){
    main.style.height = '';
    main.style.minHeight = '';
    main.style.maxHeight = '';
  }
  if(wrap){
    wrap.style.width = '';
    wrap.style.height = '';
    wrap.style.minWidth = '';
    wrap.style.minHeight = '';
    wrap.style.maxWidth = '';
    wrap.style.maxHeight = '';
  }
  canvas.width = VIEW_W * TS;
  canvas.height = VIEW_H * TS;
  canvas.style.width = '';
  canvas.style.height = '';
  canvas.style.top = '';
  canvas.style.left = '';
}

function showMenu(){
  setMenuCanvasMode();
  MENU_STATE.hasAutosave = hasSave();
  MENU_STATE.screen = 'main';
  MENU_STATE.optSel = 0;
  MENU_STATE.mainSel = 0;
  G = null;
  // Hide all game UI — only canvas visible
  document.getElementById('hud').style.display         = 'none';
  document.getElementById('gauge-panel').style.display = 'none';
  document.getElementById('sidebar').style.display     = 'none';
  document.getElementById('msg-bar').style.display     = 'none';
  document.getElementById('ctx-bar').style.display     = 'none';
  document.getElementById('persist-bar').style.display = 'none';
  document.getElementById('version-tag').style.display = 'none';
  hideMsg();
  document.getElementById('ctx-bar').innerHTML = '';
  drawMenuScreen();
  // Fetch last commit time from GitHub (only once per session)
  if(MENU_STATE.lastUpdateText === undefined){
    MENU_STATE.lastUpdateText = null; // null = loading
    fetch('https://api.github.com/repos/sebo2203/Prospector-II/commits?per_page=1', {
      headers: { 'Accept': 'application/vnd.github.v3+json' }
    })
      .then(r => r.json())
      .then(data => {
        if(!Array.isArray(data) || !data[0]) { MENU_STATE.lastUpdateText = 'Update info unavailable'; drawMenuScreen(); return; }
        const date = new Date(data[0]?.commit?.committer?.date);
        if(isNaN(date)) { MENU_STATE.lastUpdateText = 'Update info unavailable'; drawMenuScreen(); return; }
        const diff = Date.now() - date.getTime();
        const mins  = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days  = Math.floor(diff / 86400000);
        if(mins < 60)       MENU_STATE.lastUpdateText = 'Last update: '+mins+' minute'+(mins!==1?'s':'')+' ago';
        else if(hours < 24) MENU_STATE.lastUpdateText = 'Last update: '+hours+' hour'+(hours!==1?'s':'')+' ago';
        else                MENU_STATE.lastUpdateText = 'Last update: '+days+' day'+(days!==1?'s':'')+' ago';
        drawMenuScreen();
      })
      .catch(err => { MENU_STATE.lastUpdateText = 'Update info unavailable'; drawMenuScreen(); });
  }
}

function restoreGameUI(){
  setGameCanvasMode();
  document.getElementById('hud').style.display         = '';
  document.getElementById('gauge-panel').style.display = '';
  document.getElementById('sidebar').style.display     = '';
  document.getElementById('msg-bar').style.display     = '';
  document.getElementById('ctx-bar').style.display     = '';
  document.getElementById('persist-bar').style.display = '';
  document.getElementById('version-tag').style.display = '';
}

function returnToMainMenuFromGame(){
  if(G && !G.dead && !G.retired) autoSave();
  showMenu();
}

function drawMenuScreen(){
  ctx.fillStyle='#050510';
  ctx.fillRect(0,0,canvas.width,canvas.height);
  // Starfield
  for(let i=0;i<120;i++){
    const sx=(Math.sin(i*137.5)*0.5+0.5)*canvas.width;
    const sy=(Math.cos(i*97.3)*0.5+0.5)*canvas.height;
    ctx.globalAlpha=0.3+((i*73)%100)/200;
    ctx.fillStyle='#ffffff';
    ctx.fillRect(sx,sy,i%3===0?2:1,i%3===0?2:1);
  }
  ctx.globalAlpha=1;
  const cx=canvas.width/2;

  if(MENU_STATE.screen==='options'){
    drawOptionsScreen(cx);
    return;
  }

  if(MENU_STATE.screen==='keybindings'){
    drawKeybindingsScreen(cx);
    return;
  }

  if(MENU_STATE.screen==='changelog'){
    drawChangelogScreen(cx);
    return;
  }

  if(MENU_STATE.screen==='credits'){
    drawCreditsScreen(cx);
    return;
  }

  if(MENU_STATE.screen==='intro'){
    const cy = canvas.height/2;
    const lines = [
      'An unexplored sector of the galaxy.',
      '',
      'You are a private Prospector.',
      'You can earn money by mapping planets',
      'and finding resources.',
      '',
      'Your goal is to make sure you can live out',
      'your life in comfort in your retirement.',
      '',
      'But beware of alien lifeforms and pirates.',
      'Choose your vessel and begin your career.',
      '',
      'You will use your keyboard keys to do various actions.',
      'Always check the context bar for hints.',
    ];
    const lineH = 26;
    const totalH = lines.length * lineH;
    let y = cy - totalH/2 + 10;
    ctx.textAlign = 'center';
    lines.forEach(line => {
      if(line === ''){ y += lineH * 0.5; return; }
      ctx.font = '16px Courier New';
      ctx.fillStyle = '#aaccee';
      ctx.fillText(line, cx, y);
      y += lineH;
    });
    ctx.font = 'bold 14px Courier New';
    ctx.fillStyle = '#ffe066';
    ctx.fillText('[ PRESS ENTER TO BEGIN ]', cx, cy + totalH/2 + 40);
    return;
  }

  if(MENU_STATE.screen==='ship_select'){
    const ships = [
      { id:'LIGHT_SCOUT',    label:'Light Scout',    col:'#70d8ff', sprite:'player_ship',
        lines:['Fast and nimble. Excellent sensors.','Minimal cargo. Built for exploration.','Small crew. One weapon slot.'] },
      { id:'BULK_FREIGHTER', label:'Bulk Freighter',  col:'#ffdd88', sprite:'ship_freighter',
        lines:['Heavy hauler. Massive cargo hold.','Slow with poor sensors. No weapons.','Large crew capacity. Multiple module slots.'] },
      { id:'ATTACK_CORVETTE',label:'Attack Corvette', col:'#ff8866', sprite:'ship_corvette',
        lines:['Built for combat. Fast engine.','Dual weapons and shield capable.','Limited cargo. Aggressive loadout.'] },
    ];
    const sel = MENU_STATE.shipSel || 0;

    ctx.font='bold 24px Courier New'; ctx.fillStyle='#aaccee'; ctx.textAlign='center';
    ctx.fillText('CHOOSE YOUR VESSEL', cx, 56);
    ctx.fillStyle='#223344'; ctx.fillRect(cx-340,68,680,1);

    const cardW=290, cardH=210, cardGap=20;
    const totalW = ships.length*cardW + (ships.length-1)*cardGap;
    const startX = cx - totalW/2;

    ships.forEach((s,i)=>{
      const isSel = i===sel;
      const bx=startX+i*(cardW+cardGap), by=78;
      ctx.fillStyle = isSel ? '#0e1a2e' : '#080810';
      ctx.fillRect(bx,by,cardW,cardH);
      ctx.strokeStyle = isSel ? s.col : '#2a2a4a';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.strokeRect(bx,by,cardW,cardH);

      // Sprite — draw centered, scaled up 3x (72px) from 24px tile
      const spriteImg = IMG[s.sprite];
      if(spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0){
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(spriteImg, bx+cardW/2-36, by+14, 72, 72);
      } else {
        ctx.font='bold 44px Courier New'; ctx.fillStyle=s.col; ctx.textAlign='center';
        ctx.fillText('?', bx+cardW/2, by+56);
      }

      // Label
      ctx.font='bold 17px Courier New'; ctx.fillStyle= isSel ? '#ffffff' : s.col;
      ctx.fillText(s.label, bx+cardW/2, by+84);

      // Divider
      ctx.fillStyle=s.col+'44'; ctx.fillRect(bx+20, by+94, cardW-40, 1);

      // Description lines
      ctx.font='13px Courier New'; ctx.fillStyle= isSel ? '#99bbcc' : '#445566';
      s.lines.forEach((l,li)=> ctx.fillText(l, bx+cardW/2, by+114+li*22));

      if(isSel){
        ctx.font='bold 13px Courier New'; ctx.fillStyle='#ffe066';
        ctx.fillText('[ ENTER to select ]', bx+cardW/2, by+cardH-12);
      }
    });

    ctx.font='13px Courier New'; ctx.fillStyle='#334455'; ctx.textAlign='center';
    ctx.fillText('←/→ navigate    Enter confirm', cx, 78+cardH+22);
    return;
  }

  if(MENU_STATE.screen==='naming'){
    const field = MENU_STATE.namingField || 'captain';
    const capName  = MENU_STATE.captainName || '';
    const shipName = MENU_STATE.shipName    || '';
    const cls = SHIP_CLASSES[MENU_STATE.chosenClass] || SHIP_CLASSES.LIGHT_SCOUT;

    ctx.font='bold 20px Courier New'; ctx.fillStyle='#aaccee'; ctx.textAlign='center';
    ctx.fillText('REGISTER YOUR VESSEL', cx, 80);
    ctx.fillStyle='#223344'; ctx.fillRect(cx-280,96,560,1);

    // Chosen ship summary
    ctx.font='14px Courier New'; ctx.fillStyle='#556677';
    ctx.fillText('Hull type: '+cls.hullType, cx, 120);

    function drawField(label, value, active, y){
      ctx.textAlign='left';
      ctx.font='13px Courier New'; ctx.fillStyle= active ? '#aaccee' : '#445566';
      ctx.fillText(label, cx-240, y);
      const bx=cx-240, bw=480, bh=34;
      ctx.fillStyle = active ? '#0e1a2e' : '#080810';
      ctx.fillRect(bx, y+8, bw, bh);
      ctx.strokeStyle = active ? '#ffe066' : '#2a2a4a';
      ctx.lineWidth = active ? 2 : 1;
      ctx.strokeRect(bx, y+8, bw, bh);
      ctx.font='bold 16px Courier New';
      ctx.fillStyle = active ? '#ffffff' : '#667788';
      ctx.fillText(value + (active ? '█' : ''), bx+12, y+31);
      ctx.textAlign='center';
    }

    drawField('Captain name:', capName,  field==='captain', 148);
    drawField('Ship name:',    shipName, field==='ship',    220);

    // Hint
    ctx.font='13px Courier New'; ctx.fillStyle='#334455'; ctx.textAlign='center';
    const hint = field==='captain'
      ? 'Type your captain\'s name, then press Enter'
      : 'Christen your ship, then press Enter to launch';
    ctx.fillText(hint, cx, 300);
    return;
  }

  // Title
  ctx.font='bold 39px Courier New'; ctx.fillStyle='#ffe066'; ctx.textAlign='center';
  ctx.fillText('PROSPECTOR II',cx,100);
  ctx.font='17px Courier New'; ctx.fillStyle='#557799';
  ctx.fillText('A  R O G U E L I K E  I N  S P A C E',cx,130);
  ctx.fillStyle='#223344'; ctx.fillRect(cx-200,148,400,1);

  const opts=[];
  if(MENU_STATE.hasAutosave) opts.push({key:'C', label:'Continue', col:'#70d8ff'});
  opts.push({key:'N', label:'New Game',       col:'#70f090'});
  opts.push({key:'L', label:'Load Save File', col:'#aaaaff'});
  opts.push({key:'O', label:'Options',        col:'#ffaa44'});
  opts.push({key:'V', label:'Change Log',     col:'#aa88ff'});
  opts.push({key:'X', label:'Credits',        col:'#ffdd88'});

  opts.push({key:'Q', label:'Quit',           col:'#ff7777'});

  // Clamp selection in case Continue disappeared
  if(MENU_STATE.mainSel===undefined) MENU_STATE.mainSel=0;
  MENU_STATE.mainSel = Math.min(MENU_STATE.mainSel, opts.length-1);

  ctx.font='bold 19px Courier New';
  const _menuBtnRects = [];
  opts.forEach((o,i)=>{
    const sel = i===MENU_STATE.mainSel;
    const btnW = 420;
    const btnH = 38;
    const gapY = 12;
    const x = cx - btnW/2;
    const y = 178 + i * (btnH + gapY);
    _menuBtnRects.push({i, x, y, w:btnW, h:btnH});
    ctx.fillStyle= sel ? '#14142a' : '#0e0e1a';
    ctx.fillRect(x,y,btnW,btnH);
    ctx.strokeStyle= sel ? '#6655cc' : '#2a2a4a';
    ctx.lineWidth= sel ? 2 : 1;
    ctx.strokeRect(x,y,btnW,btnH);
    // Cursor arrow
    ctx.fillStyle= sel ? '#ffe066' : 'transparent';
    ctx.textAlign='left';
    if(sel) ctx.fillText('▶', x+10, y+25);
    ctx.fillStyle= sel ? '#ffffff' : '#cccccc';
    ctx.fillText(o.label, x+36, y+25);
    ctx.textAlign='right';
    ctx.fillStyle= sel ? o.col : '#445566';
    ctx.fillText('['+o.key+']', x+btnW-14, y+25);
    ctx.textAlign='left';
  });
  MENU_STATE._btnRects = _menuBtnRects;
  MENU_STATE._opts = opts;

  ctx.font='14px Courier New'; ctx.fillStyle='#334455'; ctx.textAlign='center';
  ctx.fillText('v0.26  —  Made by Sebastian', cx, canvas.height-28);
  // Show seed hash if a save exists
  if(MENU_STATE.hasAutosave){
    try {
      const _saveRaw = localStorage.getItem(SAVE_KEY);
      const _saveSeed = _saveRaw ? JSON.parse(_saveRaw).seed : null;
      if(_saveSeed){
        ctx.font='12px Courier New'; ctx.fillStyle='#223344';
        ctx.fillText('seed: #'+_saveSeed, cx, canvas.height-44);
      }
    } catch(e){}
  }
  if(MENU_STATE.lastUpdateText !== null && MENU_STATE.lastUpdateText !== undefined){
    ctx.fillStyle = MENU_STATE.lastUpdateText.startsWith('Last update') ? '#2a4a3a' : '#3a3a2a';
    ctx.font='13px Courier New';
    ctx.fillText(MENU_STATE.lastUpdateText, cx, canvas.height-12);
  } else if(MENU_STATE.lastUpdateText === null){
    ctx.fillStyle='#223333'; ctx.font='13px Courier New';
    ctx.fillText('Checking for updates...', cx, canvas.height-12);
  }
  if(shouldShowDesktopDownload()){
    const _dlBtnW = 240, _dlBtnH = 34;
    const _dlX = 14, _dlY = canvas.height - 14 - _dlBtnH;
    ctx.fillStyle = '#0e0e1a';
    ctx.fillRect(_dlX, _dlY, _dlBtnW, _dlBtnH);
    ctx.strokeStyle = '#2a2a4a';
    ctx.lineWidth = 1;
    ctx.strokeRect(_dlX, _dlY, _dlBtnW, _dlBtnH);
    ctx.textAlign = 'left';
    ctx.font = 'bold 14px Courier New';
    ctx.fillStyle = '#cccccc';
    ctx.fillText('\u2b07 Download Desktop App', _dlX + 10, _dlY + 22);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#445566';
    ctx.fillText('[D]', _dlX + _dlBtnW - 10, _dlY + 22);
    ctx.textAlign = 'left';
    MENU_STATE._dlBtnRect = { x:_dlX, y:_dlY, w:_dlBtnW, h:_dlBtnH };
  } else {
    MENU_STATE._dlBtnRect = null;
  }
  ctx.textAlign='left';
}

function drawOptionsScreen(cx){
  const ch = canvas.height;
  ctx.font='bold 31px Courier New'; ctx.fillStyle='#cccccc'; ctx.textAlign='center';
  ctx.fillText('OPTIONS', cx, 90);
  ctx.fillStyle='#2a2a4a'; ctx.fillRect(cx-200, 106, 400, 1);

  // All rows: uniform 34px height, 14px gap = 48px per row
  const rowH=34, rowGap=14, rowW=400, startY=150;
  const rows=[
    { i:0, label:'Render Mode', right: OPTIONS.asciiMode ? 'ASCII' : 'SPRITES' },
    { i:1, label:'Movement Keybindings', right:'›' },
    { i:2, label:'Save Game',   right:'S' },
    { i:3, label:'Feedback',    right:'F' },
  ];

  MENU_STATE._optRects = [];
  MENU_STATE._saveBtnY = null;
  MENU_STATE._feedbackBtnY = null;
  MENU_STATE._kbEntryY = null;

  rows.forEach(row=>{
    const y = startY + row.i*(rowH+rowGap);
    const sel = MENU_STATE.optSel === row.i;
    MENU_STATE._optRects.push({ i:row.i, x:cx-rowW/2, y, w:rowW, h:rowH });
    if(row.i===2) MENU_STATE._saveBtnY = y;
    if(row.i===3) MENU_STATE._feedbackBtnY = y;
    if(row.i===1) MENU_STATE._kbEntryY = y;

    ctx.fillStyle = sel ? '#14142a' : '#0e0e1a';
    ctx.fillRect(cx-rowW/2, y, rowW, rowH);
    ctx.strokeStyle = sel ? '#6655cc' : '#2a2a4a';
    ctx.lineWidth = sel ? 2 : 1;
    ctx.strokeRect(cx-rowW/2, y, rowW, rowH);

    // ▶ cursor
    ctx.font='bold 19px Courier New'; ctx.textAlign='left';
    if(sel){ ctx.fillStyle='#ffe066'; ctx.fillText('▶', cx-rowW/2+8, y+rowH-8); }

    // Label
    ctx.fillStyle = sel ? '#ffffff' : '#cccccc';
    ctx.fillText(row.label, cx-rowW/2+32, y+rowH-8);

    // Right hint
    ctx.textAlign='right';
    ctx.fillStyle = sel ? '#ffe066' : '#445566';
    ctx.fillText(row.right, cx+rowW/2-12, y+rowH-8);
  });

  // Render Mode arrow hints below its row (only when selected)
  if(MENU_STATE.optSel===0){
    ctx.font='12px Courier New'; ctx.fillStyle='#445566'; ctx.textAlign='center';
    ctx.fillText('◄ / ► or Enter to toggle', cx, startY+rowH+8);
  }

  // Footer
  ctx.font='14px Courier New'; ctx.fillStyle='#334455'; ctx.textAlign='center';
  ctx.fillText('↑/↓ select    Enter activate    ESC back', cx, ch-16);
  ctx.textAlign='left';
}

function drawKeybindingsScreen(cx){
  const cw = canvas.width, ch = canvas.height;
  const kb = OPTIONS.keybinds || DEFAULT_KEYBINDS;
  const rebinding = MENU_STATE._rebinding;
  const sel = MENU_STATE._kbSel || 0;

  ctx.font='bold 28px Courier New'; ctx.fillStyle='#cccccc'; ctx.textAlign='center';
  ctx.fillText('MOVEMENT KEYBINDINGS', cx, 70);
  ctx.fillStyle='#2a2a4a'; ctx.fillRect(cx-280, 84, 560, 1);
  ctx.font='13px Courier New'; ctx.fillStyle='#445566'; ctx.textAlign='center';
  ctx.fillText('Physical key position — layout-independent. Arrows and Numpad always work.', cx, 102);

  // List of bindings in order
  const BIND_LIST = [
    { id:'nw',   label:'Move NW       (diagonal)' },
    { id:'n',    label:'Move N        (up)' },
    { id:'ne',   label:'Move NE       (diagonal)' },
    { id:'w',    label:'Move W        (left)' },
    { id:'e',    label:'Move E        (right)' },
    { id:'sw',   label:'Move SW       (diagonal)' },
    { id:'s',    label:'Move S        (down)' },
    { id:'se',   label:'Move SE       (diagonal)' },
    { id:'wait', label:'Wait / skip turn' },
  ];

  const rowH = 32, startY = 110, colLabel = cx-240, colKey = cx+120;
  MENU_STATE._kbRowRects = [];

  BIND_LIST.forEach((bind, i)=>{
    const y = startY + i*rowH;
    const isSel = sel === i;
    const isRebinding = rebinding === bind.id;

    ctx.fillStyle = isRebinding ? '#0e1e0e' : isSel ? '#14142a' : '#0e0e1a';
    ctx.fillRect(cx-260, y-2, 520, rowH-2);
    ctx.strokeStyle = isRebinding ? '#44ff88' : isSel ? '#6655cc' : '#2a2a4a';
    ctx.lineWidth = (isRebinding||isSel) ? 2 : 1;
    ctx.strokeRect(cx-260, y-2, 520, rowH-2);

    // Action label
    ctx.font = 'bold 19px Courier New';
    if(isSel && !isRebinding){ ctx.fillStyle='#ffe066'; ctx.textAlign='left'; ctx.fillText('▶', cx-260+8, y+22); }
    ctx.fillStyle = isRebinding ? '#44ff88' : isSel ? '#ffffff' : '#cccccc';
    ctx.textAlign = 'left';
    ctx.fillText(bind.label, cx-260+32, y+22);

    // Key label
    const hasConflict = !isRebinding && kb[bind.id] && KEYBIND_CONFLICTS[kb[bind.id]];
    const keyText = isRebinding ? '[ press a key... ]' : ('[ ' + codeLabel(kb[bind.id]) + ' ]');
    ctx.font = isRebinding ? '14px Courier New' : 'bold 19px Courier New';
    ctx.fillStyle = isRebinding ? '#44ff88' : hasConflict ? '#ffe066' : isSel ? '#ffe066' : '#445566';
    ctx.textAlign = 'right';
    ctx.fillText(keyText, cx+260-12, y+22);

    // Conflict indicator — "!" to the right of the row box
    if(hasConflict){
      ctx.font = 'bold 14px Courier New';
      ctx.fillStyle = '#ffe066';
      ctx.textAlign = 'left';
      ctx.fillText('!', cx+260+8, y+22);
    }

    MENU_STATE._kbRowRects.push({ i, id: bind.id, x: cx-260, y: y-2, w: 520, h: rowH-2 });
  });

  // Reset defaults row
  const resetY = startY + BIND_LIST.length*rowH + 10;
  const isResetSel = sel === BIND_LIST.length;
  ctx.fillStyle = isResetSel ? '#14142a' : '#0e0e1a';
  ctx.fillRect(cx-260, resetY, 520, 34);
  ctx.strokeStyle = isResetSel ? '#6655cc' : '#2a2a4a';
  ctx.lineWidth = isResetSel ? 2 : 1;
  ctx.strokeRect(cx-260, resetY, 520, 34);
  ctx.font='bold 19px Courier New';
  if(isResetSel){ ctx.fillStyle='#ffe066'; ctx.textAlign='left'; ctx.fillText('▶', cx-260+8, resetY+24); }
  ctx.fillStyle = isResetSel ? '#ffffff' : '#cccccc'; ctx.textAlign='left';
  ctx.fillText('Reset all to defaults', cx-260+32, resetY+24);
  MENU_STATE._kbResetRow = { y: resetY, h: 34 };

  ctx.font='13px Courier New'; ctx.fillStyle='#334455'; ctx.textAlign='center';
  ctx.fillText('↑/↓ navigate    Enter to remap    ESC back', cx, ch-16);
  ctx.textAlign='left';
}

function drawChangelogScreen(cx){
  ctx.font='bold 31px Courier New'; ctx.fillStyle='#aa88ff'; ctx.textAlign='center';
  ctx.fillText('CHANGE LOG',cx,70);
  ctx.fillStyle='#2a1a44'; ctx.fillRect(cx-280,88,560,1);

  // ── CHANGELOG ENTRIES — edit below, newest at top ──────────────
  const entries = [
    {
      version: 'v0.25',
      date: '2026',
      changes: [
        'Galaxy map expanded ~2.4× (west + south regions added)',
        'Galaxy minimap added to HUD — [M] opens full-screen overlay with legend',
        'Ship movement in galaxy view is now animated',
        'Underwater zones — dive from ocean tiles, explore with a diving suit',
        'Aquatic civilizations appear in underwater maps',
        'Casino fully playable — Void Poker, Arm Wrestle, Drinking Contest, Beast Arena',
        'New star names and crew names added for more varied runs',
      ]
    },
    {
      version: 'v0.2 (public)',
      date: '2026',
      changes: [
        'Initial public release',
        'Galaxy exploration, planet landing, crew & cargo systems',
        'Civilizations with first-contact dialogue and barter',
        'Ground combat and ship combat',
        'Special planets: Ringworld, Bloom, Nuclear War, Ancient Station',
        'Retirement / end-game narrative',
      ]
    },
  ];
  // ── END OF CHANGELOG ENTRIES ───────────────────────────────────

  const contentTop = 136;
  const contentBottom = canvas.height - 44;
  const viewH = contentBottom - contentTop;
  const contentH = entries.reduce((sum, entry) => sum + 26 + 10 + entry.changes.length * 22 + 14, 0);
  const maxScroll = Math.max(0, contentH - viewH);
  MENU_STATE.changelogScroll = Math.max(0, Math.min(MENU_STATE.changelogScroll || 0, maxScroll));
  MENU_STATE._changelogMaxScroll = maxScroll;

  ctx.save();
  ctx.beginPath();
  ctx.rect(cx-292, contentTop-26, 572, viewH+28);
  ctx.clip();

  let y = contentTop - MENU_STATE.changelogScroll;
  entries.forEach(entry => {
    ctx.font='bold 17px Courier New'; ctx.fillStyle='#aa88ff'; ctx.textAlign='left';
    ctx.fillText(entry.version+'  —  '+entry.date, cx-280, y);
    y += 26;
    ctx.fillStyle='#2a1a44'; ctx.fillRect(cx-280, y, 560, 1);
    y += 10;
    entry.changes.forEach(line => {
      ctx.font='15px Courier New'; ctx.fillStyle='#8899aa';
      ctx.fillText('›  '+line, cx-270, y);
      y += 22;
    });
    y += 14;
  });
  ctx.restore();

  if(maxScroll > 0){
    const trackX = cx + 304, trackY = contentTop - 4, trackH = viewH + 4;
    const thumbH = Math.max(28, Math.round(trackH * (viewH / contentH)));
    const thumbY = trackY + Math.round((trackH - thumbH) * (MENU_STATE.changelogScroll / maxScroll));
    ctx.fillStyle = '#0e0e1a'; ctx.fillRect(trackX, trackY, 5, trackH);
    ctx.fillStyle = '#3a2a66'; ctx.fillRect(trackX, thumbY, 5, thumbH);
  }

  ctx.font='14px Courier New'; ctx.fillStyle='#334455'; ctx.textAlign='center';
  ctx.fillText('[ ↑↓ / Wheel ]  Scroll    [ ESC ]  Back to main menu', cx, canvas.height-16);
  ctx.textAlign='left';
}

// ─────────────────────────────────────────────────────────────────
//  MENU KEY HANDLER
// ─────────────────────────────────────────────────────────────────
// ── Menu mouse click support ──────────────────────────────────
canvas.addEventListener('click', e => {
  if(G !== null && !(G.showOptions) && G.mode !== 'shipcombat' && !(G.mode==='inventory' && G._viewTab==='log')) return; // allow clicks for options, ship combat, and log tab filters

  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top)  * scaleY;

  // Log tab — filter button clicks
  if(G !== null && G.mode==='inventory' && G._viewTab==='log'){
    const FILTERS=['all','mission','combat','crew','critical'];
    const fBtnW=90, fBtnH=22, fBtnGap=6;
    const fTotalW=FILTERS.length*(fBtnW+fBtnGap)-fBtnGap;
    const fStartX=Math.round((canvas.width-fTotalW)/2);
    const fY=52;
    FILTERS.forEach((f,i)=>{
      const fx=fStartX+i*(fBtnW+fBtnGap);
      if(mx>=fx && mx<=fx+fBtnW && my>=fY && my<=fY+fBtnH){
        G._logFilter=f; G._logScroll=Infinity; renderAll();
      }
    });
    return;
  }

  // Ship combat — log font size buttons
  if(G !== null && G.mode === 'shipcombat' && G.shipCombat?._logFontBtnRects){
    const [btnMinus, btnPlus] = G.shipCombat._logFontBtnRects;
    const cur = G.shipCombat.logFontSize || 12;
    if(mx >= btnMinus.x && mx <= btnMinus.x+btnMinus.w && my >= btnMinus.y && my <= btnMinus.y+btnMinus.h){
      G.shipCombat.logFontSize = Math.max(9, cur - 1);
      renderAll(); return;
    }
    if(mx >= btnPlus.x && mx <= btnPlus.x+btnPlus.w && my >= btnPlus.y && my <= btnPlus.y+btnPlus.h){
      G.shipCombat.logFontSize = Math.min(16, cur + 1);
      renderAll(); return;
    }
    return; // swallow other clicks in combat so they don't fall through
  }

  // In-game options — feedback button click
  if(G !== null && G.showOptions){
    // Keybindings sub-screen click
    if(G._kbScreen){
      const BIND_LIST = ['nw','n','ne','w','e','sw','s','se','wait'];
      (MENU_STATE._kbRowRects||[]).forEach(r=>{
        if(mx>=r.x && mx<=r.x+r.w && my>=r.y && my<=r.y+r.h){
          MENU_STATE._kbSel = r.i;
          MENU_STATE._rebinding = r.id;
          renderAll();
        }
      });
      const rr = MENU_STATE._kbResetRow;
      if(rr && my>=rr.y && my<=rr.y+rr.h){
        OPTIONS.keybinds=Object.assign({},DEFAULT_KEYBINDS); saveOptions(OPTIONS); renderAll();
      }
      return;
    }
    let handled = false;
    (MENU_STATE._optArrowRects||[]).forEach(r => {
      if(mx >= r.x && mx <= r.x+r.w && my >= r.y && my <= r.y+r.h){
        MENU_STATE.optSel = 0;
        OPTIONS.asciiMode=!OPTIONS.asciiMode;
        saveOptions(OPTIONS);
        handled = true;
      }
    });
    (MENU_STATE._optRects||[]).forEach(r => {
      if(!handled && mx >= r.x && mx <= r.x+r.w && my >= r.y && my <= r.y+r.h){
        MENU_STATE.optSel = r.i;
        if(r.i===0){
          OPTIONS.asciiMode=!OPTIONS.asciiMode;
          saveOptions(OPTIONS);
        }
        handled = true;
      }
    });
    const saveY = MENU_STATE._saveBtnY;
    const fcx = canvas.width/2;
    if(saveY && mx >= fcx-220 && mx <= fcx+220 && my >= saveY && my <= saveY+40){
      MENU_STATE.optSel = 1;
      saveToFile();
      return;
    }
    const fbY = MENU_STATE._feedbackBtnY;
    if(fbY && mx >= fcx-220 && mx <= fcx+220 && my >= fbY && my <= fbY+40){
      MENU_STATE.optSel = 2;
      openFeedback();
      return;
    }
    if(handled) renderAll();
    return;
  }

  // Options screen — click to toggle item or open feedback
  if(MENU_STATE.screen === 'options'){
    let handled = false;
    (MENU_STATE._optArrowRects||[]).forEach(r => {
      if(mx >= r.x && mx <= r.x+r.w && my >= r.y && my <= r.y+r.h){
        MENU_STATE.optSel = 0;
        OPTIONS.asciiMode=!OPTIONS.asciiMode;
        saveOptions(OPTIONS);
        handled = true;
      }
    });
    (MENU_STATE._optRects||[]).forEach(r => {
      if(!handled && mx >= r.x && mx <= r.x+r.w && my >= r.y && my <= r.y+r.h){
        MENU_STATE.optSel = r.i;
        if(r.i===0){ OPTIONS.asciiMode=!OPTIONS.asciiMode; saveOptions(OPTIONS); }
        handled = true;
      }
    });
    const saveY = MENU_STATE._saveBtnY;
    const fcx = canvas.width/2;
    if(saveY && mx >= fcx-220 && mx <= fcx+220 && my >= saveY && my <= saveY+40){
      MENU_STATE.optSel = 1;
      saveToFile();
      return;
    }
    const fbY = MENU_STATE._feedbackBtnY;
    if(fbY && mx >= fcx-220 && mx <= fcx+220 && my >= fbY && my <= fbY+40){
      MENU_STATE.optSel = 2;
      openFeedback();
      return;
    }
    if(handled) drawMenuScreen();
    return;
  }

  // Credits screen — clickable link
  if(MENU_STATE.screen === 'credits' && MENU_STATE._linkY){
    const lx = MENU_STATE._linkX - MENU_STATE._linkW/2;
    const ly = MENU_STATE._linkY - 18;
    if(mx >= lx && mx <= lx + MENU_STATE._linkW && my >= ly && my <= ly + 24){
      window.open('http://prospector.at/', '_blank');
      return;
    }
  }

  if(MENU_STATE.screen !== 'main') return;
  if(!MENU_STATE._btnRects || !MENU_STATE._opts) return;

  // Corner download button hit-test
  if(MENU_STATE._dlBtnRect){
    const r = MENU_STATE._dlBtnRect;
    if(mx >= r.x && mx <= r.x+r.w && my >= r.y && my <= r.y+r.h){
      downloadDesktopApp(); return;
    }
  }

  // Build activate function (mirrors handleMenuKey logic)
  const mainOpts = [];
  if(MENU_STATE.hasAutosave) mainOpts.push('c');
  mainOpts.push('n');
  mainOpts.push('l');
  mainOpts.push('o');
  mainOpts.push('v');
  mainOpts.push('x');
  mainOpts.push('q');

  function activateMainOpt(sel){
    if(sel==='n'){ MENU_STATE.screen='intro'; MENU_STATE.introOpenedAt=Date.now(); MENU_STATE.introEntryKeyStillHeld=false; drawMenuScreen(); }
    else if(sel==='c'){ if(loadFromStorage()){ loadSprites().then(()=>{ restoreGameUI(); renderAll(); }); } else showMenu(); }
    else if(sel==='l'){ loadFromFile(); }
    else if(sel==='o'){ MENU_STATE.screen='options'; MENU_STATE.optSel=0; drawMenuScreen(); }
    else if(sel==='v'){ MENU_STATE.screen='changelog'; MENU_STATE.changelogScroll=0; drawMenuScreen(); }
    else if(sel==='x'){ MENU_STATE.screen='credits'; drawMenuScreen(); }
    else if(sel==='q'){ quitGame(); }
  }

  MENU_STATE._btnRects.forEach(btn => {
    if(mx >= btn.x && mx <= btn.x+btn.w && my >= btn.y && my <= btn.y+btn.h){
      MENU_STATE.mainSel = btn.i;
      activateMainOpt(mainOpts[btn.i]);
    }
  });
});

canvas.addEventListener('wheel', e => {
  if(MENU_STATE.screen !== 'changelog') return;
  const maxScroll = MENU_STATE._changelogMaxScroll || 0;
  if(maxScroll <= 0) return;
  e.preventDefault();
  MENU_STATE.changelogScroll = Math.max(0, Math.min(maxScroll, (MENU_STATE.changelogScroll || 0) + e.deltaY));
  drawMenuScreen();
}, { passive:false });

// ── Menu hover highlighting ───────────────────────────────────
canvas.addEventListener('mousemove', e => {
  if(G !== null && !(G.showOptions)) return;
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const mx = (e.clientX - rect.left) * scaleX;
  const my = (e.clientY - rect.top)  * scaleY;

  // In-game options — feedback button hover only
  if(G !== null && G.showOptions){
    let hit = false;
    let newHover = null;
    (MENU_STATE._optArrowRects||[]).forEach(r => {
      if(mx >= r.x && mx <= r.x+r.w && my >= r.y && my <= r.y+r.h){
        MENU_STATE.optSel = 0;
        newHover = r.dir === 'left' ? 'opt-left' : 'opt-right';
        canvas.style.cursor = 'pointer';
        hit = true;
      }
    });
    (MENU_STATE._optRects||[]).forEach(r => {
      if(mx >= r.x && mx <= r.x+r.w && my >= r.y && my <= r.y+r.h){
        MENU_STATE.optSel = r.i;
        if(!hit) newHover = r.i;
        canvas.style.cursor = 'pointer';
        hit = true;
      }
    });
    const saveY = MENU_STATE._saveBtnY;
    const fcx = canvas.width/2;
    if(saveY && mx >= fcx-220 && mx <= fcx+220 && my >= saveY && my <= saveY+40){
      MENU_STATE.optSel = 1;
      newHover = 'save';
      canvas.style.cursor = 'pointer';
      hit = true;
    }
    const fbY = MENU_STATE._feedbackBtnY;
    if(fbY && mx >= fcx-220 && mx <= fcx+220 && my >= fbY && my <= fbY+40){
      MENU_STATE.optSel = 2;
      newHover = 'fb';
      canvas.style.cursor = 'pointer';
      hit = true;
    }
    if(!hit){ canvas.style.cursor = 'default'; newHover = null; }
    if(newHover !== MENU_STATE._optHover){ MENU_STATE._optHover = newHover; renderAll(); }
    return;
  }

  // Pointer cursor over credits link
  if(MENU_STATE.screen === 'credits' && MENU_STATE._linkY){
    const lx = MENU_STATE._linkX - MENU_STATE._linkW/2;
    const ly = MENU_STATE._linkY - 18;
    if(mx >= lx && mx <= lx + MENU_STATE._linkW && my >= ly && my <= ly + 24){
      canvas.style.cursor = 'pointer'; return;
    }
    canvas.style.cursor = 'default'; return;
  }

  // Options screen hover — highlight item + feedback button
  if(MENU_STATE.screen === 'options'){
    let hit = false;
    let newHover = null;
    (MENU_STATE._optArrowRects||[]).forEach(r => {
      if(mx >= r.x && mx <= r.x+r.w && my >= r.y && my <= r.y+r.h){
        MENU_STATE.optSel = 0;
        newHover = r.dir === 'left' ? 'opt-left' : 'opt-right';
        canvas.style.cursor = 'pointer';
        hit = true;
      }
    });
    (MENU_STATE._optRects||[]).forEach(r => {
      if(mx >= r.x && mx <= r.x+r.w && my >= r.y && my <= r.y+r.h){
        if(MENU_STATE.optSel !== r.i){ MENU_STATE.optSel = r.i; }
        if(!hit) newHover = r.i;
        canvas.style.cursor = 'pointer';
        hit = true;
      }
    });
    const saveY = MENU_STATE._saveBtnY;
    const fcx = canvas.width/2;
    if(saveY && mx >= fcx-220 && mx <= fcx+220 && my >= saveY && my <= saveY+40){
      MENU_STATE.optSel = 1;
      newHover = 'save';
      canvas.style.cursor = 'pointer';
      hit = true;
    }
    const fbY = MENU_STATE._feedbackBtnY;
    if(fbY && mx >= fcx-220 && mx <= fcx+220 && my >= fbY && my <= fbY+40){
      MENU_STATE.optSel = 2;
      newHover = 'fb';
      canvas.style.cursor = 'pointer';
      hit = true;
    }
    if(!hit){ canvas.style.cursor = 'default'; newHover = null; }
    if(newHover !== MENU_STATE._optHover){ MENU_STATE._optHover = newHover; drawMenuScreen(); }
    return;
  }

  if(MENU_STATE.screen !== 'main'){ canvas.style.cursor = 'default'; return; }
  if(!MENU_STATE._btnRects) return;
  let changed = false;
  let hovering = false;
  MENU_STATE._btnRects.forEach(btn => {
    if(mx >= btn.x && mx <= btn.x+btn.w && my >= btn.y && my <= btn.y+btn.h){
      hovering = true;
      if(MENU_STATE.mainSel !== btn.i){ MENU_STATE.mainSel = btn.i; changed = true; }
    }
  });
  if(!hovering && MENU_STATE._dlBtnRect){
    const r = MENU_STATE._dlBtnRect;
    if(mx >= r.x && mx <= r.x+r.w && my >= r.y && my <= r.y+r.h) hovering = true;
  }
  canvas.style.cursor = hovering ? 'pointer' : 'default';
  if(changed) drawMenuScreen();
});

canvas.addEventListener('mouseleave', () => {
});

function drawCreditsScreen(cx){
  const ch = canvas.height;
  ctx.font='bold 31px Courier New'; ctx.fillStyle='#ffdd88'; ctx.textAlign='center';
  ctx.fillText('CREDITS', cx, 70);
  ctx.fillStyle='#443311'; ctx.fillRect(cx-280, 88, 560, 1);

  const lines = [
    { text:'Prospector II', col:'#ffe066', font:'bold 20px Courier New' },
    { text:'A fan-made roguelike', col:'#8899aa', font:'16px Courier New' },
    { text:'', col:'', font:'' },
    { text:'────────────────────────────────────', col:'#2a2a44', font:'14px Courier New' },
    { text:'', col:'', font:'' },
    { text:'Art and ideas heavily inspired and borrowed', col:'#aaccee', font:'16px Courier New' },
    { text:'with the author\'s permission from the creator', col:'#aaccee', font:'16px Courier New' },
    { text:'of the original game Prospector (2009)', col:'#aaccee', font:'16px Courier New' },
    { text:'made by Matthias Mennel', col:'#aaccee', font:'16px Courier New' },
    { text:'', col:'', font:'' },
    { text:'Check it out at:', col:'#556677', font:'15px Courier New' },
    { text:'http://prospector.at/', col:'#70d8ff', font:'bold 16px Courier New' },
  ];

  let y = 120;
  lines.forEach(line => {
    if(!line.text){ y += 10; return; }
    ctx.font = line.font;
    ctx.fillStyle = line.col;
    ctx.fillText(line.text, cx, y);
    // Underline and track the clickable link
    if(line.text==='http://prospector.at/'){
      const w = ctx.measureText(line.text).width;
      ctx.fillRect(cx - w/2, y+2, w, 1);
      MENU_STATE._linkY = y;
      MENU_STATE._linkX = cx;
      MENU_STATE._linkW = w;
    }
    y += 26;
  });

  ctx.font='14px Courier New'; ctx.fillStyle='#334455'; ctx.textAlign='center';
  ctx.fillText('[ ESC ]  Back to main menu', cx, ch-16);
  ctx.textAlign='left';
}

function handleMenuKey(e){
  if(document.getElementById('feedback-overlay').style.display==='flex') return;
  if(document.getElementById('barter-overlay').style.display==='flex') return;
  const k=e.key.toLowerCase();

  if(MENU_STATE.screen==='ship_select'){
    const count = 3;
    if(e.key==='ArrowLeft'){  MENU_STATE.shipSel=(MENU_STATE.shipSel-1+count)%count; drawMenuScreen(); return; }
    if(e.key==='ArrowRight'){ MENU_STATE.shipSel=(MENU_STATE.shipSel+1)%count;        drawMenuScreen(); return; }
    if(e.key==='Enter'){
      const ids=['LIGHT_SCOUT','BULK_FREIGHTER','ATTACK_CORVETTE'];
      MENU_STATE.chosenClass  = ids[MENU_STATE.shipSel||0];
      MENU_STATE.screen       = 'naming';
      MENU_STATE.namingField  = 'captain';
      MENU_STATE.captainName  = '';
      MENU_STATE.shipName     = '';
      MENU_STATE.namingEntryKeyStillHeld = true;
      drawMenuScreen();
      return;
    }
    if(e.key==='Escape'){ MENU_STATE.screen='intro'; drawMenuScreen(); return; }
    return;
  }

  if(MENU_STATE.screen==='naming'){
    // Handled in keyup listener for character capture
    if(e.key==='Escape'){
      if(MENU_STATE.namingField==='ship'){ MENU_STATE.namingField='captain'; drawMenuScreen(); }
      else { MENU_STATE.screen='ship_select'; drawMenuScreen(); }
      return;
    }
    return;
  }

  if(MENU_STATE.screen==='changelog'){
    if(e.key==='Escape'){ MENU_STATE.screen='main'; drawMenuScreen(); return; }
    const maxScroll = MENU_STATE._changelogMaxScroll || 0;
    if(e.key==='ArrowUp' || e.key==='PageUp'){
      MENU_STATE.changelogScroll = Math.max(0, (MENU_STATE.changelogScroll || 0) - (e.key==='PageUp' ? 160 : 36));
      drawMenuScreen(); return;
    }
    if(e.key==='ArrowDown' || e.key==='PageDown'){
      MENU_STATE.changelogScroll = Math.min(maxScroll, (MENU_STATE.changelogScroll || 0) + (e.key==='PageDown' ? 160 : 36));
      drawMenuScreen(); return;
    }
    if(e.key==='Home'){ MENU_STATE.changelogScroll = 0; drawMenuScreen(); return; }
    if(e.key==='End'){ MENU_STATE.changelogScroll = maxScroll; drawMenuScreen(); return; }
    return;
  }

  if(MENU_STATE.screen==='credits'){
    if(e.key==='Escape'){ MENU_STATE.screen='main'; drawMenuScreen(); return; }
    return;
  }

  if(MENU_STATE.screen==='options'){
    if(e.key==='Escape'){ MENU_STATE.screen='main'; MENU_STATE._optHover=null; drawMenuScreen(); return; }
    if(e.key==='f'||e.key==='F'){ openFeedback(); return; }
    if(e.key==='s'||e.key==='S'){ saveToFile(); return; }
    if(e.key==='k'||e.key==='K'){ MENU_STATE.screen='keybindings'; MENU_STATE._kbSel=0; MENU_STATE._rebinding=null; drawMenuScreen(); return; }
    if(e.key==='ArrowUp'||e.key==='ArrowDown'){
      const maxOpt = 3;
      MENU_STATE.optSel = Number.isInteger(MENU_STATE.optSel) ? MENU_STATE.optSel : 0;
      MENU_STATE.optSel = e.key==='ArrowUp'
        ? (MENU_STATE.optSel + maxOpt) % (maxOpt + 1)
        : (MENU_STATE.optSel + 1) % (maxOpt + 1);
      MENU_STATE._optHover = null;
      drawMenuScreen();
      return;
    }
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
      if(MENU_STATE.optSel===0){ OPTIONS.asciiMode=!OPTIONS.asciiMode; saveOptions(OPTIONS); drawMenuScreen(); }
      return;
    }
    if(e.key===' '||e.key==='Enter'){
      if(MENU_STATE.optSel===0){ OPTIONS.asciiMode=!OPTIONS.asciiMode; saveOptions(OPTIONS); }
      else if(MENU_STATE.optSel===1){ MENU_STATE.screen='keybindings'; MENU_STATE._kbSel=0; MENU_STATE._rebinding=null; }
      else if(MENU_STATE.optSel===2){ saveToFile(); return; }
      else { openFeedback(); return; }
      drawMenuScreen();
    }
    return;
  }

  if(MENU_STATE.screen==='keybindings'){
    const BIND_LIST = ['nw','n','ne','w','e','sw','s','se','wait'];
    const totalRows = BIND_LIST.length + 1; // +1 for reset row
    if(MENU_STATE._rebinding){
      if(e.key==='Escape'){ MENU_STATE._rebinding=null; drawMenuScreen(); return; }
      const blocked=['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Escape','Enter','F5','Tab'];
      if(blocked.includes(e.key)){ return; }
      if(!OPTIONS.keybinds) OPTIONS.keybinds = Object.assign({}, DEFAULT_KEYBINDS);
      // Clear this code from any other slot
      Object.keys(OPTIONS.keybinds).forEach(k=>{ if(OPTIONS.keybinds[k]===e.code) OPTIONS.keybinds[k]=null; });
      OPTIONS.keybinds[MENU_STATE._rebinding] = e.code;
      saveOptions(OPTIONS);
      MENU_STATE._rebinding = null;
      drawMenuScreen(); return;
    }
    if(e.key==='Escape'){ MENU_STATE.screen='options'; MENU_STATE._kbSel=0; drawMenuScreen(); return; }
    if(e.key==='ArrowUp'){
      MENU_STATE._kbSel = ((MENU_STATE._kbSel||0) - 1 + totalRows) % totalRows;
      drawMenuScreen(); return;
    }
    if(e.key==='ArrowDown'){
      MENU_STATE._kbSel = ((MENU_STATE._kbSel||0) + 1) % totalRows;
      drawMenuScreen(); return;
    }
    if(e.key==='Enter'||e.key===' '){
      const sel = MENU_STATE._kbSel || 0;
      if(sel === BIND_LIST.length){
        OPTIONS.keybinds = Object.assign({}, DEFAULT_KEYBINDS);
        saveOptions(OPTIONS);
      } else {
        MENU_STATE._rebinding = BIND_LIST[sel];
      }
      drawMenuScreen(); return;
    }
    return;
  }

  // Intro screen — handled on keyup (separate listener below)
  if(MENU_STATE.screen==='intro') return;

  // Main menu — build option list to match what's drawn
  const mainOpts=[];
  if(MENU_STATE.hasAutosave) mainOpts.push('c');
  mainOpts.push('n');
  mainOpts.push('l');
  mainOpts.push('o');
  mainOpts.push('v');
  mainOpts.push('x');
  mainOpts.push('q');
  if(MENU_STATE.mainSel===undefined) MENU_STATE.mainSel=0;

  function activateMainOpt(sel){
    if(sel==='n'){ MENU_STATE.screen='intro'; MENU_STATE.introOpenedAt=Date.now(); MENU_STATE.introEntryKeyStillHeld=true; drawMenuScreen(); }
    else if(sel==='c'){ if(loadFromStorage()){ loadSprites().then(()=>{ restoreGameUI(); renderAll(); }); } else showMenu(); }
    else if(sel==='l'){ loadFromFile(); }
    else if(sel==='o'){ MENU_STATE.screen='options'; MENU_STATE.optSel=0; drawMenuScreen(); }
    else if(sel==='v'){ MENU_STATE.screen='changelog'; MENU_STATE.changelogScroll=0; drawMenuScreen(); }
    else if(sel==='x'){ MENU_STATE.screen='credits'; drawMenuScreen(); }
    else if(sel==='q'){ quitGame(); }
  }

  if(e.key==='ArrowUp'){
    MENU_STATE.mainSel=(MENU_STATE.mainSel-1+mainOpts.length)%mainOpts.length;
    drawMenuScreen(); return;
  }
  if(e.key==='ArrowDown'){
    MENU_STATE.mainSel=(MENU_STATE.mainSel+1)%mainOpts.length;
    drawMenuScreen(); return;
  }
  if(e.key==='Enter'){
    activateMainOpt(mainOpts[MENU_STATE.mainSel]); return;
  }
  // Letter shortcuts still functional
  if(k==='n') activateMainOpt('n');
  else if(k==='c' && MENU_STATE.hasAutosave) activateMainOpt('c');
  else if(k==='l') activateMainOpt('l');
  else if(k==='o') activateMainOpt('o');
  else if(k==='v') activateMainOpt('v');
  else if(k==='x') activateMainOpt('x');
  else if(k==='d' && shouldShowDesktopDownload()) downloadDesktopApp();
  else if(k==='q') activateMainOpt('q');
}

