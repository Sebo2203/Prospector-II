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

function addLog(msg,cls,category=G?.mode==='shipcombat'?'combat':undefined){
  cls=cls||'';
  const latest = G.log[0];
  if(latest && latest.msg === msg && (latest.cls || '') === cls){
    latest.count = (latest.count || 1) + 1;
    if(category) latest.category=category;
    G.msg = logDisplayText(latest);
    return;
  }
  const entry = {msg, cls, count:1, turn: G.turn||1};
  if(category) entry.category=category;
  G.log.unshift(entry);
  G.msg=logDisplayText(entry);
}

function addCombatLog(msg,cls){addLog(msg,cls,'combat');}

// Like addLog but silent — writes to G.log history only, no sidebar flash.
// Use for historical detail that belongs in the LOG tab without a sidebar update.
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

