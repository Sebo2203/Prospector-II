const CAREER_SAVE_VERSION = 1;
const CAREER_MODES = new Set(['galaxy','system','planet','base','inventory','scanview','shipcombat','casino','radio']);
const CAREER_ROSTERS = ['crew','neutralShips','pirates','gasEntities'];
const COMBAT_ROSTERS = ['neutralShips','pirates','gasEntities'];

function invalidCareerSave(){
  return new Error('This file does not contain a valid career save.');
}

function serializeCareer(game){
  // IDs remain on the authoritative actors when a roster changes order.
  game.entitySerial ??= 0;
  for(const roster of CAREER_ROSTERS){
    for(const actor of game[roster]){
      actor._careerId ??= ++game.entitySerial;
    }
  }
  const snapshot = {...game,saveVersion:CAREER_SAVE_VERSION};
  if(game.dialogue){
    const context = {...game.dialogue.context};
    if(context.crew) context.crew = context.crew._careerId;
    if(context.ns) context.ns = context.ns._careerId;
    snapshot.dialogue = {...game.dialogue,context};
  }
  if(game.radio) snapshot.radio = {...game.radio,ship:game.radio.ship?._careerId};
  if(game.stranded?.rescueShip){
    snapshot.stranded = {...game.stranded,rescueShip:game.stranded.rescueShip._careerId};
  }
  if(game.casino){
    snapshot.casino = {...game.casino};
    const {contest,arena} = game.casino;
    if(contest) snapshot.casino.contest = {...contest,crew:contest.crew._careerId};
    if(arena && !arena.result) snapshot.casino.arena = {...arena,fighter:arena.fighter._careerId};
  }
  if(game.shipCombat){
    snapshot.shipCombat = {...game.shipCombat,pirate:undefined,
      enemies:game.shipCombat.enemies.map(enemy=>({...enemy,ship:enemy.ship._careerId}))};
  }
  return JSON.stringify(snapshot);
}

function parseSaveSnapshot(raw){
  const game = JSON.parse(raw);
  if(!game || game.saveVersion!==CAREER_SAVE_VERSION){
    throw new Error('This save uses a different format. Start a new career with this build.');
  }
  if(!Array.isArray(game.galaxy) || !game.galaxy.length ||
     !game.galaxy.every(row=>Array.isArray(row)&&row.length) ||
     !Array.isArray(game.crew) || !game.crew.every(c=>c&&Number.isFinite(c.hp)) ||
     !game.ship || !['x','y','hp','maxHp'].every(k=>Number.isFinite(game.ship[k])) ||
     !Number.isSafeInteger(game.turn) || game.turn<1 || !CAREER_MODES.has(game.mode) ||
     !game.galaxy[game.ship.y]?.[game.ship.x] || game.debugPalette ||
     !game.shipStats?.classId || !game.planets || !game.enemies ||
     !['cargo','inventory','log','visited','installedWeapons','installedModules','npcStranded']
       .every(key=>Array.isArray(game[key]))){
    throw invalidCareerSave();
  }
  const view = game.mode==='inventory' ? game._prevMode : game.mode;
  if(!CAREER_MODES.has(view) || (game.mode==='inventory' && view==='inventory') ||
     (view==='planet' && !Array.isArray(game.planets[game.curPlanet]?.grid)) ||
     (view==='scanview' && !Array.isArray(game.planets[game.scanViewKey]?.grid)) ||
     (view==='radio' && !game.radio) || (view==='shipcombat' && !game.shipCombat) ||
     (view==='base' && !game.base)){
    throw invalidCareerSave();
  }
  resolveCareerReferences(game);
  return game;
}

function resolveCareerReferences(game){
  const ids = new Set();
  const rosters = {};
  if(!Number.isSafeInteger(game.entitySerial) || game.entitySerial<0) throw invalidCareerSave();
  for(const roster of CAREER_ROSTERS){
    if(!Array.isArray(game[roster])) throw invalidCareerSave();
    rosters[roster] = new Map();
    for(const actor of game[roster]){
      const id = actor?._careerId;
      if(!Number.isSafeInteger(id) || id<1 || id>game.entitySerial || ids.has(id)) throw invalidCareerSave();
      ids.add(id);
      rosters[roster].set(id,actor);
    }
  }
  function actorAt(roster,id){
    const actor = rosters[roster].get(id);
    if(!actor) throw invalidCareerSave();
    return actor;
  }
  if(game.dialogue){
    const {context,id} = game.dialogue;
    if(!context || typeof context!=='object') throw invalidCareerSave();
    if(id==='crew_basic' || id==='captain_log') context.crew = actorAt('crew',context.crew);
    if(id?.startsWith('galaxy_ship_')) context.ns = actorAt('neutralShips',context.ns);
  }
  if(game.radio) game.radio.ship = actorAt('neutralShips',game.radio.ship);
  if(game.stranded?.rescueShip || ['offer','broke'].includes(game.stranded?.rescuePhase)){
    game.stranded.rescueShip = actorAt('neutralShips',game.stranded.rescueShip);
  }
  if(game.casino?.contest) game.casino.contest.crew = actorAt('crew',game.casino.contest.crew);
  if(game.casino?.arena && !game.casino.arena.result){
    game.casino.arena.fighter = actorAt('crew',game.casino.arena.fighter);
  }
  const combat = game.shipCombat;
  if(combat){
    if(!Array.isArray(combat.enemies) || !combat.enemies[combat.target] || !combat.player ||
       !['log','weaponReady','trails','asteroids'].every(key=>Array.isArray(combat[key])) ||
       !Number.isSafeInteger(combat.round) || combat.round<1) throw invalidCareerSave();
    const participants = new Set();
    for(const enemy of combat.enemies){
      if(!enemy || !COMBAT_ROSTERS.includes(enemy.collection) || participants.has(enemy.ship)) throw invalidCareerSave();
      participants.add(enemy.ship);
      enemy.ship = actorAt(enemy.collection,enemy.ship);
    }
    combat.pirate = combat.enemies[combat.target].ship;
  }
}
