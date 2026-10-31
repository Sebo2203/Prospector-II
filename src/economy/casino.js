// ─────────────────────────────────────────────────────────────────
//  CASINO OVERLAY
// ─────────────────────────────────────────────────────────────────
const CASINO_GAMES = [
  { label:'Void Poker', sub:'A smoky back-room table where the dealer never blinks.', col:'#ffcc00' },
  { label:'Arm Wrestle', sub:'A steel table, a shouting ring, and pride on the line.', col:'#ff8844' },
  { label:'Drinking Contest', sub:'A row of impossible glasses and terrible judgment.', col:'#88ddff' },
  { label:'Beast Arena', sub:'Floodlights, claw marks, and a crowd hungry for blood.', col:'#ff5555' },
];
const CASINO_POKER_STAKES = [
  { label:'Back-room table', amount:50, hint:'low heat' },
  { label:'Neon felt', amount:100, hint:'house standard' },
  { label:'High roller pit', amount:250, hint:'serious money' },
];
const CASINO_WRESTLERS = [
  { name:'Dock Loader Bragg', rating:7, stake:40, payout:95, line:'forearms like cargo clamps' },
  { name:'Exo-Miner Vela', rating:11, stake:90, payout:225, line:'powered brace, dubious rules' },
  { name:'Arena Champ Korr', rating:16, stake:180, payout:520, line:'the table is already dented' },
];
const CASINO_DRINKERS = [
  { name:'Laughing Barkeep', rating:7, stake:35, payout:80, morale:2, line:'friendly until the third glass' },
  { name:'Old Smuggler', rating:11, stake:75, payout:170, morale:3, line:'claims the glass blinked first' },
  { name:'Void Monk', rating:15, stake:140, payout:360, morale:5, line:'ritual poison, somehow licensed' },
];
const CASINO_BEASTS = [
  { name:'Mawhound', hp:24, atk:9, def:1, prize:260, bet:80, mult:2, line:'fast and loud' },
  { name:'Glassback Brute', hp:34, atk:10, def:4, prize:360, bet:120, mult:3, line:'armor under the strobes' },
  { name:'Static Mantis', hp:28, atk:13, def:2, prize:420, bet:150, mult:4, line:'blue sparks on every claw' },
  { name:'Alpha Beast', hp:42, atk:14, def:3, prize:620, bet:250, mult:5, line:'the crowd gets quiet' },
];
const CASINO_NPC_LINES = [
  'Barkeep: "Credits in, stories out. That is the economy."',
  'Pit boss: "No weapons on the felt. No visible ones."',
  'Smuggler: "If the cards whisper, listen expensive."',
  'Holoscreen: Beast Arena waivers half price tonight.',
  'Dealer: "Luck is math wearing perfume."',
];

function ensureCasinoState(){
  if(!G.casino) G.casino = {};
  if(!G.casinoStats) G.casinoStats = { lifetimeWon:0, lifetimeLost:0, visits:0, jackpot:1200 };
  const c = G.casino;
  if(c.screen === undefined) c.screen = 'main';
  if(c.sel === undefined) c.sel = 0;
  if(c.betSel === undefined) c.betSel = 0;
  if(c.wrestleSel === undefined) c.wrestleSel = 0;
  if(c.drinkSel === undefined) c.drinkSel = 0;
  if(c.beastSel === undefined) c.beastSel = 0;
  if(c.sessionWon === undefined) c.sessionWon = 0;
  if(c.sessionLost === undefined) c.sessionLost = 0;
  if(!c.npcLine) c.npcLine = pick(CASINO_NPC_LINES);
  return c;
}
function casinoInteractAtPlayer(){
  const tile=G.planets[G.curPlanet]?.grid[G.player.y]?.[G.player.x]?.type;
  const screens={casino_poker:'poker',casino_bar:'drink',casino_arena:'arena',casino_wrestle:'wrestle'};
  if(screens[tile]){
    const c=ensureCasinoState();
    c.screen=screens[tile]; c.lastResult=null;
    if(tile==='casino_arena'){c.arena=null;c.arenaPhase='choose';}
    G.mode='casino'; return;
  }
  if(tile==='casino_slots'){
    const stake=25;
    if(!casinoSpend(stake)){addLog('Slots cost 25 cr. You need more credits.','lw');return;}
    const symbols=['7','7','STAR','STAR','BELL','BELL','BELL','VOID','VOID','VOID'];
    const roll=Array.from({length:3},()=>symbols[rnd(symbols.length)]);
    const match=roll[0]===roll[1]&&roll[1]===roll[2];
    const pair=roll[0]===roll[1]||roll[0]===roll[2]||roll[1]===roll[2];
    const payout=match ? (roll[0]==='7'?500:roll[0]==='STAR'?200:roll[0]==='BELL'?100:75) : pair?25:0;
    casinoLose(stake);
    if(payout) casinoPay(payout);
    addLog('Slots: '+roll.join(' | ')+' — '+(payout?'won '+payout+' cr!':'no payout.'),payout?'lg':'li');
    return;
  }
  if(tile==='casino_host'){addLog('Host: "Welcome to The Void Royale. The tables are open all cycle."','li');return;}
  if(tile==='casino_info'){addLog('Directory: poker north, bar south, arena northeast, wrestling southeast. Slots on the promenade.','li');return;}
  if(tile==='casino_console'){addLog('House terminal: all tables operating. No outstanding alerts.','li');return;}
  if(tile==='casino_locker'){addLog('Staff locker: access reserved for casino personnel.','li');return;}
  if(tile==='SHIP'){addLog('Your ship is docked here. Press L to undock.','li');return;}
  addLog('Music and voices carry through the station. Walk to a table and press Enter.','li');
}
function casinoCrew(){ return (G.crew||[]).filter(c=>c.hp>0); }
function casinoBest(skill){
  const crew = casinoCrew();
  if(!crew.length) return null;
  return crew.sort((a,b)=>((b.skills?.[skill]||0)-(a.skills?.[skill]||0))||((b.maxHp||0)-(a.maxHp||0)))[0];
}
function casinoSkill(c, skill){ return c?.skills?.[skill] || 0; }
function casinoPay(amount){
  if(amount <= 0) return;
  earnCredits(amount);
  const c = ensureCasinoState();
  G.casinoStats.lifetimeWon = (G.casinoStats.lifetimeWon || 0) + amount;
  c.sessionWon = (c.sessionWon || 0) + amount;
}
function casinoLose(amount){
  if(amount <= 0) return;
  const c = ensureCasinoState();
  G.casinoStats.lifetimeLost = (G.casinoStats.lifetimeLost || 0) + amount;
  G.casinoStats.jackpot = (G.casinoStats.jackpot || 1200) + Math.ceil(amount * 0.35);
  c.sessionLost = (c.sessionLost || 0) + amount;
}
function casinoSpend(amount){ if(G.credits < amount) return false; G.credits -= amount; return true; }
function casinoDeck(){
  const d=[], suits=['S','H','D','C'], ranks=['2','3','4','5','6','7','8','9','T','J','Q','K','A'];
  suits.forEach(s=>ranks.forEach(r=>d.push({r,s})));
  for(let i=d.length-1;i>0;i--){ const j=rnd(i+1), t=d[i]; d[i]=d[j]; d[j]=t; }
  return d;
}
function casinoCard(c){ return c ? c.r+c.s : '--'; }
function casinoRank(hand){
  const order='23456789TJQKA', vals=hand.map(c=>order.indexOf(c.r)+2).sort((a,b)=>a-b), counts={};
  hand.forEach(c=>counts[c.r]=(counts[c.r]||0)+1);
  const groups=Object.values(counts).sort((a,b)=>b-a), flush=hand.every(c=>c.s===hand[0].s);
  let straight=vals.every((v,i)=>!i||v===vals[i-1]+1); if(vals.join(',')==='2,3,4,5,14') straight=true;
  if(straight&&flush) return {name:'Straight Flush', mult:20};
  if(groups[0]===4) return {name:'Four of a Kind', mult:12};
  if(groups[0]===3&&groups[1]===2) return {name:'Full House', mult:8};
  if(flush) return {name:'Flush', mult:6};
  if(straight) return {name:'Straight', mult:5};
  if(groups[0]===3) return {name:'Three of a Kind', mult:4};
  if(groups[0]===2&&groups[1]===2) return {name:'Two Pair', mult:3};
  if(groups[0]===2) return {name:'Pair', mult:2};
  return {name:'High Card', mult:0};
}
function casinoStartPoker(){
  const c=ensureCasinoState(), stake=CASINO_POKER_STAKES[c.betSel]||CASINO_POKER_STAKES[0];
  if(!casinoSpend(stake.amount)){ c.lastResult={win:false,msg:'Not enough credits for that table.'}; return; }
  const deck=casinoDeck();
  c.poker={phase:'hold', stake:stake.amount, deck, hand:deck.splice(0,5), hold:[false,false,false,false,false], result:null};
  c.lastResult=null; G.turn++;
}
function casinoFinishPoker(){
  const c=ensureCasinoState(), p=c.poker; if(!p) return;
  for(let i=0;i<5;i++) if(!p.hold[i]) p.hand[i]=p.deck.shift();
  const rank=casinoRank(p.hand), payout=Math.floor(p.stake*rank.mult), profit=payout-p.stake;
  if(payout>0) casinoPay(payout);
  if(profit>0){ adjustCrewMoraleBase(profit>=200?2:1,true); addLog('Void Poker pays '+payout+' cr on '+rank.name+'.','lg'); }
  else { casinoLose(p.stake); if(p.stake>=100) adjustCrewMoraleBase(-1,true); addLog('Void Poker takes '+p.stake+' cr.','lw'); }
  giveSkillXP(casinoBest('sci'),'sci',rank.mult>0?2:1);
  p.result={rank,payout,profit}; p.phase='result';
}
function casinoStartContest(kind){
  const c=ensureCasinoState(), drink=kind==='drink', list=drink?CASINO_DRINKERS:CASINO_WRESTLERS, idx=drink?c.drinkSel:c.wrestleSel, opp=list[idx]||list[0];
  const crew=casinoBest(drink?'soc':'cbt');
  if(!crew){ addLog('No living crew can compete.','lw'); return; }
  if(!casinoSpend(opp.stake)){ addLog('Not enough credits for that stake.','lw'); return; }
  c.lastResult=null;
  c.contest={kind, opp, crew, round:0, strain:0, player:0, rival:0, phase:'active'};
  G.turn++;
  addLog(crewDisplayName(crew)+' steps up against '+opp.name+'. The ring closes in.','li');
}
function casinoResolveContestWin(c, won, note){
  const m=c.contest, drink=m.kind==='drink', crew=m.crew, opp=m.opp;
  giveSkillXP(crew, drink?'soc':'cbt', won?4:2);
  if(won){
    casinoPay(opp.payout);
    if(drink){ boostCrewFromDrink(); adjustCrewMoraleBase(opp.morale||1,true); }
    else adjustCrewMoraleBase(1,true);
    addLog(note+' '+crewDisplayName(crew)+' wins '+(opp.payout-opp.stake)+' cr profit.','lg');
  } else {
    casinoLose(opp.stake);
    adjustCrewMoraleBase(drink?-2:-1,true);
    addLog(note+' '+crewDisplayName(crew)+' loses '+opp.stake+' cr.','lw');
  }
  c.contest=null;
}
function casinoDrinkRound(){
  const c=ensureCasinoState(), m=c.contest; if(!m) return;
  const crew=m.crew, opp=m.opp, soc=casinoSkill(crew,'soc');
  m.round++;
  m.strain += 1 + rnd(3);
  const player=1+rnd(10)+soc*2-Math.floor(m.strain/2);
  const rival=1+rnd(10)+opp.rating-Math.floor(m.round/2);
  addLog('Round '+m.round+': '+crewDisplayName(crew)+' downs another glass. Hands shake. Score '+player+' vs '+rival+'.','li');
  if(m.round>=2 && Math.random() < 0.14*m.round){ applyCrewStatus(crew,'hangover',{severity:Math.min(3,1+Math.floor(m.round/3)),duration:16+m.round*4,source:'Void Royale drinking contest',silent:true}); addLog(crewDisplayName(crew)+' is going to feel this later.','lw'); }
  if(m.round>=4 && player<rival+2 && !DEBUG.infiniteCrewHp){ crew.hp=Math.max(1,crew.hp-1); addLog(crewDisplayName(crew)+' nearly chokes on the burn. -1 HP.','lw'); }
  if(m.round<3){ addLog('Nobody backs down yet. The next glass is already being poured.','li'); return; }
  if(player+2<rival) return casinoResolveContestWin(c,false,'The room tilts first.');
  if(rival+2<player || m.round>=7) return casinoResolveContestWin(c,true,'The rival pushes their glass away.');
}
function casinoWrestleRound(move){
  const c=ensureCasinoState(), m=c.contest; if(!m) return;
  const crew=m.crew, opp=m.opp, cbt=casinoSkill(crew,'cbt');
  const moves={steady:{name:'steady pressure',mod:1,risk:0},surge:{name:'hard surge',mod:4,risk:2},feint:{name:'shoulder feint',mod:0,risk:-1}};
  const mv=moves[move]||moves.steady;
  m.round++;
  m.strain=Math.max(0,m.strain+1+mv.risk);
  const player=1+rnd(10)+cbt*2+mv.mod-Math.floor(m.strain/3);
  const rival=1+rnd(10)+opp.rating-Math.floor(m.round/3);
  addLog('Round '+m.round+': '+crewDisplayName(crew)+' tries '+mv.name+'. The table groans. Score '+player+' vs '+rival+'.','li');
  if(player>rival+2) m.player++; else if(rival>player+2) m.rival++; else addLog('Neither arm moves more than a trembling centimeter.','li');
  if(m.strain>=7 && Math.random()<0.28){ applyCrewStatus(crew,'stunned',{severity:1,duration:2,source:'arm wrestle strain',silent:true}); addLog(crewDisplayName(crew)+' comes away with a numb hand.','lw'); }
  if(m.player>=2) return casinoResolveContestWin(c,true,'The rival slams into the table.');
  if(m.rival>=2 || m.round>=5) return casinoResolveContestWin(c,false,'The arm drops hard.');
}
function casinoQuitContest(){
  const c=ensureCasinoState(), m=c.contest; if(!m) return;
  casinoLose(Math.ceil(m.opp.stake/2));
  addLog(crewDisplayName(m.crew)+' backs out before it gets uglier. Half the stake is gone.','lw');
  c.contest=null;
}
function casinoStartArena(){
  const c=ensureCasinoState(), liveCrew=casinoCrew(), fighter=liveCrew[c.fighterSel||0]||casinoBest('cbt'), b=CASINO_BEASTS[c.beastSel]||CASINO_BEASTS[0];
  if(!fighter){ c.lastResult={win:false,msg:'No living crew can fight.'}; return; }
  if(!casinoSpend(b.bet)){ c.lastResult={win:false,msg:'Not enough credits for that side bet.'}; return; }
  c.arena={round:0,fighter,fighterHp:fighter.hp,beast:{...b,maxHp:b.hp,hp:b.hp},captainBonus:G.crew.some(x=>x.role==='captain'&&x.hp>0)?2:0,log:['The gate slams open. '+crewDisplayName(fighter)+' enters.'],result:null};
  c.arenaPhase='watch'; G.turn++;
}
function casinoArenaStep(){
  const c=ensureCasinoState(), a=c.arena; if(!a||a.result) return;
  a.round++;
  const out=Math.max(1,(a.fighter.atk||1)+casinoSkill(a.fighter,'cbt')+a.captainBonus+rnd(5)-a.beast.def);
  a.beast.hp=Math.max(0,a.beast.hp-out); a.log.push('Round '+a.round+': '+crewDisplayName(a.fighter)+' hits for '+out+'.');
  if(a.beast.hp<=0){ casinoFinishArena(true); return; }
  const inc=Math.max(0,a.beast.atk+rnd(5)-(a.fighter.def||0));
  a.fighterHp=Math.max(0,a.fighterHp-inc); a.log.push(a.beast.name+' answers for '+inc+'.');
  if(a.fighterHp<=0) casinoFinishArena(false); else if(a.round>=18) casinoFinishArena(a.fighterHp>=a.beast.hp);
}
function casinoFinishArena(won){
  const c=ensureCasinoState(), a=c.arena; if(!a||a.result) return;
  a.result=won?'win':'lose'; c.arenaPhase='result';
  if(won){ const payout=a.beast.prize+a.beast.bet*a.beast.mult; casinoPay(payout); adjustCrewMoraleBase(3,true); a.fighter.hp=Math.max(1,Math.floor(a.fighterHp)); giveSkillXP(a.fighter,'cbt',5); a.log.push('VICTORY: '+a.beast.name+' falls. Arena pays '+payout+' cr.'); addLog(crewDisplayName(a.fighter)+' defeated '+a.beast.name+'.','lg'); if(!c.defeatedBeasts) c.defeatedBeasts=[]; const _bi=CASINO_BEASTS.findIndex(b=>b.name===a.beast.name); if(_bi!==-1&&!c.defeatedBeasts.includes(_bi)) c.defeatedBeasts.push(_bi); }
  else { casinoLose(a.beast.bet); a.fighter.hp=0; a.log.push('DEFEAT: '+crewDisplayName(a.fighter)+' falls in the arena.'); addLog(crewDisplayName(a.fighter)+' was killed in the Beast Arena.','lc'); pruneDead(); checkDeath(); }
}
function casinoDrawContest(cx,ch,drink){
  const c=ensureCasinoState(), list=drink?CASINO_DRINKERS:CASINO_WRESTLERS, selIdx=drink?c.drinkSel:c.wrestleSel, best=casinoBest(drink?'soc':'cbt');
  casinoHead(drink?'DRINKING CONTEST':'ARM WRESTLE',cx);
  if(c.contest && c.contest.kind===(drink?'drink':'wrestle')){
    const m=c.contest;
    ctx.font='15px Courier New'; ctx.fillStyle='#aa77cc'; ctx.textAlign='center';
    ctx.fillText(crewDisplayName(m.crew)+' faces '+m.opp.name+' under the house lights.',cx,160);
    ctx.font='14px Courier New'; ctx.fillStyle=drink?'#88ddff':'#ffbb88';
    ctx.fillText('Round '+(m.round+1)+'   Strain '+m.strain+'   Stake '+m.opp.stake+' cr   Purse '+m.opp.payout+' cr',cx,188);
    if(drink){
      ctx.font='13px Courier New'; ctx.fillStyle='#668899';
      ctx.fillText('Enter drinks again. ESC backs out before the next glass.',cx,222);
      ctx.fillText('Each glass makes the room meaner. The log tells the story.',cx,244);
    } else {
      ctx.font='13px Courier New'; ctx.fillStyle='#997766';
      ctx.fillText('1 steady pressure   2 hard surge   3 shoulder feint   ESC concede',cx,222);
      ctx.fillText('First to two clean table moves wins. The log carries the blow-by-blow.',cx,244);
    }
    return;
  }
  ctx.font='14px Courier New';ctx.fillStyle='#aa77cc';ctx.textAlign='center';
  ctx.fillText('Stepping up: '+(best?crewDisplayName(best):'no living crew'),cx,158);
  list.forEach((o,i)=>{const y=184+i*72,x=cx-300,sel=i===selIdx;casinoBox(x,y,600,60,sel,drink?'#88ddff':'#ff8844');ctx.font='bold 16px Courier New';ctx.fillStyle=sel?'#fff':'#ccaaff';ctx.textAlign='left';ctx.fillText(o.name+'   Stake '+o.stake+' cr   Purse '+o.payout+' cr',x+26,y+23);ctx.font='13px Courier New';ctx.fillStyle=sel?'#aaddff':'#665577';ctx.fillText(o.line,x+26,y+43);});
  casinoFoot('Up/Down opponent   Enter step up   ESC back',cx,ch);
}
function casinoBox(x,y,w,h,sel,col){ ctx.fillStyle=sel?'#1a0a2e':'#0d0618'; ctx.fillRect(x,y,w,h); ctx.strokeStyle=sel?col:'#2a1a3a'; ctx.lineWidth=sel?2:1; ctx.strokeRect(x,y,w,h); }
function casinoFoot(t,cx,ch){ ctx.font='14px Courier New'; ctx.fillStyle='#4a2a6a'; ctx.textAlign='center'; ctx.fillText(t,cx,ch-14); }
function casinoHead(t,cx){ const s=G.casinoStats||{}; ctx.font='bold 22px Courier New'; ctx.fillStyle='#ffcc00'; ctx.textAlign='center'; ctx.fillText(t,cx,108); ctx.font='15px Courier New'; ctx.fillStyle='#9966cc'; ctx.fillText('Balance '+G.credits+' cr  |  Jackpot '+(s.jackpot||1200)+' cr',cx,130); ctx.fillStyle='#2a1a3a'; ctx.fillRect(cx-320,140,640,1); }

function drawCasinoOverlay(){
  const cw=canvas.width,ch=canvas.height,cx=cw/2,c=ensureCasinoState(),stats=G.casinoStats;
  ctx.fillStyle='rgba(10,0,20,0.94)'; ctx.fillRect(0,0,cw,ch); ctx.strokeStyle='#6600cc'; ctx.lineWidth=3; ctx.strokeRect(6,6,cw-12,ch-12); ctx.strokeStyle='#aa44ff44'; ctx.lineWidth=1; ctx.strokeRect(10,10,cw-20,ch-20);
  ctx.textAlign='center'; ctx.font='bold 32px Courier New'; ctx.fillStyle='#cc44ff'; ctx.fillText('THE VOID ROYALE',cx,50); ctx.font='16px Courier New'; ctx.fillStyle='#7733aa'; ctx.fillText('Deep Space Entertainment Complex - Est. 2387',cx,72); ctx.fillStyle='#3a1a5a'; ctx.fillRect(cx-320,82,640,1);
  if(c.screen==='main'){
    ctx.font='bold 17px Courier New'; ctx.fillStyle='#ffe066'; ctx.fillText('Balance: '+G.credits+' cr   Session: +'+(c.sessionWon||0)+' / -'+(c.sessionLost||0)+' cr',cx,108); ctx.font='13px Courier New'; ctx.fillStyle='#aa77cc'; ctx.fillText(c.npcLine,cx,130);
    CASINO_GAMES.forEach((g,i)=>{ const y=150+i*66,x=cx-300,sel=i===c.sel; casinoBox(x,y,600,54,sel,g.col); if(sel){ctx.fillStyle=g.col;ctx.font='bold 18px Courier New';ctx.textAlign='left';ctx.fillText('>',x+12,y+24);} ctx.font='bold 17px Courier New';ctx.fillStyle=sel?'#fff':g.col;ctx.textAlign='left';ctx.fillText(g.label,x+34,y+22);ctx.font='13px Courier New';ctx.fillStyle=sel?'#aaa':'#665577';ctx.fillText(g.sub,x+34,y+42); });
    ctx.font='13px Courier New'; ctx.fillStyle='#8866aa'; ctx.textAlign='center'; ctx.fillText('Lifetime won '+(stats.lifetimeWon||0)+' cr  |  Lifetime lost '+(stats.lifetimeLost||0)+' cr  |  Jackpot '+(stats.jackpot||1200)+' cr',cx,ch-38); casinoFoot('Up/Down navigate   Enter select   ESC undock',cx,ch);
  } else if(c.screen==='poker'){
    casinoHead('VOID POKER',cx); const p=c.poker;
    if(!p){ if(c.lastResult){ctx.font='bold 15px Courier New';ctx.fillStyle=c.lastResult.win?'#44ff88':'#ff6666';ctx.fillText(c.lastResult.msg,cx,160);} CASINO_POKER_STAKES.forEach((s,i)=>{const y=178+i*64,x=cx-280,sel=i===c.betSel;casinoBox(x,y,560,52,sel,'#ffcc00');ctx.font='bold 16px Courier New';ctx.fillStyle=sel?'#fff':'#ccaaff';ctx.textAlign='left';ctx.fillText(s.label+' - '+s.amount+' cr',x+28,y+22);ctx.font='13px Courier New';ctx.fillStyle=sel?'#ffcc44':'#665577';ctx.fillText(s.hint,x+28,y+40);}); casinoFoot('Up/Down table   Enter buy in   ESC back',cx,ch); }
    else { const sci=casinoBest('sci'), peek=Math.min(3,Math.floor((casinoSkill(sci,'sci')+1)/3)); ctx.font='14px Courier New';ctx.fillStyle='#aa77cc';ctx.fillText('Stake '+p.stake+' cr'+(sci?'  |  SCI read: '+crewDisplayName(sci)+(peek?' sees '+p.deck.slice(0,peek).map(casinoCard).join(' '):' gets static'):''),cx,160); for(let i=0;i<5;i++){const x=cx-250+i*125,y=194;casinoBox(x,y,92,120,p.hold[i],'#ffcc00');ctx.font='bold 30px Courier New';ctx.fillStyle=p.hold[i]?'#ffe066':'#fff';ctx.textAlign='center';ctx.fillText(casinoCard(p.hand[i]),x+46,y+58);ctx.font='12px Courier New';ctx.fillStyle=p.hold[i]?'#44ff88':'#665577';ctx.fillText((i+1)+' '+(p.hold[i]?'HELD':'hold'),x+46,y+94);} if(p.phase==='result'){const r=p.result;ctx.font='bold 18px Courier New';ctx.fillStyle=r.profit>0?'#44ff88':'#ff6666';ctx.fillText(r.rank.name+'   Payout '+r.payout+' cr   Net '+r.profit+' cr',cx,350);casinoFoot('Enter new hand   ESC tables',cx,ch);} else {ctx.font='14px Courier New';ctx.fillStyle='#8866aa';ctx.fillText('Payouts: Pair x2, Two Pair x3, Trips x4, Straight x5, Flush x6, Full House x8, Four x12',cx,350);casinoFoot('1-5 toggle hold   Enter redraw   ESC fold/back',cx,ch);} }
  } else if(c.screen==='wrestle'||c.screen==='drink'){
    casinoDrawContest(cx,ch,c.screen==='drink');
  } else if(c.screen==='arena'){
    casinoHead('BEAST ARENA',cx); if(c.lastResult){ctx.font='bold 15px Courier New';ctx.fillStyle='#ff6666';ctx.fillText(c.lastResult.msg,cx,160);} if(c.arenaPhase==='pick_fighter'){
        const _lc=casinoCrew();
        ctx.font='bold 16px Courier New';ctx.fillStyle='#ffcc66';ctx.textAlign='center';
        ctx.fillText('SELECT FIGHTER',cx,160);
        _lc.forEach((cr,i)=>{
          const y=186+i*46,x=cx-280,sel=i===(c.fighterSel||0);
          casinoBox(x,y,560,38,sel,'#ff5555');
          ctx.font=sel?'bold 14px Courier New':'14px Courier New';
          ctx.fillStyle=sel?'#fff':'#cc9999';ctx.textAlign='left';
          ctx.fillText(crewDisplayName(cr)+'  HP '+cr.hp+'/'+cr.maxHp+'  ATK '+cr.atk+'  CBT '+casinoSkill(cr,'cbt'),x+16,y+24);
        });
        casinoFoot('Up/Down select   Enter confirm   ESC back',cx,ch);
      } else if(!c.arena){const f=casinoBest('cbt');ctx.font='14px Courier New';ctx.fillStyle='#aa77cc';ctx.fillText('Fighter: '+(f?crewDisplayName(f)+' HP '+f.hp+'/'+f.maxHp+' CBT '+casinoSkill(f,'cbt'):'no living crew'),cx,160);CASINO_BEASTS.forEach((b,i)=>{const y=184+i*64,x=cx-310,sel=i===c.beastSel,defeated=(c.defeatedBeasts&&c.defeatedBeasts.includes(i));casinoBox(x,y,620,54,sel&&!defeated,defeated?'#442222':'#ff5555');ctx.font='bold 15px Courier New';ctx.fillStyle=defeated?'#664444':sel?'#fff':'#ff9999';ctx.textAlign='left';ctx.fillText(b.name+(defeated?' — DEFEATED':'')+'  HP '+b.hp+' ATK '+b.atk+' DEF '+b.def+'  Bet '+b.bet+' cr',x+24,y+21);ctx.font='13px Courier New';ctx.fillStyle=defeated?'#443333':sel?'#ffccaa':'#775566';ctx.fillText(defeated?'Already conquered this season':'Prize '+b.prize+' cr + side bet x'+b.mult+' - '+b.line,x+24,y+40);});casinoFoot('Up/Down beast   Enter fight   ESC back',cx,ch);} else {const a=c.arena;ctx.font='bold 16px Courier New';ctx.fillStyle='#aaccff';ctx.textAlign='left';ctx.fillText(crewDisplayName(a.fighter)+' HP '+a.fighterHp+'/'+a.fighter.maxHp,cx-300,164);ctx.fillStyle='#ff8888';ctx.textAlign='right';ctx.fillText(a.beast.name+' HP '+a.beast.hp+'/'+a.beast.maxHp,cx+300,164);a.log.slice(-10).reverse().forEach((line,i)=>{ctx.font=i===0?'bold 14px Courier New':'13px Courier New';ctx.fillStyle=line.indexOf('VICTORY')===0?'#44ff88':line.indexOf('DEFEAT')===0?'#ff4444':'#c8b8d8';ctx.textAlign='center';ctx.fillText(line,cx,204+i*24);});casinoFoot(a.result?'Enter continue':'Enter next round   Space auto round',cx,ch);} }
  ctx.textAlign='left';
}

function handleCasinoKey(e){
  const c=ensureCasinoState();
  if(e.key==='Escape' && G.planets[G.curPlanet]?.isCasino){
    if(c.arena && !c.arena.result) return;
    if(c.contest) casinoQuitContest();
    if(c.poker?.phase==='hold') casinoLose(c.poker.stake);
    c.poker=null;c.contest=null;c.arena=null;c.arenaPhase=null;c.screen='main';
    G.mode='planet'; renderAll(); return;
  }
  if(c.screen==='main'){ if(e.key==='ArrowUp'){c.sel=Math.max(0,c.sel-1);renderAll();return;} if(e.key==='ArrowDown'){c.sel=Math.min(CASINO_GAMES.length-1,c.sel+1);renderAll();return;} if(e.key==='Enter'){c.lastResult=null;if(c.sel===0){c.screen='poker';c.betSel=0;c.poker=null;} if(c.sel===1){c.screen='wrestle';c.wrestleSel=0;} if(c.sel===2){c.screen='drink';c.drinkSel=0;} if(c.sel===3){c.screen='arena';c.beastSel=0;c.arena=null;c.arenaPhase='choose';} renderAll();return;} if(e.key==='Escape'){G.mode='galaxy';addLog('Left The Void Royale. Session: +'+(c.sessionWon||0)+' / -'+(c.sessionLost||0)+' cr.','li');renderAll();return;} return; }
  if(c.screen==='poker'){ if(!c.poker){ if(e.key==='ArrowUp'){c.betSel=Math.max(0,c.betSel-1);renderAll();return;} if(e.key==='ArrowDown'){c.betSel=Math.min(CASINO_POKER_STAKES.length-1,c.betSel+1);renderAll();return;} if(e.key==='Enter'){casinoStartPoker();renderAll();return;} if(e.key==='Escape'){c.screen='main';c.sel=0;renderAll();return;} return; } if(c.poker.phase==='hold'){ if(['1','2','3','4','5'].includes(e.key)){const i=Number(e.key)-1;c.poker.hold[i]=!c.poker.hold[i];renderAll();return;} if(e.key==='Enter'){casinoFinishPoker();renderAll();return;} if(e.key==='Escape'){casinoLose(c.poker.stake);c.poker=null;c.screen='main';renderAll();return;} return; } if(e.key==='Enter'||e.key==='Escape'){c.poker=null;renderAll();return;} }
  if(c.screen==='wrestle'||c.screen==='drink'){
    const drink=c.screen==='drink', max=(drink?CASINO_DRINKERS:CASINO_WRESTLERS).length-1;
    if(c.contest){
      if(e.key==='Escape'){ casinoQuitContest(); renderAll(); return; }
      if(drink && e.key==='Enter'){ casinoDrinkRound(); renderAll(); return; }
      if(!drink && e.key==='1'){ casinoWrestleRound('steady'); renderAll(); return; }
      if(!drink && e.key==='2'){ casinoWrestleRound('surge'); renderAll(); return; }
      if(!drink && e.key==='3'){ casinoWrestleRound('feint'); renderAll(); return; }
      return;
    }
    if(e.key==='ArrowUp'){ if(drink)c.drinkSel=Math.max(0,c.drinkSel-1); else c.wrestleSel=Math.max(0,c.wrestleSel-1); renderAll();return;}
    if(e.key==='ArrowDown'){ if(drink)c.drinkSel=Math.min(max,c.drinkSel+1); else c.wrestleSel=Math.min(max,c.wrestleSel+1); renderAll();return;}
    if(e.key==='Enter'){casinoStartContest(drink?'drink':'wrestle');renderAll();return;}
    if(e.key==='Escape'){c.screen='main';c.sel=drink?2:1;c.lastResult=null;renderAll();return;}
    return;
  }
  if(c.screen==='arena'){
      if(c.arenaPhase==='pick_fighter'){
        const _lc=casinoCrew();
        if(e.key==='ArrowUp'||e.key==='w'||e.key==='W'){c.fighterSel=Math.max(0,(c.fighterSel||0)-1);renderAll();return;}
        if(e.key==='ArrowDown'||e.key==='s'||e.key==='S'){c.fighterSel=Math.min(_lc.length-1,(c.fighterSel||0)+1);renderAll();return;}
        if(e.key==='Enter'||e.key===' '){casinoStartArena();renderAll();return;}
        if(e.key==='Escape'){c.arenaPhase='choose';renderAll();return;}
        return;
      }
      if(!c.arena){ if(e.key==='ArrowUp'){c.beastSel=Math.max(0,c.beastSel-1);renderAll();return;} if(e.key==='ArrowDown'){c.beastSel=Math.min(CASINO_BEASTS.length-1,c.beastSel+1);renderAll();return;} if(e.key==='Enter'){const _bi=c.beastSel;if(c.defeatedBeasts&&c.defeatedBeasts.includes(_bi)){addLog('You have already defeated this beast. Choose another.','lw');renderAll();return;}c.arenaPhase='pick_fighter';c.fighterSel=0;renderAll();return;} if(e.key==='Escape'){c.screen='main';c.sel=3;c.lastResult=null;renderAll();return;} return; } if(c.arena.result){ if(e.key==='Enter'||e.key===' '){ if(G.dead){showMenu();return;} c.arena=null;c.arenaPhase=null;c.screen='main';c.sel=3;renderAll();return;} return; } if(e.key==='Enter'||e.key===' '){casinoArenaStep();renderAll();return;} }
}

//  NEUTRAL SHIP MOVEMENT
