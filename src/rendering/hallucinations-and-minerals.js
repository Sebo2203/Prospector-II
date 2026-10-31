function hallucinationActivePower(){
  if(!G || G.mode !== 'planet') return 0;
  const power = crewStatusPower('hallucination');
  if(power > 0) return power;
  if((G.perception?.hallucinationUntil || 0) >= (G.turn || 1)) return 1;
  return 0;
}

function hallucinationHash(x, y, salt=0){
  const t = Math.floor((G?.turn || 1) / 3);
  const raw = Math.sin((x + 17) * 12.9898 + (y + 31) * 78.233 + (t + salt) * 37.719) * 43758.5453;
  return raw - Math.floor(raw);
}

function hallucinationAt(pdata, x, y, power=hallucinationActivePower(), allowPlayerTile=false){
  if(!pdata || power <= 0) return null;
  if(!allowPlayerTile && x === G.player?.x && y === G.player?.y) return null;
  const W = PW(pdata);
  if(!pdata.visited?.[y*W+x]) return null;
  const cell = pdata.grid?.[y]?.[x];
  if(!cell || !TILE[cell.type]?.pass) return null;
  if(['SHIP','MINERAL','MINERAL_SAMPLE','ARTIFACT','BIODATA','NEST','CAVE_NEST','EARTH_WATER'].includes(cell.type)) return null;
  const key = Math.floor((G.turn || 1) / 3)+':'+x+','+y;
  if(pdata.dismissedHallucinations?.[key]) return null;
  if(isHallucinogenicWorld(pdata) && power >= 3 && hallucinationHash(x, y, 31) < 0.008 + power * 0.003){
    return { type:'SHIP', label:'ship landing tile' };
  }
  const chance = 0.006 + power * 0.006;
  if(hallucinationHash(x, y, power) > chance) return null;
  const kindRoll = hallucinationHash(x, y, 9);
  if(kindRoll < 0.38) return { type:'BIODATA', label:'biodata sample' };
  if(kindRoll < 0.64) return { type:'MINERAL', label:'mineral sample' };
  if(kindRoll < 0.83) return { type:'ARTIFACT', label:'artifact' };
  return { type:'creature', label:'movement' };
}

function noteHallucinationMismatchAt(x, y){
  const pdata = G.planets?.[G.curPlanet];
  const h = hallucinationAt(pdata, x, y, hallucinationActivePower(), true);
  if(!h) return false;
  const key = Math.floor((G.turn || 1) / 3)+':'+x+','+y;
  if(!pdata.dismissedHallucinations) pdata.dismissedHallucinations = {};
  pdata.dismissedHallucinations[key] = true;
  if(Math.random() < 0.8){
    addLog(pick([
      'There is nothing there.',
      'The contact vanishes when you get close.',
      'The instruments show empty ground.',
      'For a moment, the shape is gone.',
    ]),'li');
  }
  return true;
}

function scientistBiodataReaction(){
  const scientist = (G.crew||[]).find(c=>c.hp>0 && c.role==='scientist');
  if(!scientist) return;
  const bloom = atmosphereBiomeKey(G.curPlanet) === 'BLOOM';
  if(!bloom){
    G.scientistBiodataCommentCount = (G.scientistBiodataCommentCount || 0) + 1;
    if(G.scientistBiodataCommentCount % 10 !== 0) return;
  }
  const line = bloom
    ? pick([
      '"This is not just unusual. This is rewriting every assumption I had."',
      '"The biochemistry is unheard of. Keep samples coming, Captain."',
      '"Do you understand what this means? No, of course you do not. I barely do."',
    ])
    : pick([
      '"This will be a very interesting find. The biochemistry is unheard of."',
      '"Worth preserving. There is a whole paper hiding in this sample."',
      '"Careful with that container. I want it alive enough to study."',
    ]);
  addLog(crewDisplayName(scientist)+': '+line, bloom ? 'lm' : 'li');
}

function drawHallucinationOverlay(h, sx, sy, bg){
  if(!h) return;
  if(h.type === 'creature'){
    const sp = hallucinationHash(sx, sy, 11) < 0.5 ? 'creature_crawler' : 'creature_floater';
    if(OPTIONS.asciiMode) drawAsciiTile(sp, sx, sy, bg, '#88dd66');
    else drawSprite(sp, sx, sy, '#88dd66');
    return;
  }
  const tileInfo = TILE[h.type];
  if(OPTIONS.asciiMode) drawAsciiTile(h.type, sx, sy, bg);
  else if(h.type === 'SHIP') drawSpriteDarkMatteKeyed('ship_tile', sx, sy, '#aaaacc');
  else if(tileInfo?.sprite) drawSpriteDarkMatteKeyed(tileInfo.sprite, sx, sy, '#888');
}

function drawHallucinationFloorShift(x, y, sx, sy, power){
  if(power < 3 || OPTIONS.asciiMode) return;
  const roll = hallucinationHash(x, y, 21);
  if(roll > 0.055 + power * 0.018) return;
  const cols = ['rgba(255,80,180,0.28)','rgba(120,220,255,0.24)','rgba(255,230,80,0.22)','rgba(180,110,255,0.24)'];
  const col = cols[Math.floor(hallucinationHash(x, y, 22) * cols.length) % cols.length];
  ctx.save();
  ctx.fillStyle = col;
  ctx.fillRect(sx, sy, TS, TS);
  ctx.fillStyle = 'rgba(255,255,255,0.28)';
  const gx = sx + 3 + Math.floor(hallucinationHash(x, y, 23) * 16);
  const gy = sy + 3 + Math.floor(hallucinationHash(x, y, 24) * 16);
  ctx.fillRect(gx, gy, 2, 2);
  ctx.restore();
}

function drawMineralSample(c, x, y, cell){
  const stype = cell?._sampleType;
  const oreSymbol = stype?.oreSymbol;
  const col = stype?.col || '#cc8800';
  // Derive darker shade for rock body
  const bodyCol = col.replace(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i, (_,r,g,b)=>{
    const d = v => Math.round(parseInt(v,16)*0.55).toString(16).padStart(2,'0');
    return '#'+d(r)+d(g)+d(b);
  });
  // Shadow
  c.fillStyle='rgba(0,0,0,0.35)';
  c.fillRect(x+8, y+14, 9, 3);
  // Small rock body
  c.fillStyle=bodyCol;
  c.fillRect(x+8,  y+9,  9, 6);
  c.fillRect(x+10, y+8,  5, 2);
  // Highlight facet
  c.fillStyle=col;
  c.fillRect(x+9,  y+9,  4, 3);
  c.fillRect(x+11, y+8,  2, 1);
  // Ore symbol or generic glint
  if(oreSymbol){
    c.font='bold 6px Courier New';
    c.textAlign='center';
    c.fillStyle='rgba(0,0,0,0.7)';
    c.fillText(oreSymbol, x+12, y+14);
    c.fillStyle='#ffffff';
    c.fillText(oreSymbol, x+12, y+13);
    c.textAlign='left';
  } else {
    // Generic white glint for geological samples
    c.fillStyle='#fff7cc';
    c.fillRect(x+10, y+10, 2, 2);
  }
}

function drawOreDeposit(c, x, y, oreKey){
  const ore = ORE_TYPES[oreKey||'fe'] || ORE_TYPES.fe;
  const col    = ore.col;
  // Derive a darker shade for the rock body (multiply each channel ~0.45)
  const bodyCol = col.replace(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i, (_,r,g,b)=>{
    const d = v => Math.round(parseInt(v,16)*0.45).toString(16).padStart(2,'0');
    return '#'+d(r)+d(g)+d(b);
  });
  // Shadow
  c.fillStyle='rgba(0,0,0,0.4)';
  c.fillRect(x+5,y+14,14,4);
  // Rock body — chunky irregular shape
  c.fillStyle=bodyCol;
  c.fillRect(x+5, y+8,  14, 9);
  c.fillRect(x+7, y+6,  10, 3);
  c.fillRect(x+4, y+10,  3, 5);
  c.fillRect(x+17,y+10,  3, 4);
  // Mid highlight facets
  c.fillStyle=col;
  c.fillRect(x+7, y+8,  5, 4);
  c.fillRect(x+13,y+9,  3, 3);
  c.fillRect(x+9, y+6,  4, 2);
  // Dark crack lines
  c.fillStyle='rgba(0,0,0,0.55)';
  c.fillRect(x+11,y+8,  1, 5);
  c.fillRect(x+7, y+11, 5, 1);
  // Element symbol label — small, centred on the cluster
  c.font='bold 7px Courier New';
  c.textAlign='center';
  c.fillStyle='rgba(0,0,0,0.75)';
  c.fillText(ore.sym, x+12, y+14);   // shadow
  c.fillStyle='#ffffff';
  c.fillText(ore.sym, x+12, y+13);   // label
  c.textAlign='left';
}

