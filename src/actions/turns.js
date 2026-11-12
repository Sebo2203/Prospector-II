function beginCareerTurn(activity){
  recordCareerActionTime(activity);
  G.turn++;
  tickCrewMorale();
}

function finishCareerTurn(){
  if(G.dead) return;
  tickShipSystems(G.ship,G.ship.extraCooling||0);
  G.ship.extraCooling=0;
  tickStoryEvents();
  tickCrewStatuses();
  checkDeath();
  if(G.dialogue?.context?.crew?.hp<=0) G.dialogue=null;
  if(!G.dead && G.baseMissiles?.length) advanceBaseMissiles();
}

function advancePlanetDaylight(pdata){
  const biome = BIOMES[pdata.biome] || {};
  const cycle = (biome.dayLength || 20)*4;
  const brightness = turn=>{
    const light = 1 + (Math.sin((turn%cycle)/cycle*2*Math.PI)+1)/2*9;
    return pdata.biome==='ANCIENT' ? Math.min(light,6) : light;
  };
  const before = pdata.planetTurn || 0;
  pdata.planetTurn = before+1;
  _checkPhaseMessages(brightness(before),brightness(pdata.planetTurn),pdata.biome);
}

function applySurfaceTurnExposure(){
  if(applyOxygenDrain()) return;
  applyOxygenWarnings();
  checkDeath();
}

function applyStandingSurfaceHazards(){
  const waitTile = G.planets[G.curPlanet]?.grid[G.player.y]?.[G.player.x]?.type;
  if(waitTile === 'LAVA_FLOOR'){
    const dmg = 3 + rnd(4);
    G.crew.filter(c=>c.hp>0).forEach(c=>c.hp=Math.max(0,c.hp-dmg));
    G.crew.filter(c=>c.hp>0).forEach(c=>applyCrewInjury(c, 'burns', { amount:2, source:'lava', silent:true }));
    SFX.crewHit();
    addLog('Standing in lava — crew takes '+dmg+' damage!','lc');
    checkDeath();
  }
  if(waitTile === 'AMMONIA'){
    const dmg = 2 + rnd(2);
    G.crew.filter(c=>c.hp>0).forEach(c=>c.hp=Math.max(0,c.hp-dmg));
    G.crew.filter(c=>c.hp>0).forEach(c=>{
      applyCrewInjury(c, 'burns', { amount:1, source:'ammonia', silent:true });
      if(Math.random() < 0.25) applyCrewStatus(c, 'toxin_poisoning', { amount:1, stackMode:'add', max:5, source:'ammonia' });
    });
    G.oxygen = Math.max(0, DEBUG.infiniteOxy ? G.oxygen : G.oxygen - atmosphereBiome(G.curPlanet).oxyDrain*2);
    SFX.suffocate();
    addLog('Ammonia seeps in — '+dmg+' damage and O₂ draining!','lc');
    checkDeath();
  }
  if(waitTile === 'TOXIC_FLOOR2'){
    const dmg = 1 + rnd(3);
    G.crew.filter(c=>c.hp>0).forEach(c=>c.hp=Math.max(0,c.hp-dmg));
    G.crew.filter(c=>c.hp>0).forEach(c=>{
      applyCrewInjury(c, 'burns', { amount:1, source:'acid', silent:true });
      if(Math.random() < 0.30) applyCrewStatus(c, 'toxin_poisoning', { amount:1, stackMode:'add', max:5, source:'acid_pool' });
    });
    SFX.crewHit();
    addLog('Acid pool burns through the suit — '+dmg+' damage!','lc');
    checkDeath();
  }
  if(waitTile === 'TOXIC_FLOOR3' && Math.random() < 0.15){
    const dmg = 1 + rnd(2);
    G.crew.filter(c=>c.hp>0).forEach(c=>c.hp=Math.max(0,c.hp-dmg));
    SFX.crewHit();
    addLog('A vent erupts underfoot — '+dmg+' damage!','lw');
    checkDeath();
  }
}

// Short actions on the surface share the clock, exposure and NPC response.
// Movement and waiting have additional local effects.
function completeSurfaceAction(visionRadius,activity){
  beginCareerTurn(activity);
  advancePlanetDaylight(G.planets[G.curPlanet]);
  revealPlanet(G.curPlanet,G.player.x,G.player.y,visionRadius);
  applySurfaceTurnExposure();
  if(!G.dead) applyStandingSurfaceHazards();
  if(!G.dead){
    moveEnemies();
    processPlanetHazards();
  }
  finishCareerTurn();
}
