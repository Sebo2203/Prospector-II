const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {generateAudioAssets,ORIGINAL_AUDIO,verifyAudio}=require('../tools/import-prospector-audio.js');
test('the offline audio catalog retains the original pain bytes and only the selected audition choices',()=>{
  const raw=fs.readFileSync(path.join(__dirname,'../art/source/prospector/audio/pain.wav'));
  assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),'5161536e60a37fabbc71e92c3d1cb9d60d43052c7466cb5a91438ea9c32dccb3');
  const generated=generateAudioAssets();
  assert.equal(fs.readFileSync(path.join(__dirname,'../src/assets/audio-samples.js'),'utf8').replace(/\r\n/g,'\n'),generated);
  const samples=JSON.parse(generated.match(/const AUDIO_SAMPLES = ([\s\S]*);\n/)[1]);
  const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'../art/source/audio/catalog.json'),'utf8'));
  assert.equal(catalog.length,24);assert.equal(Object.keys(samples).length,24);
  assert.deepEqual(catalog.filter(e=>/^C/.test(e.choice)).map(e=>e.choice).sort(),['C1','C2','C3','C4','C5','C6','C7-A','C8-D','C9-B','C10-B','C11','C12-A','C12-B'].sort());
  assert.deepEqual(Buffer.from(samples.crewPain.split(',')[1],'base64'),raw);
  for(const entry of catalog){
    const bytes=Buffer.from(samples[entry.id].split(',')[1],'base64');
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),entry.sha256);
    assert.deepEqual(bytes,fs.readFileSync(path.join(__dirname,'..',entry.path)));
  }
  for(const entry of ORIGINAL_AUDIO)verifyAudio(fs.readFileSync(path.join(__dirname,'../art/source/prospector/audio',entry.file)),entry);
});
