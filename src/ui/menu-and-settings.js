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
  if(G?.debugPalette) debugReturnFromPalette(false);
  setMenuCanvasMode();
  MENU_STATE.hasAutosave = hasSave();
  MENU_STATE.screen = 'main';
  MENU_STATE.optSel = 0;
  MENU_STATE.mainSel = 0;
  G = null;
  // Hide all game UI — only canvas visible
  document.getElementById('game-escape').hidden = true;
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
  void refreshSavedGameMenu();
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
  document.getElementById('game-escape').hidden = false;
  document.getElementById('hud').style.display         = '';
  document.getElementById('gauge-panel').style.display = '';
  document.getElementById('sidebar').style.display     = '';
  document.getElementById('msg-bar').style.display     = '';
  document.getElementById('ctx-bar').style.display     = '';
  document.getElementById('persist-bar').style.display = '';
  document.getElementById('version-tag').style.display = '';
}

function toggleShortcutLegend(){
  const legend = document.getElementById('persist-hints');
  legend.hidden = !legend.hidden;
  document.getElementById('shortcut-toggle').setAttribute('aria-expanded',String(!legend.hidden));
}

async function returnToMainMenuFromGame(){
  if(AUTOSAVE_STATE.transition)return;
  if(G?.debugPalette)debugReturnFromPalette(false);
  const career=G;setSaveTransition(true);
  try{if(G && !await autoSave())return;if(G===career)showMenu();}
  finally{setSaveTransition(false);}
}

function drawMenuScreen(){
  resetCanvasMenu();
  renderPointerKeys();
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
    canvasMenuTarget(cx-140,cy+totalH/2+22,280,28,openShipSelection);
    canvasMenuButton('Back [Esc]',24,canvas.height-30,()=>handleMenuKey({key:'Escape'}));
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

    const cardW=290, cardH=232, cardGap=20;
    const totalW = ships.length*cardW + (ships.length-1)*cardGap;
    const startX = cx - totalW/2;

    ships.forEach((s,i)=>{
      const isSel = i===sel;
      const bx=startX+i*(cardW+cardGap), by=78;
      canvasMenuTarget(bx,by,cardW,cardH,()=>openVesselRegistration(i,false),{hover:()=>{
        if(MENU_STATE.shipSel!==i){
          MENU_STATE.shipSel=i;
          drawMenuScreen();
        }
      }});
      ctx.fillStyle = isSel ? '#0e1a2e' : '#080810';
      ctx.fillRect(bx,by,cardW,cardH);
      ctx.strokeStyle = isSel ? s.col : '#2a2a4a';
      ctx.lineWidth = isSel ? 2 : 1;
      ctx.strokeRect(bx,by,cardW,cardH);

      // Sprite — draw centered, scaled up 3x (72px) from 24px tile
      const spriteImg = IMG[s.sprite];
      if(spriteImg && spriteImg.complete && spriteImg.naturalWidth > 0){
        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(spriteImg, bx+cardW/2-36, by+10, 72, 72);
      } else {
        ctx.font='bold 44px Courier New'; ctx.fillStyle=s.col; ctx.textAlign='center';
        ctx.fillText('?', bx+cardW/2, by+56);
      }

      // Label
      ctx.font='bold 17px Courier New'; ctx.fillStyle= isSel ? '#ffffff' : s.col;
      ctx.fillText(s.label, bx+cardW/2, by+100);

      // Divider
      ctx.fillStyle=s.col+'44'; ctx.fillRect(bx+20, by+110, cardW-40, 1);

      // Description lines
      ctx.font='12px Courier New'; ctx.fillStyle= isSel ? '#99bbcc' : '#445566';
      let descriptionY=by+132;
      for(const paragraph of s.lines){
        let line='';
        for(const word of paragraph.split(' ')){
          const candidate=line?line+' '+word:word;
          if(line&&ctx.measureText(candidate).width>cardW-28){
            ctx.fillText(line,bx+cardW/2,descriptionY);descriptionY+=17;line=word;
          }else line=candidate;
        }
        if(line){ctx.fillText(line,bx+cardW/2,descriptionY);descriptionY+=17;}
      }

      if(isSel){
        ctx.font='bold 13px Courier New'; ctx.fillStyle='#ffe066';
        ctx.fillText('[ ENTER to select ]', bx+cardW/2, by+cardH-12);
      }
    });

    ctx.font='13px Courier New'; ctx.fillStyle='#334455'; ctx.textAlign='center';
    ctx.fillText('←/→ navigate    Enter confirm', cx, 78+cardH+22);
    canvasMenuButton('Back [Esc]',24,canvas.height-30,()=>handleMenuKey({key:'Escape'}));
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

    function drawField(id, label, value, y){
      const active = field===id;
      ctx.textAlign='left';
      ctx.font='13px Courier New'; ctx.fillStyle= active ? '#aaccee' : '#445566';
      ctx.fillText(label, cx-240, y);
      const bx=cx-240, by=y+10, bw=480, bh=42;
      ctx.fillStyle = active ? '#0e1a2e' : '#080810';
      ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = active ? '#ffe066' : '#2a2a4a';
      ctx.lineWidth = active ? 2 : 1;
      ctx.strokeRect(bx, by, bw, bh);
      ctx.font='bold 16px Courier New';
      ctx.fillStyle = active ? '#ffffff' : '#667788';
      ctx.fillText(value + (active ? '█' : ''), bx+12, by+27);
      ctx.textAlign='center';
      canvasMenuTarget(bx,by,bw,bh,()=>{
        MENU_STATE.namingField=id;
        drawMenuScreen();
      });
    }

    drawField('captain', 'Captain name:', capName, 160);
    drawField('ship', 'Ship name:', shipName, 244);

    ctx.font='14px Courier New'; ctx.fillStyle='#8899aa'; ctx.textAlign='center';
    const hint = field==='captain'
      ? 'Type your captain\'s name, then press Enter'
      : 'Christen your ship, then press Enter to launch';
    ctx.fillText(hint, cx, 332);
    canvasMenuButton('Back [Esc]',cx-240,356,()=>handleMenuKey({key:'Escape'}));
    canvasMenuButton(field==='captain'?'Next [Enter]':'Launch [Enter]',cx+120,356,advanceVesselRegistration);
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
    canvasMenuTarget(x,y,btnW,btnH,()=>{
      MENU_STATE.mainSel=i;
      activateMainMenuOption(o.key.toLowerCase(),false);
    },{hover:()=>{
      if(MENU_STATE.mainSel!==i){ MENU_STATE.mainSel=i; drawMenuScreen(); }
    }});
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
  ctx.fillText(GAME_VERSION_LABEL+'  —  Made by Sebastian', cx, canvas.height-28);
  // Show seed hash if a save exists
  if(MENU_STATE.hasAutosave){
    try {
      const _saveSeed = AUTOSAVE_STATE.record?.summary.seed;
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
    canvasMenuTarget(_dlX,_dlY,_dlBtnW,_dlBtnH,downloadDesktopApp);
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

  rows.forEach(row=>{
    const y = startY + row.i*(rowH+rowGap);
    const sel = MENU_STATE.optSel === row.i;
    canvasMenuTarget(cx-rowW/2,y,rowW,rowH,()=>activateOptionsRow(row.i),{hover:()=>{
      if(MENU_STATE.optSel!==row.i){ MENU_STATE.optSel=row.i; redrawOptions(); }
    }});

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
  canvasMenuButton('Back [Esc]',24,ch-30,closeOptionsMenu);
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

    canvasMenuTarget(cx-260,y-2,520,rowH-2,()=>activateKeybindingRow(i));
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
  canvasMenuTarget(cx-260,resetY,520,34,()=>activateKeybindingRow(BIND_LIST.length));

  ctx.font='13px Courier New'; ctx.fillStyle='#334455'; ctx.textAlign='center';
  ctx.fillText('↑/↓ navigate    Enter to remap    ESC back', cx, ch-16);
  canvasMenuButton('Back [Esc]',24,ch-30,closeOptionsMenu);
  ctx.textAlign='left';
}

// ─────────────────────────────────────────────────────────────────
//  MENU KEY HANDLER
// ─────────────────────────────────────────────────────────────────
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
    { text:'[L] http://prospector.at/', col:'#70d8ff', font:'bold 16px Courier New' },
  ];

  let y = 120;
  lines.forEach(line => {
    if(!line.text){ y += 10; return; }
    ctx.font = line.font;
    ctx.fillStyle = line.col;
    ctx.fillText(line.text, cx, y);
    // Underline and track the clickable link
    if(line.text.startsWith('[L]')){
      const w = ctx.measureText(line.text).width;
      ctx.fillRect(cx - w/2, y+2, w, 1);
      canvasMenuTarget(cx-w/2,y-18,w,24,openProspectorCreditsLink);
    }
    y += 26;
  });

  ctx.font='14px Courier New'; ctx.fillStyle='#334455'; ctx.textAlign='center';
  ctx.fillText('[ ESC ]  Back to main menu', cx, ch-16);
  canvasMenuTarget(cx-140,ch-34,280,25,()=>handleMenuKey({key:'Escape'}));
  ctx.textAlign='left';
}

const MOVEMENT_BINDING_IDS = ['nw','n','ne','w','e','sw','s','se','wait'];

function redrawOptions(){
  if(G) renderAll(); else drawMenuScreen();
}

function activateOptionsRow(i){
  MENU_STATE.optSel=i;
  if(i===0){ OPTIONS.asciiMode=!OPTIONS.asciiMode; saveOptions(OPTIONS); }
  else if(i===1){
    MENU_STATE._kbSel=0;
    MENU_STATE._rebinding=null;
    if(G) G._kbScreen=true; else MENU_STATE.screen='keybindings';
  } else if(i===2){ saveToFile(); return; }
  else { openFeedback(); return; }
  redrawOptions();
}

function activateKeybindingRow(i){
  MENU_STATE._kbSel=i;
  MENU_STATE._rebinding=MOVEMENT_BINDING_IDS[i] || null;
  if(!MENU_STATE._rebinding){
    OPTIONS.keybinds={...DEFAULT_KEYBINDS};
    saveOptions(OPTIONS);
  }
  redrawOptions();
}

function closeOptionsMenu(){
  if(MENU_STATE._rebinding) MENU_STATE._rebinding=null;
  else if(G?._kbScreen){ G._kbScreen=false; MENU_STATE._kbSel=0; }
  else if(G) G.showOptions=false;
  else if(MENU_STATE.screen==='keybindings'){ MENU_STATE.screen='options'; MENU_STATE._kbSel=0; }
  else MENU_STATE.screen='main';
  redrawOptions();
}

function toggleGameOptions(){
  if(!G || G.dead || G.retired || canvasMenuBlocked()) return;
  G.showOptions=!G.showOptions;
  if(!G.showOptions){ G._kbScreen=false; MENU_STATE._rebinding=null; }
  MENU_STATE.optSel=0;
  renderAll();
}

function openShipSelection(){
  MENU_STATE.screen='ship_select';
  MENU_STATE.shipSel=0;
  drawMenuScreen();
}

function openVesselRegistration(index,keyHeld){
  MENU_STATE.shipSel=index;
  MENU_STATE.chosenClass=['LIGHT_SCOUT','BULK_FREIGHTER','ATTACK_CORVETTE'][index];
  MENU_STATE.screen='naming';
  MENU_STATE.namingField='captain';
  MENU_STATE.captainName='';
  MENU_STATE.shipName='';
  MENU_STATE.namingEntryKeyStillHeld=keyHeld;
  drawMenuScreen();
}

function editVesselName(key){
  const field=MENU_STATE.namingField==='captain'?'captainName':'shipName';
  const value=MENU_STATE[field]||'';
  if(key==='Backspace') MENU_STATE[field]=value.slice(0,-1);
  else if(value.length<20) MENU_STATE[field]=value+key;
  drawMenuScreen();
}

function advanceVesselRegistration(){
  const captains=['Yara Voss','Deklan Mire','Sable Orin','Tev Hadra','Cass Weld',
    'Rook Solan','Lena Quist','Bren Falke','Ziva Thorn','Oskar Dune','Mira Stahl','Colt Vane'];
  const ships=['Pale Wanderer','Iron Meridian','Silent Drift','Vagrant Star',
    'Ashen Wake','The Long Haul','Ember Cross','Dustfall','Far Cry','Sable Wind',
    'Cold Horizon','The Forsaken','Rust & Glory','Unnamed Regret'];
  if(!MENU_STATE.captainName.trim()) MENU_STATE.captainName=pick(captains);
  if(MENU_STATE.namingField==='captain'){
    MENU_STATE.namingField='ship';
    drawMenuScreen();
  } else {
    if(!MENU_STATE.shipName.trim()) MENU_STATE.shipName=pick(ships);
    initGame(MENU_STATE.chosenClass,MENU_STATE.captainName.trim(),MENU_STATE.shipName.trim());
  }
}

function openProspectorCreditsLink(){
  window.open('http://prospector.at/','_blank','noopener');
}

function activateMainMenuOption(sel,keyHeld){
  if(sel==='n'){ MENU_STATE.screen='intro'; MENU_STATE.introOpenedAt=Date.now(); MENU_STATE.introEntryKeyStillHeld=keyHeld; drawMenuScreen(); }
  else if(sel==='c'){ void continueSavedGame(); }
  else if(sel==='l'){ loadFromFile(); }
  else if(sel==='o'){ MENU_STATE.screen='options'; MENU_STATE.optSel=0; drawMenuScreen(); }
  else if(sel==='x'){ MENU_STATE.screen='credits'; drawMenuScreen(); }
  else if(sel==='q'){ quitGame(); }
}

function handleMenuKey(e){
  if(AUTOSAVE_STATE.loading)return;
  if(document.getElementById('feedback-overlay').style.display==='flex') return;
  if(document.getElementById('barter-overlay').style.display==='flex') return;
  const k=e.key.toLowerCase();

  if(MENU_STATE.screen==='ship_select'){
    const count = 3;
    if(e.key==='ArrowLeft'){  MENU_STATE.shipSel=(MENU_STATE.shipSel-1+count)%count; drawMenuScreen(); return; }
    if(e.key==='ArrowRight'){ MENU_STATE.shipSel=(MENU_STATE.shipSel+1)%count;        drawMenuScreen(); return; }
    if(e.key==='Enter'){
      openVesselRegistration(MENU_STATE.shipSel||0,true);
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

  if(MENU_STATE.screen==='credits'){
    if(e.key==='Escape'){ MENU_STATE.screen='main'; drawMenuScreen(); return; }
    if(k==='l') openProspectorCreditsLink();
    return;
  }

  if(MENU_STATE.screen==='options'){
    if(e.key==='Escape'){ closeOptionsMenu(); return; }
    if(e.key==='f'||e.key==='F'){ openFeedback(); return; }
    if(e.key==='s'||e.key==='S'){ saveToFile(); return; }
    if(e.key==='k'||e.key==='K'){ activateOptionsRow(1); return; }
    if(e.key==='ArrowUp'||e.key==='ArrowDown'){
      const maxOpt = 3;
      MENU_STATE.optSel = Number.isInteger(MENU_STATE.optSel) ? MENU_STATE.optSel : 0;
      MENU_STATE.optSel = e.key==='ArrowUp'
        ? (MENU_STATE.optSel + maxOpt) % (maxOpt + 1)
        : (MENU_STATE.optSel + 1) % (maxOpt + 1);
      drawMenuScreen();
      return;
    }
    if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
      if(MENU_STATE.optSel===0) activateOptionsRow(0);
      return;
    }
    if(e.key===' '||e.key==='Enter') activateOptionsRow(MENU_STATE.optSel);
    return;
  }

  if(MENU_STATE.screen==='keybindings'){
    const totalRows = MOVEMENT_BINDING_IDS.length + 1;
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
    if(e.key==='Escape'){ closeOptionsMenu(); return; }
    if(e.key==='ArrowUp'){
      MENU_STATE._kbSel = ((MENU_STATE._kbSel||0) - 1 + totalRows) % totalRows;
      drawMenuScreen(); return;
    }
    if(e.key==='ArrowDown'){
      MENU_STATE._kbSel = ((MENU_STATE._kbSel||0) + 1) % totalRows;
      drawMenuScreen(); return;
    }
    if(e.key==='Enter'||e.key===' '){
      activateKeybindingRow(MENU_STATE._kbSel||0); return;
    }
    return;
  }

  // Intro screen — handled on keyup (separate listener below)
  if(MENU_STATE.screen==='intro'){
    if(e.key==='Escape'){ MENU_STATE.screen='main'; drawMenuScreen(); }
    return;
  }

  // Main menu — build option list to match what's drawn
  const mainOpts=[];
  if(MENU_STATE.hasAutosave) mainOpts.push('c');
  mainOpts.push('n');
  mainOpts.push('l');
  mainOpts.push('o');
  mainOpts.push('x');
  mainOpts.push('q');
  if(MENU_STATE.mainSel===undefined) MENU_STATE.mainSel=0;

  const activateMainOpt=sel=>activateMainMenuOption(sel,true);

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
  else if(k==='x') activateMainOpt('x');
  else if(k==='d' && shouldShowDesktopDownload()) downloadDesktopApp();
  else if(k==='q') activateMainOpt('q');
}

