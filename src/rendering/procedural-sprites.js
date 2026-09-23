// ── Procedural sprite pre-renderer ──────────────────────────────────────────
// Generates 16 variants of each procedural rock type into IMG cache.
// Called once after loadSprites(). Zero per-frame cost — just drawImage().
function generateProceduralSprites(){
  const N_VARIANTS = 16;
  const hh = (a,b,s) => { let v=(a*2749+b*1847+s*3571)&0xffff; v^=v>>7; v*=0xd5b3; return (v&0xffff)/65535; };

  // Helper: make an offscreen canvas and return {canvas, ctx}
  const makeOff = () => {
    const c = document.createElement('canvas');
    c.width = c.height = TS;
    return { canvas:c, ctx:c.getContext('2d') };
  };

  // ── Volcanic rock variants ────────────────────────────────────────────
  for(let vi=0; vi<N_VARIANTS; vi++){
    const {canvas,ctx:c} = makeOff();
    // Transparent background — floor drawn underneath at render time
    const gx=vi*7, gy=vi*13; // pseudo-position seed
    const tipX  = 9  + Math.round(hh(gx,gy,1)*5);
    const baseL = 2  + Math.round(hh(gx,gy,2)*3);
    const baseR = 19 - Math.round(hh(gx,gy,3)*3);
    const tipY  = 2  + Math.round(hh(gx,gy,4)*4);
    const baseY = 19 + Math.round(hh(gx,gy,5)*2);
    const warm  = Math.round(hh(gx,gy,6)*8);
    const mk = (r,g,b) => `rgb(${Math.min(255,r+warm)},${Math.min(255,g+warm)},${Math.min(255,b+warm)})`;
    const C_DEEP=mk(12,8,8),C_DARK=mk(28,18,16),C_MID=mk(46,30,26),C_LIGHT=mk(66,44,38),C_BRIGHT=mk(88,60,50);
    const bounds = (row) => {
      if(row<tipY||row>baseY) return null;
      const f=(row-tipY)/Math.max(1,baseY-tipY);
      const hw=Math.round(f*((baseR-baseL)/2));
      return [Math.max(0,tipX-hw),Math.min(23,tipX+hw)];
    };
    // Outline
    c.fillStyle='rgba(0,0,0,0.82)';
    for(let row=tipY-1;row<=baseY+1;row++){
      const cur=row>=tipY&&row<=baseY?bounds(row):null;
      const prev=(row-1)>=tipY&&(row-1)<=baseY?bounds(row-1):null;
      if(!cur){const ref=prev;if(ref)for(let p=ref[0];p<=ref[1];p++)c.fillRect(p,row,1,1);continue;}
      const[lx,rx]=cur;
      if(lx>0)c.fillRect(lx-1,row,1,1);
      if(rx<23)c.fillRect(rx+1,row,1,1);
      if(prev){
        for(let p=lx;p<=Math.min(prev[0]-1,rx);p++)c.fillRect(p,row,1,1);
        for(let p=Math.max(prev[1]+1,lx);p<=rx;p++)c.fillRect(p,row,1,1);
      }
    }
    // Body
    for(let row=tipY;row<=baseY;row++){
      const b=bounds(row);if(!b)continue;
      const[lx,rx]=b;const f=(row-tipY)/Math.max(1,baseY-tipY);const w=rx-lx;
      for(let p=lx;p<=rx;p++){
        const pos=w>0?(p-lx)/w:0.5;
        let col=pos<0.10?C_BRIGHT:pos<0.25?C_LIGHT:pos>0.88?C_DEEP:pos>0.75?C_DARK:f>0.5?C_MID:C_DARK;
        c.fillStyle=col;c.fillRect(p,row,1,1);
      }
    }
    // Lava cracks
    const nc=1+Math.floor(hh(gx,gy,7)*2.99);
    for(let ci=0;ci<nc;ci++){
      let cx3=Math.round(tipX-2+hh(gx,gy,8+ci*3)*8);
      const sy2=Math.round(tipY+(baseY-tipY)*0.25+hh(gx,gy,9+ci*3)*(baseY-tipY)*0.45);
      const len=2+Math.round(hh(gx,gy,10+ci*3)*5);
      for(let cy3=sy2;cy3<sy2+len&&cy3<=baseY;cy3++){
        const f2=(cy3-tipY)/Math.max(1,baseY-tipY);
        const hw2=Math.round(f2*((baseR-baseL)/2));
        if(Math.abs(cx3-tipX)<=hw2){
          const br=190+Math.round(hh(gx,gy,ci*7+cy3)*55);
          c.fillStyle=`rgb(${br},${55+Math.round(hh(gx,gy,ci+cy3)*30)},8)`;
          c.fillRect(cx3,cy3,1,1);
        }
        cx3+=Math.round(hh(gx,gy,ci*11+cy3)*3)-1;
      }
    }
    // Shadow
    const bb=bounds(baseY);
    if(bb){c.fillStyle='rgba(0,0,0,0.3)';c.fillRect(bb[0]+1,baseY+1,bb[1]-bb[0]-1,1);}
    IMG['volcanic_rock_v'+vi] = canvas;
  }

      // ── Desert rock variants — 3 simple sand hills ───────────────────────
  const desertHillB64 = [
    "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAyElEQVR42mPc2WDEQA3AxEAlMGrQqEGEwN5zTwiqYcEjd/vRGwYGhkdvfiCb5WwkQ5qLfv76AWHIiXDIiXAQdB0THlPkJHjkJHjgxuE3C4tBIkh6IMYRYxZ2F0lLCUhLCWA1Sw7VGqJiDc0srE7DaZCqhpigCB9Ws9CchuY7dINu33jFwMCAZhZWb6KlA5xeQzYLjzeJCiNBET483iRsEMR3WJ0G9yY7GwdRLsJjFlZT8HkN0yyIcW/e/CA908LMUtUQQzMXEwAAvWA5H/Q6iT8AAAAASUVORK5CYII=",
    "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAzElEQVR42mPc2WDEQA3AxEAlMGrQqEFDzKC9554QYxALVtHbj95AGI/e/EAzy9lIhigX/fz14+evH3ISPBCunAiHnAgHmgOxupEJzRQ4W06CB79xOA0SEeGQlhKQlhJAlsZjHJpZWAKbJOPQDVLVEBMU4SPVOGRHQQ26feMVAwODoAgfScYhxyCW6IeY9f7NJ2TjGBgYnj77gGwczsCGOArZOPyuY2fjwBnYaGbhMQ7NFCxeg5ilqiGGy7Nv3vwgJYsgOU1VQwzTpZgAAJ2ZSPzat+loAAAAAElFTkSuQmCC",
    "iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAIAAABvFaqvAAAAu0lEQVR42mPc2WDEQA3AxEAlMGrQqEGjBlFu0N5zTwiqYcEUuv3oDTFmORvJIHMZkYuRn79+IMs9evEFTfOjNz9wGQc1SESEA8J/+uwDpnMImuhsJIPuNWkpAUwT5SR40EyUg1kMN5FxZ4ORqoYYAwPD+zefsIYiMW589OYH1GsQsyCADBNV5USwxJqgCB9WE/H7GmrQ7Ruv0NxF0ESIcexsHFjSEVbjcJkINwJ3grzxCk1EVUMMUxANAABA4FnftfHlHwAAAABJRU5ErkJggg==",
  ];
  desertHillB64.forEach((b64,i)=>{
    const img2=new Image(); img2.src='data:image/png;base64,'+b64;
    img2.onload=()=>{}; IMG['desert_rock_v'+i]=img2;
  });
  for(let vi=3;vi<16;vi++) IMG['desert_rock_v'+vi]=IMG['desert_rock_v'+(vi%3)];
  // ── Toxic rock variants — jagged craggy ──────────────────────────────
  for(let vi=0; vi<N_VARIANTS; vi++){
    const {canvas,ctx:c} = makeOff();
    const gx=vi*9, gy=vi*19;
    const C_DEEP='rgb(22,35,8)',C_DARK='rgb(38,58,14)',C_MID='rgb(55,80,20)',C_LIGHT='rgb(72,105,28)';
    const C_ACID='rgb(95,190,30)',C_ACID2='rgb(60,140,18)';
    const cx2=9+Math.round(hh(gx,gy,1)*5);
    const tipY=2+Math.round(hh(gx,gy,2)*4);
    const baseY=18+Math.round(hh(gx,gy,3)*3);
    const jbounds=(row)=>{
      if(row<tipY||row>baseY)return null;
      const f=(row-tipY)/Math.max(1,baseY-tipY);
      const bw=Math.round(3+f*8);
      const jag=Math.round(hh(gx,gy,10+row)*4)-2;
      const jag2=Math.round(hh(gx,gy,20+row)*3)-1;
      return[Math.max(0,cx2-(bw+jag)),Math.min(23,cx2+(bw+jag2))];
    };
    // Outline
    c.fillStyle='rgba(0,0,0,0.80)';
    for(let row=tipY-1;row<=baseY+1;row++){
      const cur=row>=tipY&&row<=baseY?jbounds(row):null;
      const prev=(row-1)>=tipY&&(row-1)<=baseY?jbounds(row-1):null;
      if(!cur){const ref=prev;if(ref)for(let p=ref[0];p<=ref[1];p++)c.fillRect(p,row,1,1);continue;}
      const[lx,rx]=cur;
      if(lx>0)c.fillRect(lx-1,row,1,1);
      if(rx<23)c.fillRect(rx+1,row,1,1);
      if(prev){
        for(let p=lx;p<=Math.min(prev[0]-1,rx);p++)c.fillRect(p,row,1,1);
        for(let p=Math.max(prev[1]+1,lx);p<=rx;p++)c.fillRect(p,row,1,1);
      }
    }
    // Body
    for(let row=tipY;row<=baseY;row++){
      const b=jbounds(row);if(!b)continue;
      const[lx,rx]=b;const f=(row-tipY)/Math.max(1,baseY-tipY);const w=rx-lx;
      for(let p=lx;p<=rx;p++){
        const pos=w>0?(p-lx)/w:0.5;
        let col=pos<0.12?C_LIGHT:pos>0.85?C_DEEP:pos>0.72?C_DARK:f>0.5?C_MID:C_DARK;
        c.fillStyle=col;c.fillRect(p,row,1,1);
      }
    }
    // Acid veins
    const nv=1+Math.floor(hh(gx,gy,7)*1.99);
    for(let vi2=0;vi2<nv;vi2++){
      let vx=Math.round(cx2-2+hh(gx,gy,8+vi2*3)*6);
      const vsy=Math.round(tipY+(baseY-tipY)*0.2+hh(gx,gy,9+vi2*3)*(baseY-tipY)*0.5);
      const vlen=3+Math.round(hh(gx,gy,10+vi2*3)*6);
      for(let vy2=vsy;vy2<vsy+vlen&&vy2<=baseY;vy2++){
        const b2=jbounds(vy2);
        if(b2&&vx>=b2[0]&&vx<=b2[1]){c.fillStyle=vi2===0?C_ACID:C_ACID2;c.fillRect(vx,vy2,1,1);}
        vx+=Math.round(hh(gx,gy,vi2*7+vy2)*3)-1;
      }
    }
    const bb3=jbounds(baseY);
    if(bb3){c.fillStyle='rgba(0,0,0,0.25)';c.fillRect(bb3[0]+1,baseY+1,bb3[1]-bb3[0]-1,1);}
    IMG['toxic_rock_v'+vi] = canvas;
  }

  // ── Toxic floor variant 2 — acid pool / wet slick ────────────────────
  {
    const {canvas, ctx:c} = makeOff();
    const h = (a,b,s) => { let v=(a*3137+b*2411+s*1777)&0xffff; v^=v>>8; v*=0xc3d7; return (v&0xffff)/65535; };
    // Dark near-black base with slight blue-green cast
    c.fillStyle='#040e05'; c.fillRect(0,0,TS,TS);
    // 3 acid puddle blobs — stretched ellipses with highlight stripe
    const puddles = [[3,4,9,3],[11,14,7,2],[16,7,5,4]];
    puddles.forEach(([px,py,rw,rh],pi) => {
      c.fillStyle = pi===1 ? '#0d2b0a' : '#091f07';
      c.fillRect(px, py, rw, rh);
      // Sickly yellow-green highlight along top edge
      c.fillStyle = '#4d9410';
      c.fillRect(px+1, py, Math.max(1,rw-2), 1);
      // Specular glint dot
      c.fillStyle = '#a8e840';
      c.fillRect(px + Math.floor(rw*0.35), py, 1, 1);
    });
    // Horizontal chemical residue smears
    [[2,9,10],[14,17,7],[5,19,8]].forEach(([sx,sy,sl]) => {
      c.fillStyle = '#1c3a08';
      c.fillRect(sx, sy, sl, 1);
    });
    // A few scattered bubble dots
    [[8,12],[18,5],[3,20]].forEach(([bx,by]) => {
      c.fillStyle='#6ec820'; c.fillRect(bx,by,1,1);
    });
    IMG['toxic_floor2'] = canvas;
  }

  // ── Toxic floor variant 3 — cracked dried crust ───────────────────────
  {
    const {canvas, ctx:c} = makeOff();
    // Near-black subfloor base
    c.fillStyle='#050d04'; c.fillRect(0,0,TS,TS);
    // Voronoi-style cracked plates: hardcoded centers for a 24×24 tile
    const centers = [[5,5],[17,4],[11,12],[3,18],[20,17],[13,21]];
    for(let py=0; py<TS; py++){
      for(let px=0; px<TS; px++){
        let best=9999, second=9999;
        let bestI=0;
        for(let ci=0; ci<centers.length; ci++){
          const dx=px-centers[ci][0], dy=py-centers[ci][1];
          const d=dx*dx+dy*dy; // squared distance — no sqrt needed
          if(d<best){ second=best; best=d; bestI=ci; }
          else if(d<second) second=d;
        }
        // Crack: where two cells meet (edge thin ~2px)
        if(second-best < 8){
          c.fillStyle='#020604';
        } else {
          // Each plate gets its own olive/khaki shade
          const shades = ['#253910','#1c2d0b','#2a3d12','#182608','#1f310e','#213612'];
          c.fillStyle = shades[bestI % shades.length];
        }
        c.fillRect(px,py,1,1);
      }
    }
    // Toxic seep dots bleeding through crack intersections
    [[5,11],[11,4],[17,16],[3,17],[20,9]].forEach(([sx,sy]) => {
      c.fillStyle='#4a9a14'; c.fillRect(sx,sy,1,1);
      c.fillStyle='#78cc22'; c.fillRect(sx,sy,1,1); // overwrite with brighter for glint
    });
    IMG['toxic_floor3'] = canvas;
  }
}

