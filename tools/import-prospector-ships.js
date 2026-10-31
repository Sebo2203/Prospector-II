// Import the original 24px direction frames without resampling their pixel work.
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');

const root = path.resolve(__dirname, '..');
const SHIP_IMPORTS = {
  player_ship:    {sheet:'ships', row:0},
  ship_corvette:  {sheet:'ships', row:3},
  ship_freighter: {sheet:'ships', row:12},
  pirate_ship:    {sheet:'ships2',row:0},
  ship_trader:    {sheet:'ships', row:7},
  ship_cargo:     {sheet:'ships', row:15},
  ship_science:   {sheet:'ships', row:8},
  ship_patrol:    {sheet:'ships', row:9},
};
// Original number-pad ordering; column 4 is a separate parked/portrait frame.
const SHIP_COLUMNS = {sw:0,s:1,se:2,w:3,e:5,nw:6,n:7,ne:8};

function readBitmap(buffer){
  if(buffer.length<54 || buffer.toString('ascii',0,2)!=='BM' || buffer.readUInt32LE(14)!==40 ||
    buffer.readUInt16LE(28)!==24 || buffer.readUInt32LE(30)!==0) throw Error('Expected uncompressed 24-bit BMP');
  const width=buffer.readInt32LE(18),height=buffer.readInt32LE(22),offset=buffer.readUInt32LE(10);
  const stride=Math.ceil(width*3/4)*4;
  if(width<=0 || height<=0 || offset+stride*height>buffer.length)throw Error('Invalid BMP dimensions or length');
  const pixels=new Uint8Array(width*height*4);
  for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const source=offset+(height-1-y)*stride+x*3,dest=(y*width+x)*4;
    pixels.set([buffer[source+2],buffer[source+1],buffer[source],255],dest);
  }
  return {width,height,pixels};
}

function extractFrame(bitmap,col,row){
  const size=24,{width,height,pixels}=bitmap;
  if(col<0 || row<0 || (col+1)*size>width || (row+1)*size>height)throw Error('Ship frame outside bitmap');
  const result=new Uint8Array(size*size*4);
  const isMatte=(x,y)=>{
    if(x<0||y<0||x>=size||y>=size)return true;
    const p=((row*size+y)*width+col*size+x)*4;
    return pixels[p]===255&&pixels[p+1]===0&&pixels[p+2]===255;
  };
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const p=((row*size+y)*width+col*size+x)*4,d=(y*size+x)*4;
    if(isMatte(x,y))continue;
    const [r,g,b]=pixels.subarray(p,p+3);
    const edge=[[-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1]].some(([dx,dy])=>isMatte(x+dx,y+dy));
    // Undo magenta mixed into boundary pixels by the original rasterization.
    // Restrict it to the matte boundary; interior colors and black hull detail stay intact.
    const matte=edge?Math.max(0,Math.min(r-g,b-g))/255:0;
    const alpha=1-matte;
    result.set(alpha>0?[
      Math.round(Math.max(0,(r-255*matte)/alpha)),
      Math.round(g/alpha),
      Math.round(Math.max(0,(b-255*matte)/alpha)),
      Math.round(alpha*255),
    ]:[0,0,0,0],d);
  }
  // Some atlas cells contain one-pixel exhaust spill from a neighboring frame.
  // Remove only tiny, disconnected fragments away from the hull. Nearby lamps,
  // antennae and detached exhaust tips retain their original pixels.
  const seen=new Set(),components=[];
  for(let index=0;index<size*size;index++){
    if(seen.has(index)||!result[index*4+3])continue;
    const component=[index];seen.add(index);
    for(let i=0;i<component.length;i++){
      const x=component[i]%size,y=Math.floor(component[i]/size);
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const xx=x+dx,yy=y+dy,next=yy*size+xx;
        if(xx<0||xx>=size||yy<0||yy>=size||seen.has(next)||!result[next*4+3])continue;
        seen.add(next);component.push(next);
      }
    }
    components.push(component);
  }
  const hull=components.sort((a,b)=>b.length-a.length)[0]||[];
  for(const component of components.slice(1))if(component.length<=3 && !component.some(p=>hull.some(q=>
    Math.max(Math.abs(p%size-q%size),Math.abs(Math.floor(p/size)-Math.floor(q/size)))<=2))){
    for(const p of component)result.fill(0,p*4,p*4+4);
  }
  return result;
}

function crc32(buffer){
  let crc=0xffffffff;
  for(const byte of buffer){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
  return (crc^0xffffffff)>>>0;
}
function pngChunk(type,data){
  const name=Buffer.from(type),length=Buffer.alloc(4),crc=Buffer.alloc(4);
  length.writeUInt32BE(data.length);crc.writeUInt32BE(crc32(Buffer.concat([name,data])));
  return Buffer.concat([length,name,data,crc]);
}
function encodeFrame(pixels){
  const header=Buffer.alloc(13);header.writeUInt32BE(24,0);header.writeUInt32BE(24,4);header[8]=8;header[9]=6;
  const rows=Buffer.alloc(24*(1+24*4));
  for(let y=0;y<24;y++)Buffer.from(pixels.subarray(y*96,(y+1)*96)).copy(rows,y*97+1);
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),pngChunk('IHDR',header),
    pngChunk('IDAT',zlib.deflateSync(rows,{level:9})),pngChunk('IEND',Buffer.alloc(0))]);
}
function generateShipAssets(){
  const sheets={};
  for(const name of ['ships','ships2'])sheets[name]=readBitmap(fs.readFileSync(path.join(root,'art/source/prospector',name+'.bmp')));
  const sprites={};
  for(const [key,{sheet,row}]of Object.entries(SHIP_IMPORTS))for(const [direction,col]of Object.entries(SHIP_COLUMNS)){
    const name=direction==='n'?key:key+'_'+direction;
    sprites[name]='data:image/png;base64,'+encodeFrame(extractFrame(sheets[sheet],col,row)).toString('base64');
  }
  return '// Generated by tools/import-prospector-ships.js. Source/credits: docs/art-direction.md.\n'+
    'const SHIP_SPRITES_B64 = '+JSON.stringify(sprites,null,2)+';\n';
}
if(require.main===module){
  const output=path.join(root,'src/assets/ship-sprites.js'),source=generateShipAssets();
  if(process.argv.includes('--check')){
    if(fs.readFileSync(output,'utf8').replace(/\r\n/g,'\n')!==source)throw Error('Ship assets are out of date');
    console.log('Ship assets match the original source sheets and importer.');
  }else{fs.writeFileSync(output,source);console.log('Imported 64 native direction frames.');}
}
module.exports={SHIP_IMPORTS,SHIP_COLUMNS,readBitmap,extractFrame,encodeFrame,generateShipAssets};
