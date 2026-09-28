const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..', 'src', 'world');
const interiorSource = fs.readFileSync(path.join(root, 'interior-generation.js'), 'utf8');
const derelictSource = fs.readFileSync(path.join(root, 'ancient-and-derelict-sites.js'), 'utf8');

function generatorContext(seed){
  let state = seed;
  const random = () => {
    state = (Math.imul(1664525, state) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  const seededMath = Object.create(Math);
  seededMath.random = random;
  const context = vm.createContext({
    Math: seededMath,
    PLANET_W: 40,
    PLANET_H: 20,
    G: {planets:{}, enemies:{}},
    rnd: n => Math.floor(random() * n),
  });
  vm.runInContext(interiorSource, context);
  vm.runInContext(derelictSource, context);
  return context;
}

test('generated derelict stations and ships contain salvage but no ore deposits', () => {
  for(let seed=1; seed<=40; seed++){
    const context = generatorContext(seed);
    context.generateDerelict('station');
    context.generateStrandedShipMap('ship');
    for(const key of ['station','ship']){
      const types = context.G.planets[key].grid.flat().map(cell=>cell.type);
      assert.equal(types.includes('MINERAL'), false, `${key} seed ${seed} contains ore`);
      assert.equal(types.includes('MINERAL_SAMPLE'), false, `${key} seed ${seed} contains a mineral sample`);
      assert.equal(types.includes('station_locker'), true, `${key} seed ${seed} has no salvage locker`);
    }
  }
});

test('legacy interior ore is removed on load without changing planetary deposits', () => {
  const context = generatorContext(1);
  const planets = {
    station: {biome:'DERELICT', grid:[[{type:'MINERAL'}, {type:'MINERAL_SAMPLE'}, {type:'station_console'}]]},
    ancient: {biome:'ANCIENT_STATION', grid:[[{type:'MINERAL'}]]},
    planet: {biome:'DESERT', grid:[[{type:'MINERAL'}]]},
  };
  context.removeInteriorOreDeposits(planets);
  assert.equal(planets.station.grid[0][0].type, 'station_floor');
  assert.equal(planets.station.grid[0][1].type, 'station_floor');
  assert.equal(planets.station.grid[0][2].type, 'station_console');
  assert.equal(planets.ancient.grid[0][0].type, 'ancient_st_floor');
  assert.equal(planets.planet.grid[0][0].type, 'MINERAL');
});
