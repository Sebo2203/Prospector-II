const RUMOURS = [
  'Someone left a crate of supplies near the Vega system — never got picked up.',
  'The pirates out past sector 7 have been raiding shipments. Watch yourself.',
  'I heard the Science Office is paying double for ancient artifacts this cycle.',
  'Word is there\'s a derelict freighter drifting near one of the outer systems.',
  'Mars is rationing water again. Makes you glad to be out here.',
  'My buddy found a planet with breathable air — easiest survey of his life.',
  'Don\'t trust the fuel prices at the far station. They\'ll overcharge you.',
  'There\'s a nebula cluster near the core that wrecked three ships last month.',
  'Colony Ship Meridian went silent six weeks ago. Nobody\'s talking about it.',
  'I saw a Battle Cruiser near sector 4. Didn\'t stick around to ask questions.',
  'The Company is offering bonuses for mineral surveys in the outer ring.',
  'Someone clocked an uncharted system near the galactic edge. Unconfirmed.',
  'Watch the toxic worlds — the gas eats through standard suits faster than rated.',
  'Retirement at 10,000 cr? My father needed 5,000. Inflation\'s brutal.',
  'A scout came in last week — said she saw lights on a supposedly dead world.',
  'The ancient ruins pay well if you survive them. Big if.',
  'Pirate activity is up near the nebulae. They use the clouds for cover.',
  'I\'ve been flying this sector for twelve years and I still find new things.',
  'Word is the second station gets resupplied less often. Plan accordingly.',
  'Lost my Engineer at Tau Ceti. Haven\'t been able to afford upgrades since.',
  'The Company doesn\'t care about us. We\'re just numbers on a ledger.',
  'Beautiful out there though, isn\'t it? Even with all the danger.',
];

const BAR_FILLER = [
  'You nurse your drink. The bar hums with quiet conversation.',
  'You buy a round. Nobody seems particularly talkative tonight.',
  'The bartender refills your glass without a word.',
  'You sit with your drink. Someone laughs loudly in the corner.',
  'Cheap stuff. Gets the job done.',
  'The ice clinks. You stare at the wall for a while.',
  'The place smells like engine grease and old beer. Homely, almost.',
  'You down it quickly. Nothing worth overhearing tonight.',
  'A couple of pilots argue about jump routes at the other end of the bar.',
  'Someone puts on an old song. You don\'t recognise it.',
  'The drink is warm. You don\'t complain.',
  'A few credits poorer. Nothing to show for it.',
];


// ── BAR INTEL GENERATOR ─────────────────────────────────────────────
// Returns a flavoured intel string drawn from live world state,
// or null if no interesting intel is available right now.
function generateBarIntel(){
  if(!G || !G.galaxy) return null;

  // Helper: compass direction from ship to a point
  function compassTo(tx, ty){
    const dx = tx - G.ship.x, dy = ty - G.ship.y;
    if(Math.abs(dx) < 2 && Math.abs(dy) < 2) return 'very close';
    const adx = Math.abs(dx), ady = Math.abs(dy);
    let dir = '';
    if(ady > adx * 0.4){
      if(dy < 0) dir += 'north'; else dir += 'south';
    }
    if(adx > ady * 0.4){
      if(dx > 0) dir += (dir?'-':'')+'east'; else dir += (dir?'-':'')+'west';
    }
    return dir || 'nearby';
  }

  // Helper: vague distance label
  function distLabel(tx, ty){
    const d = Math.abs(tx - G.ship.x) + Math.abs(ty - G.ship.y);
    if(d < 8)  return 'close — maybe '+d+' jumps out';
    if(d < 20) return 'a fair distance — '+d+' jumps or so';
    return 'deep out — easily '+d+' jumps';
  }

  // Build a pool of possible intel snippets from live data
  const pool = [];

  // ── Active pirate bases ─────────────────────────────────────────
  const activeBases = (G.pirateBases||[]).filter(pb=>!pb.destroyed);
  activeBases.forEach(pb=>{
    const dir  = compassTo(pb.x, pb.y);
    const dist = distLabel(pb.x, pb.y);
    const pct  = Math.round((pb.hp/pb.maxHp)*100);
    const dmgNote = pct < 100 ? ' Heard it took some hits recently — maybe '+pct+'% operational.' : '';
    pool.push(
      '"'+pb.name+' is '+dir+' from here — '+dist+'.'+dmgNote+' Avoid it."',
      '"Word is '+pb.name+' has been active lately. '+dir.charAt(0).toUpperCase()+dir.slice(1)+' of here, watch yourself."',
    );
  });

  // ── Destroyed bases — news travels ─────────────────────────────
  const deadBases = (G.pirateBases||[]).filter(pb=>pb.destroyed);
  deadBases.forEach(pb=>{
    pool.push(
      '"You hear '+pb.name+' got wiped out. Nobody\'s saying who did it."',
      '"'+pb.name+' is rubble now. Sector\'s quieter for it."',
    );
  });

  // ── Roaming pirates last sighting ────────────────────────────────
  const roamers = (G.pirates||[]).filter(p=>p.alive && p.pirateType==='roamer');
  roamers.forEach(p=>{
    const dir  = compassTo(p.x, p.y);
    const dist = Math.abs(p.x-G.ship.x)+Math.abs(p.y-G.ship.y);
    // Only mention if within rough sensor range of any visited tile — "last sighting"
    const visited = G.visited && G.visited[p.y*MAP_W+p.x];
    if(visited || dist < 15){
      pool.push(
        '"Raider ship spotted '+dir+' — moving fast, no fixed base. Stay sharp."',
        '"Someone clocked a '+p.name+' wandering '+dir+' of the shipping lanes. No escort."',
      );
    }
  });

  // ── Ancient ruin systems ────────────────────────────────────────
  // Walk the galaxy to find SYSTEM cells with an ANCIENT planet
  const ancientSystems = [];
  for(let y=0; y<MAP_H; y++){
    for(let x=0; x<MAP_W; x++){
      const cell = G.galaxy[y][x];
      if(cell.type==='SYSTEM' && cell.planets){
        const hasAncient = cell.planets.some(p=>p.biome==='ANCIENT');
        if(hasAncient) ancientSystems.push({ name:cell.name, x, y });
      }
    }
  }
  // ── Derelict stations ─────────────────────────────────────────
  (G.derelicts||[]).forEach(d=>{
    const dir  = compassTo(d.x, d.y);
    const dist = distLabel(d.x, d.y);
    pool.push(
      '"'+d.name+' — dead station, '+dir+', '+dist+'. Heard there\'s still loot inside."',
      '"Someone said '+d.name+' lost contact years ago. '+dir.charAt(0).toUpperCase()+dir.slice(1)+' of here. Could be worth a look."',
    );
  });

  ancientSystems.forEach(sys=>{
    const dir  = compassTo(sys.x, sys.y);
    const dist = distLabel(sys.x, sys.y);
    pool.push(
      '"Old ruins out in '+sys.name+' System — '+dir+', '+dist+'. Science Office pays well for those surveys."',
      '"Heard there\'s ancient structures in '+sys.name+'. '+dir.charAt(0).toUpperCase()+dir.slice(1)+' of here. The kind of find that makes careers."',
      '"'+sys.name+' System has something old on one of its worlds. '+dir+', not too far. Worth a look if you\'re not in a hurry."',
    );
  });

  if(pool.length === 0) return null;

  const line = pool[Math.floor(Math.random() * pool.length)];
  // Wrap in a speaker voice if not already quoted
  if(line.startsWith('"')) return line;
  return line;
}


