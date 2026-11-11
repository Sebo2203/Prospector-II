// ─────────────────────────────────────────────────────────────────
//  SHIP CLASS DEFINITIONS
// ─────────────────────────────────────────────────────────────────
const NEUTRAL_ENGINE_RATINGS={trader:2,cargo:1,science:2,patrol:3};
const STARTER_HULL_IDS=Object.freeze(['LIGHT_SCOUT','BULK_FREIGHTER','ATTACK_CORVETTE']);
const STARTER_SHIP_WEAPONS=Object.freeze({LIGHT_SCOUT:['mass_driver'],BULK_FREIGHTER:[],ATTACK_CORVETTE:['railgun']});

const SHIP_CLASSES = {
  LIGHT_SCOUT: {
    id:             'LIGHT_SCOUT',
    name:           'Light Scout',
    hullType:       'Light Scout',
    sprite:         'player_ship',
    baseHp:         100,
    size:1,structure:1,engineering:2,precision:3,geometry:1,hardpointDensity:1,cargoFraction:0.05,price:3000,
    baseFuel:       100,
    cargoCapacity:  0,
    sensorRange:    3,
    shields:        0,
    engineRating:   2,
    weaponSlots:    1,
    moduleSlots:    0,
    maxCrew:        4,
    desc:           'Fast and nimble. Excellent sensors, minimal cargo.',
  },
  BULK_FREIGHTER: {
    id:             'BULK_FREIGHTER',
    name:           'Bulk Freighter',
    hullType:       'Bulk Freighter',
    sprite:         'ship_freighter',
    baseHp:         120,
    size:2.5,structure:1,engineering:1.5,precision:1,geometry:0.85,hardpointDensity:0.5,cargoFraction:0.6,price:4500,
    baseFuel:       180,
    cargoCapacity:  5,
    sensorRange:    1,
    shields:        0,
    engineRating:   1,
    weaponSlots:    0,
    moduleSlots:    1,
    maxCrew:        8,
    desc:           'Heavy hauler. Massive cargo hold, no weapons, poor sensors.',
  },
  ATTACK_CORVETTE: {
    id:             'ATTACK_CORVETTE',
    name:           'Attack Corvette',
    hullType:       'Attack Corvette',
    sprite:         'ship_corvette',
    baseHp:         110,
    size:1.5,structure:2,engineering:3,precision:1.5,geometry:1.1,hardpointDensity:1.5,cargoFraction:0.05,price:6000,
    baseFuel:       90,
    cargoCapacity:  0,
    sensorRange:    2,
    shields:        1,
    engineRating:   3,
    weaponSlots:    2,
    moduleSlots:    2,
    maxCrew:        4,
    desc:           'Built for combat. Dual weapons, shields, short patrol range.',
  },
};

// Factory equipment is distinct from the physical envelope and purchased refits.
function buildShipStats(classId,upgrades={}){
  const cls=SHIP_CLASSES[classId]||SHIP_CLASSES.LIGHT_SCOUT,limits=hullLimits(cls),u=upgrades;
  return {...limits,classId:cls.id,hullType:cls.hullType,name:cls.name,desc:cls.desc,sprite:cls.sprite||'player_ship',
    maxHp:Math.min(limits.maxUpgradeHp,cls.baseHp+(u.hp||0)),
    maxFuel:Math.min(limits.maxUpgradeFuel,cls.baseFuel+(u.fuel||0)),
    cargoCapacity:Math.min(limits.maxUpgradeCargo,cls.cargoCapacity+(u.cargo||0)),
    sensorRange:Math.min(limits.maxUpgradeSensor,cls.sensorRange+(u.sensor||0)),
    shields:Math.min(limits.maxShields,cls.shields+(u.shields||0)),
    reactorRating:Math.min(limits.maxReactor,1+(u.reactor||0)),coolingRating:Math.min(limits.maxCooling,1+(u.cooling||0)),
    engineRating:Math.min(limits.maxUpgradeEngine,cls.engineRating+(u.engine||0)),
    weaponSlots:Math.min(limits.maxWeaponSlots,cls.weaponSlots+(u.weapons||0)),
    moduleSlots:Math.min(limits.maxModuleSlots,cls.moduleSlots+(u.module||0)),
    maxCrew:Math.min(limits.maxUpgradeCrew,cls.maxCrew+(u.crew||0))};
}
