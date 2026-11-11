const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
test('line of sight follows cardinal and diagonal rays, stopping at intervening walls',()=>{
  const c=vm.createContext({PW:p=>p.width,TILE:{floor:{pass:true},wall:{pass:false}}});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/world/line-of-sight-and-loot.js'),'utf8'),c);
  const pd={width:9,grid:Array.from({length:9},()=>Array.from({length:9},()=>({type:'floor'})))};
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){
    assert.equal(c.hasPlanetLOS(pd,4,4,4+dx,4+dy),true,'adjacent tile visible');
    assert.equal(c.hasPlanetLOS(pd,4,4,4+3*dx,4+3*dy),true,'clear corridor visible');
    pd.grid[4+dy][4+dx].type='wall';
    assert.equal(c.hasPlanetLOS(pd,4,4,4+3*dx,4+3*dy),false,'wall blocks farther tiles');
    assert.equal(c.hasPlanetLOS(pd,4,4,4+dx,4+dy),true,'wall itself can be seen');
    pd.grid[4+dy][4+dx].type='floor';
  }
});
