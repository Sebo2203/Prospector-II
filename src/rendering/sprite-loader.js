const IMG = {};
function loadSprites(){
  return new Promise(resolve => {
    const sources={...SPRITES_B64,...SHIP_SPRITES_B64,...COMBAT_SPRITES_B64};
    const keys = Object.keys(sources);
    let loaded = 0;
    keys.forEach(k => {
      const img = new Image();
      img.onload = () => { loaded++; if(loaded===keys.length) resolve(); };
      img.onerror = () => { loaded++; if(loaded===keys.length) resolve(); };
      img.src = sources[k];
      IMG[k] = img;
    });
  });
}

// -- Helper: draw a sprite tile, fallback to solid colour --------
// -- ASCII tile definitions ---------------------------------------
