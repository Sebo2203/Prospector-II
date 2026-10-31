function startGalaxyShipDialogue(ns){
  if(!ns) return;
  const idMap = { trader:'galaxy_ship_trader', science:'galaxy_ship_science', patrol:'galaxy_ship_patrol', cargo:'galaxy_ship_cargo' };
  const id = idMap[ns.type];
  if(!id){ doRadioHailLegacy(ns); return; }
  G.dialogue = {
    id,
    node: 'root',
    sel: 0,
    context: { shipName: ns.name, dist: neutralShipDistance(ns), ns },
    visited: {},
    lastCheck: null,
  };
  enterDialogueNode(G.dialogue.node);
  renderAll();
}

function startCrewDialogue(startNode='root'){
  const c = selectedCrewMember();
  if(!c) return;
  G._crewExamine = false;
  G.dialogue = {
    id:c.role === 'captain' ? 'captain_log' : 'crew_basic',
    node:startNode || 'root',
    sel:0,
    context:{ crewName:c.name, crew:c },
    visited:{},
    lastCheck:null,
  };
  enterDialogueNode(G.dialogue.node);
  renderAll();
}

function startAlienDialogue(enemy, startNode='root'){
  if(!enemy) return;
  if(!enemy.uid) enemy.uid = 'alien_'+Date.now()+'_'+rnd(99999);
  enemy.commKnown = true;
  G.dialogue = {
    id:'alien_contact',
    node:startNode || 'root',
    sel:0,
    context:{ planetKey:G.curPlanet, enemyUid:enemy.uid },
    visited:{},
    lastCheck:null,
  };
  enterDialogueNode(G.dialogue.node);
  renderAll();
}

function startCivilizationDialogue(target, startNode='root'){
  const pdata = target?.pdata || G.planets?.[G.curPlanet];
  if(!pdata?.civilization) return;
  const civ = pdata.civilization;
  // Hostile-aggression civs never talk — trigger combat instead
  if(civ.aggression === 'Hostile'){
    const state = ensureCivilizationState(pdata);
    if(!state?.hostile) makeCivilizationHostile(pdata, 'Hostile group attacks on sight');
    return;
  }
  ensureCivilizationState(pdata);
  G.examine = null;
  const dialogueId = civ.species === 'Walking Tree' ? 'walking_tree_contact' : 'civilization_contact';
  G.dialogue = {
    id: dialogueId,
    node:startNode || 'root',
    sel:0,
    context:{
      planetKey:G.curPlanet,
      tileType:target?.cell?.type || null,
      isLocal: !!(target?.local || target?.cell?.type === 'civ_local'),
      contactKind: target?.contactKind || ((target?.local || target?.cell?.type === 'civ_local') ? 'local' : 'settlement'),
      noEscape: !!target?.noEscape || (civ.aggression === 'Territorial' && !ensureCivilizationState(pdata)?.contacted),
      localUid: target?.local?.uid || null,
      x:target?.x ?? G.player?.x,
      y:target?.y ?? G.player?.y,
    },
    visited:{},
    lastCheck:null,
  };
  enterDialogueNode(G.dialogue.node);
  renderAll();
}

function currentDialogueDef(){
  return G?.dialogue ? DIALOGUE_DEFS[G.dialogue.id] : null;
}

function currentDialogueNode(){
  const def = currentDialogueDef();
  return def?.nodes?.[G.dialogue.node] || null;
}

function dialogueVisibleOptions(){
  const node = currentDialogueNode();
  if(!node) return [];
  const ctx = G.dialogue.context || {};
  const options = typeof node.options === 'function' ? node.options(ctx) : (node.options || []);
  const dedupeLabels = G.dialogue?.id === 'civilization_contact' && G.dialogue?.node !== 'gift_select';
  const seenLabels = new Set();
  return options
    .filter(opt=>!opt.condition || opt.condition(ctx))
    .map(opt=>{
      let disabled = typeof opt.disabled === 'function' ? !!opt.disabled(ctx) : !!opt.disabled;
      let label = opt.label;
      let disabledReason = opt.disabledReason;
      if(G.dialogue?.id === 'civilization_contact' && opt.action === 'close' && !dialogueAllowsEscape()){
        disabled = true;
        label = civilizationCloseLabel();
        disabledReason = 'resolve the delegation first';
      }
      return Object.assign({}, opt, { disabled, label, disabledReason });
    })
    .filter(opt=>{
      if(G.dialogue?.id !== 'civilization_contact' || !opt.disabled) return true;
      const reason = typeof opt.disabledReason === 'function' ? opt.disabledReason(ctx) : opt.disabledReason;
      return !/\b(already|covered|done|this visit)\b/i.test(String(reason || ''));
    })
    .filter(opt=>{
      if(!dedupeLabels) return true;
      const key = String(opt.label || '').trim().toLowerCase();
      if(!key) return true;
      if(seenLabels.has(key)) return false;
      seenLabels.add(key);
      return true;
    })
    .sort((a, b) => {
      const isEndA = a.action === 'close' || /end contact/i.test(a.label || '');
      const isEndB = b.action === 'close' || /end contact/i.test(b.label || '');
      if(isEndA && !isEndB) return 1;
      if(!isEndA && isEndB) return -1;
      return 0;
    });
}

function enterDialogueNode(nodeId){
  if(!G.dialogue) return;
  const def = currentDialogueDef();
  const node = def?.nodes?.[nodeId];
  if(!node) return;
  G.dialogue.node = nodeId;
  G.dialogue.sel = 0;
  G.dialogue.optScroll = 0;
  if(!G.dialogue.visited) G.dialogue.visited = {};
  if(!G.dialogue.nodeText) G.dialogue.nodeText = {};
  const repeatable = !!node.repeatable;
  if(repeatable || !G.dialogue.visited[nodeId]){
    G.dialogue.visited[nodeId] = true;
    G.dialogue.nodeText[nodeId] = typeof node.text === 'function' ? node.text(G.dialogue.context || {}) : (node.text || '');
    if(node.onEnter) node.onEnter(G.dialogue.context || {});
  } else if(G.dialogue.nodeText[nodeId] === undefined){
    G.dialogue.nodeText[nodeId] = typeof node.text === 'function' ? node.text(G.dialogue.context || {}) : (node.text || '');
  }
}

function chooseDialogueOption(idx){
  if(!G.dialogue) return;
  const opts = dialogueVisibleOptions();
  const opt = opts[idx];
  if(!opt || opt.disabled) return;
  G.dialogue.lastCheck = null;
  if(opt.action === 'close'){
    if(!dialogueAllowsEscape()){
      addLog('The delegation blocks the way. You need to answer them.','lw');
      renderAll();
      return;
    }
    if(G.dialogue.id === 'civilization_contact' && isDelegationContact()){
      const wrap = dialogueCivilization();
      if(wrap?.state) wrap.state.nextProactiveContactTurn = (G.turn || 1) + 10;
    }
    G.dialogue = null;
    renderAll();
    return;
  }
  if(opt.action === 'radio_trade'){
    const ns = G.dialogue.context?.ns;
    G.dialogue = null;
    if(ns){ ensureMerchantStock(ns); G.radio = { ship:ns, sel:0 }; G.mode = 'radio'; addLog('Opening trade channel with '+ns.name+'.','li'); }
    renderAll();
    return;
  }
  if(opt.action === 'open_barter'){
    openBarterOverlay();
    return;
  }
  if(opt.action === 'attack_civ'){
    attackCivilizationFromDialogue(G.dialogue.context || {});
    return;
  }
  if(opt.action === 'escort_to_ship'){
    const wrap = dialogueCivilization();
    if(wrap && startCivilizationShipEscort(wrap)){
      if(G.dialogue?.context) G.dialogue.context.resolved = true;
      G.dialogue = null;
      renderAll();
    } else {
      addLog('Escort cannot be arranged from here.','lw');
      renderAll();
    }
    return;
  }
  if(opt.effect) opt.effect(G.dialogue.context || {});
  if(opt.check){
    const skill = bestCrewSkill(opt.check.skill);
    const roll = 1 + rnd(10);
    const total = roll + skill;
    G.dialogue.lastCheck = { skill:opt.check.skill.toUpperCase(), roll, bonus:skill, total, dc:opt.check.dc, ok:total >= opt.check.dc };
    if(opt.check.skill === 'soc'){
      const cap = (G.crew||[]).find(c=>c.role==='captain' && c.hp>0);
      if(cap) giveSkillXP(cap, 'soc', total >= opt.check.dc ? 3 : 1);
      const actor = dialogueCrew();
      if(actor && actor !== cap) giveSkillXP(actor, 'soc', total >= opt.check.dc ? 1 : 0);
    } else if(opt.check.skill === 'cbt'){
      const best = (G.crew||[]).filter(c=>c.hp>0).sort((a,b)=>(b.skills?.cbt||0)-(a.skills?.cbt||0))[0];
      if(best) giveSkillXP(best, 'cbt', total >= opt.check.dc ? 2 : 1);
    }
    enterDialogueNode(total >= opt.check.dc ? opt.success : opt.fail);
    renderAll();
    return;
  }
  if(opt.next) enterDialogueNode(opt.next);
  renderAll();
}

