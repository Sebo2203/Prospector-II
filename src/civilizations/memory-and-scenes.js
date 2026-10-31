// ── CONTACT MEMORY ─────────────────────────────────────────────────────────
// Instead of a boolean "contacted", we store a short list of memory entries.
// Each entry is { turn, event, note } where note is a one-line narrative detail.

function civAddMemory(wrap, event, note){
  if(!wrap?.state) return;
  if(!wrap.state.memories) wrap.state.memories = [];
  wrap.state.memories.push({ turn: G.turn || 1, event, note });
  // Cap at 6 entries — oldest drop first
  if(wrap.state.memories.length > 6) wrap.state.memories.shift();
}

function civHasMemory(wrap, event){
  return (wrap?.state?.memories || []).some(m => m.event === event);
}

function civMemoryReturnLine(wrap){
  const mems = wrap?.state?.memories || [];
  if(!mems.length) return null;
  // Pick the most recent memory that has a return-visit note
  const notable = [...mems].reverse().find(m => m.note);
  if(!notable) return null;
  return notable.note;
}

// ── COMPREHENSION FOG ──────────────────────────────────────────────────────
// Returns true if language is too poor to understand intent — player is guessing

function civIsBlind(wrap){
  const comp = civComprehension(wrap.civ, wrap.state);
  return comp === 'uncertain' || comp === 'none';
}

// ── SCENE BUILDER ──────────────────────────────────────────────────────────
// Returns the opening scene paragraph for the current encounter state.
// This IS the narrative — there are no separate moodText functions exposed to player.

function civSceneText(wrap, ctx){
  const civ = wrap.civ, state = wrap.state, species = civ.species;
  const isPrim = civ.tier === 'primitive';
  const traits = isPrim ? (civ.traits || {}) : {};
  const comp = civComprehension(civ, state);
  const isBlind = comp === 'uncertain' || comp === 'none';
  const territorial = civ.aggression === 'Territorial';
  const isLocal = isLocalContact();
  const sci = getCrewScientist();

  // Scientist observation — injected as a parenthetical into any scene
  // Only when comprehension is fragmentary or better and scientist is alive
  function sciObservation(){
    if(!sci || isBlind) return '';
    const sciName = crewDisplayName(sci);
    if(isPrim){
      const { diet, social, curiosity, honor } = traits;
      if(diet==='carnivore') return '\n\n['+sciName+'] reads the spacing as hunt-formation — disciplined intervals, everyone aware of everyone else\'s position.';
      if(diet==='herbivore' && (state.alert||0)>=2) return '\n\n['+sciName+'] notes the posture is flight-primed. They are not preparing to attack — they are preparing to run.';
      if(social==='collective') return '\n\n['+sciName+'] observes decisions passing through the group without any single individual leading. Watch the whole band, not any one of them.';
      if(curiosity==='curious') return '\n\n['+sciName+'] clocks the repeated glances at the crew\'s equipment. They want to know what it does.';
      if(curiosity==='isolated') return '\n\n['+sciName+'] reads the body language as territorial stress — the crew is too far inside whatever boundary they maintain.';
      if(honor==='honor') return '\n\n['+sciName+'] identifies ritual markers in the posture — formality, not aggression. There are rules here.';
    }
    const tTraits = civ.tier === 'tribal' ? (civ.traits || {}) : {};
    const tribalObs = civ.tier === 'tribal'
      ? tTraits.structure === 'council'
        ? '['+sciName+'] notes no single figure leads — decisions seem to pass through the group in a consensus rotation.'
        : tTraits.structure === 'clan'
        ? '['+sciName+'] reads the formation as clan-arranged — sub-groups maintaining tight proximity, a senior figure at the centre of each.'
        : '['+sciName+'] notes the approach formation is structured around a central elder figure.'
      : null;
    const tierObs = {
      tribal: tribalObs,
      medieval:'['+sciName+'] reads the guards\' positioning — they have done this before, and not recently.',
      industrial:'['+sciName+'] observes the group has already logged this interaction on a device.',
      information:'['+sciName+'] detects sub-vocal communication. They are being analysed in real time.',
    };
    if(species === 'Aquatic'){
      const aquaticObs = {
        tribal:     '['+sciName+'] maps the bioluminescent signal pattern — interval, colour shift, direction. This is structured language. The crew is being described to someone further in.',
        medieval:   '['+sciName+'] reads the patrol formation: depth-staggered, overlapping arcs, acoustic shadow discipline. These are trained defenders, not militia.',
        industrial: '['+sciName+'] detects a sonar ping on a tactical frequency. The crew has been measured, classified, and the data has already moved upstream.',
        information:'['+sciName+'] identifies sub-channel acoustic communication — encrypted, fast. The crew\'s biometrics and vessel profile are being processed in real time.',
      };
      return aquaticObs[civ.tier] ? '\n\n'+aquaticObs[civ.tier] : '';
    }
    return tierObs[civ.tier] ? '\n\n'+tierObs[civ.tier] : '';
  }

  // Return visit — open with memory, then layer in language, relation, and unlocked state
  if(state.contacted){
    const memLine = civMemoryReturnLine(wrap);
    const base = memLine || 'The crew is recognised. Something from the last encounter is still shaping how they hold themselves.';

    // ── Language progress line ──────────────────────────────────────────────
    // What the crew can now do with language that they could not before
    let langLine = '';
    if(isPrim){
      const { diet, social, curiosity, honor } = traits;
      if(comp === 'fluent'){
        langLine = curiosity==='curious'
          ? ' The language gap has closed enough that real questions are possible now — and they have questions too.'
          : honor==='honor'
          ? ' Enough of the formal register has been learned to speak in terms they recognise as proper.'
          : diet==='carnivore'
          ? ' The crew can now communicate intent clearly enough that a predator group can read it as something other than threat or weakness.'
          : ' The crew and this group can exchange meaning rather than gesture.';
      } else if(comp === 'workable'){
        langLine = curiosity==='curious'
          ? ' Enough language has come through that the crew can hold a rough exchange — and they are clearly willing to try.'
          : diet==='carnivore'
          ? ' Intent can be communicated. Not fluently, but clearly enough that the hunters do not have to guess.'
          : social==='collective'
          ? ' The group registers that the crew is trying. Shared fragments of language have a different weight here than silence does.'
          : ' Fragments have become sentences. The exchange is rough, but it goes both ways now.';
      } else if(comp === 'fragmentary'){
        langLine = ' A few sounds carry meaning now — not enough for nuance, but enough that neither side has to operate entirely blind.';
      } else {
        langLine = ' The language is still opaque. Every message has to travel through posture and proximity.';
      }
    } else {
      const tier = civ.tier;
      if(comp === 'fluent'){
        langLine = {
          tribal:    (()=>{ const t=civ.traits||{}; return t.structure==='council'
            ? ' The crew can follow council turns well enough to be taken seriously, not just tolerated.'
            : t.structure==='chieftain'
            ? ' The crew can address authority in the right order now; that changes what the chieftain will hear.'
            : t.ritual==='ancestor'
            ? ' The crew understands the formal register around names, memory, and forbidden ground well enough to avoid easy offence.'
            : ' The crew can speak their formal register well enough to be taken seriously, not just tolerated.'; })(),
          medieval:  ' The legal and commercial register is workable now. The crew can negotiate, not just gesture.',
          industrial:' Communication runs clean in both directions. The crew is no longer a compliance problem to be managed.',
          information:' Full protocol fluency. The exchange is peer-to-peer, not visitor-and-authority.',
        }[tier] || ' The crew can communicate clearly enough that intent is no longer in doubt.';
      } else if(comp === 'workable'){
        langLine = {
          tribal:    (()=>{ const t=civ.traits||{}; return t.structure==='council'
            ? ' Enough has come through that the crew can make requests and recognise when the council is still deciding.'
            : t.ritual==='animist'
            ? ' Enough has come through that the crew can understand refusals tied to land, water, and living markers.'
            : ' Enough has come through that the crew can make requests and understand refusals.'; })(),
          medieval:  ' Rough communication is possible — trade terms, simple questions, clear warnings.',
          industrial:' The crew can navigate procedure and ask the right questions without triggering a compliance response.',
          information:' Enough protocol vocabulary has been acquired that the crew reads as cooperative rather than unauthorised.',
        }[tier] || ' Communication is rough but functional in both directions.';
      } else if(comp === 'fragmentary'){
        langLine = ' Some words carry between sides now — enough for warnings, names, and simple asks.';
      } else {
        langLine = ' The language is still mostly gestural. What the crew means and what they communicate are still different things.';
      }
    }

    // ── Relation texture line ───────────────────────────────────────────────
    // What the relationship feels like now, based on relation level + key state flags
    let relLine = '';
    const rel = state.relation || 0;
    const hadGifts   = (state.giftsReceived || 0) > 0;
    const tradeOpen  = !!state.tradeUnlocked;
    const aidGiven   = !!state.aidGiven;
    const hasBoundary = !!(state.boundaryPromise?.active);
    const boundaryKept = hasBoundary && !state.boundaryPromise?.broken;
    const intimidated = civHasMemory(wrap, 'intimidated');
    const submission  = (state.submission || 0) > 0;
    const tribute     = (state.tributeCount || 0) > 0;

    if(intimidated || submission || tribute){
      // Coercive history — tension sits under any surface calm
      relLine = tribute
        ? ' They produced tribute last time. They have not forgotten the cost of that, and they are watching to see if the crew intends to collect again.'
        : submission
        ? ' They were pressured into compliance before. Whatever openness they show now sits over a calculation about whether resistance would cost more.'
        : ' The threat made an impression. They are not relaxed in the crew\'s presence — they are managed.';
    } else if(rel >= 4){
      // Strong positive
      relLine = isPrim
        ? (hadGifts ? ' The gift exchanges have built something. The crew is no longer measured as a threat — they are measured as guests who have behaved correctly.'
          : ' The crew has earned something close to trust here. Whatever that looks like in this group, the crew is inside it.')
        : (aidGiven ? ' Aid was given and acknowledged. That changed the nature of the exchange in a way that formality alone cannot.'
          : tradeOpen ? ' The relationship has reached a point where the crew is treated as a known and welcome trading contact.'
          : ' The crew carries standing here. Whatever access that earns, it is available now.');
    } else if(rel >= 2){
      // Receptive
      relLine = isPrim
        ? (hadGifts ? ' The offerings have been received correctly. The exchange continues on better footing than it started.'
          : boundaryKept ? ' Yielding the boundary earned something. They still watch, but the challenge is down.'
          : ' They are not comfortable, but they are interested. The distance has shortened.')
        : (tradeOpen ? ' Trade has been opened. The crew has moved from unknown contact to recognised exchange partner.'
          : boundaryKept ? ' The boundary promise is holding. They notice. It matters to them.'
          : ' Caution remains, but there is a working relationship here now.');
    } else if(rel <= -2){
      // Damaged
      relLine = isPrim
        ? (tribute ? ' Tribute was taken. They comply, but the calculation is still running. How long depends on whether the crew presses further.'
          : ' Whatever went wrong between the crew and this group, the residue of it is visible in every movement they make.')
        : ' Trust has been damaged. The exchange continues under a different kind of scrutiny than the first visit.';
    }
    // rel -1 to 1: neutral, nothing added — the base memory line carries it

    // ── Alert line ──────────────────────────────────────────────────────────
    const alert = state.alert || 0;
    let alertLine = '';
    if(alert >= 4) alertLine = ' The tension from before has not cleared — the encounter is still close to its edge.';
    else if(alert >= 2) alertLine = ' Something from a previous exchange left a mark. The atmosphere is still tense.';

    return base + langLine + relLine + alertLine + sciObservation();
  }

  // Territorial opening — confrontation first
  if(territorial){
    return civTerritorialOpeningText(civ, isLocal) + sciObservation();
  }

  // Standard first approach
  const baseText = isPrim
    ? primApproachText(species, traits, isLocal)
    : (isLocal ? civApproachText(civ, state, true) : civApproachText(civ, state, false));
  return baseText + sciObservation();
}

