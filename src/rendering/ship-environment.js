function drawShipCombatEnvironment(combat){
  const environment=combat.environment;if(environment?.type!=='nebula')return;
  const map=COMBAT_MAP,cloud=IMG.combat_nebula_cloud;
  const x=map.x,y=map.y,width=map.width*TS,height=map.height*TS;
  ctx.save();ctx.beginPath();ctx.rect(x,y,width,height);ctx.clip();
  ctx.filter=environment.variant==='pink'?'hue-rotate(65deg)':'none';
  ctx.globalAlpha=0.3;const backdropWidth=width*1.4,backdropHeight=backdropWidth*cloud.naturalHeight/cloud.naturalWidth;
  ctx.drawImage(cloud,x-width*0.2,y+(height-backdropHeight)/2,backdropWidth,backdropHeight);ctx.globalAlpha=1;ctx.filter='none';
  environment.pockets.forEach((pocket,index)=>{
    const visible=[];
    for(let py=pocket.y;py<pocket.y+pocket.height;py++)for(let px=pocket.x;px<pocket.x+pocket.width;px++){
      if(DEBUG.fullVision||combat.seenTiles[py*map.width+px])visible.push({x:px,y:py});
    }
    if(!visible.length)return;
    const struck=environment.lastStrike?.pocket===index&&environment.lastStrike.turn===G.turn;
    ctx.save();ctx.beginPath();for(const tile of visible)ctx.rect(x+tile.x*TS,y+tile.y*TS,TS,TS);ctx.clip();
    const left=x+pocket.x*TS,top=y+pocket.y*TS,w=pocket.width*TS,h=pocket.height*TS;
    if(OPTIONS.asciiMode){
      ctx.font='bold 18px Courier New';ctx.textAlign='left';ctx.fillStyle=struck?'#e5f7ff':'#929acb';
      for(const tile of visible)ctx.fillText(struck?'⚡':'~',x+tile.x*TS+6,y+tile.y*TS+18);
    }else{
      ctx.save();ctx.translate(left+w/2,top+h/2);const vertical=h>w;if(vertical)ctx.rotate(Math.PI/2);
      const scale=0.96*Math.min((vertical?h:w)/cloud.naturalWidth,(vertical?w:h)/cloud.naturalHeight);
      const dw=cloud.naturalWidth*scale,dh=cloud.naturalHeight*scale;
      ctx.globalAlpha=0.78;
      ctx.filter=environment.variant==='pink'?'hue-rotate(65deg)':'none';
      ctx.drawImage(cloud,-dw/2,-dh/2,dw,dh);ctx.restore();
      if(struck){
        let seed=(Math.imul(pocket.x+1,73856093)^Math.imul(pocket.y+1,19349663)^environment.lastStrike.turn)>>>0;
        const points=[];for(let i=0;i<=12;i++){
          seed=(Math.imul(seed,1664525)+1013904223)>>>0;
          points.push({x:left+w*(0.1+0.8*i/12),y:top+h*(0.2+0.6*i/12+(seed%101/100-0.5)*0.35)});
        }
        ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
        for(const index of [4,8]){const p=points[index];ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+w*0.08,p.y-h*0.18);ctx.lineTo(p.x+w*0.16,p.y-h*0.12);}
        ctx.shadowColor='#9bb8ff';ctx.shadowBlur=7;ctx.strokeStyle='#799fe8';ctx.lineWidth=2.5;ctx.stroke();
        ctx.shadowBlur=0;ctx.strokeStyle='#e5f7ff';ctx.lineWidth=0.8;ctx.stroke();
      }
    }
    canvasMenuTarget(left,top,w,h,null,{title:'Nebula gas · traversable · direct fire −15 percentage points'});
    ctx.restore();
  });
  ctx.restore();
}
