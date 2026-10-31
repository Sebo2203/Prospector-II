function civGreetingText(civ, state){
  const comp = civComprehension(civ, state);
  // Hostile — narrator
  if(state.hostile && state.hostileResponse === 'flee') return 'No one answers. The group has scattered, leaving traces of where they moved and what they dropped.';
  if(state.hostile) return civ.tier === 'primitive'
    ? 'They answer with aggression. This is no longer a contact — it is a conflict.'
    : 'The settlement answers with defenders, locked doors, and shouted warnings. Whatever contact existed is gone.';
  // No scientist — narrator
  if(!hasScientist() && !state.contacted) return 'Signals received but uninterpretable. A trained scientist would help translate intent and structure from the patterns.';
  if(!hasScientist()) return 'Basic gestures are exchanged, but the communication remains shallow. A scientist could push this further.';
  // Primitive-specific
  if(civ.tier === 'primitive'){
    const traits = civ.traits || {};
    if(!state.contacted){
      if(comp === 'none' || comp === 'uncertain'){
        if(traits.diet === 'carnivore') return 'Sound comes back — layered, rhythmic, structured. A predator group has a language. The crew cannot read it. Yet.';
        if(traits.curiosity === 'curious') return 'They respond. Movement, sound, gesture — all at once. Something is trying to close the gap. The problem is neither side knows how yet.';
        if(traits.social === 'collective') return 'Multiple voices. They are answering together. The meaning is lost, but the pattern is clear: no one here decides alone.';
        return 'The first reply is cautious: movement, sound, silence, then a repeated pattern. Something is trying to communicate back.';
      }
      return 'The first real exchange: fragile, shaped by fear and curiosity in equal parts. But it is contact.';
    }
    if((state.relation||0) < 0) return 'They remember the crew. The memory shapes their distance before any words are tried.';
    if(comp === 'fragmentary') return '"...come back... not take... ground..."';
    if(comp === 'workable') return '"You come again. We see. Speak careful."';
    return 'The reply is mostly posture and rhythm. Intent is readable.';
  }
  // First contact — narrator describing the moment
  if(!state.contacted) return 'The first reply is cautious: movement, signal, silence, then a carefully repeated pattern. Something is trying to communicate back.';
  // Subsequent visit with low relation — narrator
  if((state.relation||0) < 0) return 'The locals keep distance. Whatever happened before has not been forgotten.';
  // Actual communication — these are paraphrased transmissions, use quotes
  if(comp === 'fluent') return '"The contact channel is stable. Meaning arrives clearly now."';
  if(comp === 'workable') return '"The exchange is slow but legible. The basic shape of meaning is holding."';
  if(comp === 'fragmentary') return '"...visitors... distance... exchange... danger..."';
  return 'The reply is mostly posture and rhythm. No words, but intent is readable.';
}

function civWantText(civ, state){
  if(state.hostile) return 'They are past words. The time for communication is over.';
  const territorial = civ.aggression === 'Territorial';
  if(state.alert >= 3){
    if(civ.tier === 'primitive'){
      const traits = civ.traits || {};
      return primWantText(civ.species, state, traits, 'none');
    }
    if(territorial) return '"Back. Out of our territory. Now."';
    return '"Away. Too close."';
  }
  if(civ.tier === 'primitive'){
    const traits = civ.traits || {};
    const comp = civComprehension(civ, state);
    return primWantText(civ.species, state, traits, comp);
  }
  if(territorial){
    if(civ.tier === 'tribal')     return '"You crossed our boundary markers. State your purpose or leave the sacred ground."';
    if(civ.tier === 'medieval')   return '"This land is ours by right. You will not pass further without warrant or permission."';
    if(civ.tier === 'industrial') return '"This is a restricted zone. Identify your vessel and state why you are here."';
    return '"You are in our controlled space. Declare your intent and comply or be removed."';
  }
  if(civ.tier === 'tribal'){
    const tt = civ.traits || {};
    if(tt.ritual === 'totem') return '"Respect the markers. Do not touch the spirit-poles. Bring something worth giving."';
    if(tt.ritual === 'ancestor') return '"You are being observed by more than us. Walk carefully here."';
    if(tt.structure === 'chieftain') return '"The chieftain will decide if you are welcome. Until then, stay visible and do not approach the inner ground."';
    if(tt.structure === 'council') return '"We will speak among ourselves. Stay where we can see you. Do not move toward the settlement."';
    return '"Respect ground. No nest harm. Leave bright objects for peace."';
  }
  if(civ.tier === 'medieval') return '"Declare purpose. Respect the guards. Trade only under watch."';
  if(civ.tier === 'industrial') return '"Identify your vessel, your captain, and your intent. Trade may be possible."';
  return '"Who are you. Where did you come from. What do you want here. Answer those three things clearly."';
}

function civAidText(civ, state){
  if(state.hostile) return 'They turn away. No aid from a hostile group.';
  if((state.relation || 0) < 4) return 'Aid is refused. The trust needed for that exchange has not been established.';
  if(state.aidGiven) return 'They have already helped as much as they are willing to risk today.';
  state.aidGiven = true;
  const treatment = civHealCrewByTier(civ);
  if(civ.tier === 'primitive'){
    const traits = civ.traits || {};
    G.crew.filter(c=>c.hp>0).forEach(c=>{ c.moraleBase = Math.min(100, (c.moraleBase || 55) + 1); });
    const effect = treatment.healed ? '\n\nCrew injuries recover by '+treatment.healed+' total HP.' : '';
    if(traits.diet === 'herbivore') return 'They bring water, edible plants, and something wrapped in broad leaves. It is simple and exactly what is needed.'+effect;
    if(traits.diet === 'carnivore') return 'They leave fresh-killed game and a clear gesture toward a sheltered area. Practical help, no ceremony.'+effect;
    if(traits.social === 'collective') return 'Several of them work together: water, shade, attention to wounds. Collective care — they do not help halfway.'+effect;
    if(traits.curiosity === 'curious') return 'They study the crew while helping. Water and rest are offered alongside very close observation.'+effect;
    return 'They offer water, shelter, and a place to rest. It helps more than the instruments can measure.'+effect;
  }
  if(civ.tier === 'tribal'){
    G.crew.filter(c=>c.hp>0).forEach(c=>{ c.moraleBase = Math.min(100, (c.moraleBase || 55) + 1); });
    const tTraits = civ.traits || {};
    const healNote = treatment.healed ? '\n\nCrew injuries recover by '+treatment.healed+' total HP.' : '';
    if(tTraits.ritual === 'animist') return 'They bring prepared plants, stripped bark, and something that smells medicinal. The animist relationship with the land runs to practical knowledge — they know what heals and they share it without hesitation.'+healNote;
    if(tTraits.ritual === 'totem') return 'A ceremony precedes the aid — brief, structured, each action tied to a totem gesture. Then water, food, and wound treatment. The ritual was not optional. The help that follows it is genuine.'+healNote;
    if(tTraits.structure === 'chieftain') return 'The chieftain directs the aid personally. Water, shelter, and attention to wounds — done efficiently, under authority. This is a favour that will be remembered.'+healNote;
    if(tTraits.structure === 'council') return 'The council organises the response collectively. Several people work at once — water from one direction, materials from another, a designated space cleared. Efficient in a distributed way.'+healNote;
    return 'They offer water, shelter, and a place to rest. It helps more than the instruments can measure.'+healNote;
  }
  const treated = treatment.treated ? ' '+treatment.treated+' harmful condition'+(treatment.treated===1?' is':'s are')+' treated.' : '';
  return 'They provide field dressings, directions, and access to local medical resources.'+(treatment.healed ? ' Crew injuries recover by '+treatment.healed+' total HP.' : '')+treated;
}

function civilizationDialogueAttackTarget(ctx){
  const key = ctx?.planetKey || G.curPlanet;
  const locals = (G.enemies?.[key] || []).filter(e=>e.alive && !e.hidden && e.civLocal);
  if(ctx?.local && ctx.local.alive) return ctx.local;
  const adjacent = locals
    .filter(e=>Math.max(Math.abs(e.x-(G.player?.x||0)), Math.abs(e.y-(G.player?.y||0))) <= 1)
    .sort((a,b)=>Math.max(Math.abs(a.x-G.player.x),Math.abs(a.y-G.player.y)) - Math.max(Math.abs(b.x-G.player.x),Math.abs(b.y-G.player.y)));
  if(adjacent.length) return adjacent[0];
  return locals
    .filter(e=>canSeePlanetTile(e.x, e.y))
    .sort((a,b)=>(Math.abs(a.x-G.player.x)+Math.abs(a.y-G.player.y)) - (Math.abs(b.x-G.player.x)+Math.abs(b.y-G.player.y)))[0] || null;
}

function attackCivilizationFromDialogue(ctx){
  const wrap = dialogueCivilization();
  if(!wrap) return;
  const target = civilizationDialogueAttackTarget(ctx);
  const kind = ctx?.contactKind || (ctx?.isLocal ? 'local' : 'settlement');
  const attacksSettlement = kind === 'settlement';
  const attacksDelegation = kind === 'delegation';
  if(attacksSettlement){
    awardCivilizationLoot(wrap, 'Spoils seized in the attack');
  }
  makeCivilizationHostile(wrap.pdata, 'Responding to crew violence');
  if(attacksSettlement || attacksDelegation){
    const origin = { x:ctx?.x, y:ctx?.y };
    ensureCivilizationLocals(ctx?.planetKey || G.curPlanet);
    spawnCivilizationAssaultResponse(wrap.pdata, origin);
    if(attacksSettlement) ruinCivilizationSettlement(wrap.pdata, origin, 'attacked by away team');
  }
  addLog('Contact collapses into violence. The civilization is hostile.','lc');
  G.dialogue = null;
  if(target){
    doCombat(target);
    return;
  }
  G.turn++;
  moveEnemies();
  processPlanetHazards();
  checkDeath();
  renderAll();
}

function civGreetingDc(wrap){
  if(!wrap?.civ) return 6;
  let dc = ({ primitive:5, tribal:6, medieval:7, industrial:7, information:8 })[wrap.civ.tier] || 6;
  // Primitive trait modifiers to greeting difficulty
  if(wrap.civ.tier === 'primitive'){
    const traits = wrap.civ.traits || {};
    if(traits.curiosity === 'isolated') dc += 2;
    if(traits.curiosity === 'curious')  dc -= 1;
    if(traits.diet === 'carnivore')     dc += 1;
    if(traits.social === 'collective')  dc += 1; // harder — must satisfy the whole group
    if(traits.honor === 'honor')        dc += 1; // they have protocols
  }
  return dc;
}

function civIntimidateDc(wrap){
  if(!wrap?.civ) return 8;
  let dc = ({ primitive:5, tribal:6, medieval:8, industrial:9, information:10 })[wrap.civ.tier] || 8;
  if(wrap.civ.aggression === 'Territorial') dc += 2; // territorial civs defend ground
  if(wrap.civ.tier === 'primitive'){
    const traits = wrap.civ.traits || {};
    if(traits.diet === 'carnivore')     dc += 2; // predators answer displays
    if(traits.social === 'collective')  dc += 1; // group backs each other
    if(traits.honor === 'honor')        dc += 1; // backing down is shameful
    if(traits.curiosity === 'isolated') dc -= 1; // they just want you gone
  } else {
    const t = wrap.civ.traits || {};
    if(t.disposition === 'proud')      dc += 2; // will not yield without a fight
    if(t.disposition === 'wary')       dc += 1; // distrustful — reads threats as confirmation
    if(t.governance === 'theocratic')  dc += 1; // ideological backbone
    if(t.economy === 'state')          dc += 1; // state apparatus backs defenders
    if(t.economy === 'cooperative')    dc -= 1; // prefers de-escalation
    if(t.bureaucracy === 'flexible')   dc -= 1; // can yield tactically
    if(t.policy === 'open')            dc -= 1; // less trigger-happy
  }
  return dc;
}

function civBreakOffRisk(wrap){
  if(!wrap?.civ) return 0.25;
  if(wrap.civ.aggression === 'Passive' && (wrap.civ.tier === 'industrial' || wrap.civ.tier === 'information')) return 0;
  let risk = ({ primitive:0.1, tribal:0.18, medieval:0.28, industrial:0.38, information:0.48 })[wrap.civ.tier] ?? 0.25;
  if(wrap.civ.aggression === 'Passive')     risk -= 0.12;
  if(wrap.civ.aggression === 'Territorial') risk += 0.20; // they don't want you leaving without answering
  if(wrap.civ.aggression === 'Hostile')     risk += 0.25;
  // Primitive trait modifiers
  if(wrap.civ.tier === 'primitive'){
    const traits = wrap.civ.traits || {};
    if(traits.diet === 'carnivore')     risk += 0.12;
    if(traits.curiosity === 'isolated') risk -= 0.08;
    if(traits.honor === 'honor')        risk += 0.08;
    if(traits.social === 'collective')  risk += 0.06;
  } else {
    const t = wrap.civ.traits || {};
    if(t.disposition === 'proud')      risk += 0.10;  // leaving without answering is an insult
    if(t.governance === 'theocratic')  risk += 0.08;  // departing before ritual exchange is complete
    if(t.governance === 'mercantile')  risk -= 0.06;  // they let people leave to come back as buyers
    if(t.bureaucracy === 'strict')     risk += 0.08;  // unresolved contact is a breach
    if(t.bureaucracy === 'flexible')   risk -= 0.06;
    if(t.policy === 'restrictive')     risk += 0.10;
    if(t.policy === 'open')            risk -= 0.06;
  }
  if((wrap.state?.alert || 0) >= 4) risk += 0.1;
  if((wrap.state?.relation || 0) >= 4) risk -= 0.08;
  // Boundary promise in place: they're more willing to let you leave if you've committed
  if(wrap.state?.boundaryPromise?.active && !wrap.state?.boundaryPromise?.broken) risk -= 0.12;
  return Math.max(0.03, Math.min(0.85, risk));
}

function civHostilityRisk(wrap){
  if(!wrap?.civ) return 0.2;
  let risk = 0.08 + (wrap.state?.alert || 0) * 0.11;
  if(wrap.civ.aggression === 'Passive')     risk -= 0.12;
  if(wrap.civ.aggression === 'Territorial') risk += 0.18; // territorial = jumpy, high stakes
  if(wrap.civ.aggression === 'Hostile')     risk += 0.28;
  // Primitive trait modifiers to hostility escalation
  if(wrap.civ.tier === 'primitive'){
    const traits = wrap.civ.traits || {};
    if(traits.diet === 'carnivore')     risk += 0.10;
    if(traits.diet === 'herbivore')     risk -= 0.08;
    if(traits.curiosity === 'curious')  risk -= 0.06;
    if(traits.curiosity === 'isolated') risk += 0.08;
    if(traits.honor === 'honor')        risk += 0.05;
    if(traits.social === 'collective')  risk += 0.04;
  } else {
    const t = wrap.civ.traits || {};
    if(t.disposition === 'proud')      risk += 0.08;  // insults escalate fast
    if(t.disposition === 'pragmatic')  risk -= 0.06;  // prefers de-escalation
    if(t.governance === 'theocratic')  risk += 0.06;  // outsiders trigger doctrinal alarm
    if(t.bureaucracy === 'strict')     risk += 0.07;  // protocol violations escalate
    if(t.bureaucracy === 'flexible')   risk -= 0.05;
    if(t.economy === 'cooperative')    risk -= 0.05;
    if(t.policy === 'restrictive')     risk += 0.08;
    if(t.policy === 'open')            risk -= 0.06;
    if(t.media === 'transparent')      risk -= 0.04;  // public scrutiny deters aggression
  }
  if((wrap.state?.relation || 0) < 0) risk += 0.12;
  if((wrap.state?.relation || 0) >= 4) risk -= 0.08;
  if(isLocalContact()) risk -= 0.05;
  // Boundary promise observed: they trust the crew more, lower hostility chance
  if(wrap.state?.boundaryPromise?.active && !wrap.state?.boundaryPromise?.broken) risk -= 0.10;
  return Math.max(0.02, Math.min(0.95, risk));
}

function civContactScenarioProfile(wrap){
  const civ = wrap?.civ || {};
  const state = wrap?.state || {};
  const hostile = civ.aggression === 'Hostile' || (state.alert || 0) >= 4;
  const territorial = civ.aggression === 'Territorial';
  const high = civ.tier === 'industrial' || civ.tier === 'information';
  const isPrim = civ.tier === 'primitive';
  const traits = isPrim ? (civ.traits || {}) : {};
  const tribalTraits = civ.tier === 'tribal' ? (civ.traits || {}) : {};

  // Tone: for primitive, shaped by traits
  let tone;
  if(hostile){
    tone = isPrim && traits.diet === 'carnivore' ? 'predatory' : 'hostile';
  } else if(territorial){
    tone = isPrim && traits.diet === 'herbivore' ? 'nervous and defensive' : 'territorial';
  } else if(civ.aggression === 'Passive'){
    tone = isPrim && traits.curiosity === 'curious' ? 'cautious but interested' : 'cautious';
  } else {
    if(isPrim){
      tone = traits.curiosity === 'curious' ? 'curious and watchful'
           : traits.curiosity === 'isolated' ? 'closed and still'
           : traits.diet === 'carnivore' ? 'calculating'
           : 'guarded';
    } else {
      tone = civ.tier === 'tribal'
        ? tribalTraits.structure === 'council' ? 'watchful and deliberative'
        : tribalTraits.structure === 'chieftain' ? 'guarded under visible authority'
        : tribalTraits.ritual === 'ancestor' ? 'formal and suspicious'
        : 'guarded'
        : 'guarded';
    }
  }

  // Intent
  let intent;
  if(hostile){
    if(isPrim){
      intent = traits.diet === 'carnivore' ? 'deciding whether the crew is prey, rival, or something new'
             : traits.social === 'collective' ? 'closing as a group — a shared decision to drive the crew out'
             : 'pulling back while the most aggressive individual watches for a reason to act';
    } else {
      intent = high ? 'trying to contain the crew while backup or procedure catches up'
        : civ.tier === 'medieval' ? 'forming a defensive line and waiting for the crew to make the next mistake'
        : civ.tier === 'tribal' ? (()=>{ const tt=civ.traits||{}; return tt.structure==='chieftain'?'waiting for the chieftain\'s signal before deciding how to respond': tt.structure==='council'?'conferring among themselves — the group is deciding collectively whether to act': 'closing ranks around their boundary markers and watching for a reason to drive the crew off'; })()
        : 'pulling their people back while the boldest locals watch with open fear';
    }
  } else if(territorial){
    intent = isPrim ? 'reading whether the crew will stay clear of their territory or force a confrontation'
      : civ.tier === 'tribal'
      ? tribalTraits.ritual === 'ancestor' ? 'testing whether the crew will respect ancestor ground before any living bargain is possible'
      : tribalTraits.ritual === 'animist' ? 'testing whether the crew understands that the land itself is part of the boundary'
      : tribalTraits.structure === 'chieftain' ? 'testing whether the crew will yield to the chieftain\'s authority over this ground'
      : 'testing whether the crew will respect boundaries'
      : 'testing whether the crew will respect boundaries';
  } else if(civ.aggression === 'Passive'){
    intent = isPrim ? 'watching from a safe distance and waiting to see if the crew moves on'
      : civ.tier === 'tribal'
      ? tribalTraits.structure === 'council' ? 'trying to avoid panic while the elders decide how much contact to permit'
      : tribalTraits.ritual === 'totem' ? 'watching whether the crew can read the marker line before contact is offered'
      : 'trying to avoid panic while watching closely'
      : 'trying to avoid panic while watching closely';
  } else {
    if(isPrim){
      intent = traits.curiosity === 'curious' ? 'watching for a clear sign of intent before deciding anything'
             : traits.curiosity === 'isolated' ? 'waiting for the crew to leave their range'
             : traits.honor === 'honor' ? 'evaluating whether the crew is worth acknowledging at all'
             : 'watching and not yet committing to anything';
    } else {
      intent = 'watching and waiting for the crew to show intent';
    }
  }

  // Authority figures
  const tierAuthority = isPrim
    ? (traits.social === 'collective' ? 'a loose consensus of the most experienced hunters' : traits.honor === 'honor' ? 'a respected elder or ritual keeper' : 'whoever acted first')
    : ({
        tribal: tribalTraits.structure === 'chieftain' ? 'the chieftain and those waiting on that authority'
          : tribalTraits.structure === 'council' ? 'a council of elders and ritual keepers'
          : tribalTraits.structure === 'clan' ? 'clan heads, kin delegates, and boundary keepers'
          : 'delegates, elders, and taboo keepers',
        medieval:'bailiffs, priests, captains, or court envoys',
        industrial:'officials with procedure and armed backup',
        information:'coordinated state representatives with records and radios',
      }[civ.tier] || 'local representatives');

  const defenders = isPrim
    ? (traits.diet === 'carnivore' ? 'coordinated hunters in ambush formation'
     : traits.social === 'collective' ? 'the whole band, moving as one'
     : 'panicked individuals and fleeing families')
    : ({
        tribal: tribalTraits.structure === 'clan' ? 'clan warriors, scouts, and kin watching from separate marker lines'
          : tribalTraits.structure === 'chieftain' ? 'warriors with simple weapons waiting for the chieftain\'s signal'
          : tribalTraits.ritual === 'ancestor' ? 'warriors and taboo keepers standing between the crew and ancestor ground'
          : 'warriors with simple weapons and scouts',
        medieval:'guards, levy fighters, and alarm runners',
        industrial:'armed constables, soldiers, and evacuating civilians',
        information:'trained security, police, soldiers, cameras, and evacuation routes',
      }[civ.tier] || 'local defenders');

  const comprehension = civComprehension(civ, state);
  const relationText = civRelationMoodText(state, civ);
  const alertText = civAlertMoodText(state);
  const comprehensionText = comprehension === 'uncertain'
    ? (isPrim ? 'Language is entirely body-read at this range. Every movement is information — or misinformation.' : 'Language is mostly unclear, so body language and gifts carry the scene.')
    : comprehension === 'fragmentary' ? 'A few concepts translate, enough for warnings, names, and simple asks.'
    : comprehension === 'workable' ? 'The crew can hold a rough conversation and understand intent.'
    : 'The crew can discuss law, boundaries, motives, and consequences clearly.';

  // Outcome text blocks — primitive gets trait-specific versions
  const greetSuccess = isPrim
    ? (traits.diet === 'carnivore' ? 'The crew read as neither prey nor rival. A new category. That is the opening.'
     : traits.social === 'collective' ? 'The group settles. The crew passed whatever collective test was being run.'
     : traits.curiosity === 'curious' ? 'The unfamiliarity that was the problem is now the hook. They edge closer.'
     : traits.honor === 'honor' ? 'The gesture matched something they recognise as proper. A formal opening has been made.'
     : 'The approach read right. Not threatening, not submissive. Something in between that works here.')
    : high ? 'Permission to continue is controlled: observation, records, quarantine logic, or escort remain in play.'
    : civ.tier === 'tribal' ? (tribalTraits.structure === 'council'
      ? 'The council has not welcomed the crew, but it has accepted that contact may continue while everyone watches.'
      : tribalTraits.structure === 'chieftain'
      ? 'The chieftain permits the next exchange. That is not friendship, but it is an opening.'
      : tribalTraits.ritual === 'ancestor'
      ? 'The crew avoided the wrong ground and used the right restraint. That is enough for a formal opening.'
      : 'The approach read as guest-like rather than raider-like. That is the opening.')
    : territorial ? 'They tolerate contact only while boundaries are respected.'
    : 'There is a fragile opening for gifts, questions, and peaceful withdrawal.';

  const greetFailure = isPrim
    ? (traits.diet === 'carnivore' ? 'The crew read as either threat or weakness. Neither category ends well here.'
     : traits.social === 'collective' ? 'The group reacted before any individual could stay calm. That is how collective alarm works.'
     : traits.honor === 'honor' ? 'Something violated a social rule the crew could not have known existed. The break is read as insult.'
     : traits.curiosity === 'isolated' ? 'The approach was too direct. The space between them was not respected.'
     : 'The gesture landed wrong. Recovery is still possible but the window is smaller now.')
    : hostile ? 'The failure confirms their worst assumption.'
    : high ? 'Officials or security interpret the mistake as a protocol breach.'
    : civ.tier === 'tribal' ? (tribalTraits.structure === 'council'
      ? 'The mistake spreads through the council before anyone can soften it. Collective alarm has its own momentum.'
      : tribalTraits.structure === 'chieftain'
      ? 'The failure reflects on authority: wrong deference, wrong order, or a challenge to the chieftain.'
      : tribalTraits.ritual === 'ancestor'
      ? 'The breach touches ancestor law before anyone can translate it. Recovery will need visible respect.'
      : 'A boundary warning or demand to leave follows the mistake.')
    : territorial ? 'A boundary warning or demand to leave follows the mistake.'
    : 'Fear and confusion rise, but a repair gesture can still work.';

  return {
    tone, intent, tierAuthority, defenders, comprehensionText, relationText, alertText,
    greetSuccess, greetFailure,
    repairDifficulty: isPrim
      ? (traits.honor === 'honor' ? 'difficult — the insult must be visibly acknowledged'
       : traits.diet === 'carnivore' ? 'hard — weakness now reads as opportunity'
       : traits.curiosity === 'isolated' ? 'possible only if the crew stops advancing'
       : 'possible with a clear gesture of harmlessness')
      : civ.tier === 'tribal' ? (tribalTraits.structure === 'council' ? 'possible if the crew waits and lets the council reset the terms'
       : tribalTraits.structure === 'chieftain' ? 'possible if the crew visibly yields to the chieftain\'s authority'
       : tribalTraits.ritual === 'ancestor' ? 'difficult — the offended ground must be acknowledged, not explained away'
       : 'possible if the crew visibly yields ground')
      : hostile || high ? 'hard and likely tied to backing away or accepting escort'
      : territorial ? 'possible if the crew visibly yields ground'
      : 'fairly forgiving',
    intimidateSuccess: isPrim
      ? (traits.honor === 'honor' ? 'Dignity is offended but compliance follows — at a cost to future relation.'
       : traits.diet === 'carnivore' ? 'They read the display and recalculate. Grudging stand-down, nothing more.'
       : traits.social === 'collective' ? 'The group backs down together. The resentment is equally shared.'
       : 'They scatter or freeze. A short-term win.')
      : high ? 'High-tier civs rarely collapse; success buys a temporary stand-down or a coerced concession.'
      : civ.tier === 'tribal' ? (tribalTraits.structure === 'chieftain' ? 'The display forces a temporary stand-down, but it humiliates visible authority and will be remembered.'
       : tribalTraits.structure === 'clan' ? 'One clan edge gives ground first. The others follow reluctantly, and the resentment spreads unevenly.'
       : 'The display buys distance, not trust. Warriors step back while elders remember the threat.')
      : 'Lower-tier civs may scatter, submit tribute, or retreat from the encounter.',
    intimidateFailure: isPrim
      ? (traits.diet === 'carnivore' ? 'They answer the display with their own. This is a challenge now, not a contact.'
       : traits.honor === 'honor' ? 'The attempt is read as deeply offensive. Shame-driven escalation follows.'
       : traits.social === 'collective' ? 'The group emboldens each other. The individual who might have backed down no longer can.'
       : 'They refuse to submit and the alarm spreads.')
      : high ? 'They recognize bluster, call support, and may demand surrender, confiscation, or open fire.'
      : civ.tier === 'tribal' ? (tribalTraits.structure === 'chieftain' ? 'The threat is read as a challenge to the chieftain. Backing down is now harder for everyone.'
       : tribalTraits.structure === 'council' ? 'The threat gives the council a simple answer: the crew is dangerous.'
       : tribalTraits.ritual === 'ancestor' ? 'Threatening near ancestor ground turns fear into obligation. The defenders harden.'
       : 'They answer the threat with their own line of weapons and warning calls.')
      : hostile ? 'They answer the threat with their own threat or immediate attack.'
      : 'They refuse to be impressed and demand the crew leave.',
    breakoff: isPrim
      ? (traits.diet === 'carnivore' ? 'Departure may be tracked. Predator instinct reads flight as invitation.'
       : traits.curiosity === 'isolated' ? 'They will probably let the crew leave — that is what they wanted.'
       : traits.honor === 'honor' ? 'Leaving before the exchange is resolved is its own kind of insult.'
       : 'Departure is probably clean, but nothing is guaranteed.')
      : high ? 'They can track, radio, surround, or escort the crew; walking away should rarely be clean.'
      : civ.tier === 'tribal' ? (tribalTraits.structure === 'council' ? 'They may let the crew leave while the council decides what the retreat meant.'
       : tribalTraits.structure === 'chieftain' ? 'Departure is clean only if the chieftain allows it to be clean.'
       : tribalTraits.ritual === 'ancestor' ? 'Leaving ancestor ground may reduce danger; leaving before acknowledgement may not.'
       : 'They may allow departure if the crew moves away from restricted ground.')
      : hostile ? 'They are primed to interpret departure as evasion.'
      : territorial ? 'They may allow departure if the crew moves away from restricted ground.'
      : 'They are comparatively willing to let the crew go.',
    submission: isPrim
      ? (traits.honor === 'honor' ? 'Submission costs them face. They will produce something, but the debt is remembered.'
       : traits.social === 'collective' ? 'The group decision to submit is visible and humiliating. Expect hostility later.'
       : 'They yield whatever is at hand to make the threat go away.')
      : high ? 'Submission is rare and temporary; pressure creates compliance under duress, not helpless surrender.'
      : civ.tier === 'tribal' ? (tribalTraits.structure === 'chieftain' ? 'Submission undercuts the chieftain in public. Any tribute gained now will carry a long memory.'
       : tribalTraits.structure === 'clan' ? 'One clan may yield something to protect kin while another records the humiliation.'
       : 'Submission protects the settlement for the moment, while resentment settles into the social memory.')
      : territorial ? 'Submission means they concede something to protect the settlement, while resentment rises.'
      : 'Submission can unlock tribute or looting, but it damages relations.',
    localSuccess: isPrim
      ? (traits.curiosity === 'curious' ? 'They share path signs, danger marks, water sources — as much as the language gap allows.'
       : traits.honor === 'honor' ? 'They offer guidance on territory boundaries and what the crew must not touch.'
       : 'Small intelligence: where not to go, what makes noise, where the others are.')
      : high ? 'They point toward authorities, emergency services, or safe paths rather than personally negotiating.'
      : civ.tier === 'tribal' ? (tribalTraits.ritual === 'animist' ? 'They share path signs, water warnings, and living places the crew should avoid.'
       : tribalTraits.ritual === 'ancestor' ? 'They share boundary warnings and the places where the crew must not disturb memory ground.'
       : tribalTraits.structure === 'clan' ? 'They share small clan warnings: which marker belongs to whom, where not to stand, and who must be asked first.'
       : 'They can share small warnings, boundary signs, directions, or nearby dangers.')
      : 'They can share small warnings, fear, gossip, directions, or nearby dangers.',
    localFailure: isPrim
      ? (traits.diet === 'carnivore' ? 'They may call for others. The crew has drawn attention.'
       : traits.social === 'collective' ? 'Distress signals pass back to the group. More eyes will find the crew soon.'
       : traits.curiosity === 'isolated' ? 'They go rigid and give nothing away. The encounter is over.'
       : 'Fear is the main reaction. They back away or shout something that does not need translation.')
      : hostile ? 'They may shout, run, or signal defenders immediately.'
      : high ? 'They may call for help or retreat behind procedure.'
      : civ.tier === 'tribal' ? (tribalTraits.structure === 'chieftain' ? 'They may signal toward the chieftain and refuse to answer further.'
       : tribalTraits.structure === 'council' ? 'They may retreat into group silence until elders decide whether the crew deserves another answer.'
       : tribalTraits.ritual === 'ancestor' ? 'They may treat the failed exchange as taboo breach and give nothing away.'
       : 'Fear and confusion are the main reaction.')
      : 'Fear and confusion are the main reaction.',
  };
}

function civContactGoesHostile(wrap, reason){
  if(!wrap) return false;
  makeCivilizationHostile(wrap.pdata, reason || 'Contact failure escalated');
  if(!isLocalContact()){
    ensureCivilizationLocals(G.dialogue?.context?.planetKey || G.curPlanet);
    spawnCivilizationAssaultResponse(wrap.pdata, { x:G.dialogue?.context?.x, y:G.dialogue?.context?.y });
  }
  return true;
}

function clearCivilizationInterceptIntents(pdata){
  const key = Object.keys(G.planets || {}).find(k=>G.planets[k] === pdata) || G.curPlanet;
  const isPrim = pdata?.civilization?.tier === 'primitive';
  (G.enemies?.[key] || []).forEach(e=>{
    if(e?.civLocal && !e.currentlyHostile && !e.hostileByDefault && e.intent === 'Attempting to intercept the away team'){
      e.intent = isPrim ? 'Moving through territory' : 'Moving between settlement structures';
      e.civDest = null;
    }
  });
}

function civTakeTributeFromCrew(wrap, reason){
  if(!wrap) return null;
  const candidates = alienGiftCandidates();
  const taken = candidates.length ? candidates[0] : null;
  if(taken){
    const item = taken.item;
    G.inventory.splice(taken.idx, 1);
    addLog((reason || 'Tribute surrendered')+': '+(item.name || 'unknown item')+'.','lw');
    return item;
  }
  wrap.state.alert = Math.min(5, (wrap.state.alert||0) + 2);
  wrap.state.relation = Math.max(-10, (wrap.state.relation||0) - 1);
  addLog('No suitable tribute is available. The locals read the empty hands as refusal.','lw');
  return null;
}

function civAskAboutCivilizationText(wrap){
  if(!wrap) return 'No answer comes.';
  const civ = wrap.civ, state = wrap.state;
  civGainLanguage(state, (hasScientist() ? 1 : (Math.random()<0.35 ? 1 : 0)));
  const s = civ.species, sl = s.toLowerCase();
  const aggr = civ.aggression || 'Passive';
  const comp = civComprehension(civ, state);

  // ── Language too poor to learn anything useful ────────────────────────────
  if(comp === 'uncertain'){
    const isPrim = civ.tier === 'primitive';
    if(isPrim){
      const traits = civ.traits || {};
      if(traits.curiosity === 'curious') return 'They gesture back — emphatic, layered, pointing in several directions. Something is being communicated. None of it resolves into meaning.';
      if(traits.diet === 'carnivore') return 'Sound and posture. The direction of their attention, the set of their weight. The crew can read none of it as language.';
      return 'They respond with movement and sound. None of it crosses the gap. Without more shared ground, this is just watching each other.';
    }
    return 'The exchange produces noise in both directions. Without a better handle on the language, none of it becomes information.';
  }

  if(comp === 'fragmentary'){
    const isPrim = civ.tier === 'primitive';
    if(isPrim){
      const traits = civ.traits || {};
      if(traits.curiosity === 'curious') return 'Fragments: territory markers, the direction of water, something repeated that might mean danger or stranger — it is unclear which. The crew gets the shape of a world but not its contents.';
      if(traits.diet === 'carnivore') return 'Hunting ground. Rival bands. A direction that means threat. The rest is closed off by language.';
      if(traits.social === 'collective') return 'Several voices, overlapping. The crew catches: group, ground, ours. The meaning behind those fragments is not accessible yet.';
      return 'Impressions only: territory, water, something dangerous to the east. Not enough to build on, but not nothing.';
    }
    if(civ.tier === 'tribal'){
      const tt = civ.traits || {};
      if(tt.ritual === 'animist') return '"...ground... alive... you disturb..." — the shape is clear but the specific meaning is not through yet.';
      if(tt.ritual === 'ancestor') return '"...not sanctioned... ancestors watching..." — the structure is there but the exact expectation is not clear.';
      if(tt.structure === 'chieftain') return '"...chieftain... decides... wait..." — something is being deferred upward.';
      return '"...boundary... our ground... not enter..." — the structure is there but most of it is not coming through yet.';
    }
    if(civ.tier === 'medieval') return 'Fragments of rank, authority, a warning. The crew catches enough to know there is a social order here, but not enough to navigate it.';
    return '"...identity... authorisation... prohibited..." — the channel is open but the vocabulary is not.';
  }

  // ── Workable or better — full responses ───────────────────────────────────
  const lines = {
    primitive:(()=>{
      const traits = civ.traits || {};
      const { diet, social, curiosity, honor } = traits;
      if(curiosity === 'curious') return 'The answer is gesture pointing: hunting paths, water, sky, ship. They want to understand as much as explain. Their territory is small but they have mapped it precisely — every water source, every danger, every rival band\'s edge.';
      if(curiosity === 'isolated') return 'They communicate boundary and ownership. Territory, direction, danger. The message is clear: this space is theirs. Strangers are a category they have a word for, and it is not a comfortable one.';
      if(diet === 'carnivore') return 'Hunting ground, prey routes, rival bands, danger zones. Everything is mapped around what hunts and what is hunted. They are not farming — they are managing an ecosystem they understand better than any map.';
      if(social === 'collective') return 'The answer comes from several of them at once: group memory, shared territory, collective ownership. No single authority. Decisions seem to flow laterally through the group without a visible leader calling anything.';
      if(honor === 'honor') return 'The gestures are formal: marked ground, sworn paths, objects that cannot be touched. Obligation structures this group more than fear does. What they owe each other has weight.';
      return 'Hunting paths, fire sites, water sources, and danger zones. The crew gets a rough map of their world — what they protect, what they avoid, and what they consider theirs.';
    })(),
    tribal: pick([
      civ.traits?.structure === 'chieftain'
        ? 'The answer keeps returning to the chieftain: who may speak, who may grant passage, which debts belong to the leader and which belong to the settlement. Authority here is personal, visible, and heavy.'
        : civ.traits?.structure === 'council'
        ? 'They describe decision as a shared act. Elders, kin heads, and ritual keepers each hold part of the answer, so the '+sl+' polity moves slowly but remembers why it moved.'
        : 'Clans, marriage ties, boundary markers, and old obligations. The '+sl+' settlement has more layers than its size suggests, and each clan reads the crew through its own debts.',
      civ.traits?.ritual === 'animist'
        ? 'They describe the settlement through living places: water that must be greeted, trees that hold warning, stones that mark permission. Their politics and ecology are not separate categories.'
        : civ.traits?.ritual === 'ancestor'
        ? 'They describe the founding story through named dead: migrations, disputes, and promises that living leaders still obey. Authority traces backward before it points forward.'
        : 'They explain the totems as map, law, and memory at once. The poles do not decorate territory; they make territory legible.',
      'Trade routes, neighbouring bands, seasonal movements. The '+sl+' are part of a regional network. This settlement is not isolated — there are others, and relations between them are complicated.',
    ]),
    medieval: pick([
      'Rulers, guilds, guard rotations, market law, old feuds, and older debts. The '+sl+' settlement operates on written obligation — contract, rank, and inherited position. The crew is talking to a polity, not a village.',
      'The '+sl+' describe three things unprompted: who holds authority, what is forbidden, and what the current dispute is. There is always a current dispute. The crew has arrived in the middle of one.',
      'Guild structure governs most of the skilled trades. Membership is inherited or purchased — mostly inherited. The guards answer to civic authority, not the guilds, but the distinction blurs around tax collection.',
    ]),
    industrial: pick([
      'Jurisdiction, factory quotas, quarantine protocol, civic authority. The '+sl+' run a managed state: resources are tracked, movement is logged, and the crew\'s presence has already generated a file somewhere.',
      'Labour contracts, production targets, shift allocation. The '+sl+' economy is centrally organised at a tier above what the crew can see from street level. The workers explain what they are allowed to explain.',
      'The '+sl+' describe their government in procedural terms: departments, regulations, approval chains. There is no king or chief — authority is distributed across institutions that answer to each other in a cycle that seems stable, if slow.',
    ]),
    information: pick([
      'A compact civic profile arrives, formatted for outside consumption: government structure, health protocols, contact law, immediate site restrictions. The '+sl+' have done this before. There is a procedure and they are following it.',
      'The contact officer explains the legal status of the crew\'s presence in careful terms: unauthorised landing, provisional tolerance, conditions for continued contact, and the name of the authority who can escalate if those conditions are violated.',
      'They describe a media situation. The crew\'s ship has been identified and categorised. Several '+sl+' publications are already running coverage. The contact officer\'s job is partly to ensure those publications get the right version of events.',
    ]),
  };
  return lines[civ.tier] || lines.tribal;
}

function civFirstContactText(ctx){
  const wrap = dialogueCivilization();
  if(!wrap) return 'No signal.';
  const prof = civContactScenarioProfile(wrap);
  const pressure = '\n\nThey are '+prof.intent+'. The people speaking for them seem to be '+prof.tierAuthority+'.\n'
    +prof.relationText+' '+prof.alertText+' '+prof.comprehensionText;
  // Territorial: the opening line is a confrontation, not an observation
  if(wrap.civ.aggression === 'Territorial'){
    const territorial = civTerritorialOpeningText(wrap.civ, isLocalContact());
    return territorial+pressure;
  }
  if(isDelegationContact()) return civDelegationApproachText(wrap.civ)+pressure;
  if(isLocalContact()) return civApproachText(wrap.civ, wrap.state, true)+pressure;
  return civApproachText(wrap.civ, wrap.state, false)+pressure;
}

function civTerritorialOpeningText(civ, isLocal){
  const species = civ.species;
  const tier = civ.tier;
  if(tier === 'primitive'){
    const traits = civ.traits || {};
    if(isLocal){
      if(traits.diet === 'carnivore') return 'The '+species+' does not back away. They hold position directly in the crew\'s path — close enough to be clear about what it means.';
      if(traits.social === 'collective') return 'One '+species+' stands in front, but the others behind make the message: this is a group decision and the crew has walked into it.';
      return 'The '+species+' holds their ground. No weapons. No flight. Just a body in the way and eyes that say: not here, not further.';
    }
    if(traits.honor === 'honor') return 'The group has positioned between the crew and something important. The posture says this is a formal challenge, not a panicked response.';
    if(traits.diet === 'carnivore') return 'The group has spread in a shallow arc facing the crew. Not encircling — announcing. The territory line is here.';
    return 'The '+species+' group has stopped moving and is facing the crew. Every one of them. The message needs no translation: this is where the crew stops.';
  }
  // Aquatic territorial — uses pressure, sound and bioluminescence instead of land gestures
  if(species === 'Aquatic'){
    if(isLocal){
      if(tier === 'tribal')   return 'A single '+species+' sweeps into the crew\'s current path and holds there, body angled sideways. A burst of deep red bioluminescence pulses once from the flanks — not language, not yet. A boundary.';
      if(tier === 'medieval') return 'An armoured '+species+' cuts across the crew\'s path and halts. A short-range acoustic burst follows — not a weapon discharge, a formal challenge tone. Identifiable by its regularity.';
      if(tier === 'industrial') return 'The '+species+' official extends a device and activates it. A containment perimeter signal has been broadcast. \"Restricted zone. Identify or withdraw.\" The message arrived before the gesture finished.';
      return 'The '+species+' ahead has gone still in a way that is not passive. A perimeter alert tag has been transmitted to every device in range. \"Unauthorised entry. Identify or withdraw.\"';
    }
    if(tier === 'tribal')   return 'A cluster of '+species+' have placed themselves between the crew and the settlement, holding formation in the water column. A rhythmic pressure-pulse — low, regular — is being broadcast outward. The boundary is being announced.';
    if(tier === 'medieval') return 'A ranked patrol has moved to intercept. The acoustic challenge that precedes them has a structured pattern: identity, purpose, authorisation. They are waiting for the answer in that order.';
    if(tier === 'industrial') return 'A security response unit is positioned in a containment arc. The broadcast is already running: \"Territorial boundary violation. State vessel registration and entry purpose. Failure to respond is escalation.\"';
    return 'A formal interdiction signal was transmitted to the ship at the moment the crew entered the zone. This is the follow-up: several '+species+' in official markings, recording equipment live. \"Identify or withdraw. This is your first notice.\"';
  }
  const lines = {
    tribal: (()=>{ const t=civ.traits||{};
      if(isLocal){
        if(t.structure==='chieftain') return 'A marked '+species+' warrior blocks the path, then looks back once toward the chieftain before driving the butt of their weapon into the ground. The line is authorised.';
        if(t.structure==='council') return 'Two elders and a warrior move together to block the path. No one speaks alone. The line has been drawn by agreement.';
        if(t.ritual==='ancestor') return 'A '+species+' steps between the crew and the ancestor markers. The weapon is lowered, but the offence is already present in the posture.';
        if(t.ritual==='animist') return 'A '+species+' blocks the path at a living marker of branches and stone. The message is not only "ours" but "not to be disturbed."';
        return 'The '+species+' warrior blocks the path and drives the butt of their weapon into the ground. A line has been drawn.';
      }
      if(t.structure==='chieftain') return 'A marked '+species+' figure steps forward with others waiting behind them. "The chieftain will hear why you crossed our ground. Speak carefully."';
      if(t.structure==='council') return 'Several '+species+' step forward together. "You stand before our council ground. Explain yourself before we decide what you are."';
      if(t.ritual==='ancestor') return 'A marked '+species+' figure steps forward without welcome. "You walk where our dead are named. Explain yourself before the living answer for them."';
      if(t.ritual==='animist') return 'A marked '+species+' figure points to the ground, then the trees, then the crew. "This place is alive to us. Why have you disturbed it?"';
      return 'A marked '+species+' figure steps forward without ceremony. "You are in our territory. Explain yourself before we decide what to do with you."';
    })(),
    medieval: isLocal
      ? 'The guard levels a weapon at the crew\'s lead. "Stop. State your business or turn around."'
      : 'The patrol captain steps forward. "This land belongs to the '+species+' crown. You have entered without permission. Speak — or be removed."',
    industrial: isLocal
      ? 'The official holds up an identification card and a stop gesture simultaneously. "Restricted zone. Identify yourselves."'
      : 'A security cordon has formed. The supervisor\'s first words are not a greeting: "You are in violation of territorial boundary ordinance. State your vessel and purpose immediately."',
    information: isLocal
      ? 'The '+species+' ahead has transmitted a perimeter alert and is waiting. The message accompanying it: "Unauthorised entry. Identify or withdraw."'
      : 'A formal interdiction notice was transmitted to the ship the moment the crew left it. This is the follow-up: "This zone is under '+species+' sovereignty. Departure or identification. Choose."',
  };
  return lines[tier] || 'The '+species+' group has blocked the approach. This is a challenge, not a greeting.';
}

function alienGiftDialogueOptions(){
  const gifts = alienGiftCandidates();
  if(!gifts.length) return [
    { label:'No suitable gifts', disabled:true },
    { label:'Back', next:'root' },
  ];
  const opts = gifts.slice(0, 12).map(entry=>{
    const item = entry.item;
    const value = item.value ? ' · trade value '+item.value : '';
    return {
      label:'Offer '+(item.name || 'Unknown Item')+value,
      effect:ctx=>offerAlienGift(ctx, entry.idx),
      next:'gift_given',
    };
  });
  opts.push({ label:'Back', next:'root' });
  return opts;
}

function bestCrewSkill(skill){
  return (G.crew||[]).filter(c=>c.hp>0).reduce((best,c)=>Math.max(best, crewSkillValue(c, skill)), 0);
}

function dialogueTextFromTopic(c, topic){
  if(!c) return '"Nobody answers."';
  return crewDialogueLine(c, topic);
}

function dialogueAlien(){
  const dlg = G?.dialogue;
  if(!dlg || dlg.id !== 'alien_contact') return null;
  const key = dlg.context?.planetKey;
  return (G.enemies?.[key] || []).find(e=>e.alive && e.uid===dlg.context?.enemyUid) || null;
}


