// Menus register hit areas in canvas coordinates as they draw.
const canvasMenuTargets = [];
let canvasMenuScroll = null;
let canvasMapView = null;
let pointerFireAim = null;

function resetCanvasMenu(){
  canvasMenuTargets.length = 0;
  canvasMenuScroll = null;
  canvas.removeAttribute('title');
  canvas.style.cursor = '';
}

function canvasMenuTarget(x,y,w,h,activate,{hover,title,shortcut,label}={}){
  canvasMenuTargets.push({x,y,w,h,activate,hover,title,shortcut,label,mode:G?.mode,view:G?._viewTab});
}

function canvasMenuButton(label,x,y,activate){
  ctx.save();
  ctx.textAlign = 'left';
  ctx.font = 'bold 12px Courier New';
  const w = Math.ceil(ctx.measureText(label).width) + 16;
  ctx.fillStyle = '#0e1721'; ctx.fillRect(x,y,w,22);
  ctx.strokeStyle = '#3a5268'; ctx.lineWidth = 1; ctx.strokeRect(x,y,w,22);
  ctx.fillStyle = '#aaddff'; ctx.fillText(label,x+8,y+15);
  ctx.restore();
  const key=label.match(/\[([^\]]+)\]$/)?.[1];
  const shortcut=key==='Esc'?'Escape':key?.length===1?key.toLowerCase():key;
  canvasMenuTarget(x,y,w,22,activate,{shortcut,label});
}

function canvasMenuBlocked(){
  return AUTOSAVE_STATE.transition || AUTOSAVE_STATE.loading || G?.forcedMove?.active ||
    document.getElementById('minimap-overlay').classList.contains('visible') ||
    document.getElementById('feedback-overlay').style.display==='flex' || BARTER.active;
}

function canvasPointerPoint(event){
  const rect = canvas.getBoundingClientRect();
  return {
    x:(event.clientX-rect.left)*canvasWidth/rect.width,
    y:(event.clientY-rect.top)*canvasHeight/rect.height,
  };
}

function canvasMenuHit(event){
  if(canvasMenuBlocked() || !canvasMenuTargets.length) return;
  const {x,y} = canvasPointerPoint(event);
  return canvasMenuTargets.find(target=>x>=target.x && x<target.x+target.w && y>=target.y && y<target.y+target.h);
}

function canvasMapMode(){
  if(!canvasMapView || !G || G.dead || G.retired || G.showOptions || G.dialogue ||
     G.stranded || G._itemAimMode || G._voidPrompt || G.forcedMove?.active || DEBUG.on) return;
  if(G.mode==='scanview') return 'landing';
  if(G.mode==='planet' && G.rangeTarget) return 'fire';
  if((G.mode==='planet'||G.mode==='galaxy') && G.examine) return 'examine';
}

function activateCanvasMapTile(event){
  const mode=canvasMapMode();
  if(!mode || canvasMenuBlocked()) return;
  const point=canvasPointerPoint(event);
  const col=Math.floor(point.x/TS), row=Math.floor(point.y/TS);
  if(col<0 || row<0 || col>=VIEW_W || row>=VIEW_H) return;
  const {camX,camY,width,height}=canvasMapView;
  const x=camX+col, y=camY+row;
  if(x>=width || y>=height) return;

  if(mode==='landing'){
    G.scanCursorX=x;
    G.scanCursorY=y;
  } else if(mode==='examine'){
    G.examine={x,y};
  } else {
    const aim=G.rangeTarget;
    if(pointerFireAim===aim && aim.x===x && aim.y===y){
      activateGameKey('Enter');
      return;
    }
    G.rangeTarget={x,y};
    pointerFireAim=G.rangeTarget;
  }
  renderAll();
}

canvas.addEventListener('click',event=>{
  if(event.button!==0) return;
  const target=canvasMenuHit(event);
  if(target?.activate) target.activate();
  else activateCanvasMapTile(event);
});
canvas.addEventListener('mousemove',event=>{
  const target = canvasMenuHit(event);
  target?.hover?.();
  canvas.style.cursor = target?.activate ? 'pointer' : '';
  const title = target?.title || '';
  if(canvas.title!==title) canvas.title = title;
});
canvas.addEventListener('mouseleave',()=>{
  canvas.removeAttribute('title');
  canvas.style.cursor = '';
});
canvas.addEventListener('wheel',event=>{
  if(!canvasMenuScroll || !event.deltaY || canvasMenuBlocked()) return;
  event.preventDefault();
  canvasMenuScroll(Math.sign(event.deltaY));
},{passive:false});

// Pointer clicks should not leave Enter and Space aimed at a HUD control.
document.addEventListener('click',event=>{
  if(event.detail>0) event.target.closest('button[data-menu-control]')?.blur();
},true);
