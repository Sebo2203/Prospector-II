// Code-native fixtures retain the existing tile palette and ASCII alternative.
const QUARANTINE_FIXTURES={
  q_log:['L','#66ccee'],q_life_support:['O','#ffaa55'],q_medical:['+','#77ddaa'],
  q_pods:['P','#88ccee'],q_parts:['%','#ddbb77'],q_salvage:['C','#ddbb77'],
  q_filter:['F','#55ccbb'],q_door:['+','#aabbcc'],q_sealed_door:['!','#ff9966'],
  q_open_door:['/','#88aabb'],q_contamination:['~','#668855'],
};
for(const [type,[symbol,col]] of Object.entries(QUARANTINE_FIXTURES)){
  TILE[type]={pass:!['q_door','q_sealed_door'].includes(type),sprite:null,drawFn:type};
  ASCII[type]={ch:symbol,bg:'#0a0f15',fg:col};
  DRAW[type]=(context,x,y)=>{
    DRAW.station_floor(context,x,y);
    context.fillStyle=col;
    if(type==='q_contamination'){
      context.globalAlpha=.35;
      context.fillRect(x+3,y+7,TS-6,4);context.fillRect(x+7,y+TS-9,TS-10,3);
      context.globalAlpha=1;return;
    }
    if(type==='q_open_door'){context.fillRect(x+2,y+2,3,TS-4);return;}
    context.fillStyle='#162636';context.fillRect(x+4,y+4,TS-8,TS-8);
    context.strokeStyle=col;context.strokeRect(x+4,y+4,TS-8,TS-8);
    context.font='bold '+Math.round(TS*.58)+'px Courier New';context.textAlign='center';
    context.fillStyle=col;context.fillText(symbol,x+TS/2,y+TS*.7);context.textAlign='left';
  };
}

function drawQuarantinePeople(pd,camX,camY){
  for(const s of quarantinePeople()){
    if(!['waiting','following','carried','dead'].includes(s.status) || !canSeePlanetTile(s.x,s.y)) continue;
    const x=(s.x-camX)*TS,y=(s.y-camY)*TS;
    const col=s.status==='dead'?'#775555':s.infectious?'#ddbb55':s.injured?'#ee9977':'#99ddcc';
    if(OPTIONS.asciiMode){
      ctx.font='bold '+(TS-3)+'px Courier New';ctx.fillStyle=col;ctx.textAlign='center';
      ctx.fillText(s.status==='dead'?'%':s.pod?'P':'@',x+TS/2,y+TS-4);ctx.textAlign='left';
    } else {
      ctx.fillStyle='#09131c';ctx.fillRect(x+3,y+3,TS-6,TS-6);
      ctx.fillStyle=col;
      if(s.pod){ctx.strokeStyle=col;ctx.strokeRect(x+5,y+3,TS-10,TS-6);ctx.fillRect(x+8,y+7,TS-16,TS-14);}
      else if(s.status==='dead'){ctx.fillRect(x+4,y+TS/2,TS-8,4);}
      else {ctx.fillRect(x+TS/2-3,y+4,6,6);ctx.fillRect(x+TS/2-4,y+11,8,TS-15);}
    }
    if(s.status!=='dead'){
      ctx.fillStyle='#442525';ctx.fillRect(x+3,y+TS-3,TS-6,2);
      ctx.fillStyle=col;ctx.fillRect(x+3,y+TS-3,(TS-6)*s.hp/s.maxHp,2);
    }
  }
}
