function drawSprite(key, x, y, fallbackColor){
  if(OPTIONS.asciiMode){
    drawAsciiTile(key, x, y, null);
    return;
  }
  drawSpriteGraphic(ctx,key,x,y,fallbackColor);
}

function drawSpriteGraphic(target,key,x,y,fallbackColor){
  if(IMG[key] instanceof HTMLCanvasElement){
    target.drawImage(IMG[key], x, y, TS, TS);
  } else if(IMG[key] && IMG[key].complete && IMG[key].naturalWidth>0){
    target.drawImage(IMG[key], x, y, TS, TS);
  } else if(fallbackColor){
    target.fillStyle = fallbackColor;
    target.fillRect(x, y, TS, TS);
  }
}

const CHROMA_SPRITE_CACHE = {};
function drawSpriteChromaKeyed(key, x, y, fallbackColor){
  if(OPTIONS.asciiMode){
    drawAsciiTile(key, x, y, null);
    return;
  }
  const img = IMG[key];
  if(img && img.complete && img.naturalWidth>0){
    if(!CHROMA_SPRITE_CACHE[key]){
      const srcW = img.naturalWidth || TS;
      const srcH = img.naturalHeight || TS;
      const off = document.createElement('canvas');
      off.width = srcW;
      off.height = srcH;
      const octx = off.getContext('2d');
      octx.drawImage(img, 0, 0, srcW, srcH);
      const data = octx.getImageData(0, 0, srcW, srcH);
      const px = data.data;
      for(let i=0;i<px.length;i+=4){
        const r = px[i], g = px[i+1], b = px[i+2], a = px[i+3];
        // Strip the baked-in grassy matte from the shipboard alien sprites.
        if(a > 0 && g > 70 && g > r + 18 && g > b + 18){
          px[i+3] = 0;
        }
      }
      octx.putImageData(data, 0, 0);
      CHROMA_SPRITE_CACHE[key] = off;
    }
    ctx.drawImage(CHROMA_SPRITE_CACHE[key], x, y, TS, TS);
  } else if(fallbackColor){
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(x, y, TS, TS);
  }
}

const DARK_MATTE_SPRITE_CACHE = {};
function drawSpriteDarkMatteKeyed(key, x, y, fallbackColor){
  if(OPTIONS.asciiMode){
    drawAsciiTile(key, x, y, null);
    return;
  }
  const img = IMG[key];
  if(img && img.complete && img.naturalWidth>0){
    if(!DARK_MATTE_SPRITE_CACHE[key]){
      const srcW = img.naturalWidth || TS;
      const srcH = img.naturalHeight || TS;
      const off = document.createElement('canvas');
      off.width = srcW;
      off.height = srcH;
      const octx = off.getContext('2d');
      octx.drawImage(img, 0, 0, srcW, srcH);
      const data = octx.getImageData(0, 0, srcW, srcH);
      const px = data.data;
      const seen = new Uint8Array(srcW * srcH);
      const queue = [];
      const edgeCounts = new Map();
      function countEdge(ix, iy){
        const idx = (iy*srcW + ix) * 4;
        if(px[idx+3] <= 0) return;
        const key = px[idx]+','+px[idx+1]+','+px[idx+2];
        edgeCounts.set(key, (edgeCounts.get(key) || 0) + 1);
      }
      for(let ix=0; ix<srcW; ix++){ countEdge(ix, 0); countEdge(ix, srcH-1); }
      for(let iy=0; iy<srcH; iy++){ countEdge(0, iy); countEdge(srcW-1, iy); }
      const matteSeeds = [...edgeCounts.entries()]
        .filter(entry=>entry[1] >= 4)
        .sort((a,b)=>b[1]-a[1])
        .slice(0, 8)
        .map(entry=>entry[0].split(',').map(Number));
      const dominantSeed = matteSeeds[0] || [0,0,0];
      const tolerance = key === 'ship_tile' ? 30 : 0;
      const isMatte = (idx)=>{
        if(px[idx+3] <= 0) return false;
        const r = px[idx], g = px[idx+1], b = px[idx+2];
        const dr = r - dominantSeed[0], dg = g - dominantSeed[1], db = b - dominantSeed[2];
        return (dr*dr + dg*dg + db*db) <= tolerance*tolerance;
      };
      function push(ix, iy){
        if(ix<0 || ix>=srcW || iy<0 || iy>=srcH) return;
        const p = iy*srcW + ix;
        if(seen[p]) return;
        const di = p * 4;
        if(!isMatte(di)) return;
        seen[p] = 1;
        queue.push(p);
      }
      for(let ix=0; ix<srcW; ix++){ push(ix, 0); push(ix, srcH-1); }
      for(let iy=0; iy<srcH; iy++){ push(0, iy); push(srcW-1, iy); }
      while(queue.length){
        const p = queue.shift();
        const di = p * 4;
        px[di+3] = 0;
        const ix = p % srcW;
        const iy = Math.floor(p / srcW);
        push(ix+1, iy); push(ix-1, iy); push(ix, iy+1); push(ix, iy-1);
      }
      octx.putImageData(data, 0, 0);
      DARK_MATTE_SPRITE_CACHE[key] = off;
    }
    ctx.drawImage(DARK_MATTE_SPRITE_CACHE[key], x, y, TS, TS);
  } else if(fallbackColor){
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(x, y, TS, TS);
  }
}

// Tint source pixels in an isolated cache, preserving the source alpha exactly.
// Multiplying on the map canvas would also tint/replace the terrain behind a ship.
const TINTED_SPRITE_CACHE = new WeakMap();
function tintedSpriteImage(source,tintColor){
  let colors=TINTED_SPRITE_CACHE.get(source);
  if(!colors){colors=new Map();TINTED_SPRITE_CACHE.set(source,colors);}
  if(colors.has(tintColor))return colors.get(tintColor);
  const off=document.createElement('canvas');
  off.width=source.naturalWidth||source.width;off.height=source.naturalHeight||source.height;
  const paint=off.getContext('2d');
  paint.fillStyle=tintColor;paint.fillRect(0,0,1,1);
  const tint=paint.getImageData(0,0,1,1).data;
  paint.clearRect(0,0,off.width,off.height);paint.drawImage(source,0,0);
  const data=paint.getImageData(0,0,off.width,off.height),pixels=data.data;
  for(let i=0;i<pixels.length;i+=4)for(let channel=0;channel<3;channel++){
    // A restrained tint retains metallic hull shading and warm engine colors.
    pixels[i+channel]=Math.round(pixels[i+channel]*(0.65+0.35*tint[channel]/255));
  }
  paint.putImageData(data,0,0);colors.set(tintColor,off);return off;
}
function drawSpriteTinted(key, x, y, tintColor, opacity=1){
  if(!OPTIONS.asciiMode && drawTintedSpriteGraphic(ctx,key,x,y,tintColor,opacity)) return;
  drawAsciiTile(key, x, y, null, tintColor);
}

function drawTintedSpriteGraphic(target,key,x,y,tintColor,opacity=1){
  const source=IMG[key];
  if(!(source instanceof HTMLCanvasElement || source?.complete && source.naturalWidth>0)) return false;
  target.save();
  target.globalAlpha*=opacity;
  target.imageSmoothingEnabled=false;
  target.drawImage(tintedSpriteImage(source,tintColor),Math.round(x),Math.round(y),TS,TS);
  target.restore();
  return true;
}

// -- Procedural draw helpers (used for galaxy tiles & effects) ---
