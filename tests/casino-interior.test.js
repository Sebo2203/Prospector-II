const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

test('casino deck connects every attraction to the dock and has no ore or hazards',()=>{
  const root=path.join(__dirname,'..');
  const context=vm.createContext({
    G:{planets:{},enemies:{}},
    TILE:new Proxy({}, {get:(_,type)=>({pass:type!=='casino_wall'})}),
    PW:p=>p.width, PH:p=>p.height,
    planetVisionRadius:()=>10,
  });
  vm.runInContext(fs.readFileSync(path.join(root,'src/world/casino-station.js'),'utf8'),context);
  vm.runInContext(fs.readFileSync(path.join(root,'src/world/exploration-and-trails.js'),'utf8'),context);
  vm.runInContext('generateCasinoStationMap("casino:test")',context);
  vm.runInContext('revealPlanet("casino:test",5,10)',context);
  const map=context.G.planets['casino:test'];
  const grid=map.grid;
  const blocked=new Set(['casino_wall']);
  const seen=new Set(['5,10']);
  const queue=[[5,10]];
  while(queue.length){
    const [x,y]=queue.shift();
    for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      const nx=x+dx,ny=y+dy,k=nx+','+ny;
      if(grid[ny]?.[nx]&&!blocked.has(grid[ny][nx].type)&&!seen.has(k)){
        seen.add(k);queue.push([nx,ny]);
      }
    }
  }
  const fixtures=new Set(['casino_poker','casino_bar','casino_arena','casino_wrestle','casino_slots','casino_host','casino_info','casino_console','casino_locker']);
  const found=new Set();
  grid.forEach((row,y)=>row.forEach((cell,x)=>{
    assert.notEqual(cell.type,'MINERAL');
    if(cell.type!=='casino_wall') assert.ok(seen.has(x+','+y),`${cell.type} at ${x},${y} is unreachable`);
    if(fixtures.has(cell.type)) found.add(cell.type);
  }));
  assert.deepEqual([...found].sort(),[...fixtures].sort());
  assert.equal(map.biome,'CASINO');
  assert.equal(map.isCasino,true);
  assert.equal(map.visited.length,grid.length*grid[0].length);
  assert.equal(map.explored.length,grid.length*grid[0].length);
  assert.equal(map.visited[10*grid[0].length+5],true,'dock floor must render on arrival');
  assert.equal(map.lit[10*grid[0].length+6],true,'adjacent floor must be lit');
});
