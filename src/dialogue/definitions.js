const DIALOGUE_DEFS = {
  walking_tree_contact: {
    title: "Communication: Walking Tree",
    nodes: {
      root: {
        repeatable: true,
        text: ctx => {
          const pdata = G.planets?.[ctx.planetKey || G.curPlanet];
          const state = pdata?.civilization ? ensureCivilizationState(pdata) : null;
          if(state?.hostile){
            return pick([
              "The tree's canopy contracts. Its roots dig into the soil — not retreat, but a brace for impact. There is nothing left to say here.",
              "The grove remembers what happened. The tree does not turn away, but it does not speak either. The silence is a verdict.",
              "The harmonic that usually precedes language is absent. What the trunk emits now is lower, subsonic. A warning, not a word.",
            ]);
          }
          const contacted = !!(state?.contacted);
          const heard = pdata?.talkingTreesHeard || 0;
          const hasSci = hasScientist();
          const sci = hasSci ? getCrewScientist() : null;
          if(contacted){
            const returnLines = [
              "The tree recognises the crew — or something in its slow memory corresponds to your presence. Its canopy stirs before you've spoken.",
              "The same tree, or one indistinguishable from the last. Its roots settle as you approach, like a patient that has learned to wait.",
              "It shifts its weight as you near. The low harmonic it emits has a different quality now — less cautious, more like a greeting.",
            ];
            let t = returnLines[heard % returnLines.length];
            if(hasSci) t += "\n\n"+sci.name+" has the translator warm and ready. Progress from the last exchange should carry over.";
            return t;
          }
          let t = "The massive tree shifts its weight on multiple thick roots that serve as legs. Its leaves rustle with a harmonic hum.";
          if(hasSci) t += "\n\n"+sci.name+" notes that the rustling patterns are distinctly linguistic, though incredibly slow.";
          return t;
        },
        onEnter: ctx => {
          const pdata = G.planets?.[ctx.planetKey || G.curPlanet];
          const state = pdata?.civilization ? ensureCivilizationState(pdata) : null;
          if(state && !state.contacted){
            state.firstContactTurn = state.firstContactTurn || G.turn || 0;
          }
        },
        options: ctx => {
          const pdata = G.planets?.[ctx.planetKey || G.curPlanet];
          const state = pdata?.civilization ? ensureCivilizationState(pdata) : null;
          if(state?.hostile){
            return [{ label: "Leave", action: "close" }];
          }
          const contacted = !!(state?.contacted);
          if(contacted){
            return [
              { label: "Stand close and listen", next: "return_listen" },
              { label: "Ask about the grove again", next: "what_are_you" },
              { label: "Ask about their world", next: "fire_mention" },
              { label: "Offer a peaceful gesture", next: "peace" },
              { label: "Attack", next: "attack_tree", style: "danger" },
              { label: "Leave them be", action: "close" },
            ];
          }
          return [
            { label: "Attempt first contact", next: "greet" },
            { label: "Attack", next: "attack_tree", style: "danger" },
            { label: "Leave them be", action: "close" },
          ];
        }
      },
      greet: {
        text: ctx => {
          const pdata = G.planets?.[ctx.planetKey || G.curPlanet];
          const state = pdata?.civilization ? ensureCivilizationState(pdata) : null;
          // Mark contacted on first greeting
          if(state && !state.contacted){
            state.contacted = true;
            state.firstContactTurn = state.firstContactTurn || G.turn || 0;
            if(pdata) pdata.talkingTreesHeard = (pdata.talkingTreesHeard || 0) + 1;
            trackPlanetDiscoveryOnce(ctx.planetKey || G.curPlanet, 'civilization_contact', 'civilization_contacted', {
              biome: pdata?.biome || 'TALKING_TREES', species: 'Walking Tree', tier: 'Primitive',
            });
          }
          return "The tree stands still for a long moment. Then, a low vibration rolls through the ground. Your translator eventually renders it: 'WE... SEE... YOU... STRANGERS... FROM... ABOVE.'";
        },
        options: [
          { label: "Ask: 'What are you?'", next: "what_are_you" },
          { label: "Offer a peaceful gesture", next: "peace" },
          { label: "Back away slowly", action: "close" }
        ]
      },
      return_listen: {
        text: ctx => {
          const pdata = G.planets?.[ctx.planetKey || G.curPlanet];
          if(pdata) pdata.talkingTreesHeard = (pdata.talkingTreesHeard || 0) + 1;
          const lines = [
            "'YOU... RETURN. THE... GROVE... HAS... SPOKEN... OF... YOU... SINCE.'",
            "'WE... COUNTED... THE... DAYS... BY... GROWTH. YOU... ARE... EARLY... FOR... A... TREE. PATIENT... FOR... SOMETHING... ELSE.'",
            "'OUR... ROOTS... CROSSED... YOURS... IN... MEMORY. THE... GROVE... DOES... NOT... FORGET.'",
          ];
          const heard = pdata?.talkingTreesHeard || 1;
          return lines[(heard - 1) % lines.length];
        },
        options: [
          { label: "Ask about the grove", next: "what_are_you" },
          { label: "Ask about their world", next: "fire_mention" },
          { label: "Offer a peaceful gesture", next: "peace" },
          { label: "Leave them be", action: "close" },
        ]
      },
      what_are_you: {
        text: ctx => {
          const pdata = G.planets?.[ctx.planetKey || G.curPlanet];
          const state = pdata?.civilization ? ensureCivilizationState(pdata) : null;
          const n = state?.groveTopicIdx || 0;
          const lines = [
            "'WE... ARE... THE... GROVE. WE... WALK... SO... THE... SOIL... DOES... NOT... TIRE... OF... US.'",
            "'WE... ARE... OLDER... THAN... THE... WORD... YOU... WOULD... USE... FOR... OLD. WE... DO... NOT... COUNT... YEARS. WE... COUNT... SOILS.'",
            "'WE... ARE... ONE... THING... THAT... IS... ALSO... MANY. YOUR... KIND... SEEMS... TO... BE... MANY... THINGS... TRYING... TO... BECOME... ONE.'",
            "'THE... GROVE... IS... NOT... THE... TREES. THE... GROVE... IS... THE... MEMORY... BETWEEN... THE... TREES.'",
          ];
          if(state) state.groveTopicIdx = (n + 1) % lines.length;
          return lines[n];
        },
        options: [
          { label: "Ask about the grove's ways", next: "fire_mention" },
          { label: "Offer a peaceful gesture", next: "peace" },
          { label: "Back away slowly", action: "close" }
        ]
      },
      fire_mention: {
        text: ctx => {
          const pdata = G.planets?.[ctx.planetKey || G.curPlanet];
          const state = pdata?.civilization ? ensureCivilizationState(pdata) : null;
          const n = state?.civTopicIdx || 0;
          const lines = [
            "'WE... DISCUSSED... INVENTING... FIRE... BUT... THE... COUNCIL... HAS... RULED... THAT... IT... WOULD... BE... TOO... DANGEROUS.'",
            "'THE... COUNCIL... MEETS... ONCE... PER... GROWTH. DECISIONS... ARE... SLOW. THIS... IS... NOT... A... FLAW.'",
            "'WE... HAVE... NO... WORD... FOR... WAR. WE... TRIED... TO... LEARN... IT... ONCE. WE... UNLEARNED... IT.'",
            "'SOME... AMONG... US... WISHED... TO... BUILD. THE... GROVE... VOTED. THE... GROVE... SAID... NO. THE... BUILDERS... WAITED... AND... CHANGED... THEIR... MINDS.'",
            "'THERE... ARE... THOSE... WHO... MOVE... FAST... AND... FORGET. WE... MOVE... SLOW... AND... REMEMBER... EVERYTHING.'",
            "'THE... SKY... HAS... DROPPED... STRANGERS... BEFORE. THEY... LEFT. WE... REMEMBER... WHERE... THEY... STOOD.'",
          ];
          if(state) state.civTopicIdx = (n + 1) % lines.length;
          return lines[n];
        },
        options: [
          { label: "Ask about the grove", next: "what_are_you" },
          { label: "Offer a peaceful gesture", next: "peace" },
          { label: "Back away slowly", action: "close" }
        ]
      },
      peace: {
        text: "The tree hums a resonant, soothing tone. 'YOUR... WAYS... ARE... FAST. BUT... PEACE... IS... DEEP.' It seems content to continue its slow wandering.",
        options: [
          { label: "Listen a moment longer", next: "root" },
          { label: "Leave them be", action: "close" }
        ]
      },
      attack_tree: {
        text: ctx => {
          const key = ctx.planetKey || G.curPlanet;
          const locals = (G.enemies?.[key] || []).filter(e=>e.alive && !e.hidden && e.civLocal && e.bodyLabel === 'ancient plant');
          const target = locals.sort((a,b)=>Math.max(Math.abs(a.x-G.player.x),Math.abs(a.y-G.player.y))-Math.max(Math.abs(b.x-G.player.x),Math.abs(b.y-G.player.y)))[0];
          if(!target) return "There is no Walking Tree close enough to attack.";
          G.dialogue = null;
          target.commRefused = true;
          target.canCommunicate = false;
          target.hostileByDefault = true;
          target.currentlyHostile = true;
          target.attitude = 'Hostile';
          makeCivilizationHostile(G.planets?.[key], 'Responding to crew violence');
          doCombat(target);
          return '';
        },
        options: []
      }
    }
  },
  civilization_contact: {
    title: ctx => {
      const wrap = dialogueCivilization();
      const civ = wrap?.civ;
      if(!civ) return 'Contact';
      const isPrim = civ.tier === 'primitive';
      const mode = isLocalContact() ? (isPrim ? 'Encounter' : 'Local') : isDelegationContact() ? 'Delegation' : 'Settlement';
      return mode+': '+civ.tierLabel+' '+civ.species;
    },
    subtitle: ctx => {
      const wrap = dialogueCivilization();
      if(!wrap) return '';
      const civ = wrap.civ, state = wrap.state;
      const isPrim = civ.tier === 'primitive';
      const traits = isPrim ? (civ.traits||{}) : {};
      const comp = civComprehension(civ, state);
      const alert = state.alert || 0;
      const sci = getCrewScientist();

      // Build an observation-based line rather than a stat dump
      let obs = '';
      if(isPrim){
        const { diet, social, curiosity, honor } = traits;
        const dietWord = diet==='carnivore' ? 'hunters' : diet==='herbivore' ? 'foragers' : 'opportunists';
        const socWord  = social==='collective' ? 'band-minded' : social==='individual' ? 'independent' : 'loosely grouped';

        // Disposition word reflects current contact state, not just static trait
        let curWord;
        if(state.hostile){
          curWord = state.hostileResponse === 'flee' ? 'scattered' : 'hostile';
        } else if((state.submission||0) > 0){
          curWord = 'subdued';
        } else if(alert >= 4){
          curWord = 'on the edge';
        } else if(alert >= 3){
          curWord = 'tense';
        } else if(state.contacted){
          const rel = state.relation || 0;
          if(rel >= 3){
            curWord = curiosity==='curious' ? 'receptive' : curiosity==='isolated' ? 'tolerating the crew' : 'cautiously open';
          } else if(rel >= 1){
            curWord = curiosity==='curious' ? 'engaged' : curiosity==='isolated' ? 'holding distance' : 'watchful';
          } else if(rel <= -2){
            curWord = curiosity==='isolated' ? 'wanting the crew gone' : 'wary';
          } else {
            curWord = curiosity==='curious' ? 'still curious' : curiosity==='isolated' ? 'still wanting distance' : 'uncommitted';
          }
        } else if(civ.aggression === 'Territorial'){
          curWord = 'asserting boundary';
        } else {
          // First contact — use trait reading
          curWord = curiosity==='curious' ? 'watching the crew closely' : curiosity==='isolated' ? 'wanting the crew gone' : 'undecided';
        }

        obs = dietWord.charAt(0).toUpperCase()+dietWord.slice(1)+', '+socWord+'. '+curWord.charAt(0).toUpperCase()+curWord.slice(1)+'.';
      } else {
        obs = civ.species + '.';
      }

      // Comprehension as plain language
      const compLine = comp==='uncertain' ? ' Language unknown.' : comp==='fragmentary' ? ' Some words coming through.' : comp==='workable' ? ' Communication possible.' : ' Fluent.';

      // Alert as situation feel
      const alertLine = alert>=4 ? ' On the edge.' : alert>=2 ? ' Tense.' : '';

      return obs + compLine + alertLine;
    },
    traits: ctx => {
      const wrap = dialogueCivilization();
      if(!wrap) return '';
      const civ = wrap.civ, state = wrap.state;
      // Only show traits once the crew has enough comprehension or study done
      if((state.languageProgress||0) < 2 && !civVisitState(wrap)?.studyCustomsDone) return '';
      return civTraitSummary(civ) || '';
    },
    start: 'root',
    nodes: {
      // ── ROOT ──────────────────────────────────────────────────────────────
      root: {
        repeatable: true,
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'No signal.';
          if(wrap.state.hostile){
            const isPrim = wrap.civ.tier === 'primitive';
            if(wrap.state.hostileResponse === 'flee'){
              return isPrim
                ? 'The group has scattered. Whoever was here has gone — into cover, into distance, into silence.'
                : 'No one answers. The area has emptied. Locals left quickly.';
            }
            return isPrim
              ? 'There is nothing to talk about now. The group made its decision.'
              : 'The contact has collapsed. They are not interested in words anymore.';
          }
          return civSceneText(wrap, ctx);
        },
        onEnter: ctx => {
          const wrap = dialogueCivilization();
          if(wrap) civVisitState(wrap);
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return [{ label:'Leave', action:'close' }];
          if(wrap.state.hostile){
            const opts = [];
            if(!isLocalContact()){
              if(wrap.state.hostileResponse === 'flee'){
                const siteKey = 'site_'+ctx.x+'_'+ctx.y;
                const siteTaken = wrap.state.siteLoot?.[siteKey]?.taken;
                if(!siteTaken){
                  opts.push({ label:'Take what\'s left behind', next:'loot_abandoned_settlement' });
                }
              } else {
                // Civ is standing their ground — spawn defenders if not already present, offer loot by force
                spawnCivilizationAssaultResponse(G.planets?.[G.curPlanet], { x:ctx?.x, y:ctx?.y });
                opts.push({ label:'Take from them by force', next:'loot_settlement' });
              }
            }
            opts.push({ label:'Leave', action:'close' });
            return opts;
          }
          return civPostureOptions(wrap, ctx);
        },
      },

      // ── OBSERVATION ───────────────────────────────────────────────────────
      pst_observe: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'Nothing to read.';
          const vs = civVisitState(wrap); if(vs) vs.observeDone = true;
          if(isLocalContact()) return primObserveText(wrap.civ.species, wrap.state, wrap.civ.traits||{}, true);
          return civObserveText(wrap.civ);
        },
        onEnter: ctx => {
          // Scout bonus
          const scout = (G.crew||[]).find(c=>c.role==='scout'&&c.hp>0);
          if(scout) addLog('Scout '+crewDisplayName(scout)+' marks positions and movement patterns.','li');
          const wrap = dialogueCivilization();
          // Language gain from observation is one-time only — repeated watching teaches nothing new.
          if(wrap && hasScientist() && !wrap.state.observeLangDone){
            wrap.state.observeLangDone = true;
            civGainLanguage(wrap.state, 1);
          }
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          const opts = [...civPostureOptions(wrap, ctx).filter(o=>o.next !== 'pst_observe')];
          if(civCanAnalyzeLanguage(wrap)){
            opts.unshift({ label:'Analyse their signals', disabled:!hasScientist(), disabledReason:'no scientist', next:'scientist_analyse' });
          }
          if(!opts.some(o=>o.action==='attack_civ')) opts.push({label:civilizationAttackLabel(),action:'attack_civ',style:'danger'});
          return opts;
        },
      },

      observe_settlement: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'Nothing visible from here.';
          const vs = civVisitState(wrap); if(vs) vs.observeDone = true;
          return civObserveText(wrap.civ);
        },
        onEnter: ctx => {
          const wrap = dialogueCivilization();
          // One-time language gain — shared flag with pst_observe.
          if(wrap && hasScientist() && !wrap.state.observeLangDone){
            wrap.state.observeLangDone = true;
            civGainLanguage(wrap.state, 1);
          }
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          const opts = [];
          if(civCanAnalyzeLanguage(wrap)) opts.push({ label:'Analyse their signals', disabled:!hasScientist(), disabledReason:'no scientist', next:'scientist_analyse' });
          opts.push({ label:'Back', next:'root' });
          return opts;
        },
      },

      // ── APPROACH POSTURES ─────────────────────────────────────────────────
      pst_approach_open: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'No response.';
          const result = civResolvePosture(wrap, 'open');
          if(result.ok){
            civMaybeMarkContact(wrap, ctx, 'peaceful approach');
            if(!ctx._memoryWritten){ civAddMemory(wrap, 'approach', 'The crew approached with open hands the first time. That was noted.'); ctx._memoryWritten=true; }
          } else {
            if(!ctx._memoryWritten){ civAddMemory(wrap, 'approach_fail', 'The crew\'s first approach went wrong. They remember the stumble.'); ctx._memoryWritten=true; }
          }
          wrap.state.relation = Math.min(result.relDelta > 0 ? civDialogueRelationCap(wrap) : 10,(wrap.state.relation||0)+result.relDelta);
          wrap.state.alert    = Math.max(0,Math.min(5,(wrap.state.alert||0)+result.alertDelta));
          civGainLanguage(wrap.state, 1);
          if(result.ok) civApplyPositiveMilestones(wrap, 'approach');
          if(!result.ok && (Math.random()<civHostilityRisk(wrap) || (wrap.state.alert||0)>=5)) civContactGoesHostile(wrap,'Approach triggered alarm');
          const cap = (G.crew||[]).find(c=>c.role==='captain'&&c.hp>0);
          if(cap) giveSkillXP(cap,'soc',result.ok?2:0);
          // For non-primitive tiers, override the generic text with tier-appropriate narration
          const civTierT = wrap.civ.tier;
          if(civTierT && civTierT !== 'primitive'){
            if(result.ok){
              const okLines = {
                tribal:(()=>{ const t=wrap.civ.traits||{}; return t.structure==='chieftain'
                  ? 'The crew reads the approach correctly — open hands, slow pace, no weapon display, attention given first to the chieftain. The window is open under authority.'
                  : t.structure==='council'
                  ? 'The crew approaches slowly and lets the watching council finish conferring. That patience is the correct signal. The window is open.'
                  : t.ritual==='ancestor'
                  ? 'The crew keeps open hands visible and stops short of the ancestor-marked ground. The restraint is noticed. The window is open.'
                  : t.ritual==='animist'
                  ? 'The crew moves carefully around the living markers instead of through them. The '+wrap.civ.species.toLowerCase()+' group holds position, but the alarm lowers.'
                  : 'The crew reads the approach correctly — open hands, slow pace, no weapon display. The '+wrap.civ.species.toLowerCase()+' group holds position and watches. The window is open.'; })(),
                medieval:'The approach registers as non-hostile. The patrol captain holds the order to advance. There is space now for a proper introduction.',
                industrial:'The crew\'s approach is assessed and categorised: non-threatening, compliant profile. Security holds the perimeter but the contact officer steps forward.',
                information:'Body language, pace, and positioning read as cooperative. The contact officer signals the camera crew to lower equipment. A formal exchange can begin.',
              };
              return okLines[civTierT] || result.text;
            } else {
              const failLines = {
                tribal:(()=>{ const t=wrap.civ.traits||{}; return t.structure==='chieftain'
                  ? 'The approach misfires by addressing the group before the chieftain. The '+wrap.civ.species.toLowerCase()+' close rank around authority. The window narrows.'
                  : t.structure==='council'
                  ? 'The crew moves before the council has finished deciding what the movement means. The group closes rank. The window has narrowed.'
                  : t.ritual==='ancestor'
                  ? 'The crew drifts too close to ancestor-marked ground. The reaction is immediate and cold. The window has not closed, but it has narrowed.'
                  : t.ritual==='animist'
                  ? 'The approach crosses a living marker at the wrong angle. The mistake is unreadable to the crew and obvious to the locals. The window narrows.'
                  : 'The approach misfires — wrong angle, wrong pace, something unreadable. The '+wrap.civ.species.toLowerCase()+' group closes rank. The window has not closed, but it has narrowed.'; })(),
                medieval:'The patrol reads the movement as either a feint or a provocation. Weapons remain levelled. The captain says: try again, differently.',
                industrial:'Security classifies the approach as non-compliant. Radio traffic spikes. The crew is not yet being detained, but the category has changed.',
                information:'The approach triggers a protocol response — perimeter tightened, officials withdraw behind the tape. Whatever the crew did, it matched a threat pattern in their contact procedures.',
              };
              return failLines[civTierT] || result.text;
            }
          }
          return result.text;
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap||wrap.state.hostile) return [{label:'Leave',action:'close'}];
          const opts = [];
          if((wrap.state.relation||0)>=0) opts.push({label:'Stay and watch what happens next',next:'pst_patient'});
          opts.push({label:'Offer something',disabled:!canOfferAlienGift(),disabledReason:'nothing to offer',next:'gift_select'});
          opts.push({label:'Step back',next:'pst_yield'});
          opts.push({label:'Leave',action:'close'});
          return opts;
        },
      },

      pst_approach_low: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'No response.';
          const result = civResolvePosture(wrap, 'low');
          if(result.ok) civMaybeMarkContact(wrap, ctx, 'submissive posture');
          wrap.state.relation = Math.min(result.relDelta > 0 ? civDialogueRelationCap(wrap) : 10,(wrap.state.relation||0)+result.relDelta);
          wrap.state.alert    = Math.max(0,Math.min(5,(wrap.state.alert||0)+result.alertDelta));
          if(result.ok) civApplyPositiveMilestones(wrap, 'posture');
          if(!result.ok && (Math.random()<civHostilityRisk(wrap)||(wrap.state.alert||0)>=5)) civContactGoesHostile(wrap,'Posture misread');
          return result.text;
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap||wrap.state.hostile) return [{label:'Leave',action:'close'}];
          return [
            {label:'Hold the position — wait',next:'pst_patient'},
            {label:'Offer something from this low position',disabled:!canOfferAlienGift(),disabledReason:'nothing to offer',next:'gift_select'},
            {label:'Leave',action:'close'},
          ];
        },
      },

      pst_approach_strong: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'No response.';
          const result = civResolvePosture(wrap, 'strong');
          if(result.ok) civMaybeMarkContact(wrap, ctx, 'strong display');
          wrap.state.relation = Math.min(result.relDelta > 0 ? civDialogueRelationCap(wrap) : 10,(wrap.state.relation||0)+result.relDelta);
          wrap.state.alert    = Math.max(0,Math.min(5,(wrap.state.alert||0)+result.alertDelta));
          if(result.ok) civApplyPositiveMilestones(wrap, 'posture');
          if(!result.ok && (Math.random()<civHostilityRisk(wrap)||(wrap.state.alert||0)>=5)) civContactGoesHostile(wrap,'Dominance display backfired');
          return result.text;
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap||wrap.state.hostile) return [{label:'Leave',action:'close'}];
          return [
            {label:'Hold the ground',next:'pst_patient'},
            {label:'Ease off — lower the display',next:'pst_yield'},
            {label:'Leave',action:'close'},
          ];
        },
      },

      pst_formal_intro: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'No response.';
          const prof = civContactScenarioProfile(wrap);
          const comp = civComprehension(wrap.civ, wrap.state);
          const aggrPenalty = wrap.civ.aggression === 'Territorial' ? 0.15 : 0;
          const t = wrap.civ.traits || {};
          // Trait modifiers on formal intro success
          const traitBonus = (t.disposition==='pragmatic'?0.08:0) + (t.governance==='mercantile'?0.06:0)
            + (t.bureaucracy==='flexible'?0.07:0) + (t.policy==='open'?0.08:0) + (t.media==='transparent'?0.05:0)
            + (t.structure==='council'?0.06:0) + (t.ritual==='totem'?0.05:0)
            - (t.disposition==='proud'?0.08:0) - (t.governance==='theocratic'?0.06:0)
            - (t.bureaucracy==='strict'?0.06:0) - (t.policy==='restrictive'?0.07:0)
            - (t.structure==='chieftain'?0.04:0) - (t.ritual==='ancestor'?0.05:0);
          const ok = Math.random() < Math.max(0.12, 0.60 + (hasScientist()?0.1:0) - ((wrap.state.alert||0)*0.06) - aggrPenalty + ((wrap.state.relation||0)*0.04) + traitBonus);
          civMaybeMarkContact(wrap, ctx, ok?'formal introduction':'failed introduction');
          if(ok){
            wrap.state.relation = Math.min(civDialogueRelationCap(wrap),(wrap.state.relation||0)+1);
            wrap.state.alert    = Math.max(0,(wrap.state.alert||0)-1);
            civGainLanguage(wrap.state, 1);
            civApplyPositiveMilestones(wrap, 'formal_intro');
          } else {
            wrap.state.alert = Math.min(5,(wrap.state.alert||0)+1);
            wrap.state.relation = Math.max(-5,(wrap.state.relation||0)-1);
          }
          if(!ok && (Math.random()<civHostilityRisk(wrap)||(wrap.state.alert||0)>=5)) civContactGoesHostile(wrap,'Introduction failed');
          const introTier = wrap.civ.tier;
          const introT = wrap.civ.traits || {};
          let introOkText = 'The introduction lands. Names, or something serving the same purpose, pass between both sides. The contact has a shape now.';
          let introFailText = 'The introduction misfires. The form was wrong, or the timing, or something that no one can explain yet.';
          if(introTier === 'tribal'){
            if(ok){
              introOkText = introT.structure==='chieftain' ? 'The crew addresses the chieftain first and waits for permission before looking elsewhere. That ordering matters. The introduction is accepted under authority.'
                : introT.structure==='council' ? 'The crew lets the introduction pass through the council rather than forcing one answer. The patience is recognised as respect.'
                : introT.ritual==='ancestor' ? 'The crew gives name and purpose without stepping nearer the ancestor-marked ground. The restraint carries the introduction farther than words alone.'
                : introT.ritual==='animist' ? 'The crew frames the introduction around place: ship there, crew here, no claim on the living ground. The form lands cleanly.'
                : 'The crew names itself at the marker line and waits. The introduction has the right shape for guest, not trespasser.';
            } else {
              introFailText = introT.structure==='chieftain' ? 'The introduction bypassed the chieftain. The one figure who could permit contact is now the one most visibly offended.'
                : introT.structure==='council' ? 'The crew asks for one answer from a group that decides by council. The pressure is read as disrespect.'
                : introT.ritual==='ancestor' ? 'Something in the introduction carried too close to ancestor ground. The words may be peaceful, but the form is wrong.'
                : introT.ritual==='animist' ? 'The crew speaks as if the ground is empty space. The locals react as if someone important was ignored.'
                : 'The introduction misfired. Wrong marker, wrong order, or wrong timing.';
            }
          } else if(introTier === 'medieval'){
            if(ok){
              introOkText = introT.governance==='theocratic' ? 'The crew is acknowledged through proper channels — a formal greeting that defers to their spiritual authority. That was the right instinct.'
                : introT.governance==='mercantile' ? 'The introduction reads as a commercial opening. Names and purposes exchanged — the '+wrap.civ.species.toLowerCase()+' are already calculating what the crew might want or offer.'
                : introT.disposition==='proud' ? 'The crew showed sufficient rank or bearing. The patrol captain acknowledges the introduction with a formal nod. Status was correctly communicated.'
                : 'The introduction lands in the right form. The contact has a shape now.';
            } else {
              introFailText = introT.disposition==='proud' ? 'The introduction lacked the required deference. The captain does not respond — the silence is a rebuke.'
                : introT.governance==='theocratic' ? 'Something in the approach violated an unspoken protocol. A figure in ceremonial dress steps forward and the captain defers to them. The contact is now a religious matter.'
                : 'The introduction misfired. Wrong form, or wrong timing.';
            }
          } else if(introTier === 'industrial'){
            if(ok){
              introOkText = introT.bureaucracy==='strict' ? 'The ID transmission arrives in a format their system can parse. A compliance code is issued. The crew is now a classified contact — still watched, but within procedure.'
                : introT.economy==='corporate' ? 'The crew is assessed as a viable commercial contact. The security supervisor passes a business card. This is how they open doors.'
                : introT.economy==='cooperative' ? 'The introduction is received cooperatively — the '+wrap.civ.species.toLowerCase()+' do not see the crew as a threat to be managed but a potential participant to be assessed.'
                : 'The transmission was received and processed. The crew has a contact record now.';
            } else {
              introFailText = introT.bureaucracy==='strict' ? 'The transmission format was wrong. Their system flagged it as non-compliant. Security steps forward with a form the crew cannot fill out.'
                : 'The identification did not process correctly. Something in the transmission raised a flag.';
            }
          } else if(introTier === 'information'){
            if(ok){
              introOkText = introT.media==='transparent' ? 'The contact officer confirms the introduction and the journalist behind them immediately begins a live feed. The crew is now on record — but public record, which offers its own protection.'
                : introT.policy==='open' ? 'The introduction is logged, verified against open databases, and approved inside thirty seconds. The '+wrap.civ.species.toLowerCase()+' contact infrastructure is fast when it wants to be.'
                : 'The crew\'s identity clears the first verification gate. The contact officer\'s posture shifts from containment to management.';
            } else {
              introFailText = introT.policy==='restrictive' ? 'The identity check fails a cross-reference. The contact officer steps back and two more officials appear from behind a vehicle. The crew is now a compliance problem.'
                : introT.media==='controlled' ? 'The introduction is logged but the response is silence. Someone with more authority is being consulted. The crew waits.'
                : 'The introduction did not clear verification. Something did not match.';
            }
          }
          return ok ? introOkText+'\n\n'+prof.greetSuccess : introFailText+'\n\n'+prof.greetFailure;
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap||wrap.state.hostile) return [{label:'Leave',action:'close'}];
          return [
            {label:'Ask what they want',next:'intent'},
            {label:'Offer something',disabled:!canOfferAlienGift(),disabledReason:'nothing',next:'gift_select'},
            {label:'Back',next:'root'},
          ];
        },
      },

      // ── GROUND OFFER (primitive gift without eye contact) ─────────────────
      pst_ground_offer: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'No response.';
          return civIsBlind(wrap)
            ? 'Placing something on the ground and stepping back is a universal gesture. They will interpret what it means to them.'
            : 'An object on the ground, crew stepped back. Low-risk — it gives them the choice to engage on their terms.';
        },
        options: ctx => [
          { label:'Choose what to place', disabled:!canOfferAlienGift(), disabledReason:'nothing to offer', next:'gift_select' },
          { label:'Back', next:'root' },
        ],
      },

      // ── PATIENCE ─────────────────────────────────────────────────────────
      pst_patient: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'Time passes.';
          const isPrim = wrap.civ.tier === 'primitive';
          const traits = wrap.civ.traits || {};
          const { diet, social, curiosity, honor } = traits;
          const bonus = Math.random() < (curiosity==='curious'?0.55:curiosity==='isolated'?0.20:0.38);
          if(bonus){
            civGainLanguage(wrap.state, 1);
            if(hasScientist()) wrap.state.relation = Math.min(civDialogueRelationCap(wrap),(wrap.state.relation||0)+1);
          }
          if(isPrim){
            if(bonus){
              if(curiosity==='curious') return 'One of them separates from the group by a body-length. Not approaching — but not hiding behind the others either. Patience was the right call.';
              if(diet==='carnivore') return 'The hunters hold position but the formation relaxes slightly. They are satisfied the crew is not a threat right now. That buys something.';
              if(honor==='honor') return 'Not moving first, not filling silence — there is something in that which the group registers. One of them makes a small, deliberate gesture toward the crew.';
              return 'Movement from their side — small, deliberate, in the crew\'s direction. The wait paid off.';
            } else {
              // Failed patience — still gives information
              if(curiosity==='isolated') return 'They used the stillness to reposition. Not retreating — moving to a better vantage point. They are watching from somewhere the crew can no longer see all of them.';
              if(diet==='carnivore') return 'The hunters grew patient faster than the crew did. One moves laterally — not toward the crew, but to a flanking angle. They are not leaving.';
              if(social==='collective') return 'A decision passed through the group while the crew waited. Something was agreed. The energy has changed, but nothing has happened yet.';
              if(honor==='honor') return 'The silence stretched too long. One of them drove a stick into the ground — a marking or a signal. The crew cannot read which.';
              return 'They moved. Not toward the crew and not away — to a different position, closer to cover. They are still watching, but from a better place for them.';
            }
          }
          if(wrap.civ.tier === 'medieval'){
            if(bonus){
              civGainLanguage(wrap.state, 1);
              return 'A figure separates from the group — not a guard, but someone carrying a marked token or staff. They approach at a deliberate pace. The wait earned this.';
            }
            return 'The crew holds position. The guards exchange words among themselves. No one approaches, but no one moves to drive the crew off either. The patience is noted, not rewarded. Yet.';
          }
          const tier2 = wrap.civ.tier;
          const sp = wrap.civ.species.toLowerCase();
          if(tier2 === 'industrial'){
            if(bonus){
              const obs = pick([
                'An off-shift worker pauses near the crew\'s position, sets down a container, and leaves without making eye contact. The container holds water and something pressed and wrapped. They did not need to do that.',
                'A group of workers on a break have spread out on a low wall nearby. One of them is watching the crew with more curiosity than suspicion. They say something in '+sp+' that makes the others laugh — not hostility, just commentary.',
                'A shift supervisor passes on their rounds, slows briefly, and marks something on a physical clipboard. Whatever was written is not an alarm. The crew has been categorised and, apparently, accepted at the margin.',
              ]);
              addLog(sp+' workers observe the crew — tension marginally lower.','li');
              return obs;
            }
            const obs2 = pick([
              'Workers move past on schedule, eyes forward. One glances over but the shift rotation keeps them from stopping. The crew is part of the background now — logged but not interesting.',
              'A small automated vehicle navigates around the crew without pausing. Behind it, a '+sp+' maintenance worker follows, checks something on a wall-mounted panel, and does not acknowledge the crew at all.',
              'Factory noise. Shift change. A PA announcement in '+sp+'. Nobody explains it. The settlement\'s routine absorbs the crew\'s presence without responding to it.',
            ]);
            return obs2;
          }
          if(tier2 === 'information'){
            if(bonus){
              const obs = pick([
                'A '+sp+' journalist — not official, clearly freelance — has set up a camera at a respectful distance. They wave when they realise the crew is watching. Whatever piece they are filing, it is not hostile. This kind of exposure is sometimes useful.',
                'One of the contact officials steps aside to take a call, returns, and hands the crew a printed document. It is a one-page contact acknowledgement with a reference number. Bureaucratically, this is a significant improvement: the crew is now a file, not an anomaly.',
                'A group of '+sp+' civilians has gathered behind the perimeter tape — not officials, just curious. Some are taking pictures. A child in the group waves. The crowd is friendly, which means public opinion is reading this as interesting rather than threatening.',
              ]);
              civGainLanguage(wrap.state, 1);
              addLog('Civilian interaction noted. Language progress advances.','li');
              return obs;
            }
            const obs2 = pick([
              'The contact officer\'s shift ends. A replacement arrives, reads a briefing, and takes up the same position. The crew has been handed from one official to another. Nothing has changed, but everything has been logged.',
              'A drone passes overhead at low altitude, pauses above the crew for three seconds, then continues. It is not threatening. It is filing a visual record. The crew\'s position is now timestamped in someone\'s system.',
              'Emergency vehicles move through a street in the distance. Not related to the crew — just the city running. The '+sp+' settlement operates around the crew\'s presence without incorporating it. Waiting costs the crew nothing. It may cost them patience.',
            ]);
            return obs2;
          }
          return bonus
            ? 'The patience is read correctly. The atmosphere loses a fraction of its tension.'
            : 'They reposition during the wait. Not threatening — calculating. The crew has been assessed, and the assessment is not finished.';
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return [{label:'Leave',action:'close'}];
          return [...civPostureOptions(wrap,ctx).filter(o=>o.next!=='pst_patient'), {label:civilizationAttackLabel(),action:'attack_civ',style:'danger'}];
        },
      },

      // ── YIELD ─────────────────────────────────────────────────────────────
      pst_yield: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'The crew steps back.';
          const isPrim = wrap.civ.tier === 'primitive';
          const traits = wrap.civ.traits||{};
          const territorial = wrap.civ.aggression === 'Territorial';

          // Base chance of the gesture landing
          let chance = 0.45;
          if(territorial)                     chance -= 0.15; // territorial civs rarely read retreat as anything but weakness
          if(isPrim && traits.diet==='carnivore') chance -= 0.15; // predators may advance to fill the gap
          if(isPrim && traits.honor==='honor')    chance += 0.15; // deliberate yielding reads as formal
          if(isPrim && traits.curiosity==='isolated') chance -= 0.10; // reclusive group may just leave
          if(isPrim && traits.social==='collective')  chance += 0.05; // group reads unified signals
          if((wrap.state.alert||0) >= 4)          chance -= 0.10; // already at the edge, less receptive

          const ok = Math.random() < Math.max(0.1, Math.min(0.75, chance));

          if(ok){
            wrap.state.alert = Math.max(0,(wrap.state.alert||0) - 1);
            if(territorial) wrap.state.relation = Math.min(civDialogueRelationCap(wrap),(wrap.state.relation||0) + 1);
            if(isPrim){
              if(traits.diet==='carnivore') return 'The crew gives ground. The hunters watch but do not advance. For now, the retreat is accepted as a signal rather than an opening.';
              if(traits.honor==='honor') return 'The crew steps back without being pushed. The gesture is deliberate enough that it registers — a voluntary concession reads differently here than a forced one.';
              if(traits.curiosity==='isolated') return 'The crew backs away. The group does not follow. The distance is what they wanted, and now they have it.';
              return 'The crew backs off. The group\'s tension drops — marginally, but visibly.';
            }
            if(territorial) return 'The crew yields ground. That was the demand. The confrontation eases one step.';
            return 'The crew steps back. The gesture is read correctly. A fraction of the tension lifts.';
          } else {
            // Gesture read wrong or simply not enough
            if(isPrim){
              if(traits.diet==='carnivore') return 'The crew gives ground. The wrong signal — the hunters interpret the retreat as vulnerability and close the gap slightly. The situation has not improved.';
              if(traits.curiosity==='isolated') return 'The crew backs away. The group does not relax. To a reclusive band, movement in any direction is something to track, not a gesture to interpret.';
              if(traits.social==='collective') return 'The crew steps back. The group watches and does not settle. They have not read the movement as a concession.';
              return 'The crew backs off. The tension does not drop. Whatever they were reading into the situation, this was not the answer to it.';
            }
            if(territorial) return 'The crew yields. It is not enough. They expected compliance earlier — stepping back now just confirms the crew needed prompting.';
            return 'The crew steps back. The gesture does not land. They are watching with the same weight they were before.';
          }
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return [{label:'Leave',action:'close'}];
          return civPostureOptions(wrap,ctx).filter(o=>o.next!=='pst_yield');
        },
      },

      // ── JOIN HUNT (carnivore established-contact option) ──────────────────
      pst_join_hunt: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'No response.';
          const traits = wrap.civ.traits || {};
          const species = wrap.civ.species;
          const baseChance = 0.45;
          const bonus = (traits.social==='collective'?0.15:0) + (traits.honor==='honor'?0.10:0);
          const ok = Math.random() < Math.max(0.15, Math.min(0.80, baseChance+bonus-((wrap.state.alert||0)*0.08)));
          if(ok){
            // Joining the hunt is as meaningful as giving a gift — apply the gift-1 cap.
            const huntCap = Math.max(civDialogueRelationCap(wrap), 6);
            wrap.state.relation = Math.min(huntCap,(wrap.state.relation||0)+2);
            civGainLanguage(wrap.state, 2);
            civAddMemory(wrap,'joined_hunt','The crew ran with the hunters. That earned something no gift could have.');
            const merc=(G.crew||[]).filter(c=>c.hp>0).sort((a,b)=>(b.skills?.cbt||0)-(a.skills?.cbt||0))[0];
            if(merc) giveSkillXP(merc,'cbt',3);
            return 'The crew moves with the '+species+' rather than waiting. Understood immediately — they make space in the formation.\n\nThe hunt lasts long enough to establish something conversation could not. Not kin, but not strangers either.';
          } else {
            wrap.state.alert = Math.min(5,(wrap.state.alert||0)+1);
            civAddMemory(wrap,'hunt_refused','The crew tried to join the hunt. Refused. That said something.');
            return 'The attempt to fall in with the hunters is blocked — clearly but not aggressively. A gesture meaning: not yet, or not you, or not now.';
          }
        },
        options: ctx => [{label:'Continue',next:'root'}],
      },

      // ── LAND GESTURE (primitive — point to terrain, ask about territory) ──
      pst_land_gesture: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'No response.';
          // Language gain from land gesture is one-time — pointing at territory teaches the basic concept once.
          if(!wrap.state.landGestureLangDone){
            wrap.state.landGestureLangDone = true;
            civGainLanguage(wrap.state, 1);
          }
          const traits = wrap.civ.traits||{};
          const comp = civComprehension(wrap.civ, wrap.state);

          // Reveal nearby nests and cave entrances on the current planet
          let revealed = 0;
          const pdata = G.planets?.[G.curPlanet];
          if(pdata?.grid && comp !== 'uncertain'){
            const px = G.player?.x ?? 0, py = G.player?.y ?? 0;
            const _W = PW(pdata), _H = PH(pdata);
            const revealRadius = 8;
            for(let dy = -revealRadius; dy <= revealRadius; dy++){
              for(let dx = -revealRadius; dx <= revealRadius; dx++){
                if(dx*dx+dy*dy > revealRadius*revealRadius) continue;
                const nx = px+dx, ny = py+dy;
                if(nx<0||ny<0||nx>=_W||ny>=_H) continue;
                const cell = pdata.grid[ny][nx];
                if(!cell) continue;
                if((cell.type==='NEST'||cell.type==='CAVE_NEST') && !cell.revealed){
                  cell.revealed = true;
                  revealed++;
                } else if(cell.type==='CAVE_ENTRANCE'){
                  const idx = ny*_W+nx;
                  if(pdata.explored && !pdata.explored[idx]){
                    if(!pdata.explored) pdata.explored = new Array(_W*_H).fill(false);
                    pdata.explored[idx] = true;
                    if(pdata.visited) pdata.visited[idx] = true;
                    revealed++;
                  }
                }
              }
            }
          }

          const revealNote = revealed > 0
            ? '\n\n' + (revealed === 1 ? 'One site nearby is now marked — a nest or cave entrance the crew would not have found without the gesture.' : revealed+' nearby sites have been revealed — nests and cave entrances the '+wrap.civ.species.toLowerCase()+' know well.')
            : '';

          if(comp==='uncertain') return 'The crew points at the land, then at the group, then at a distant ridge. Gesture meets gesture. Something is being communicated. What exactly is unclear.';
          if(wrap.civ.tier==='tribal'){
            if(traits.ritual==='animist') return 'They answer by naming the land through gesture: water, living groves, danger paths, and places the crew should not disturb. The map is practical and sacred at once.'+revealNote;
            if(traits.ritual==='ancestor') return 'They mark paths, then stop at the places where the dead are present. The crew learns routes, boundaries, and which ground must not be crossed casually.'+revealNote;
            if(traits.structure==='chieftain') return 'The local signs are given only after a ranking figure permits it. Once allowed, the information is precise: paths, watches, water, and forbidden ground.'+revealNote;
            if(traits.structure==='council') return 'Several voices build the answer together. One gives water, another danger, another the boundary line. The crew gets a communal map rather than a single guide.'+revealNote;
            return 'They respond with boundary signs, paths, and taboo ground. The crew\'s understanding of this territory has improved.'+revealNote;
          }
          if(traits.honor==='honor') return 'They respond with marked ground — a stick in the earth, a gesture to a border the crew cannot see but they clearly can. The information is exact.'+revealNote;
          if(traits.curiosity==='curious') return 'They answer with enthusiasm. Water, paths, danger — layers of local knowledge pouring through a gap in the language.'+revealNote;
          return 'They respond with path signs, direction, and something repeated that probably means danger. The crew\'s understanding of this territory has improved.'+revealNote;
        },
        options: ctx => [{label:'Continue',next:'root'}],
      },

      // ── SHOW OBJECT (curious primitives) ─────────────────────────────────
      pst_show_object: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'No response.';
          const traits = wrap.civ.traits||{};
          const gifts = alienGiftCandidates();
          if(!gifts.length) return 'Nothing on hand that would be meaningful to show.';
          // Show but don't give — prompts curiosity, costs nothing.
          // Language: one-time gain from seeing their reaction to the object.
          // No relation gain — showing is not giving.
          if(!wrap.state.showObjectLangDone){
            wrap.state.showObjectLangDone = true;
            civGainLanguage(wrap.state, 1);
          }
          if(traits.curiosity==='curious') return 'Something from the pack held up slowly, not offered. The reaction is immediate — heads tilt, they edge forward. The crew has their attention completely.';
          if(traits.curiosity==='isolated') return 'An object held out at arm\'s length. Two of them stop. One steps back. The reaction is mixed and that is useful information.';
          return 'Something shown slowly, at a distance. They are watching the object more than they are watching the crew.';
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          return [
            {label:'Now offer it',disabled:!canOfferAlienGift(),disabledReason:'nothing to offer',next:'gift_select'},
            {label:'Put it away',next:'root'},
          ];
        },
      },

      // ── HOLD GROUND (against territorial confrontation) ───────────────────
      pst_hold_ground: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'No response.';
          const prof = civContactScenarioProfile(wrap);
          const ok = Math.random() < (0.35 - (wrap.state.alert||0)*0.08 + (hasScientist()?0.05:0));
          wrap.state.alert = Math.min(5,(wrap.state.alert||0)+(ok?0:2));
          wrap.state.relation = Math.max(-5,(wrap.state.relation||0)+(ok?0:-1));
          if(!ok) civContactGoesHostile(wrap,'Crew refused to yield boundary');
          if(ok) civMaybeMarkContact(wrap,ctx,'boundary standoff — crew held');
          return ok
            ? 'The crew does not move. A long moment passes. They expected compliance and got stillness instead. The encounter resets — they are recalculating.\n\n'+prof.intimidateSuccess
            : 'Refusing to yield was read as a challenge. '+prof.intimidateFailure;
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap||wrap.state.hostile) return [{label:'Leave',action:'close'}];
          return [
            {label:'Now acknowledge their space',next:'territorial_accept_demand'},
            {label:'Offer something — break the standoff',disabled:!canOfferAlienGift(),disabledReason:'nothing',next:'gift_select'},
            {label:'Leave',action:'close'},
          ];
        },
      },

      // ── INFORMATION AGE LANDING-ZONE BREACH ──────────────────────────────
      info_landing_zone_breach: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'The crew moves away from the permitted zone.';
          civMaybeMarkContact(wrap,ctx,'landing-zone restriction challenged');
          activateCivilizationBoundaryPromise(wrap,ctx);
          const promise = wrap.state.boundaryPromise;
          if(promise?.mode === 'allowed_zone'){
            promise.warned = true;
            promise.warnedDist = (promise.radius || 4) + 1;
          }
          wrap.state.alert = Math.min(5,(wrap.state.alert||0)+2);
          wrap.state.relation = Math.max(-5,(wrap.state.relation||0)-1);
          civAddMemory(wrap,'landing_zone_breach','The crew chose to move away from the permitted landing zone during first contact.');
          return 'The crew moves away from the permitted landing zone. The response is immediate: cameras track the movement, radio traffic spikes, and the contact officer stops treating this as an introduction. This is now a compliance problem.\n\nThey have not opened fire, but the next step decides whether this becomes enforcement.';
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap||wrap.state.hostile) return [{label:'Leave',action:'close'}];
          return [
            {label:'Stop and comply with the landing-zone restriction',next:'territorial_accept_demand'},
            {label:'Transmit an explanation and request permission to move',next:'pst_formal_intro'},
            {label:'Keep walking away from the zone',next:'info_landing_zone_violate'},
            {label:civilizationThreatLabel('Show weapons and refuse the order','Raise bare fists and refuse the order'),next:'first_intimidate_attempt'},
          ];
        },
      },

      info_landing_zone_violate: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'The breach escalates.';
          const promise = wrap.state.boundaryPromise;
          if(promise){
            promise.broken = true;
            promise.active = false;
          }
          wrap.state.relation = Math.max(-5,(wrap.state.relation||0)-3);
          wrap.state.alert = 5;
          makeCivilizationHostile(wrap.pdata,'Crew left the permitted landing zone after warning');
          return 'The crew keeps walking. The interdiction becomes enforcement: sirens, hard commands, and armed responders moving to contain the away team. Whatever diplomatic opening existed is gone.';
        },
        options: [{label:'Leave',action:'close'}],
      },

      // ── TERRITORIAL DEMAND ────────────────────────────────────────────────
      territorial_accept_demand: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'The boundary is acknowledged.';
          const species = wrap.civ.species, tier = wrap.civ.tier;
          const traits = wrap.civ.traits||{};
          const vs = civVisitState(wrap);
          if(vs){ vs.noninterferenceDone=true; vs.greetSuccess=true; }
          civMaybeMarkContact(wrap,ctx,'territorial demand acknowledged');
          wrap.state.relation = Math.min(civDialogueRelationCap(wrap),(wrap.state.relation||0)+2);
          wrap.state.alert    = Math.max(1,(wrap.state.alert||0)-2);
          civGainLanguage(wrap.state, 1);
          activateCivilizationBoundaryPromise(wrap,ctx);
          civApplyPositiveMilestones(wrap, 'boundary');
          civAddMemory(wrap,'boundary_accepted','The crew stopped when asked. They filed that away.');
          const cap=(G.crew||[]).find(c=>c.role==='captain'&&c.hp>0);
          if(cap) giveSkillXP(cap,'soc',3);
          if(tier==='primitive'){
            if(traits.honor==='honor') return 'The crew stops and yields the ground visibly. The group holds. One of them — the one who moved first — makes a gesture the others respond to. Something formal just happened.';
            if(traits.diet==='carnivore') return 'The crew backs off. The hunters watch the retreat. Not warmly — but the challenge is over. They got what they wanted.';
            if(traits.social==='collective') return 'The crew yields. The group\'s decision seems to update collectively — postures relax across all of them at roughly the same moment.';
            return 'The crew steps back from the boundary. The '+species+' read the movement for what it is. The tension drops — not to nothing, but to something manageable.';
          }
          const lines = {
            tribal:    (()=>{ const t=traits; return t.structure==='chieftain'
              ? 'The crew yields in view of the chieftain. The order to hold is not withdrawn, but the challenge posture drops. The encounter is now under authority, not alarm.'
              : t.structure==='council'
              ? 'The crew yields and waits through the council\'s exchange. Several postures relax at once. The encounter has a shape now — cautious, shared, functional.'
              : t.ritual==='ancestor'
              ? 'The crew steps back from the ancestor-marked ground. The tension does not vanish, but the worst offence has been avoided.'
              : t.ritual==='animist'
              ? 'The crew yields the living boundary. The locals watch the space between crew and marker as much as the crew itself, then let the alarm drop.'
              : 'The crew yields the approach. The challenge posture drops. The encounter has a shape now — not friendly, but functional.'; })(),
            medieval:  'The crew stops and declares peaceful intent. The patrol holds position but no longer angles for confrontation.',
            industrial:'"Acknowledged. Withdrawing to compliant distance." The cordon stays but the energy changes.',
            information:'"Non-interference confirmed." The interdiction posture drops one level.',
          };
          return lines[tier] || 'The boundary is acknowledged. The tension does not disappear, but it drops.';
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          const tier = wrap?.civ?.tier;
          const tt = wrap?.civ?.traits || {};
          const opts = [];
          const intentLabel = ({
            primitive:'Ask what this territory means to them',
            tribal:tt.ritual==='ancestor' ? 'Ask about the ancestor markers'
              : tt.ritual==='animist' ? 'Ask what the living boundary means'
              : tt.structure==='council' ? 'Ask what the council requires'
              : 'Ask about the boundary markers',
            medieval:'Ask for the local terms of safe conduct',
            industrial:'Ask for quarantine and access rules',
            information:'Ask for the formal contact protocol',
          })[tier] || 'Ask what they require';
          const giftLabel = ({
            primitive:'Offer something — follow the yielding with a gesture',
            tribal:tt.ritual==='totem' ? 'Leave a gift at the totem line'
              : tt.ritual==='ancestor' ? 'Leave a gift before the ancestor markers'
              : 'Leave a gift at the boundary',
            medieval:'Offer goods through the envoy',
            industrial:'Offer trade goods for inspection',
            information:'Offer a sealed data packet',
          })[tier] || 'Offer something';
          const waitLabel = tier === 'information'
            ? 'Remain in the permitted zone and wait'
            : tier === 'industrial'
            ? 'Hold at compliant distance'
            : 'Watch them from this distance';
          opts.push({label:intentLabel,next:'intent'});
          opts.push({label:giftLabel,disabled:!canOfferAlienGift(),disabledReason:'nothing',next:'gift_select'});
          opts.push({label:waitLabel,next:'pst_patient'});
          opts.push({label:'Leave — the encounter is resolved',action:'close'});
          return opts;
        },
      },

      // ── FIRST BREAKOFF ────────────────────────────────────────────────────
      first_breakoff: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'The crew backs away.';
          const risk = civBreakOffRisk(wrap);
          if(Math.random() < risk){
            civContactGoesHostile(wrap,'Crew withdrawal interpreted as threat');
            return 'The attempt to leave is read wrong — retreat was not an option they were offering. The encounter has become something else.';
          }
          // Territorial civs assert a boundary even when the crew withdraws
          if(wrap.civ.aggression === 'Territorial' && !wrap.state.boundaryPromise?.active){
            activateCivilizationBoundaryPromise(wrap, G.dialogue?.context);
          }
          if(G.dialogue?.context) G.dialogue.context.resolved = true;
          wrap.state.nextProactiveContactTurn = (G.turn||1)+12;
          const isPrim = wrap.civ.tier==='primitive';
          civAddMemory(wrap,'crew_retreated','The crew walked away from first contact. They\'re not sure what to make of that.');
          if(isPrim){
            const traits=wrap.civ.traits||{};
            if(traits.curiosity==='curious') return 'The crew moves off. Two of the group follow to the edge of their range, watching, then stop. The encounter ended — but their interest did not.';
            if(traits.diet==='carnivore') return 'The crew backs away without turning around. The hunters do not follow. They watch until the crew is out of their effective range, then return to what they were doing.';
          }
          if(wrap.civ.aggression === 'Passive' && wrap.civ.tier === 'information'){
            return 'The crew holds position and does not press the contact. The local response remains procedural: cameras stay on, notices are logged, and no one escalates.';
          }
          if(wrap.civ.aggression === 'Passive' && wrap.civ.tier === 'industrial'){
            return 'The crew backs off to a compliant distance. The officials keep watching, but the moment is treated as resolved rather than hostile.';
          }
          const tier = wrap.civ.tier;
          const species = wrap.civ.species;
          if(tier === 'information') return 'The crew withdraws without incident. The contact record will note a non-hostile departure. That is the best outcome this situation offered.';
          if(tier === 'industrial') return 'The crew backs off. The cordon holds its position and watches. No one follows. The encounter ends as a note in a log somewhere.';
          if(tier === 'medieval') return 'The crew turns and walks. The patrol watches them go. No one calls after them — but the watchers on the walls do not move until the crew is out of range.';
          if(tier === 'tribal'){
            const t=wrap.civ.traits||{};
            if(t.structure==='chieftain') return 'The crew pulls back. The '+species+' keep their eyes on the chieftain until the order not to pursue is clear. The encounter ends, but under watch.';
            if(t.structure==='council') return 'The crew withdraws while the elders confer. No one follows; the decision to let them go seems collective and deliberate.';
            if(t.ritual==='ancestor') return 'The crew backs away from the ancestor-marked ground. The '+species+' hold position until distance restores the boundary.';
            if(t.ritual==='animist') return 'The crew leaves the living markers behind. The '+species+' do not follow, but they watch the crew\'s path as if checking what else was disturbed.';
            return 'The crew pulls back. The '+species+' hold their ground and track the movement until there is distance between them. The encounter ends without resolution.';
          }
          return 'The crew withdraws. They let it happen.';
        },
        options: [{label:'Leave',action:'close'}],
      },

      // ── INTIMIDATION PATH ─────────────────────────────────────────────────
      first_intimidate_attempt: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'The crew makes itself threatening.';
          return civIntimidationActionText(wrap);
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return [{label:'Leave',action:'close'}];
          return [
            {label:'Commit to the threat',check:{skill:'cbt',dc:civIntimidateDc(wrap)},success:'first_intimidate_success',fail:'first_intimidate_fail'},
            {label:'Back off — it was posturing',next:'pst_yield'},
          ];
        },
      },

      first_intimidate_success: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'The threat lands.';
          const prof = civContactScenarioProfile(wrap);
          const isPrim = wrap.civ.tier==='primitive';
          const traits = isPrim?(wrap.civ.traits||{}):{};
          civMaybeMarkContact(wrap,ctx,'successful intimidation');
          civAddMemory(wrap,'intimidated','The crew threatened them on first contact. It worked, but they noted it.');
          wrap.state.relation = Math.max(-5,(wrap.state.relation||0)-1);
          wrap.state.alert    = Math.min(5,(wrap.state.alert||0)+1);
          wrap.state.submission = Math.min(3,(wrap.state.submission||0)+1);
          const vs=civVisitState(wrap); if(vs) vs.intimidateDone=true;
          const merc=(G.crew||[]).filter(c=>c.hp>0).sort((a,b)=>(b.skills?.cbt||0)-(a.skills?.cbt||0))[0];
          if(merc) giveSkillXP(merc,'cbt',2);
          if(isPrim){
            if(traits.diet==='carnivore') return 'The crew signals force clearly. The hunters read it — not with fear, but with the recalculation of predators assessing another predator. They stand down. For now.';
            if(traits.social==='collective') return 'The display works on the group simultaneously. A collective decision to back down — made fast, without conferring. That is either respect or survival instinct.';
            if(traits.diet==='herbivore') return 'The show of force triggers the response it was designed to. The group backs away, keeping the crew in sight. The path is clear, but the memory is bad.';
            return prof.intimidateSuccess;
          }
          return prof.intimidateSuccess;
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap||wrap.state.hostile) return [{label:'Leave',action:'close'}];
          return [
            {label:'Demand something',next:'submission_tribute'},
            {label:'Step back — point made',next:'root'},
            {label:'Press harder',next:'hostile_menu'},
          ];
        },
      },

      first_intimidate_fail: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'The threat fails.';
          const prof = civContactScenarioProfile(wrap);
          const isPrim = wrap.civ.tier==='primitive';
          const traits = isPrim?(wrap.civ.traits||{}):{};
          civMaybeMarkContact(wrap,ctx,'failed intimidation');
          wrap.state.alert    = Math.min(5,(wrap.state.alert||0)+2);
          wrap.state.relation = Math.max(-5,(wrap.state.relation||0)-2);
          const isFail_terr = wrap.civ.aggression === 'Territorial';
          if(isFail_terr || Math.random()<civHostilityRisk(wrap)||(wrap.state.alert||0)>=5) civContactGoesHostile(wrap,'Intimidation escalated on first contact');
          if(isPrim){
            const hostile = wrap.state.hostile;
            if(traits.diet==='carnivore') return 'Threatening a predator group on first contact was the wrong read. They are not cowed by displays — they answer them. '+(hostile?'The group moves.':'The group has not moved. But the geometry of their formation just changed.');
            if(traits.social==='collective') return 'The collective does not break under an opening threat. The individual who might have yielded alone has the whole group behind them. '+(hostile?'They act as one.':'The window has shrunk significantly.');
            return hostile ? 'The threat decided the encounter. The group made its choice.'
                           : 'The threat misfires. The window is not closed, but it is very small now.'+'\n\n'+prof.greetFailure;
          }
          return wrap.state.hostile ? prof.intimidateFailure : prof.intimidateFailure+'\n\nRecovery is still possible but unlikely.';
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap||wrap.state.hostile) return [{label:'Leave',action:'close'}];
          return [
            {label:'Back off completely',next:'pst_yield'},
            {label:'Back off',next:'root'},
          ];
        },
      },

      // ── GIFT SYSTEM ───────────────────────────────────────────────────────
      gift_select: {
        text: ctx => {
          const wrap = dialogueCivilization();
          const isPrim = wrap?.civ?.tier==='primitive';
          const isBlind = wrap ? civIsBlind(wrap) : false;
          if(isPrim && isBlind) return 'What the crew offers says something about who they are. The group will read the object before they read any intent behind it.';
          if(isPrim) return 'Choose what to offer. To this group, the thing itself communicates more than the gesture.';
          return 'Objects can communicate where language fails. Choose something with clear material value.';
        },
        options: ctx => civilizationGiftDialogueOptions(),
      },

      gift_given: {
        text: ctx => {
          const wrap = dialogueCivilization();
          const name = ctx.offeredItemName || 'the object';
          if(!wrap) return 'The gift is received.';
          if(ctx.giftReactionText) return ctx.giftReactionText;
          if(wrap.civ.tier==='primitive'){
            return name+' is examined, then taken.';
          }
          if(wrap.civ.tier==='tribal'){
            const traits = wrap.civ.traits||{};
            if(traits.ritual==='totem') return name+' is taken directly to the nearest totem marker and held there briefly before the elder accepts it. The object has been introduced to the spirits before it belongs to anyone.';
            if(traits.ritual==='ancestor') return name+' is examined by the eldest figure first, held at eye level, then accepted. The ancestors are being consulted in some form — the gesture matters as much as the object.';
            if(traits.structure==='chieftain') return name+' goes to the chieftain\'s representative first. Nothing changes hands publicly without passing through that hierarchy.';
            if(traits.structure==='council') return name+' is passed between council members before anyone speaks. Collective acceptance — no single person commits without the group.';
            return name+' is passed between several hands before anyone responds. A quiet exchange runs through the group.';
          }
          if(wrap.civ.tier==='medieval'){
            const traits = wrap.civ.traits||{};
            if(traits.governance==='mercantile') return 'An official weighs '+name+' briefly in one hand and names a fair value aloud. These people know trade when they see it.';
            if(traits.disposition==='wary') return name+' is accepted at arm\'s length. A guard keeps eyes on the crew while it is examined. Trust is not implied by the receipt.';
            return name+' is accepted with a formal nod. It disappears into a satchel and the envoy waits for the next move.';
          }
          if(wrap.civ.tier==='industrial'){
            const traits = wrap.civ.traits||{};
            if(traits.economy==='cooperative') return name+' is logged and acknowledged. Someone on the team makes a notation. The gesture has been received as intended.';
            if(traits.bureaucracy==='strict') return 'The official accepts '+name+' but immediately photographs and catalogues it. Everything here generates a record.';
            return name+' is taken, turned over, scanned. The lead official nods once — acknowledgement, not warmth.';
          }
          if(wrap.civ.tier==='information'){
            const traits = wrap.civ.traits||{};
            if(traits.media==='transparent') return 'The contact officer accepts '+name+' and makes a point of noting the exchange in the open record. Transparent process. The crew has been documented as cooperative.';
            if(traits.policy==='restrictive') return name+' is accepted but immediately sequestered. Whatever the crew intended, the object has entered their intake system now.';
            return 'The contact officer scans '+name+' and logs it without ceremony. A quiet confirmation signal: the gesture was processed.';
          }
          return name+' is received.';
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return [{label:'Continue',next:'root'}];
          const opts = [];
          if(!wrap.state.hostile){
            opts.push({label:'Offer something else',disabled:!canOfferAlienGift(),disabledReason:'nothing to offer',next:'gift_select'});
          }
          opts.push({label:'Continue',next:'root'});
          return opts;
        },
      },

      // ── INTENT ────────────────────────────────────────────────────────────
      intent: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'No answer.';
          const vs = civVisitState(wrap);
          const count = vs?.askIntentCount||0;
          if(vs) vs.askIntentCount++;
          if(wrap.civ.tier==='primitive'){
            const traits = wrap.civ.traits||{};
            const comp = civComprehension(wrap.civ, wrap.state);
            return primWantText(wrap.civ.species, wrap.state, traits, comp);
          }
          if(isDelegationContact()){
            const tier=wrap.civ.tier;
            const tt=wrap.civ.traits||{};
            const first={
              tribal:tt.structure==='chieftain' ? '"You stand before the chieftain\'s ground. Say whether you come as guest, trader, or danger."'
                : tt.structure==='council' ? '"The council hears you. Say whether you come as guest, trader, or danger."'
                : tt.ritual==='ancestor' ? '"You walk near our named dead. Say why you are here."'
                : tt.ritual==='animist' ? '"You disturb living ground. Say whether you come with respect or hunger."'
                : '"You walk near our homes. Say whether you come as guest, trader, or danger."',
              medieval:'"State your banner, your law, and your business here."',
              industrial:'"Identify your party. Keep clear of infrastructure until authorization is established."',
              information:'"Formal contact protocol initiated. Confirm identity, biological risk profile, and non-interference intent."',
            };
            const follow={
              tribal:tt.ritual==='ancestor' ? '"Respect ancestor markers and the ground that remembers."'
                : tt.ritual==='animist' ? '"Respect living markers, water places, and sacred structures."'
                : tt.structure==='council' ? '"Wait when we confer. Do not force one voice to answer for all."'
                : '"Respect boundary markers and sacred structures."',
              medieval:'"The delegation can carry terms back, but they will not open trade while threatened."',
              industrial:'"They want a quarantine-safe contact record before any movement deeper."',
              information:'"They are classifying the crew: diplomatic, extractive, hazardous, or hostile."',
            };
            return (count>=1?follow:first)[tier]||(count>=1?follow.tribal:first.tribal);
          }
          return civWantText(wrap.civ, wrap.state);
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return [{label:'Back',next:'root'}];
          const opts = [];
          if(wrap.civ.tier==='primitive'){
            opts.push({label:'Offer something in response',disabled:!canOfferAlienGift(),disabledReason:'nothing',next:'gift_select'});
            opts.push({label:'Yield ground — show you understand',next:'territorial_accept_demand',disabled:wrap.civ.aggression!=='Territorial',condition:()=>wrap.civ.aggression==='Territorial'});
            opts.push({label:'Back',next:'root'});
            return opts.filter(o=>!o.disabled||o.disabledReason);
          }
          const nonInterferenceDc=({primitive:6,tribal:5,medieval:7,industrial:8,information:7}[wrap.civ.tier]||7);
          if(!civVisitState(wrap)?.noninterferenceDone){
            opts.push({label:'Promise not to interfere with their territory',check:{skill:'soc',dc:nonInterferenceDc},success:'noninterference_success',fail:'approach_fail'});
          }
          const vs = civVisitState(wrap);
          if(wrap && !vs?.tierRouteDone && !isLocalContact() && (vs?.studyCustomsDone||vs?.observeDone||(vs?.askIntentCount||0)>0)){
            opts.push({label:civTierRouteLabel(wrap.civ),check:{skill:'soc',dc:civTierRouteDc(wrap.civ)},success:'tier_route_success',fail:'tier_route_fail'});
          }
          opts.push({label:'Offer something',disabled:!canOfferAlienGift(),disabledReason:'nothing',next:'gift_select'});
          opts.push({label:'Back',next:'root'});
          return opts;
        },
      },

      // ── DE-ESCALATION ─────────────────────────────────────────────────────
      approach_fail: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'The attempt fails.';
          wrap.state.alert = Math.min(5,(wrap.state.alert||0)+1);
          wrap.state.relation = Math.max(-5,(wrap.state.relation||0)-1);
          if(Math.random()<civHostilityRisk(wrap)||(wrap.state.alert||0)>=5) civContactGoesHostile(wrap,'Failed approach');
          if(wrap.state.hostile) return civAlertDeescalateText(wrap.civ,wrap.state);
          return civAlertDeescalateText(wrap.civ,wrap.state)+'\n\nThe window is not closed, but it is smaller.';
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap||wrap.state.hostile) return [{label:'Leave',action:'close'}];
          const isPrim = wrap.civ.tier === 'primitive';
          const opts = [];
          // Immediate recovery gesture — contextual to the failure, not the full option tree
          opts.push({label: isPrim ? 'Go still — stop all movement' : 'Lower hands and hold position',check:{skill:'soc',dc:5},success:'deescalate_success',fail:'deescalate_fail'});
          opts.push({label:'Offer something immediately',disabled:!canOfferAlienGift(),disabledReason:'nothing',next:'gift_select'});
          opts.push({label:'Back away slowly',next:'root'});
          opts.push({label:civilizationAttackLabel(),action:'attack_civ',style:'danger'});
          return opts;
        },
      },

      deescalate: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'Nothing to de-escalate.';
          return civAlertDeescalateText(wrap.civ, wrap.state);
        },
        options: ctx => [
          {label:'Lower everything and be still',check:{skill:'soc',dc:5},success:'deescalate_success',fail:'deescalate_fail'},
          {label:'Offer something immediately',disabled:ctx=>!canOfferAlienGift(),disabledReason:'nothing',next:'gift_select'},
          {label:'Leave',action:'close'},
          {label:civilizationAttackLabel(),action:'attack_civ',style:'danger'},
        ],
      },

      deescalate_success: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'The tension drops.';
          const isPrim = wrap.civ.tier==='primitive';
          const traits = isPrim?(wrap.civ.traits||{}):{};
          wrap.state.alert    = Math.max(0,(wrap.state.alert||0)-2);
          wrap.state.relation = Math.min(civDialogueRelationCap(wrap),(wrap.state.relation||0)+1);
          const cap=(G.crew||[]).find(c=>c.role==='captain'&&c.hp>0);
          if(cap) giveSkillXP(cap,'soc',2);
          if(isPrim){
            if(traits.honor==='honor') return 'The crew stood down in a way they recognised as intentional. Something about the formality of it landed correctly.';
            if(traits.diet==='carnivore') return 'The display of non-aggression read correctly. The hunters remain watchful but the challenge posture is gone.';
            return 'The stillness was the right answer. The tension drops.';
          }
          return 'The gesture of de-escalation is understood. The encounter can continue.';
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return [{label:'Leave',action:'close'}];
          return civPostureOptions(wrap,ctx);
        },
      },

      deescalate_fail: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'The attempt fails.';
          wrap.state.alert = Math.min(5,(wrap.state.alert||0)+1);
          if(Math.random()<civHostilityRisk(wrap)||(wrap.state.alert||0)>=5) civContactGoesHostile(wrap,'De-escalation failed');
          if(wrap.state.hostile){
            const isPrim = wrap.civ.tier==='primitive';
            return isPrim ? 'The group made its decision. There is no more window.' : 'The gesture came too late or landed wrong. They have made their decision.';
          }
          return 'The gesture is misread. The alarm does not drop.';
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap||wrap.state.hostile) return [{label:'Leave',action:'close'}];
          return [{label:'Leave',action:'close'},{label:'Try again',next:'deescalate'}];
        },
      },

      // ── SCIENTIST / LANGUAGE ──────────────────────────────────────────────
      scientist_analyse: {
        text: ctx => {
          const wrap = dialogueCivilization();
          const sci = getCrewScientist();
          if(!wrap||!sci) return 'No scientist available.';
          const vs = civVisitState(wrap);
          if(vs?.languageAnalysisDone) return crewDisplayName(sci)+' has already mapped what can be mapped at this contact range.';
          if(vs) vs.languageAnalysisDone = true;
          maybeCivReport(wrap);
          civGainLanguage(wrap.state, 2);
          giveSkillXP(sci,'sci',3);
          const comp = civComprehension(wrap.civ,wrap.state);
          const tier = wrap.civ.tier;
          const result = {
            primitive: civCustomsStudyText(wrap.civ, wrap.state),
            tribal:    (()=>{ const t=wrap.civ.traits||{}; return t.structure==='chieftain'
              ? crewDisplayName(sci)+' identifies the authority pattern around the chieftain and the gestures that grant or withhold permission. Comprehension now: '+comp+'.'
              : t.structure==='council'
              ? crewDisplayName(sci)+' maps the council exchange: who speaks first, who confirms, and which pauses mean decision rather than confusion. Comprehension now: '+comp+'.'
              : t.ritual==='ancestor'
              ? crewDisplayName(sci)+' documents ancestor markers, forbidden approach lines, and the gestures used to acknowledge the dead. Comprehension now: '+comp+'.'
              : t.ritual==='animist'
              ? crewDisplayName(sci)+' documents living-place taboos, offering gestures, and boundary signs tied to water, stone, and trees. Comprehension now: '+comp+'.'
              : crewDisplayName(sci)+' documents totem sequence and boundary symbolism. Comprehension now: '+comp+'.'; })(),
            medieval:  crewDisplayName(sci)+' records the caste signals, trade tongue, and ceremonial calendar. Comprehension now: '+comp+'.',
            industrial:crewDisplayName(sci)+' analyses social hierarchy and operational language. Comprehension now: '+comp+'.',
            information:crewDisplayName(sci)+' cross-references '+wrap.civ.species+' data protocols with galactic standards. Comprehension now: '+comp+'.',
          }[tier]||crewDisplayName(sci)+' isolates recurring patterns. Comprehension now: '+comp+'.';
          addLog(crewDisplayName(sci)+' — language analysis complete. Comprehension: '+comp+'.','li');
          return result;
        },
        options: [{label:'Back',next:'root'}],
      },

      // ── ASK ABOUT CIVILIZATION ────────────────────────────────────────────
      ask_civilization: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'No answer comes.';
          const vs = civVisitState(wrap);
          if(vs) vs.askCivilizationDone = true;
          civGainLanguage(wrap.state, (hasScientist()?1:(Math.random()<0.35?1:0)));
          return civAskAboutCivilizationText(wrap);
        },
        options: ctx => {
          const wrap = dialogueCivilization();
          const opts = [];
          if(hasScientist()) opts.push({label:'Ask the scientist to go deeper',next:'scientist_analyse'});
          opts.push({label:'Share star positions',next:'share_knowledge',disabled:!hasScientist(),disabledReason:'no scientist'});
          opts.push({label:'Back',next:'root'});
          return opts;
        },
      },

      // ── SHARE KNOWLEDGE ───────────────────────────────────────────────────
      share_knowledge: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'No communication channel is open.';
          const vs = civVisitState(wrap);
          if(vs) vs.shareKnowledgeDone = true;
          civGalaxyShareReward(wrap.civ, wrap.state, wrap);
          if((wrap.state.relation||0) >= 1){
            const revealed = civRevealLocalKnowledge(wrap, wrap.civ.tier === 'information' || wrap.civ.tier === 'industrial' ? 'guidance' : 'basic');
            if(revealed) addLog('Their reciprocal knowledge maps '+revealed+' surface tiles.','lg');
          }
          civApplyPositiveMilestones(wrap, 'knowledge');
          civAddMemory(wrap,'knowledge_shared','The crew showed them where they came from. That changed something in how the group regards them.');
          return civShareKnowledgeText(wrap.civ, wrap.state);
        },
        options: [{label:'Continue',next:'root'}],
      },

      // ── NON-INTERFERENCE / TIER ROUTE ─────────────────────────────────────
      noninterference_success: {
        text: ctx => {
          const wrap = dialogueCivilization();
          if(!wrap) return 'The assurance is understood.';
          const vs=civVisitState(wrap); if(vs) vs.noninterferenceDone=true;
          if(!wrap.state.contacted){
            wrap.state.contacted=true;
            wrap.state.firstContactTurn=G.turn||1;
            trackPlanetDiscoveryOnce(ctx.planetKey||G.curPlanet,'civilization_contact','civilization_contacted',{biome:wrap.pdata.biome||'unknown',species:wrap.civ.species,tier:wrap.civ.tierLabel});
            addLog('First contact with '+wrap.civ.tierLabel.toLowerCase()+' '+wrap.civ.species.toLowerCase()+' — non-interference assurance.','ll');
          }
          const relGain = wrap.civ.tier === 'tribal' ? 2 : 1;
          wrap.state.relation = Math.min(civDialogueRelationCap(wrap),(wrap.state.relation||0)+relGain);
          wrap.state.alert    = Math.max(0,(wrap.state.alert||0)-(wrap.civ.tier==='primitive'?1:2));
          activateCivilizationBoundaryPromise(wrap,ctx);
          civApplyPositiveMilestones(wrap, 'noninterference');
          civAddMemory(wrap,'promised_noninterference','The crew promised to stay out of their territory. Whether they\'ll keep it is another matter.');
          const cap=(G.crew||[]).find(c=>c.role==='captain'&&c.hp>0);
          if(cap) giveSkillXP(cap,'soc',3);
          return ({
            primitive:'The promise lands through posture more than words. They read compliance from the crew\'s body, not a verbal agreement.',
            tribal:(()=>{ const t=wrap.civ.traits||{}; return t.structure==='chieftain'
              ? 'The non-interference promise gives the chieftain something enforceable: the crew will stay clear unless permitted. The authority structure can work with that.'
              : t.structure==='council'
              ? 'The non-interference promise gives the council a shared condition to accept: sacred ground, homes, and boundary markers will be respected.'
              : t.ritual==='ancestor'
              ? 'The promise fits their deepest concern: ancestor ground will not be crossed, touched, or treated as empty land.'
              : t.ritual==='animist'
              ? 'The promise fits their concern: living ground, water places, and boundary markers will be respected rather than studied by force.'
              : 'The non-interference promise fits their concern: sacred ground, homes, and boundary markers will be respected.'; })(),
            medieval:'The assurance sounds like a formal oath to them. The guards keep watching, but the exchange has a lawful shape now.',
            industrial:'The assurance is logged as a quarantine and non-interference statement. The exchange becomes calmer.',
            information:'The non-interference declaration satisfies the first protocol gate.',
          })[wrap.civ.tier]||'The assurance is understood. The boundary remains, but the fear lowers.';
        },
        options: ctx => {
          const wrap=dialogueCivilization();
          const opts=[];
          if(isSettlementContact()&&wrap?.state?.tradeUnlocked) opts.push({label:'Exchange goods',disabled:!hasScientist(),disabledReason:'need a scientist to broker exchange',next:'trade'});
          opts.push({label:'Continue',next:'root'});
          return opts;
        },
      },

      tier_route_success: {
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'The approach works.';
          const vs=civVisitState(wrap); if(vs) vs.tierRouteDone=true;
          if(!wrap.state.contacted){
            wrap.state.contacted=true;
            wrap.state.firstContactTurn=G.turn||1;
            trackPlanetDiscoveryOnce(ctx.planetKey||G.curPlanet,'civilization_contact','civilization_contacted',{biome:wrap.pdata.biome||'unknown',species:wrap.civ.species,tier:wrap.civ.tierLabel});
            addLog('First contact with '+wrap.civ.tierLabel.toLowerCase()+' '+wrap.civ.species.toLowerCase()+' — cultural approach.','ll');
          }
          wrap.state.relation=Math.min(civDialogueRelationCap(wrap),(wrap.state.relation||0)+2);
          wrap.state.alert   =Math.max(0,(wrap.state.alert||0)-2);
          civGainLanguage(wrap.state, 1);
          if(wrap.civ.tier === 'information') wrap.state.formalDocumentation = true;
          if(wrap.civ.tier === 'medieval'){
            wrap.state.tradeUnlocked = true;
            addLog('The formal approach earns standing — trade access granted.','lg');
          }
          const revealed = civRevealLocalKnowledge(wrap, wrap.civ.tier === 'information' ? 'permit' : 'guidance');
          if(revealed) addLog('The exchange clarifies '+revealed+' surface tiles.','lg');
          civApplyPositiveMilestones(wrap, 'cultural_approach');
          civAddMemory(wrap,'cultural_approach_success','The crew knew enough to do the right thing. That earned something.');
          const cap=(G.crew||[]).find(c=>c.role==='captain'&&c.hp>0);
          if(cap) giveSkillXP(cap,'soc',3);
          return civTierRouteText(wrap.civ,true);
        },
        options: ctx => {
          const wrap=dialogueCivilization();
          const opts=[{label:'Continue',next:'root'}];
          if(wrap?.state?.tradeUnlocked) opts.push({label:'Exchange goods',disabled:!hasScientist(),disabledReason:'no scientist',next:'trade'});
          return opts;
        },
      },

      tier_route_fail: {
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'The approach fails.';
          wrap.state.alert   =Math.min(5,(wrap.state.alert||0)+1);
          wrap.state.relation=Math.max(-5,(wrap.state.relation||0)-1);
          if(Math.random()<civHostilityRisk(wrap)||(wrap.state.alert||0)>=5) civContactGoesHostile(wrap,'Cultural approach failed');
          return civTierRouteText(wrap.civ,false)+(wrap.state.hostile?'\n\nThe failure decided the encounter.':'\n\nRecovery is still possible.');
        },
        options: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap||wrap.state.hostile) return [{label:'Leave',action:'close'}];
          return [
            {label:'De-escalate',next:'deescalate'},
            {label:'Offer something',disabled:!canOfferAlienGift(),disabledReason:'nothing',next:'gift_select'},
            {label:'Leave',action:'close'},
          ];
        },
      },

      // ── POSITIVE RELATION UNLOCKS ─────────────────────────────────────────
      positive_guidance: {
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'No guidance comes.';
          return civPositiveGuidanceText(wrap);
        },
        options: ctx => {
          const wrap=dialogueCivilization();
          const opts=[{label:'Continue',next:'root'}];
          if(wrap?.state?.safeConductUnlocked && !wrap?.state?.permitGranted && ['medieval','industrial','information'].includes(wrap.civ.tier)){
            opts.push({label:wrap.civ.tier === 'information' ? 'Request visitor clearance' : wrap.civ.tier === 'industrial' ? 'Request access corridor' : 'Request safe conduct', next:'positive_permit'});
          }
          if(wrap?.state?.permitGranted && wrap?.state?.boundaryPromise?.active && !wrap?.state?.boundaryLifted && (wrap?.state?.relation||0) >= 8){
            opts.push({label:wrap.civ.tier === 'information' ? 'Request full freedom of movement' : wrap.civ.tier === 'industrial' ? 'Request full access — no perimeter' : 'Ask for the restriction to be lifted entirely', next:'boundary_lift_attempt'});
          }
          return opts;
        },
      },

      positive_permit: {
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'No permission is granted.';
          return civPermitText(wrap);
        },
        options: ctx => {
          const wrap=dialogueCivilization();
          const opts=[{label:'Continue',next:'root'}];
          if(wrap?.state?.tradeUnlocked) opts.push({label:'Exchange goods',disabled:!hasScientist(),disabledReason:'no scientist',next:'trade'});
          return opts;
        },
      },

      // ── BOUNDARY LIFT ─────────────────────────────────────────────────────
      boundary_lift_attempt: {
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'No response.';
          const tier=wrap.civ.tier, species=wrap.civ.species.toLowerCase();
          const t={
            medieval:'The crew states plainly what they want: the restriction lifted, movement without a guard, access to the settlement on the same terms as any other traveller. The envoy listens. This is not a standard request.',
            industrial:'The crew makes a formal request to have the quarantine perimeter removed. The official notes it without expression. This requires authorisation at a level above this conversation.',
            information:'The crew submits a request to have the designated contact area restriction lifted — full freedom of movement in exchange for the trust the relationship has built. The contact officer reviews the record before answering.',
          };
          return (t[tier]||'The crew asks for the restriction to be dropped entirely. The request lands in the air between both parties.')+'\n\nThis is a social check — the captain makes the case.';
        },
        options: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return [{label:'Back',next:'root'}];
          const dc=wrap.civ.aggression==='Territorial'?16:wrap.civ.tier==='information'?14:12;
          return [
            {label:'Make the case for full access',check:{skill:'soc',dc},success:'boundary_lift_success',fail:'boundary_lift_fail'},
            {label:'Leave it — not worth the risk',next:'root'},
          ];
        },
      },

      boundary_lift_success: {
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'The restriction is lifted.';
          const state=wrap.state, civ=wrap.civ;
          const promise=state.boundaryPromise;
          if(promise) promise.active=false;
          state.boundaryLifted=true;
          state.relation=Math.min(10,(state.relation||0)+1);
          state.alert=Math.max(0,(state.alert||0)-1);
          civAddMemory(wrap,'boundary_lifted','The crew asked for the restriction to be lifted, and earned it. That is a different kind of standing.');
          civApplyPositiveMilestones(wrap,'boundary_lift');
          const cap=(G.crew||[]).find(c=>c.role==='captain'&&c.hp>0);
          if(cap) giveSkillXP(cap,'soc',4);
          const t={
            medieval:'The envoy nods once — a formal concession. The escort is withdrawn. The crew may move as recognised guests, not watched strangers. This kind of standing takes most visitors years to earn.',
            industrial:'The official signs off on the removal. A note is added to the crew\'s file: unrestricted access, trusted visitor status. The perimeter no longer applies. Whatever the crew does here now, it is on record as done freely.',
            information:'The contact officer issues the update. Restriction lifted, full access logged. The crew\'s record here now reads as trusted — not cleared for everything, but no longer confined to a zone. That is not a status they give lightly.',
          };
          addLog('Boundary restriction fully lifted — the crew has earned trusted visitor status.','lg');
          return (t[civ.tier]||'The restriction is lifted. The crew may move freely.');
        },
        options: ctx => [{label:'Continue',next:'root'}],
      },

      boundary_lift_fail: {
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'The request is denied.';
          const civ=wrap.civ, state=wrap.state;
          state.alert=Math.min(5,(state.alert||0)+1);
          const t={
            medieval:'The envoy listens to the end and then declines. The tone is not hostile — but it is final. The existing arrangement is what they will offer. Pressing further would be a different kind of conversation.',
            industrial:'The official shakes their head. The request has been noted and denied. The current access corridor remains. Pushing this further would require channels the crew does not currently have.',
            information:'The contact officer reviews the request and issues a denial. The crew\'s record is good — but not yet sufficient for unrestricted access. The designated contact area remains in effect.',
          };
          addLog('Full boundary lift denied. The partial access arrangement still holds.','li');
          return (t[civ.tier]||'The request is considered and refused. The existing arrangement stands.');
        },
        options: ctx => [{label:'Continue',next:'root'}],
      },

      // ── AID ───────────────────────────────────────────────────────────────
      aid: {
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'No aid comes.';
          return civAidText(wrap.civ, wrap.state);
        },
        options: ctx => {
          const wrap=dialogueCivilization();
          const opts=[];
          if(wrap?.state?.aidGiven) opts.push({label:'Acknowledge the help',next:'thanks'});
          opts.push({label:'Back',next:'root'});
          return opts;
        },
      },

      thanks: {
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'The gesture lands.';
          wrap.state.relation=Math.min(civDialogueRelationCap(wrap),(wrap.state.relation||0)+1);
          civApplyPositiveMilestones(wrap, 'thanks');
          civAddMemory(wrap,'crew_thanked','The crew acknowledged the help. Small thing. Remembered.');
          return 'The gratitude is understood well enough. The exchange closes without hostility.';
        },
        options: [{label:'Continue',next:'root'}],
      },

      // ── TRADE ─────────────────────────────────────────────────────────────
      trade: {
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'No trade channel open.';
          if(wrap.state.hostile) return 'They will not exchange anything now.';
          if(!hasScientist()) return 'A scientist is needed to bridge the exchange. Without one, neither side can establish what is being offered.';
          if((wrap.state.relation||0)<2) return 'The trust needed for exchange has not been established yet. More time, or a gesture, would change that.';
          wrap.state.tradeUnlocked=true;
          return crewDisplayName(getCrewScientist())+' structures a basic exchange. They will give something for something of equivalent value to them.';
        },
        options: [
          {label:'Open barter screen',disabled:ctx=>{const w=dialogueCivilization();return !w||w.state.hostile||!hasScientist()||(w.state.relation||0)<2;},disabledReason:'not available',action:'open_barter'},
          {label:'Back',next:'root'},
        ],
      },

      // ── HOSTILE OPTIONS ───────────────────────────────────────────────────
      hostile_menu: {
        repeatable:true,
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'Nothing here.';
          const sub=wrap?.state?.submission||0;
          const tier = wrap?.civ?.tier;
          const species = wrap?.civ?.species || 'locals';
          const isPrim = tier === 'primitive';
          if(sub>=2) return 'They are cowed. Not allies — calculating what submission costs compared with open violence.';
          if(sub===1) return 'They have been shaken. More pressure may force tribute, but each step risks turning fear into organised resistance.';
          const opening = isPrim
            ? 'The '+species+' have not moved. They are reading the crew the way the crew is reading them — watching for the first committed action.'
            : ({
                tribal:    (()=>{ const t=wrap.civ.traits||{}; return t.structure==='chieftain'
                  ? 'The '+species+' figures hold their ground around the chieftain\'s authority. Whatever happens next will be seen by everyone.'
                  : t.structure==='council'
                  ? 'The '+species+' figures hold their ground after a brief exchange among elders. Whatever happens next is a collective decision.'
                  : t.ritual==='ancestor'
                  ? 'The '+species+' figures hold their ground before the ancestor markers. The crew is no longer just threatening people; it is threatening memory.'
                  : 'The '+species+' figures hold their ground. Whatever is about to happen, they have decided to see it through.'; })(),
                medieval:  'The guards have closed up their formation. They are not panicking — they are waiting.',
                industrial:'"This is your final opportunity to comply." They mean it.',
                information:'All sub-vocal traffic has stopped. The contact team is now fully focused on the crew.',
              }[tier] || 'They are still here. Still watching.');
          return opening;
        },
        options: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return [{label:'Back',next:'root'}];
          const sub=wrap?.state?.submission||0;
          const opts=[
            {label:civilizationThreatLabel('Threaten them','Threaten them with bare fists'),check:{skill:'cbt',dc:civIntimidateDc(wrap)},success:'settlement_intimidate_success',fail:'settlement_intimidate_fail'},
          ];
          if(sub>=1) opts.push({label:'Demand tribute',next:'submission_tribute'});
          if(sub>=2) opts.push({label:'Take what you want',next:'submission_loot'});
          // Loot options only make sense for settlement contacts, not locals who are actively fighting
          if(!isLocalContact()){
            if(wrap.state.hostileResponse === 'flee'){
              const siteKey = 'site_'+ctx.x+'_'+ctx.y;
              const siteTaken = wrap.state.siteLoot?.[siteKey]?.taken;
              if(!siteTaken) opts.push({label:'Take what\'s left behind',next:'loot_abandoned_settlement'});
            } else {
              opts.push({label:'Take from them by force',next:'loot_settlement'});
            }
          }
          opts.push({label:'Back',next:'root'});
          return opts;
        },
      },

      settlement_intimidate_success: {
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'The threat lands.';
          const prof=civContactScenarioProfile(wrap);
          const action=civIntimidationActionText(wrap);
          const sub=wrap.state.submission||0;
          const isPrim=wrap.civ.tier==='primitive';
          const traits=isPrim?(wrap.civ.traits||{}):{};
          wrap.state.submission=Math.min(3,(wrap.state.submission||0)+1);
          wrap.state.relation=Math.max(-5,(wrap.state.relation||0)-1);
          wrap.state.alert=Math.min(5,(wrap.state.alert||0)+1);
          civAddMemory(wrap,'intimidated','The crew threatened them. It worked — at a cost.');
          // Primitive: trait-differentiated success narration
          if(isPrim && sub===0){
            if(traits.diet==='carnivore') return action+'\n\nThe hunters read it. Not submission — recalculation. They do not scatter or cower. They hold position and reassess whether the cost of pressing this is worth it. That is a different kind of leverage.';
            if(traits.social==='collective') return action+'\n\nThe decision passes through the group visibly. No one individual submits — the collective decides to stand down. That means it could be reversed just as quickly.';
            if(traits.honor==='honor') return action+'\n\nSomething in them refuses to read this as shame. They comply, but the posture says they are recording the debt.';
            return action+'\n\nThe threat lands. They pull back. Not in panic — in the controlled retreat of a group that is choosing its moment.';
          }
          if(sub>=2) return action+'\n\nAlready cowed. Further pressure only deepens resentment. The leverage exists.\n\n'+prof.submission;
          return action+'\n\n'+(sub>=1?'The second show breaks their posture.':'The threat lands. Fear creates leverage.')+'\n\n'+prof.submission;
        },
        options: ctx => [
          {label:'Demand tribute',next:'submission_tribute'},
          {label:'Back to pressure',next:'hostile_menu'},
          {label:'Step back',next:'root'},
        ],
      },

      settlement_intimidate_fail: {
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'The threat fails.';
          const prof=civContactScenarioProfile(wrap);
          const action=civIntimidationActionText(wrap);
          const isPrim=wrap.civ.tier==='primitive';
          const traits=isPrim?(wrap.civ.traits||{}):{};
          wrap.state.alert=Math.min(5,(wrap.state.alert||0)+2);
          wrap.state.relation=Math.max(-5,(wrap.state.relation||0)-1);
          const goHostile = wrap.civ.aggression === 'Territorial' || Math.random()<(0.35 + (wrap.civ.aggression==='Territorial'?0.65:0)) || (wrap.state.alert||0)>=5;
          if(goHostile) civContactGoesHostile(wrap,'Intimidation resisted');
          // Primitive: trait-differentiated failure narration
          let result='';
          if(isPrim){
            if(traits.diet==='carnivore'){
              result=action+'\n\nThe wrong read. Hunters do not submit to threat displays from outside the group — they answer them. The group tightens formation and someone steps forward.';
              result+=goHostile ? '\n\nThe encounter becomes a fight.' : '\n\n'+prof.intimidateFailure;
            } else if(traits.social==='collective'){
              result=action+'\n\nThe threat emboldens the group rather than splitting it. The individual who might have backed down alone does not, because everyone behind them is watching. Collective courage.';
              result+=goHostile ? '\n\nThe encounter becomes a fight.' : '\n\n'+prof.intimidateFailure;
            } else if(traits.honor==='honor'){
              result=action+'\n\nThe display is read as a deliberate insult — not just a threat, but a statement that they are not worth proper consideration. The reaction is not fear. It is something colder.';
              result+=goHostile ? '\n\nThe encounter becomes a fight.' : '\n\n'+prof.intimidateFailure;
            } else {
              result=action+'\n\nThe threat does not land the way it was meant to. The group does not submit — they simply stop cooperating.';
              result+=goHostile ? '\n\nThe encounter becomes a fight.' : '\n\n'+prof.intimidateFailure;
            }
          } else {
            result=goHostile
              ? action+'\n\nThey tighten ranks, watching with colder discipline.\n\n'+prof.intimidateFailure
              : action+'\n\n'+(civilizationHostileResponse(wrap.civ)==='flee'
                  ?'The push breaks them into flight, not submission.'
                  :'The push fails. It gives them a purpose.')+'\n\n'+prof.intimidateFailure;
          }
          return result;
        },
        options: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap||wrap.state.hostile) return [{label:'Leave',action:'close'}];
          return [{label:'Back to pressure',next:'hostile_menu'},{label:'Back off',next:'root'}];
        },
      },

      submission_tribute: {
        repeatable:true,
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'No tribute offered.';
          if((wrap.state.submission||0)<1) return 'They have not been pressured enough to yield tribute.';
          // Territorial civs resist tribute demands — they defend, not concede
          if(wrap.civ.aggression === 'Territorial'){
            wrap.state.alert = Math.min(5,(wrap.state.alert||0)+2);
            wrap.state.relation = Math.max(-5,(wrap.state.relation||0)-2);
            civContactGoesHostile(wrap,'Territorial civ refused tribute demand');
            return 'The demand is met with a flat refusal. Territorial civs do not yield goods under threat — they treat the demand as a declaration of intent and respond accordingly. The encounter becomes a fight.';
          }
          wrap.state.pendingTribute = null;
          // Tribute is repeatable but each time increases chance of resistance
          const tributeCount = wrap.state.tributeCount || 0;
          wrap.state.tributeCount = tributeCount + 1;
          // After 2+ tributes, escalating resistance chance
          if(tributeCount >= 2 && Math.random() < 0.35){
            wrap.state.alert = Math.min(5,(wrap.state.alert||0)+2);
            wrap.state.relation = Math.max(-5,(wrap.state.relation||0)-2);
            if((wrap.state.alert||0)>=5) makeCivilizationHostile(wrap.pdata,'Repeated demands provoked resistance');
            if(wrap.state.hostile) return 'The demand again — this time they refuse. They have calculated that resistance costs less than continued compliance.';
            return 'The demand again. They comply, but the calculation is visible. This is the last time this will work easily.';
          }
          const item=prepareCivilizationTribute(wrap);
          wrap.state.relation=Math.max(-5,(wrap.state.relation||0)-1);
          wrap.state.alert=Math.min(5,(wrap.state.alert||0)+1);
          const note = tributeCount >= 1 ? ' Again. They produce it without expression.' : ' Not trade. The price of avoiding escalation.';
          return 'Under pressure, they produce '+(item?.name||'a local offering')+'.'+note;
        },
        options: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap||wrap.state.hostile) return [{label:'Back',next:'root'}];
          const opts=[];
          if(wrap.state.pendingTribute){
            opts.push({label:'Take it',effect:acceptCivilizationTribute,next:'hostile_menu'});
            opts.push({label:'Leave it — back off',effect:ctx=>{ const w=dialogueCivilization(); if(w?.state) w.state.pendingTribute=null; },next:'hostile_menu'});
          } else {
            opts.push({label:'Back to pressure',next:'hostile_menu'});
            opts.push({label:'Back off',next:'root'});
          }
          return opts;
        },
      },

      submission_loot: {
        repeatable:true,
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'Nothing yielded.';
          if((wrap.state.submission||0)<2) return 'They are frightened, but not enough to stand aside while the crew takes freely.';
          const item=awardCivilizationLoot(wrap,'Loot taken from a subdued group');
          wrap.state.relation=Math.max(-5,(wrap.state.relation||0)-2);
          wrap.state.alert=Math.min(5,(wrap.state.alert||0)+1);
          const noItem = !item;
          return noItem
            ? 'They stand aside, but there is nothing left worth taking here. The place has been stripped.'
            : 'They stand aside while the crew takes '+item.name+'. The silence is not consent. It is calculation.';
        },
        options: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap||wrap.state.hostile) return [{label:'Leave',action:'close'}];
          return [{label:'Take more',next:'submission_loot'},{label:'Back',next:'hostile_menu'},{label:'Leave',action:'close'}];
        },
      },

      loot_abandoned_settlement: {
        repeatable:true,
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'Nothing here.';
          if(wrap.state.hostileResponse!=='flee') return 'They have not fled. Taking freely now means forcing the issue.';
          // Per-site loot tracking using dialogue context coords
          const siteKey = 'site_'+ctx.x+'_'+ctx.y;
          if(!wrap.state.siteLoot) wrap.state.siteLoot = {};
          const siteLoot = wrap.state.siteLoot[siteKey] || { taken:false, lootCount:0 };
          const item=awardCivilizationLoot(wrap,'Taken from an abandoned area');
          if(!siteLoot.taken){
            ruinCivilizationSettlement(wrap.pdata,{x:ctx?.x,y:ctx?.y},'abandoned and looted');
            siteLoot.taken=true;
          }
          siteLoot.lootCount = (siteLoot.lootCount||0) + 1;
          wrap.state.siteLoot[siteKey] = siteLoot;
          return 'No one stops the crew. The place is hollow — tools dropped, fire cold, signs of fast departure. The crew takes '+(item?.name||'local goods')+'.';
        },
        options: ctx => {
          const wrap=dialogueCivilization();
          const opts=[];
          const siteKey = 'site_'+ctx.x+'_'+ctx.y;
          const siteLootCount = wrap?.state?.siteLoot?.[siteKey]?.lootCount || 0;
          if(wrap && siteLootCount < 4) opts.push({label:'Search further',next:'loot_abandoned_settlement'});
          opts.push({label:'Leave',action:'close'});
          return opts;
        },
      },

      loot_settlement: {
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'Nothing here to take.';
          const state=wrap.state, tier=wrap.civ.tier;
          const traits=tier==='primitive'?primTraits(wrap):null;
          const primLine=traits
            ?(traits.social==='collective'?'The crew takes objects. The group watches together, deciding together.'
             :traits.honor==='honor'?'Objects taken from the camp. The group understands exactly what this is.'
             :traits.diet==='carnivore'?'The crew lifts items. The hunters watch with predator stillness. Cataloguing.'
             :'The crew moves through, taking what it finds. Silence from the group.')
            :'The crew moves through, taking what it finds.';
          const lines={
            primitive:primLine,
            tribal:(()=>{ const t=wrap.civ.traits||{}; return t.structure==='clan'
              ? 'Items taken from clan spaces. Different groups track the crew\'s movements, and each theft lands somewhere specific.'
              : t.ritual==='ancestor'
              ? 'Items taken near memory-marked ground. The locals track every movement with cold attention.'
              : t.ritual==='totem'
              ? 'Items taken from around totem-marked spaces. The locals track every movement.'
              : 'Items taken from unguarded spots. The locals track every movement.'; })(),
            medieval:'The crew helps itself to goods. Stall-holders step back, hands near weapons.',
            industrial:'Equipment taken from storage. Workers radio immediately.',
            information:'Hardware removed. Alarms in two adjacent buildings.',
          };
          addLog('Looting.','lw');
          wrap.state.relation=Math.max(-5,(state.relation||0)-2);
          wrap.state.alert=Math.min(5,(state.alert||0)+2);
          awardCivilizationLoot(wrap,'Loot taken');
          if((wrap.state.alert||0)>=5) makeCivilizationHostile(wrap.pdata,'Responding to looting');
          if(wrap.state.hostile) return tier==='primitive'?'The looting breaks the encounter. They respond.':'The looting crosses the line. They respond.';
          return (lines[tier]||lines.tribal)+(tier!=='primitive'?' The crew leaves with something.':'');
        },
        options: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap||wrap.state.hostile) return [{label:'Leave',action:'close'}];
          const opts=[];
          const siteKey = 'site_'+ctx.x+'_'+ctx.y;
          const siteLootCount = wrap.state.siteLoot?.[siteKey]?.lootCount || 0;
          const depleted = siteLootCount >= 4;
          if(!depleted && (wrap.state.alert||0)<5) opts.push({label:'Take more',next:'loot_settlement'});
          // Ruin option available when loot is depleted (non-primitive tiers have structures to wreck)
          if(depleted && wrap.civ.tier !== 'primitive') opts.push({label:'Tear the place apart',next:'ruin_settlement',style:'danger'});
          opts.push({label:'Leave with what you have',action:'close'});
          return opts;
        },
      },

      // ── RUIN SETTLEMENT ──────────────────────────────────────────────────────
      ruin_settlement: {
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'Nothing left to destroy.';
          if(wrap.civ.tier === 'primitive') return 'There are no permanent structures here to wreck.';
          const ruined = ruinCivilizationSettlement(wrap.pdata,{x:ctx?.x,y:ctx?.y},'wrecked by the away team');
          wrap.state.relation = Math.max(-5,(wrap.state.relation||0)-2);
          // Trigger respawn slowdown — settlement partially destroyed resets respawn timer forward
          if(wrap.state.nextDefenderRespawn){
            const interval = CIV_DEFENDER_RESPAWN_INTERVAL[wrap.civ.tier] || 30;
            wrap.state.nextDefenderRespawn = (G.turn||0) + interval * 2;
          }
          const lines = {
            tribal:    (()=>{ const t=wrap.civ.traits||{}; return t.ritual==='ancestor'
              ? 'The crew tears through the settlement — ancestor markers damaged, shelters collapsed, fire pits scattered. What took generations is gone in minutes.'
              : t.ritual==='animist'
              ? 'The crew tears through the settlement — offering places broken, shelters collapsed, living markers trampled. The damage is practical and sacred at once.'
              : t.structure==='clan'
              ? 'The crew tears through clan spaces — shelters collapsed, markers broken, fire pits scattered. The harm will travel through every kin line.'
              : 'The crew tears through the settlement — totems knocked over, shelters collapsed, fire pits scattered. What took generations is gone in minutes.'; })(),
            medieval:  'Market stalls are smashed, doors kicked in, stores overturned. The settlement will not forget this.',
            industrial:'Machinery is wrecked, cabling stripped, storage trashed. Repairable — eventually — but not quickly.',
            information:'Server racks pulled, terminals smashed, power lines severed. An information-age settlement can hurt when it recovers.',
          };
          return ruined
            ? (lines[wrap.civ.tier] || 'The crew leaves a trail of destruction through the settlement.')
            : 'The crew makes the attempt, but the structures resist. Whoever built this built it to last.';
        },
        options: ctx => [{label:'Leave',action:'close'}],
      },

      // ── MISC CARRY-OVER ───────────────────────────────────────────────────
      local_observe: {
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'No one there.';
          const vs=civVisitState(wrap); if(vs) vs.observeDone=true;
          if(wrap.civ.tier==='primitive') return primObserveText(wrap.civ.species,wrap.state,wrap.civ.traits||{},true);
          return civObserveText(wrap.civ);
        },
        options: ctx => {
          const wrap=dialogueCivilization();
          return [
            {label:'Approach — open hands',next:'pst_approach_open'},
            {label:'Back',next:'root'},
          ];
        },
      },

      local_ask: {
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'No answer.';
          civGainLanguage(wrap.state, 1);
          const isPrim=wrap.civ.tier==='primitive';
          if(isPrim){
            const traits=wrap.civ.traits||{};
            const comp=civComprehension(wrap.civ,wrap.state);
            if(comp==='uncertain') return 'Fragments: a direction, a sound repeated twice, a gesture toward something the crew cannot see. Useful only to someone who already knows this terrain.';
            if(traits.curiosity==='curious') return 'They answer with enthusiasm: paths, water, danger signs, and what the crew thinks is a warning about something to the east.';
            return 'The local answers in fragments: paths, danger signs, where not to step, who watches from nearby.';
          }
          return 'The local answers in fragments: paths, danger signs, where not to step, who watches from the settlement. It is not diplomacy, but it is useful.';
        },
        options: ctx => [
          {label:'Offer something',disabled:!canOfferAlienGift(),disabledReason:'nothing',next:'gift_select'},
          {label:'Back',next:'root'},
        ],
      },

      study_customs: {
        text: ctx => {
          const wrap=dialogueCivilization();
          if(!wrap) return 'Nothing to study.';
          const vs=civVisitState(wrap); if(vs) vs.studyCustomsDone=true;
          return civCustomsStudyText(wrap.civ, wrap.state);
        },
        options: [{label:'Back',next:'pst_observe'}],
      },
    },
  },
  alien_contact: {
    title: ctx => 'Contact: '+(dialogueAlien()?.name || 'Unknown Creature'),
    subtitle: ctx => {
      const e = dialogueAlien();
      return (e?.commMethod || 'Unknown channel')+' · attitude '+(e?.attitude || 'unknown');
    },
    start: 'root',
    nodes: {
      root: {
        text: ctx => {
          const e = dialogueAlien();
          return '"'+(e?.commGreeting || 'Signal received.')+'"';
        },
        options: [
          { label:'Greet calmly', check:{ skill:'soc', dc:5 }, success:'greet_success', fail:'greet_fail' },
          { label:'Ask what it wants', next:'intent' },
          { label:'Intimidate', check:{ skill:'cbt', dc:6 }, success:'intimidate_success', fail:'intimidate_fail' },
          { label:'Leave it alone', action:'close' },
        ],
      },
      greet_success: {
        text: ctx => '"Signal pattern accepted. Threat response lowering."',
        onEnter: ctx => {
          const e = dialogueAlien();
          if(e){
            e.attitude = 'Cautious';
            e.intent = 'Keeping distance while watching the crew';
            e.currentlyHostile = false;
            e.hostileByDefault = false;
            e.pacifiedByComm = true;
            e.commBoundaryDist = 2;
          }
        },
        options: [
          { label:'Ask what it wants', next:'intent' },
          { label:'End contact', action:'close' },
        ],
      },
      greet_fail: {
        text: ctx => '"Noise. Heat. Teeth. Unknown command shape."',
        onEnter: ctx => {
          const e = dialogueAlien();
          if(e){ e.attitude = 'Agitated'; e.intent = 'Trying to decide if retreat or attack is safer'; }
        },
        options: [
          { label:'Leave', action:'close' },
          { label:'Try again calmly', check:{ skill:'soc', dc:7 }, success:'greet_success', fail:'greet_fail' },
        ],
      },
      intent: {
        text: ctx => {
          const e = dialogueAlien();
          return '"'+(e?.commNeed || 'Keep distance. Watch. Do not corner.')+'"';
        },
        options: [
          { label:'Offer no threat', next:'peace' },
          { label:'Try to barter', next:'barter' },
          { label:'End contact', action:'close' },
        ],
      },
      barter: {
        text: ctx => '"Trade shape unclear. Credits not recognized. Object exchange possible."',
        options: [
          { label:'Offer a gift', disabled:ctx=>!canOfferAlienGift(), disabledReason:'nothing suitable', next:'gift_select' },
          { label:'Ask what it wants', next:'intent' },
          { label:'Back', next:'root' },
        ],
      },
      gift_select: {
        text: ctx => '"Exchange channel open. Object selection awaited."',
        options: ctx => alienGiftDialogueOptions(),
      },
      gift_given: {
        text: ctx => '"Object received. Threat pattern reduced. Exchange remembered."',
        options: [
          { label:'Ask what it wants', next:'intent' },
          { label:'End contact', action:'close' },
        ],
      },
      peace: {
        text: ctx => '"Distance understood. No hunt. No chase."',
        onEnter: ctx => {
          const e = dialogueAlien();
          if(e){
            e.attitude = 'Wary';
            e.intent = 'Keeping distance while monitoring the crew';
            e.currentlyHostile = false;
            e.hostileByDefault = false;
            e.pacifiedByComm = true;
            e.commBoundaryDist = 2;
          }
        },
        options: [
          { label:'Ask what it wants', next:'intent' },
          { label:'End contact', action:'close' },
        ],
      },
      intimidate_success: {
        text: ctx => '"Threat shape understood. Distance increasing."',
        onEnter: ctx => {
          const e = dialogueAlien();
          if(e){
            e.attitude = 'Intimidated';
            e.intent = 'Backing away from the crew';
            e.currentlyHostile = false;
            e.hostileByDefault = false;
            e.pacifiedByComm = true;
            e.backingOff = true;
            e.backOffUntilDist = 7;
            e.commBoundaryDist = 1;
          }
        },
        options: [
          { label:'Ask what it wants', next:'intent' },
          { label:'End contact', action:'close' },
        ],
      },
      intimidate_fail: {
        text: ctx => '"Threat shape accepted. Defense response active."',
        onEnter: ctx => {
          const e = dialogueAlien();
          if(e) makeCommunicableAlienHostile(e, 'Defending itself from the crew', false);
        },
        options: [
          { label:'End contact', action:'close' },
        ],
      },
    },
  },
  captain_log: {
    title: ctx => 'Captain\'s Log',
    subtitle: ctx => {
      const c = dialogueCrew() || ctx.crew;
      return (G.shipName || 'Ship')+' · '+(c ? crewMoraleScore(c)+' morale '+crewMoodFace(c) : 'command review');
    },
    start: 'root',
    nodes: {
      root: {
        text: ctx => '"Command review open. Crew, ship, and mission state ready for assessment."',
        options: [
          { label:'Review crew morale', next:'morale' },
          { label:'Review ship readiness', next:'ship' },
          { label:'Close log', action:'close' },
        ],
      },
      morale: {
        text: ctx => {
          const living = (G.crew||[]).filter(c=>c.hp>0);
          const avg = living.length ? Math.round(living.reduce((s,c)=>s+crewMoraleScore(c),0)/living.length) : 0;
          if(avg < 35) return '"Crew morale is poor. Shore leave, pay, medical treatment, or a visible success should be prioritized."';
          if(avg >= 72) return '"Crew morale is strong. Maintain pay, supplies, and operational momentum."';
          return '"Crew morale is stable. Continued pressure may change that quickly."';
        },
        options: [
          { label:'Review ship readiness', next:'ship' },
          { label:'Back', next:'root' },
        ],
      },
      ship: {
        text: ctx => {
          const hullPct = G.ship?.maxHp ? G.ship.hp/G.ship.maxHp : 1;
          const fuelPct = G.maxFuel ? G.fuel/G.maxFuel : 1;
          if(hullPct < 0.4) return '"Ship readiness warning: hull integrity is low. Repair should be treated as urgent."';
          if(fuelPct < 0.35) return '"Ship readiness warning: fuel reserve is low. Navigation options are narrowing."';
          return '"Ship readiness acceptable. No immediate command warning beyond normal operating risk."';
        },
        options: [
          { label:'Review crew morale', next:'morale' },
          { label:'Back', next:'root' },
        ],
      },
    },
  },
  crew_basic: {
    title: ctx => 'Crew Channel: '+crewDisplayName(dialogueCrew() || ctx.crew),
    subtitle: ctx => {
      const c = dialogueCrew() || ctx.crew;
      const role = CREW_ROLES[c?.role]?.label || 'Crew';
      return role+' · morale '+(c ? crewMoraleScore(c)+' '+crewMoodFace(c) : '?');
    },
    start: 'root',
    nodes: {
      root: {
        text: ctx => {
          const c = dialogueCrew() || ctx.crew;
          return '"Channel open, Captain."';
        },
        options: [
          { label:'Request status check', next:'checkin' },
          { label:'Request ship assessment', next:'ship' },
          { label:'Check morale', next:'morale' },
          { label:'Close channel', action:'close' },
        ],
      },
      checkin: {
        text: ctx => dialogueTextFromTopic(dialogueCrew() || ctx.crew, 'checkin'),
        options: [
          { label:'Check morale', next:'morale' },
          { label:'Request ship assessment', next:'ship' },
          { label:'Back', next:'root' },
        ],
      },
      ship: {
        text: ctx => dialogueTextFromTopic(dialogueCrew() || ctx.crew, 'ship'),
        options: [
          { label:'Request priorities', next:'ship_needs' },
          { label:'Back', next:'root' },
        ],
      },
      ship_needs: {
        text: ctx => {
          const c = dialogueCrew() || ctx.crew;
          if(c?.role === 'engineer') return '"Give me time in a real hangar and I can make a list shorter than my arm. Until then: fuel, hull, and not pretending warning lights are decorative."';
          return '"I am not the engineer, but everyone knows the basics. Keep fuel above panic, patch the hull before it becomes weather, and do not cheap out on shore repairs."';
        },
        options: [
          { label:'Back', next:'ship' },
          { label:'Close channel', action:'close' },
        ],
      },
      morale: {
        text: ctx => dialogueTextFromTopic(dialogueCrew() || ctx.crew, 'morale'),
        options: [
          { label:'Issue encouragement', disabled:ctx=>!canEncourageDialogueCrew(), disabledReason:'not ready', check:{ skill:'soc', dc:6 }, success:'encourage_success', fail:'encourage_fail' },
          { label:'Request needs', next:'needs' },
          { label:'Back', next:'root' },
        ],
      },
      needs: {
        text: ctx => {
          const c = dialogueCrew() || ctx.crew;
          const mood = c ? crewMoraleScore(c) : 50;
          if(mood < 35) return '"A station. Pay settled. Food that did not come out of a sealed brick. Maybe ten minutes where nobody says the word radiation."';
          return '"Keep the ship supplied, keep the crew paid, and let us have a win now and then. People can survive a lot when they think it means something."';
        },
        options: [
          { label:'Issue encouragement', disabled:ctx=>!canEncourageDialogueCrew(), disabledReason:'not ready', check:{ skill:'soc', dc:6 }, success:'encourage_success', fail:'encourage_fail' },
          { label:'Back', next:'morale' },
        ],
      },
      encourage_success: {
        text: ctx => '"Thanks, Captain. I needed to hear that."',
        onEnter: ctx => {
          const c = dialogueCrew() || ctx.crew;
          markCrewEncouragementAttempt();
          if(c){ c.moraleBase = Math.min(100, (c.moraleBase || 55) + 3); updateCrewLowMoraleFlags(); }
        },
        options: [
          { label:'Continue', next:'root' },
          { label:'Close channel', action:'close' },
        ],
      },
      encourage_fail: {
        text: ctx => '"I know what you are trying to do. It is just not landing right now."',
        onEnter: ctx => markCrewEncouragementAttempt(),
        options: [
          { label:'Try a practical question', next:'needs' },
          { label:'Back', next:'root' },
        ],
      },
    },
  },

  galaxy_ship_trader: {
    title: ctx => 'Radio: '+(ctx.shipName || 'Merchant Vessel'),
    subtitle: ctx => 'Encrypted merchant band · range '+(ctx.dist||'?')+'u',
    start: 'root',
    nodes: {
      root: {
        text: ctx => '"'+( ctx.shipName||'Vessel' )+' here. We have goods on offer if the price is right. What do you need, captain?"',
        options: [
          { label:'Browse your stock', action:'radio_trade' },
          { label:'Ask about the sector', next:'sector' },
          { label:'Any news from the stations?', next:'news' },
          { label:'Close channel', action:'close' },
        ],
      },
      sector: {
        text: ctx => '"Running this lane a while now. Fuel prices are unpredictable near the outer rim. Watch your reserves."',
        options: [
          { label:'Ask about news', next:'news' },
          { label:'Back', next:'root' },
        ],
      },
      news: {
        text: ctx => '"Nothing that would interest a working captain. Stations are busy, patrols are frequent. Business as usual."',
        options: [
          { label:'Browse stock', action:'radio_trade' },
          { label:'Close channel', action:'close' },
        ],
      },
    },
  },

  galaxy_ship_science: {
    title: ctx => 'Radio: '+(ctx.shipName || 'Survey Vessel'),
    subtitle: ctx => 'Science band · range '+(ctx.dist||'?')+'u',
    start: 'root',
    nodes: {
      root: {
        text: ctx => '"'+( ctx.shipName||'Survey' )+' on survey pass. We are collecting anomaly data on this corridor. Please maintain separation from our sampling track."',
        options: [
          { label:'Ask what you are studying', next:'study' },
          { label:'Any navigational hazards?', next:'hazards' },
          { label:'Close channel', action:'close' },
        ],
      },
      study: {
        text: ctx => '"Deep-field density variance and subspace resonance patterns. The kind of data nobody funds until it becomes critical."',
        options: [
          { label:'Ask about hazards', next:'hazards' },
          { label:'Close channel', action:'close' },
        ],
      },
      hazards: {
        text: ctx => '"Our charts flag elevated debris density two sectors east. Nothing catastrophic — but keep shields warm."',
        options: [
          { label:'Thank them', next:'thanks' },
          { label:'Close channel', action:'close' },
        ],
      },
      thanks: {
        text: ctx => '"Safe flying. And stay off our sampling lane."',
        options: [
          { label:'Close channel', action:'close' },
        ],
      },
    },
  },

  galaxy_ship_patrol: {
    title: ctx => 'Radio: '+(ctx.shipName || 'Station Patrol'),
    subtitle: ctx => 'Station authority band · range '+(ctx.dist||'?')+'u',
    start: 'root',
    nodes: {
      root: {
        text: ctx => '"'+( ctx.shipName||'Patrol' )+'. We have your transponder on record. Everything in order out here?"',
        options: [
          { label:'All clear, thanks', next:'clear' },
          { label:'Ask about threats in the sector', next:'threats' },
          { label:'Request escort', next:'escort' },
          { label:'Close channel', action:'close' },
        ],
      },
      clear: {
        text: ctx => '"Good to hear. Stay on your filed flight plan and signal if anything changes."',
        options: [
          { label:'Close channel', action:'close' },
        ],
      },
      threats: {
        text: ctx => '"Elevated pirate intercept reports two sectors out. We are tracking but cannot guarantee a response window. Keep your combat systems ready."',
        options: [
          { label:'Request escort', next:'escort' },
          { label:'Close channel', action:'close' },
        ],
      },
      escort: {
        text: ctx => '"We are on station patrol and cannot leave our circuit. If you are in active distress, signal SOS and we will reroute. Otherwise — safe travels."',
        options: [
          { label:'Understood', next:'clear' },
          { label:'Close channel', action:'close' },
        ],
      },
    },
  },

  galaxy_ship_cargo: {
    title: ctx => 'Radio: '+(ctx.shipName || 'Cargo Hauler'),
    subtitle: ctx => 'Commercial freight band · range '+(ctx.dist||'?')+'u',
    start: 'root',
    nodes: {
      root: {
        text: ctx => '"'+( ctx.shipName||'Hauler' )+'. Cargo run in progress — we are behind schedule. Keep it short, captain."',
        options: [
          { label:'Any spare fuel to sell?', next:'fuel' },
          { label:'What are you hauling?', next:'cargo' },
          { label:'Close channel', action:'close' },
        ],
      },
      fuel: {
        text: ctx => '"Not set up for mid-run transfers. Hit a station — they will have what you need."',
        options: [
          { label:'Ask about the cargo', next:'cargo' },
          { label:'Close channel', action:'close' },
        ],
      },
      cargo: {
        text: ctx => '"Sealed manifest. You know how it is — ask the station quartermaster when we dock, if that is your business."',
        options: [
          { label:'Close channel', action:'close' },
        ],
      },
    },
  },
};

