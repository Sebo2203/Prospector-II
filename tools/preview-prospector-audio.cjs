// Optional audition tool. Downloads pinned original clips into ignored outputs only.
const fs=require('node:fs'),path=require('node:path');
const {SOURCE_COMMIT,ORIGINAL_AUDIO,verifyAudio}=require('./import-prospector-audio.js');
const root=path.resolve(__dirname,'..'),folder=path.join(root,'outputs/audio-preview');
(async()=>{
  fs.mkdirSync(folder,{recursive:true});const cards=[];
  for(const entry of ORIGINAL_AUDIO){
    const local=path.join(folder,entry.file);let bytes;
    if(fs.existsSync(local))bytes=fs.readFileSync(local);
    else{
      const response=await fetch('https://raw.githubusercontent.com/roguelikes/prospector/'+SOURCE_COMMIT+'/data/'+entry.file);
      if(!response.ok)throw Error('Cannot retrieve '+entry.file+': '+response.status);
      bytes=Buffer.from(await response.arrayBuffer());
    }
    verifyAudio(bytes,entry);fs.writeFileSync(local,bytes);
    cards.push('<article><h2>'+entry.id+' — '+entry.label+'</h2><p>'+entry.file+'</p><audio controls preload="metadata" data-id="'+entry.id+'" src="data:audio/wav;base64,'+bytes.toString('base64')+'"></audio></article>');
  }
  const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">'+
    '<title>Prospector original sound auditions</title><style>body{background:#0c1119;color:#d9e5ee;font:16px system-ui;margin:0;padding:30px;max-width:1100px;margin:auto}h1{color:#9ed3ff}p{color:#a5b7c7;line-height:1.5}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:16px}article{background:#152130;border:1px solid #30475c;padding:18px;border-radius:8px}h2{font-size:18px;margin:0}audio{width:100%}label{display:block;margin:20px 0}a{color:#9ed3ff}</style>'+
    '<h1>Original Prospector sound previews</h1><p>Use W1–W5 and the other labels to assign sounds. Only PAIN has been selected for the game so far; the other clips are auditions. These are the original recordings, with no trimming or pitch changes.</p>'+
    '<label>Preview volume <input id="volume" type="range" min="0" max="1" step="0.05" value="0.65"></label><main>'+cards.join('')+'</main>'+
    '<p><a href="https://github.com/roguelikes/prospector/tree/'+SOURCE_COMMIT+'/data">Pinned original sound files</a></p>'+
    '<script>const clips=[...document.querySelectorAll("audio")],volume=document.getElementById("volume");function setVolume(){for(const a of clips)a.volume=Number(volume.value)}volume.addEventListener("input",setVolume);setVolume();for(const a of clips)a.addEventListener("play",()=>{for(const other of clips)if(other!==a){other.pause();other.currentTime=0}});</script></html>';
  const target=path.join(root,'outputs/Prospector-II-original-sounds-preview-2026-11-12.html');fs.writeFileSync(target,html);
  console.log('Prepared '+ORIGINAL_AUDIO.length+' verified original clips: '+target);
})().catch(error=>{console.error(error);process.exitCode=1;});
