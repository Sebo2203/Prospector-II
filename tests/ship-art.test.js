const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const zlib=require('node:zlib');
const {extractFrame,readBitmap,generateShipAssets}=require('../tools/import-prospector-ships');

test('all eight hulls have eight bounded native frames without a magenta matte',()=>{
  const context=vm.createContext({});vm.runInContext(generateShipAssets()+'\nthis.sprites=SHIP_SPRITES_B64;',context);
  assert.equal(Object.keys(context.sprites).length,64);
  for(const [key,url]of Object.entries(context.sprites)){
    const png=Buffer.from(url.split(',')[1],'base64');
    assert.equal(png.readUInt32BE(16),24,key);assert.equal(png.readUInt32BE(20),24,key);
    const length=png.readUInt32BE(33),rows=zlib.inflateSync(png.subarray(41,41+length));
    let opaque=0,clear=0;
    for(let y=0;y<24;y++)for(let x=0;x<24;x++){
      const i=y*97+1+x*4,[r,g,b,a]=rows.subarray(i,i+4);
      if(!a)clear++;else{opaque++;assert.ok(!(r===255&&g===0&&b===255),key);}
    }
    assert.ok(clear>100&&opaque>20,key);
  }
});

test('original import removes the boundary matte while preserving hull blacks and interior colors',()=>{
  const pixels=new Uint8Array(24*24*4);
  for(let i=0;i<pixels.length;i+=4)pixels.set([255,0,255,255],i);
  for(let y=5;y<10;y++)for(let x=5;x<10;x++)pixels.set([80,80,80,255],(y*24+x)*4);
  pixels.set([0,0,0,255],(5*24+5)*4);
  pixels.set([160,80,160,255],(5*24+6)*4);
  pixels.set([160,80,160,255],(7*24+7)*4);
  pixels.set([255,0,0,255],(22*24+22)*4);
  pixels.set([255,180,0,255],(11*24+7)*4);
  const frame=extractFrame({width:24,height:24,pixels},0,0),pixel=(x,y)=>[...frame.slice((y*24+x)*4,(y*24+x)*4+4)];
  assert.deepEqual(pixel(0,0),[0,0,0,0]);assert.deepEqual(pixel(5,5),[0,0,0,255]);
  const edge=pixel(6,5);assert.equal(edge[0],edge[1]);assert.equal(edge[1],edge[2]);assert.equal(edge[3],175);
  assert.deepEqual(pixel(7,7),[160,80,160,255]);
  assert.deepEqual(pixel(22,22),[0,0,0,0]);
  assert.deepEqual(pixel(7,11),[255,180,0,255]);
  assert.throws(()=>extractFrame({width:24,height:24,pixels},1,0),/outside bitmap/);
  assert.throws(()=>readBitmap(Buffer.from('BM')),/Expected/);
});

test('direction frames preserve compass headings, fallback keys and distinct civilian silhouettes',()=>{
  const context=vm.createContext({});
  vm.runInContext(generateShipAssets()+fs.readFileSync(path.join(__dirname,'../src/rendering/ship-art.js'),'utf8'),context);
  for(const [dx,dy,suffix]of [[0,-1,''],[1,-1,'_ne'],[1,0,'_e'],[1,1,'_se'],[0,1,'_s'],[-1,1,'_sw'],[-1,0,'_w'],[-1,-1,'_nw']]){
    assert.equal(context.shipDirectionKey('player_ship',dx,dy),'player_ship'+suffix);
  }
  assert.equal(context.shipDirectionKey('player_ship',0,0),'player_ship');
  assert.equal(context.shipDirectionKey('future_ship',1,1),'future_ship');
  const roles=['trader','cargo','science','patrol'].map(type=>context.neutralShipArt({type}).sprite);
  assert.equal(new Set(roles).size,4);
  assert.equal(context.neutralShipArt({type:'future'}).sprite,'pirate_ship');
});

test('checked-in ship sprites reproduce from the retained original sheets',()=>{
  assert.equal(fs.readFileSync(path.join(__dirname,'../src/assets/ship-sprites.js'),'utf8').replace(/\r\n/g,'\n'),generateShipAssets());
});
