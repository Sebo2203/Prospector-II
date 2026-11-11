// Optional art-preparation step. Normal builds consume the checked-in native PNGs.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('../qa/runtime.cjs');
const folder=path.resolve(__dirname,'../art/source/generated/combat-asteroids-v1');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage();
  for(const [shape,width,height]of [['horizontal',48,24],['vertical',24,48],['square',48,48]]){
   const source=fs.readFileSync(path.join(folder,shape+'-source.png')).toString('base64');
   const result=await page.evaluate(async({source,width,height})=>{
    const image=new Image();image.src='data:image/png;base64,'+source;await image.decode();
    const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
    const paint=canvas.getContext('2d');paint.drawImage(image,0,0);
    const pixels=paint.getImageData(0,0,canvas.width,canvas.height).data;
    let left=canvas.width,top=canvas.height,right=-1,bottom=-1,clear=0;
    for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++){
     if(pixels[(y*canvas.width+x)*4+3]===0){clear++;continue;}
     left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
    }
    if(!clear||right<left)throw Error('Generated asteroid must have genuine transparency and visible stone');
    const sw=right-left+1,sh=bottom-top+1,scale=Math.min((width-4)/sw,(height-4)/sh);
    const dw=Math.round(sw*scale),dh=Math.round(sh*scale);
    canvas.width=width;canvas.height=height;paint.imageSmoothingEnabled=false;
    paint.drawImage(image,left,top,sw,sh,Math.floor((width-dw)/2),Math.floor((height-dh)/2),dw,dh);
    return {png:canvas.toDataURL('image/png').split(',')[1],bounds:[sw,sh],content:[dw,dh]};
   },{source,width,height});
   const name='asteroid-'+width/24+'x'+height/24+'.png';
   fs.writeFileSync(path.join(folder,name),Buffer.from(result.png,'base64'));
   console.log(name+': alpha crop '+result.bounds.join('x')+' -> '+result.content.join('x')+' on '+width+'x'+height+' transparent canvas');
  }
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
