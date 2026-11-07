const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {readBitmap}=require('../tools/import-prospector-ships.js');
const {plasmaFrame,generatePlasmaAssets}=require('../tools/import-prospector-plasma.js');
test('original plasma import retains its verified source, colored pixels and transparent matte',()=>{
  const bytes=fs.readFileSync(path.join(__dirname,'../art/source/prospector/space.bmp'));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),'d236ffd3f1d5d8ad58386baa3468c74d412543aa55a3a4977b4f24670a87aa24');
  const bitmap=readBitmap(bytes),counts=[];
  for(let frame=0;frame<4;frame++){
    const pixels=plasmaFrame(bitmap,frame);let visible=0;
    for(let pixel=0;pixel<24*24;pixel++){
      const source=((120+Math.floor(pixel/24))*bitmap.width+frame*24+pixel%24)*4;
      const original=[...bitmap.pixels.slice(source,source+4)],actual=[...pixels.slice(pixel*4,pixel*4+4)];
      if(original[0]===255 && original[1]===0 && original[2]===255)assert.equal(actual[3],0);
      else{assert.deepEqual(actual,original);visible++;}
    }
    assert.ok(visible>0 && visible<24*24);counts.push(visible);
  }
  assert.ok(counts[0]>counts[3],'the original fading sprites have a smaller visible footprint');
  assert.equal(fs.readFileSync(path.join(__dirname,'../src/assets/combat-sprites.js'),'utf8').replace(/\r\n/g,'\n'),generatePlasmaAssets());
});
