// ── PRIMITIVE TRAIT HELPERS ────────────────────────────────────────────────
// All functions below are only invoked when civ.tier === 'primitive'.
// They receive a traits object: { diet, social, curiosity, honor }

function primTraits(wrap){
  return wrap?.civ?.traits || { diet:'omnivore', social:'balanced', curiosity:'neutral', honor:'pragmatic' };
}

// What impresses them vs what insults them, per trait axis
function primImpressInsult(traits){
  const impress = [], insult = [];
  // DIET
  if(traits.diet === 'carnivore'){
    impress.push('showing hunting trophies or predator marks');
    impress.push('demonstrating physical strength or dominance');
    insult.push('appearing weak, wounded, or prey-like');
    insult.push('sharing plant-based food offerings');
  } else if(traits.diet === 'herbivore'){
    impress.push('moving slowly and non-threateningly');
    impress.push('offering plant matter, seeds, or fruit');
    insult.push('displaying weapons or predatory posture');
    insult.push('showing blood or meat');
  } else { // omnivore
    impress.push('sharing food of any kind');
    impress.push('demonstrating adaptability');
    insult.push('wasting or destroying food');
  }
  // SOCIAL
  if(traits.social === 'collective'){
    impress.push('acknowledging the group rather than any individual');
    insult.push('singling out one member to address alone');
    insult.push('trying to negotiate with one individual away from the group');
  } else if(traits.social === 'individual'){
    impress.push('addressing the individual directly with eye contact');
    impress.push('recognising personal achievement or skill');
    insult.push('ignoring an individual and addressing the group');
  }
  // CURIOSITY
  if(traits.curiosity === 'curious'){
    impress.push('showing unfamiliar objects or technology');
    insult.push('refusing to demonstrate or explain equipment');
  } else if(traits.curiosity === 'isolated'){
    insult.push('revealing too much about the crew or the ship');
    insult.push('approaching without warning from outside their territory');
    impress.push('staying in place and letting them approach first');
  }
  // HONOR
  if(traits.honor === 'honor'){
    impress.push('keeping promises and not retreating after a stated commitment');
    insult.push('breaking stated intent or appearing to deceive');
    insult.push('attacking someone who is unarmed or retreating');
  } else { // pragmatic
    impress.push('offering something immediately useful');
    insult.push('making symbolic gestures with no concrete value');
  }
  return { impress, insult };
}

// First encounter approach text — driven by traits
function primApproachText(species, traits, isLocal){
  const { diet, social, curiosity } = traits;
  const pool = [];

  // Aquatic primitive — encountered on the seabed, not the surface
  if(species === 'Aquatic'){
    if(isLocal){
      pool.push('A single '+species+' drifts to a stop at the edge of visibility. Their bioluminescent markings dim — not threat display, probably. Waiting behaviour.');
      pool.push('The '+species+' nearest the crew tilts in the water. Their gaze is direct and still. They have seen nothing like the crew before, and that is exactly what their posture is saying.');
      if(curiosity === 'curious') pool.push('They close half the distance without warning, then stop. Fast enough to read as confident; cautious enough to read as controlled. They want a better look.');
      if(curiosity === 'isolated') pool.push('The '+species+' backs into a current shadow — darker water, harder to see. They have not fled. But they are not staying visible either.');
      if(social === 'collective') pool.push('One '+species+' is visible. The crew can hear pressure-clicks from the dark around it. They are not alone, and they are not pretending otherwise.');
    } else {
      pool.push('A cluster of '+species+' has paused their activity at the edge of the settlement. Bioluminescent signals pass between them in short bursts — the crew is being discussed.');
      pool.push('The seabed ahead shows organised space: paths cleared of sediment, structures arranged by function. Several '+species+' are visible at the outer edge, watching.');
      if(curiosity === 'curious') pool.push('Several '+species+' have come to the settlement boundary and stopped there. They are watching the crew with the composure of a group that has decided to wait, not flee.');
      if(curiosity === 'isolated') pool.push('The settlement has gone dark — bioluminescent signals cut off, movement stilled. They know the crew is here and they have chosen not to be seen.');
      if(diet === 'carnivore') pool.push('Bone-stacks and organised kills near the settlement entrance. These '+species+' are hunters. The crew is approaching their territory from outside it.');
    }
    return pool[Math.floor(Math.random()*pool.length)];
  }

  if(isLocal){
    if(curiosity === 'curious'){
      pool.push('A single '+species+' has stopped at twenty metres. Head tilted. They are assessing the crew, not retreating.');
      pool.push('They approach to within a cautious distance before stopping. Their eyes move from crew member to crew member.');
    } else if(curiosity === 'isolated'){
      pool.push('A '+species+' freezes at the sight of the crew. Their whole body angles toward an escape route.');
      pool.push('They have seen the crew and have not run. That is everything the situation offers right now.');
    } else {
      pool.push('A '+species+' watches from the edge of a thicket. Not advancing. Not leaving.');
      pool.push('One '+species+' at the perimeter. Still. Waiting to see what the crew does before deciding anything.');
    }
    if(diet === 'carnivore'){
      pool.push('The '+species+' scans the crew the way a hunter sizes up unfamiliar quarry: weight, speed, threat potential.');
    } else if(diet === 'herbivore'){
      pool.push('The '+species+' has gone very still — the stillness of prey assessing whether to bolt.');
    }
    if(social === 'collective'){
      pool.push('One '+species+' stands visible, but the crew can hear movement deeper in the undergrowth. They are not alone.');
    }
  } else {
    if(curiosity === 'curious'){
      pool.push('A loose cluster of '+species+' has paused near the treeline. They are watching the crew, not scattering.');
      pool.push('Several '+species+' have gathered at the edge of a camp clearing. Their attention is fixed on the away team.');
    } else if(curiosity === 'isolated'){
      pool.push('Fire pits. Shelters. Movement between them. The '+species+' camp has gone still since the crew arrived.');
      pool.push('The '+species+' camp is visible, but the usual activity has stopped. Something has signalled the crew\'s presence.');
    } else {
      pool.push('A hunting band or family group is visible ahead. They have spotted the crew but have not acted.');
      pool.push('The camp is active — fire smoke, movement. Word of the crew\'s presence has reached it.');
    }
    if(diet === 'carnivore'){
      pool.push('Kills and bones near the camp entrance. The '+species+' here are predators. The crew walks into their territory.');
    } else if(diet === 'herbivore'){
      pool.push('The '+species+' camp is set high and open — chosen for visibility and escape, not defence. They prefer to see threats coming.');
    }
  }
  return pool[Math.floor(Math.random()*pool.length)];
}

// What the primitive group communicates as their want/need
function primWantText(species, state, traits, comp){
  const { diet, curiosity, honor } = traits;
  if(state.hostile) return 'The sounds they make are unmistakably a warning. No translation needed.';
  if(state.alert >= 4){
    if(diet === 'carnivore') return 'The '+species+' growls carry intent. This is a territorial challenge, not a conversation.';
    return 'Rapid gestures: away, back, out. The meaning is plain even without shared language.';
  }
  if(comp === 'none' || comp === 'uncertain'){
    // Low comprehension — gamble, vague
    if(diet === 'carnivore') return 'The sounds are guttural and rhythmic. Could be greeting. Could be sizing up. No way to be sure.';
    if(diet === 'herbivore') return 'High-pitched calls pass between the '+species+'. The crew is being discussed. The tone is hard to read.';
    if(curiosity === 'curious') return 'They point repeatedly at the ship, then at the crew, then at the sky. Something about the arrival matters to them.';
    if(curiosity === 'isolated') return 'They gesture sharply — direction, distance. They want the crew to move somewhere, but which direction is unclear.';
    return 'Sound and gesture. Pattern and repetition. Something is being communicated, but the meaning is a gamble.';
  }
  if(honor === 'honor'){
    return '"...mark... boundaries... swear... or leave."';
  }
  if(curiosity === 'curious'){
    return '"...sky-fire... walk from... what are..."';
  }
  return '"...not hunt us... leave the water... go that way."';
}

// Observe text for primitive — reads their body language based on traits
function primObserveText(species, state, traits, isLocal){
  const { diet, social, curiosity, honor } = traits;
  const pool = [];

  // Aquatic primitive — body language reads differently underwater
  if(species === 'Aquatic'){
    pool.push('The '+species+' communicate in pulses of bioluminescence — short, patterned, clearly structured. The crew cannot read it, but the regularity is unmistakable: this is language.');
    if(diet === 'carnivore'){
      pool.push('The '+species+' body is built for pursuit: streamlined, limbs folded close, eyes that track movement before anything else. Their stillness is the stillness of a predator at rest, not at ease.');
    } else if(diet === 'herbivore'){
      pool.push('Their posture is wide and open — fins extended, no compressed readiness. The '+species+' here are not hunters, and their body language says so plainly.');
    } else {
      pool.push('Calm, adaptive movement. The '+species+' hold their distance without urgency, reading the crew in the measured way of something that has learned to weigh unknowns before acting.');
    }
    if(social === 'collective'){
      pool.push('They are not individuals here — they are a current. Decisions pass between them in light-flickers faster than the crew can follow. No single one of them will act before the group does.');
    } else if(social === 'individual'){
      pool.push('The nearest '+species+' is clearly running their own calculation. No signal to others. No wait for consensus. They move and decide alone.');
    }
    if(curiosity === 'curious'){
      pool.push('Their attention keeps returning to the crew\'s equipment — the surfaces, the lights, the shapes that make no sense in this environment. Fear is present, but it is losing ground to something else.');
    } else if(curiosity === 'isolated'){
      pool.push('The '+species+' make no approach. They observe. Their territory is being violated and the only question they are asking is what kind of violation this is.');
    }
    if(honor === 'honor'){
      pool.push('Their arrangement is formal — relative positions, angles, the careful distance between each individual. This group has protocol, and the crew has walked into the middle of it without knowing the rules.');
    }
    return pool[Math.floor(Math.random()*pool.length)];
  }

  if(diet === 'carnivore'){
    pool.push('The '+species+' hold their bodies with the compressed readiness of hunters. Nothing about them is relaxed.');
    pool.push('They have scent-marked the area, possibly. Their eyes track movement more than faces.');
  } else if(diet === 'herbivore'){
    pool.push('The '+species+' keep one side of their body angled slightly away — not hostility, but readiness to flee.');
    pool.push('Wide pupils, frequent glances at the tree-line. Fear is present, but so is something that wants to stay.');
  } else {
    pool.push('The '+species+' read as opportunistic: interested, watchful, capable of going either way.');
  }
  if(social === 'collective'){
    pool.push('Decision-making happens visibly between them: looks, small sounds, a shared economy of movement before any one of them acts.');
    if(isLocal) pool.push('This individual keeps glancing back toward the larger group. They will not decide anything alone.');
  } else if(social === 'individual'){
    pool.push('The one the crew can see is clearly making their own calculation. No glances back. No asking permission.');
  }
  if(curiosity === 'curious'){
    pool.push('Their gaze drifts to the crew\'s equipment. Whatever fear is present, it shares space with intense interest.');
  } else if(curiosity === 'isolated'){
    pool.push('The eyes say one thing clearly: the crew is deep inside something the '+species+' consider their own. This space is not shared.');
  }
  if(honor === 'honor'){
    pool.push('Their posture is formal in a way that suggests ritual. There are rules here, even if the crew cannot read them.');
  }
  return pool[Math.floor(Math.random()*pool.length)];
}

// Gift reaction — success or failure depending on traits
function primGiftReaction(species, item, traits, comp){
  const { diet, social, curiosity, honor } = traits;
  const name = item?.name || 'the offering';
  const val  = item?.value || 0;

  const isFood     = /food|ration|fruit|seed|plant|water|flower|herb|brew/i.test(name);
  const isWeapon   = /gun|blade|knife|weapon|ammo/i.test(name);
  const isTech     = /module|device|data|tech|cpu|cell|canister|coupling|gearwork/i.test(name);
  const isOrnament = /charm|bead|talisman|brooch|pendant|carved|polished|bone|fetish|seal/i.test(name);
  const isMeat     = /meat|kill|trophy|bone/i.test(name);

  // ── Hard wrong answers ────────────────────────────────────────────────────
  // Weapon to herbivore — alarming
  if(diet === 'herbivore' && isWeapon){
    return { ok:false, alertSpike:2, text:name+' held out. The '+species+' see the weapon first. Before the gesture can register as offering, two of them have stepped back and one has made a sound the crew cannot interpret but does not need to. The alert goes up.' };
  }
  // Plant food to carnivore — insulting
  if(diet === 'carnivore' && isFood && !isMeat){
    return { ok:false, alertSpike:1, text:'The '+species+' look at the plant matter. Then at the crew. The expression — if it can be called that — is not anger. It is something closer to contempt. They do not take it.' };
  }
  // Honor-bound group offered something ornamental but low-value
  if(honor === 'honor' && isOrnament && val < 40){
    return { ok:false, alertSpike:1, text:'The object is inspected and set down again. To an honor-bound group, bringing something trivial reads as treating the exchange as trivial. That is an insult of a particular kind.' };
  }
  // Pragmatic group offered pure symbolism
  if(honor === 'pragmatic' && isOrnament && !isTech && val < 50){
    return { ok:false, alertSpike:0, text:'The ornament is looked at and not taken. These people trade in things that do something. A decoration does not.' };
  }
  // Tech to isolated group — reads as bait or threat
  if(curiosity === 'isolated' && isTech){
    return { ok:false, alertSpike:2, text:'The device is set on the ground between them and the crew. No one approaches it. The group backs away by a body-length and watches the object with the wariness reserved for things that might be traps. Alert rises.' };
  }
  // Collective addressed through single-item individual gift
  if(social === 'collective' && val < 30){
    return { ok:false, alertSpike:0, text:'The group watches as the object is offered to the one person nearest. The collective reads this as the crew trying to split them — a known tactic. No one accepts.' };
  }

  // ── Correct matches ───────────────────────────────────────────────────────
  if(curiosity === 'curious' && isTech){
    return { ok:true, alertSpike:-1, text:name+' is passed between hands immediately, examined from every angle. Their attention is no longer divided between the crew and the object — the object won. Something opened.' };
  }
  if(honor === 'honor' && isOrnament && val >= 50){
    return { ok:true, alertSpike:-1, text:name+' received with slow deliberation — turned over, examined, then set against the chest in a gesture that reads as acceptance. A proper offering was made and recognised.' };
  }
  if(diet === 'carnivore' && isMeat){
    return { ok:true, alertSpike:-1, text:'Meat offered to hunters. The gesture reads clearly and is taken without ceremony. This group respects the currency of the hunt.' };
  }
  if(diet === 'herbivore' && isFood){
    return { ok:true, alertSpike:-1, text:name+' offered slowly and accepted. Food given openly, without demand — that is a language they understand.' };
  }
  if(social === 'collective' && val >= 50){
    return { ok:true, alertSpike:-1, text:name+' shown to all of them before the nearest one takes it. A group decision, made visibly. The answer is yes.' };
  }
  if(honor === 'pragmatic' && isTech){
    return { ok:true, alertSpike:-1, text:name+' examined with practical attention. They are not interested in what it symbolises. They are interested in what it does. Apparently it does something useful.' };
  }

  // Default: if the object has no legible use or symbolic weight, it is not a gift.
  const meaningValue = civOfferValueForBarter({ tier:'primitive', traits }, item);
  if(meaningValue < 25){
    return { ok:false, alertSpike:0, text:name+' is examined, then left where it was placed. The gesture was visible, but the object does not mean anything useful, edible, impressive, or proper to them.' };
  }
  if(val >= 60) return { ok:true, alertSpike:0, text:name+' examined, then accepted. Not warmly — but accepted.' };
  return { ok:false, alertSpike:0, text:name+' is received only as a gesture, not as a meaningful gift. They do not treat it as an exchange.' };
}


// First contact success/fail text for primitive — trait-driven
function primGreetResult(species, traits, ok, comp){
  const { diet, social, curiosity, honor } = traits;
  if(ok){
    if(comp === 'none' || comp === 'uncertain'){
      // Success at low comprehension is a gamble that paid off
      if(diet === 'carnivore') return 'The crew held posture that read as strength rather than threat. Something in that worked. The '+species+' have not withdrawn.';
      if(curiosity === 'curious') return 'The crew\'s strangeness is the hook. Curiosity beat caution. They edge forward rather than back.';
      if(honor === 'honor') return 'The gesture landed right by accident or instinct. Something in the crew\'s movement matched a known form. They accept the opening.';
      return 'The approach was slow enough, open enough. Something read correctly. The '+species+' have not broken contact.';
    }
    if(diet === 'carnivore') return 'Strength is the language here. The crew did not show weakness. That was the test.';
    if(social === 'collective') return 'The greeting acknowledged the group rather than singling anyone out. That matters to them. The collective answers.';
    if(curiosity === 'curious') return 'They had questions. The crew looked like someone who might answer them. That opened the door.';
    return 'The approach read correctly. Not threatening. Not submissive. Something in between that they accept.';
  } else {
    if(comp === 'none' || comp === 'uncertain'){
      // Failure at low comprehension — the gamble lost
      if(diet === 'carnivore') return 'The movement read as submission or vulnerability. A hunter group does not respect that. They pull back or advance — nothing good.';
      if(curiosity === 'isolated') return 'The approach was too direct, too visible, too fast. The '+species+' have closed off.';
      if(social === 'collective') return 'The crew addressed one individual. The group takes that as an attempt to split them. Alarm passes through the whole band.';
      return 'Something in the gesture was wrong — badly wrong. The crew has no way to know what. The '+species+' react with alarm.';
    }
    if(diet === 'carnivore') return 'The crew read as prey or rival — the greeting matched neither acceptable category. The '+species+' have shifted to challenge posture.';
    if(curiosity === 'isolated') return 'The crew moved in the wrong direction, toward something sacred or territorial. The greeting is erased by the trespass.';
    if(honor === 'honor') return 'Something in the approach violated a rule the crew did not know existed. The break is read as a deliberate insult.';
    return 'The gesture landed wrong. The '+species+' understand it as something it was not meant to be.';
  }
}

// What text the civ produces during a proactive approach
function primProactiveOpening(species, traits, isLocal){
  const { diet, social, curiosity, honor } = traits;
  if(isLocal){
    if(curiosity === 'curious') return 'One '+species+' breaks from cover and approaches — direct, urgent, clearly intending contact. [T] to respond.';
    if(curiosity === 'isolated') return 'A '+species+' has placed themselves between the crew and deeper territory. They are not attacking. They are blocking. [T] to respond.';
    if(diet === 'carnivore') return 'A '+species+' steps into the open directly in the crew\'s path. No weapons raised, but nothing welcoming either. [T] to respond.';
    return 'A '+species+' approaches with slow, deliberate steps and a palm turned outward. [T] to respond.';
  }
  if(curiosity === 'curious') return 'A small group of '+species+' have emerged from their camp and are approaching across the open ground. [T] to respond.';
  if(honor === 'honor') return 'A '+species+' carrying a marked staff moves toward the crew\'s position. Ritual posture. Boundary meeting. [T] to respond.';
  if(diet === 'carnivore') return 'Several '+species+' fan into a loose arc as they approach. Flanking pattern. They are assessing range and option. [T] to respond.';
  return 'The '+species+' camp has sent a representative to the crew\'s position. [T] to respond.';
}

function primProactiveWarning(species, traits, isLocal){
  const { curiosity, honor } = traits;
  if(isLocal){
    if(curiosity === 'isolated') return 'A '+species+' is watching the crew from cover. They have not retreated. Something is being decided.';
    return 'A single '+species+' is tracking the crew from a distance.';
  }
  if(honor === 'honor') return 'The '+species+' camp has observers posted at the boundary of their territory. The crew has been seen.';
  if(curiosity === 'curious') return 'The '+species+' camp has noticed the crew. Several have gathered at the edge to watch.';
  return 'The '+species+' camp is visible ahead. They know the crew is here.';
}

// ── END PRIMITIVE TRAIT HELPERS ─────────────────────────────────────────────

