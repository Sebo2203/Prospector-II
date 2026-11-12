// ─────────────────────────────────────────────────────────────────
//  SCIENCE OFFICE JOBS
// ─────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────
//  GROUND WEAPON RANGE TABLE
//  maxRange  — maximum tiles a bullet can travel
//  accuracy  — base hit chance at point-blank (range 1). Falls off
//              linearly: chance = accuracy - (dist-1) * falloff
//  falloff   — accuracy loss per tile of distance
// ─────────────────────────────────────────────────────────────────
const GROUND_WEAPONS = {
  'gun':          { attackBonus:2, maxRange: 6,  accuracy: 0.85, falloff: 0.10 },  // Simple Handgun
  'gun_sniper':   { attackBonus:5, maxRange: 12, accuracy: 0.90, falloff: 0.05 },  // Sniper Rifle
  'gun_shotgun':  { attackBonus:3, maxRange: 3,  accuracy: 0.95, falloff: 0.20 },  // Shotgun — close range, high acc
  'gun_burst':    { attackBonus:3, maxRange: 5,  accuracy: 0.75, falloff: 0.08 },  // Burst Carbine — medium, fast
  'gun_plasma':   { attackBonus:3, maxRange: 7,  accuracy: 0.80, falloff: 0.07 },  // Plasma Pistol
  'gun_breacher': { attackBonus:4, maxRange: 4,  accuracy: 0.90, falloff: 0.15 },  // Assault Carbine — short-medium, high acc
  'knife':        { attackBonus:1, maxRange: 1,  accuracy: 1.00, falloff: 0.00 },  // Knife — melee only range
  'stun_baton':   { attackBonus:2, maxRange: 1,  accuracy: 1.00, falloff: 0.00 },  // Stun Baton — melee, non-lethal
  'vibroblade':   { attackBonus:4, maxRange: 1,  accuracy: 1.00, falloff: 0.00 },  // Vibroblade — high melee ATK
  'tranq_darts':  { attackBonus:0, maxRange: 5,  accuracy: 0.80, falloff: 0.06 },  // Tranq Dart Kit — ranged, non-lethal
};
function groundWeaponAttackBonus(id){return GROUND_WEAPONS[id]?.attackBonus??2;}
function groundRangedHitChance(shooter,profile,distance){
  if(distance<1||distance>profile.maxRange)return 0;
  return Math.min(0.99,Math.max(0.05,profile.accuracy-(distance-1)*profile.falloff)+
    crewSkillValue(shooter,'cbt')*0.02+crewImplantAccuracyBonus(shooter));
}
function consumeEquippedTranq(shooter){
  shooter.weapon='Bare hands';shooter.weaponUsable=null;shooter._equippedItem=null;
}

// Returns all living crew with ranged weapons, ordered by default usefulness.
function getRangedShooters(){
  return (G.crew||[])
    .filter(c=>c.hp>0 && crewCanContributeCombat(c) && c.weaponUsable && GROUND_WEAPONS[c.weaponUsable] && GROUND_WEAPONS[c.weaponUsable].maxRange > 1)
    .sort((a,b)=>{
      const aw = GROUND_WEAPONS[a.weaponUsable], bw = GROUND_WEAPONS[b.weaponUsable];
      return (bw.maxRange - aw.maxRange) || ((b.atk||0) - (a.atk||0)) || crewDisplayName(a).localeCompare(crewDisplayName(b));
    });
}

function selectedRangedShooterIndex(shooters){
  if(!shooters.length) return -1;
  let idx = Number.isFinite(G._rangeShooterIdx) ? Math.floor(G._rangeShooterIdx) : 0;
  idx = ((idx % shooters.length) + shooters.length) % shooters.length;
  G._rangeShooterIdx = idx;
  return idx;
}

function cycleRangedShooter(delta){
  const shooters = getRangedShooters();
  if(shooters.length < 2) return false;
  const idx = selectedRangedShooterIndex(shooters);
  G._rangeShooterIdx = (idx + delta + shooters.length) % shooters.length;
  G._rangeFireMode = 'single';
  return true;
}

// Returns the selected ranged weapon profile for fire mode.
// Defaults to the strongest ranged shooter when no selection exists yet.
function getBestRangedWeapon(){
  const shooters = getRangedShooters();
  if(!shooters.length) return null;
  const idx = selectedRangedShooterIndex(shooters);
  const crew = shooters[idx];
  return { crew, profile: GROUND_WEAPONS[crew.weaponUsable], index: idx, count: shooters.length, shooters };
}

