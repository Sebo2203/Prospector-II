const IMG = {};
function loadSprites(){
  return new Promise(resolve => {
    const keys = Object.keys(SPRITES_B64);
    let loaded = 0;
    keys.forEach(k => {
      const img = new Image();
      img.onload = () => { loaded++; if(loaded===keys.length) resolve(); };
      img.onerror = () => { loaded++; if(loaded===keys.length) resolve(); };
      img.src = SPRITES_B64[k];
      IMG[k] = img;
    });
  });
}

// -- Helper: draw a sprite tile, fallback to solid colour --------
// -- ASCII tile definitions ---------------------------------------
