// Pixel fixtures share the station palette; glyphs are reserved for ASCII mode.
const QUARANTINE_FIXTURES={
  q_log:['L','#66ccee'],q_life_support:['O','#ffaa55'],q_medical:['+','#77ddaa'],
  q_pods:['P','#88ccee'],q_parts:['%','#ddbb77'],q_salvage:['C','#ddbb77'],
  q_filter:['F','#55ccbb'],q_contamination:['~','#668855'],
};
for(const [type,[symbol,col]] of Object.entries(QUARANTINE_FIXTURES)){
  TILE[type]={pass:true,sprite:null,drawFn:type};ASCII[type]={ch:symbol,bg:'#0a0f15',fg:col};
  DRAW[type]=(c,x,y)=>{
    DRAW.station_floor(c,x,y);c.save();c.translate(x,y);
    const box=(col,x,y,w,h)=>{c.fillStyle=col;c.fillRect(Math.round(x*TS/32),Math.round(y*TS/32),Math.max(1,Math.round(w*TS/32)),Math.max(1,Math.round(h*TS/32)));};
    if(type==='q_contamination'){
      for(const [a,b,w,h] of [[3,8,8,3],[8,11,13,4],[20,20,8,3],[5,24,6,2],[24,9,3,3]])box('#344b3b',a,b,w,h);
      box('#65764e',9,12,4,2);box('#4a6245',20,21,5,1);
    }else if(type==='q_log'){
      box('#070e15',3,4,26,24);box('#344653',4,4,24,21);box('#101c24',6,6,20,13);
      box('#35575d',7,7,18,11);box('#78c9ba',9,9,10,2);box('#5b9d9a',9,13,14,1);
      box('#1b2a35',6,21,20,5);for(let i=0;i<5;i++)box('#77969e',8+i*3,22,2,1);
      box('#4a6070',8,27,16,2);
    }else if(type==='q_medical'){
      box('#081218',5,3,23,27);box('#627b80',5,3,21,25);box('#b4c9c1',7,5,17,21);
      box('#425a60',15,6,1,19);box('#579c85',10,10,3,9);box('#579c85',7,13,9,3);
      box('#182c35',20,15,2,4);box('#d4ded0',8,6,14,1);
    }else if(type==='q_pods'){
      box('#162d3a',3,4,26,24);box('#476171',4,5,24,2);box('#476171',4,25,24,2);
      for(const px of [7,18]){box('#78949d',px,7,8,17);box('#b7d0cf',px+1,8,6,4);box('#2c5565',px+1,13,6,7);box('#58a2aa',px+2,14,4,1);box('#9ebabb',px+1,21,6,2);}
    }else if(type==='q_life_support'){
      box('#101b20',4,4,24,25);box('#4c6268',6,5,17,21);box('#8b9b8e',8,7,13,15);
      box('#26373b',10,9,9,10);box('#d2ad63',12,10,4,4);box('#304b53',11,17,7,1);
      box('#567078',23,9,5,13);box('#283e49',24,11,2,9);box('#a58e62',2,18,5,4);
      box('#728b90',5,27,22,2);box('#6c8f88',10,23,9,2);
    }else if(type==='q_filter'){
      box('#15242b',4,4,24,25);box('#5b777b',5,5,22,22);box('#263c45',8,8,16,16);
      for(let row=0;row<5;row++)box('#7d9a99',9,9+row*3,14,1);
      box('#39514e',6,27,20,2);box('#6fbc99',24,24,2,2);
    }else {
      box('#111b21',4,8,25,20);box('#7b7160',4,7,23,18);box('#9d9477',6,8,19,3);
      box('#605e50',6,13,19,10);box('#b0a27e',8,14,15,1);box('#332f2a',10,20,11,2);
      if(type==='q_parts'){box('#31454d',11,11,9,10);box('#a0b4ae',12,12,7,3);box('#6b9294',12,16,7,3);}
      else {box('#364c52',9,12,12,8);box('#78a7a6',11,13,4,3);box('#b7a87a',18,14,2,4);}
    }
    c.restore();
  };
}
function drawQuarantinePerson(c,x,y,s,size=TS){
  c.save();c.translate(x,y);
  const box=(col,x,y,w,h)=>{c.fillStyle=col;c.fillRect(Math.round(x*size/32),Math.round(y*size/32),Math.max(1,Math.round(w*size/32)),Math.max(1,Math.round(h*size/32)));};
  if(s.pod){
    box('#0b161d',8,2,17,29);box('#5d8390',8,2,15,27);box('#c3d3cc',10,3,11,3);
    box('#1b3b4b',10,7,11,16);box('#5b8791',11,8,9,2);box('#a1b7b0',13,11,5,5);box('#496b77',12,17,7,5);box('#c6b271',11,25,9,2);
  }else if(s.status==='dead'){
    box('#1c2024',4,23,25,5);box('#75675d',4,21,6,4);box('#506b7a',10,22,13,4);box('#263b49',23,23,6,3);
  }else {
    const coat=s.id==='mira'?'#6e9caa':s.id==='rowan'?'#b88762':'#8d9f8f';
    box('#111d27',8,28,16,2);box('#253e50',10,20,5,8);box('#304a5b',18,20,4,8);
    box('#152936',9,27,7,3);box('#152936',18,27,7,3);box(coat,9,11,14,11);
    box('#476a79',9,20,14,2);box('#b7beb1',15,12,2,7);box('#c5ab89',11,4,10,8);
    box('#443e3a',11,3,10,3);box('#282e31',12,7,2,1);box('#282e31',18,7,2,1);
    box(coat,6,12,4,9);box(coat,23,12,3,9);box('#bda27f',6,21,4,3);box('#bda27f',23,21,3,3);
    if(s.injured){box('#d5d2b9',18,21,4,5);box('#a3967b',19,23,2,1);}
    if(s.infectious){box('#b6c8b4',11,9,10,3);box('#8da896',13,10,6,1);}
  }
  c.restore();
}
function drawQuarantinePeople(pd,camX,camY){
  for(const s of quarantinePeople()){
    if(!['waiting','following','carried','dead'].includes(s.status)||!canSeePlanetTile(s.x,s.y))continue;
    const x=(s.x-camX)*TS,y=(s.y-camY)*TS,col=s.status==='dead'?'#775555':s.infectious?'#ddbb55':s.injured?'#ee9977':'#99ddcc';
    if(OPTIONS.asciiMode){ctx.font='bold '+(TS-3)+'px Courier New';ctx.fillStyle=col;ctx.textAlign='center';ctx.fillText(s.status==='dead'?'%':s.pod?'P':'@',x+TS/2,y+TS-4);ctx.textAlign='left';}
    else drawQuarantinePerson(ctx,x,y,s);
    if(s.status!=='dead'){ctx.fillStyle='#442525';ctx.fillRect(x+3,y+TS-3,TS-6,2);ctx.fillStyle=col;ctx.fillRect(x+3,y+TS-3,(TS-6)*s.hp/s.maxHp,2);}
  }
}
function storySurvivorExamineHtml(e,detailVisible){
  let html='<div style="color:#ffe066;font-weight:bold">'+htmlEsc(detailVisible?e.name:'Human survivor')+'</div>';
  html+='<div style="color:#8899aa;margin:6px 0">Human · rescue passenger</div>';
  if(!detailVisible)return html+'<div>Move within 2 tiles for a reliable condition readout.</div>';
  return html+'<div style="line-height:1.6">'+htmlEsc(e.desc)+'<br>Condition: '+htmlEsc(e.status==='dead'?'Deceased':creatureHealthDesc(e.hp,e.maxHp))+
    '<br>Transport: '+htmlEsc(e.pod?'Isolation pod':e.status==='carried'?'Carried':e.status==='following'?'Following':'Waiting')+'</div>';
}
