// ─────────────────────────────────────────────────────────────────
//  HOSTILE BIOME CREATURE SYSTEM
//  Apex predators for uninhabitable planets — rare, lethal, unique
// ─────────────────────────────────────────────────────────────────
const HOSTILE_CREATURE_NAME_PARTS = {
  prefix: ['Krath','Vrex','Szeln','Gorr','Xeth','Druun','Kael','Vorn','Szrak','Hrex','Ghul','Drath','Kzar','Vorsh','Neth'],
  mid:    ['ul','ak','or','ix','em','az','un','oth','ar','ek','vol','irr','ash','ox','urr'],
  suffix: ['ghar','dex','voth','rax','kel','mur','zeth','pon','fex','wrak','duur','soth','vex','grall','nak'],
};

const HOSTILE_BODY_TYPES = [
  { key:'stalker',  sprite:'creature_stalker',  sizeRange:[1.4, 2.4], label:'low-slung apex predator'  },
  { key:'biped',    sprite:'creature_biped',     sizeRange:[1.6, 2.8], label:'towering predator'        },
  { key:'crawler',  sprite:'creature_crawler',   sizeRange:[1.2, 2.2], label:'armoured crawler'         },
  { key:'spiker',   sprite:'creature_spiker',    sizeRange:[1.0, 2.0], label:'spined ambush predator'   },
  { key:'serpent',  sprite:'creature_serpent',   sizeRange:[1.4, 2.6], label:'massive serpentine hunter'},
  { key:'floater',  sprite:'creature_floater',   sizeRange:[1.2, 2.4], label:'drifting predatory mass'  },
];

const HOSTILE_BODY_DESCS = {
  stalker:  ['heat-resistant carapace fused to its skeleton','forward-facing sensory pits that track thermal signatures','silicate-reinforced hide that deflects radiation'],
  biped:    ['thick hide layered with mineral deposits','chemoreceptor organs that detect suit oxygen','muscular frame adapted to crush bone and metal alike'],
  crawler:  ['segmented exoskeleton hardened by volcanic minerals','multiple limbs tipped with serrated digging claws','low centre of gravity built for ambush from below'],
  spiker:   ['hollow venomous spines that inject corrosive fluid','radially symmetric form that attacks from any angle','slow drift that masks a lightning-fast strike'],
  serpent:  ['scale plates reinforced with crystallised sulfur','ambushes prey by lying motionless for hours','jaw dislocates to engulf entire suited figures'],
  floater:  ['gas bladders filled with toxic atmospheric compounds','trailing tendrils deliver paralytic contact toxin','near-invisible against atmospheric haze'],
};

const HOSTILE_DIET_DESCS = {
  VOLCANIC:  ['sustains itself on chemosynthetic bacteria near vents','absorbs mineral energy from lava flow contact','hunts by heat signature alone in the volcanic dark'],
  TOXIC:     ['metabolises atmospheric toxins directly through its hide','feeds on the chemical-rich subsurface layer','secretes corrosive compounds to dissolve prey through suit material'],
  FROZEN:    ['enters metabolic suspension between kills','hunts beneath the ice surface, sensing vibrations','survives on trace minerals and rare prey'],
  ASTEROID:  ['survives in vacuum by sealing its own biology','ambushes anything that disturbs the mineral surface','has no known food source — may feed on radiation'],
  DESERT:    ['extracts moisture entirely from prey tissue','enters deep torpor during extreme heat cycles','tracks prey over vast distances using subsurface vibration'],
  MOON_ROCK: ['clings to the surface using adhesive foot pads','feeds on mineral deposits and rare organic matter','launches itself between surfaces in low gravity'],
  MOON_ICE:  ['bores through ice to ambush from below','antifreeze biology allows activity in extreme cold','hunts by detecting thermal output of life signs'],
  MOON_TOXIC:['breathes atmospheric compounds lethal to suited crew','secretes acids that eat through most materials','packs a paralytic sting before consuming prey'],
};

function hostileCreatureName(){
  const P = HOSTILE_CREATURE_NAME_PARTS;
  const base = pick(P.prefix) + pick(P.mid) + pick(P.suffix);
  // Hostile creatures always have a title prefix — they feel named, apex
  const titles = ['Alpha','Void','Iron','Ash','Null','Deep','Prime','Scar','Brood'];
  return Math.random() < 0.5 ? pick(titles)+' '+base : base;
}

function generateHostileCreatureDesc(tmpl){
  const sizes = tmpl.size < 1.2 ? 'large' : tmpl.size < 1.8 ? 'massive' : 'enormous';
  const bodyDesc = pick(HOSTILE_BODY_DESCS[tmpl.body] || HOSTILE_BODY_DESCS.stalker);
  const dietDesc = pick(HOSTILE_DIET_DESCS[tmpl.biomeKey] || HOSTILE_DIET_DESCS.ASTEROID);
  return `A ${sizes} ${tmpl.bodyLabel} with ${bodyDesc}. ${dietDesc.charAt(0).toUpperCase()+dietDesc.slice(1)}.`;
}

function generateHostileCreatureTemplates(biomeKey){
  // 1–2 species max — these are apex solitary hunters
  const numSpecies = 1 + (Math.random() < 0.4 ? 1 : 0);
  const cols = CREATURE_BIOME_COLS[biomeKey] || CREATURE_BIOME_COLS.ASTEROID;
  const templates = [];
  const usedBodies = [];

  for(let i=0; i<numSpecies; i++){
    const remaining = HOSTILE_BODY_TYPES.filter(b=>!usedBodies.includes(b.key));
    const body = pick(remaining.length ? remaining : HOSTILE_BODY_TYPES);
    usedBodies.push(body.key);
    const [sMin, sMax] = body.sizeRange;
    const size = sMin + Math.random()*(sMax-sMin);
    // All hostile creatures are apex predators — always hostile, high stats
    const behaviour = Math.random() < 0.5 ? 'STALK' : 'HUNT';
    const maxHp  = Math.round(size * (12 + Math.random()*10)); // 2–3x normal
    const atk    = Math.max(4, Math.round(size * (4 + Math.random()*4)));
    const tmpl = {
      name:            hostileCreatureName(),
      diet:            'carnivore',
      body:            body.key,
      sprite:          body.sprite,
      bodyLabel:       body.label,
      biomeKey,
      size,
      colour:          pick(cols),
      behaviour,
      speedRating:     planetCritterSpeedRating({ body:body.key, size, behaviour, hostileByDefault:true }),
      hostileByDefault: true,
      territoryRange:  0,
      calmRange:       0,
      maxHp,
      atk,
      def:             Math.round(size * (1 + Math.random()*2)), // tougher defence too
    };
    tmpl.desc = generateHostileCreatureDesc(tmpl);
    templates.push(tmpl);
  }
  return templates;
}

const HOSTILE_BIOMES = new Set(['VOLCANIC','TOXIC','ASTEROID','FROZEN','DESERT','MOON_ROCK','MOON_ICE','MOON_TOXIC']);
