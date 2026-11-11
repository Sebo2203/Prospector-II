// A shattered orbital station: broken ring, severed spokes and exposed core.
// Native 24px pixel art, cached on genuine alpha with no space-colored matte.
let derelictStationSprite=null;
function drawDerelictStation(c,x,y){
  if(!derelictStationSprite){
    const tile=document.createElement('canvas');tile.width=tile.height=24;
    const p=tile.getContext('2d');
    const rect=(color,x,y,w,h)=>{p.fillStyle=color;p.fillRect(x,y,w,h);};
    const dark='#29343e',steel='#71838b',light='#a6b3b5',rust='#80614c',cut='#d49a65';
    // Surviving upper-left ring; the lower-right quadrant is torn away.
    rect(dark,6,3,10,3);rect(dark,3,6,4,9);rect(dark,5,15,4,4);
    rect(steel,7,3,8,2);rect(steel,4,6,2,8);rect(steel,5,14,2,3);
    rect(light,8,3,5,1);rect(light,4,7,1,5);
    rect(rust,6,17,3,2);rect(cut,8,17,2,1);
    // Broken ring fragment still attached to the upper spoke.
    rect(dark,16,5,3,4);rect(steel,16,5,2,3);rect(cut,17,8,2,1);
    // Docking arm and radial trusses, interrupted at the fracture.
    rect(dark,1,10,10,3);rect(steel,2,10,8,1);rect(rust,6,11,4,1);
    rect(dark,10,5,3,13);rect(steel,11,5,1,12);
    rect(dark,13,10,5,3);rect(steel,14,10,3,1);rect(cut,17,11,1,2);
    // Two hull plates around a dark, asymmetric breach in the central hub.
    rect(dark,8,8,7,7);rect(steel,9,8,5,2);rect(light,9,8,3,1);
    rect(rust,8,10,2,4);rect(steel,10,13,4,2);rect(light,11,14,2,1);
    rect('#111820',10,10,4,3);rect(cut,13,10,1,1);rect(rust,12,12,2,1);
    // Detached lower hull and small debris; no powered windows or engines.
    rect(dark,14,17,5,3);rect(steel,15,17,4,1);rect(rust,16,18,3,2);
    rect(light,15,17,2,1);rect(cut,18,16,1,1);
    rect(steel,20,13,2,1);rect(dark,20,14,1,2);
    rect(rust,10,20,2,1);rect(steel,4,20,1,1);rect(dark,21,7,1,1);
    derelictStationSprite=tile;
  }
  c.drawImage(derelictStationSprite,x,y,TS,TS);
}
