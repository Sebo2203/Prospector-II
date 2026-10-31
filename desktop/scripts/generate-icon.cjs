const fs = require('fs');
const path = require('path');
const size = 64;
const xorBytes = size * size * 4;
const andStride = Math.ceil(size / 32) * 4;
const andBytes = andStride * size;
const dibSize = 40 + xorBytes + andBytes;
const icoSize = 6 + 16 + dibSize;
const buf = Buffer.alloc(icoSize);
let o = 0;
buf.writeUInt16LE(0, o); o += 2;
buf.writeUInt16LE(1, o); o += 2;
buf.writeUInt16LE(1, o); o += 2;
buf.writeUInt8(size, o++);
buf.writeUInt8(size, o++);
buf.writeUInt8(0, o++);
buf.writeUInt8(0, o++);
buf.writeUInt16LE(1, o); o += 2;
buf.writeUInt16LE(32, o); o += 2;
buf.writeUInt32LE(dibSize, o); o += 4;
buf.writeUInt32LE(22, o); o += 4;
// BITMAPINFOHEADER
buf.writeUInt32LE(40, o); o += 4;
buf.writeInt32LE(size, o); o += 4;
buf.writeInt32LE(size * 2, o); o += 4;
buf.writeUInt16LE(1, o); o += 2;
buf.writeUInt16LE(32, o); o += 2;
buf.writeUInt32LE(0, o); o += 4;
buf.writeUInt32LE(xorBytes + andBytes, o); o += 4;
buf.writeInt32LE(2835, o); o += 4;
buf.writeInt32LE(2835, o); o += 4;
buf.writeUInt32LE(0, o); o += 4;
buf.writeUInt32LE(0, o); o += 4;
const pixStart = o;
function setPixel(x, y, r, g, b, a = 255) {
  const row = size - 1 - y;
  const p = pixStart + (row * size + x) * 4;
  buf[p] = b; buf[p + 1] = g; buf[p + 2] = r; buf[p + 3] = a;
}
for (let y = 0; y < size; y++) {
  for (let x = 0; x < size; x++) {
    const dx = x - 31.5, dy = y - 31.5;
    const d = Math.sqrt(dx * dx + dy * dy);
    const edge = d > 31 ? 0 : 255;
    const glow = Math.max(0, 1 - d / 34);
    const r = Math.round(6 + glow * 38);
    const g = Math.round(8 + glow * 46);
    const b = Math.round(16 + glow * 72);
    setPixel(x, y, r, g, b, edge);
  }
}
// Gold planet / coin
for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
  const dx = x - 31.5, dy = y - 34;
  const d = Math.sqrt(dx * dx + dy * dy);
  if (d < 17) setPixel(x, y, 196 + Math.round((17-d)*2), 142 + Math.round((17-d)*2), 44, 255);
  if (d >= 17 && d < 19) setPixel(x, y, 60, 36, 18, 255);
}
// Simple ship silhouette
for (let y = 14; y < 31; y++) for (let x = 18; x < 46; x++) {
  const mid = 32;
  const half = Math.max(1, Math.floor((y - 12) * 0.75));
  if (Math.abs(x - mid) <= half && y < 29) setPixel(x, y, 220, 236, 240, 255);
}
for (let y = 25; y < 39; y++) for (let x = 13; x < 51; x++) {
  if ((x < 24 && y > 33 - (24 - x) * 0.4) || (x > 40 && y > 33 - (x - 40) * 0.4)) setPixel(x, y, 95, 125, 150, 255);
}
// tiny star
const stars = [[12,12],[49,15],[46,49],[14,47]];
for (const [sx, sy] of stars) {
  setPixel(sx, sy, 255, 246, 168, 255);
  setPixel(sx - 1, sy, 255, 246, 168, 180);
  setPixel(sx + 1, sy, 255, 246, 168, 180);
  setPixel(sx, sy - 1, 255, 246, 168, 180);
  setPixel(sx, sy + 1, 255, 246, 168, 180);
}
fs.writeFileSync(path.join(__dirname, '..', 'src-tauri', 'icons', 'icon.ico'), buf);
