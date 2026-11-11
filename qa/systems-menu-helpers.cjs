const assert=require('node:assert/strict');

const isSystemsOpen=page=>page.evaluate(()=>shipSystemsActive());
const canvasText=page=>page.evaluate(()=>{
  const labels=[],fillText=ctx.fillText;
  ctx.fillText=function(text,...args){labels.push(String(text));return fillText.call(this,text,...args);};
  try{drawCanvas();}finally{ctx.fillText=fillText;}
  return labels.join(' ');
});
async function clickTarget(page,label,prefix=false){
  const point=await page.evaluate(({label,prefix})=>{
    const target=canvasMenuTargets.find(target=>target.label && (prefix?target.label.startsWith(label):target.label===label));
    if(!target?.activate)throw Error('Missing enabled canvas control: '+label);
    const bounds=canvas.getBoundingClientRect();
    return {x:bounds.x+(target.x+target.w/2)*bounds.width/canvasWidth,y:bounds.y+(target.y+target.h/2)*bounds.height/canvasHeight};
  },{label,prefix});
  await page.mouse.click(point.x,point.y);
}
async function clickRepair(page,id,method){
  const names={engine:'Engines',reactor:'Reactor',shields:'Shield generator',cooling:'Cooling',sensors:'Sensors',fuelTank:'Fuel tank'};
  await clickTarget(page,names[id]);
  await clickTarget(page,{station:'Restore (',kit:'Repair kit',improvised:'Attempt improvised repair'}[method],true);
}
async function assertMenuFits(page){
  await page.waitForFunction(()=>{const r=canvas.getBoundingClientRect();return r.right<=innerWidth+1 && r.bottom<=innerHeight+1;});
  assert.ok(await page.evaluate(()=>{
    const bounds=canvas.getBoundingClientRect();
    return bounds.left>=0 && bounds.top>=0 && bounds.right<=innerWidth+1 && bounds.bottom<=innerHeight+1 &&
      canvasMenuTargets.every(target=>target.x>=0 && target.y>=0 && target.x+target.w<=canvasWidth && target.y+target.h<=canvasHeight);
  }),'menu controls stay inside the displayed game canvas');
}
module.exports={isSystemsOpen,canvasText,clickTarget,clickRepair,assertMenuFits};
