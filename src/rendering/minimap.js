function renderGalaxyMinimap(){
  const mini = document.getElementById('galaxy-minimap');
  drawGalaxyMinimapToCanvas(mini);
  if(document.getElementById('minimap-overlay')?.classList.contains('visible')){
    drawGalaxyMinimapToCanvas(document.getElementById('galaxy-minimap-large'));
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

function updateMinimapLegend(){
  const container = document.getElementById('minimap-legend-rows');
  if(!container) return;

  // Always-present entries
  const entries = [
    { col:'#303038', label:'Undiscovered' },
    { col:'#14141f', label:'Empty space' },
  ];

  // Track which object types have been seen in visited cells
  const seen = { SYSTEM:false, BASE:false, NEBULA_blue:false, NEBULA_pink:false,
                  PIRATE_BASE:false, DERELICT:false, CASINO:false,
                  BLACK_HOLE:false, ROGUE_PLANET:false, PULSAR:false };

  if(G && G.galaxy && G.visited){
    for(let y=0; y<MAP_H; y++){
      for(let x=0; x<MAP_W; x++){
        if(!G.visited[y*MAP_W+x]) continue;
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

  if(seen.BASE)          entries.push({ col:'#ffe066', label:'Station' });
  if(seen.SYSTEM)        entries.push({ col:'#ffcc44', label:'Star system' });
  if(seen.NEBULA_blue)   entries.push({ col:'#2f7fca', label:'Blue nebula' });
  if(seen.NEBULA_pink)   entries.push({ col:'#8a42aa', label:'Pink nebula' });
  if(seen.PIRATE_BASE)   entries.push({ col:'#bb3311', label:'Pirate base' });
  if(seen.DERELICT)      entries.push({ col:'#6688aa', label:'Derelict' });
  if(seen.CASINO)        entries.push({ col:'#cc44ff', label:'Casino' });
  if(seen.BLACK_HOLE)    entries.push({ col:'#ff8800', label:'Black hole' });
  if(seen.ROGUE_PLANET)  entries.push({ col:'#2a3050', label:'Rogue planet' });
  if(seen.PULSAR)        entries.push({ col:'#00ddaa', label:'Pulsar (radiation hazard)' });
  // Ship is always present (it's always been "discovered")
  entries.push({ col:'#70f090', label:'Your ship' });

  container.innerHTML = entries.map(e =>
    `<div class="minimap-legend-row"><span class="minimap-legend-swatch" style="background:${e.col}"></span>${e.label}</div>`
  ).join('');
}

function openGalaxyMinimapOverlay(){
  if(!G || !G.galaxy) return;
  const ov = document.getElementById('minimap-overlay');
  if(!ov) return;
  ov.classList.add('visible');
  updateMinimapLegend();
  drawGalaxyMinimapToCanvas(document.getElementById('galaxy-minimap-large'));
}

function closeGalaxyMinimapOverlay(){
  document.getElementById('minimap-overlay')?.classList.remove('visible');
}

