// ─────────────────────────────────────────────────────────────────
//  CIVILIZATIONS
// ─────────────────────────────────────────────────────────────────
// Five tech tiers — each defines building types that can appear
// and how many objects scatter across the surface (min/max)
const CIV_TIERS = [
  { id:'primitive',   label:'Primitive',     count:[2,5],   tiles:[]                                                       },
  { id:'tribal',      label:'Tribal',        count:[5,12],  tiles:['civ_longhouse','civ_totem','civ_hut']                  },
  { id:'medieval',    label:'Medieval',      count:[10,22], tiles:['civ_stone_tower','civ_market','civ_longhouse']          },
  { id:'industrial',  label:'Industrial',    count:[20,44], tiles:['civ_factory','civ_tenement','civ_market']               },
  { id:'information', label:'Information Age',count:[40,80], tiles:['civ_office','civ_relay_tower','civ_tenement','civ_factory'] },
];

const AQUATIC_CIV_TILE_MAP = {
  civ_hut:         'uw_civ_shelter',
  civ_fire_pit:    'uw_civ_reef_totem',
  civ_longhouse:   'uw_civ_habitat',
  civ_totem:       'uw_civ_reef_totem',
  civ_stone_tower: 'uw_civ_bastion',
  civ_market:      'uw_civ_exchange',
  civ_factory:     'uw_civ_processor',
  civ_tenement:    'uw_civ_pod_stack',
  civ_office:      'uw_civ_archive',
  civ_relay_tower: 'uw_civ_sonar',
};
function aquaticCivTileType(type){
  return AQUATIC_CIV_TILE_MAP[type] || 'uw_civ_habitat';
}

const CIV_TILE_TYPES = new Set([
  'civ_hut','civ_fire_pit','civ_longhouse','civ_totem',
  'civ_stone_tower','civ_market','civ_factory','civ_tenement',
  'civ_office','civ_relay_tower',
  'uw_civ_shelter','uw_civ_reef_totem','uw_civ_habitat',
  'uw_civ_bastion','uw_civ_exchange','uw_civ_processor',
  'uw_civ_pod_stack','uw_civ_archive','uw_civ_sonar'
]);

// Species appearance categories — cosmetic only for now
const CIV_SPECIES_TYPES   = ['Insectoid','Reptilian','Mammalian','Aquatic','Crystalline','Fungoid'];
const CIV_AGGRESSION      = ['Passive','Territorial','Hostile'];

// Derive aggression from traits rather than rolling it independently.
// Each trait that leans territorial adds +1, each passive trait adds -1.
// Score > 0 ? Territorial, = 0 ? Passive.
// A separate small random chance (~12%) upgrades uncertain cases to Territorial —
// dangerous first contact should stay recoverable through play.
function civAggressionFromTraits(tierId, traits, rng){
  if(!traits) return 'Passive';
  let score = 0;
  // Primitive
  if(traits.diet      === 'carnivore')   score += 1;
  if(traits.diet      === 'herbivore')   score -= 1;
  if(traits.curiosity === 'isolated')    score += 1;
  if(traits.curiosity === 'curious')     score -= 1;
  if(traits.social    === 'individual')  score += 1;
  if(traits.social    === 'collective')  score -= 1;
  // Tribal
  if(traits.structure === 'chieftain')   score += 1;
  if(traits.structure === 'clan')        score += 1;
  if(traits.structure === 'council')     score -= 1;
  if(traits.ritual    === 'ancestor')    score += 1;
  if(traits.ritual    === 'animist')     score -= 1;
  // Medieval
  if(traits.governance === 'feudal')     score += 1;
  if(traits.governance === 'theocratic') score += 1;
  if(traits.governance === 'mercantile') score -= 1;
  if(traits.disposition === 'proud')     score += 1;
  if(traits.disposition === 'pragmatic') score -= 1;
  // Industrial
  if(traits.economy    === 'state')      score += 1;
  if(traits.economy    === 'cooperative')score -= 1;
  if(traits.economy    === 'corporate')  score -= 1;
  if(traits.bureaucracy === 'strict')    score += 1;
  // Information
  if(traits.policy === 'restrictive')    score += 1;
  if(traits.media  === 'controlled')     score += 1;
  if(traits.policy === 'open')           score -= 1;
  if(traits.media  === 'transparent')    score -= 1;
  // Rare edge case (~12%) — tense circumstances beyond what traits can describe
  if((rng ? rng() : Math.random()) < 0.12) score += 2;
  return score > 0 ? 'Territorial' : 'Passive';
}

// Primitive civilization deep traits — each axis is independent
// diet:     herbivore | omnivore | carnivore
// social:   collective | balanced | individual
// curiosity:curious | neutral | isolated
// honor:    honor | pragmatic
const PRIM_DIETS      = ['herbivore','omnivore','carnivore'];
const PRIM_SOCIAL     = ['collective','balanced','individual'];
const PRIM_CURIOSITY  = ['curious','neutral','isolated'];
const PRIM_HONOR      = ['honor','pragmatic'];

// Traits for non-primitive tiers — two axes each, stable per planet seed
// medieval:   governance (feudal|theocratic|mercantile) · disposition (proud|wary|pragmatic)
// industrial: economy (corporate|state|cooperative)     · bureaucracy (strict|flexible)
// information:media (transparent|controlled)            · policy (open|restrictive)
const CIVI_TRAITS = {
  // tribal: ritual axis (spiritual life) · structure axis (authority model)
  tribal:      { ritual:['animist','ancestor','totem'],           structure:['chieftain','council','clan'] },
  medieval:    { governance:['feudal','theocratic','mercantile'], disposition:['proud','wary','pragmatic'] },
  industrial:  { economy:['corporate','state','cooperative'],     bureaucracy:['strict','flexible'] },
  information: { media:['transparent','controlled'],              policy:['open','restrictive'] },
};
function generateCivilizationTraits(tier, rng){
  const axes = CIVI_TRAITS[tier];
  if(!axes) return null;
  const traits = {};
  Object.entries(axes).forEach(([axis, values])=>{
    traits[axis] = values[Math.floor(rng()*values.length)];
  });
  return traits;
}
function civTraitSummary(civ){
  if(!civ?.traits) return '';
  if(civ.tier === 'primitive') return primTraitSummary(civ.traits);
  return Object.values(civ.traits).join(' · ');
}

function generatePrimitiveTraits(rng){
  return {
    diet:      PRIM_DIETS[Math.floor(rng()*PRIM_DIETS.length)],
    social:    PRIM_SOCIAL[Math.floor(rng()*PRIM_SOCIAL.length)],
    curiosity: PRIM_CURIOSITY[Math.floor(rng()*PRIM_CURIOSITY.length)],
    honor:     PRIM_HONOR[Math.floor(rng()*PRIM_HONOR.length)],
  };
}

// Returns a human-readable one-line trait summary for UI/log display
function primTraitSummary(traits){
  if(!traits) return '';
  const diet = { herbivore:'plant-eaters', omnivore:'omnivores', carnivore:'predators' }[traits.diet] || traits.diet;
  const soc  = { collective:'collective', balanced:'loosely grouped', individual:'individualistic' }[traits.social] || traits.social;
  const cur  = { curious:'curious', neutral:'guarded', isolated:'reclusive' }[traits.curiosity] || traits.curiosity;
  const hon  = { honor:'honor-bound', pragmatic:'pragmatic' }[traits.honor] || traits.honor;
  return diet+' · '+soc+' · '+cur+' · '+hon;
}

// Seeded RNG for stable civilization per planet key
function civRng(seed){
  let s = seed;
  return function(){ s=(s*1664525+1013904223)&0xffffffff; return (s>>>0)/0xffffffff; };
}

// Generate civilization descriptor for a planet key.
// Returns null if no civ should exist (non-habitable or roll failed).
function generateCivDescriptor(pKey){
  // Simple string hash → seed
  let hash=0; for(let i=0;i<pKey.length;i++) hash=(hash*31+pKey.charCodeAt(i))|0;
  const rng = civRng(hash^0x5a3c9b1e);
  // 40% chance any habitable planet has a civilization
  if(rng() > 0.40) return null;
  // Tech tier — weighted toward lower tiers
  const tierRoll = rng();
  const tierIdx = tierRoll < 0.35 ? 0 : tierRoll < 0.60 ? 1 : tierRoll < 0.78 ? 2 : tierRoll < 0.92 ? 3 : 4;
  const tier = CIV_TIERS[tierIdx];
  const species = CIV_SPECIES_TYPES[Math.floor(rng()*CIV_SPECIES_TYPES.length)];
  const count = tier.count[0] + Math.floor(rng()*(tier.count[1]-tier.count[0]+1));
  const desc = { tier: tier.id, tierLabel: tier.label, species, count, tiles: tier.tiles };
  // Primitive tier gets deep personality traits and a group size (2–5 individuals), no buildings
  if(tier.id === 'primitive'){
    desc.traits = generatePrimitiveTraits(rng);
    desc.groupSize = 2 + Math.floor(rng() * 4); // 2–5 individuals in the band
    desc.tiles = []; // explicitly no structures
  } else {
    // Non-primitive tiers get two-axis traits seeded to the planet
    const civTraits = generateCivilizationTraits(tier.id, rng);
    if(civTraits) desc.traits = civTraits;
  }
  // Aggression derives from traits — no independent roll
  desc.aggression = civAggressionFromTraits(tier.id, desc.traits, rng);
  return desc;
}

// Place civilization structures onto a planet grid
function placeCivilization(pKey, grid){
  const civ = generateCivDescriptor(pKey);
  if(!civ) return null;

  // Aquatic civilizations live entirely underwater — their structures and roam
  // center are placed by generateUnderwaterMap(), not here on the surface grid.
  // Return the descriptor with no land footprint so the underwater generator
  // can pick it up via G.planets[surfaceKey].civilization later.
  if(civ.species === 'Aquatic'){
    return civ;
  }

  // Primitive: no structures, just find a roaming center on passable ground
  if(civ.tier === 'primitive'){
    const passable = [];
    const h = grid.length, w = grid[0]?.length || 0;
    for(let y=3; y<h-3; y++) for(let x=3; x<w-3; x++){
      const t = grid[y]?.[x]?.type;
      if(t && TILE[t]?.pass && t !== 'EARTH_WATER') passable.push({x,y});
    }
    if(passable.length === 0) return null;
    const center = passable[Math.floor(Math.random()*passable.length)];
    civ.roamCenter = { x:center.x, y:center.y };
    civ.roamRadius = 8 + Math.floor(Math.random()*6); // 8–13 tile radius
    return civ;
  }

  let placed = 0;
  let attempts = 0;
  const floorTypes = ['EARTH_FLOOR','EARTH_FOREST'];
  while(placed < civ.count && attempts < 600){
    attempts++;
    const tx = 1 + Math.floor(Math.random()*(grid[0].length-2));
    const ty = 1 + Math.floor(Math.random()*(grid.length-2));
    const cell = grid[ty]?.[tx];
    if(!cell || !floorTypes.includes(cell.type)) continue;
    const tileType = civ.tiles[Math.floor(Math.random()*civ.tiles.length)];
    grid[ty][tx] = { type: tileType, civKey: pKey };
    placed++;
  }
  if(placed === 0) return null;
  return civ;
}

function ensureCivilizationState(pdata){
  if(!pdata?.civilization) return null;
  const civ = pdata.civilization;
  if(!civ.state){
    const aggression = civ.aggression || 'Passive';
    const isPrim = civ.tier === 'primitive';
    const traits = civ.traits || {};
    const startsHostile = aggression === 'Hostile';
    // Starting relation/alert derive entirely from trait modifiers below.
    // Territorial civs are no longer seeded with a blanket penalty — their
    // territorial traits (carnivore, chieftain, strict, etc.) produce the
    // tense starting state naturally through the same axes used everywhere else.
    let baseRelation = 0;
    let baseAlert    = 0;
    if(isPrim && !startsHostile){
      if(traits.curiosity === 'curious')  baseRelation += 1;
      if(traits.curiosity === 'isolated') baseRelation -= 1;
      if(traits.curiosity === 'isolated') baseAlert    += 1;
      if(traits.diet === 'carnivore')     baseAlert    += 1;
      if(traits.diet === 'herbivore')     baseRelation += 1;
      if(traits.social === 'collective')  baseAlert    += 1;
    }
    if(!isPrim && !startsHostile){
      // Medieval
      if(traits.ritual === 'animist')       baseRelation += 1; // nature-oriented, open to outside world
      if(traits.ritual === 'ancestor')      baseAlert    += 1; // ancestral purity — outsiders are a spiritual risk
      if(traits.structure === 'chieftain')  baseAlert    += 1; // chieftain must assess threat personally — cautious by default
      if(traits.structure === 'council')    baseRelation += 1; // collective deliberation — slower to panic
      if(traits.structure === 'clan')       baseAlert    += 1; // clan loyalty — outsiders are unknown quantities
      if(traits.disposition === 'proud')    baseAlert    += 1;  // take offence easily
      if(traits.disposition === 'pragmatic') baseRelation += 1; // open to negotiation
      if(traits.governance === 'mercantile') baseRelation += 1; // value contact for trade
      if(traits.governance === 'theocratic') baseAlert    += 1; // outsiders are spiritually risky
      // Industrial
      if(traits.bureaucracy === 'strict')   baseAlert    += 1;  // non-compliant arrivals alarming
      if(traits.economy === 'cooperative')  baseRelation += 1;  // open to outside parties
      if(traits.economy === 'corporate')    baseRelation += 1;  // see crew as commercial opportunity
      // Information
      if(traits.policy === 'restrictive')   { baseAlert += 1; baseRelation -= 1; }  // suspicious of outsiders
      if(traits.media === 'transparent')    baseRelation += 1;  // public-facing, welcome outside contact
      if(traits.policy === 'open')          baseRelation += 1;
    }
    civ.state = {
      contacted:false,
      relation: startsHostile ? -5 : Math.max(-10, Math.min(10, baseRelation)),
      alert:    startsHostile ? 5  : Math.max(0,  Math.min(5, baseAlert)),
      languageProgress:0,
      tradeUnlocked:false,
      hostile: startsHostile,
      hostileResponse: startsHostile ? civilizationHostileResponse(civ) : null,
      giftsReceived:0,
      aidGiven:false,
      firstContactTurn:null,
    };
  }
  return civ.state;
}

function civRelationLabel(state){
  const r = state?.relation || 0;
  if(state?.hostile || r <= -8) return 'Hostile';
  if(r <= -4) return 'Alarmed';
  if(r < 2)   return 'Neutral';
  if(r < 6)   return 'Receptive';
  return 'Friendly';
}

function civAlertLabel(state){
  const a = state?.alert || 0;
  if(state?.hostile || a >= 5) return 'hostile response';
  if(a >= 4) return 'near panic';
  if(a >= 3) return 'tense';
  if(a >= 2) return 'alert';
  if(a >= 1) return 'watchful';
  return 'calm';
}

function civRelationMoodText(state, civ){
  const label = civRelationLabel(state);
  const hasHistory = !!(state?.contacted || state?.firstContactTurn || state?.giftsReceived || state?.boundaryPromise?.broken || state?.escortAccepted);
  const territorial = civ?.aggression === 'Territorial';
  if(label === 'Hostile'){
    if(hasHistory) return 'They remember the crew as a threat, and every movement is judged through that memory.';
    if(civ?.aggression === 'Hostile') return 'They meet strangers as threats by default; fear, doctrine, or old dangers have made caution look like hostility.';
    return 'They already read the crew as dangerous, even before any real exchange can begin.';
  }
  if(label === 'Alarmed'){
    if(territorial) return 'The crew is inside their space and they have not decided what to do about it yet. Every movement is being tracked.';
    if(hasHistory) return 'Trust has been damaged; even harmless gestures are met with suspicion.';
    return 'They are uneasy from the start, watching the crew as a possible problem rather than a guest.';
  }
  if(label === 'Neutral'){
    if(territorial) return 'The boundary has been acknowledged. They are watching to see if the crew keeps its word.';
    if(hasHistory) return 'They are watching and withholding judgment. The crew is known but not trusted.';
    return 'They have not decided whether these strangers are safe. Distance is kept and patterns are read.';
  }
  if(label === 'Receptive'){
    if(territorial) return 'The crew has earned a degree of tolerance. They are still watching, but the challenge posture is down.';
    if(hasHistory) return 'Caution remains, but the previous exchange was not harmful. They are willing to continue.';
    return 'They hold their ground, but something in the posture says they are open to what comes next.';
  }
  // Friendly
  if(hasHistory) return 'They seem ready to treat the crew as guests, or at least as people worth hearing out.';
  return 'Their first instinct is unusually open; they seem prepared to hear the crew out before judging them.';
}

function civAlertMoodText(state){
  const label = civAlertLabel(state);
  if(label === 'hostile response') return 'Defenders are already committed; this is no longer just a conversation.';
  if(label === 'near panic') return 'The scene is stretched thin, one bad step away from panic or violence.';
  if(label === 'tense') return 'Weapons, watchers, or emergency procedures are visible around the exchange.';
  if(label === 'alert') return 'Several locals are watching for danger right now, ready to react if the crew presses.';
  if(label === 'watchful') return 'The moment is controlled but not relaxed; someone nearby is clearly responsible for watching the crew.';
  return 'No active alarm shapes the moment yet; normal life has slowed, but it has not broken.';
}

