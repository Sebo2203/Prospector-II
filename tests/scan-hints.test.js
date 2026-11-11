const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function world(){
 const c=vm.createContext({BIOMES:{},addLog:msg=>c.messages.push(msg),messages:[]});
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../src/actions/survey-and-scan.js'),'utf8'),c);return c;
}
test('normal scan readings stay quiet and civilization hints conceal identity and disposition',()=>{
 const c=world(),desc={biome:'HABITABLE',scanState:'partial',name:'Secret Body'};
 c.logBodyScanHint(desc,{spawnedAliens:9});assert.deepEqual(c.messages,[]);
 c.logBodyScanHint(desc,{civilization:{tierLabel:'Industrial',species:'Secret Species',aggression:'Hostile'}});
 assert.equal(c.messages.length,1);assert.match(c.messages[0],/patterns/);
 assert.doesNotMatch(c.messages[0],/Secret|Industrial|Hostile|civilization|coordinates/i);
});
test('special worlds suggest anomalies without identifying their type, and failed scans reveal none',()=>{
 const c=world();
 for(const biome of ['RINGWORLD','DESTROYED_RINGWORLD','NUCLEAR_WAR','BLOOM','TALKING_TREES','ANCIENT','ANCIENT_STATION']){
  for(const scanState of ['partial','full']){
   const hint=c.bodyScanHint({biome,scanState},{});assert.ok(hint);
   assert.doesNotMatch(hint,/ringworld|nuclear|bloom|talking|trees|ancient|station|radiation|hallucin/i);
  }
  assert.equal(c.bodyScanHint({biome,scanState:'failed'},{}),'');
 }
});
test('ordinary moons remain quiet; special companions and scanned ruins receive only a broad hint',()=>{
 const c=world(),desc={biome:'GAS_GIANT',scanState:'full',moons:[{biome:'MOON_ROCK'}]};
 assert.equal(c.bodyScanHint(desc),'');desc.moons.push({biome:'ANCIENT_STATION',name:'Secret Station'});
 assert.match(c.bodyScanHint(desc),/secondary returns/);desc.scanState='partial';assert.equal(c.bodyScanHint(desc),'');
 const ordinary={biome:'DESERT',scanState:'partial'},pdata={grid:[[{type:'ANCIENT_WALL'}]],scanMask:[false]};
 assert.equal(c.bodyScanHint(ordinary,pdata),'');pdata.scanMask[0]=true;assert.match(c.bodyScanHint(ordinary,pdata),/patterns/);
 assert.deepEqual(pdata.grid,[[{type:'ANCIENT_WALL'}]]);
});
