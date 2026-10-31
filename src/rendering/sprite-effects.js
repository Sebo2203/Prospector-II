function drawSprite(key, x, y, fallbackColor){
  if(OPTIONS.asciiMode){
    drawAsciiTile(key, x, y, null);
    return;
  }
  if(IMG[key] instanceof HTMLCanvasElement){
    ctx.drawImage(IMG[key], x, y, TS, TS);
  } else if(IMG[key] && IMG[key].complete && IMG[key].naturalWidth>0){
    ctx.drawImage(IMG[key], x, y, TS, TS);
  } else if(fallbackColor){
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(x, y, TS, TS);
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

// Draw a sprite with a colour tint — multiply blend keeps darks black, shifts lights
function drawSpriteTinted(key, x, y, tintColor){
  if(OPTIONS.asciiMode){
    drawAsciiTile(key, x, y, null, tintColor);
    return;
  }
  if(IMG[key] && IMG[key].complete && IMG[key].naturalWidth>0){
    // Black background so dark sprite pixels stay dark
    ctx.fillStyle = '#04040c';
    ctx.fillRect(x, y, TS, TS);
    // Draw sprite normally first
    ctx.drawImage(IMG[key], x, y, TS, TS);
    // Multiply blend: black stays black, white becomes tint color, mid tones shift
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = tintColor;
    ctx.fillRect(x, y, TS, TS);
    ctx.restore();
  } else {
    ctx.fillStyle = tintColor;
    ctx.fillRect(x, y, TS, TS);
  }
}

// -- Procedural draw helpers (used for galaxy tiles & effects) ---
