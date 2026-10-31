
// ─── File identity hash — changes whenever the file content changes ───
const _FILE_HASH = (()=>{
  const src = document.documentElement.outerHTML;
  let h = 0x811c9dc5;
  for(let i = 0; i < src.length; i++){
    h ^= src.charCodeAt(i);
    h = (h * 0x01000193) >>> 0;
  }
  return h.toString(16).toUpperCase().slice(-6);
})();
function getFileHash(){ return _FILE_HASH; }

// ═══════════════════════════════════════════════════════════════════
//  PROSPECTOR  v0.26
//
//  Changes from v0.25:
//  - FIXED: layout no longer uses fixed height on #root or #main,
//    so msg-bar and controls are always visible
//  - FIXED: combat no longer breaks keyboard input — the keydown
//    handler now has no code paths that can throw silently
//  - FIXED: oxygen warning only fires once per threshold crossing,
//    not every single step (log spam removed)
//  - FIXED: dead crew members are fully removed before move/combat
//    checks so ghost HP can't block actions
//  - IMPROVED: game-over screen drawn on canvas with restart prompt
//
//  How to edit:
//    Starting credits/fuel/HP  → find  G = {  in initGame()
//    Fuel cost per move         → find  G.fuel - 1  in tryMove()
//    Oxygen drain per step      → find  G.oxygen - 1.5
//    Planet loot amounts        → find  numMinerals / numAliens
//    Item sell values           → find  value:  near item names
//    Tile colors / art          → edit the DRAW object
//    Canvas tile size           → change TS constant
// ═══════════════════════════════════════════════════════════════════

const TS = 24;    // tile size — 24×24 matches original Prospector sprites
const BASE_MAP_W = 80;
const BASE_MAP_H = 50;
const WEST_MAP_EXPANSION = Math.ceil(BASE_MAP_W * 0.5);
const SOUTH_MAP_EXPANSION = 20;
const MAP_W = BASE_MAP_W + WEST_MAP_EXPANSION; // logical galaxy width in tiles
const MAP_H = BASE_MAP_H + SOUTH_MAP_EXPANSION; // logical galaxy height in tiles
const GALAXY_WIDTH_SCALE = MAP_W / BASE_MAP_W;
const GALAXY_HEIGHT_SCALE = MAP_H / BASE_MAP_H;
const GALAXY_AREA_SCALE = GALAXY_WIDTH_SCALE * GALAXY_HEIGHT_SCALE;
const STATION_MIN_DISTANCE = Math.floor(MAP_W * 0.5);
const STATION_MAX_DISTANCE = 70; // shortest starting fuel tank is 90, so this leaves margin

// ── CORPORATIONS ─────────────────────────────────────────────────────────────
// Each major space station is operated by one of these three corporate factions.
// Assigned randomly per run (no duplicates across the two major stations).
// The science office at each station carries the operating corporation's name.
const CORPORATIONS = [
  { id: 'eridani',  name: 'Eridani Explorations',   office: 'Eridani Explorations — Research Division', col: '#4488ff' },
  { id: 'margo',    name: 'Margo Security Inc.',     office: 'Margo Security Inc. — Science Bureau',     col: '#ff4444' },
  { id: 'biovance', name: 'BioVance Collective',     office: 'BioVance Collective — Field Sciences',     col: '#44cc66' },
];

function stationCorpOffice(stationName){
  const corp = CORPORATIONS.find(c => c.id === (G?._stationCorps?.[stationName] || 'eridani'));
  return corp ? corp.office : 'Science Office';
}

function corpOfficeById(corpId){
  const corp = CORPORATIONS.find(c => c.id === (corpId || 'eridani'));
  return corp ? corp.office : 'Science Office';
}

const VIEW_W = 40; // visible tiles wide  (40×24 = 960px)
const VIEW_H = 20; // visible tiles tall  (20×24 = 480px)
const SURVEY_SCAN_TILE_VALUE = 0.1;
const SURVEY_EXPLORE_TILE_VALUE = 0.2;
const SURVEY_FULL_SCAN_BONUS = 20;
const PLANET_W = VIEW_W; // planet surface width  (fills canvas)
const PLANET_H = VIEW_H; // planet surface height (fills canvas)
// Dynamic planet dimension helpers — use these everywhere inside planet code
// so oversized maps (ringworlds etc.) work transparently
function PW(pdata){ return (pdata && pdata.width)  || PLANET_W; }
function PH(pdata){ return (pdata && pdata.height) || PLANET_H; }
function scaledGalaxyCount(base, variance){
  return Math.max(1, Math.round((base + rnd(variance)) * GALAXY_AREA_SCALE));
}
function randomStationPoint(){
  return { x:4+rnd(MAP_W-8), y:4+rnd(MAP_H-8) };
}
function stationTravelDistance(a, b){
  return Math.abs(a.x-b.x) + Math.abs(a.y-b.y);
}
function chooseStationPair(grid){
  for(let attempt=0; attempt<2000; attempt++){
    const a = randomStationPoint();
    const b = randomStationPoint();
    const dist = stationTravelDistance(a, b);
    if(dist < STATION_MIN_DISTANCE || dist > STATION_MAX_DISTANCE) continue;
    if(grid[a.y][a.x].type !== 'VOID' || grid[b.y][b.x].type !== 'VOID') continue;
    return { alpha:a, omega:b, distance:dist };
  }

  // Deterministic fallback: still reachable on a single tank.
  const alpha = { x:Math.floor(MAP_W*0.25), y:Math.floor(MAP_H*0.65) };
  const omega = { x:Math.min(MAP_W-5, alpha.x + STATION_MIN_DISTANCE), y:alpha.y };
  return { alpha, omega, distance:stationTravelDistance(alpha, omega) };
}

const rnd  = n   => Math.floor(Math.random() * n);
const pick = arr => arr[rnd(arr.length)];

