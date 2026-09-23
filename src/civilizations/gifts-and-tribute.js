// ── Gift classification ────────────────────────────────────────────────────
// Returns an object describing what kind of thing is being offered.
function civClassifyGift(item){
  const name = item?.name || '';
  const usable = item?.usable || '';
  const val = item?.value || 0;
  // Commodity items carry an explicit giftCat — use it as primary classification
  const comDef = item?.commodityId ? COMMODITIES[item.commodityId] : null;
  const gc = comDef?.giftCat || null;
  // Tech check first — items like "Ringworld Datacore" contain "core" but are tech,
  // not biological. isTech takes priority and excludes from isAlienBio.
  const isTech = gc === 'tech' || (!gc && (
    /module|device|data|drive|instrument|canister|coupling|gearwork|circuit|component|cpu|cell|scanner|alloy|\bore\b|metal|structural|refined|precision|encrypted|survey|production|datacore/i.test(name)
    || usable === 'oxytank' || usable === 'medikit'));
  // Bio: creature remains — explicitly excluded if already classified as tech
  // 'core' only matches bio when NOT a tech item (e.g. "Alien Core" yes, "Datacore" no)
  const isAlienBio = !isTech && (gc === 'bio' || (!gc &&
    /hide|pelt|tissue|fang|organ|carcass|trophy|kill/i.test(name)
    || (/core/i.test(name) && !/carved|charm|ornament|bead/i.test(name))
    || (/sample/i.test(name) && !/mineral|biodata|survey/i.test(name))
    || (/bone/i.test(name) && !/carved|charm/i.test(name))));
  const isOrnament = gc === 'ornament' || (!gc &&
    /charm|bead|talisman|brooch|pendant|carved|polished|fetish|seal|totem|relic|flower/i.test(name));
  const isWeapon = gc === 'weapon' || (!gc && (
    /gun|blade|knife|weapon|ammo/i.test(name) || usable === 'gun' || usable === 'gun_sniper' || usable === 'knife'));
  const isFood = gc === 'food' || (!gc &&
    /food|ration|fruit|seed|plant|water|herb|brew|medicine/i.test(name));
  const isMedical = /medikit|medicine|antibiotic|trauma|herb|pills/i.test(name) || ['medikit','trauma_kit','antibiotics','iodine_pills'].includes(usable);
  const isSurvival = /oxygen|fuel|floodlight|canister|tank/i.test(name) || ['oxytank','floodlight'].includes(usable);
  const isArmor = /suit|armour|armor|plate|exosuit/i.test(name) || ['armor_flight','armor_reinforced','armor_diving','armor_exosuit','armor_plate'].includes(usable);
  const isMoodDrug = ['morale_drug','morale_drug_civ','mild_antidepressants'].includes(usable);
  const hasKnownMeaning = isAlienBio || isTech || isOrnament || isWeapon || isFood || isMedical || isSurvival || isArmor || isMoodDrug || gc;
  return { isAlienBio, isTech, isOrnament, isWeapon, isFood, isMedical, isSurvival, isArmor, isMoodDrug, hasKnownMeaning, val };
}

function civOfferValueForBarter(civ, item){
  if(!item) return 0;
  const base = Math.max(0, item.value || 0);
  let value = base;
  const tier = civ?.tier || 'primitive';
  const traits = civ?.traits || {};
  const g = civClassifyGift(item);

  if(!g.hasKnownMeaning && base <= 0) return 0;
  if(!g.hasKnownMeaning){
    if(tier === 'primitive') return Math.floor(base * (traits.curiosity === 'curious' ? 0.35 : 0.1));
    if(tier === 'tribal') return Math.floor(base * 0.35);
    if(tier === 'medieval') return Math.floor(base * 0.65);
    return Math.floor(base * 0.8);
  }

  if(g.isWeapon){
    value = Math.max(value, tier === 'primitive' ? 120 : tier === 'tribal' ? 140 : tier === 'medieval' ? 130 : tier === 'industrial' ? 90 : 55);
    if(tier === 'primitive' && traits.diet === 'herbivore') value = Math.floor(value * 0.35);
    if(tier === 'primitive' && traits.diet === 'carnivore') value = Math.floor(value * 1.35);
    if(tier === 'tribal' && traits.structure === 'chieftain') value = Math.floor(value * 1.25);
    if(tier === 'information') value = Math.floor(value * 0.45);
  }
  if(g.isTech){
    value = Math.max(value, tier === 'primitive' ? 35 : tier === 'tribal' ? 75 : tier === 'medieval' ? 180 : tier === 'industrial' ? 150 : 120);
    if(tier === 'primitive' && traits.curiosity === 'curious') value = Math.floor(value * 1.8);
    if(tier === 'primitive' && traits.curiosity === 'isolated') value = Math.floor(value * 0.25);
    if(tier === 'tribal' && traits.structure === 'council') value = Math.floor(value * 1.25);
    if(tier === 'industrial' && traits.economy === 'corporate') value = Math.floor(value * 1.25);
  }
  if(g.isFood){
    value = Math.max(value, tier === 'primitive' ? 70 : tier === 'tribal' ? 80 : 40);
    if(tier === 'tribal' && traits.ritual === 'animist') value = Math.floor(value * 1.3);
  }
  if(g.isAlienBio){
    value = Math.max(value, tier === 'primitive' ? 70 : tier === 'tribal' ? 90 : tier === 'medieval' ? 80 : 20);
    if(tier === 'primitive' && traits.diet === 'carnivore') value = Math.floor(value * 1.5);
    if(tier === 'primitive' && traits.diet === 'herbivore') value = Math.floor(value * 0.2);
    if(tier === 'tribal' && (traits.ritual === 'totem' || traits.ritual === 'animist')) value = Math.floor(value * 1.4);
    if(tier === 'information') value = Math.floor(value * 0.15);
  }
  if(g.isOrnament){
    value = Math.max(value, tier === 'primitive' ? 55 : tier === 'tribal' ? 90 : tier === 'medieval' ? 80 : 35);
    if(tier === 'tribal' && traits.ritual === 'totem') value = Math.floor(value * 1.25);
    if(tier === 'medieval' && traits.governance === 'mercantile') value = Math.floor(value * 1.2);
  }
  if(g.isMedical){
    value = Math.max(value, tier === 'primitive' ? 20 : tier === 'tribal' ? 85 : tier === 'medieval' ? 110 : tier === 'industrial' ? 125 : 80);
    if(tier === 'primitive' && traits.curiosity !== 'curious') value = Math.floor(value * 0.35);
    if(tier === 'tribal' && traits.ritual === 'animist') value = Math.floor(value * 1.25);
    if(tier === 'information') value = Math.floor(value * 0.7);
  }
  if(g.isSurvival){
    value = Math.max(value, tier === 'primitive' ? 10 : tier === 'tribal' ? 25 : tier === 'medieval' ? 70 : tier === 'industrial' ? 115 : 80);
    if(tier === 'primitive' && traits.curiosity !== 'curious') value = Math.floor(value * 0.2);
    if(tier === 'information') value = Math.floor(value * 0.55);
  }
  if(g.isArmor){
    value = Math.max(value, tier === 'primitive' ? 35 : tier === 'tribal' ? 75 : tier === 'medieval' ? 120 : tier === 'industrial' ? 100 : 60);
    if(tier === 'tribal' && traits.structure === 'chieftain') value = Math.floor(value * 1.15);
  }
  if(g.isMoodDrug){
    value = Math.max(value, tier === 'primitive' ? 0 : tier === 'tribal' ? 35 : tier === 'medieval' ? 45 : tier === 'industrial' ? 50 : 20);
    if(tier === 'primitive') value = 0;
    if(tier === 'information') value = Math.floor(value * 0.4);
  }
  return Math.max(0, Math.floor(value));
}

// Returns the gift category key for tracking repeat gifts of the same type.
// The same category offered repeatedly yields diminishing relation returns.
function civGiftCategory(g){
  if(g.isAlienBio)  return 'bio';
  if(g.isTech)      return 'tech';
  if(g.isWeapon)    return 'weapon';
  if(g.isFood)      return 'food';
  if(g.isOrnament)  return 'ornament';
  if(g.isMedical)   return 'medical';
  if(g.isSurvival)  return 'survival';
  if(g.isArmor)     return 'armor';
  return 'misc';
}

// Returns a multiplier (1.0, 0.5, or 0) based on how many times this category
// has already been accepted by this civ. First gift: full value. Second: half.
// Third and beyond: no relation gain (still consumed, still narrated — just no credit).
function civGiftDiminishingFactor(wrap, category){
  const counts = wrap.state.giftCategoryCounts || {};
  const n = counts[category] || 0;
  if(n === 0) return 1.0;
  if(n === 1) return 0.5;
  return 0;
}

// Record that a gift of this category was accepted.
function civGiftCategoryAccepted(wrap, category){
  if(!wrap.state.giftCategoryCounts) wrap.state.giftCategoryCounts = {};
  wrap.state.giftCategoryCounts[category] = (wrap.state.giftCategoryCounts[category] || 0) + 1;
}

function offerCivilizationGift(ctx, giftIdx, giftEntry=null){
  const gift = giftEntry || alienGiftCandidates().find(entry=>entry.idx === giftIdx);
  const wrap = dialogueCivilization();
  if(!gift || !wrap) return;
  if(gift.source === 'cargo'){ const ci = G.cargo.indexOf(gift.item); if(ci !== -1) G.cargo.splice(ci,1); }
  else {
    const ii = G.inventory.indexOf(gift.item);
    G.inventory.splice(ii !== -1 ? ii : gift.idx, 1);
  }
  ctx.offeredItemName = gift.item.name || 'the object';
  wrap.state.giftsReceived = (wrap.state.giftsReceived || 0) + 1;
  const tier = wrap.civ.tier;
  const species = wrap.civ.species.toLowerCase();
  const aggression = wrap.civ.aggression || 'Passive';
  const traits = wrap.civ.traits || {};
  const { isAlienBio, isTech, isOrnament, isWeapon, isFood, isMedical, isSurvival, isArmor, isMoodDrug, hasKnownMeaning, val } = civClassifyGift(gift.item);
  const giftMeaningValue = civOfferValueForBarter(wrap.civ, gift.item);
  const name = ctx.offeredItemName;
  const giftCat = civGiftCategory(civClassifyGift(gift.item));
  const diminish = civGiftDiminishingFactor(wrap, giftCat);
  // Helper: apply a relation gain, scaled by diminishing returns.
  // Returns true if any relation gain was actually applied (used to gate giftsAccepted).
  function applyGiftRelation(baseGain){
    const gain = Math.floor(baseGain * diminish);
    if(gain > 0) wrap.state.relation = Math.min(10, (wrap.state.relation||0) + gain);
    return gain > 0;
  }


  // ── PRIMITIVE ──────────────────────────────────────────────────────────────
  if(tier === 'primitive'){
    const comp = civComprehension(wrap.civ, wrap.state);
    // Use existing primGiftReaction — but first apply bio-specific overrides
    if(isAlienBio){
      // Alien biological material: hunters recognise it as prey/predator remains
      const { diet, social, curiosity, honor } = traits;
      let ok = true, spike = -1, text = '';
      if(diet === 'carnivore'){
        text = name+' shown — another creature\'s remains. The hunters pass it between them. They recognise the kill. This is understood currency.';
      } else if(diet === 'herbivore'){
        text = 'The group reacts to the remains with something between wariness and revulsion. They do not take it. To them this is carrion, not gift.';
        ok = false; spike = 1;
      } else {
        text = name+' examined carefully. Unfamiliar animal, but they understand what this is. It is accepted.';
      }
      if(ok){
        const gain = diet === 'carnivore' ? 3 : 2;
        wrap.state.alert = Math.max(0, (wrap.state.alert||0) - 1);
        civGainLanguage(wrap.state, 1);
        const relApplied = applyGiftRelation(gain);
        civGiftCategoryAccepted(wrap, giftCat);
        civApplyPositiveMilestones(wrap, 'gift');
        civAddMemory(wrap, 'gift_accepted', 'The crew offered animal remains. The '+wrap.civ.species+' understood that language.');
      } else {
        wrap.state.alert = Math.min(5, (wrap.state.alert||0) + spike);
        wrap.state.relation = Math.max(-10, (wrap.state.relation||0) - 1);
        civAddMemory(wrap, 'gift_rejected', 'The crew offered animal remains. The '+wrap.civ.species+' read it as wrong.');
        if(spike >= 2 && (Math.random() < civHostilityRisk(wrap) || (wrap.state.alert||0) >= 5)){
          civContactGoesHostile(wrap, 'Offering read as insult');
        }
      }
      ctx.giftReactionText = text;
      civMaybeMarkContact(wrap, ctx, 'gift exchange');
      addLog('You offer '+name+' to the '+species+'.','li');
      return;
    }
    if(isTech){
      // Technology: primitives have no framework for manufactured objects
      const { curiosity, diet, social } = traits;
      let ok, spike, text;
      if(curiosity === 'curious'){
        // Only curious primitives engage with the unknown positively
        ok = true; spike = -1;
        text = name+' held out. They have never seen anything like it. Several reach at the same time. Whatever it does, it is fascinating to them — more than the crew can follow.';
      } else if(curiosity === 'isolated'){
        // Reclusive groups treat the unknown as a threat
        ok = false; spike = 2;
        text = name+' placed between them. No one approaches. They watch it the way they watch things that might be dangerous — without touching it. The crew has introduced something wrong into the exchange.';
      } else if(diet === 'carnivore'){
        // Hunters read unfamiliar objects as bait or threat
        ok = false; spike = 1;
        text = name+' extended. A hunter reads an unfamiliar object as either bait or weapon. They do not take it. One of them makes a warning sound.';
      } else if(social === 'collective'){
        // Collective group reaches consensus: this means nothing to them
        ok = false; spike = 0;
        text = name+' shown. The group exchanges looks. A short exchange runs through them. No one picks it up. The object has no meaning here — not threatening, just irrelevant. The gesture landed as nothing.';
      } else {
        // Neutral curiosity: the object is simply not understood and not wanted
        ok = false; spike = 0;
        text = name+' passed to the nearest hand. They turn it over, then set it down. No apparent use, no apparent meaning. The gesture was noted, but the thing itself did not register as a gift.';
      }
      if(ok){
        wrap.state.alert = Math.max(0, (wrap.state.alert||0) - 1);
        civGainLanguage(wrap.state, 1);
        applyGiftRelation(2);
        civGiftCategoryAccepted(wrap, giftCat);
        civApplyPositiveMilestones(wrap, 'gift');
        civAddMemory(wrap, 'gift_accepted', 'The crew offered a strange device. Curiosity did the rest.');
      } else {
        wrap.state.alert = Math.min(5, (wrap.state.alert||0) + spike);
        if(spike > 0) wrap.state.relation = Math.max(-10, (wrap.state.relation||0) - 1);
        civAddMemory(wrap, 'gift_rejected', 'The crew offered something incomprehensible. It meant nothing — or worse.');
        if(spike >= 2 && (Math.random() < civHostilityRisk(wrap) || (wrap.state.alert||0) >= 5)){
          civContactGoesHostile(wrap, 'Strange offering alarmed the group');
        }
      }
      ctx.giftReactionText = text;
      civMaybeMarkContact(wrap, ctx, 'gift exchange');
      addLog('You offer '+name+' to the '+species+'.','li');
      return;
    }
    // Default: run through the existing primGiftReaction logic
    const reaction = primGiftReaction(species, gift.item, traits, comp);
    const spike = reaction.alertSpike || 0;
    if(reaction.ok){
      wrap.state.alert    = Math.max(0, (wrap.state.alert||0) + Math.min(0, spike) - (spike < 0 ? -spike : 0) - 1);
      wrap.state.alert    = Math.max(0, wrap.state.alert);
      civGainLanguage(wrap.state, 1);
      applyGiftRelation(2);
      civGiftCategoryAccepted(wrap, giftCat);
      civAddMemory(wrap, 'gift_accepted', 'The crew\'s offering landed well. '+wrap.civ.species+' remembered what was given.');
      civApplyPositiveMilestones(wrap, 'gift');
    } else {
      wrap.state.alert    = Math.min(5, (wrap.state.alert||0) + Math.max(1, spike));
      // Only penalise relation when the rejection is actively offensive (spike > 0).
      // A neutral ignore (spike === 0) costs nothing — they simply didn't want it.
      if(spike > 0) wrap.state.relation = Math.max(-10, (wrap.state.relation||0) - 1);
      civAddMemory(wrap, 'gift_rejected', 'The crew offered the wrong thing. The group remembers that too.');
      if(spike >= 2 && (Math.random() < civHostilityRisk(wrap) || (wrap.state.alert||0) >= 5)){
        civContactGoesHostile(wrap, 'Offering read as threat or insult');
      }
    }
    ctx.giftReactionText = reaction.text;
    civMaybeMarkContact(wrap, ctx, 'gift exchange');
    addLog('You offer '+name+' to the '+species+'.','li');
    return;
  }

  // ── TRIBAL ─────────────────────────────────────────────────────────────────
  if(tier === 'tribal'){
    const { ritual, structure } = traits;
    // Tribal: ritual (animist|ancestor|totem) drives spiritual value
    //         structure (chieftain|council|clan) drives how the decision lands
    if(isTech){
      // Technology is alien to tribal civilizations — no framework for it
      const isHostileTerritorial = aggression === 'Territorial';
      if(structure === 'chieftain' || isHostileTerritorial){
        // Chieftain must not appear ignorant — an unknowable object is a threat to authority
        wrap.state.alert = Math.min(5, (wrap.state.alert||0) + 2);
        wrap.state.relation = Math.max(-10, (wrap.state.relation||0) - 1);
        civAddMemory(wrap, 'gift_rejected', 'The crew brought something incomprehensible. The chieftain read it as a challenge.');
        if((wrap.state.alert||0) >= 5 || Math.random() < civHostilityRisk(wrap)) civContactGoesHostile(wrap, 'Offensive offering');
        ctx.giftReactionText = name+' presented. The chieftain\'s expression closes. An object that cannot be named or evaluated in front of the group undermines the authority of whoever accepts it. The offering is rejected without ceremony.';
        addLog('The '+species+' regard the offering with suspicion.','lw');
        return;
      }
      if(structure === 'council'){
        // Council deliberates — unknown objects get examined before a verdict
        wrap.state.alert = Math.max(0, (wrap.state.alert||0) - 1);
        ctx.giftReactionText = name+' placed before the council. They examine it in rotation, speaking quietly among themselves. No one knows what it does. The decision to accept is based on the quality of the material rather than the function — it is clearly not cheap, and that earns a cautious reception.';
        applyGiftRelation(1);
        civGiftCategoryAccepted(wrap, giftCat);
        civApplyPositiveMilestones(wrap, 'gift');
        civMaybeMarkContact(wrap, ctx, 'gift exchange');
        addLog('The '+species+' accept the offering with cautious interest.','li');
        return;
      }
      // Clan structure: incomprehensible object — neither accepted nor refused
      wrap.state.alert = Math.min(5, (wrap.state.alert||0) + 1);
      ctx.giftReactionText = name+' set down in front of them. The clan elders gather at a distance. No one picks it up. The object sits between the parties — unresolvable. The gesture landed as nothing.';
      addLog('The '+species+' do not know what to make of the offering.','li');
      return;
    }
    if(isAlienBio){
      // Bio remains — totem and animist read this as sacred currency; ancestor ritual is cooler
      const relGain = (ritual === 'totem' || ritual === 'animist') ? 3 : 2;
      const alertDrop = aggression === 'Passive' ? 2 : 1;
      wrap.state.alert    = Math.max(0, (wrap.state.alert||0) - alertDrop);
      civGainLanguage(wrap.state, 1);
      applyGiftRelation(relGain);
      civGiftCategoryAccepted(wrap, giftCat);
      civApplyPositiveMilestones(wrap, 'gift');
      civMaybeMarkContact(wrap, ctx, 'gift exchange');
      civAddMemory(wrap, 'gift_accepted', 'The crew offered animal remains. The '+wrap.civ.species+' treated it as a proper offering.');
      const txt = ritual === 'totem'
        ? name+' received with visible ceremony — passed between hands, briefly held toward the nearest totem marker, then secured with care. This group\'s relationship with animals is inseparable from their spiritual life. The crew just spoke that language.'
        : ritual === 'animist'
        ? name+' shown, and the reaction is immediate — a sound that carries across the group, fingers touching the object then the chest. To animists, bringing remains of a creature is an act of spiritual acknowledgement. This landed correctly.'
        : name+' accepted without obvious ceremony, but it is taken with both hands — the subtle mark of something considered worthy of the ancestors\' notice.';
      ctx.giftReactionText = txt;
      addLog('You offer '+name+'. The '+species+' accept it.','li');
      return;
    }
    if(isFood){
      // Food offering — animists and generalists accept, ancestor ritual is indifferent
      const relGain = ritual === 'animist' ? 2 : 1;
      wrap.state.alert    = Math.max(0, (wrap.state.alert||0) - 1);
      civGainLanguage(wrap.state, 1);
      applyGiftRelation(relGain);
      civGiftCategoryAccepted(wrap, giftCat);
      civApplyPositiveMilestones(wrap, 'gift');
      civMaybeMarkContact(wrap, ctx, 'gift exchange');
      civAddMemory(wrap, 'gift_accepted', 'The crew offered food. The '+wrap.civ.species+' accepted.');
      ctx.giftReactionText = ritual === 'animist'
        ? name+' offered slowly. To a group that sees the land as alive, sharing what it produces is a meaningful act. The gesture is understood before the object is even taken.'
        : name+' accepted. Food is food. The exchange is noted without ceremony.';
      addLog('You offer '+name+'. The '+species+' accept it.','li');
      return;
    }
    if(isWeapon){
      // Tribal: a weapon from the sky-visitors is a power object, a threat, or a tribute of strength.
      // Reaction is driven by structure first, then ritual.
      if(structure === 'chieftain'){
        if(val >= 60){
          // A valuable weapon is a tribute to chieftain authority — strengthens their hand
          wrap.state.alert    = Math.max(0, (wrap.state.alert||0) - 1);
          civGainLanguage(wrap.state, 1);
          applyGiftRelation(2);
          civGiftCategoryAccepted(wrap, giftCat);
          civApplyPositiveMilestones(wrap, 'gift');
          civMaybeMarkContact(wrap, ctx, 'gift exchange');
          civAddMemory(wrap, 'gift_accepted', 'The crew offered a weapon. The chieftain read it as tribute.');
          ctx.giftReactionText = name+' presented before the chieftain\'s representative. There is a long pause. Then the weapon is taken, slowly, with both hands. A weapon from sky-visitors is worth more than its function — it is a statement of who the crew considers worth arming. That read correctly.';
          addLog('You offer '+name+'. The chieftain accepts.','li');
        } else {
          // Cheap weapon insults chieftain authority
          wrap.state.alert = Math.min(5, (wrap.state.alert||0) + 2);
          wrap.state.relation = Math.max(-10, (wrap.state.relation||0) - 1);
          civAddMemory(wrap, 'gift_rejected', 'The crew offered a cheap weapon. The chieftain read it as an insult.');
          if((wrap.state.alert||0) >= 5 || Math.random() < civHostilityRisk(wrap)) civContactGoesHostile(wrap, 'Insulting weapon offering');
          ctx.giftReactionText = name+' laid before the chieftain\'s representative. They look at it. Then at the crew. This object is not worthy of a chieftain\'s hand. The insult is quiet, but the alert in the room rises.';
          addLog('The '+species+' regard the weapon with visible contempt.','lw');
        }
        return;
      }
      if(structure === 'council'){
        // Council reads a weapon offering as destabilising — who decides who gets it?
        wrap.state.alert = Math.min(5, (wrap.state.alert||0) + 1);
        civAddMemory(wrap, 'gift_rejected', 'The crew offered a weapon to a council-led group. It created tension.');
        ctx.giftReactionText = name+' placed before the council. An immediate exchange passes between the elders. A weapon is not a gift to a council — it is a question of who holds power. No one takes it. The object sits between them until the meeting ends.';
        addLog('The '+species+' council leaves the weapon untouched.','li');
        return;
      }
      // Clan structure: weapon is assessed for practical value
      if(aggression === 'Passive' && val >= 40){
        wrap.state.alert    = Math.max(0, (wrap.state.alert||0) - 1);
        civGainLanguage(wrap.state, 1);
        applyGiftRelation(ritual === 'totem' ? 2 : 1);
        civGiftCategoryAccepted(wrap, giftCat);
        civApplyPositiveMilestones(wrap, 'gift');
        civMaybeMarkContact(wrap, ctx, 'gift exchange');
        civAddMemory(wrap, 'gift_accepted', 'The crew offered a weapon. The clan accepted it as practical tribute.');
        ctx.giftReactionText = ritual === 'totem'
          ? name+' received by the senior clan figure after being held near the nearest totem marker. They treat it as a spirit-power object before a tool. The gesture carries weight.'+( val >= 60 ? ' A strong one.' : '')
          : name+' passed between the clan elders and accepted. Not warmly — weapons carry obligation — but the gift is practical enough that refusing it would be a worse signal.';
        addLog('You offer '+name+'. The '+species+' clan accepts it.','li');
      } else {
        wrap.state.alert = Math.min(5, (wrap.state.alert||0) + 1);
        if(aggression !== 'Passive') wrap.state.relation = Math.max(-10, (wrap.state.relation||0) - 1);
        civAddMemory(wrap, 'gift_rejected', 'The crew offered a weapon. The clan read it as a threat or an insult.');
        ctx.giftReactionText = aggression !== 'Passive'
          ? name+' placed between the parties. A territorial or hostile clan does not accept weapons from outsiders — it is either a provocation or a trap. They back away from it without touching it.'
          : name+' set down in front of them. The object is recognised as a weapon, and weapons from strangers carry too much obligation. The clan does not take it.';
        addLog('The '+species+' leave the weapon where it was placed.','li');
      }
      return;
    }
    if(!isOrnament && !isMedical && !isArmor && giftMeaningValue < 40){
      ctx.giftReactionText = name+' is examined and set aside. It is not taboo, not useful, not food, not a marker of respect, and not connected to any obligation they recognise. The offer is understood as an attempt, but not accepted as a gift.';
      civAddMemory(wrap, 'gift_rejected', 'The crew offered something that had no clear meaning here.');
      addLog('The '+species+' find no meaning in the offering.','li');
      return;
    }
    // General gift (ornamental, useful, or materially valuable)
    const giftBonus = giftMeaningValue >= 100 ? 2 : giftMeaningValue >= 50 ? 1 : 0;
    if(giftBonus === 0 && structure === 'chieftain'){
      wrap.state.alert = Math.min(5, (wrap.state.alert||0) + 1);
      ctx.giftReactionText = name+' offered to the chieftain\'s representative. A chieftain-led group measures gifts as a statement of how much the giver values the relationship. This did not meet the threshold. The object is looked at and left.';
      addLog('The '+species+' dismiss the offering.','lw');
      return;
    }
    if(giftBonus === 0){
      ctx.giftReactionText = name+' is considered, but not taken into the exchange. It has too little practical or symbolic weight to carry the gesture.';
      addLog('The '+species+' decline the offering.','li');
      return;
    }
    wrap.state.alert    = Math.max(0, (wrap.state.alert||0) - 1);
    civGainLanguage(wrap.state, 1);
    applyGiftRelation(Math.max(1, giftBonus));
    civGiftCategoryAccepted(wrap, giftCat);
    civApplyPositiveMilestones(wrap, 'gift');
    civMaybeMarkContact(wrap, ctx, 'gift exchange');
    civAddMemory(wrap, 'gift_accepted', 'The crew offered something. The '+wrap.civ.species+' accepted.');
    const structureReaction = structure === 'council'
      ? name+' passed between council members. The decision takes longer than expected — each person weighs in before it is accepted. But it is accepted.'
      : structure === 'clan'
      ? name+' examined by the senior clan member first, then passed to others. Clan hierarchy is preserved even in this small act.'
      : name+' presented to the chieftain\'s representative directly.'+(giftBonus >= 2 ? ' The value is acknowledged. A nod — more than the crew might have expected.' : '');
    ctx.giftReactionText = structureReaction;
    addLog('You offer '+name+'. The '+species+' accept it.','li');
    return;
  }

  // ── MEDIEVAL ───────────────────────────────────────────────────────────────
  if(tier === 'medieval'){
    const { governance, disposition } = traits;
    if(isAlienBio){
      // Medieval: alien creature parts are exotic curiosities — some impressed, some disgusted
      if(governance === 'theocratic'){
        // Theocratic: unknown creature from the sky — could be sacred or cursed
        if(Math.random() < 0.5){
          wrap.state.alert = Math.min(5, (wrap.state.alert||0) + 2);
          wrap.state.relation = Math.max(-10, (wrap.state.relation||0) - 1);
          civAddMemory(wrap, 'gift_rejected', 'The crew brought alien remains to a theocratic settlement. The priests read it as an ill omen.');
          ctx.giftReactionText = name+' presented. The priests confer in lowered voices. One makes a warding gesture. To a theocratic culture, an unknown creature brought by sky-visitors is not a gift — it is a sign of uncertain meaning, and uncertain signs are dangerous. The offering is refused and the crew is told, through gesture, to take it away.';
          addLog('The '+species+' regard the offering with religious alarm.','lw');
          return;
        } else {
          applyGiftRelation(2);
          wrap.state.alert    = Math.max(0, (wrap.state.alert||0) - 1);
          civAddMemory(wrap, 'gift_accepted', 'The crew brought alien remains. The theocratic settlement treated it as a divine curiosity.');
          ctx.giftReactionText = name+' presented before the senior priest. There is a long silence. Then a nod — slow, deliberate. The creature is from beyond the sky. That makes it sacred rather than profane. A significant reading went the right way.';
        }
      } else if(disposition === 'proud'){
        // Proud medieval: exotic curiosity earns modest respect — the hunters brought something alien
        applyGiftRelation(1);
        ctx.giftReactionText = name+' laid before the captain or lord\'s representative. They inspect it with the attention of someone who has seen unusual things before. A dead creature from the stars is not without curiosity value. It is accepted — not warmly, but without dismissal.';
      } else {
        // Pragmatic or wary: it is an interesting specimen, treated as such
        applyGiftRelation(2);
        wrap.state.alert    = Math.max(0, (wrap.state.alert||0) - 1);
        ctx.giftReactionText = name+' passed through several hands. Someone who may be a scholar or apothecary examines it closely. The nature of the thing — an animal from beyond their sky — raises more questions than the crew can answer, but the gesture is read correctly.';
      }
      civGainLanguage(wrap.state, 1);
      civGiftCategoryAccepted(wrap, giftCat);
      civApplyPositiveMilestones(wrap, 'gift');
      civMaybeMarkContact(wrap, ctx, 'gift exchange');
      addLog('You offer '+name+'. The '+species+' examine it with interest.','li');
      return;
    }
    if(isTech){
      // Medieval: technology from star-visitors is extraordinary — highly impressive
      const impressedBonus = val >= 100 ? 3 : val >= 60 ? 2 : 1;
      if(aggression === 'Territorial' && disposition === 'proud' && impressedBonus < 2){
        // Proud territorial medieval: cheap tech is suspicious, not impressive
        wrap.state.alert = Math.min(5, (wrap.state.alert||0) + 1);
        ctx.giftReactionText = name+' presented. The device is examined with suspicion rather than wonder. A proud ruling class does not easily show impressment, and something small or simple from sky-visitors reads as an insult — as if the crew believes they can be bought cheaply.';
        addLog('The '+species+' eye the offering with scepticism.','lw');
        return;
      }
      wrap.state.alert    = Math.max(0, (wrap.state.alert||0) - 2);
      civGainLanguage(wrap.state, 1);
      applyGiftRelation(impressedBonus);
      civGiftCategoryAccepted(wrap, giftCat);
      civApplyPositiveMilestones(wrap, 'gift');
      civMaybeMarkContact(wrap, ctx, 'gift exchange');
      civAddMemory(wrap, 'gift_accepted', 'The crew offered star-visitor technology. The '+wrap.civ.species+' were very impressed.');
      const techTxt = impressedBonus >= 3
        ? name+' presented before the gathered officials. The reaction spreads from face to face — this is nothing they have seen or can explain. The device from the stars changes the tenor of the meeting entirely. Whoever holds it now holds something with no local equivalent.'
        : impressedBonus >= 2
        ? name+' demonstrated carefully. The mechanism, the materials, the operation — none of it belongs to anything local. The representative handles it with obvious reverence. This raised the crew\'s standing considerably.'
        : name+' accepted with formal nod. An object from the stars carries its own credibility. They do not know what it does, but they know what having it means.';
      ctx.giftReactionText = techTxt;
      if(governance === 'mercantile') addLog('You offer '+name+'. The '+species+' are visibly calculating its worth.','li');
      else addLog('You offer '+name+'. The '+species+' are clearly impressed.','li');
      return;
    }
    if(!isOrnament && !isFood && !isMedical && !isArmor && !isWeapon && giftMeaningValue < 45){
      ctx.giftReactionText = name+' is presented and politely refused. It may have value somewhere, but it does not fit any category this court, market, guard, or priesthood recognises as a suitable offering. It remains outside the exchange.';
      civAddMemory(wrap, 'gift_rejected', 'The crew offered something socially illegible.');
      addLog('The '+species+' politely refuse the offering.','li');
      return;
    }
    if(isFood){
      // Medieval: food as tribute or offering — value and governance shape the reaction
      const foodVal = Math.max(val, giftMeaningValue);
      if(governance === 'theocratic'){
        // Theocratic: food offerings have ritual significance — quality matters
        if(foodVal >= 50){
          wrap.state.alert    = Math.max(0, (wrap.state.alert||0) - 1);
          civGainLanguage(wrap.state, 1);
          applyGiftRelation(2);
          civGiftCategoryAccepted(wrap, giftCat);
          civApplyPositiveMilestones(wrap, 'gift');
          civMaybeMarkContact(wrap, ctx, 'gift exchange');
          ctx.giftReactionText = name+' presented to the senior priest. Food from the sky carries a meaning the church has to interpret. They accept it — carefully, with a blessing spoken over it. The gesture has entered the ritual record.';
          addLog('You offer '+name+'. The priests accept the offering.','li');
        } else {
          ctx.giftReactionText = name+' set before the priest. They look at it without expression. Whatever was meant by this, it is not sufficient to be a proper offering. It is left where it was placed.';
          addLog('The '+species+' find the offering insufficient.','li');
        }
        return;
      }
      if(governance === 'mercantile'){
        // Mercantile: food is trade goods, evaluated by price
        if(foodVal >= 40){
          wrap.state.alert    = Math.max(0, (wrap.state.alert||0) - 1);
          applyGiftRelation(1);
          civGiftCategoryAccepted(wrap, giftCat);
          civApplyPositiveMilestones(wrap, 'gift');
          civMaybeMarkContact(wrap, ctx, 'gift exchange');
          ctx.giftReactionText = name+' accepted by the trade representative. They assess it with the eye of someone calculating what it would fetch at market. The number is acceptable. The gesture is logged as a commercial opening.';
          addLog('You offer '+name+'. The '+species+' accept it as trade goods.','li');
        } else {
          ctx.giftReactionText = name+' examined and set to one side. This is not a meaningful trade quantity. The representative does not look offended — just uninterested.';
          addLog('The '+species+' find the offering below trade value.','li');
        }
        return;
      }
      // Feudal: food as tribute is read by disposition
      if(disposition === 'proud' && foodVal < 60){
        ctx.giftReactionText = name+' offered to the lord\'s representative. They regard it briefly. Food is tribute for serfs, not a gesture between parties of standing. The offering is not refused so much as ignored.';
        addLog('The '+species+' overlook the offering.','li');
        return;
      }
      wrap.state.alert    = Math.max(0, (wrap.state.alert||0) - 1);
      applyGiftRelation(1);
      civGiftCategoryAccepted(wrap, giftCat);
      civApplyPositiveMilestones(wrap, 'gift');
      civMaybeMarkContact(wrap, ctx, 'gift exchange');
      ctx.giftReactionText = name+' accepted without ceremony. Food from beyond the sky is a curiosity and a practical gift. It is received as both.';
      addLog('You offer '+name+'. The '+species+' accept it.','li');
      return;
    }
    if(isWeapon){
      // Medieval: a weapon from sky-visitors is extraordinary — no local equivalent in function or origin.
      // Even a 'simple' handgun is an object from another world with no frame of reference here.
      const isHighValue = val >= 60;
      if(aggression === 'Territorial' && disposition === 'proud' && !isHighValue){
        // Proud territorial: a cheap weapon from outsiders reads as underestimation
        wrap.state.alert = Math.min(5, (wrap.state.alert||0) + 1);
        ctx.giftReactionText = name+' presented. The guard captain looks at it and then at the crew. Whatever this object does, it does not meet the threshold for a gesture between parties of standing. The insult is implied, not stated.';
        addLog('The '+species+' regard the offering with visible disdain.','lw');
        return;
      }
      const weaponBonus = isHighValue ? 3 : 2;
      wrap.state.alert    = Math.max(0, (wrap.state.alert||0) - 2);
      civGainLanguage(wrap.state, 1);
      applyGiftRelation(weaponBonus);
      civGiftCategoryAccepted(wrap, giftCat);
      civApplyPositiveMilestones(wrap, 'gift');
      civMaybeMarkContact(wrap, ctx, 'gift exchange');
      civAddMemory(wrap, 'gift_accepted', 'The crew offered a weapon from the stars. The medieval society was astonished.');
      const weapTxt = governance === 'feudal'
        ? name+' placed in the lord\'s representative\'s hands. They turn it over with the focused attention of someone who has held every weapon made in this world and knows this is none of them. The materials alone are impossible. Whatever the crew came to negotiate, the terms just changed.'
        : governance === 'theocratic'
        ? name+' presented before the senior priest. They receive it with shaking hands. A weapon from the sky is a relic, a sign, and a responsibility. The church\'s position on the crew just shifted significantly.'
        : name+' accepted by the trade representative — but not as a commodity. As an object with no local equivalent. The calculation behind their eyes is visibly different from any trade they have conducted before.';
      ctx.giftReactionText = weapTxt;
      addLog('You offer '+name+'. The '+species+' are visibly astonished.','li');
      return;
    }
    // General item for medieval
    const giftBonus = giftMeaningValue >= 120 ? 2 : giftMeaningValue >= 55 ? 1 : 0;
    if(aggression === 'Territorial' && giftBonus === 0){
      wrap.state.alert = Math.min(5, (wrap.state.alert||0) + 1);
      ctx.giftReactionText = name+' offered. The patrol captain regards it and shakes his head. Territorial cities have prices for passage. This did not meet it.';
      addLog('The '+species+' regard the offering with visible disdain.','lw');
      return;
    }
    if(governance === 'theocratic' && giftBonus === 0){
      wrap.state.alert = Math.min(5, (wrap.state.alert||0) + 1);
      ctx.giftReactionText = name+' presented. The senior priest barely glances at it. This community measures worth in specific ways, and something cheap is worse than nothing — it implies the crew does not understand the terms of respect.';
      addLog('The '+species+' regard the offering as beneath the exchange.','lw');
      return;
    }
    if(giftBonus === 0){
      ctx.giftReactionText = name+' is inspected and set aside. The form of gift was clear, but the thing itself does not carry enough use, rarity, or status to matter here.';
      addLog('The '+species+' set the offering aside.','li');
      return;
    }
    wrap.state.alert    = Math.max(0, (wrap.state.alert||0) - 1);
    civGainLanguage(wrap.state, 1);
    applyGiftRelation(Math.max(1, giftBonus));
    civGiftCategoryAccepted(wrap, giftCat);
    civApplyPositiveMilestones(wrap, 'gift');
    civMaybeMarkContact(wrap, ctx, 'gift exchange');
    ctx.giftReactionText = name+' accepted with a formal nod. It disappears into a satchel and the envoy waits for the next move.';
    addLog('You offer '+name+'. The '+species+' accept it.','li');
    return;
  }

  // ── INDUSTRIAL & INFORMATION ───────────────────────────────────────────────
  // These tiers have no use for alien biological material
  if(isAlienBio){
    const isInfo = tier === 'information';
    if(isInfo){
      // Information age: alien bio samples are scientifically interesting but insulting as a gift
      wrap.state.alert = Math.min(5, (wrap.state.alert||0) + 1);
      ctx.giftReactionText = name+' presented. The contact officer scans it, logs it, and looks up. An alien biological specimen is not a gift here — it is a sample requiring quarantine protocol. The crew has just created a biosecurity incident instead of a positive exchange.';
      addLog('The '+species+' treat the offering as a quarantine issue.','lw');
    } else {
      // Industrial: alien carcass is a curiosity but not valued — slightly awkward
      ctx.giftReactionText = name+' placed on the official\'s table. They examine it, photograph it, and look at the crew with the measured expression of someone trying to understand the intent. Whatever this was meant to communicate, it did not translate clearly into anything useful here.';
      addLog('The '+species+' do not know what to make of the offering.','li');
    }
    civGainLanguage(wrap.state, (isInfo ? 0 : 1));
    return;
  }

  if(isTech){
    // Industrial and information: technology is understood and valuable
    const { economy, bureaucracy, media, policy } = traits;
    const isInfo = tier === 'information';
    let relGain = val >= 120 ? 2 : 1;
    let alertDrop = 1;
    if(isInfo){
      if(media === 'transparent') relGain = Math.min(3, relGain + 1); // public-facing, appreciate tangible exchange
      if(policy === 'restrictive'){ relGain = Math.max(0, relGain - 1); alertDrop = 0; } // suspicious of unknown tech
    } else {
      if(economy === 'cooperative') relGain = Math.min(3, relGain + 1);
      if(economy === 'corporate') alertDrop = Math.min(2, alertDrop + 1); // corps appreciate practical value
      if(bureaucracy === 'strict'){ relGain = Math.max(0, relGain - 1); } // strict: gifts must go through proper channels
    }
    if(aggression === 'Hostile' && giftMeaningValue < 40){
      wrap.state.alert = Math.min(5, (wrap.state.alert||0) + 1);
      ctx.giftReactionText = name+' placed on the table. The official looks at it. Then at the crew. "This is not sufficient." The tone is flat, the verdict immediate.';
      addLog('The '+species+' dismiss the offering.','lw');
      return;
    }
    // Advanced societies don't need cheap trinkets — survival gear, fuel, basic medkits
    // are things they already have in bulk. Require meaningful value.
    if(giftMeaningValue < 60){
      ctx.giftReactionText = name+' placed before the contact officer. They scan it, note it, and set it to one side. This is not something they lack or value. The gesture was understood but not rewarded.';
      addLog('The '+species+' politely decline the offering.','li');
      return;
    }
    wrap.state.alert    = Math.max(0, (wrap.state.alert||0) - alertDrop);
    civGainLanguage(wrap.state, 1);
    applyGiftRelation(relGain);
    civGiftCategoryAccepted(wrap, giftCat);
    civApplyPositiveMilestones(wrap, 'gift');
    civMaybeMarkContact(wrap, ctx, 'gift exchange');
    civAddMemory(wrap, 'gift_accepted', 'The crew offered technology. The '+wrap.civ.species+' processed it appropriately.');
    if(tier === 'information'){
      const infoTxt = policy === 'restrictive'
        ? name+' accepted, sequestered immediately, and logged. Whatever the intent, this object is now part of their intake system. The gesture was registered — the object is theirs.'
        : media === 'transparent'
        ? name+' accepted on the open record. The contact officer notes it publicly. The crew just made a documented, visible gesture of cooperation. That has a different weight here than it would elsewhere.'
        : name+' received and scanned. A quiet confirmation: the gesture was processed. The contact status improves.';
      ctx.giftReactionText = infoTxt;
    } else {
      const indTxt = economy === 'corporate'
        ? name+' taken, turned over, assessed for value. The lead official makes a note. A corporation respects a contribution that has a number attached to it.'
        : economy === 'cooperative'
        ? name+' passed around the team before anyone says anything. Cooperative culture: the group decides. The decision is yes.'
        : bureaucracy === 'strict'
        ? name+' accepted through the correct intake channel — the official does not take it directly, but directs it to a subordinate for logging. Strict process. The intent was received.'
        : name+' taken, turned over, scanned. The lead official nods once — acknowledgement, not warmth.';
      ctx.giftReactionText = indTxt;
    }
    addLog('You offer '+name+'. The '+species+' accept it.','li');
    return;
  }

  // Non-tech, non-bio fallback for industrial/information — only meaningful if it has
  // recognised utility, resale value, or procedural relevance.
  // Raised threshold: advanced societies have their own supply chains.
  if(isWeapon){
    // Industrial/information: they have their own weapons. An alien weapon is notable but
    // the reaction depends entirely on policy, bureaucracy, and aggression stance.
    const { economy, bureaucracy, media, policy } = traits;
    const isInfo = tier === 'information';
    if(isInfo){
      if(policy === 'restrictive'){
        // Restrictive information-age: an alien weapon is a biosecurity and security incident
        wrap.state.alert = Math.min(5, (wrap.state.alert||0) + 2);
        wrap.state.relation = Math.max(-10, (wrap.state.relation||0) - 1);
        civAddMemory(wrap, 'gift_rejected', 'The crew presented a weapon to a restrictive information society. They escalated.');
        ctx.giftReactionText = name+' placed on the table. The contact officer takes one step back. A second officer appears from somewhere. The weapon is photographed, bagged, and removed. The crew has just created a security incident. This is not a gift — it is evidence.';
        addLog('The '+species+' treat the weapon as a security threat.','lw');
        return;
      }
      if(media === 'transparent'){
        // Transparent: they document it publicly — it becomes a statement
        wrap.state.alert    = Math.max(0, (wrap.state.alert||0) - 1);
        civGainLanguage(wrap.state, 1);
        applyGiftRelation(2);
        civGiftCategoryAccepted(wrap, giftCat);
        civApplyPositiveMilestones(wrap, 'gift');
        civMaybeMarkContact(wrap, ctx, 'gift exchange');
        ctx.giftReactionText = name+' accepted on the public record. The contact officer photographs it, logs it openly, and issues a statement: the crew has offered an alien weapon as a gesture of trust. In a transparent society, that gesture is now part of the official account. It carries weight.';
        addLog('You offer '+name+'. The '+species+' accept it publicly.','li');
        return;
      }
      // Default information: logged, assessed, cautiously received
      civGainLanguage(wrap.state, 1);
      applyGiftRelation(1);
      civGiftCategoryAccepted(wrap, giftCat);
      civApplyPositiveMilestones(wrap, 'gift');
      civMaybeMarkContact(wrap, ctx, 'gift exchange');
      ctx.giftReactionText = name+' accepted through standard intake protocol — photographed, logged, secured. The contact officer notes it without visible reaction. Alien weaponry is a sensitive item. The fact that it was offered rather than used is the only part that matters here.';
      addLog('You offer '+name+'. The '+species+' log it and accept.','li');
      return;
    }
    // Industrial
    if(bureaucracy === 'strict'){
      // Strict bureaucracy: a weapon must go through proper channels — can't just accept it
      wrap.state.alert = Math.min(5, (wrap.state.alert||0) + 1);
      ctx.giftReactionText = name+' offered. The official looks at it with the expression of someone calculating paperwork. An alien weapon requires a compliance intake form, a safety check, and authorisation from at least two departments. The gesture is understood but the item cannot be accepted informally. It is set aside.';
      addLog('The '+species+' cannot accept the weapon through informal channels.','li');
      return;
    }
    if(economy === 'cooperative'){
      // Cooperative: troubled by weapons as gifts — it is not the kind of exchange they want to formalise
      ctx.giftReactionText = name+' placed before the team. A quiet exchange passes between them. A cooperative economy is built on mutual exchange, not power objects. They are not sure what accepting this would mean. After deliberation, they decline — politely, with visible discomfort.';
      addLog('The '+species+' decline the weapon offering.','li');
      return;
    }
    if(economy === 'corporate'){
      // Corporate: an alien weapon is an asset to be assessed
      civGainLanguage(wrap.state, 1);
      applyGiftRelation(2);
      civGiftCategoryAccepted(wrap, giftCat);
      civApplyPositiveMilestones(wrap, 'gift');
      civMaybeMarkContact(wrap, ctx, 'gift exchange');
      ctx.giftReactionText = name+' accepted by the lead official, who immediately begins photographing it from multiple angles. A corporate entity sees an alien weapon as intellectual property, a prototype, and a potential revenue stream. The crew has their full attention now.';
      addLog('You offer '+name+'. The '+species+' corporate representative is very interested.','li');
      return;
    }
    // Default industrial
    civGainLanguage(wrap.state, 1);
    applyGiftRelation(1);
    civGiftCategoryAccepted(wrap, giftCat);
    civApplyPositiveMilestones(wrap, 'gift');
    civMaybeMarkContact(wrap, ctx, 'gift exchange');
    ctx.giftReactionText = name+' received with professional interest. They have weapons. They do not have alien weapons. The distinction is noted.';
    addLog('You offer '+name+'. The '+species+' accept it.','li');
    return;
  }
  if(aggression === 'Hostile' || giftMeaningValue < 80){
    wrap.state.alert = Math.min(5, (wrap.state.alert||0) + 1);
    ctx.giftReactionText = name+' placed on the table. It is scanned, logged as irrelevant, and left untouched. "We don\'t need this." The dismissal is without ceremony.';
    addLog('The '+species+' dismiss the offering.','lw');
    return;
  }
  wrap.state.alert    = Math.max(0, (wrap.state.alert||0) - 1);
  civGainLanguage(wrap.state, 1);
  applyGiftRelation(1);
  civGiftCategoryAccepted(wrap, giftCat);
  civApplyPositiveMilestones(wrap, 'gift');
  civMaybeMarkContact(wrap, ctx, 'gift exchange');
  ctx.giftReactionText = name+' accepted without much comment. It has value; that registers.';
  addLog('You offer '+name+'. The '+species+' accept it.','li');

}

function civilizationLootPool(civ){
  const species = civ?.species || 'Local';
  const pools = {
    primitive: [
      { name:'Carved Bone Charm', col:'#d8c48a', desc:'A hand-carved local trinket taken from an inhabited settlement.', value:35 },
      { name:'Polished Stone Beads', col:'#ccaa77', desc:'Decorative beads taken from an inhabited settlement.', value:40 },
    ],
    tribal: [
      { name:'Ceremonial Fetish', col:'#d488ff', desc:'A ritual object taken from an inhabited settlement.', value:65 },
      { name:species+' Woven Talisman', col:'#a8d86a', desc:'A local protective charm taken from an inhabited settlement.', value:70 },
    ],
    medieval: [
      { name:'Worked Silver Brooch', col:'#cccccc', desc:'Fine local craftwork taken from an inhabited settlement.', value:85 },
      { name:'Guild Seal Pendant', col:'#ffe066', desc:'A marked civic ornament taken from an inhabited settlement.', value:95 },
    ],
    industrial: [
      { name:'Precision Gearwork', col:'#aab8cc', desc:'Machined local components taken from an inhabited settlement.', value:120 },
      { name:'Insulated Power Coupling', col:'#ffcc66', desc:'Useful settlement hardware taken under threat.', value:130 },
    ],
    information: [
      { name:'Encrypted Hard Drive', col:'#70d8ff', desc:'Local data device taken without consent.', value:160 },
      { name:'Survey Instrument', col:'#88ffcc', desc:'A precision measuring device. Expensive locally.', value:145 },
    ],
  };
  return pools[civ?.tier] || pools.tribal;
}

function awardCivilizationLoot(wrap, reason){
  if(!wrap?.civ) return null;
  // Per-site loot tracking: use current dialogue context coords if available
  const ctx = G.dialogue?.context;
  const siteKey = ctx ? 'site_'+ctx.x+'_'+ctx.y : null;
  if(!wrap.state.siteLoot) wrap.state.siteLoot = {};
  const siteLoot = (siteKey && wrap.state.siteLoot[siteKey]) || { lootCount:0 };
  siteLoot.lootCount = (siteLoot.lootCount||0) + 1;
  if(siteKey) wrap.state.siteLoot[siteKey] = siteLoot;
  // Also maintain global lootCount for legacy compatibility
  wrap.state.lootCount = (wrap.state.lootCount || 0) + 1;
  // Each loot attempt has a decreasing chance of finding something (per site)
  // First loot: ~90%, second: ~65%, third: ~40%, fourth+: ~20%
  const findChance = Math.max(0.15, 0.90 - (siteLoot.lootCount - 1) * 0.25);
  if(Math.random() > findChance){
    addLog((reason || 'Searched')+': nothing of value left.','li');
    return null;
  }
  const pool = civilizationLootPool(wrap.civ);
  const item = { ...pool[rnd(pool.length)] };
  G.inventory.push(item);
  addLog((reason || 'Taken from settlement')+': '+item.name+'.','lw');
  return item;
}

function prepareCivilizationTribute(wrap){
  if(!wrap?.civ) return null;
  const pool = civilizationLootPool(wrap.civ);
  const item = { ...pool[rnd(pool.length)] };
  wrap.state.pendingTribute = item;
  return item;
}

function acceptCivilizationTribute(ctx){
  const wrap = dialogueCivilization();
  if(!wrap?.state?.pendingTribute) return;
  const item = wrap.state.pendingTribute;
  G.inventory.push(item);
  wrap.state.pendingTribute = null;
  if(G.dialogue?.context) G.dialogue.context.resolved = true;
  addLog('Accepted tribute: '+(item.name || 'local offering')+'.','lw');
}

function civilizationGiftDialogueOptions(){
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
      effect:ctx=>offerCivilizationGift(ctx, entry.idx),
      next:'gift_given',
    };
  });
  opts.push({ label:'Back', next:'root' });
  return opts;
}

