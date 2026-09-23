// ── Jetpack propellant trail ──────────────────────────────────────────────────
// Each step onto a void tile with the jetpack deposits a glitter trail entry.
// Sparks are static pixel offsets within the tile, computed from a seeded hash
// so they never move between frames. Life counts down each planet turn.
const JET_TRAIL_LIFE = 6; // turns the trail persists
const JET_TRAIL_SPARKS = 18; // spark dots per tile
function addJetTrail(pdata, tx, ty){
  if(!pdata) return;
  if(!pdata.jetTrail) pdata.jetTrail = [];
  // Remove any existing entry for this tile so life resets on re-visit
  pdata.jetTrail = pdata.jetTrail.filter(e=>!(e.x===tx&&e.y===ty));
  // Generate static spark positions deterministically from tile coords
  const sparks = [];
  let h = (tx * 2654435761 ^ ty * 2246822519) >>> 0;
  for(let i=0;i<JET_TRAIL_SPARKS;i++){
    h = (h ^ (h >>> 16)) * 0x45d9f3b >>> 0;
    h = (h ^ (h >>> 16)) * 0x45d9f3b >>> 0;
    h ^= (h >>> 16);
    const px2 = (h & 0xff) % (TS - 1);
    h = (h * 1664525 + 1013904223) >>> 0;
    const py2 = (h & 0xff) % (TS - 1);
    h = (h * 1664525 + 1013904223) >>> 0;
    const size = 1 + (h % 2);        // 1 or 2 px
    const hue  = (h % 3);            // 0=white/blue, 1=orange, 2=cyan
    sparks.push({ px: px2, py: py2, size, hue });
  }
  pdata.jetTrail.push({ x:tx, y:ty, life:JET_TRAIL_LIFE, maxLife:JET_TRAIL_LIFE, sparks });
}

// Call once per planet turn to age all trail entries
function tickJetTrail(pdata){
  if(!pdata?.jetTrail?.length) return;
  pdata.jetTrail = pdata.jetTrail.filter(e=>{ e.life--; return e.life > 0; });
}

function revealPlanet(key, cx, cy, r){
  const pdata = G.planets[key];
  if(!pdata) return;
  // Use caller-supplied radius if given, otherwise compute from vision system
  const vr = Math.max(1, Math.round(r !== undefined ? r : planetVisionRadius(key)));
  const grid = pdata.grid;
  const _W = PW(pdata), _H = PH(pdata);
  if(!pdata.explored) pdata.explored = new Array(_W*_H).fill(false);

  // Per-turn lit[] array: cleared every call, set only for tiles the shadowcaster
  // actually illuminates. The render loop uses this instead of re-running a
  // Bresenham LOS check, eliminating the algorithm-mismatch shadow columns.
  pdata.lit = new Array(_W*_H).fill(false);

  // Build fast smoke position lookup — O(1) per tile check
  const smokeSet = new Set();
  if(pdata.smokeClouds){
    pdata.smokeClouds.forEach(c=> smokeSet.add(c.y*_W+c.x));
  }

  function markRevealed(x, y){
    const idx = y*_W+x;
    pdata.visited[idx] = true;
    pdata.lit[idx] = true;
    if(pdata.explored) pdata.explored[idx] = true;
    if(pdata.scanMask) pdata.scanMask[idx] = true;
  }

  // Helper: is a tile vision-blocking?
  function blocks(x, y){
    if(x<0||x>=_W||y<0||y>=_H) return true;
    if(TILE[grid[y][x].type]?.pass === false) return true;
    // Forest and smoke clouds block line of sight
    if(grid[y][x].type === 'EARTH_FOREST') return true;
    if((grid[y][x].type === 'NEST' || grid[y][x].type === 'CAVE_NEST') && !grid[y][x].revealed) return true;
    if(smokeSet.has(y*_W+x)) return true;
    return false;
  }

  // Always reveal the player's own tile and all 8 immediate neighbours.
  // This ensures walls directly adjacent (N/S/E/W/diag) are never left in
  // unexplored fog regardless of octant boundary artefacts.
  for(let ny = cy-1; ny <= cy+1; ny++){
    for(let nx = cx-1; nx <= cx+1; nx++){
      if(nx>=0 && nx<_W && ny>=0 && ny<_H) markRevealed(nx, ny);
    }
  }

  // Recursive shadowcasting — 8 octants
  // Based on Bjorn Bergstrom's algorithm
  function castLight(row, start, end, radius, xx, xy, yx, yy){
    if(start < end) return;
    const radiusSq = radius * radius;
    let newStart = 0;
    let blocked = false;
    for(let j=row; j<=radius && !blocked; j++){
      const dy = -j;
      for(let dx=-j; dx<=0; dx++){
        const lSlope = (dx - 0.5) / (dy + 0.5);
        // When dx===0 the naive rSlope formula uses (dy-0.5) which has the
        // same sign as dy (negative), flipping the fraction positive and
        // producing an incorrect slope > 1.  Clamp to 0 at the boundary.
        const rSlope = dx === 0 ? 0 : (dx + 0.5) / (dy - 0.5);
        if(start < rSlope) continue;
        if(end > lSlope) break;
        const ax = cx + dx*xx + dy*xy;
        const ay = cy + dx*yx + dy*yy;
        const inRange = dx*dx + dy*dy <= radiusSq;
        const inBounds = ax>=0 && ax<_W && ay>=0 && ay<_H;
        if(blocked){
          if(blocks(ax, ay)){
            // Even while shadowed, reveal the blocking tile itself so it
            // is never rendered with a fog/shadow overlay on top of itself.
            if(inRange && inBounds) markRevealed(ax, ay);
            newStart = rSlope;
            continue;
          } else {
            blocked = false;
            start = newStart;
          }
        }
        // Reveal this tile (it is in the lit cone and within radius)
        if(inRange && inBounds) markRevealed(ax, ay);
        if(blocks(ax, ay) && j < radius){
          blocked = true;
          castLight(j+1, start, lSlope, radius, xx, xy, yx, yy);
          newStart = rSlope;
        }
      }
    }
  }

  // 8 octant multiplier tables
  const mult = [
    [1,0,0,-1,-1,0,0,1],
    [0,1,-1,0,0,-1,1,0],
    [0,1,1,0,0,-1,-1,0],
    [1,0,0,1,-1,0,0,-1],
  ];
  for(let oct=0; oct<8; oct++){
    castLight(1, 1.0, 0.0, vr,
      mult[0][oct], mult[1][oct],
      mult[2][oct], mult[3][oct]);
  }
}

function placeTile(grid,type,floorType,extra){
  const _W=grid[0].length, _H=grid.length;
  let x,y,t=0;
  do{ x=1+rnd(_W-2); y=1+rnd(_H-2); t++; }
  while(grid[y][x].type!==floorType
     && !(floorType==='VOLCANIC_FLOOR' && grid[y][x].type==='VOLCANIC_FLOOR2')
     && !(floorType==='TOXIC_FLOOR' && (grid[y][x].type==='TOXIC_FLOOR2' || grid[y][x].type==='TOXIC_FLOOR3'))
     && t<200);
  if(t<200){
    const defaults = type === 'MINERAL' ? { revealed:false } : {};
    if(type === 'MINERAL_SAMPLE'){
      defaults._sampleType = pickMineralSample((extra&&extra.biome)||'_default');
    }
    grid[y][x] = Object.assign({type}, defaults, extra||{});
  }
}

