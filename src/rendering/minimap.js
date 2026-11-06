function renderGalaxyMinimap(){
  const mini = document.getElementById('galaxy-minimap');
  drawGalaxyMinimapToCanvas(mini);
  if(document.getElementById('minimap-overlay')?.classList.contains('visible')){
    drawFullGalaxyMap();
  }
}

function drawGalaxyMinimapToCanvas(mini){
  if(!mini) return;
  const mctx = mini.getContext('2d');
  const w = mini.width, h = mini.height;
  mctx.clearRect(0,0,w,h);
  mctx.fillStyle = '#030307';
  mctx.fillRect(0,0,w,h);

  if(!G || !G.galaxy){
    mctx.strokeStyle = '#1a1a2a';
    mctx.strokeRect(0.5,0.5,w-1,h-1);
    return;
  }

  const scale = Math.min((w-6)/MAP_W, (h-6)/MAP_H);
  const mapW = MAP_W * scale;
  const mapH = MAP_H * scale;
  const ox = Math.floor((w - mapW) / 2);
  const oy = Math.floor((h - mapH) / 2);

  mctx.fillStyle = '#05050d';
  mctx.fillRect(ox, oy, Math.ceil(mapW), Math.ceil(mapH));

  for(let y=0; y<MAP_H; y++){
    for(let x=0; x<MAP_W; x++){
      const seen = DEBUG.fullVision || G.visited?.[y*MAP_W+x];
      let col = '#303038';
      const sx = ox + Math.floor(x * scale);
      const sy = oy + Math.floor(y * scale);
      const ex = ox + Math.ceil((x + 1) * scale);
      const ey = oy + Math.ceil((y + 1) * scale);
      const tw = Math.max(1, ex - sx);
      const th = Math.max(1, ey - sy);
      if(!seen){
        mctx.fillStyle = col;
        mctx.fillRect(sx, sy, tw, th);
        continue;
      }
      const cell = G.galaxy[y]?.[x];
      if(!cell) continue;
      col = '#14141f';
      if(cell.type === 'SYSTEM'){
        col = (STAR_TYPES[cell.starType] || STAR_TYPES.YELLOW).col;
      } else if(cell.type === 'BASE'){
        col = '#ffe066';
      } else if(cell.type === 'PIRATE_BASE'){
        const pb = (G.pirateBases||[]).find(b=>b.x===x&&b.y===y);
        col = pb?.destroyed ? '#665544' : '#bb3311';
      } else if(cell.type === 'NEBULA'){
        col = cell.nebulaVariant === 'blue' ? '#2f7fca' : '#8a42aa';
      } else if(cell.type === 'CASINO'){
        col = '#cc44ff';
      } else if(cell.type === 'DERELICT'){
        col = '#6688aa';
      } else if(cell.type === 'BLACK_HOLE'){
        col = '#ff8800';
      } else if(cell.type === 'ROGUE_PLANET'){
        col = '#2a3050';
      } else if(cell.type === 'PULSAR'){
        col = '#00ddaa';
      }
      mctx.fillStyle = col;
      mctx.fillRect(sx, sy, tw, th);
    }
  }

  const camX = Math.max(0, Math.min(MAP_W - VIEW_W, G.ship.x - Math.floor(VIEW_W/2)));
  const camY = Math.max(0, Math.min(MAP_H - VIEW_H, G.ship.y - Math.floor(VIEW_H/2)));
  mctx.strokeStyle = '#445566';
  mctx.lineWidth = 1;
  mctx.strokeRect(
    ox + Math.floor(camX * scale) + 0.5,
    oy + Math.floor(camY * scale) + 0.5,
    Math.max(2, Math.floor(VIEW_W * scale)),
    Math.max(2, Math.floor(VIEW_H * scale))
  );

  const sx = ox + Math.floor(G.ship.x * scale);
  const sy = oy + Math.floor(G.ship.y * scale);
  mctx.fillStyle = '#70f090';
  mctx.fillRect(sx-1, sy-1, 3, 3);
  mctx.strokeStyle = '#102010';
  mctx.strokeRect(sx-1.5, sy-1.5, 4, 4);

  mctx.strokeStyle = '#222238';
  mctx.strokeRect(ox+0.5, oy+0.5, Math.ceil(mapW)-1, Math.ceil(mapH)-1);
}

function drawFullGalaxyMap(){
  const map=document.getElementById('galaxy-minimap-large');
  const c=map.getContext('2d');
  const {width,height}=map;
  // Whole pixels keep neighboring fog tiles flush when the artwork is scaled.
  const tileSize=Math.floor(Math.min((width-6)/MAP_W,(height-6)/MAP_H));
  const mapW=MAP_W*tileSize, mapH=MAP_H*tileSize;
  const ox=Math.floor((width-mapW)/2), oy=Math.floor((height-mapH)/2);
  c.fillStyle='#030307';
  c.fillRect(0,0,width,height);
  if(!G?.galaxy) return;

  c.save();
  c.beginPath();
  c.rect(ox,oy,mapW,mapH);
  c.clip();
  c.fillStyle='#04040c';
  c.fillRect(ox,oy,mapW,mapH);
  c.translate(ox,oy);
  c.scale(tileSize/TS,tileSize/TS);
  c.imageSmoothingEnabled=false;

  for(let y=0;y<MAP_H;y++){
    for(let x=0;x<MAP_W;x++){
      if(!DEBUG.fullVision && !G.visited?.[y*MAP_W+x]){
        c.fillStyle='#242531';
        c.fillRect(x*TS,y*TS,TS,TS);
        continue;
      }
      const cell=G.galaxy[y]?.[x];
      if(cell && cell.type!=='VOID') drawGalaxyTile(c,cell,x*TS,y*TS,x,y,true);
    }
  }
  drawGalaxyActors(c,0,0,MAP_W,MAP_H,true);
  c.restore();

  const camX=Math.max(0,Math.min(MAP_W-VIEW_W,G.ship.x-Math.floor(VIEW_W/2)));
  const camY=Math.max(0,Math.min(MAP_H-VIEW_H,G.ship.y-Math.floor(VIEW_H/2)));
  c.strokeStyle='#445566';
  c.lineWidth=1;
  c.strokeRect(ox+camX*tileSize,oy+camY*tileSize,VIEW_W*tileSize,VIEW_H*tileSize);
  c.strokeStyle='#222238';
  c.strokeRect(ox+0.5,oy+0.5,mapW-1,mapH-1);
}

function updateMinimapLegend(){
  const container = document.getElementById('minimap-legend-rows');
  if(!container) return;

  // Always-present entries
  const entries = [
    { col:'#242531', label:'Undiscovered' },
    { col:'#04040c', label:'Empty space' },
  ];

  // Track which object types have been seen in visited cells
  const seen = { SYSTEM:false, BASE:false, NEBULA_blue:false, NEBULA_pink:false,
                  PIRATE_BASE:false, DERELICT:false, CASINO:false,
                  BLACK_HOLE:false, ROGUE_PLANET:false, PULSAR:false };

  if(G && G.galaxy && G.visited){
    for(let y=0; y<MAP_H; y++){
      for(let x=0; x<MAP_W; x++){
        if(!DEBUG.fullVision && !G.visited[y*MAP_W+x]) continue;
        const cell = G.galaxy[y]?.[x];
        if(!cell) continue;
        if(cell.type === 'SYSTEM')     seen.SYSTEM = true;
        if(cell.type === 'BASE')       seen.BASE = true;
        if(cell.type === 'PIRATE_BASE') seen.PIRATE_BASE = true;
        if(cell.type === 'NEBULA'){
          if(cell.nebulaVariant === 'blue') seen.NEBULA_blue = true;
          else seen.NEBULA_pink = true;
        }
        if(cell.type === 'CASINO')        seen.CASINO = true;
        if(cell.type === 'DERELICT')      seen.DERELICT = true;
        if(cell.type === 'BLACK_HOLE')    seen.BLACK_HOLE = true;
        if(cell.type === 'ROGUE_PLANET')  seen.ROGUE_PLANET = true;
        if(cell.type === 'PULSAR')         seen.PULSAR = true;
      }
    }
  }

  const landmark=(type,label,variant)=>entries.push({label,cell:{type,nebulaVariant:variant}});
  if(seen.BASE)          landmark('BASE','Station');
  if(seen.SYSTEM)        landmark('SYSTEM','Star system');
  if(seen.NEBULA_blue)   landmark('NEBULA','Blue nebula','blue');
  if(seen.NEBULA_pink)   landmark('NEBULA','Pink nebula','pink');
  if(seen.PIRATE_BASE)   landmark('PIRATE_BASE','Pirate base');
  if(seen.DERELICT)      landmark('DERELICT','Derelict');
  if(seen.CASINO)        landmark('CASINO','Casino');
  if(seen.BLACK_HOLE)    landmark('BLACK_HOLE','Black hole');
  if(seen.ROGUE_PLANET)  landmark('ROGUE_PLANET','Rogue planet');
  if(seen.PULSAR)        landmark('PULSAR','Pulsar');
  entries.push({ label:'Detected ship',sprite:'ship_trader' },{ label:'Radio contact' });
  entries.push({ label:'Your ship',sprite:G.shipStats?.sprite || 'player_ship',player:true });

  container.replaceChildren();
  for(const entry of entries){
    const row=document.createElement('div');
    row.className='minimap-legend-row';
    const icon=document.createElement('canvas');
    icon.className='minimap-legend-icon';
    icon.width=icon.height=TS;
    icon.setAttribute('aria-hidden','true');
    const paint=icon.getContext('2d');
    if(entry.col){
      paint.fillStyle=entry.col;
      paint.fillRect(2,2,TS-4,TS-4);
    } else if(entry.cell){
      drawGalaxyTile(paint,entry.cell,0,0,-1,-1,true);
    } else if(entry.sprite){
      if(entry.player){
        paint.strokeStyle='#70f090';
        paint.beginPath();
        paint.arc(TS/2,TS/2,TS/2-1,0,Math.PI*2);
        paint.stroke();
      }
      drawSpriteGraphic(paint,entry.sprite,0,0);
    } else drawRadioContact(0,0,paint,23);
    row.append(icon,entry.label);
    container.append(row);
  }
}

function openGalaxyMinimapOverlay(){
  if(!G || !G.galaxy) return;
  const ov = document.getElementById('minimap-overlay');
  if(!ov) return;
  ov.classList.add('visible');
  // Move focus off the opener so gameplay keys cannot activate it after closing.
  ov.focus({preventScroll:true});
  updateMinimapLegend();
  drawFullGalaxyMap();
}

function closeGalaxyMinimapOverlay(){
  const ov = document.getElementById('minimap-overlay');
  if(!ov) return;
  if(ov.contains(document.activeElement)) document.activeElement.blur();
  ov.classList.remove('visible');
}

