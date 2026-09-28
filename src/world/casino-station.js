// A staffed, pressurized station deck. Every attraction is reached on foot.
function generateCasinoStationMap(key){
  const W=40, H=21;
  const grid=Array.from({length:H},()=>Array.from({length:W},()=>({type:'casino_wall'})));
  function floor(x1,y1,x2,y2){
    for(let y=y1;y<=y2;y++) for(let x=x1;x<=x2;x++) grid[y][x]={type:'casino_floor'};
  }
  // Central promenade and five connected rooms.
  floor(2,8,37,12);
  floor(2,4,9,16);       // arrival lounge
  floor(12,2,21,8);      // poker room
  floor(12,12,21,18);    // bar
  floor(24,2,37,8);      // beast arena
  floor(24,12,37,18);    // wrestling pit
  for(const [x,y] of [[16,8],[16,12],[30,8],[30,12]]) grid[y][x]={type:'casino_door'};
  const fixtures=[
    [5,10,'SHIP'],[5,6,'casino_host'],[8,10,'casino_info'],
    [16,5,'casino_poker'],[18,5,'casino_poker'],
    [16,15,'casino_bar'],[19,15,'casino_bar'],
    [30,5,'casino_arena'],[30,15,'casino_wrestle'],
    [10,10,'casino_slots'],[23,10,'casino_slots'],[35,10,'casino_slots'],
    [4,14,'casino_locker'],[8,14,'casino_console']
  ];
  for(const [x,y,type] of fixtures) grid[y][x]={type,...(type==='SHIP'?{_underFloor:'casino_floor'}:{})};
  G.planets[key]={grid,width:W,height:H,biome:'CASINO',isCasino:true,spawnX:5,spawnY:10,
    explored:new Array(W*H).fill(false),visited:new Array(W*H).fill(false),
    planetTurn:0,spawnedAliens:0,surveySoldValue:0};
  G.enemies[key]=[];
}
