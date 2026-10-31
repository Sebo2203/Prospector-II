// ── Canvas ────────────────────────────────────────────────────────
const canvas = document.getElementById('gc');
const ctx    = canvas.getContext('2d');
canvas.width  = VIEW_W * TS;   // 40 × 24 = 960
canvas.height = VIEW_H * TS;   // 20 × 24 = 480

// ── Log font size control ─────────────────────────────────────
let _logFontSize = 13;
function adjustLogFont(delta){
  _logFontSize = Math.max(9, Math.min(20, _logFontSize + delta));
  document.documentElement.style.setProperty('--log-font', _logFontSize+'px');
}

// ── Message bar with auto-dismiss ────────────────────────────
let _msgTimer = null;
let _msgTurn = -1;
function showMsg(text, color, persist){
  const bar  = document.getElementById('msg-bar');
  const span = document.getElementById('msg-bar-text');
  if(!text){ hideMsg(); return; }
  span.textContent = text;
  bar.style.color = color || '';
  bar.classList.add('visible');
  if(_msgTimer){ clearTimeout(_msgTimer); _msgTimer = null; }
  _msgTurn = persist ? -1 : (G ? G.turn : -1);
}
function checkMsgDismiss(){
  // Called each turn — dismiss if 4 turns have passed since the message
  if(_msgTurn >= 0 && G && G.turn >= _msgTurn + 4) hideMsg();
}
function hideMsg(){
  if(_msgTimer){ clearTimeout(_msgTimer); _msgTimer = null; }
  _msgTurn = -1;
  const bar = document.getElementById('msg-bar');
  bar.classList.remove('visible');
}
function dismissMsg(){ hideMsg(); if(G) G.msg=''; }

