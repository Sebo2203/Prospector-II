const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('../qa/runtime.cjs');
const folder=path.resolve(__dirname,'../art/source/generated/nebula-cloud-v2');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage(),source=fs.readFileSync(path.join(folder,'cloud-source.png')).toString('base64');
  const png=await page.evaluate(async source=>{
   const image=new Image();image.src='data:image/png;base64,'+source;await image.decode();
   const scale=Math.min(384/image.width,192/image.height),canvas=document.createElement('canvas');
   canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);
   const paint=canvas.getContext('2d');paint.imageSmoothingEnabled=false;paint.drawImage(image,0,0,canvas.width,canvas.height);
   return canvas.toDataURL('image/png').split(',')[1];
  },source);
  fs.writeFileSync(path.join(folder,'cloud.png'),Buffer.from(png,'base64'));console.log('Prepared approved pixel-art nebula texture with nearest-neighbor sampling.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
