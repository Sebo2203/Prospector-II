const {gameUrl,artifactPath,fixtureFile}=require('./runtime.cjs');
const {chromium}=require('./runtime.cjs'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),{pathToFileURL}=require('node:url');
(async()=>{
 const browser=await chromium.launch({headless:true}),page=await browser.newPage({viewport:{width:1400,height:720}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route(/^https?:/,r=>r.abort());await page.goto(gameUrl);await page.waitForFunction(()=>typeof MENU_STATE!=='undefined'&&MENU_STATE.screen==='main');
 await page.evaluate(()=>initGame('LIGHT_SCOUT','Art validation','Legacy'));await page.waitForFunction(()=>G?.galaxy&&G.log.some(e=>e.msg.includes('Ready for departure')));
 const result=await page.evaluate(()=>{
  const hulls=[['player_ship','Light Scout'],['ship_corvette','Corvette'],['ship_freighter','Bulk Freighter'],['ship_trader','Trader'],['ship_cargo','Cargo Ship'],['ship_science','Science Ship'],['ship_patrol','Patrol'],['pirate_ship','Pirate']];
  const directions=[[0,-1,'N'],[1,-1,'NE'],[1,0,'E'],[1,1,'SE'],[0,1,'S'],[-1,1,'SW'],[-1,0,'W'],[-1,-1,'NW']];
  const background=type=>{ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.fillStyle='#04040c';ctx.fillRect(0,0,24,24);if(type==='blue'||type==='pink')DRAW.nebula(ctx,0,0,type,10,10);};
  let cases=0,preserved=0;const roleKeys=new Set(Object.values(SHIP_ROLE_ART).map(a=>a.sprite));
  for(const bg of ['space','blue','pink']){
   background(bg);const before=ctx.getImageData(0,0,24,24).data;drawRadioContact(0,0);const after=ctx.getImageData(0,0,24,24).data;let changed=0,yellow=false;
   for(let y=0;y<24;y++)for(let x=0;x<24;x++){
    const i=(y*24+x)*4;if(before.slice(i,i+4).every((v,c)=>v===after[i+c]))continue;
    if(x<7||x>16||y<4||y>19)throw Error('Radio contact painted outside its small glyph: '+bg);
    changed++;if(after[i]>after[i+1]&&after[i+1]>after[i+2]&&after[i]>150)yellow=true;
   }
   if(!changed||!yellow)throw Error('Radio contact is missing or not yellow: '+bg);
  }
  for(const [base]of hulls)for(const [dx,dy]of directions)for(const bg of ['space','blue','pink'])for(const opacity of [1,0.6]){
   const key=shipDirectionKey(base,dx,dy),image=IMG[key],tile=document.createElement('canvas');tile.width=tile.height=24;tile.getContext('2d').drawImage(image,0,0);const alpha=tile.getContext('2d').getImageData(0,0,24,24).data;
   background(bg);const before=ctx.getImageData(0,0,24,24).data;drawSpriteTinted(key,0,0,'#80dce4',opacity);const after=ctx.getImageData(0,0,24,24).data;
   let changed=0;for(let i=0;i<alpha.length;i+=4){if(!alpha[i+3]){for(let channel=0;channel<4;channel++)if(before[i+channel]!==after[i+channel])throw Error('Background overwritten: '+key+' '+bg);preserved++;}else if(after[i]!==before[i]||after[i+1]!==before[i+1]||after[i+2]!==before[i+2])changed++;}
   if(!changed)throw Error('Invisible ship: '+key);cases++;
  }
  const alphaSample=document.createElement('canvas');alphaSample.width=alphaSample.height=2;const ac=alphaSample.getContext('2d');ac.fillStyle='rgba(255,255,255,0.5)';ac.fillRect(0,0,1,1);ac.fillStyle='#000';ac.fillRect(1,0,1,1);const a=ac.getImageData(0,0,2,2).data,b=tintedSpriteImage(alphaSample,'#80dce4').getContext('2d').getImageData(0,0,2,2).data;for(let i=3;i<a.length;i+=4)if(a[i]!==b[i])throw Error('Source alpha changed');if(b[4]||b[5]||b[6])throw Error('Hull black became a matte');
  ctx.globalAlpha=0.4;ctx.imageSmoothingEnabled=true;drawSpriteTinted('ship_science',0,0,'#80dce4',0.6);if(ctx.globalAlpha!==0.4||ctx.imageSmoothingEnabled!==true)throw Error('Tint changed outer drawing state');ctx.globalAlpha=1;
  const sheet=document.createElement('canvas');sheet.width=1080;sheet.height=830;const s=sheet.getContext('2d');s.imageSmoothingEnabled=false;s.fillStyle='#11151d';s.fillRect(0,0,1080,830);s.font='bold 23px monospace';s.fillStyle='#edf0ed';s.fillText('PROSPECTOR II  /  ORIGINAL SHIP ART, CLEANED',24,35);s.font='13px monospace';s.fillStyle='#a8bac4';s.fillText('Native 24px tiles shown at 3x. Original hulls, original directional frames, transparent compositing.',24,61);
  ['SPACE','BLUE NEBULA','PINK NEBULA','ROLE TINT','NATIVE SIZE','ORIGINAL DIRECTIONS'].forEach((label,i)=>s.fillText(label,[190,310,440,570,695,810][i],94));
  for(let i=0;i<hulls.length;i++){
   const [base,label]=hulls[i],y=110+i*87;s.fillStyle='#edf0ed';s.font='15px monospace';s.fillText(label,24,y+40);
   for(let col=0;col<4;col++){background(col===1?'blue':col===2||col===3?'pink':'space');if(col===3)drawSpriteTinted(base,0,0,base==='pirate_ship'?'#cc6655':Object.values(SHIP_ROLE_ART).find(r=>r.sprite===base)?.tint||'#9fc0d4');else drawSprite(base,0,0);s.drawImage(canvas,0,0,24,24,190+col*125,y,72,72);}
   background('space');drawSprite(base,0,0);s.drawImage(canvas,0,0,24,24,716,y+24,24,24);
   for(let d=0;d<directions.length;d++){const [dx,dy]=directions[d];background('space');drawDirectionalShip(base,0,0,dx,dy);s.drawImage(canvas,0,0,24,24,805+(d%4)*57,y+Math.floor(d/4)*38,32,32);}
  }
  return {image:sheet.toDataURL(),cases,preserved,roles:roleKeys.size};
 });
 fs.writeFileSync(artifactPath('Prospector-II-ship-art-preview.png'),Buffer.from(result.image.split(',')[1],'base64'));delete result.image;
 const integration=await page.evaluate(()=>{
  debugEnterPalette('galaxy');debugPaletteVisit('galaxy:TRADER');G.ship.x-=2;G.ship.y-=2;
  const before={turn:G.turn,credits:G.credits,fuel:G.fuel,hp:G.ship.hp,crew:JSON.stringify(G.crew)};
  const original=ctx.drawImage,calls=[];ctx.drawImage=function(image,...args){calls.push(image);return original.call(this,image,...args);};
  for(const [dx,dy]of [[0,-1],[1,-1],[1,0],[1,1],[0,1],[-1,1],[-1,0],[-1,-1]]){G.ship.facing={dx,dy};calls.length=0;drawGalaxy();if(!calls.includes(IMG[shipDirectionKey('ship_freighter',dx,dy)]))throw Error('Player frame not used in galaxy');}
  for(const type of Object.keys(SHIP_ROLE_ART)){
   const art=neutralShipArt({type}),npc=G.neutralShips.find(n=>n.type===type);if(!npc)throw Error('Palette role missing');
   debugPaletteVisit('galaxy:'+({trader:'TRADER',cargo:'CARGO_SHIP',science:'SCIENCE_SHIP',patrol:'PATROL'}[type]));G.ship.x-=1;calls.length=0;drawGalaxy();if(!calls.includes(tintedSpriteImage(IMG[art.sprite],art.tint)))throw Error('Role hull missing on galaxy');
   startShipCombat(npc);calls.length=0;drawShipCombatOverlay();if(!calls.includes(tintedSpriteImage(IMG[art.sprite],art.tint)))throw Error('Combat role differs from map');G.mode='galaxy';G.shipCombat=null;
  }
  // Independent fog/radio scenario: no role silhouette leaks beyond sensor range.
  const sample=G.neutralShips.find(n=>n.type==='science');G.neutralShips=[sample];G.pirates=[];DEBUG.fullVision=false;G.shipStats.sensorRange=1;G.ship.x=sample.x-3;G.ship.y=sample.y;G.visited.fill(true);calls.length=0;drawGalaxy();const art=neutralShipArt(sample);if(calls.includes(tintedSpriteImage(IMG[art.sprite],art.tint)))throw Error('Role silhouette leaked beyond sensors');
  G.ship.x=sample.x-1;calls.length=0;drawGalaxy();if(!calls.includes(tintedSpriteImage(IMG[art.sprite],art.tint)))throw Error('Role missing within sensors');ctx.drawImage=original;
  OPTIONS.asciiMode=true;drawGalaxy();OPTIONS.asciiMode=false;debugReturnFromPalette();
  return {checks:['all eight player headings in native galaxy renderer','all four palette civilian silhouettes','matching role hull in native ship combat','unknown contacts retain sensor/radio concealment','ASCII mode renders','palette restores career'],errors:[]};
 });
 await page.evaluate(()=>{debugEnterPalette('galaxy');debugPaletteVisit('galaxy:TRADER');G.ship.x-=3;G.ship.y-=1;DEBUG.fullVision=true;renderAll();});await page.screenshot({path:artifactPath('Prospector-II-galaxy-art.png')});
 await page.evaluate(()=>{DEBUG.fullVision=false;G.shipStats.sensorRange=1;renderAll();});await page.screenshot({path:artifactPath('Prospector-II-radio-contacts.png')});
 assert.deepEqual(errors,[]);console.log(JSON.stringify({...result,integration,errors},null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
