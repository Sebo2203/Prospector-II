function civTierRouteLabel(civ){
  if(!civ) return 'Use cultural insight';
  if(civ.tier === 'primitive'){
    const traits = civ.traits || {};
    if(traits.diet === 'carnivore') return 'Project strength without threat';
    if(traits.curiosity === 'isolated') return 'Hold ground and let them come to you';
    if(traits.social === 'collective') return 'Address the group, not the individual';
    if(traits.honor === 'honor') return 'Make a visible promise and keep it';
    return 'Lower tools and keep distance';
  }
  if(civ.species === 'Aquatic'){
    return ({
      tribal:     'Hold position — keep equipment dark',
      medieval:   'Answer the acoustic challenge correctly',
      industrial: 'Broadcast identification on the right channel',
      information:'State identity and intent on first contact',
    })[civ.tier] || 'Respect their boundary current';
  }
  return ({
    tribal:(()=>{ const t=civ.traits||{}; return t.ritual==='ancestor' ? 'Respect ancestor-marked ground'
      : t.ritual==='animist' ? 'Respect living boundary markers'
      : t.structure==='chieftain' ? 'Address the chieftain correctly'
      : t.structure==='council' ? 'Wait for council permission'
      : 'Respect boundary markers'; })(),
    medieval:'Request safe conduct formally',
    industrial:'Submit identification and bio-safety assurance',
    information:'Present identification and state intent clearly',
  })[civ.tier] || 'Use cultural insight';
}

function civTierRouteDc(civ){
  if(!civ) return 7;
  return ({
    primitive:5,
    tribal:6,
    medieval:7,
    industrial:8,
    information:8,
  })[civ.tier] || 7;
}

function civTierRouteText(civ, ok){
  if(!civ) return ok ? 'The approach works.' : 'The approach fails.';
  const species = civ.species;
  if(civ.tier === 'primitive'){
    const traits = civ.traits || {};
    const comp = 'uncertain'; // used narratively
    return primGreetResult(species, traits, ok, comp);
  }
  if(species === 'Aquatic'){
    const aquaticSuccess = {
      tribal:    'The crew holds position and keeps bioluminescent equipment dark. The '+species+' read the restraint correctly — this is not a predator move. They allow the approach to continue.',
      medieval:  'The crew presents at the correct depth and does not breach the pressure boundary without signal. The acoustic challenge-response is answered in the right form. The patrol allows entry.',
      industrial:'The crew holds outside the containment perimeter and broadcasts identification correctly. The response comes back clear: provisional access granted, escort inbound.',
      information:'The crew states identity, vessel, and intent without prompting, on the first contact channel. The '+species+' read that as protocol-literate. The interaction moves to the next tier.',
    };
    const aquaticFail = {
      tribal:    'The crew moves too quickly through the boundary current. The '+species+' read it as predator behaviour — fast, direct, committed. The settlement response shifts accordingly.',
      medieval:  'The crew crosses the pressure threshold without answering the challenge tone. The patrol tightens its formation. That was the wrong move in a place with written boundary law.',
      industrial:'The identification broadcast is incomplete or on the wrong channel. The containment arc closes. Someone has already escalated this to a supervisor.',
      information:'The crew\'s entry data is contradictory or missing. The '+species+' flag it immediately. Whatever goodwill the first contact might have built has been spent on a compliance failure.',
    };
    return (ok ? aquaticSuccess : aquaticFail)[civ.tier] || (ok ? aquaticSuccess.tribal : aquaticFail.tribal);
  }
  const success = {
    tribal:(()=>{ const t=civ.traits||{}; return t.ritual==='ancestor'
      ? 'The crew avoids the ancestor-marked ground and waits where the living can judge them. The restraint is understood as respect, not hesitation.'
      : t.ritual==='animist'
      ? 'The crew keeps clear of the living markers — trees, stones, paths with offerings. The group visibly recalculates the crew as guests who can read restraint.'
      : t.structure==='council'
      ? 'The crew follows the markers and waits through the council\'s exchange. That patience matters; the group accepts the approach as possible contact.'
      : t.structure==='chieftain'
      ? 'The crew stops at the marked line and addresses the central authority without crowding them. The chieftain allows the exchange to continue.'
      : 'The crew follows the boundary markers and avoids the charged ground. The group visibly recalculates the crew as possible guests, not raiders.'; })(),
    medieval:'The request is made in the right order: identity, purpose, safe conduct. The formal shape matters, and it lands.',
    industrial:'The crew offers quarantine distance, identity, and bio-safety assurances. The exchange becomes procedural instead of volatile.',
    information:'The crew states who they are, why they are here, and what they want. Clearly. Without ambiguity. To a modern administration, that is the right opening move.',
  };
  const fail = {
    tribal:(()=>{ const t=civ.traits||{}; return t.ritual==='ancestor'
      ? 'The crew steps too near ancestor-marked ground. The mistake is spiritual before it is territorial, and the reaction moves through the group at once.'
      : t.ritual==='animist'
      ? 'The crew treats a living-place marker like decoration. The social mistake is obvious before anyone explains it.'
      : t.structure==='clan'
      ? 'The crew addresses one cluster while crossing another clan\'s marker. The error creates offence in more than one direction.'
      : t.structure==='council'
      ? 'The crew moves before the council has finished conferring. The breach is impatience, and everyone recognises it.'
      : 'The crew misses a boundary marker. The social mistake is obvious before anyone explains it.'; })(),
    medieval:'The request arrives out of order. The formal breach is interpreted as arrogance or ignorance.',
    industrial:'The assurance is incomplete. They catch the gap immediately and the contact window tightens.',
    information:'The explanation is incomplete or contradictory. A local official has already called for backup.',
  };
  return (ok ? success : fail)[civ.tier] || (ok ? success.tribal : fail.tribal);
}

function civMaybeMarkContact(wrap, ctx, reason){
  if(!wrap || wrap.state.contacted) return;
  wrap.state.contacted = true;
  wrap.state.firstContactTurn = G.turn || 1;
  trackPlanetDiscoveryOnce(ctx?.planetKey||G.curPlanet, 'civilization_contact', 'civilization_contacted', {
    biome: wrap.pdata.biome||'unknown', species: wrap.civ.species, tier: wrap.civ.tierLabel,
  });
  if(reason) addLog('First contact with '+wrap.civ.tierLabel.toLowerCase()+' '+wrap.civ.species.toLowerCase()+' — '+reason+'.','ll');
}

function civIntimidationActionText(wrap){
  if(!wrap) return 'The crew makes itself threatening.';
  const armed = civilizationCrewHasGroundWeapons();
  if(wrap.civ.tier === 'primitive'){
    const traits = primTraits(wrap);
    if(!armed){
      if(traits.diet === 'carnivore') return 'The crew shifts into a bare-fisted display of force: spread formation, shoulders squared, every movement projecting size and threat.';
      if(traits.social === 'collective') return 'The crew squares up against the group, fists raised, making clear the away team will not be surrounded or flanked.';
      if(traits.honor === 'honor') return 'The crew breaks every rule of approach at once — too close, too loud, bare fists raised. Whatever protocols exist here are being violated deliberately.';
      return 'The crew advances with bare fists raised, moving too fast, taking up too much space. The message is force.';
    }
    if(traits.diet === 'carnivore') return 'The crew shifts into a display of force: spread formation, weapons visible, every movement projecting size and threat.';
    if(traits.social === 'collective') return 'The crew positions against the group: weapons up, movement aggressive, making clear the away team will not be surrounded or flanked.';
    if(traits.honor === 'honor') return 'The crew breaks every rule of approach at once — too close, too loud, weapons in full view. Whatever protocols exist here are being violated deliberately.';
    return 'The crew advances with weapons visible, moving too fast, taking up too much space. The message is force.';
  }
  if(isDelegationContact()){
    if(!armed) return 'The crew interrupts the delegation protocol with a bare-fisted threat posture: fists raised, formation tight, every gesture meant to say the away team will not be managed.';
    if(wrap.civ.tier === 'information' || wrap.civ.tier === 'industrial') return 'The crew interrupts the delegation protocol with a hard display of force: weapons visible, formation tight, every gesture meant to say the away team will not be managed.';
    return 'The crew answers the delegation with forceful posture, raised weapons, and a deliberate refusal to yield the path.';
  }
  if(isSettlementContact()){
    if(!armed) return 'The crew steps into the settlement approach like an incident waiting to happen: fists raised, refusing distance, and forcing officials or guards to treat this as a threat before it is a conversation.';
    if(wrap.civ.tier === 'information' || wrap.civ.tier === 'industrial') return 'The crew steps into the settlement approach like an armed incident: refusing distance, displaying weapons or tools, and forcing officials or security to treat this as a threat before it is a conversation.';
    return 'The crew makes an entrance by threat: standing where they should not, showing force, and making the settlement decide whether fear is cheaper than resistance.';
  }
  return armed
    ? 'The crew looms over the local, making the first message one of force rather than peace.'
    : 'The crew looms over the local with bare fists raised, making the first message one of force rather than peace.';
}


function civApproachText(civ, state, isLocal){
  // Crew is approaching but has not yet initiated communication.
  const species = civ.species;
  const tier = civ.tier;
  if(tier === 'primitive'){
    const traits = civ.traits || { diet:'omnivore', social:'balanced', curiosity:'neutral', honor:'pragmatic' };
    return primApproachText(species, traits, isLocal);
  }

  // Aquatic — encountered underwater, spatial cues are current, depth, and light
  if(species === 'Aquatic'){
    if(isLocal){
      const aquaticLocalLines = {
        tribal: [
          'A single '+species+' has stopped at distance, hovering in the water column with the stillness of something that does not need to breathe hard to stay alert.',
          'They are reading the crew through bioluminescent flickers — short pulses, then waiting. Not communication with the crew. Communication about the crew.',
          'The '+species+' nearest the crew angles sideways — a threat-display gesture, or simply a better viewing angle. Impossible to say which without more data.',
        ],
        medieval: [
          'A '+species+' with armament has noticed the crew and held position. They have not signalled yet. They are deciding whether this is a gate matter or a patrol matter.',
          'They reach for nothing. Waiting for the crew to establish what kind of arrival this is.',
          'Two '+species+' have silently taken flanking positions. Not aggressive — procedural. They are following a protocol the crew is not reading correctly.',
        ],
        industrial: [
          'A '+species+' worker has paused their task and turned toward the crew. No alarm raised. Standard contact hold.',
          'They are already transmitting on a short-range acoustic link. Someone with authority is being briefed on the crew\'s approach.',
          'Security posture: aware, equidistant, none of them moving closer. This is a trained response.',
        ],
        information: [
          'The '+species+' at distance has deployed recording equipment. The crew is documented before a word passes.',
          'An official-looking '+species+' is maintaining twenty metres and an open acoustic channel. Someone else is already listening.',
          'They are still. Not passive — waiting. The protocol has a next step and they are giving the crew time to initiate it.',
        ],
      };
      const lines = aquaticLocalLines[tier] || aquaticLocalLines.tribal;
      return lines[Math.floor(Math.random()*lines.length)];
    }
    // Settlement approach underwater
    const aquaticSettlementLines = {
      tribal: [
        'The settlement pulses with light — bioluminescent signals passing from the outer markers inward. Word of the crew has reached the center before the crew has.',
        'Sentries hover at the settlement boundary, not swimming toward the crew but angling to maintain visual contact. The settlement\'s outer ring is not empty.',
        'The outer structures are dark — current baffles and pressure walls that read as defensive architecture. The gap between them is exactly wide enough for one arrival at a time.',
      ],
      medieval: [
        'The settlement gate is sealed — an airlock-style pressure door, the '+species+' equivalent of a portcullis. Armoured figures watch from the wall above it.',
        'Settlement traffic has slowed at the outer tier. The crew is visible to the market district and the market district has gone quiet.',
        'A patrol circulates at the boundary, not retreating. The crew\'s approach has been acknowledged and someone with rank is being told.',
      ],
      industrial: [
        'Sonar buoys have repositioned since the crew began their approach. The '+species+' settlement is tracking the crew\'s vector automatically.',
        'A maintenance vessel has altered course. Not threatening — repositioning to keep the crew in sensor range while something with more authority decides how to respond.',
        'Workers near the outer tier have cleared the approach lane. That was a coordinated decision, not individual caution.',
      ],
      information: [
        'A perimeter drone has matched the crew\'s approach speed and distance. It is recording. Someone is watching the feed.',
        'Vehicles have repositioned at the settlement boundary. The response is managed, not panicked — this population has a first-contact protocol and it is running.',
        'Several officials have emerged from the nearest airlock and are holding a safe distance. Recording equipment is live. The crew is already a formal incident.',
      ],
    };
    const lines = aquaticSettlementLines[tier] || aquaticSettlementLines.tribal;
    return lines[Math.floor(Math.random()*lines.length)];
  }
  if(isLocal){
    const localLines = {
      tribal:     (()=>{ const t=civ.traits||{}; const lines=[];
                   if(t.structure==='chieftain') lines.push('A '+species+' with command markings notices the crew, then glances toward the chieftain\'s shelter before deciding not to move closer.');
                   if(t.structure==='council') lines.push('Two elders notice the crew at once. Neither acts alone; a short exchange passes between them before the watching begins.');
                   if(t.structure==='clan') lines.push(species+' working near a clan marker stop just long enough to signal their own cluster. The crew has been placed in a family map.');
                   if(t.ritual==='animist') lines.push('A '+species+' tending offerings at a tree-line marker freezes when the crew approaches. The work they interrupted was not decorative.');
                   if(t.ritual==='ancestor') lines.push('A '+species+' near carved ancestor markers goes still. Their attention moves from the crew to the markers and back again.');
                   if(t.ritual==='totem') lines.push(species+' working near the totem structures glance toward the crew and keep moving, careful not to cross between the crew and the poles.');
                   lines.push('They slow their pace without stopping. Aware. Waiting to see what the crew does first.');
                   return lines; })(),
      medieval:   ['A '+species+' in what looks like a guard role, stationed near the entrance. They have seen the crew.',
                   species+' going about tasks in the settlement yard. One has stopped and is watching.',
                   'They reach for nothing — not a weapon, not a tool. Just waiting for the crew to make a move.'],
      industrial: ['A '+species+' worker has noticed the crew and paused their task. No alarm raised yet.',
                   'Security posture: aware, hands visible, maintaining distance. Standard procedure, probably.',
                   'They have already communicated something on a device. Waiting for a response before acting.'],
      information:['The '+species+' has gone still at twenty metres. They have a phone or radio in their hand. Someone else already knows the crew is here.',
                   'Cameras are present. The crew is being recorded. The individual in front of them is deciding whether to call for more people.',
                   'A '+species+' in what reads as an official role. They are maintaining distance and taking notes — or video.'],
    };
    const lines = localLines[tier] || localLines.tribal;
    return lines[Math.floor(Math.random()*lines.length)];
  }
  // Settlement approach
  const settlementLines = {
    tribal:     (()=>{ const t=civ.traits||{}; const lines=[];
                 if(t.structure==='chieftain') lines.push('The '+species+' settlement is active, but the response flows toward one command point. Sentries watch the crew while runners move toward the chieftain.');
                 if(t.structure==='council') lines.push('Work continues, but elders are gathering in a visible circle. The crew is not being ignored; the decision is being assembled.');
                 if(t.structure==='clan') lines.push('The outer settlement divides into clan clusters. Each one watches from its own marker line, making the approach feel like several negotiations at once.');
                 if(t.ritual==='animist') lines.push('A drum pattern changes around the living boundary markers. The settlement rhythm shifts as if the land itself has been alerted.');
                 if(t.ritual==='ancestor') lines.push('Several '+species+' turn first toward carved memory poles, then toward the crew. The arrival has entered an older conversation.');
                 if(t.ritual==='totem') lines.push('Totem-marked paths frame the settlement approach. Sentries are visible at the perimeter, and none of them stand casually.');
                 lines.push('Work continues in the settlement — but near the outer edge, several '+species+' have turned to watch.');
                 return lines; })(),
    medieval:   ['The settlement is walled. A gate — open. Guards at the post, watching the approach.',
                 species+' traffic through the settlement entrance has slowed. Word of the crew arrival is spreading.',
                 'The market near the entrance has gone quieter. The crew is being discussed.'],
    industrial: ['The '+species+' settlement shows organised activity. A vehicle has stopped near the crew approach path.',
                 'Sensor masts at the settlement edge are tracking the crew. No active response yet.',
                 'Workers near the outer buildings have cleared the area. Someone made that call.'],
    information:['The '+species+' settlement reads as a modern town. Vehicles, roads, utility lines, communication towers. A police car or equivalent has already positioned near the landing site.',
                 'Phones out. Several '+species+' are filming the ship. Word is spreading faster than the crew can walk.',
                 'An emergency services vehicle has parked at a distance. Nobody is approaching yet, but they are organised and waiting.'],
  };
  const lines = settlementLines[tier] || settlementLines.tribal;
  return lines[Math.floor(Math.random()*lines.length)];
}

function civProactiveContactRange(civ){
  return ({ primitive:1, tribal:2, medieval:3, industrial:4, information:6 })[civ?.tier] || 3;
}

function civProactiveContactPatience(civ){
  const tierBase = ({ primitive:5, tribal:4, medieval:3, industrial:2, information:1 })[civ?.tier] || 3;
  const aggressionMod = civ?.aggression === 'Passive' ? 2 : civ?.aggression === 'Territorial' ? 1 : civ?.aggression === 'Hostile' ? -1 : 0;
  return Math.max(1, tierBase + aggressionMod);
}

function civProactiveContactChance(civ){
  const tierChance = ({ primitive:0.15, tribal:0.3, medieval:0.55, industrial:0.75, information:1 })[civ?.tier] ?? 0.45;
  if(civ?.aggression === 'Passive') return Math.max(0.08, tierChance - 0.15);
  if(civ?.aggression === 'Territorial' || civ?.aggression === 'Hostile') return Math.min(1, tierChance + 0.2);
  return tierChance;
}

function civilizationNearestApproachTarget(pdata){
  if(!pdata?.civilization || !G?.player) return null;
  const px = G.player.x, py = G.player.y;
  const civ = pdata.civilization;

  // Primitive: target is the nearest visible local, or the roam center if no locals yet
  if(civ.tier === 'primitive'){
    const key = Object.keys(G.planets||{}).find(k=>G.planets[k]===pdata) || G.curPlanet;
    const locals = (G.enemies?.[key]||[]).filter(e=>e.alive&&!e.hidden&&e.civLocal);
    if(locals.length){
      const nearest = locals
        .map(e=>({ ...e, d:Math.max(Math.abs(e.x-px),Math.abs(e.y-py)) }))
        .sort((a,b)=>a.d-b.d)[0];
      return { pdata, cell:{ type:'civ_local' }, x:nearest.x, y:nearest.y, local:nearest, d:nearest.d };
    }
    if(civ.roamCenter){
      const d = Math.max(Math.abs(civ.roamCenter.x-px), Math.abs(civ.roamCenter.y-py));
      return { pdata, cell:{ type:'civ_local' }, x:civ.roamCenter.x, y:civ.roamCenter.y, d };
    }
    return null;
  }

  let best = null;
  function consider(target){
    if(!target) return;
    const d = Math.max(Math.abs(px - target.x), Math.abs(py - target.y));
    if(!best || d < best.d) best = { ...target, d };
  }
  civilizationBuildingPositions(pdata).forEach(b=>{
    consider({ pdata, cell:{ type:b.type }, x:b.x, y:b.y });
  });
  return best;
}

function civilizationAdjacentApproachTarget(pdata){
  if(!pdata?.civilization || !G?.player) return null;
  const px = G.player.x, py = G.player.y;
  const civ = pdata.civilization;

  // Primitive: use adjacent local if any, otherwise null (delegation never applies)
  if(civ.tier === 'primitive'){
    const key = Object.keys(G.planets||{}).find(k=>G.planets[k]===pdata) || G.curPlanet;
    const adj = (G.enemies?.[key]||[]).find(e=>
      e.alive && !e.hidden && e.civLocal &&
      Math.max(Math.abs(e.x-px),Math.abs(e.y-py)) <= 1
    );
    if(adj) return { pdata, cell:{ type:'civ_local' }, x:adj.x, y:adj.y, local:adj };
    return null;
  }

  const buildings = civilizationBuildingPositions(pdata)
    .map(b=>({ pdata, cell:{ type:b.type }, x:b.x, y:b.y,
      d:Math.max(Math.abs(px - b.x), Math.abs(py - b.y)) }))
    .filter(t=>t.d <= 1)
    .sort((a,b)=>a.d-b.d);
  return buildings[0] || null;
}

function civProactiveContactWarning(civ, target){
  const species = civ?.species || 'locals';
  const territorial = civ?.aggression === 'Territorial';
  if(civ?.tier === 'primitive'){
    const traits = civ.traits || {};
    if(territorial){
      if(target.local) return 'A '+species+' steps into the crew\'s path. Not fleeing. Not attacking. Blocking.';
      return 'The '+species+' group has positioned between the crew and their territory. They are watching every step.';
    }
    return primProactiveWarning(species, traits, !!target.local);
  }
  if(territorial){
    if(target.local){
      if(civ?.tier === 'tribal'){
        const t=civ.traits||{};
        if(t.structure==='chieftain') return 'A '+species+' has moved to intercept the crew, posture tense, attention flicking toward the chieftain\'s line.';
        if(t.structure==='council') return 'A '+species+' has moved to intercept the crew while others gather behind them. The warning is becoming collective.';
        if(t.ritual==='ancestor') return 'A '+species+' has moved to intercept the crew before the ancestor markers — posture tense, eyes fixed.';
        if(t.ritual==='animist') return 'A '+species+' has moved to intercept the crew at a living boundary marker.';
      }
      return 'A '+species+' has moved to intercept the crew — posture tense, eyes fixed.';
    }
    if(civ?.tier === 'tribal'){
      const t=civ.traits||{};
      if(t.structure==='chieftain') return 'Armed '+species+' form a line while runners move toward the chieftain. The crew has been stopped by authority, not accident.';
      if(t.structure==='council') return 'A line of '+species+' forms at the boundary while elders gather behind it. The crew is being held until the council decides.';
      if(t.ritual==='ancestor') return 'Armed '+species+' have formed a visible line between the crew and ancestor-marked ground.';
      if(t.ritual==='animist') return 'Armed '+species+' have formed a visible line at the living boundary markers between the crew and their settlement.';
    }
    const lines = {
      tribal:    'Armed '+species+' have formed a visible line between the crew and their settlement.',
      medieval:  'A '+species+' patrol has blocked the approach road. They are waiting for the crew to stop.',
      industrial:'An official '+species+' vehicle has positioned across the crew\'s approach vector.',
      information:'A formal interdiction notice has been transmitted to the crew position.',
    };
    return lines[civ?.tier] || 'The '+species+' have moved to block the crew approach.';
  }
  if(target.local){
    if(civ?.tier === 'tribal'){
      const t=civ.traits||{};
      if(t.structure==='chieftain') return 'A '+species+' is approaching from the chieftain\'s side of the settlement.';
      if(t.structure==='council') return 'A '+species+' is approaching, with two others watching as if authorised to correct the exchange.';
      if(t.ritual==='totem') return 'A '+species+' is approaching along the totem-marked path.';
    }
    return 'A '+species+' is approaching the crew position.';
  }
  if(civ?.tier === 'tribal'){
    const t=civ.traits||{};
    if(t.structure==='chieftain') return 'The '+species+' settlement has posted watchers while a messenger runs toward the chieftain\'s shelter.';
    if(t.structure==='council') return 'The '+species+' settlement has posted watchers while elders gather near the approach path.';
    if(t.ritual==='totem') return 'The '+species+' settlement has posted watchers along the totem-marked approach path.';
  }
  const lines = {
    tribal:    'The '+species+' settlement has posted watchers near the crew approach path.',
    medieval:  'A patrol from the '+species+' settlement is moving in the crew direction.',
    industrial:'A '+species+' official vehicle has stopped near the landing area.',
    information:'An automated notice from the '+species+' settlement has been received.',
  };
  return lines[civ?.tier] || 'A '+species+' group is moving toward the crew position.';
}

function civProactiveContactOpening(civ, target){
  const species = civ?.species || 'locals';
  const territorial = civ?.aggression === 'Territorial';
  if(civ?.tier === 'primitive'){
    const traits = civ.traits || {};
    if(territorial){
      if(target.local) return 'A '+species+' plants themselves in the crew\'s path. Weapons not raised, but the body says: this is your limit. [T] to respond.';
      return 'The '+species+' group has moved to cut off the crew\'s approach. This is not a welcome — it is a border. [T] to respond.';
    }
    return primProactiveOpening(species, traits, !!target.local);
  }
  if(territorial){
    if(target.local){
      if(civ?.tier === 'tribal'){
        const t=civ.traits||{};
        if(t.structure==='chieftain') return 'A '+species+' warrior steps forward, then waits for the chieftain\'s signal. The boundary is here.';
        if(t.structure==='council') return 'A warrior and two elders step forward together. The warning belongs to the group, not one voice.';
        if(t.ritual==='ancestor') return 'A '+species+' steps between the crew and the ancestor markers. The raised hand means stop before it means speak.';
      }
      const lines = {
        tribal:    'A '+species+' warrior steps forward with a raised fist — not a strike, a warning. The boundary is here.',
        medieval:  'A '+species+' guard levels a weapon at the crew. "This is close enough."',
        industrial:'An armed '+species+' official blocks the path. They show a restricted-zone badge and say nothing else.',
        information:'A perimeter alert has been triggered. The '+species+' who intercepts the crew is not interested in small talk.',
      };
      return lines[civ?.tier] || 'A '+species+' has moved to block the crew. The message is clear.';
    }
    if(civ?.tier === 'tribal'){
      const t=civ.traits||{};
      if(t.structure==='chieftain') return 'Warriors form a line while the chieftain\'s position becomes the centre of the whole response. This is a confrontation under authority.';
      if(t.structure==='council') return 'Warriors form a line and elders gather behind them. This is a confrontation the council is already judging.';
      if(t.ritual==='animist') return 'Warriors form a line at the living markers. This is a confrontation about disturbed ground, not only settlement defence.';
    }
    const lines = {
      tribal:    'Warriors have formed a line and one steps forward. This is a confrontation, not an invitation.',
      medieval:  'Armed '+species+' have blocked the road. The leader addresses the crew directly: stop.',
      industrial:'A '+species+' security detail has surrounded the crew position. A supervisor steps forward.',
      information:'Automated interdiction deployed. A '+species+' contact officer steps forward.',
    };
    return lines[civ?.tier] || 'The '+species+' have blocked the crew\'s path and are demanding a response.';
  }
  if(target.local){
    if(civ?.tier === 'tribal'){
      const t=civ.traits||{};
      if(t.structure==='chieftain') return 'A '+species+' with chieftain-marked authority steps into view and raises an open hand.';
      if(t.structure==='council') return 'Two marked '+species+' step into view together and raise open hands, waiting for the crew to stop.';
      if(t.ritual==='ancestor') return 'A '+species+' with ancestor markings steps into view and raises an open hand before the carved markers.';
    }
    const lines = {
      tribal:    'A '+species+' with ritual markings steps into view and raises an open hand.',
      medieval:  'A '+species+' guard has approached and is gesturing for the crew to halt.',
      industrial:'A '+species+' official has approached with identification displayed.',
      information:'The '+species+' ahead has transmitted a formal contact request.',
    };
    return lines[civ?.tier] || 'A '+species+' approaches with open hands.';
  }
  if(civ?.tier === 'tribal'){
    const t=civ.traits||{};
    if(t.structure==='chieftain') return 'A marked group of '+species+' approaches around a central authority figure. Others watch from behind the marker line.';
    if(t.structure==='council') return 'A group of marked '+species+' approaches in a loose council formation. Several stand forward; no one owns the first word alone.';
    if(t.ritual==='totem') return 'A group of '+species+' has moved to the totem-marked path. Marked figures stand at the front, others watching from behind.';
  }
  const lines = {
    tribal:    'A group of '+species+' has moved to block the crew\'s path. Marked figures at the front, others watching from behind.',
    medieval:  'A mounted '+species+' envoy approaches under a recognisable banner.',
    industrial:'A '+species+' official vehicle approaches at low speed with lights active.',
    information:'A '+species+' contact team transmits credentials and requests a meeting.',
  };
  return lines[civ?.tier] || 'A group of '+species+' approaches the crew position.';
}


function civDelegationApproachText(civ){
  const species = civ?.species || 'locals';
  const tier = civ?.tier || 'tribal';
  if(tier === 'tribal'){
    const t=civ.traits||{};
    if(t.structure==='chieftain') return 'A marked delegation moves around one central figure. The chieftain, or someone speaking with that authority, has come to intercept the away team.';
    if(t.structure==='council') return 'A council delegation intercepts the away team: several elders forward, watchers behind them, no single voice moving alone.';
    if(t.structure==='clan') return 'A clan delegation blocks the path. Different marker patterns stand side by side, suggesting the crew is being judged by more than one kin group.';
    if(t.ritual==='ancestor') return 'A delegation with ancestor markings intercepts the away team before the memory poles. Their posture is deliberate, formal, and not friendly yet.';
    if(t.ritual==='animist') return 'A delegation intercepts the away team at a living marker of branches, stones, and offerings. This is intentional contact on ground that matters.';
  }
  // Primitive civilizations do not send delegations — they have no organised political body
  const lines = {
    tribal: [
      'A group of marked '+species+' has moved to intercept the away team. Several stand forward while others watch from further back.',
      'A band of '+species+' blocks the path with deliberate posture rather than weapons. This is intentional contact, not a chance meeting.',
    ],
    medieval: [
      'A formal party from the settlement meets the crew at the approach. Guards hang back while an official steps forward.',
      'A watch delegation blocks the road. Their weapons remain lowered, but the meaning is clear: answer before proceeding.',
    ],
    industrial: [
      'A local response team intercepts the away crew. Security, technicians, and one obvious negotiator hold a careful line.',
      'An organised delegation arrives with recording equipment already running. They want identification and intent.',
    ],
    information: [
      'A precise contact delegation forms around the crew position. Their spacing is exact, their signal traffic intense.',
      'The '+species+' have sent a formal contact party. The away team is surrounded by protocol, not panic.',
    ],
  };
  return pick(lines[tier] || lines.tribal);
}

function maybeCivilizationInitiatesContact(pdata){
  if(G.mode !== 'planet' || G.dialogue || G.dead || G.retired) return false;
  const civ = pdata?.civilization;
  if(!civ) return false;
  // Hostile-aggression civs never talk — their locals are already set to attack on sight
  if(civ.aggression === 'Hostile') return false;
  const state = ensureCivilizationState(pdata);
  if(!state || state.contacted || state.hostile) return false;
  // Guard: only process once per turn, even if called multiple times in the same action.
  if(state._lastProactiveCheckTurn === (G.turn || 1)) return false;
  state._lastProactiveCheckTurn = G.turn || 1;
  if((G.turn || 1) < (state.nextProactiveContactTurn || 0)) return false;

  const target = civilizationNearestApproachTarget(pdata);
  if(!target) return false;
  // Primitives are hunters/gatherers — no organised delegation possible, local contact only
  const isPrimitive = civ.tier === 'primitive';
  if(!target.local && (state.delegationAttempted || isPrimitive)) return false;

  const range = civProactiveContactRange(civ);
  if(target.d > range){
    state.unansweredContactTurns = 0;
    state.proactiveWarningGiven = false;
    state.nextProactiveContactTurn = (G.turn || 1) + ({ primitive:6, tribal:4, medieval:2, industrial:1, information:0 }[civ.tier] || 2);
    return false;
  }

  state.unansweredContactTurns = (state.unansweredContactTurns || 0) + 1;
  if(!state.proactiveWarningGiven){
    state.proactiveWarningGiven = true;
    addLog(civProactiveContactWarning(civ, target)+' [T] to respond.','lw');
    return false;
  }

  // Each turn of ignoring after the first warning — escalating log lines
  const ignoring = state.unansweredContactTurns - 1;
  if(ignoring > 0 && ignoring <= 3){
    const species = civ.species;
    const territorial = civ.aggression === 'Territorial';
    const isPrim = civ.tier === 'primitive';
    const traits = isPrim ? (civ.traits||{}) : {};
    const escalationLines = [];
    if(territorial){
      escalationLines.push('The '+species+' hold their position. They are not leaving. Being ignored is making this worse.');
      escalationLines.push('The '+species+' have moved closer. The warning was not optional.');
      escalationLines.push('The '+species+' are now directly in the crew\'s path. This will not be ignored much longer.');
    } else if(isPrim && traits.curiosity==='curious'){
      escalationLines.push('The '+species+' have moved closer on their own. Still watching. Still waiting for a response.');
      escalationLines.push('One of the '+species+' makes a sound in the crew\'s direction. A call that has gone unanswered.');
    } else if(isPrim && traits.curiosity==='isolated'){
      escalationLines.push('The '+species+' have not retreated. Being ignored is being read as its own kind of statement.');
    } else {
      escalationLines.push('The '+species+' are still there. Whatever is about to happen, the crew\'s silence is part of it.');
    }
    if(escalationLines.length) addLog(escalationLines[Math.min(ignoring-1, escalationLines.length-1)],'lw');
    // Territorial: each ignored turn raises alert
    if(territorial) state.alert = Math.min(5,(state.alert||0)+1);
  }

  const patience = civProactiveContactPatience(civ);
  if(state.unansweredContactTurns < patience) return false;
  if(Math.random() > civProactiveContactChance(civ)) return false;

  const contactTarget = civilizationAdjacentApproachTarget(pdata);
  if(!contactTarget) return false;

  // Territorial: proactive approach adds alert — they are not friendly, they are confronting
  state.alert = Math.min(5, (state.alert || 0) + (civ.aggression === 'Territorial' ? 1 : 0));
  addLog(civProactiveContactOpening(civ, contactTarget),'ll');
  if(!contactTarget.local){
    contactTarget.contactKind = 'delegation';
    contactTarget.noEscape = true;
    state.delegationAttempted = true;
  }
  startCivilizationDialogue(contactTarget);
  return true;
}

