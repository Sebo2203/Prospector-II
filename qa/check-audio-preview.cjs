// Optional check of an already-generated local audition page; no network/assets are fetched.
const assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const {chromium,root}=require('./runtime.cjs');
const file=process.argv[2],count=Number(process.argv[3]);
if(!file||!Number.isInteger(count)||count<2)throw Error('Usage: node qa/check-audio-preview.cjs outputs/page.html expectedClipCount');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route(/^https?:/,r=>r.abort());await page.goto(pathToFileURL(path.resolve(root,file)).href);
  const clips=await page.evaluate(async()=>{
   const ac=new AudioContext(),reports=[];
   for(const audio of document.querySelectorAll('audio')){
    const bytes=Uint8Array.from(atob(audio.src.split(',')[1]),c=>c.charCodeAt(0));
    const buffer=await ac.decodeAudioData(bytes.buffer);
    reports.push({id:audio.dataset.id,seconds:buffer.duration,channels:buffer.numberOfChannels});
   }await ac.close();return reports;
  });
  assert.equal(clips.length,count);assert.ok(clips.every(c=>c.seconds>0));
  assert.equal(new Set(clips.map(c=>c.id)).size,count);
  await page.getByRole('heading',{level:1}).click();
  assert.deepEqual(await page.evaluate(async()=>{
   const [first,second]=document.querySelectorAll('audio');await first.play();await second.play();
   const state=[first.paused,first.currentTime,!second.paused];second.pause();return state;
  }),[true,0,true]);
  assert.ok(await page.evaluate(()=>{
   const volume=document.getElementById('volume');volume.value='0.35';volume.dispatchEvent(new Event('input'));
   return [...document.querySelectorAll('audio')].every(a=>Math.abs(a.volume-0.35)<0.001);
  }));assert.deepEqual(errors,[]);
  console.log(JSON.stringify({check:'PASS: offline decoding, unique labels, one-at-a-time playback and shared volume',clips}));
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
