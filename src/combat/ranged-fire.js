function traceBullet(fromX, fromY, toX, toY, maxRange){
  var pdata = G.planets[G.curPlanet];
  var _W = PW(pdata), _H = PH(pdata);
  var dx = toX - fromX, dy = toY - fromY;
  var steps = Math.max(Math.abs(dx), Math.abs(dy));
  if(steps === 0) return { hit: null, landX: fromX, landY: fromY };

  for(var i=1; i<=maxRange; i++){
    var tx = Math.round(fromX + (dx/steps)*i);
    var ty = Math.round(fromY + (dy/steps)*i);
    if(tx<0||tx>=_W||ty<0||ty>=_H) return { hit: null, landX: tx, landY: ty };
    var cell = pdata.grid[ty] && pdata.grid[ty][tx];
    var tdef = cell ? TILE[cell.type] : null;
    if(tdef && !tdef.pass){
      return { hit: null, landX: tx, landY: ty };
    }
    var hereEnemies = (G.enemies[G.curPlanet]||[]).filter(function(e){ return e.alive && e.x===tx && e.y===ty; });
    if(hereEnemies.length){
      return { hit: hereEnemies[0], landX: tx, landY: ty };
    }
  }
  return { hit: null, landX: toX, landY: toY };
}

function resolveRangedShot(shooter, profile){
  var cx = G.rangeTarget.x, cy = G.rangeTarget.y;
  var dx = cx - G.player.x, dy = cy - G.player.y;
  var dist = Math.max(Math.abs(dx), Math.abs(dy));

  if(dist === 0){ addLog('Choose a target tile.','lw'); return false; }
  if(dist > profile.maxRange){ addLog('Out of range — max '+profile.maxRange+' tiles for '+shooter.weapon+'.','lw'); return false; }

  var cbtSkill = shooter.skills && shooter.skills.cbt ? shooter.skills.cbt : 0;
  var cbtBonus = cbtSkill * 0.02;
  var rawAcc   = Math.max(0.05, profile.accuracy - (dist-1)*profile.falloff);
  var finalAcc = Math.min(0.99, rawAcc + cbtBonus);
  var hitRoll  = Math.random() < finalAcc;

  var trace = traceBullet(G.player.x, G.player.y, cx, cy, profile.maxRange);
  var pathEnemy = trace.hit;
  addPlanetBulletTracer(G.player.x, G.player.y, trace.landX, trace.landY, '#88ddff');
  var weaponBonus = shooter.weaponUsable === 'gun_sniper' ? 5 : shooter.weaponUsable === 'gun_breacher' ? 4 : shooter.weaponUsable === 'gun_shotgun' ? 3 : shooter.weaponUsable === 'gun_burst' ? 3 : shooter.weaponUsable === 'gun_plasma' ? 3 : 2;
  var stimBonus = (shooter._stimAtk||0) > 0 && G.turn <= (shooter._stimUntil||0) ? shooter._stimAtk : 0;
  var dmg = Math.max(1, shooter.atk + weaponBonus + stimBonus + Math.floor(Math.random()*2));

  giveSkillXP(shooter, 'cbt', 2);
  var cap = G.crew.find(function(c){ return c.role==='captain'&&c.hp>0; });
  if(cap && cap !== shooter) giveSkillXP(cap, 'soc', 1);

  var targetsAtCursor = (G.enemies[G.curPlanet]||[]).filter(function(e){ return e.alive && e.x===cx && e.y===cy; });
  var intendedTarget = targetsAtCursor[0] || null;

  function killEnemy(e){
    e.alive = false;
    dropAlienDeathLoot(e);
  }

  if(intendedTarget?.civLocal){
    makeCivilizationHostileFromLocal(intendedTarget, 'Responding to crew gunfire');
  }
  if(intendedTarget?.canCommunicate){
    makeCommunicableAlienHostile(intendedTarget, 'Defending itself from crew gunfire');
  }

  // Helper: consume tranq dart and unequip from shooter
  function consumeTranqDart(){
    const dartIdx = (G.inventory||[]).findIndex(i=>i.usable==='tranq_darts');
    if(dartIdx !== -1){ G.inventory.splice(dartIdx,1); }
    shooter.weapon='Bare hands'; shooter.weaponUsable=null; shooter._equippedItem=null;
  }

  if(hitRoll && intendedTarget){
    if(shooter.weaponUsable === 'tranq_darts'){
      intendedTarget.stunTurns = (intendedTarget.stunTurns||0) + 4;
      addLog(crewDisplayName(shooter)+' hits '+intendedTarget.name+' with a tranq dart — incapacitated for 4 turns.','lg');
      consumeTranqDart();
    } else {
      intendedTarget.hp -= dmg;
      if(intendedTarget.hp > 0){
        addLog(crewDisplayName(shooter)+' shoots '+intendedTarget.name+' for '+dmg+' damage.','lc');
      } else {
        addLog(crewDisplayName(shooter)+' shoots '+intendedTarget.name+' for '+dmg+'. Defeated!','lg');
        killEnemy(intendedTarget);
      }
    }
  } else if(hitRoll && shooter.weaponUsable === 'tranq_darts'){
    addLog(crewDisplayName(shooter)+' fires a tranq dart — hits nothing.','li');
    consumeTranqDart();
  } else if(!hitRoll && pathEnemy && pathEnemy !== intendedTarget){
    if(shooter.weaponUsable === 'tranq_darts'){ consumeTranqDart(); }
    if(pathEnemy.civLocal){
      makeCivilizationHostileFromLocal(pathEnemy, 'Responding to stray crew gunfire');
    }
    if(pathEnemy.canCommunicate){
      makeCommunicableAlienHostile(pathEnemy, 'Defending itself from stray crew gunfire');
    }
    var strayDmg = Math.max(1, Math.floor(dmg/2));
    pathEnemy.hp -= strayDmg;
    if(pathEnemy.hp <= 0){
      addLog('Shot misses — stray bullet fells '+pathEnemy.name+'!','lc');
      killEnemy(pathEnemy);
    } else {
      addLog(crewDisplayName(shooter)+' misses — stray shot grazes '+pathEnemy.name+' for '+strayDmg+'.','lc');
    }
  } else if(!hitRoll){
    if(shooter.weaponUsable === 'tranq_darts'){ consumeTranqDart(); }
    addLog(crewDisplayName(shooter)+' fires at range '+dist+' — shot goes wide.','li');
  } else {
    if(shooter.weaponUsable === 'tranq_darts'){ consumeTranqDart(); }
    addLog(crewDisplayName(shooter)+' fires — bullet hits terrain.','li');
  }

  return true;
}

function finishRangedFireTurn(){
  G.rangeTarget = null;
  G.turn++;
  moveEnemies();
  processPlanetHazards();
  checkDeath();
  renderAll();
}

function doRangedVolley(){
  if(!G.rangeTarget) return;
  var best = getBestRangedWeapon();
  if(!best){ G.rangeTarget=null; renderAll(); return; }

  var fired = 0;
  best.shooters.forEach(function(shooter){
    if(!shooter || shooter.hp <= 0) return;
    var profile = GROUND_WEAPONS[shooter.weaponUsable];
    if(profile && resolveRangedShot(shooter, profile)) fired++;
  });

  if(!fired){ renderAll(); return; }
  finishRangedFireTurn();
}

function doRangedFire(){
  if(!G.rangeTarget) return;
  var best = getBestRangedWeapon();
  if(!best){ G.rangeTarget=null; renderAll(); return; }
  if(best.count > 1 && G._rangeFireMode !== 'single'){
    doRangedVolley();
    return;
  }
  if(!resolveRangedShot(best.crew, best.profile)){ renderAll(); return; }
  finishRangedFireTurn();
}


