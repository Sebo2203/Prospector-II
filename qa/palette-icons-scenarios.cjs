const {gameUrl,artifactPath,fixtureFile}=require('./runtime.cjs');
const {chromium}=require('./runtime.cjs'),fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
(async()=>{const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);await page.waitForFunction(()=>MENU_STATE.screen==='main');await page.evaluate(()=>initGame('LIGHT_SCOUT','Palette icon QA','Career'));await page.waitForFunction(()=>G?.galaxy&&G.log.some(e=>e.msg.includes('Ready for departure')));
await page.evaluate(source=>{window.baselineOrbit=(new Function(source+'\nreturn drawSystemView;'))();},fs.readFileSync(fixtureFile('palette-orbit-baseline.js'),'utf8'));
const report=await page.evaluate(()=>{
 let orbitCases=0;const snapshots=[];for(const biome of Object.keys(BIOMES))for(const scanState of ['none','failed','partial','full']){
  const original=G.galaxy[G.ship.y][G.ship.x];G.mode='system';G.curSystem=G.ship.x+','+G.ship.y;G.selPlanet=0;G.selMoon=-1;
  const body=debugPaletteDescriptor(biome,biome+' test');body.scanState=scanState;G.galaxy[G.ship.y][G.ship.x]={type:'SYSTEM',name:'Orbit comparison',starType:'YELLOW',planets:[body]};
  const render=fn=>{ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.lineWidth=1;ctx.lineCap='butt';ctx.lineJoin='miter';ctx.textBaseline='alphabetic';ctx.globalCompositeOperation='source-over';fn();const result=ctx.getImageData(0,0,610,canvas.height).data;ctx.restore();return result;};
  // Compare the orbital art left of the reading panel; corrected readings have separate behavioral coverage.
  const before=render(baselineOrbit),after=render(drawSystemView);for(let i=0;i<before.length;i++)if(before[i]!==after[i])throw Error('Orbit art changed: '+biome+' '+scanState+' at '+i);orbitCases++;G.galaxy[G.ship.y][G.ship.x]=original;
 }
 G.mode='galaxy';const career=serializeCareer(G);debugEnterPalette('galaxy');
 const entries=G.debugPalette.entries.filter(e=>!e.key),biomes=entries.filter(e=>e.kind==='biome'),civs=entries.filter(e=>e.kind==='civilization');
 const nativeCasino=DRAW.casino,nativeStar=drawSystemTile,nativeBody=drawSystemBodyIcon;let casinoCalls=0,starCalls=0,bodyCalls=0;
 DRAW.casino=(...a)=>{casinoCalls++;return nativeCasino(...a)};drawSystemTile=(...a)=>{starCalls++;return nativeStar(...a)};drawSystemBodyIcon=(...a)=>{bodyCalls++;return nativeBody(...a)};
 const expected=biomes.filter(e=>!['CASINO','DERELICT','CAVE','ANCIENT_STATION'].includes(e.biome)).length+civs.length;
 // Intercept normal draw routes: stars remain stars; biome bodies use orbital art.
 G.ship.x=biomes[0].x-1;G.ship.y=biomes[0].y;drawGalaxy();if(!bodyCalls)throw Error('No orbital body previews used');
 for(const id of ['galaxy:CASINO','biome:CASINO']){
  const e=entries.find(e=>e.id===id);if(G.galaxy[e.y][e.x].type!=='CASINO')throw Error('Casino is still a system');
  debugPaletteVisit(id);G.ship.x-=1;casinoCalls=0;drawGalaxy();if(!casinoCalls)throw Error('Casino art not used');G.ship.x=e.x;doInteract();if(!G.planets[G.curPlanet]?.isCasino||G.curPlanet!=='casino:'+e.x+','+e.y)throw Error('Wrong casino deck');snapshots.push({id,mode:G.mode,key:G.curPlanet});
 }
 for(const e of biomes){debugPaletteVisit(e.id);const kind=G.galaxy[e.y][e.x].type;doInteract();if(e.biome==='CASINO'){if(!G.planets[G.curPlanet]?.isCasino)throw Error('Casino did not board');}else if(e.biome==='DERELICT'){if(!G.planets[G.curPlanet]?.isDerelict||G.curPlanet!==e.x+','+e.y)throw Error('Derelict did not board');}else{if(G.mode!=='system')throw Error('Planet lost orbit controls: '+e.biome);if(e.biome!=='GAS_GIANT'){doInteract();if(G.mode!=='planet')throw Error('Could not land: '+e.biome);}}
 }
 // Every catalog entry renders from its map position, including civilization worlds.
 for(const e of entries){debugPaletteNavigateHome('galaxy');G.ship.x=Math.max(1,e.x-1);G.ship.y=e.y;drawGalaxy();}
 OPTIONS.asciiMode=true;for(const e of biomes){debugPaletteNavigateHome('galaxy');G.ship.x=e.x-1;G.ship.y=e.y;drawGalaxy();}OPTIONS.asciiMode=false;
 DRAW.casino=nativeCasino;drawSystemTile=nativeStar;drawSystemBodyIcon=nativeBody;
 const sheet=document.createElement('canvas');sheet.width=1040;sheet.height=390;const s=sheet.getContext('2d');s.imageSmoothingEnabled=false;s.fillStyle='#11151d';s.fillRect(0,0,1040,390);s.fillStyle='#ecf0ee';s.font='bold 22px monospace';s.fillText('GALAXY PALETTE / MATCHING OBJECT PREVIEWS',22,32);s.font='13px monospace';s.fillStyle='#a8bac4';s.fillText('Casino and derelict art, orbital planet artwork, native station and cave samples.',22,56);
 const samples=['CASINO','DERELICT','HABITABLE','DESERT','FROZEN','VOLCANIC','TOXIC','ASTEROID','GAS_GIANT','RINGWORLD','DESTROYED_RINGWORLD','ANCIENT_STATION','CAVE','NUCLEAR_WAR','BLOOM','ANCIENT'];
 for(let n=0;n<samples.length;n++){const biome=samples[n],e=biomes.find(e=>e.biome===biome);const x=22+n%8*128,y=80+Math.floor(n/8)*142;ctx.fillStyle='#04040c';ctx.fillRect(0,0,24,24);if(biome==='CASINO')DRAW.casino(ctx,0,0);else if(biome==='DERELICT')drawDerelictStation(ctx,0,0);else drawDebugPaletteBodyIcon(G.galaxy[e.y][e.x].planets[0],0,0);s.drawImage(canvas,0,0,24,24,x+12,y,72,72);s.fillStyle='#c9d7e2';s.font='11px monospace';const names=(BIOMES[biome].name||biome).split(' ');let line='',dy=0;for(const w of names){if((line+' '+w).length>18){s.fillText(line,x,y+96+dy);dy+=15;line=w;}else line+=(line?' ':'')+w;}s.fillText(line,x,y+96+dy);}
 debugReturnFromPalette();if(serializeCareer(G)!==career)throw Error('Career changed');
 return{orbitCases,biomeSamples:biomes.length,civilizationSamples:civs.length,galaxySamples:entries.length,nativeDecks:snapshots,checks:['all world entries render','all biome entries board or enter native orbit','actual casino renderer used for both entries','all ASCII biome previews','unchanged orbital art; reading panel checked by crew-balance','exact career restoration'],image:sheet.toDataURL()};
});
fs.writeFileSync(artifactPath('Prospector-II-palette-object-previews.png'),Buffer.from(report.image.split(',')[1],'base64'));delete report.image;
await page.evaluate(()=>{debugEnterPalette('galaxy');const e=G.debugPalette.entries.find(e=>e.id==='biome:CASINO');G.ship.x=e.x-2;G.ship.y=e.y-1;renderAll();});await page.screenshot({path:artifactPath('Prospector-II-galaxy-palette-fixed.png')});assert.deepEqual(errors,[]);report.errors=errors;fs.writeFileSync(artifactPath('palette-icons-validation.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));await browser.close();})().catch(e=>{console.error(e);process.exit(1)});
