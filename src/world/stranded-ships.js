// ── NPC STRANDED SHIPS ───────────────────────────────────────────────
const NPC_SHIP_NAMES = [
  'Pale Wanderer','Iron Meridian','Silent Drift','Vagrant Star',
  'Crestfallen','Ember Run','The Lodestar','Perihelion','Cinder Reach',
  'Far Meridian','Duskfall','Marigold','The Oblique',
];

function spawnNpcStrandedShip(){
  if(!G || !G.galaxy || G.mode!=='galaxy') return;
  if((G.npcStranded||[]).length >= 1) return; // cap at 1 simultaneous
  // Find a random VOID tile not too close to bases or player
  let sx, sy, t=0;
  do {
    sx = 5+rnd(MAP_W-10); sy = 3+rnd(MAP_H-8); t++;
  } while(t<300 && (
    G.galaxy[sy][sx].type!=='VOID' ||
    Math.abs(sx-G.ship.x)+Math.abs(sy-G.ship.y)<8 ||
    (G.npcStranded||[]).some(s=>Math.abs(s.x-sx)+Math.abs(s.y-sy)<5)
  ));
  if(t>=300) return;

  const type = Math.random()<0.5 ? 'alive' : 'dead';
  const name = NPC_SHIP_NAMES[rnd(NPC_SHIP_NAMES.length)];
  const ship = {
    x:sx, y:sy, type, name,
    fuel:   type==='alive' ? 0 : 0,
    credits:type==='alive' ? 150+rnd(200) : 0,  // alive ships pay for fuel
    fuelCost: 20+rnd(20),                        // fuel they need
    mapKey: sx+','+sy+':stranded',
    age: 0,
  };
  if(!G.npcStranded) G.npcStranded=[];
  G.npcStranded.push(ship);
  // Mark galaxy tile with a special flag so it draws
  G.galaxy[sy][sx]._npcStranded = ship;
}

function tickNpcStranded(){
  if(!G.npcStranded) return;
  G.npcStranded = G.npcStranded.filter(s=>{
    s.age++;
    // Alive ships turn derelict after 80 turns if not rescued
    if(s.type==='alive' && s.age>80){
      s.type = 'dead';
      s.age = 0;
      s.credits = 0;
      if(neutralShipDistance(s) <= radioRange())
        addLog(s.name+': no response. Ship has gone dark.','li');
      return true;
    }
    // Dead ships: 200-turn natural lifetime, OR 50 turns after being boarded
    if(s.type==='dead'){
      if(s.boarded){
        s.boardedAge = (s.boardedAge||0) + 1;
        if(s.boardedAge > 50){
          if(G.galaxy[s.y]?.[s.x]?._npcStranded===s) delete G.galaxy[s.y][s.x]._npcStranded;
          return false;
        }
      } else if(s.age > 200){
        if(G.galaxy[s.y]?.[s.x]?._npcStranded===s) delete G.galaxy[s.y][s.x]._npcStranded;
        return false;
      }
    }
    return true;
  });
}


