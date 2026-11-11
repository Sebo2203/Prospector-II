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

// Transient sidebar paging keeps large careers responsive without discarding history.
let commsLogView={career:null,limit:80};
function renderCommsLog(){
  const el=document.getElementById('log-list');
  if(!el)return;
  if(commsLogView.career!==G){commsLogView={career:G,limit:80};el.innerHTML='';el.scrollTop=0;}
  const entries=G.log.filter(entry=>!entry.archive);
  const atLatest=el.scrollTop>=-2;
  const bounds=el.getBoundingClientRect();
  const anchor=atLatest?null:[...el.children].find(child=>{
    const rect=child.getBoundingClientRect();return rect.bottom>bounds.top && rect.top<bounds.bottom;
  });
  const anchorEntry=anchor?._commsEntry;
  const anchorTop=anchor?.getBoundingClientRect().top;
  // Keep the reader's anchor in the rendered window when new messages arrive.
  if(anchorEntry)commsLogView.limit=Math.max(commsLogView.limit,entries.indexOf(anchorEntry)+1);
  const visible=entries.slice(0,commsLogView.limit);
  const html=visible.map(entry=>{
    const age=(G.turn||0)-(entry.turn||0);
    return `<div class="log-entry ${entry.cls||''}" style="opacity:${age===0?1:0.75}">${htmlEsc(logDisplayText(entry))}</div>`;
  }).join('');
  el.style.flex='1 1 0';
  if(el.innerHTML!==html){
    el.innerHTML=html;
    [...el.children].forEach((child,index)=>{child._commsEntry=visible[index];});
    if(atLatest)el.scrollTop=0;
    else if(anchorEntry){
      const replacement=[...el.children].find(child=>child._commsEntry===anchorEntry);
      if(replacement){
        const scale=bounds.height/el.offsetHeight;
        el.scrollTop+=(replacement.getBoundingClientRect().top-anchorTop)/scale;
      }
    }
  }
  el.onscroll=()=>{
    if(commsLogView.career!==G || el.clientHeight===0)return;
    if(commsLogView.limit<entries.length && -el.scrollTop>=el.scrollHeight-el.clientHeight-40){
      commsLogView.limit+=80;
      renderCommsLog();
    }
  };
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

