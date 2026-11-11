// Role silhouettes and direction selection are presentation only; never saved in G.
const SHIP_ROLE_ART = {
  trader: {sprite:'ship_trader',tint:'#e8be73'},
  cargo:  {sprite:'ship_cargo',tint:'#a8b7c6'},
  science:{sprite:'ship_science',tint:'#80dce4'},
  patrol: {sprite:'ship_patrol',tint:'#829fe8'},
};
function shipDirectionKey(key,dx,dy){
  const direction=dy<0?(dx<0?'nw':dx>0?'ne':'n'):dy>0?(dx<0?'sw':dx>0?'se':'s'):dx<0?'w':dx>0?'e':'n';
  const directional=direction==='n'?key:key+'_'+direction;
  return SHIP_SPRITES_B64[directional]?directional:key;
}
function neutralShipArt(ship){
  return SHIP_ROLE_ART[ship?.type] || {sprite:'pirate_ship',tint:'#a8b7c6'};
}
function drawDirectionalShip(key,x,y,dx,dy){
  // Use authored frames: rotating a 24px raster loses the original pixel shapes.
  drawSprite(OPTIONS.asciiMode?key:shipDirectionKey(key,dx,dy),Math.round(x),Math.round(y),'#aab8c8');
}
