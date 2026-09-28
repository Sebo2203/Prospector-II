// ── Civ dialogue helper — returns the current visit's action state, initialising if needed
function civVisitState(wrap){
  if(!wrap?.state) return null;
  if(!wrap.state.visit){
    wrap.state.visit = {
      greetAttempts:0,
      greetSuccess:false,
      noninterferenceDone:false,
      intimidateDone:false,
      observeDone:false,
      shareKnowledgeDone:false,
      studyCustomsDone:false,
      languageAnalysisDone:false,
      askIntentCount:0,
      pressureDone:false,
      askCivilizationDone:false,
      tierRouteDone:false,
    };
  }
  return wrap.state.visit;
}

function civCanAnalyzeLanguage(wrap){
  if(!wrap?.state || wrap.state.hostile) return false;
  const vs = civVisitState(wrap);
  if(vs?.languageAnalysisDone) return false;
  const progress = wrap.state.languageProgress || 0;
  if(progress >= CIV_LANGUAGE_MAX) return false;
  return true;
}

function resetCivVisitState(pdata){
  const state = pdata?.civilization?.state;
  if(state) state.visit = null;
}

function civObserveText(civ){
  const tier = civ.tier;
  const species = civ.species;
  if(tier === 'primitive'){
    const traits = civ.traits || { diet:'omnivore', social:'balanced', curiosity:'neutral', honor:'pragmatic' };
    return primObserveText(species, null, traits, false);
  }
  const s = species, sl = species.toLowerCase();

  // Aquatic civilizations — encountered underwater, distinct environmental cues
  if(species === 'Aquatic'){
    const aquaticTierLines = {
      tribal: [
        'Bioluminescent patterns pulse along the '+sl+' in slow, coordinated waves — not random, not decorative. This is structured communication passing through the group.',
        'The '+sl+' territorial markers are pressure-columns of disturbed sediment and deliberately placed stones on the seabed. The settlement boundary is unmistakable even without shared language.',
        'Movement in the water column above the settlement — sentries maintaining depth rather than position. They are watching from three dimensions, not two.',
      ],
      medieval: [
        'The '+sl+' settlement is built into the reef and rock of the seabed. Structures are sealed and pressurised — architectural decisions that read as sophisticated civil engineering. Someone calculated load and current.',
        'A patrol circulates the outer boundary in a slow, energy-efficient gyre. Their equipment — nets, harnessed creatures, close-range tools — is functional and standardised. This is an organised polity.',
        'Trade occurs at a visible market tier: goods moved by current-drag sled and sorted by size and density. The '+s+' economy has a physical logic shaped entirely by the medium they live in.',
      ],
      industrial: [
        'Acoustic machinery pulses through the water at regular intervals — production rhythm, not communication. The '+sl+' settlement runs on industrial time, and the water carries it everywhere.',
        'Pressure vessels and enclosed facilities dominate the settlement core. What the crew cannot enter, they can read: exhaust currents, thermal signatures, the organised movement of workers between shifts.',
        'Sonar buoys ring the outer perimeter. The crew\'s approach was logged before they could see the settlement. Whatever authority monitors those sensors already has a profile on the ship.',
      ],
      information: [
        'The '+sl+' settlement reads as a modern city adapted entirely to the deep. Communication relays trail bioluminescent cables between towers. A drone — biological or mechanical — is already circling the crew.',
        'Several '+sl+' in what read as official roles have assembled at the settlement boundary. Recording equipment is deployed. The crew is being processed through a protocol that was written before today.',
        'The settlement perimeter has expanded since the crew arrived. Acoustic transponders have repositioned. This is not alarm — it is incident management, and someone senior is running it.',
      ],
    };
    const lines = aquaticTierLines[tier] || aquaticTierLines.tribal;
    return lines[Math.floor(Math.random()*lines.length)];
  }
  const tierLines = {
    tribal:(()=>{
      const t = civ.traits || {};
      const lines = [];
      if(t.structure === 'chieftain') lines.push('A command pattern is visible around one central figure. Warriors watch the crew, but they keep checking the chieftain before shifting position.');
      if(t.structure === 'council') lines.push('No single '+sl+' owns the response. Elders confer in short exchanges, and each change at the perimeter follows that shared decision.');
      if(t.structure === 'clan') lines.push('The settlement is arranged in family clusters. Each cluster has its own marker, its own watchers, and its own way of holding children back from the crew.');
      if(t.ritual === 'animist') lines.push('Offerings hang from living trees and stone outcrops. The boundary is not just political here — the land itself is being treated as a participant.');
      if(t.ritual === 'ancestor') lines.push('Carved names or memory-marks face the approach path. The crew is being watched by the living, but the living keep gesturing toward the dead.');
      if(t.ritual === 'totem') lines.push('Totem poles and painted markers divide the settlement into readable zones. Crossing one without acknowledgement is probably an insult.');
      lines.push('Children are kept away from the perimeter. That positioning is a choice, not chance — this community has a protocol for unknown arrivals and the young are not part of it.');
      return lines;
    })(),
    medieval:[
      'Stone fortifications and market stalls. The '+s+' economy runs on barter, guild vouchers, and labour obligation. Class is visible in fabric quality — the armoured ones at the gate wear dyed cloth, the workers do not.',
      'A patrol of armoured '+s+' watches from a watchtower. Commands pass in a structured shorthand — likely military cant, not the common tongue. Whoever is in charge has a chain of command.',
      'Craftwork through open doorways: metalsmithing, weaving, food preparation at organised scale. The tools are standardised. Someone set the specifications, and everyone follows them.',
      'The '+s+' move around the crew\'s presence without acknowledgement, which is itself acknowledgement. They have seen outside arrivals before. The market closest to the gate appears to deal with exactly this scenario.',
    ],
    industrial:[
      'Machinery hums through the settlement walls. Production is systematic, not artisanal — assembly logic, shift rotations, output stacking near transit points. The '+s+' are running a supply chain.',
      'Factory output lines near the market are labelled with standardised markings. The crew cannot read them, but the format is consistent: quantity, origin, classification. This is a literate bureaucracy.',
      'A communications relay transmits on a regular cycle. The crew\'s ship has already been logged. Someone with authority over that relay knows the ship\'s profile and is deciding what to do about it.',
      'Off-shift workers move between tenement blocks and a structure that reads as a canteen. The '+sl+' social contract involves collective feeding — the settlement provides, the workers produce. No visible currency exchange at street level.',
    ],
    information:[
      'Roads, lighting, communication towers, and parked vehicles. Several cameras are aimed at the ship from different angles. The '+s+' are not improvising — there is a contact protocol and it is already running.',
      'Officials with lanyards have assembled at a safe distance. At least two are recording. Someone senior is on a communications device. The crew is being processed, not ignored.',
      'A rotary-wing or equivalent aircraft has appeared overhead. Not threatening — documenting. The crew is now a news event. Whatever happens next will be reviewed by people who were not here.',
      'The '+s+' perimeter has expanded since the ship landed. Unmarked vehicles have positioned at access points. This is not a military response — it looks more like quarantine or incident containment.',
    ],
  };
  const lines = tierLines[tier] || tierLines.tribal;
  return lines[Math.floor(Math.random()*lines.length)];
}

function civShareKnowledgeText(civ, state){
  const comp = civComprehension(civ, state);
  if(civ.tier === 'primitive'){
    const traits = civ.traits || {};
    if(comp === 'uncertain') return 'The gesture of pointing at the sky and sketching shapes in the ground lands in the gap between their world and the crew\'s. Something passes, dimly.';
    if(traits.curiosity === 'curious') return 'The star maps cause visible excitement. They copy the shapes with a finger in the dirt, adding marks of their own — geography, water, danger.';
    if(traits.honor === 'honor') return 'The maps are received as a formal gift. They respond with their own territorial markings — boundaries, sacred ground, the things that cannot be taken.';
    return 'The crew sketches star positions and passes them across. The '+civ.species.toLowerCase()+' receive it as a gift of great meaning. They mark something in return: path, water, danger.';
  }
  if(comp === 'fluent' || comp === 'workable'){
    if(civ.species === 'Aquatic'){
      const aquaticShare = {
        tribal:    'The crew traces current-paths and depth contours on a sealed surface. The '+civ.species+' understand the shape of the knowledge even before the language — this is navigation, and they know what navigation looks like.',
        medieval:  'Depth charts and pressure-zone maps cross the communication barrier. They study the data with professional interest, then return marked charts of their own: hazards, current roads, territorial water.',
        industrial:'The crew transmits route data on a compatible frequency. The '+civ.species+' receive it, verify, and return local navigational hazards and restricted depth zones without being asked.',
        information:'The data exchange is clean and efficient — stellar cartography for hydrographic data. Both sides leave the encounter better informed than they arrived.',
      };
      return aquaticShare[civ.tier] || aquaticShare.tribal;
    }
    if(civ.tier === 'information') return 'The exchange of coordinates and stellar cartography is efficient. They reciprocate with local navigational hazards. Both sides leave better informed.';
    if(civ.tier === 'industrial')  return 'Star charts pass across the communication barrier. They study the routes with professional interest, then offer regional trade warnings in return.';
    if(civ.tier === 'tribal'){
      const t = civ.traits || {};
      if(t.ritual === 'animist') return 'The star map is received as a sky-path tied to land and season. They answer with paths, water, and places where the living ground should not be disturbed.';
      if(t.ritual === 'ancestor') return 'The map becomes part of a formal exchange with memory attached. They answer by marking burial ground, old migration routes, and boundaries that carry ancestral weight.';
      if(t.structure === 'chieftain') return 'The chieftain accepts the chart first, then authorises a return gift of local knowledge: paths, watch posts, and places the crew may approach only with permission.';
      if(t.structure === 'council') return 'The council studies the star positions together before answering. Their reciprocal map is collaborative: water from one elder, taboo ground from another, safe paths from a third.';
      return 'The crew sketches star positions and passes them across. They answer with local routes, boundary markers, and places that belong to clan memory.';
    }
    return 'The crew sketches star positions and passes them across. The '+civ.species.toLowerCase()+' receive it as a gift of great meaning.';
  }
  return 'The gesture is clear enough — maps, directions, a reach outward. The response is respectful, limited only by what they can parse.';
}

function civGalaxyShareReward(civ, state, wrap){
  if(civ.tier === 'information' || civ.tier === 'industrial'){
    addLog('They transmit navigational data. A nearby hazard has been noted in the ship log.','lg');
    if(!state.galaxyShareRewardGiven){
      state.galaxyShareRewardGiven = true;
      civGainLanguage(state, 1);
    }
  } else {
    addLog('The maps are received with solemn appreciation. The '+civ.species.toLowerCase()+' relation has deepened.','lg');
  }
  const cap = wrap ? civDialogueRelationCap(wrap) : 4;
  state.relation = Math.min(cap, (state.relation||0) + 1);
}

function civRevealTileKnowledge(pdata, x, y, radius=3){
  if(!pdata?.grid) return 0;
  const w = PW(pdata), h = PH(pdata);
  if(!pdata.visited) pdata.visited = new Array(w*h).fill(false);
  if(!pdata.explored) pdata.explored = new Array(w*h).fill(false);
  let newly = 0;
  for(let yy=Math.max(0,y-radius); yy<=Math.min(h-1,y+radius); yy++){
    for(let xx=Math.max(0,x-radius); xx<=Math.min(w-1,x+radius); xx++){
      const d = Math.max(Math.abs(xx-x), Math.abs(yy-y));
      if(d > radius) continue;
      const idx = yy*w+xx;
      if(!pdata.visited[idx]) newly++;
      pdata.visited[idx] = true;
      pdata.explored[idx] = true;
      if(pdata.scanMask) pdata.scanMask[idx] = true;
    }
  }
  return newly;
}

function civRevealLocalKnowledge(wrap, level='guidance'){
  if(!wrap?.pdata || !wrap?.civ) return 0;
  const pdata = wrap.pdata;
  const civ = wrap.civ;
  const radius = level === 'permit' ? 5 : civ.tier === 'information' ? 7 : civ.tier === 'industrial' ? 6 : civ.tier === 'medieval' ? 5 : 4;
  let revealed = 0;
  if(civ.tier === 'primitive' && civ.roamCenter){
    revealed += civRevealTileKnowledge(pdata, civ.roamCenter.x, civ.roamCenter.y, radius);
  } else {
    let targets = civilizationBuildingPositions(pdata);
    if(civ.tier === 'tribal'){
      const totems = targets.filter(t=>t.type === 'civ_totem');
      if(totems.length) targets = totems;
    }
    if(level !== 'permit'){
      targets = targets
        .map(t=>({ ...t, d:Math.max(Math.abs(t.x-(G.player?.x||t.x)), Math.abs(t.y-(G.player?.y||t.y))) }))
        .sort((a,b)=>a.d-b.d)
        .slice(0, civ.tier === 'information' ? 10 : civ.tier === 'industrial' ? 7 : 5);
    }
    targets.forEach(t=>{ revealed += civRevealTileKnowledge(pdata, t.x, t.y, radius); });
  }
  if(Number.isFinite(pdata.spawnX) && Number.isFinite(pdata.spawnY) && (civ.tier === 'industrial' || civ.tier === 'information')){
    revealed += civRevealTileKnowledge(pdata, pdata.spawnX, pdata.spawnY, level === 'permit' ? 7 : 4);
  }
  return revealed;
}

function civHealCrewByTier(civ){
  const living = (G.crew||[]).filter(c=>c.hp>0);
  if(!living.length) return { healed:0, treated:0 };
  const tierHeal = { primitive:4, tribal:5, medieval:6, industrial:8, information:10 }[civ?.tier] || 5;
  let healed = 0, treated = 0;
  living.forEach(c=>{
    if(c.hp < c.maxHp){
      const before = c.hp;
      c.hp = Math.min(c.maxHp, c.hp + tierHeal);
      healed += c.hp - before;
    }
  });
  if(['industrial','information'].includes(civ?.tier)){
    const treatIds = civ.tier === 'information'
      ? ['bleeding','heavy_bleeding','infection','fever','sepsis','toxin_poisoning','suit_puncture']
      : ['bleeding','heavy_bleeding','infection','fever'];
    living.forEach(c=>{
      treatIds.forEach(id=>{ if(removeCrewStatus(c, id, true)) treated++; });
    });
  } else if(civ?.tier === 'medieval'){
    living.forEach(c=>{ if(removeCrewStatus(c, 'bleeding', true)) treated++; });
  }
  return { healed, treated };
}

// Territorial civs require +1 relation above the normal threshold for all unlocks.
function civRelationThreshold(wrap, base){
  return wrap?.civ?.aggression === 'Territorial' ? base + 2 : base;
}

// Dialogue-only interactions (observe, talk, patience, show object, boundary, etc.)
// cannot push relation above 3. To cross 4+ the crew must give at least one accepted gift.
// This ensures gifts feel meaningfully distinct from conversation.
function civDialogueRelationCap(wrap){
  if(!wrap?.state) return 3;
  const giftsAccepted = (wrap.state.giftsAccepted || 0);
  if(giftsAccepted >= 3) return 10;
  if(giftsAccepted >= 1) return 6;
  return 3;
}

function maybeCivReport(wrap){
  if(!wrap?.civ || !wrap?.state) return;
  if(wrap.state.civReportGenerated) return;
  const state = wrap.state;
  const vs = civVisitState(wrap);
  // Threshold: contacted + language progress ≥ 2 + at least two of: observed, asked, shared, language analysed
  const knowCount = [vs?.observeDone, vs?.studyCustomsDone, vs?.shareKnowledgeDone, vs?.languageAnalysisDone,
    (vs?.askIntentCount||0) > 0, (state.memories||[]).length >= 2].filter(Boolean).length;
  if(!state.contacted || (state.languageProgress||0) < 2 || knowCount < 2) return;
  state.civReportGenerated = true;
  const value = ({primitive:60, tribal:80, medieval:100, industrial:120, information:140})[wrap.civ.tier] || 80;
  G.inventory.push({
    name: wrap.civ.species+' Civilization Report',
    col: '#88ffcc',
    desc: 'Field notes on '+wrap.civ.tierLabel.toLowerCase()+' '+wrap.civ.species.toLowerCase()+' culture, language, and behaviour. The Science Office pays for these.',
    value,
  });
  addLog('Enough data gathered — compiled a civilization report on the '+wrap.civ.species.toLowerCase()+'.','ll');
}

function civApplyPositiveMilestones(wrap, source){
  if(!wrap?.civ || !wrap?.state) return;
  const civ = wrap.civ;
  const state = wrap.state;
  // Track how many gifts have been accepted — gates the dialogue relation cap (see civDialogueRelationCap).
  // Only gift-sourced milestones increment this counter.
  if(source === 'gift'){
    state.giftsAccepted = (state.giftsAccepted || 0) + 1;
  }
  const relation = state.relation || 0;
  const tier = civ.tier;
  const t2 = civRelationThreshold(wrap, 6); // trade/aid — requires sustained positive engagement
  const t3 = civRelationThreshold(wrap, 9); // guidance/safe conduct — near-maximum trust
  if(relation >= t2 && ['medieval','industrial','information'].includes(tier)){
    state.tradeUnlocked = true;
  }
  if(relation >= t2 && !state.aidOffered && ['primitive','tribal'].includes(tier)){
    const giftReq = civ.aggression === 'Territorial' ? 3 : 2;
    if((state.giftsReceived||0) >= giftReq){
      state.aidOffered = true;
      addLog('The '+civ.species.toLowerCase()+' are willing to offer simple aid now.','lg');
    }
  }
  if(relation >= t3 && !state.guidanceUnlocked){
    state.guidanceUnlocked = true;
    addLog('Trust has opened local guidance from the '+civ.species.toLowerCase()+'.','lg');
  }
  if(relation >= t3 && !state.safeConductUnlocked && ['medieval','industrial','information'].includes(tier)){
    state.safeConductUnlocked = true;
    const label = tier === 'information' ? 'visitor clearance' : tier === 'industrial' ? 'controlled access corridor' : 'safe conduct';
    addLog('Positive relations unlocked: '+label+'.','lg');
  }
  maybeCivReport(wrap);
}

function civPositiveGuidanceText(wrap){
  if(!wrap?.civ) return 'No guidance comes.';
  const civ = wrap.civ;
  const state = wrap.state;
  state.guidanceUsed = true;
  civGainLanguage(state, 1);
  state.relation = Math.min(civDialogueRelationCap(wrap), (state.relation||0) + 1);
  civApplyPositiveMilestones(wrap, 'guidance');
  const revealed = civRevealLocalKnowledge(wrap, 'guidance');
  const species = civ.species.toLowerCase();
  const lines = {
    primitive:'They point out where they hunt, where they sleep, and where the crew should not go. Not a map — a lived knowledge of what is nearby. The crew now knows the shape of this ground a little better.',
    tribal:(()=>{ const t=civ.traits||{}; return t.ritual==='animist'
      ? 'They indicate the places where the living ground is present: water, groves, animal runs, and sites the crew should stay clear of. The area around their range comes into better focus.'
      : t.ritual==='ancestor'
      ? 'They show what surrounds their settled ground — marked territory, camp boundaries, water, and the areas the crew should avoid. Their knowledge of nearby terrain is detailed.'
      : t.structure==='chieftain'
      ? 'With the chieftain\'s authority behind it, the knowledge is precise: camp ranges, water, watches, and the edges of controlled ground. The crew can see more of what is around them.'
      : t.structure==='council'
      ? 'The elders pool what they know. Water sources, danger zones, camp clusters, and contested ground — a collective picture of nearby terrain.'
      : 'They share what they know about the surrounding area: their range, camp ground, water, and places to avoid.'; })(),
    medieval:'The guide sketches out the immediate area — roads, patrol routes, walls, and which sections the crew can and cannot approach. The settlement and its surrounds come into clearer relief.',
    industrial:'They provide a site overview: facility zones, safety perimeters, utility corridors, and the controlled areas the crew should not enter without clearance. The local layout is now readable.',
    information:'They share a local area survey — infrastructure, restricted zones, emergency access points, and the current operational status of nearby facilities. The crew\'s picture of this location is sharper.',
  };
  addLog('Local knowledge shared by the '+species+(revealed ? ' — '+revealed+' nearby tiles revealed.' : '.') ,'lg');
  return (lines[civ.tier] || lines.tribal)+(revealed ? '\n\nThe surrounding area is clearer on the surface map.' : '');
}

function civPermitText(wrap){
  if(!wrap?.civ) return 'No permit is issued.';
  const civ = wrap.civ;
  const state = wrap.state;
  state.safeConductUnlocked = true;
  state.permitGranted = true;
  state.relation = Math.min(civDialogueRelationCap(wrap), (state.relation||0) + 1);
  state.alert = Math.max(0, (state.alert||0) - 1);
  const promise = state.boundaryPromise;
  if(civ.tier === 'information' && promise?.active){
    // Permit opens civilian zones (factories, tenements) but keeps relay towers and offices restricted
    promise.accessibleTypes = ['civ_factory','civ_tenement'];
    promise.label = 'civilian districts';
    addLog('Clearance granted: civilian zones accessible. Relay towers and admin offices remain restricted.','li');
  }
  if(civ.tier === 'industrial' && promise?.active && promise.mode !== 'allowed_zone'){
    const oldRadius = promise.radius || 4;
    promise.radius = Math.max(1, oldRadius - 3);
    // Count and reveal tiles that just became accessible
    const pdata2 = wrap.pdata;
    let freedTiles = 0;
    if(pdata2?.grid){
      const w2=PW(pdata2), h2=PH(pdata2);
      for(let yy=0;yy<h2;yy++) for(let xx=0;xx<w2;xx++){
        const d2 = Math.max(Math.abs(xx-promise.x),Math.abs(yy-promise.y));
        if(d2 <= oldRadius && d2 > promise.radius) freedTiles++;
      }
    }
    if(freedTiles > 0) addLog(freedTiles+' tiles no longer restricted by the access corridor.','lg');
  }
  const revealed = civRevealLocalKnowledge(wrap, 'permit');
  civApplyPositiveMilestones(wrap, 'permit');
  const lines = {
    medieval:'Safe conduct is granted under watch. The crew may move as named guests, not unknown wanderers.',
    industrial:'A controlled access corridor is approved. Security still watches, but the crew has a legal path instead of only a warning line.',
    information:'Visitor clearance is issued. Civilian zones open to the crew — factories and housing blocks are no longer restricted. Relay towers and administrative offices remain off-limits.',
  };
  addLog((civ.tier === 'information' ? 'Visitor clearance' : civ.tier === 'industrial' ? 'Access corridor' : 'Safe conduct')+' granted'+(revealed ? ' — '+revealed+' tiles mapped.' : '.') ,'lg');
  return (lines[civ.tier] || 'Permission is granted under local terms.')+(revealed ? '\n\nThe permitted route is now visible on the surface map.' : '');
}

function civAlertDeescalateText(civ, state){
  if(state.alert >= 4){
    if(civ.tier === 'primitive'){
      const traits = civ.traits || {};
      if(traits.diet === 'carnivore') return 'The group is in challenge posture. Weapons visible. The wrong move here ends the exchange permanently.';
      if(traits.social === 'collective') return 'The whole band has shifted. This is not one angry individual — it is a collective decision forming. Act carefully.';
      return 'Any sudden movement will decide this badly. The '+civ.species+' are a breath away from a hard response.';
    }
    return 'Weapons are visible. The locals are on the edge of a decision. One wrong move will decide it.';
  }
  if(civ.tier === 'primitive'){
    const traits = civ.traits || {};
    if(traits.curiosity === 'isolated') return 'The '+civ.species+' have drawn back. The opening is narrowing. Staying still is probably the only option that does not close it entirely.';
    if(traits.honor === 'honor') return 'Something was done or said that registered as a violation. They are agitated but have not acted. A clear correction gesture might recover the moment.';
    return 'The '+civ.species+' are agitated. Watchers have pulled in closer. The tension is readable even without shared language.';
  }
  return 'The locals are agitated. Watchers have gathered. The tension is readable even without shared language.';
}

function civReturnGreetText(civ, state){
  const comp = civComprehension(civ, state);
  const rel  = civRelationLabel(state);
  if(rel === 'Friendly' || rel === 'Receptive'){
    if(civ.tier === 'primitive'){
      const traits = civ.traits || {};
      if(traits.curiosity === 'curious') return 'The '+civ.species+' are at the edge of the camp, watching for the crew. Recognition is in their posture before any gesture is made.';
      if(traits.social === 'collective') return 'Several '+civ.species+' move forward together. The group has a memory of the crew, and it is a good one.';
      return 'There is recognition. The crew is placed now — known and not dangerous. The first gesture comes from their side this time.';
    }
    return 'The contact channel reopens smoothly. They remember the crew, and the memory is good.';
  }
  if(rel === 'Neutral'){
    if(civ.tier === 'primitive') return 'The crew is placed — seen before, not yet trusted. The distance kept is smaller than the first time. That is something.';
    return 'The same watchers from before are here. They remember the crew. A cautious welcome gesture is offered.';
  }
  return 'The prior contact has left a shadow. They remember the crew, but the memory is not warm.';
}

function civCustomsStudyText(civ, state){
  const sci = getCrewScientist();
  if(!sci) return '"No scientist available."';
  const tier = civ.tier;
  const species = civ.species;
  const n = crewDisplayName(sci);
  const tierStudy = {
    primitive:(()=>{
      const traits = civ.traits || {};
      const { diet, social, curiosity, honor } = traits;
      if(curiosity==='curious') return n+' notes the '+species+' studying the crew in return — gesture patterns, posture mirroring, deliberate approach and withdrawal tests. This group is running its own field study. Cultural map sharpens considerably.';
      if(curiosity==='isolated') return n+' works from maximum distance. The group will scatter at a closer approach. Still — call-response intervals, spacing when alarmed, how decisions propagate. The pattern is emerging.';
      if(diet==='carnivore') return n+' documents hunt coordination: silent hand signals, spacing discipline, sector assignment by body angle. This is a predator society with layered social rules. The hierarchy is encoded in who moves first.';
      if(social==='collective') return n+' maps the consensus mechanism — no visible leader, but decisions propagate through the group in under thirty seconds through something that looks like coordinated posture shift. That explains a lot about why individual appeals don\'t land.';
      if(honor==='honor') return n+' identifies a formal obligation structure: marked objects that cannot be touched, specific ground that requires a gesture before crossing, role distinctions encoded in body paint or carried objects. Rules exist here at depth.';
      return n+' maps gesture-response patterns, call intervals, and approach behaviour. The '+species+' notice and seem cautiously approving — being studied carefully may read as respect.';
    })(),
    tribal: (()=>{
      const tt = civ.traits || {};
      if(tt.ritual === 'animist') return n+' maps the animist belief system: every significant feature of the landscape has a relationship with the group — not metaphorically, but practically. Knowing which water source is \'protected\' and which is freely used matters for navigation and contact both.';
      if(tt.ritual === 'ancestor') return n+' documents the ancestor record-keeping system — a dense lineage map encoded in carried objects, body markings, and the positioning of burial markers. Authority here flows through the dead as much as the living.';
      if(tt.ritual === 'totem') return n+' documents totem symbolism, ritual sequence, and clan marker positioning. The totems are not decorative — each records an event or obligation. The cultural structure is dense and older than the settlement.';
      if(tt.structure === 'chieftain') return n+' maps the chieftain authority model — one figure holds decision power, backed by visible markers of status. The crew\'s interactions will be evaluated against the chieftain\'s current political position within the group.';
      if(tt.structure === 'council') return n+' maps the ceremony cycle and leadership succession signals. Authority here passes through ritual performance, not bloodline — the elder who runs the ceremony outranks the elder who owns the most.';
      return n+' isolates the trade language used between clans — a simplified pidgin that strips out ritual content and focuses on quantities and exchange terms. Useful for negotiation.';
    })(),
    medieval: (()=>{
      const mt = civ.traits || {};
      if(mt.governance==='theocratic') return n+' maps the religious authority structure. The '+species+' governance is inseparable from doctrine — the clergy outranks the military, and the military outranks the merchants. Whatever the crew wants here will have to pass a spiritual test first.';
      if(mt.governance==='mercantile') return n+' documents the guild system and market law in detail. The '+species+' economy is organised around trade houses and negotiated tariffs. Authority flows from commercial value — whoever controls key trade goods controls the settlement.';
      if(mt.disposition==='proud') return n+' identifies the honour code that structures every interaction here. Status is constantly being evaluated and communicated through posture, address form, and gift quality. The crew has been assessed at least twice since arrival.';
      if(mt.disposition==='wary') return n+' notes the '+species+' pattern of deliberate caution with outsiders: slow disclosure, formal challenge-response protocols, and a preference for meeting on their own ground. Trust is earned incrementally.';
      return n+' records caste markers, guild insignia, and market law. A stratified economy with written obligation at every level.';
    })(),
    industrial: (()=>{
      const it = civ.traits || {};
      if(it.economy==='corporate') return n+' maps the corporate structure — the '+species+' settlement is run by a dominant commercial entity, not a government in any traditional sense. Security is contract security. Authority is ownership. The crew\'s presence is being assessed for commercial utility.';
      if(it.economy==='state') return n+' analyses the state management model. Production quotas, resource allocation, movement permits. The '+species+' do not have a market — they have a plan. Deviating from it creates problems at multiple administrative levels.';
      if(it.economy==='cooperative') return n+' documents a cooperative economic model the crew has not encountered in this configuration before. Decision-making is distributed, production is shared, and the '+species+' are genuinely uncertain how to classify the crew\'s arrival in their system.';
      if(it.bureaucracy==='strict') return n+' maps the compliance and documentation hierarchy. Everything here runs on procedure. The crew\'s current classification is provisional and under review by at least three departments.';
      return n+' analyses the production logic and social permit structure. Useful economic and procedural intelligence gathered.';
    })(),
    information: (()=>{
      const ift = civ.traits || {};
      if(ift.media==='transparent' && ift.policy==='open') return n+' cross-references '+species+' data protocols with galactic standards. The '+species+' operate an open-information model — the crew\'s presence is already public record, which paradoxically offers protection. Transparent societies are harder to act against quietly.';
      if(ift.media==='controlled') return n+' identifies the information control architecture. The '+species+' media is state-adjacent — what gets published is curated. The crew\'s contact status is being managed as a narrative, not just an event. That is useful to know.';
      if(ift.policy==='restrictive') return n+' maps the access classification system. The '+species+' operate a tiered contact protocol with seven clearance levels. The crew is currently at level three. Levels four and five require documented purpose and a local sponsor.';
      return n+' cross-references data protocols with known galactic standards. Several communication conventions match pre-Expansion relay formats — this culture has interacted with the wider network before.';
    })(),
  };
  const result = tierStudy[tier] || tierStudy.tribal;
  giveSkillXP(sci, 'sci', 3);
  civGainLanguage(state, 1);
  return result;
}

