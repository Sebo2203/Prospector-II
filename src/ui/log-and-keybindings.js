// ─────────────────────────────────────────────────────────────────
//  LOG
// ─────────────────────────────────────────────────────────────────
function logDisplayText(entry){
  if(!entry) return '';
  const msg = typeof entry === 'string' ? entry : entry.msg;
  const count = typeof entry === 'object' ? (entry.count || 1) : 1;
  return String(msg ?? '') + (count > 1 ? ' x' + count : '');
}

const KEYBIND_CONFLICTS = {"KeyR":"Wait / repair (galaxy)","KeyF":"Fire (combat)","KeyH":"Radio hail","KeyI":"Inventory","KeyL":"Lift off","KeyO":"Refill oxygen","KeyT":"Tractor beam","KeyU":"Fuel scoop","KeyV":"View scan","KeyX":"Examine","KeyM":"Map","KeyS":"Scan (in system)","KeyC":"Communicate"};
const DEFAULT_KEYBINDS = {
  nw:'KeyQ', n:'KeyW', ne:'KeyE',
   w:'KeyA',           e:'KeyD',
  sw:'KeyZ', s:'KeyS', se:'KeyC',
  wait:'Space',
};

// Render log entries into #log-list and scroll to the bottom so the
// newest message (last in DOM after .reverse()) is always visible.
function setLogHTML(html){
  const el = document.getElementById('log-list');
  if(!el) return;
  el.style.flex = '1 1 0';
  el.innerHTML = html;
}

function addLog(msg,cls){
  cls=cls||'';
  if(G?.mode==='shipcombat' && G.shipCombat){
    const sc = G.shipCombat;
    if(sc.log[0] === msg) return;
    sc.log.unshift(msg);
    if(sc.log.length > 10) sc.log.length = 10;
    archiveLog('['+(sc.pirate?.name || 'ship combat')+'] '+msg, cls);
    return;
  }
  const latest = G.log[0];
  if(latest && latest.msg === msg && (latest.cls || '') === cls){
    latest.count = (latest.count || 1) + 1;
    G.msg = logDisplayText(latest);
    return;
  }
  const entry = {msg, cls, count:1, turn: G.turn||1};
  G.log.unshift(entry);
  G.msg=logDisplayText(entry);
}

// Like addLog but silent — writes to G.log history only, no sidebar flash.
// Use for high-frequency detail (e.g. per-round ship combat) that belongs in
// the LOG tab but must NOT duplicate into the sidebar or msg-bar.
function archiveLog(msg,cls){
  cls=cls||'';
  G.log.unshift({msg, cls, count:1, turn: G.turn||1, archive:true});
}

function earnCredits(amount){
  if(amount > 0){
    G.credits += amount;
    G.creditsEarned = (G.creditsEarned || 0) + amount;
  }
}

