// ─────────────────────────────────────────────────────────────────
//  SHIP CLASS DEFINITIONS
// ─────────────────────────────────────────────────────────────────
const SHIP_CLASSES = {
  LIGHT_SCOUT: {
    id:             'LIGHT_SCOUT',
    name:           'Light Scout',
    hullType:       'Light Scout',
    sprite:         'player_ship',
    baseHp:         100,
    maxUpgradeHp:   120,  // +20% ceiling — scout stays fragile
    baseFuel:       100,
    maxUpgradeFuel: 180,  // most drastic fuel ceiling — long-range explorer
    maxUpgradeEngine: 3,  // mild speed upgrade (corvette keeps the top)
    cargoCapacity:  0,
    maxUpgradeCargo: 1,   // negligible
    sensorRange:    3,
    maxUpgradeSensor: 6,  // most drastic sensor ceiling (+3 range)
    shields:        0,
    maxShields:     1,    // just enough to survive one hit
    engineRating:   2,
    weaponSlots:    1,
    maxWeaponSlots: 2,
    moduleSlots:    0,
    maxModuleSlots: 1,
    maxCrew:        4,
    maxUpgradeCrew: 5,    // negligible +1
    desc:           'Fast and nimble. Excellent sensors, minimal cargo.',
  },
  BULK_FREIGHTER: {
    id:             'BULK_FREIGHTER',
    name:           'Bulk Freighter',
    hullType:       'Bulk Freighter',
    sprite:         'ship_freighter',
    baseHp:         120,
    maxUpgradeHp:   180,  // drastic — tanky mobile base
    baseFuel:       180,
    maxUpgradeFuel: 240,  // medium upgrade ceiling
    maxUpgradeEngine: 1,  // no speed upgrade — stays slow
    cargoCapacity:  5,
    maxUpgradeCargo: 15,  // drastic — the whole point of this hull
    sensorRange:    1,
    maxUpgradeSensor: 2,  // negligible +1
    shields:        0,
    maxShields:     2,
    engineRating:   1,
    weaponSlots:    0,
    maxWeaponSlots: 2,    // can defend itself eventually
    moduleSlots:    1,
    maxModuleSlots: 3,
    maxCrew:        8,
    maxUpgradeCrew: 12,   // drastic — mobile base needs a big crew
    desc:           'Heavy hauler. Massive cargo hold, no weapons, poor sensors.',
  },
  ATTACK_CORVETTE: {
    id:             'ATTACK_CORVETTE',
    name:           'Attack Corvette',
    hullType:       'Attack Corvette',
    sprite:         'ship_corvette',
    baseHp:         110,
    maxUpgradeHp:   160,  // mid — combat ship but not a tank
    baseFuel:       90,
    maxUpgradeFuel: 100,  // negligible — short patrol range is the tradeoff
    maxUpgradeEngine: 5,  // drastic — fastest ship in the sector at full upgrade
    cargoCapacity:  0,
    maxUpgradeCargo: 1,   // +1 only
    sensorRange:    2,
    maxUpgradeSensor: 3,  // negligible +1
    shields:        1,
    maxShields:     5,    // drastic — becomes a fortress
    engineRating:   3,
    weaponSlots:    2,
    maxWeaponSlots: 3,    // 3 weapons max (not 4)
    moduleSlots:    2,
    maxModuleSlots: 2,
    maxCrew:        4,
    maxUpgradeCrew: 4,    // no crew upgrade — tight warship
    desc:           'Built for combat. Dual weapons, shields, short patrol range.',
  },
};

// Build a live ship stats object from a class definition + any upgrades applied
function buildShipStats(classId, upgrades) {
  const cls = SHIP_CLASSES[classId] || SHIP_CLASSES.LIGHT_SCOUT;
  const u = upgrades || {};
  return {
    classId,
    hullType:       cls.hullType,
    name:           cls.name,
    desc:           cls.desc,
    sprite:         cls.sprite || 'player_ship',
    maxHp:          Math.min(cls.maxUpgradeHp,  cls.baseHp   + (u.hp||0)),
    maxUpgradeHp:   cls.maxUpgradeHp,
    maxFuel:        Math.min(cls.maxUpgradeFuel, cls.baseFuel + (u.fuel||0)),
    maxUpgradeFuel: cls.maxUpgradeFuel,
    cargoCapacity:  cls.cargoCapacity + (u.cargo||0),
    sensorRange:    Math.min(cls.maxUpgradeSensor, cls.sensorRange + (u.sensor||0)),
    maxUpgradeSensor: cls.maxUpgradeSensor,
    shields:        u.shields || cls.shields,
    maxShields:     cls.maxShields,
    engineRating:   Math.min(cls.maxUpgradeEngine, cls.engineRating + (u.engine||0)),
    maxUpgradeEngine: cls.maxUpgradeEngine,
    weaponSlots:    Math.min(cls.maxWeaponSlots, cls.weaponSlots + (u.weapons||0)),
    maxWeaponSlots: cls.maxWeaponSlots,
    moduleSlots:     Math.min(cls.maxModuleSlots,  cls.moduleSlots  + (u.module||0)),
    maxModuleSlots:  cls.maxModuleSlots,
    maxCrew:        Math.min(cls.maxUpgradeCrew, cls.maxCrew + (u.crew||0)),
    maxUpgradeCrew: cls.maxUpgradeCrew,
  };
}

// Add an item to cargo hold — returns true if added, false if full
