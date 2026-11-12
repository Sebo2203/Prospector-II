const CAREER_SAVE_VERSION = 6;
const SAVE_SHIP_SYSTEMS = ['engine','reactor','shields','cooling','sensors','fuelTank'];

function validateSavedStoryEvents(game){
  const schedule=game.expedition?.storySchedule;
  if(schedule!==undefined){
    if(!schedule||typeof schedule!=='object'||Array.isArray(schedule))throw invalidCareerSave();
    for(const [id,plan] of Object.entries(schedule)){
      if(!Object.hasOwn(STORY_EVENT_CATALOG,id)||!plan||!['pending','absent','spawned'].includes(plan.status)||
        (plan.status==='absent'?plan.dueTurn!==null:!Number.isSafeInteger(plan.dueTurn)||plan.dueTurn<1))throw invalidCareerSave();
    }
  }
  const q=game.expedition?.quarantine;
  if(q?.name!==undefined && (typeof q.name!=='string'||!q.name.length||q.name.length>80))throw invalidCareerSave();
}

function validateSavedCrewEquipment(crew){
  for(const c of crew)for(const [key,name,usable] of [['_equippedItem','weapon','weaponUsable'],['_equippedArmor','armor','armorUsable']]){
    const item=c[key];if(item===undefined||item===null)continue;
    if(typeof item!=='object'||Array.isArray(item)||item.name!==c[name]||item.usable!==c[usable]||
      !Number.isFinite(item.value??0)||(item.value??0)<0)throw invalidCareerSave();
  }
}

function validateSavedShipAmmo(ship){
  if(ship.requiresPursuit!==undefined && typeof ship.requiresPursuit!=='boolean') throw invalidCareerSave();
  if(ship.ramReadyAt!==undefined && (!Number.isSafeInteger(ship.ramReadyAt)||ship.ramReadyAt<0)) throw invalidCareerSave();
  if(ship.ammo!==undefined && (!ship.ammo || typeof ship.ammo!=='object' || Array.isArray(ship.ammo) ||
    !Object.entries(ship.ammo).every(([id,count])=>SHIP_AMMO[id] && Number.isSafeInteger(count) &&
      count>=0 && count<=SHIP_AMMO[id].capacity))) throw invalidCareerSave();
}

function validateSavedCombatEnvironment(combat,turn,coverTiles){
  const environment=combat.environment;
  if(environment===undefined)return;
  if(!environment || typeof environment!=='object' || Array.isArray(environment))throw invalidCareerSave();
  if(environment.type==='space'){
    if(Object.keys(environment).some(key=>key!=='type'))throw invalidCareerSave();
    return;
  }
  if(environment.type!=='nebula' || !['blue','pink'].includes(environment.variant) ||
    !['gas','mixed'].includes(environment.layout) || !Array.isArray(environment.pockets) || environment.pockets.length>7 ||
    !Number.isSafeInteger(environment.lastTurn) || environment.lastTurn<1 || environment.lastTurn>turn ||
    !Number.isSafeInteger(environment.nextChargeAt) || environment.nextChargeAt<1 || environment.nextChargeAt>turn+4 ||
    (environment.layout==='gas' && combat.asteroids.length))throw invalidCareerSave();
  const occupied=new Set();
  for(const pocket of environment.pockets){
    if(!pocket || !['x','y','width','height'].every(key=>Number.isSafeInteger(pocket[key])) ||
      pocket.x<0 || pocket.y<0 || pocket.width<2 || pocket.height<2 || pocket.width>3 || pocket.height>3 ||
      (pocket.width===3 && pocket.height===3) || pocket.x+pocket.width>27 || pocket.y+pocket.height>17)throw invalidCareerSave();
    for(let y=pocket.y;y<pocket.y+pocket.height;y++)for(let x=pocket.x;x<pocket.x+pocket.width;x++){
      const key=x+','+y;if(occupied.has(key)||coverTiles.has(key))throw invalidCareerSave();occupied.add(key);
    }
  }
  for(const field of ['charge','lastStrike']){
    const event=environment[field];if(event===null)continue;
    if(!event || !Number.isSafeInteger(event.pocket) || event.pocket<0 || event.pocket>=environment.pockets.length)throw invalidCareerSave();
    if(field==='charge' && (!Number.isSafeInteger(event.dueTurn)||event.dueTurn!==turn+1))throw invalidCareerSave();
    if(field==='lastStrike' && (!Number.isSafeInteger(event.turn)||event.turn<1||event.turn>turn))throw invalidCareerSave();
  }
}

function validateSavedShipSystems(ship,turn){
  validateSavedShipAmmo(ship);
  if(!ship.systems || !SAVE_SHIP_SYSTEMS.every(id=>{
    const component=ship.systems[id];
    return component && Number.isFinite(component.condition) && component.condition>=0 && component.condition<=100 &&
      Number.isSafeInteger(component.bypassUntil) && component.bypassUntil>=0;
  }) || !['heat','shieldCharge','shieldRechargeAt','systemTurn'].every(key=>Number.isFinite(ship[key]) && ship[key]>=0) ||
     ship.systemTurn>turn || !Array.isArray(ship.weaponReadyAt) ||
     !ship.weaponReadyAt.every(value=>value===null || (Number.isSafeInteger(value) && value>=0))) throw invalidCareerSave();
}

const CAREER_MODES = new Set(['galaxy','system','planet','base','inventory','scanview','shipcombat','casino','radio']);
const CAREER_ROSTERS = ['crew','neutralShips','pirates','gasEntities'];
const COMBAT_ROSTERS = ['neutralShips','pirates','gasEntities'];

function invalidCareerSave(){
  return new Error('This file does not contain a valid career save.');
}

function validateSavedHullState(game){
  const stats=game.shipStats,cls=SHIP_CLASSES[stats.classId];
  if(!Object.hasOwn(SHIP_CLASSES,stats.classId) || hullFittingReason(stats,game.ship.maxHp,game.installedWeapons) ||
    stats.maxHp!==game.ship.maxHp || game.ship.hp<0 || game.ship.hp>game.ship.maxHp ||
    !Object.entries(hullLimits(cls)).every(([key,value])=>stats[key]===value) ||
    !game.installedWeapons.every((id,slot)=>!id || (SHIP_WEAPONS[id] && slot<stats.weaponSlots &&
      SHIP_WEAPONS[id].mountSize<=hullSystemProfile(cls.id).mounts[slot])) ||
    game.installedModules.length>stats.moduleSlots || new Set(game.installedModules).size!==game.installedModules.length ||
    !game.installedModules.every(id=>Object.hasOwn(HULL_MODULES,id)))throw invalidCareerSave();
  const ledger=game.shipRefits,stores=game.hangarStores,stock=buildShipStats(cls.id);
  if(!ledger || Array.isArray(ledger) || typeof ledger!=='object' || !stores || Array.isArray(stores) || typeof stores!=='object')throw invalidCareerSave();
  for(const [id,count]of Object.entries(ledger)){
    const refit=HULL_REFITS.find(refit=>refit.id===id);
    if(!refit || !Number.isSafeInteger(count) || count<0 ||
      count>Math.ceil(Math.max(0,stats[refit.field]-stock[refit.field])/refit.step))throw invalidCareerSave();
  }
  for(const [station,store]of Object.entries(stores)){
    if(['__proto__','constructor','prototype'].includes(station) || !store ||
      !Array.isArray(store.weapons) || store.weapons.length>256 || !Array.isArray(store.modules) || store.modules.length>256 ||
      !store.weapons.every(item=>item && Object.hasOwn(SHIP_WEAPONS,item.id) && Number.isSafeInteger(item.readyAt) && item.readyAt>=0) ||
      !store.modules.every(id=>Object.hasOwn(HULL_MODULES,id)))throw invalidCareerSave();
  }
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
  for(const [key,planet] of Object.entries(game.planets)){
    if(planet.isUnderwater && planet.civilization && planet.civilization===game.planets[planet.sourcePlanet]?.civilization){
      if(snapshot.planets===game.planets) snapshot.planets = {...game.planets};
      snapshot.planets[key] = {...planet,civilization:undefined,civilizationFromSurface:true};
    }
  }
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
     !Number.isSafeInteger(game.crewDeaths) || game.crewDeaths<0 ||
     !game.galaxy[game.ship.y]?.[game.ship.x] || game.debugPalette ||
     !game.shipStats?.classId || !game.planets || !game.enemies ||
     !['cargo','inventory','log','visited','installedWeapons','installedModules','npcStranded','baseMissiles']
       .every(key=>Array.isArray(game[key]))){
    throw invalidCareerSave();
  }
  validateSavedCrewEquipment(game.crew);
  if(game.helmetMode!==undefined&&!['auto','open','closed'].includes(game.helmetMode))throw invalidCareerSave();
  validateSavedStoryEvents(game);
  const view = game.mode==='inventory' ? game._prevMode : game.mode;
  if(!CAREER_MODES.has(view) || (game.mode==='inventory' && view==='inventory') ||
     (view==='planet' && !Array.isArray(game.planets[game.curPlanet]?.grid)) ||
     (view==='scanview' && !Array.isArray(game.planets[game.scanViewKey]?.grid)) ||
     (view==='radio' && !game.radio) || (view==='shipcombat' && !game.shipCombat) ||
     (view==='base' && !game.base)){
    throw invalidCareerSave();
  }
  if(game.pirateBounties!==undefined){
    const claims=game.pirateBounties;
    if(!claims || !['credits','kills'].every(key=>Number.isSafeInteger(claims[key]) && claims[key]>=0) ||
       (claims.kills===0 && claims.credits!==0) || (claims.kills>0 && claims.credits<claims.kills*50))throw invalidCareerSave();
  }
  if(game.careerTime!==undefined){
    const clock=game.careerTime;
    const locationKeys=['space','planets','stations','interiors'];
    const activityKeys=['travel','exploration','waiting','combat','repair','scan','leisure','services','docking'];
    if(!clock || !Number.isSafeInteger(clock.minutes) || clock.minutes<0 ||
       ![ [clock.locations,locationKeys],[clock.activities,activityKeys] ].every(([totals,keys])=>
         totals && keys.every(key=>Number.isSafeInteger(totals[key]) && totals[key]>=0) &&
         keys.reduce((sum,key)=>sum+totals[key],0)===clock.minutes))throw invalidCareerSave();
  }
  validateSavedShipSystems(game.ship,game.turn);
  validateSavedHullState(game);
  if(game.baseMissiles.length>12 || !game.baseMissiles.every(missile=>missile &&
    Number.isSafeInteger(missile.x) && Number.isSafeInteger(missile.y) && game.galaxy[missile.y]?.[missile.x] &&
    Number.isSafeInteger(missile.dueTurn) && missile.dueTurn>=1 && (missile.dueTurn>game.turn || game.dead) && missile.dueTurn<=game.turn+1 &&
    game.pirateBases?.some(base=>base.x===missile.x && base.y===missile.y))) throw invalidCareerSave();
  if(game.crew.some(c=>c.eventMorale!==undefined &&
    (!Number.isFinite(c.eventMorale) || c.eventMorale < -12 || c.eventMorale > 12)))throw invalidCareerSave();
  if(!Number.isFinite(game.shipStats.maxFuel) || game.shipStats.maxFuel<=0 ||
     !Number.isFinite(game.maxFuel) || game.maxFuel<0 || !Number.isFinite(game.fuel) || game.fuel<0 || game.fuel>game.maxFuel) throw invalidCareerSave();
  resolveCareerReferences(game);
  return game;
}

function resolveCareerReferences(game){
  for(const planet of Object.values(game.planets)){
    if(!planet || typeof planet!=='object') throw invalidCareerSave();
    if(!planet.civilizationFromSurface) continue;
    const owner = game.planets[planet.sourcePlanet];
    if(!planet.isUnderwater || owner?.isUnderwater || owner?.civilization?.species!=='Aquatic') throw invalidCareerSave();
    planet.civilization = owner.civilization;
    delete planet.civilizationFromSurface;
  }
  const ids = new Set();
  const rosters = {};
  if(!Number.isSafeInteger(game.entitySerial) || game.entitySerial<0) throw invalidCareerSave();
  for(const roster of CAREER_ROSTERS){
    if(!Array.isArray(game[roster])) throw invalidCareerSave();
    rosters[roster] = new Map();
    for(const actor of game[roster]){
      if(actor && roster!=='crew'){
        validateSavedShipAmmo(actor);
        if(actor.combatTactic!==undefined&&!SHIP_COMBAT_TACTICS.includes(actor.combatTactic))throw invalidCareerSave();
        if(actor.bridgeSkills!==undefined&&(!actor.bridgeSkills||!['gunnery','piloting'].every(key=>Number.isSafeInteger(actor.bridgeSkills[key])&&actor.bridgeSkills[key]>=0&&actor.bridgeSkills[key]<=10)))throw invalidCareerSave();
      }
      if(actor?.systems) validateSavedShipSystems(actor,game.turn);
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
       !['weaponReady','seenTiles','trails','asteroids','missiles'].every(key=>Array.isArray(combat[key])) ||
       !Number.isSafeInteger(combat.round) || combat.round<1) throw invalidCareerSave();
    const participants = new Set();
    const coverTiles=new Set();
    if(combat.asteroids.length>27*17) throw invalidCareerSave();
    for(const rock of combat.asteroids){
      if(!rock || !Number.isSafeInteger(rock.x) || !Number.isSafeInteger(rock.y) ||
         rock.x<0 || rock.y<0 ||
         !['width','height'].every(key=>rock[key]===undefined || (Number.isSafeInteger(rock[key]) && rock[key]>=1 && rock[key]<=2)) ||
         rock.x+(rock.width??1)>27 || rock.y+(rock.height??1)>17) throw invalidCareerSave();
      for(let y=rock.y;y<rock.y+(rock.height??1);y++)for(let x=rock.x;x<rock.x+(rock.width??1);x++){
        const key=x+','+y;
        if(coverTiles.has(key)) throw invalidCareerSave();
        coverTiles.add(key);
      }
    }
    validateSavedCombatEnvironment(combat,game.turn,coverTiles);
    if(combat.missiles.length>64 || !combat.missiles.every(missile=>missile &&
      ['source','target'].every(key=>Number.isSafeInteger(missile[key]) && missile[key]>=-1 && missile[key]<combat.enemies.length) &&
      ((missile.source===-1)!==(missile.target===-1)) &&
      Number.isSafeInteger(missile.x) && missile.x>=0 && missile.x<27 &&
      Number.isSafeInteger(missile.y) && missile.y>=0 && missile.y<17 &&
      Number.isSafeInteger(missile.lastRound) && missile.lastRound>=1 && missile.lastRound<=combat.round &&
      Number.isSafeInteger(missile.ticks) && missile.ticks>=0 && missile.ticks<4 &&
      Number.isSafeInteger(missile.gunnery) && missile.gunnery>=0 && missile.gunnery<=10 &&
      Number.isSafeInteger(missile.range) && missile.range>=0 && missile.range<=8)) throw invalidCareerSave();
    for(const enemy of combat.enemies){
      if(!enemy || !COMBAT_ROSTERS.includes(enemy.collection) || participants.has(enemy.ship) ||
         (enemy.lastManeuverAt!==undefined&&(!Number.isSafeInteger(enemy.lastManeuverAt)||enemy.lastManeuverAt<1||enemy.lastManeuverAt>game.turn)) ||
         (enemy.moveBank!==undefined && (!Number.isFinite(enemy.moveBank) || enemy.moveBank<0 || enemy.moveBank>=1))) throw invalidCareerSave();
      participants.add(enemy.ship);
      enemy.ship = actorAt(enemy.collection,enemy.ship);
      validateSavedShipSystems(enemy.ship,game.turn);
    }
    // Earlier schema-2 builds kept a separate ten-line combat window. Promote
    // its archived entries once, preserving their original turns and order.
    if(Array.isArray(combat.log)){
      const messages=new Set(combat.log);
      const prefixes=combat.enemies.map(enemy=>'['+enemy.ship.name+'] ');
      for(const entry of game.log){
        if(!entry?.archive || typeof entry.msg!=='string') continue;
        const prefix=prefixes.find(prefix=>entry.msg.startsWith(prefix));
        if(prefix && messages.has(entry.msg.slice(prefix.length))){delete entry.archive;entry.category='combat';}
      }
    }
    delete combat.log;delete combat.logFontSize;
    combat.pirate = combat.enemies[combat.target].ship;
    combat.weaponReady=game.ship.weaponReadyAt;
    combat.playerShields=game.ship.shieldCharge;
    for(const enemy of combat.enemies) enemy.shields=enemy.ship.shieldCharge;
  }
}
