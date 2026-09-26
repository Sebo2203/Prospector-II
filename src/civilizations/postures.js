// ── POSTURE OPTION BUILDER ─────────────────────────────────────────────────
// Returns behavioral posture options appropriate to the situation.
// No DC numbers shown. Labels describe what the crew DOES, not what they want.

function civPostureOptions(wrap, ctx){
  const civ = wrap.civ, state = wrap.state;
  const isPrim = civ.tier === 'primitive';
  const traits = isPrim ? (civ.traits || {}) : {};
  const territorial = civ.aggression === 'Territorial';
  const isBlind = civIsBlind(wrap);
  const alert = state.alert || 0;
  const relation = state.relation || 0;
  const contacted = state.contacted;
  const mems = state.memories || [];
  const hadApproach       = mems.some(m=>m.event==='approach');
  const hadApproachFail   = mems.some(m=>m.event==='approach_fail');
  const hadIntimidated    = mems.some(m=>m.event==='intimidated');
  const hadBoundary       = mems.some(m=>m.event==='boundary_accepted');
  const hadRetreat        = mems.some(m=>m.event==='crew_retreated');
  const hadGiftGiven      = (state.giftsReceived||0) > 0;
  const hadKnowledge      = mems.some(m=>m.event==='knowledge_shared');

  // Attack — always available except when already hostile (handled in root)
  const attackOpt = { label:civilizationAttackLabel(), action:'attack_civ', style:'danger' };

  // ── Already contacted — return visit ─────────────────────────────────────
  if(contacted){
    const opts = [];
    const vs = civVisitState(wrap);
    const askDone   = !!(vs?.askCivilizationDone);
    const shareDone = !!(vs?.shareKnowledgeDone);
    const langDone  = !!(vs?.languageAnalysisDone);

    if(alert < 3){
      const patientLabel = civ.tier === 'industrial' ? 'Observe from a neutral position'
        : civ.tier === 'information' ? 'Hold position and watch the settlement'
        : (hadApproach ? 'Sit close — as before' : 'Sit with them a while');
      opts.push({ label: patientLabel, next:'pst_patient' });
    }

    if(isPrim){
      if(traits.curiosity==='curious' || relation >= 1)
        opts.push({ label: hadGiftGiven ? 'Hold something up again' : 'Hold something up — don\'t offer it yet', next:'pst_show_object' });
      if(alert < 4){
        const giftLabel = hadGiftGiven
          ? (traits.honor==='honor' ? 'Bring another offering' : 'Offer something again')
          : (traits.honor==='pragmatic' ? 'Offer something useful' : 'Offer something tangible');
        opts.push({ label:giftLabel, disabled:!canOfferAlienGift(), disabledReason:'nothing to offer', next:'gift_select' });
      }
      if(alert >= 2) opts.push({ label:'Yield ground to lower tension', next:'pst_yield' });
      if(relation >= 1 && !wrap.state.landGestureLangDone) opts.push({ label:'Gesture toward the land', next:'pst_land_gesture' });
      if(!shareDone) opts.push({ label:'Share star positions', disabled:!hasScientist(), disabledReason:'no scientist', next:'share_knowledge' });
      if(!langDone) opts.push({ label:'Have scientist study their patterns', disabled:!hasScientist()||!civCanAnalyzeLanguage(wrap), disabledReason:()=>!hasScientist()?'no scientist':'not applicable', next:'scientist_analyse' });
      const giftsForAid = territorial ? 2 : 1;
      if(relation >= civRelationThreshold(wrap,2) && !state.aidGiven && (state.giftsReceived||0) >= giftsForAid) opts.push({ label:'Ask for water and shelter', next:'aid' });
      if(relation >= civRelationThreshold(wrap,3) && !state.guidanceUsed && (state.giftsReceived||0) >= giftsForAid) opts.push({ label:'Ask what they know about this area', next:'positive_guidance' });

    } else {
      // Non-primitive tiers
      const tier = civ.tier;
      if(alert >= 2) opts.push({ label:'Yield ground to lower tension', next:'pst_yield' });
      if(!askDone){
        const comp2 = civComprehension(civ, state);
        const askLabel = comp2 === 'uncertain'   ? 'Ask about them  [language unknown]'
                       : comp2 === 'fragmentary' ? 'Ask about them  [fragments only]'
                       : 'Ask about them';
        opts.push({ label:askLabel, next:'ask_civilization' });
      }
      if(!shareDone) opts.push({ label:'Share navigation data', disabled:!hasScientist(), disabledReason:'no scientist', next:'share_knowledge' });
      if(!langDone) opts.push({ label:'Analyse their speech patterns', disabled:!hasScientist()||!civCanAnalyzeLanguage(wrap), disabledReason:()=>!hasScientist()?'no scientist':'not applicable', next:'scientist_analyse' });
      opts.push({ label:'Exchange goods', disabled: alert >= 4 && !state.tradeUnlocked, disabledReason:'too tense', next:'trade' });
      if(relation >= civRelationThreshold(wrap,2) && !state.aidGiven) opts.push({ label:tier === 'industrial' || tier === 'information' ? 'Request emergency support' : 'Request aid', next:'aid' });
      if(relation >= civRelationThreshold(wrap,3) && !state.guidanceUsed) opts.push({ label:tier === 'information' ? 'Request a local area survey' : tier === 'industrial' ? 'Ask for a site overview' : 'Ask what they know about this area', next:'positive_guidance' });
      if(relation >= civRelationThreshold(wrap,3) && state.safeConductUnlocked && !state.permitGranted && ['medieval','industrial','information'].includes(tier)){
        opts.push({ label:tier === 'information' ? 'Request visitor clearance' : tier === 'industrial' ? 'Request controlled access corridor' : 'Request safe conduct', next:'positive_permit' });
      }
      if(state.permitGranted && state.boundaryPromise?.active && !state.boundaryLifted && relation >= 8){
        opts.push({ label: tier === 'information' ? 'Request full freedom of movement' : tier === 'industrial' ? 'Request full access — no perimeter' : 'Ask for the restriction to be lifted entirely', next:'boundary_lift_attempt' });
      }
      if(tier==='medieval' && relation >= 1 && !askDone)
        opts.push({ label:'Request safe passage', next:'intent' });
      if(tier==='information' && relation >= 1 && !vs?.tierRouteDone)
        opts.push({ label:'Request formal documentation', next:'tier_route_success' });
    }

    opts.push({ label: hadRetreat ? 'End contact again' : 'End contact for now', action:'close' });
    if(relation >= -2) opts.push({ label: hadIntimidated
      ? civilizationThreatLabel('Threaten again','Threaten again with bare fists')
      : civilizationThreatLabel('Threaten them','Threaten them with bare fists'), next:'hostile_menu' });
    opts.push(attackOpt);
    return opts;
  }

  // ── First contact — territorial ───────────────────────────────────────────
  if(territorial){
    const tier = civ.tier;
    if(tier === 'primitive'){
      return [
        { label:'Stop and hold still', next:'territorial_accept_demand' },
        { label:'Hold eye contact and advance slowly', next:'pst_hold_ground' },
        { label:'Back away slowly', next:'first_breakoff' },
        { label:civilizationThreatLabel('Raise a weapon','Raise bare fists'), next:'first_intimidate_attempt' },
        attackOpt,
      ];
    }
    if(tier === 'tribal'){
      const tt = civ.traits || {};
      return [
        { label:tt.ritual==='ancestor' ? 'Stop before the ancestor markers' : tt.ritual==='animist' ? 'Stop before the living boundary' : 'Stop at the boundary markers', next:'territorial_accept_demand' },
        { label:tt.structure==='chieftain' ? 'Address the chieftain from the marker line  [SOC]' : tt.structure==='council' ? 'Wait for the council and request permission  [SOC]' : 'Ask permission through gesture and posture  [SOC]', next:'pst_formal_intro' },
        { label:tt.ritual==='totem' ? 'Leave a gift by the totem line and step back' : 'Leave a gift and step back', disabled:!canOfferAlienGift(), disabledReason:'nothing to offer', next:'gift_select' },
        { label:tt.ritual==='ancestor' ? 'Step past the ancestor marker' : 'Push past the marker line', next:'pst_hold_ground' },
        { label:civilizationThreatLabel('Raise a weapon','Raise bare fists'), next:'first_intimidate_attempt' },
        attackOpt,
      ];
    }
    if(tier === 'medieval'){
      return [
        { label:'Halt and request safe conduct', next:'territorial_accept_demand' },
        { label:'State banner, captain, and purpose  [SOC check]', next:'pst_formal_intro' },
        { label:'Withdraw beyond the roadblock', next:'first_breakoff' },
        { label:'Ignore the order and advance', next:'pst_hold_ground' },
        { label:'Threaten the patrol', next:'first_intimidate_attempt' },
        attackOpt,
      ];
    }
    if(tier === 'industrial'){
      return [
        { label:'Stop and submit identification', next:'territorial_accept_demand' },
        { label:'Transmit vessel ID and bio-safety assurance  [SOC check]', next:'pst_formal_intro' },
        { label:'Withdraw to quarantine distance', next:'first_breakoff' },
        { label:'Refuse the cordon and hold position', next:'pst_hold_ground' },
        { label:civilizationThreatLabel('Display weapons to security','Raise bare fists at security'), next:'first_intimidate_attempt' },
        attackOpt,
      ];
    }
    if(tier === 'information'){
      return [
        { label:'Comply with landing-zone restrictions', next:'territorial_accept_demand' },
        { label:'Transmit crew ID, origin, and intent  [SOC check]', next:'pst_formal_intro' },
        { label:'Request a formal contact protocol', next:'first_breakoff' },
        { label:'Walk away from the landing zone', next:'info_landing_zone_breach' },
        { label:civilizationThreatLabel('Refuse compliance and show weapons','Refuse compliance with fists raised'), next:'first_intimidate_attempt' },
        attackOpt,
      ];
    }
  }

  // ── First contact — primitive ─────────────────────────────────────────────
  const opts = [];

  if(isPrim){
    opts.push({ label:'Watch them without moving', next:'pst_observe' });
    if(traits.diet === 'carnivore')
      opts.push({ label:'Stand tall — hold eye contact  [SOC]', next:'pst_approach_strong' });
    else
      opts.push({ label:'Crouch down — make yourself smaller  [SOC]', next:'pst_approach_low' });
    opts.push({ label:'Move toward them — open hands  [SOC]', next:'pst_approach_open' });
    opts.push({ label:'Lay something on the ground and step back', disabled:!canOfferAlienGift(), disabledReason:'nothing to offer', next:'gift_select', _groundOffer:true });
    opts.push({ label:'Back away slowly', next:'first_breakoff' });
    opts.push({ label:civilizationThreatLabel('Move in with weapons visible','Move in with bare fists raised'), next:'first_intimidate_attempt' });
  } else {
    // Non-primitive tiers — tier-specific first contact options
    const tier = civ.tier;
    opts.push({ label:'Watch from here — read the situation', next:'observe_settlement' });

    if(tier === 'tribal'){
      const tt = civ.traits || {};
      opts.push({ label:tt.structure==='chieftain' ? 'Approach the chieftain\'s line with open hands  [SOC]' : tt.structure==='council' ? 'Approach slowly and let the elders confer  [SOC]' : 'Approach with open hands and slow steps  [SOC]', next:'pst_approach_open' });
      opts.push({ label:tt.ritual==='totem' ? 'Leave a gift near the totem boundary' : tt.ritual==='ancestor' ? 'Leave a gift before the ancestor markers' : 'Leave a gift near the boundary', disabled:!canOfferAlienGift(), disabledReason:'nothing to offer', next:'gift_select' });
      opts.push({ label:tt.ritual==='animist' ? 'Respect the living markers — hold position  [SOC]' : tt.structure==='council' ? 'Wait at the marker line for council permission  [SOC]' : 'Respect the boundary markers — hold position  [SOC]', next:'pst_formal_intro' });
      opts.push({ label:'Back away', next:'first_breakoff' });
      opts.push({ label:civilizationThreatLabel('Make a show of force','Square up with bare fists'), next:'first_intimidate_attempt' });

    } else if(tier === 'medieval'){
      opts.push({ label:'Approach under a non-hostile signal  [SOC check]', next:'pst_approach_open' });
      opts.push({ label:'Identify the crew\'s purpose formally  [SOC check]', next:'pst_formal_intro' });
      opts.push({ label:'Offer goods as a gesture of intent', disabled:!canOfferAlienGift(), disabledReason:'nothing to offer', next:'gift_select' });
      opts.push({ label:'Fall back — do not engage', next:'first_breakoff' });
      opts.push({ label:civilizationThreatLabel('Show force — establish dominance','Raise bare fists — establish dominance'), next:'first_intimidate_attempt' });

    } else if(tier === 'industrial'){
      opts.push({ label:'Approach at distance with hands visible  [SOC check]', next:'pst_approach_open' });
      opts.push({ label:'Transmit crew identification and purpose  [SOC check]', next:'pst_formal_intro' });
      opts.push({ label:'Offer trade goods as an opening', disabled:!canOfferAlienGift(), disabledReason:'nothing to offer', next:'gift_select' });
      opts.push({ label:'Back off — leave the area', next:'first_breakoff' });
      opts.push({ label:civilizationThreatLabel('Move in armed — assert priority','Move in bare-fisted — assert priority'), next:'first_intimidate_attempt' });

    } else if(tier === 'information'){
      // Modern tech — phones, cameras, officials with ID
      opts.push({ label:'Approach calmly — hands visible  [SOC check]', next:'pst_approach_open' });
      opts.push({ label:'Present crew ID and state intent  [SOC check]', next:'pst_formal_intro' });
      opts.push({ label:'Request local contact protocol', next:'intent' });
      opts.push({ label:'Hold position and wait for protocol', next:'first_breakoff' });
      opts.push({ label:civilizationThreatLabel('Refuse compliance and show weapons','Refuse compliance with fists raised'), next:'first_intimidate_attempt' });

    } else {
      opts.push({ label:'Greet peacefully', next:'pst_approach_open' });
      opts.push({ label:'Make a formal introduction', next:'pst_formal_intro' });
      opts.push({ label:'Offer something', disabled:!canOfferAlienGift(), disabledReason:'nothing to offer', next:'gift_select' });
      opts.push({ label:'Back off', next:'first_breakoff' });
      opts.push({ label:'Assert dominance', next:'first_intimidate_attempt' });
    }
  }
  opts.push(attackOpt);
  return opts;
}

// ── POSTURE RESOLUTION ─────────────────────────────────────────────────────
// Each posture runs through trait filters and returns { ok, text, relDelta, alertDelta }

function civResolvePosture(wrap, posture){
  const civ = wrap.civ, state = wrap.state, species = civ.species;
  const isPrim = civ.tier === 'primitive';
  const traits = isPrim ? (civ.traits||{}) : {};
  const isBlind = civIsBlind(wrap);
  const comp = civComprehension(civ, state);
  const { diet, social, curiosity, honor } = traits;

  // ── Success probability ────────────────────────────────────────────────────
  let successBase = 0.55;
  if(civ.aggression === 'Territorial') successBase -= 0.15;
  if(isPrim){
    if(curiosity === 'curious')  successBase += 0.12;
    if(curiosity === 'isolated') successBase -= 0.15;
    if(diet === 'carnivore' && posture === 'strong')       successBase += 0.15;
    if(diet === 'carnivore' && posture === 'low')          successBase -= 0.18;
    if(diet === 'herbivore' && posture === 'low')          successBase += 0.14;
    if(diet === 'herbivore' && posture === 'strong')       successBase -= 0.14;
    if(diet === 'herbivore' && posture === 'open')         successBase += 0.06;
    if(social === 'collective' && posture === 'open')      successBase += 0.08;
    if(social === 'individual' && posture === 'open')      successBase -= 0.05;
    if(social === 'collective' && posture === 'strong')    successBase -= 0.06;
    if(honor === 'honor' && posture === 'ground_offer')    successBase += 0.12;
    if(honor === 'pragmatic' && posture === 'ground_offer') successBase -= 0.06;
    if(curiosity === 'isolated' && posture === 'open')     successBase -= 0.10;
    if(curiosity === 'isolated' && posture === 'low')      successBase += 0.08;
  }
  if(hasScientist()) successBase += 0.08;
  successBase -= (state.alert || 0) * 0.07;
  successBase += (state.relation || 0) * 0.04;
  if(!isPrim){
    const nt = traits; // traits is {} for non-prim, use civ.traits directly
    const ct = civ.traits || {};
    if(ct.disposition==='pragmatic')  successBase += 0.06;
    if(ct.disposition==='wary')       successBase -= 0.06;
    if(ct.governance==='mercantile')  successBase += 0.05;
    if(ct.bureaucracy==='flexible')   successBase += 0.06;
    if(ct.bureaucracy==='strict')     successBase -= 0.05;
    if(ct.policy==='open')            successBase += 0.07;
    if(ct.policy==='restrictive')     successBase -= 0.07;
    if(ct.media==='transparent')      successBase += 0.04;
    if(ct.structure==='council')       successBase += 0.05;
    if(ct.structure==='chieftain')     successBase -= posture === 'strong' ? 0.06 : 0.02;
    if(ct.structure==='clan')          successBase -= 0.03;
    if(ct.ritual==='animist')          successBase += posture === 'open' ? 0.04 : 0;
    if(ct.ritual==='ancestor')         successBase -= 0.05;
    if(ct.ritual==='totem')            successBase += posture === 'yield' ? 0.05 : 0;
  }
  const ok = Math.random() < Math.max(0.10, Math.min(0.92, successBase));

  // ── Text selection ─────────────────────────────────────────────────────────
  // At zero comprehension: pure behavioural read, no interpretation
  // At fragmentary+: context-aware narration

  let text = '';

  if(isBlind){
    // Per-posture, per-dominant-trait text pools
    const pools = {
      open: {
        success: [
          diet==='carnivore'  ? 'The crew moves in at a measured pace — not slow enough to look weak, not fast enough to look aggressive. The hunters track it. Something in the calculation shifts toward neutral.'
                              : 'The crew moves forward with nothing in their hands. The pace and angle read right. The group does not close off.',
          social==='collective' ? 'The approach lands on all of them at once. There is a visible shift in the group — not toward the crew, but away from alarm.'
                                : 'Something about the movement says non-threat. The group holds its ground without hardening.',
          curiosity==='curious' ? 'The approach pulls at their attention. One separates slightly from the others. Not approaching — but not hiding behind the group either.'
                                : 'The crew gets within range without triggering a retreat. That is not nothing.',
        ],
        fail: [
          diet==='carnivore'  ? 'The approach angle was wrong — too direct, too linear. A hunting group reads linear approach as either prey behaviour or a challenge. Neither was intended.'
                              : 'The movement lands wrong. The '+species+' pull back as a unit.',
          curiosity==='isolated' ? 'Too fast, too direct. They wanted to make the first move and the crew took that from them. The group posture closes.'
                                 : 'The approach misfires. The crew cannot tell which part of the movement went wrong.',
          social==='collective' ? 'The crew addressed the nearest individual. The group reads that as an attempt to split them. Every one of them reacts at once.'
                                : 'Something in the movement read as aggression. The '+species+' recoil.',
        ],
      },
      low: {
        success: [
          diet==='herbivore'  ? 'The crew makes itself smaller. For a prey-pattern group, this reads as non-dominance. The tension in the group drops — not gone, but lower.'
                              : 'The crew crouches. A long pause. Whatever they were about to do, they don\'t.',
          honor==='honor'     ? 'The submission posture is read as intentional. There is something formal about how they acknowledge it.'
                              : 'The low posture strips away threat. They watch with something closer to curiosity than alarm.',
          curiosity==='curious' ? 'Being smaller makes the crew less threatening and more interesting. Two of them take a half-step closer.'
                                : 'Crouching removes the size advantage that was making this tense. The group settles.',
        ],
        fail: [
          diet==='carnivore'  ? 'Crouching reads as injured or frightened to a predator group. The wrong signals are now in play.'
                              : 'The low posture triggers something wrong. The group\'s response is not relaxation — it\'s something else.',
          social==='collective' ? 'The group confers in a way the crew cannot follow. Whatever the posture communicated, the consensus went badly.'
                                : 'Crouching was the wrong signal here. The group reacts as if something just revealed itself.',
          honor==='honor'     ? 'Submitting before there was any demand for submission — to an honor-bound group, that reads as a trick, not respect.'
                              : 'The movement misread. They advance rather than settle.',
        ],
      },
      strong: {
        success: [
          diet==='carnivore'  ? 'The crew holds its line and holds eye contact. The hunters read this as a peer-level display — not an attack, but not prey either. The situation is being renegotiated.'
                              : 'The display holds. They go still, reassessing.',
          honor==='honor'     ? 'Standing firm without aggression — the posture has a shape they recognise as deliberate. Something about the formality lands.'
                              : 'The show of size and stillness buys a moment of reassessment. The group does not advance.',
          curiosity==='curious' ? 'They were curious before. The confident display sharpens that into something more active. They are now evaluating, not just watching.'
                                : 'The display reads as strength, not threat. The encounter resets to neutral ground.',
        ],
        fail: [
          diet==='herbivore'  ? 'The dominant display triggers a flight instinct. One of the '+species+' has already moved for cover. The others are following the calculation.'
                              : 'The display reads as aggression. Two shift their weight simultaneously.',
          social==='collective' ? 'Standing tall against a collective group emboldens the ones at the back. The front holds, but what comes next is a group decision.'
                                : 'The threat posture lands wrong. They read it as the first move of an attack.',
          curiosity==='isolated' ? 'Any display of dominance reads as territorial encroachment to a reclusive group. The encounter closes down.'
                                 : 'The posture was too much. The '+species+' react to the show of force.',
        ],
      },
      ground_offer: {
        success: [
          honor==='honor'     ? 'The object on the ground — placed, not thrown, crew stepped back — reads as a formal gesture. They approach it with deliberate slowness and examine it carefully.'
                              : 'Three pairs of eyes on the object. No one approaches yet, but no one is moving away.',
          curiosity==='curious' ? 'The object draws them. One reaches it before the others do. Their examination is thorough — this is what they wanted to do from the start.'
                                : 'Leaving something behind and stepping back is understood. The tension in the group drops.',
          diet==='omnivore'   ? 'They approach the object with the practical attention of a group that evaluates everything as a resource first. It clears the initial alarm.'
                              : 'The gesture reads correctly. Something is being offered without force. They take the time to consider it.',
        ],
        fail: [
          diet==='carnivore'  ? 'To a predator group, an offering on the ground reads as bait. The group does not approach it. Several take a step back, watching the crew.'
                              : 'The object is ignored. The gesture that accompanied it got a reaction that was not good.',
          honor==='pragmatic' ? 'They look at it and look away. A symbolic gesture with no obvious utility — not what this group trades in.'
                              : 'The object draws attention but the wrong kind. Something about the presentation read as a provocation.',
          social==='collective' ? 'No one moves toward it while the others are watching. The collective hesitation becomes a collective refusal.'
                                : 'The gesture misfires. Stepping back after placing something read differently than intended.',
        ],
      },
      patient: {
        success: [
          curiosity==='curious'  ? 'The wait pulls their curiosity to the surface. One separates from the group and moves a body-length closer. Not approaching — testing.'
                                 : 'The patience is read as non-threat. Something in the group\'s energy settles.',
          diet==='carnivore'     ? 'Staying still while being watched — the hunters recognise that this is not prey behaviour. The assessment running in their eyes shifts.'
                                 : 'The wait pays off. Movement from their side — small, deliberate, toward the crew.',
          honor==='honor'        ? 'Not moving first, not filling silence — there is something in that which resonates with a group that has rules about who speaks first.'
                                 : 'The patience gives them time to finish their own internal conversation. Whatever was decided, the outcome was better than aggression.',
        ],
        fail: [
          curiosity==='isolated' ? 'They did not use the stillness to approach. They used it to leave. Slowly, systematically, without visible alarm — just gone.'
                                 : 'Waiting did nothing. They moved first, and not toward the crew.',
          diet==='carnivore'     ? 'The hunters grew bored of the stillness. They began moving to flank positions — not attacking, but the geometry of the encounter is no longer comfortable.'
                                 : 'Nothing resolves. The time passes without movement on either side and then one of them makes a sound that clearly ends the waiting.',
          social==='collective'  ? 'The group held a discussion while the crew waited. Whatever conclusion they reached, it did not favour the situation.'
                                 : 'The wait has a neutral result. The situation is unchanged and slightly more awkward.',
        ],
      },
      yield: {
        success: [
          diet==='carnivore'  ? 'The crew gives ground. The hunters watch the retreat with the specific stillness of a group that is no longer being pressed. The threat calculus drops.'
                              : 'The crew steps back. The group\'s posture changes — marginally, but visibly.',
          honor==='honor'     ? 'Yielding without being forced to is read as a deliberate signal. There is a brief conferral in the group before their posture shifts.'
                              : 'Stepping back is the right answer. The tension drops.',
          civ.aggression==='Territorial' ? 'The crew withdraws from the contested space. That is exactly what was being demanded. The confrontation de-escalates.'
                                         : 'The retreat is accepted. They let the crew step back without pressing.',
        ],
        fail: [
          diet==='carnivore'  ? 'Stepping back triggered pursuit instinct. The hunters advance — not charging, but closing the gap the crew just opened.'
                              : 'Stepping back triggered something. They advance.',
          curiosity==='isolated' ? 'The retreat was read as abandoning something, not yielding it. Their response is to occupy the space the crew just vacated.'
                                 : 'The yield was misread. The group advances to fill the distance.',
          social==='collective'  ? 'One of the group held position while the others advanced. The individual who held back did not win the argument.'
                                 : 'The retreat is not received the way it was intended. The gap closes.',
        ],
      },
    };

    const pool = pools[posture];
    if(pool){
      const lines = ok ? pool.success : pool.fail;
      text = lines[Math.floor(Math.random()*lines.length)];
    } else {
      text = ok ? 'The approach reads correctly. Something has shifted.' : 'The approach misfires. The crew cannot tell exactly what went wrong.';
    }
  } else {
    // Partial/workable comprehension — use primGreetResult which has language context
    text = ok ? primGreetResult(species, traits, true, comp) : primGreetResult(species, traits, false, comp);
  }

  const relDelta   = ok ? 1 : -1;
  const alertDelta = ok ? -1 : 1;
  return { ok, text, relDelta, alertDelta };
}

