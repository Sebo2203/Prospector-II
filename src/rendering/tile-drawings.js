const DRAW = {
  void(c,x,y){
    c.fillStyle='#04040c'; c.fillRect(x,y,TS,TS);
  },
  nebula(c,x,y,variant,mx,my){
    const isBlue = variant === 'blue';
    const tx = Number.isFinite(mx) ? mx : Math.floor(x / TS);
    const ty = Number.isFinite(my) ? my : Math.floor(y / TS);
    let seed = ((tx+17)*73856093 ^ (ty+31)*19349663) >>> 0;
    function nr(){
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 0xFFFFFFFF;
    }
    const dark = isBlue ? ['#020712','#061427','#0b2137'] : ['#07040d','#16071f','#241035'];
    const mid  = isBlue ? ['#0c315d','#145f96','#2a9ed0'] : ['#35114a','#6b2384','#b045a5'];
    const hot  = isBlue ? '#89ddff' : '#ff9be6';
    c.save();
    c.fillStyle = dark[Math.floor(nr()*dark.length)];
    c.fillRect(x,y,TS,TS);

    // Blocky pixel fog underlay, deliberately denser than the old smooth blobs.
    for(let i=0;i<9;i++){
      const rx = x + Math.floor(nr()*22) - 2;
      const ry = y + Math.floor(nr()*22) - 2;
      const rw = 4 + Math.floor(nr()*10);
      const rh = 2 + Math.floor(nr()*7);
      c.globalAlpha = 0.10 + nr()*0.18;
      c.fillStyle = mid[Math.floor(nr()*mid.length)];
      c.fillRect(rx, ry, rw, rh);
    }

    // Curved bright gas vein, like a small hand-painted Prospector-style cloud.
    c.globalAlpha = 0.55;
    c.strokeStyle = mid[2];
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x-2, y+6+nr()*9);
    c.bezierCurveTo(x+5+nr()*5, y-2+nr()*8, x+13+nr()*6, y+18-nr()*8, x+26, y+7+nr()*10);
    c.stroke();
    c.globalAlpha = 0.35;
    c.strokeStyle = hot;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x+1, y+9+nr()*6);
    c.bezierCurveTo(x+7+nr()*3, y+4+nr()*5, x+15+nr()*4, y+20-nr()*5, x+23, y+12+nr()*5);
    c.stroke();

    // Dark holes and bright dust points give it a grittier pixel-sprite read.
    for(let i=0;i<4;i++){
      c.globalAlpha = 0.35;
      c.fillStyle = '#020208';
      c.fillRect(x+Math.floor(nr()*21), y+Math.floor(nr()*21), 2+Math.floor(nr()*3), 1+Math.floor(nr()*3));
    }
    for(let i=0;i<5;i++){
      c.globalAlpha = 0.35 + nr()*0.35;
      c.fillStyle = nr()<0.35 ? hot : '#cfeaff';
      c.fillRect(x+Math.floor(nr()*24), y+Math.floor(nr()*24), 1, 1);
    }
    c.restore();
  },
  gas_entity(c,x,y,variant){
    // Nebula gas entity — an amorphous, predatory cloud-being that haunts nebulae.
    // Variant: 'blue' or 'pink' to blend with its host nebula.
    const isBlue = variant === 'blue';
    const coreCol  = isBlue ? '#55ccff' : '#dd66ff';
    const midCol   = isBlue ? '#2277bb' : '#993399';
    const glowCol  = isBlue ? 'rgba(40,120,220,0.22)' : 'rgba(180,40,220,0.22)';
    const rimCol   = isBlue ? '#88eeff' : '#ffaaff';
    const eyeCol   = isBlue ? '#ffffff' : '#ffeecc';
    let seed = ((Math.floor(x/TS)+99)*31337 ^ (Math.floor(y/TS)+77)*17239) >>> 0;
    function nr(){ seed=(Math.imul(seed,1664525)+1013904223)>>>0; return seed/0xFFFFFFFF; }
    c.save();
    // Outer gas halo — two overlapping blobs offset from centre
    c.globalAlpha = 0.55;
    c.fillStyle = glowCol.replace('0.22','0.18');
    c.beginPath(); c.arc(x+10, y+11, 9, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(x+14, y+13, 7, 0, Math.PI*2); c.fill();
    // Mid-layer — denser core gas
    c.globalAlpha = 0.70;
    c.fillStyle = midCol;
    c.beginPath(); c.arc(x+12, y+12, 7, 0, Math.PI*2); c.fill();
    // Tendrils — short wavery arms reaching outward
    c.globalAlpha = 0.45;
    c.strokeStyle = midCol;
    c.lineWidth = 2;
    for(let i=0;i<5;i++){
      const angle = (i/5)*Math.PI*2 + nr()*0.4;
      const r1 = 7, r2 = 10 + nr()*4;
      c.beginPath();
      c.moveTo(x+12+Math.cos(angle)*r1, y+12+Math.sin(angle)*r1);
      c.quadraticCurveTo(
        x+12+Math.cos(angle+0.4)*r2*0.7, y+12+Math.sin(angle+0.3)*r2*0.7,
        x+12+Math.cos(angle-0.3+nr()*0.6)*r2, y+12+Math.sin(angle+nr()*0.5)*r2
      );
      c.stroke();
    }
    // Bright inner core
    c.globalAlpha = 0.90;
    c.fillStyle = coreCol;
    c.beginPath(); c.arc(x+12, y+12, 4, 0, Math.PI*2); c.fill();
    // Glowing rim highlight
    c.globalAlpha = 0.50;
    c.strokeStyle = rimCol;
    c.lineWidth = 1;
    c.beginPath(); c.arc(x+11, y+10, 3, Math.PI*1.1, Math.PI*1.8); c.stroke();
    // Two menacing eye-spots
    c.globalAlpha = 0.95;
    c.fillStyle = eyeCol;
    c.beginPath(); c.arc(x+10, y+11, 1.5, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(x+14, y+11, 1.5, 0, Math.PI*2); c.fill();
    c.fillStyle = '#000000';
    c.beginPath(); c.arc(x+10.5, y+11, 0.7, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(x+14.5, y+11, 0.7, 0, Math.PI*2); c.fill();
    // Pixel dust sparks
    c.globalAlpha = 0.60;
    c.fillStyle = rimCol;
    for(let i=0;i<4;i++){
      c.fillRect(x+3+Math.floor(nr()*18), y+3+Math.floor(nr()*18), 1, 1);
    }
    c.restore();
  },
  bloom_floor(c,x,y){
    const seed = (x*37 + y*61) % 5;
    drawSprite('earth_floor', x, y, '#0a1a08');
    c.fillStyle = seed % 2 ? 'rgba(80,130,45,0.18)' : 'rgba(45,120,65,0.16)';
    c.fillRect(x,y,TS,TS);
    const cols = ['#ff66cc','#ffe066','#70d8ff','#ff8844','#d488ff','#90f0a0'];
    for(let i=0;i<5;i++){
      const fx = x + 3 + ((x*11 + y*7 + i*5) % 18);
      const fy = y + 3 + ((x*5 + y*13 + i*7) % 18);
      c.fillStyle = cols[(seed+i)%cols.length];
      c.fillRect(fx, fy, 2, 2);
      if(i%2===0) c.fillRect(fx+1, fy-1, 1, 1);
    }
  },
  bloom_floor2(c,x,y){
    const seed = (x*19 + y*47) % 4;
    drawSprite('earth_floor2', x, y, '#0a1a08');
    c.fillStyle = 'rgba(55,125,45,0.18)';
    c.fillRect(x,y,TS,TS);
    c.fillStyle = 'rgba(120,190,70,0.42)';
    for(let i=0;i<4;i++){
      const lx = x + ((x*7 + y*3 + i*6) % 22);
      const ly = y + ((x*2 + y*9 + i*4) % 22);
      c.fillRect(lx, ly, 3, 1);
    }
    const cols = ['#ff5599','#aa88ff','#ffee55','#55e0ff'];
    for(let i=0;i<7;i++){
      const fx = x + 2 + ((x*13 + y*17 + i*3) % 20);
      const fy = y + 2 + ((x*3 + y*11 + i*5) % 20);
      c.fillStyle = cols[(seed+i)%cols.length];
      c.beginPath();
      c.arc(fx, fy, 1.5, 0, Math.PI*2);
      c.fill();
    }
  },
  bloom_thicket(c,x,y){
    drawSprite('earth_floor', x, y, '#0a1a08');
    drawSpriteDarkMatteKeyed('earth_forest', x, y, '#224422');
    const seed=(x*23+y*29)%3;
    const cols=['#8d44dd','#dd4488','#44bb88'];
    c.fillStyle=cols[seed];
    c.beginPath(); c.arc(x+6,y+5,3,0,Math.PI*2); c.fill();
    c.fillStyle=cols[(seed+1)%cols.length];
    c.beginPath(); c.arc(x+15,y+8,3,0,Math.PI*2); c.fill();
    c.fillStyle=cols[(seed+2)%cols.length];
    c.beginPath(); c.arc(x+11,y+10,2.5,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(255,255,180,0.55)';
    c.fillRect(x+6,y+5,1,1); c.fillRect(x+15,y+8,1,1); c.fillRect(x+11,y+10,1,1);
  },
  civ_local_base(c,x,y,body,accent,detail){
    c.fillStyle='rgba(0,0,0,0.28)';
    c.beginPath(); c.ellipse(x+12,y+20,7,2.5,0,0,Math.PI*2); c.fill();
    c.fillStyle=body;
    c.fillRect(x+9,y+8,6,10);
    c.fillRect(x+8,y+12,2,5);
    c.fillRect(x+15,y+12,2,5);
    c.fillRect(x+10,y+18,2,3);
    c.fillRect(x+13,y+18,2,3);
    c.beginPath(); c.arc(x+12,y+6,4,0,Math.PI*2); c.fill();
    c.fillStyle=accent;
    c.fillRect(x+9,y+11,6,2);
    if(detail==='wrap'){ c.fillRect(x+7,y+9,3,2); c.fillRect(x+14,y+15,4,2); }
    if(detail==='cloak'){ c.fillRect(x+8,y+8,2,11); c.fillRect(x+15,y+8,2,11); }
    if(detail==='cap'){ c.fillRect(x+8,y+3,8,2); c.fillRect(x+10,y+1,4,2); }
    if(detail==='visor'){ c.fillRect(x+8,y+5,8,2); c.fillStyle='#d8f6ff'; c.fillRect(x+10,y+5,4,1); }
    c.fillStyle='#f4e0b0';
    c.fillRect(x+10,y+6,1,1); c.fillRect(x+14,y+6,1,1);
  },
  civ_local_primitive(c,x,y){ DRAW.civ_local_base(c,x,y,'#8a5a32','#d8b26a','wrap'); },
  civ_local_tribal(c,x,y){ DRAW.civ_local_base(c,x,y,'#5f7a3a','#a8d86a','wrap'); },
  civ_local_medieval(c,x,y){ DRAW.civ_local_base(c,x,y,'#7c7470','#c8c0a0','cloak'); },
  civ_local_industrial(c,x,y){ DRAW.civ_local_base(c,x,y,'#3f4e5e','#d0a15a','cap'); },
  civ_local_information(c,x,y){ DRAW.civ_local_base(c,x,y,'#203650','#70d8ff','visor'); },

  // -- Species-specific draw overrides --
  // Each species_tier combination calls the base with species-appropriate colours,
  // then layers species-specific details on top.

  // MAMMALIAN — warm fur colours, ear triangles, diet-hinted eye colour
  civ_mammalian_base(c,x,y,body,accent,detail,eyeCol){
    DRAW.civ_local_base(c,x,y,body,accent,detail);
    // Ear triangles above head
    c.fillStyle=body;
    c.fillRect(x+8,y+1,2,3); c.fillRect(x+14,y+1,2,3);
    // Fur stripe across mid-torso (accent shade, 1px)
    c.fillStyle=accent;
    c.fillRect(x+9,y+13,6,1);
    // Diet-hinted eye colour override
    c.fillStyle=eyeCol||'#a06020';
    c.fillRect(x+10,y+6,1,1); c.fillRect(x+14,y+6,1,1);
  },
  civ_Mammalian_primitive(c,x,y){ DRAW.civ_mammalian_base(c,x,y,'#7a4a28','#c8a060','wrap','#a07030'); },
  civ_Mammalian_tribal(c,x,y){ DRAW.civ_mammalian_base(c,x,y,'#5a6a2a','#98c85a','wrap','#806020'); },
  civ_Mammalian_medieval(c,x,y){ DRAW.civ_mammalian_base(c,x,y,'#6c6460','#b8b090','cloak','#704020'); },
  civ_Mammalian_industrial(c,x,y){ DRAW.civ_mammalian_base(c,x,y,'#384858','#c09050','cap','#805030'); },
  civ_Mammalian_information(c,x,y){ DRAW.civ_mammalian_base(c,x,y,'#183040','#60c8ef','visor','#50a0c0'); },

  // REPTILIAN — green/brown scales, slit pupils, dorsal ridge stripe
  civ_reptilian_base(c,x,y,body,accent,detail){
    DRAW.civ_local_base(c,x,y,body,accent,detail);
    // Dorsal ridge: thin lighter stripe down spine
    c.fillStyle=accent;
    c.fillRect(x+11,y+8,2,10);
    // Checkerboard scale hint on torso (alternating 2x1 px)
    c.fillStyle='rgba(0,0,0,0.25)';
    for(let i=0;i<3;i++){ c.fillRect(x+9+(i*2),y+9,1,1); c.fillRect(x+10+(i*2),y+11,1,1); }
    // Slit pupils (vertical 1x2 amber)
    c.fillStyle='#c8a020';
    c.fillRect(x+10,y+5,1,2); c.fillRect(x+14,y+5,1,2);
  },
  civ_Reptilian_primitive(c,x,y){ DRAW.civ_reptilian_base(c,x,y,'#3a6030','#7ac870','wrap'); },
  civ_Reptilian_tribal(c,x,y){ DRAW.civ_reptilian_base(c,x,y,'#4a7040','#6ab860','wrap'); },
  civ_Reptilian_medieval(c,x,y){ DRAW.civ_reptilian_base(c,x,y,'#506840','#90a870','cloak'); },
  civ_Reptilian_industrial(c,x,y){ DRAW.civ_reptilian_base(c,x,y,'#304838','#80a870','cap'); },
  civ_Reptilian_information(c,x,y){ DRAW.civ_reptilian_base(c,x,y,'#203828','#50d888','visor'); },

  // INSECTOID — dark chitin, compound eyes, antennae, segment gap
  civ_insectoid_base(c,x,y,body,accent,detail){
    DRAW.civ_local_base(c,x,y,body,accent,detail);
    // Antennae — two thin lines from head top
    c.fillStyle=body;
    c.fillRect(x+9,y+1,1,3); c.fillRect(x+15,y+1,1,3);
    c.fillRect(x+7,y+0,2,1); c.fillRect(x+16,y+0,2,1);
    // Segment gap line across abdomen
    c.fillStyle='rgba(0,0,0,0.40)';
    c.fillRect(x+9,y+14,6,1);
    // Compound eyes — faceted 2x2 with glow centre
    c.fillStyle='#ffe080';
    c.fillRect(x+9,y+5,3,2); c.fillRect(x+13,y+5,3,2);
    c.fillStyle='rgba(255,240,120,0.55)';
    c.fillRect(x+10,y+5,1,1); c.fillRect(x+14,y+5,1,1);
  },
  civ_Insectoid_primitive(c,x,y){ DRAW.civ_insectoid_base(c,x,y,'#2a1a08','#c87020','wrap'); },
  civ_Insectoid_tribal(c,x,y){ DRAW.civ_insectoid_base(c,x,y,'#381808','#d88030','wrap'); },
  civ_Insectoid_medieval(c,x,y){ DRAW.civ_insectoid_base(c,x,y,'#302808','#b89020','cloak'); },
  civ_Insectoid_industrial(c,x,y){ DRAW.civ_insectoid_base(c,x,y,'#282830','#8890a0','cap'); },
  civ_Insectoid_information(c,x,y){ DRAW.civ_insectoid_base(c,x,y,'#181828','#60d0ff','visor'); },

  // AQUATIC — cool blue/teal, fin-arms, bioluminescent dots
  civ_aquatic_base(c,x,y,body,accent,detail){
    // Shadow
    c.fillStyle='rgba(0,0,0,0.22)';
    c.beginPath(); c.ellipse(x+12,y+20,7,2.5,0,0,Math.PI*2); c.fill();
    // Body & head
    c.fillStyle=body;
    c.fillRect(x+9,y+8,6,10);
    c.fillRect(x+10,y+18,2,3); c.fillRect(x+13,y+18,2,3);
    c.beginPath(); c.arc(x+12,y+6,4,0,Math.PI*2); c.fill();
    // Fin arms — tapered triangles instead of rectangles
    c.beginPath(); c.moveTo(x+8,y+12); c.lineTo(x+4,y+15); c.lineTo(x+8,y+17); c.closePath(); c.fill();
    c.beginPath(); c.moveTo(x+16,y+12); c.lineTo(x+20,y+15); c.lineTo(x+16,y+17); c.closePath(); c.fill();
    // Accent band
    c.fillStyle=accent;
    c.fillRect(x+9,y+11,6,2);
    if(detail==='cap'){ c.fillRect(x+8,y+3,8,2); c.fillRect(x+10,y+1,4,2); }
    if(detail==='visor'){ c.fillRect(x+8,y+5,8,2); c.fillStyle='#d8f6ff'; c.fillRect(x+10,y+5,4,1); }
    // Bioluminescent dots — 4 scattered circles at pulsing opacity
    const phase = (Date.now()/900)%(Math.PI*2);
    const glow = 0.4 + 0.3*Math.sin(phase);
    c.fillStyle='rgba(128,232,255,'+glow.toFixed(2)+')';
    c.beginPath(); c.arc(x+10,y+9,1,0,Math.PI*2); c.fill();
    c.beginPath(); c.arc(x+14,y+12,1,0,Math.PI*2); c.fill();
    c.beginPath(); c.arc(x+11,y+16,1,0,Math.PI*2); c.fill();
    c.beginPath(); c.arc(x+13,y+7,1,0,Math.PI*2); c.fill();
    // Eyes
    c.fillStyle='#80e8ff';
    c.fillRect(x+10,y+6,1,1); c.fillRect(x+14,y+6,1,1);
  },
  civ_Aquatic_primitive(c,x,y){ DRAW.civ_aquatic_base(c,x,y,'#0a3a5a','#20a0d0','wrap'); },
  civ_Aquatic_tribal(c,x,y){ DRAW.civ_aquatic_base(c,x,y,'#0a4060','#28b0e0','wrap'); },
  civ_Aquatic_medieval(c,x,y){ DRAW.civ_aquatic_base(c,x,y,'#0a3850','#1890b8','cloak'); },
  civ_Aquatic_industrial(c,x,y){ DRAW.civ_aquatic_base(c,x,y,'#0a2840','#2080a8','cap'); },
  civ_Aquatic_information(c,x,y){ DRAW.civ_aquatic_base(c,x,y,'#081828','#50d8ff','visor'); },

  // CRYSTALLINE — hexagonal head, faceted torso, internal glow core, tier gem colour
  civ_crystalline_base(c,x,y,body,accent,glow,detail){
    c.fillStyle='rgba(0,0,0,0.22)';
    c.beginPath(); c.ellipse(x+12,y+20,7,2.5,0,0,Math.PI*2); c.fill();
    // Torso with diagonal corner cuts for facet look
    c.fillStyle=body;
    c.fillRect(x+9,y+8,6,10);
    c.fillRect(x+8,y+12,2,5); c.fillRect(x+15,y+12,2,5);
    c.fillRect(x+10,y+18,2,3); c.fillRect(x+13,y+18,2,3);
    // Facet cut corners on torso
    c.fillStyle='rgba(0,0,0,0.30)';
    c.fillRect(x+9,y+8,1,1); c.fillRect(x+14,y+8,1,1);
    c.fillRect(x+9,y+17,1,1); c.fillRect(x+14,y+17,1,1);
    // Hexagonal head (wide rect + angled extension)
    c.fillStyle=body;
    c.fillRect(x+9,y+2,6,8);
    c.fillRect(x+8,y+3,8,6);
    // Internal glow core
    c.fillStyle=glow;
    c.fillRect(x+11,y+10,2,4);
    // Accent facet stripe
    c.fillStyle=accent;
    c.fillRect(x+9,y+11,6,2);
    if(detail==='cloak'){ c.fillStyle=accent; c.fillRect(x+8,y+8,1,11); c.fillRect(x+16,y+8,1,11); }
    if(detail==='cap'){ c.fillStyle=accent; c.fillRect(x+8,y+1,8,2); }
    if(detail==='visor'){ c.fillStyle=accent; c.fillRect(x+8,y+4,8,2); c.fillStyle='rgba(200,240,255,0.7)'; c.fillRect(x+10,y+4,4,1); }
    // Crystal eyes
    c.fillStyle=glow;
    c.fillRect(x+10,y+5,1,1); c.fillRect(x+13,y+5,1,1);
  },
  civ_Crystalline_primitive(c,x,y){ DRAW.civ_crystalline_base(c,x,y,'#6a6858','#b0a880','rgba(255,240,180,0.7)','wrap'); },
  civ_Crystalline_tribal(c,x,y){ DRAW.civ_crystalline_base(c,x,y,'#7050a0','#c090e0','rgba(200,160,255,0.7)','wrap'); },
  civ_Crystalline_medieval(c,x,y){ DRAW.civ_crystalline_base(c,x,y,'#3050a0','#7090e0','rgba(160,200,255,0.7)','cloak'); },
  civ_Crystalline_industrial(c,x,y){ DRAW.civ_crystalline_base(c,x,y,'#205040','#60c0a0','rgba(140,255,220,0.7)','cap'); },
  civ_Crystalline_information(c,x,y){ DRAW.civ_crystalline_base(c,x,y,'#304858','#90d8f0','rgba(220,248,255,0.85)','visor'); },

  // FUNGOID — wide cap head, stipe body, spore dots, root tendrils
  civ_fungoid_base(c,x,y,body,cap,spore,detail){
    c.fillStyle='rgba(0,0,0,0.28)';
    c.beginPath(); c.ellipse(x+12,y+20,7,2.5,0,0,Math.PI*2); c.fill();
    // Root tendrils instead of feet
    c.fillStyle=body;
    c.fillRect(x+8,y+19,2,3); c.fillRect(x+11,y+20,2,4); c.fillRect(x+14,y+19,2,3);
    // Stipe body
    c.fillRect(x+10,y+8,4,11);
    // Arms — short and drooping
    c.fillRect(x+7,y+11,3,4); c.fillRect(x+14,y+11,3,4);
    // Accent gills
    c.fillStyle=spore;
    c.fillRect(x+10,y+12,4,1); c.fillRect(x+10,y+14,4,1);
    // Cap (wide silhouette)
    c.fillStyle=cap;
    c.fillRect(x+5,y+3,14,5);
    c.fillRect(x+7,y+1,10,3);
    c.fillRect(x+9,y+0,6,2);
    // Underside shadow
    c.fillStyle='rgba(0,0,0,0.18)';
    c.fillRect(x+5,y+7,14,1);
    if(detail==='cloak'){ c.fillStyle=body; c.fillRect(x+7,y+8,2,10); c.fillRect(x+15,y+8,2,10); }
    if(detail==='cap'){ c.fillStyle=spore; c.fillRect(x+5,y+3,14,1); }
    if(detail==='visor'){ c.fillStyle=spore; c.fillRect(x+9,y+4,6,2); }
    // Spore dots — slow drift via time
    const t = Date.now()/1200;
    c.fillStyle=spore;
    const sporedots = [[x+9,y-1],[x+13,y+0],[x+7,y+1],[x+15,y+2],[x+11,y-2]];
    sporedots.forEach(([sx,sy],i)=>{
      const dy = Math.sin(t+i*1.3)*1.5;
      c.globalAlpha=0.45+0.25*Math.sin(t*0.7+i);
      c.beginPath(); c.arc(sx, sy+dy, 0.8, 0, Math.PI*2); c.fill();
    });
    c.globalAlpha=1;
    // Eyes
    c.fillStyle='#c080a0';
    c.fillRect(x+10,y+5,1,1); c.fillRect(x+13,y+5,1,1);
  },
  civ_Fungoid_primitive(c,x,y){ DRAW.civ_fungoid_base(c,x,y,'#5a3040','#802860','#f0a0d0','wrap'); },
  civ_Fungoid_tribal(c,x,y){ DRAW.civ_fungoid_base(c,x,y,'#4a3850','#684878','#d090f0','wrap'); },
  civ_Fungoid_medieval(c,x,y){ DRAW.civ_fungoid_base(c,x,y,'#3a3050','#604070','#c0a0e0','cloak'); },
  civ_Fungoid_industrial(c,x,y){ DRAW.civ_fungoid_base(c,x,y,'#302838','#584868','#b090d0','cap'); },
  civ_Fungoid_information(c,x,y){ DRAW.civ_fungoid_base(c,x,y,'#201828','#503060','#e0b0ff','visor'); },
  walking_tree(c,x,y){
    // Ancient ambulatory tree — bipedal root-legs, thick trunk body, spreading canopy crown
    const v = (x*17+y*31) % 4;
    const barks  = ['#4a3520','#523c24','#432f1c','#4e3822'];
    const barkHi = ['#6a5030','#705538','#604826','#6c5234'];
    const crowns = ['#1a5c1a','#1e6820','#166018','#22701e'];
    const leafHi = ['#2a8830','#329436','#288832','#38a03a'];
    const bark = barks[v], bhi = barkHi[v], crown = crowns[v], leaf = leafHi[v];
    // Ground shadow
    c.fillStyle = 'rgba(0,0,0,0.30)';
    c.beginPath(); c.ellipse(x+12, y+22, 7, 2, 0, 0, Math.PI*2); c.fill();
    // Root-legs — two thick gnarled legs splayed slightly
    c.fillStyle = bark;
    c.fillRect(x+8,  y+16, 4, 7);   // left leg
    c.fillRect(x+13, y+16, 4, 7);   // right leg
    c.fillStyle = bhi;
    c.fillRect(x+9,  y+17, 2, 5);   // left highlight
    c.fillRect(x+14, y+17, 2, 5);   // right highlight
    // Root splays at the foot
    c.fillStyle = bark;
    c.fillRect(x+5,  y+21, 4, 2);   // left root splay left
    c.fillRect(x+9,  y+22, 3, 2);   // left root splay right
    c.fillRect(x+13, y+22, 3, 2);   // right root splay left
    c.fillRect(x+17, y+21, 4, 2);   // right root splay right
    // Trunk body
    c.fillStyle = bark;
    c.fillRect(x+7, y+7, 10, 10);
    c.fillStyle = bhi;
    c.fillRect(x+9, y+8, 3, 8);     // bark highlight strip
    // Bark texture lines
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.fillRect(x+7,  y+10, 10, 1);
    c.fillRect(x+7,  y+14, 10, 1);
    // Arm-branches — two short thick branches angled outward
    c.fillStyle = bark;
    c.fillRect(x+2,  y+9,  6, 3);   // left branch
    c.fillRect(x+16, y+9,  6, 3);   // right branch
    c.fillStyle = bhi;
    c.fillRect(x+3,  y+9,  3, 1);
    c.fillRect(x+17, y+9,  3, 1);
    // Twig fingers — left
    c.fillStyle = bark;
    c.fillRect(x+1,  y+7,  3, 2);
    c.fillRect(x+2,  y+11, 3, 2);
    c.fillRect(x+0,  y+9,  2, 2);
    // Twig fingers — right
    c.fillRect(x+20, y+7,  3, 2);
    c.fillRect(x+19, y+11, 3, 2);
    c.fillRect(x+22, y+9,  2, 2);
    // Canopy — layered overlapping ellipses for a full crown
    c.fillStyle = crown;
    c.beginPath(); c.ellipse(x+12, y+8,  9, 6, 0, 0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(x+7,  y+6,  6, 5, 0, 0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(x+17, y+5,  6, 5, 0, 0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(x+12, y+3,  5, 4, 0, 0, Math.PI*2); c.fill();
    // Leaf highlights — lighter top-centre
    c.fillStyle = leaf;
    c.beginPath(); c.ellipse(x+12, y+4,  4, 3, 0, 0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(x+8,  y+5,  3, 2, 0, 0, Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(x+16, y+4,  3, 2, 0, 0, Math.PI*2); c.fill();
    // Eyes — two pale amber glows peering from the shadow under the canopy
    c.fillStyle = 'rgba(0,0,0,0.45)';
    c.fillRect(x+8, y+8, 8, 4);     // eye-socket shadow
    c.fillStyle = '#ddbb44';
    c.fillRect(x+9,  y+9, 2, 2);    // left eye
    c.fillRect(x+13, y+9, 2, 2);    // right eye
    c.fillStyle = 'rgba(255,210,80,0.55)';
    c.beginPath(); c.arc(x+10, y+10, 1.5, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(x+14, y+10, 1.5, 0, Math.PI*2); c.fill();
  },
  planet_normal(c,x,y){
    c.fillStyle='#04040c'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#0e2a44'; c.beginPath(); c.arc(x+12,y+12,9,0,Math.PI*2); c.fill();
    c.fillStyle='#1a4a7a'; c.beginPath(); c.arc(x+12,y+12,8,0,Math.PI*2); c.fill();
    c.fillStyle='#2266aa'; c.fillRect(x+7,y+9,10,3);
    c.fillStyle='#3388cc'; c.fillRect(x+8,y+10,7,2);
    c.fillStyle='#44aa66'; c.fillRect(x+11,y+7,4,4);
    c.fillStyle='#55cc77'; c.fillRect(x+12,y+8,2,2);
    c.fillStyle='rgba(255,255,255,0.18)'; c.beginPath(); c.arc(x+9,y+8,3,0,Math.PI*2); c.fill();
  },
  planet_danger(c,x,y){
    c.fillStyle='#04040c'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#330606'; c.beginPath(); c.arc(x+12,y+12,9,0,Math.PI*2); c.fill();
    c.fillStyle='#661010'; c.beginPath(); c.arc(x+12,y+12,8,0,Math.PI*2); c.fill();
    c.fillStyle='#992222'; c.fillRect(x+7,y+9,10,3);
    c.fillStyle='#cc3333'; c.fillRect(x+8,y+10,7,2);
    c.fillStyle='#ff5555'; c.fillRect(x+10,y+7,3,2); c.fillRect(x+14,y+13,2,2);
    c.fillStyle='rgba(255,100,0,0.2)'; c.beginPath(); c.arc(x+9,y+8,3,0,Math.PI*2); c.fill();
  },
  planet_rich(c,x,y){
    c.fillStyle='#04040c'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#062208'; c.beginPath(); c.arc(x+12,y+12,9,0,Math.PI*2); c.fill();
    c.fillStyle='#0e4414'; c.beginPath(); c.arc(x+12,y+12,8,0,Math.PI*2); c.fill();
    c.fillStyle='#1a6622'; c.fillRect(x+7,y+9,10,3);
    c.fillStyle='#22882c'; c.fillRect(x+8,y+10,7,2);
    c.fillStyle='#ffe066'; c.fillRect(x+11,y+9,4,4);
    c.fillStyle='#ffcc22'; c.fillRect(x+12,y+10,2,2);
    c.fillStyle='rgba(255,240,100,0.15)'; c.beginPath(); c.arc(x+9,y+8,3,0,Math.PI*2); c.fill();
  },
  pirate_base(c,x,y){
    // Dark derelict station — rusted red core, jagged spikes, hazard feel
    c.fillStyle='#04040c'; c.fillRect(x,y,TS,TS);
    // Outer threat glow
    c.fillStyle='#330800'; c.beginPath(); c.arc(x+12,y+12,11,0,Math.PI*2); c.fill();
    // Main body — dark rust
    c.fillStyle='#551100'; c.beginPath(); c.arc(x+12,y+12,7,0,Math.PI*2); c.fill();
    c.fillStyle='#882200'; c.beginPath(); c.arc(x+12,y+12,5,0,Math.PI*2); c.fill();
    // Spike arms (4 directions)
    c.fillStyle='#661100';
    c.fillRect(x+2,  y+11, 8,  2);   // left
    c.fillRect(x+14, y+11, 8,  2);   // right
    c.fillRect(x+11, y+2,  2,  8);   // top
    c.fillRect(x+11, y+14, 2,  8);   // bottom
    // Spike tips — brighter
    c.fillStyle='#cc2200';
    c.fillRect(x+2,  y+11, 2, 2);
    c.fillRect(x+20, y+11, 2, 2);
    c.fillRect(x+11, y+2,  2, 2);
    c.fillRect(x+11, y+20, 2, 2);
    // Dark centre detail
    c.fillStyle='#1a0000'; c.beginPath(); c.arc(x+12,y+12,2,0,Math.PI*2); c.fill();
  },
  casino(c,x,y){
    // Neon-purple space station tile
    c.fillStyle='#04040c'; c.fillRect(x,y,TS,TS);
    // Outer glow
    c.fillStyle='#3a0066'; c.beginPath(); c.arc(x+12,y+12,10,0,Math.PI*2); c.fill();
    // Station body
    c.fillStyle='#6600cc'; c.beginPath(); c.arc(x+12,y+12,7,0,Math.PI*2); c.fill();
    c.fillStyle='#aa44ff'; c.beginPath(); c.arc(x+12,y+12,5,0,Math.PI*2); c.fill();
    // Neon cross arms
    c.fillStyle='#cc88ff'; c.fillRect(x+3,y+11,18,2); c.fillRect(x+11,y+3,2,18);
    // Bright centre dot
    c.fillStyle='#ffffff'; c.beginPath(); c.arc(x+12,y+12,2,0,Math.PI*2); c.fill();
    // Pixel sparkles
    c.fillStyle='#ff88ff'; c.fillRect(x+5,y+5,2,2); c.fillRect(x+17,y+17,2,2);
    c.fillStyle='#ffcc00'; c.fillRect(x+17,y+5,2,2); c.fillRect(x+5,y+17,2,2);
  },
  black_hole(c,x,y){
    // Gravitational singularity — deep void with accretion ring
    c.fillStyle='#000000'; c.fillRect(x,y,TS,TS);
    // Outer accretion disk glow
    c.fillStyle='rgba(255,140,0,0.18)'; c.beginPath(); c.arc(x+12,y+12,11,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(255,80,0,0.28)';  c.beginPath(); c.arc(x+12,y+12,9,0,Math.PI*2);  c.fill();
    // Accretion ring — bright orange-white band
    c.save();
    c.beginPath(); c.arc(x+12,y+12,8,0,Math.PI*2); c.clip();
    c.fillStyle='#ff8800'; c.fillRect(x,y+9,TS,5);
    c.fillStyle='#ffcc44'; c.fillRect(x,y+10,TS,3);
    c.restore();
    // Event horizon — absolute black core
    c.fillStyle='#000000'; c.beginPath(); c.arc(x+12,y+12,5,0,Math.PI*2); c.fill();
    // Lensing glint
    c.fillStyle='rgba(255,255,200,0.5)'; c.beginPath(); c.arc(x+9,y+9,1.5,0,Math.PI*2); c.fill();
  },
  pulsar(c,x,y){
    // Pulsar — rapidly rotating neutron star, twin radiation jets, eerie blue-white
    c.fillStyle='#000000'; c.fillRect(x,y,TS,TS);
    // Outer radiation halo — sickly blue-green
    c.fillStyle='rgba(0,180,120,0.12)'; c.beginPath(); c.arc(x+12,y+12,11,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(0,220,160,0.10)'; c.beginPath(); c.arc(x+12,y+12,9,0,Math.PI*2);  c.fill();
    // Jet beams — two narrow opposing lances (top-left / bottom-right)
    c.save();
    c.translate(x+12, y+12);
    c.rotate(Math.PI*0.18);
    // Main jet pair
    c.fillStyle='rgba(120,255,220,0.55)'; c.fillRect(-1,-11,2,9);
    c.fillStyle='rgba(120,255,220,0.55)'; c.fillRect(-1,2, 2,9);
    // Jet cores — brighter inner beam
    c.fillStyle='rgba(220,255,250,0.85)'; c.fillRect(-0.5,-11,1,7);
    c.fillStyle='rgba(220,255,250,0.85)'; c.fillRect(-0.5,4, 1,7);
    c.restore();
    // Neutron star body — tiny, dense, white-blue
    c.fillStyle='#0a1a22'; c.beginPath(); c.arc(x+12,y+12,5,0,Math.PI*2); c.fill();
    c.fillStyle='#1a4a5a'; c.beginPath(); c.arc(x+12,y+12,4,0,Math.PI*2); c.fill();
    c.fillStyle='#44ccdd'; c.beginPath(); c.arc(x+12,y+12,2.5,0,Math.PI*2); c.fill();
    // Hot core
    c.fillStyle='#aaeeff'; c.beginPath(); c.arc(x+12,y+12,1.2,0,Math.PI*2); c.fill();
    // Faint ring — magnetic equator
    c.strokeStyle='rgba(0,200,180,0.3)'; c.lineWidth=0.8;
    c.beginPath(); c.arc(x+12,y+12,7,0,Math.PI*2); c.stroke();
  },
  rogue_planet(c,x,y){
    // Rogue planet — sunless wanderer, no star, no light source. Cold, dark, alone.
    c.fillStyle='#000000'; c.fillRect(x,y,TS,TS);
    // Very faint deep-space blue ambient — not a glow, just barely visible
    c.fillStyle='rgba(20,25,45,0.6)'; c.beginPath(); c.arc(x+12,y+12,11,0,Math.PI*2); c.fill();
    // Planet body — near-black with a cold slate hue
    c.fillStyle='#0d0f14'; c.beginPath(); c.arc(x+12,y+12,9,0,Math.PI*2); c.fill();
    c.fillStyle='#12161e'; c.beginPath(); c.arc(x+12,y+12,8,0,Math.PI*2); c.fill();
    // Surface banding — faint cold grey-blue stripes (like frozen cloud bands, unlit)
    c.save();
    c.beginPath(); c.arc(x+12,y+12,8,0,Math.PI*2); c.clip();
    c.fillStyle='rgba(30,38,55,0.7)'; c.fillRect(x+4,y+8,16,3);
    c.fillStyle='rgba(22,28,42,0.5)'; c.fillRect(x+4,y+13,16,2);
    c.fillStyle='rgba(18,22,35,0.4)'; c.fillRect(x+4,y+6,16,2);
    c.restore();
    // Terminator line — the only "edge" visible is where faint starfield silhouettes it
    c.save();
    c.beginPath(); c.arc(x+12,y+12,8,0,Math.PI*2); c.clip();
    // Hard dark left hemisphere (facing away from everything)
    c.fillStyle='rgba(0,0,0,0.55)'; c.fillRect(x,y,12,TS);
    c.restore();
    // Ultra-faint crescent limb — caught by distant star-glow, barely perceptible
    c.strokeStyle='rgba(60,70,100,0.35)'; c.lineWidth=1;
    c.beginPath(); c.arc(x+12,y+12,8,Math.PI*0.55,Math.PI*1.45); c.stroke();
    // No beacon, no warmth. One dim pixel — a cosmic ray hit, nothing more.
    c.fillStyle='rgba(80,90,110,0.4)'; c.fillRect(x+15,y+7,1,1);
  },
  nest(c,x,y){
    // Earthy nest mound — concentric rings with a dark hollow centre
    c.fillStyle='#2a4a18'; c.beginPath(); c.arc(x+12,y+12,9,0,Math.PI*2); c.fill();
    c.fillStyle='#1a3010'; c.beginPath(); c.arc(x+12,y+12,6,0,Math.PI*2); c.fill();
    c.fillStyle='#0e1e08'; c.beginPath(); c.arc(x+12,y+12,3,0,Math.PI*2); c.fill();
    // Scattered twig marks
    c.fillStyle='#3a5a20';
    c.fillRect(x+4, y+11,4,2); c.fillRect(x+16,y+13,4,2);
    c.fillRect(x+11,y+4, 2,4); c.fillRect(x+13,y+17,2,4);
  },
  mineral_sample(c,x,y){ drawMineralSample(c,x,y); },
  volcanic_rock(c,x,y,cell){
    // Floor already drawn by caller.
    const gx = cell ? (cell._gx||0) : 0;
    const gy = cell ? (cell._gy||0) : 0;
    const mask = cell ? (cell.rockMask||0) : 0;
    const N=!!(mask&1), E=!!(mask&2), S=!!(mask&4), W=!!(mask&8);
    const h = (a,b,s) => { let v=(a*2749+b*1847+s*3571)&0xffff; v^=v>>7; v*=0xd5b3; return (v&0xffff)/65535; };

    const tipX  = 9  + Math.round(h(gx,gy,1)*5);
    const baseL = 2  + Math.round(h(gx,gy,2)*3);
    const baseR = 19 - Math.round(h(gx,gy,3)*3);
    const tipY  = 2  + Math.round(h(gx,gy,4)*4);
    const baseY = 19 + Math.round(h(gx,gy,5)*2);

    const warm  = Math.round(h(gx,gy,6)*8);
    const mkCol = (r,g,b) => `rgb(${Math.min(255,r+warm)},${Math.min(255,g+warm)},${Math.min(255,b+warm)})`;
    const C_DEEP   = mkCol(12,  8,  8);
    const C_DARK   = mkCol(28, 18, 16);
    const C_MID    = mkCol(46, 30, 26);
    const C_LIGHT  = mkCol(66, 44, 38);
    const C_BRIGHT = mkCol(88, 60, 50);

    // Spire bounds at a given row — shape never extends to tile border
    const spireBounds = (row) => {
      if(row < tipY || row > baseY) return null;
      const frac = (row-tipY)/Math.max(1,baseY-tipY);
      const hw = Math.round(frac*((baseR-baseL)/2));
      return [Math.max(0, tipX-hw), Math.min(23, tipX+hw)];
    };

    // ── Outline pass — suppress dark border on edges facing connected neighbours ──
    c.fillStyle = 'rgba(0,0,0,0.82)';
    for(let row = tipY-1; row <= baseY+1; row++){
      const cur  = row >= tipY && row <= baseY ? spireBounds(row) : null;
      const prev = (row-1) >= tipY && (row-1) <= baseY ? spireBounds(row-1) : null;
      const next = (row+1) >= tipY && (row+1) <= baseY ? spireBounds(row+1) : null;

      if(!cur){
        // Row outside shape — outline only if not suppressed by N/S connection
        if(row < tipY && N) continue;   // N connected: no outline above
        if(row > baseY && S) continue;  // S connected: no outline below
        const ref = prev || next;
        if(ref) for(let px2=ref[0]; px2<=ref[1]; px2++) c.fillRect(x+px2, y+row, 1, 1);
        continue;
      }
      const [lx,rx] = cur;
      // Left edge outline — skip if W connected
      if(!W && lx > 0) c.fillRect(x+lx-1, y+row, 1, 1);
      // Right edge outline — skip if E connected
      if(!E && rx < 23) c.fillRect(x+rx+1, y+row, 1, 1);
      // Shoulder outlines (where shape widens vs row above/below)
      if(!N && prev){
        for(let px2=lx; px2<=Math.min(prev[0]-1,rx); px2++) c.fillRect(x+px2, y+row, 1, 1);
        for(let px2=Math.max(prev[1]+1,lx); px2<=rx; px2++) c.fillRect(x+px2, y+row, 1, 1);
      }
    }

    // ── Rock body pass ────────────────────────────────────────────────────
    for(let row=tipY; row<=baseY; row++){
      const bounds = spireBounds(row);
      if(!bounds) continue;
      const [lx,rx] = bounds;
      const frac = Math.max(0,Math.min(1,(row-tipY)/Math.max(1,baseY-tipY)));
      const w = rx-lx;
      for(let px2=lx; px2<=rx; px2++){
        const pos = w>0 ? (px2-lx)/w : 0.5;
        let col;
        if(pos < 0.10)      col = C_BRIGHT;
        else if(pos < 0.25) col = C_LIGHT;
        else if(pos > 0.88) col = C_DEEP;
        else if(pos > 0.75) col = C_DARK;
        else                col = frac > 0.5 ? C_MID : C_DARK;
        c.fillStyle=col;
        c.fillRect(x+px2, y+row, 1, 1);
      }
    }

    // ── Lava cracks ───────────────────────────────────────────────────────
    const numCracks = 1 + Math.floor(h(gx,gy,7)*2.99);
    for(let ci=0; ci<numCracks; ci++){
      let cx3 = Math.round(tipX - 2 + h(gx,gy,8+ci*3)*8);
      const crackStartY = Math.round(tipY + (baseY-tipY)*0.25 + h(gx,gy,9+ci*3)*(baseY-tipY)*0.45);
      const crackLen    = 2 + Math.round(h(gx,gy,10+ci*3)*5);
      for(let cy3=crackStartY; cy3<crackStartY+crackLen && cy3<=baseY; cy3++){
        const frac2=(cy3-tipY)/Math.max(1,baseY-tipY);
        const hw2=Math.round(frac2*((baseR-baseL)/2));
        if(Math.abs(cx3-tipX)<=hw2){
          const bright = 190+Math.round(h(gx,gy,ci*7+cy3)*55);
          c.fillStyle=`rgb(${bright},${55+Math.round(h(gx,gy,ci+cy3)*30)},8)`;
          c.fillRect(x+cx3, y+cy3, 1, 1);
        }
        cx3 += Math.round(h(gx,gy,ci*11+cy3)*3)-1;
      }
    }

    // Ground shadow — only on free bottom edge
    if(!S){
      c.fillStyle='rgba(0,0,0,0.3)';
      c.fillRect(x+baseL+1, y+baseY+1, baseR-baseL-1, 1);
    }  },
  volcanic_rock2(c,x,y,cell){ DRAW.volcanic_rock(c,x,y,cell); },

  // ── Desert floor — barely visible dune ripples ───────────────────────
  desert_floor(c,x,y,cell){
    // Use screen pixel coords divided by tile size as position seed
    const sx = Math.round(x/24), sy = Math.round(y/24);
    const hh = (a,b,s) => { let v=(a*2749+b*1847+s*3571)&0xffff; v^=v>>7; v*=0xd5b3; return (v&0xffff)/65535; };
    const warm = Math.round(hh(sx,sy,1)*12)-6;
    const BR=185+warm, BG=128+warm, BB=50;
    c.fillStyle=`rgb(${BR},${BG},${BB})`; c.fillRect(x,y,24,24);
    const phase=hh(sx,sy,2)*Math.PI*2;
    const rippleShift=Math.round(hh(sx,sy,3)*4)-2;
    const numRipples=2+Math.round(hh(sx,sy,4));
    for(let ri=0;ri<numRipples;ri++){
      const centerY=Math.round(3+ri*(20/numRipples)+hh(sx,sy,5+ri)*3);
      const light=hh(sx,sy,7+ri)<0.5?10:-6;
      c.fillStyle=`rgba(${Math.min(255,BR+light)},${Math.min(255,BG+Math.round(light*0.7))},${BB},0.18)`;
      for(let py=centerY;py<=centerY+1;py++){
        for(let px2=0;px2<24;px2++){
          const wave=Math.sin(phase+(px2+rippleShift)*0.45)*1.5;
          if(Math.abs(py-centerY-wave)<0.9) c.fillRect(x+px2,y+py,1,1);
        }
      }
    }
  },

  // ── Toxic rock — jagged craggy shape with acid-green veins ───────────
  toxic_rock(c,x,y,cell){
    const gx = cell ? (cell._gx||0) : 0;
    const gy = cell ? (cell._gy||0) : 0;
    const mask = cell ? (cell.rockMask||0) : 0;
    const N=!!(mask&1), E=!!(mask&2), S=!!(mask&4), W=!!(mask&8);
    const h = (a,b,s) => { let v=(a*2749+b*1847+s*3571)&0xffff; v^=v>>7; v*=0xd5b3; return (v&0xffff)/65535; };

    // Toxic rock — dark olive/brown, jagged non-uniform width per row
    const mk = (r,g,b) => `rgb(${r},${g},${b})`;
    const C_DEEP  = mk(22, 35, 8);
    const C_DARK  = mk(38, 58, 14);
    const C_MID   = mk(55, 80, 20);
    const C_LIGHT = mk(72,105, 28);
    const C_ACID  = mk(95,190, 30);    // acid-green vein
    const C_ACID2 = mk(60,140, 18);    // dimmer vein

    const cx2   = 9  + Math.round(h(gx,gy,1)*5);
    const tipY  = 2  + Math.round(h(gx,gy,2)*4);
    const baseY = 18 + Math.round(h(gx,gy,3)*3);

    // Jagged bounds — width varies irregularly per row using hash
    const jaggedBounds = (row) => {
      if(row<tipY||row>baseY) return null;
      const frac=(row-tipY)/Math.max(1,baseY-tipY);
      // Base taper like spire
      const baseHW = Math.round(3 + frac*8);
      // Add jagged noise per row — makes silhouette craggy
      const jag = Math.round(h(gx,gy,10+row)*4)-2;
      const jag2 = Math.round(h(gx,gy,20+row)*3)-1;
      const lx = W ? 0  : Math.max(0, cx2-(baseHW+jag));
      const rx = E ? 23 : Math.min(23, cx2+(baseHW+jag2));
      return [lx,rx];
    };

    // Outline — suppress on connected edges
    c.fillStyle='rgba(0,0,0,0.80)';
    for(let row=tipY-1; row<=baseY+1; row++){
      const cur  = row>=tipY&&row<=baseY ? jaggedBounds(row) : null;
      const prev = (row-1)>=tipY&&(row-1)<=baseY ? jaggedBounds(row-1) : null;
      if(!cur){
        if(row<tipY&&N) continue;
        if(row>baseY&&S) continue;
        const ref=prev;
        if(ref) for(let px2=ref[0];px2<=ref[1];px2++) c.fillRect(x+px2,y+row,1,1);
        continue;
      }
      const [lx,rx]=cur;
      if(!W&&lx>0) c.fillRect(x+lx-1,y+row,1,1);
      if(!E&&rx<23) c.fillRect(x+rx+1,y+row,1,1);
      if(!N&&prev){
        for(let px2=lx;px2<=Math.min(prev[0]-1,rx);px2++) c.fillRect(x+px2,y+row,1,1);
        for(let px2=Math.max(prev[1]+1,lx);px2<=rx;px2++) c.fillRect(x+px2,y+row,1,1);
      }
    }

    // Body
    for(let row=(N?0:tipY); row<=(S?23:baseY); row++){
      const bounds=jaggedBounds(Math.max(tipY,Math.min(baseY,row)));
      if(!bounds) continue;
      const [lx,rx]=bounds;
      const frac=(row-tipY)/Math.max(1,baseY-tipY);
      const w=rx-lx;
      for(let px2=lx;px2<=rx;px2++){
        const pos=w>0?(px2-lx)/w:0.5;
        let col;
        if(pos<0.12)       col=C_LIGHT;
        else if(pos>0.85)  col=C_DEEP;
        else if(pos>0.72)  col=C_DARK;
        else               col=frac>0.5?C_MID:C_DARK;
        c.fillStyle=col; c.fillRect(x+px2,y+row,1,1);
      }
    }

    // Acid-green veins — 1-2 wandering lines
    const numVeins = 1 + Math.floor(h(gx,gy,7)*1.99);
    for(let vi=0; vi<numVeins; vi++){
      let vx = Math.round(cx2-2+h(gx,gy,8+vi*3)*6);
      const vStartY = Math.round(tipY+(baseY-tipY)*0.2+h(gx,gy,9+vi*3)*(baseY-tipY)*0.5);
      const vLen = 3+Math.round(h(gx,gy,10+vi*3)*6);
      for(let vy=vStartY; vy<vStartY+vLen&&vy<=baseY; vy++){
        const b=jaggedBounds(vy);
        if(b&&vx>=b[0]&&vx<=b[1]){
          c.fillStyle=vi===0?C_ACID:C_ACID2;
          c.fillRect(x+vx,y+vy,1,1);
        }
        vx+=Math.round(h(gx,gy,vi*7+vy)*3)-1;
      }
    }

    if(!S){
      c.fillStyle='rgba(0,0,0,0.25)';
      const bb=jaggedBounds(baseY);
      if(bb) c.fillRect(x+bb[0]+1,y+baseY+1,bb[1]-bb[0]-1,1);
    }
  },
  toxic_rock2(c,x,y,cell){ DRAW.toxic_rock(c,x,y,cell); },
  planet_special(c,x,y){
    c.fillStyle='#04040c'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#160830'; c.beginPath(); c.arc(x+12,y+12,9,0,Math.PI*2); c.fill();
    c.fillStyle='#2e1060'; c.beginPath(); c.arc(x+12,y+12,8,0,Math.PI*2); c.fill();
    c.fillStyle='#5522aa'; c.fillRect(x+7,y+9,10,3);
    c.fillStyle='#7733cc'; c.fillRect(x+8,y+10,7,2);
    c.fillStyle='#e090ff'; c.fillRect(x+11,y+8,4,4); c.fillRect(x+6,y+14,3,3); c.fillRect(x+15,y+6,3,3);
    c.fillStyle='rgba(200,100,255,0.2)'; c.beginPath(); c.arc(x+9,y+8,3,0,Math.PI*2); c.fill();
  },

  // -- Derelict station tiles --------------------------------------
  station_floor(c,x,y){
    // Dark metal plating — slight grid texture from seeded variation
    c.fillStyle='#080d12'; c.fillRect(x,y,TS,TS);
    const h = ((x/TS*3 + y/TS*7) % 4)|0;
    c.fillStyle = h===0 ? '#0d1520' : '#090e18';
    c.fillRect(x+1,y+1,TS-2,TS-2);
    // Faint panel lines
    c.fillStyle='#0a1218';
    c.fillRect(x,y+11,TS,1);
    c.fillRect(x+11,y,1,TS);
    // Occasional worn highlight
    if(((x/TS + y/TS*3)|0) % 5 === 0){
      c.fillStyle='#131e2a'; c.fillRect(x+2,y+2,6,2);
    }
  },
  station_wall(c,x,y){
    // Reinforced bulkhead — thick plating with rivets
    c.fillStyle='#050a0e'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#0e1e2c'; c.fillRect(x+1,y+1,TS-2,TS-2);
    // Horizontal reinforcement bands
    c.fillStyle='#162535'; c.fillRect(x+1,y+4,TS-2,3);
    c.fillStyle='#162535'; c.fillRect(x+1,y+16,TS-2,3);
    c.fillStyle='#1e3040'; c.fillRect(x+1,y+5,TS-2,1);
    c.fillStyle='#1e3040'; c.fillRect(x+1,y+17,TS-2,1);
    // Rivet dots at corners
    c.fillStyle='#2a4455';
    c.fillRect(x+2,y+2,2,2); c.fillRect(x+TS-4,y+2,2,2);
    c.fillRect(x+2,y+TS-4,2,2); c.fillRect(x+TS-4,y+TS-4,2,2);
    // Centre structural detail
    c.fillStyle='#0c1820'; c.fillRect(x+8,y+8,8,8);
    c.fillStyle='#1a2e40'; c.fillRect(x+9,y+9,6,6);
  },
  station_door(c,x,y){
    // Sliding blast door — two panels with a lit seam
    c.fillStyle='#080e14'; c.fillRect(x,y,TS,TS);
    // Left panel
    c.fillStyle='#102030'; c.fillRect(x+1,y+2,9,TS-4);
    c.fillStyle='#1a3040'; c.fillRect(x+2,y+3,7,TS-6);
    c.fillStyle='#0e1a28'; c.fillRect(x+3,y+8,3,8);
    // Right panel
    c.fillStyle='#102030'; c.fillRect(x+TS-10,y+2,9,TS-4);
    c.fillStyle='#1a3040'; c.fillRect(x+TS-9,y+3,7,TS-6);
    c.fillStyle='#0e1a28'; c.fillRect(x+TS-6,y+8,3,8);
    // Centre seam — glowing cyan
    c.fillStyle='#001822'; c.fillRect(x+10,y+1,4,TS-2);
    c.fillStyle='#004455'; c.fillRect(x+11,y+2,2,TS-4);
    c.fillStyle='rgba(0,180,200,0.35)'; c.fillRect(x+11,y+2,2,TS-4);
    // Panel indicator lights
    c.fillStyle='#00aacc'; c.fillRect(x+4,y+5,2,2);
    c.fillStyle='#00aacc'; c.fillRect(x+TS-6,y+5,2,2);
  },
  station_console(c,x,y){
    // Wall-mounted terminal — screen glow, buttons
    c.fillStyle='#060c12'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#0d1e2c'; c.fillRect(x+2,y+2,TS-4,TS-4);
    // Screen
    c.fillStyle='#001830'; c.fillRect(x+3,y+3,TS-6,12);
    c.fillStyle='rgba(0,100,180,0.5)'; c.fillRect(x+3,y+3,TS-6,12);
    // Screen scan lines
    c.fillStyle='rgba(0,150,220,0.25)';
    for(let row=0;row<4;row++) c.fillRect(x+4,y+4+row*3,TS-8,1);
    // Data text flicker pixels
    c.fillStyle='#44aadd';
    c.fillRect(x+4,y+5,4,1); c.fillRect(x+10,y+5,3,1); c.fillRect(x+15,y+5,2,1);
    c.fillRect(x+4,y+8,6,1); c.fillRect(x+12,y+8,4,1);
    // Button row
    c.fillStyle='#0a2030'; c.fillRect(x+3,y+17,TS-6,5);
    const btnCols = ['#226688','#448800','#882200','#446600'];
    for(let b=0;b<4;b++){
      c.fillStyle=btnCols[b]; c.fillRect(x+4+b*5,y+18,3,3);
    }
    // Bottom edge
    c.fillStyle='#1a3048'; c.fillRect(x+2,y+TS-4,TS-4,2);
  },
  station_locker(c,x,y){
    // Metal storage locker — door with handle and seam
    c.fillStyle='#060c12'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#0e1e2c'; c.fillRect(x+2,y+1,TS-4,TS-2);
    // Door panel
    c.fillStyle='#122030'; c.fillRect(x+3,y+2,TS-6,TS-4);
    // Vertical seam
    c.fillStyle='#060e18'; c.fillRect(x+TS/2-1,y+2,2,TS-4);
    // Handle
    c.fillStyle='#2a4a66'; c.fillRect(x+9,y+(TS/2)-2,6,4);
    c.fillStyle='#3a6080'; c.fillRect(x+10,y+(TS/2)-1,4,2);
    // Vent slots at top
    c.fillStyle='#0a1820';
    for(let v=0;v<3;v++) c.fillRect(x+5+v*5,y+4,3,2);
    // Corner bolts
    c.fillStyle='#1e3a50';
    c.fillRect(x+3,y+3,2,2); c.fillRect(x+TS-5,y+3,2,2);
    c.fillRect(x+3,y+TS-5,2,2); c.fillRect(x+TS-5,y+TS-5,2,2);
  },
  station_corpse(c,x,y){
    // Slumped remains — floor with dark silhouette
    c.fillStyle='#080d12'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#090e18'; c.fillRect(x+1,y+1,TS-2,TS-2);
    // Body shape — diagonal slump
    c.fillStyle='#3a2010';
    c.fillRect(x+4,y+6,6,4);   // torso
    c.fillRect(x+3,y+4,4,4);   // head
    c.fillRect(x+8,y+10,8,3);  // legs
    c.fillRect(x+2,y+8,4,2);   // arm
    // Dried stain
    c.fillStyle='rgba(80,20,10,0.55)'; c.beginPath(); c.arc(x+6,y+9,4,0,Math.PI*2); c.fill();
    // Visor glint (space suit)
    c.fillStyle='#1a1a2a'; c.fillRect(x+4,y+4,3,2);
    c.fillStyle='rgba(60,80,100,0.4)'; c.fillRect(x+4,y+4,3,1);
  },
  station_crack(c,x,y){
    // Damaged floor — hairline cracks, buckled plating
    c.fillStyle='#080d12'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#090e18'; c.fillRect(x+1,y+1,TS-2,TS-2);
    // Main crack — jagged diagonal
    c.fillStyle='#040608';
    c.fillRect(x+4,y+3,1,3); c.fillRect(x+5,y+6,2,2); c.fillRect(x+6,y+8,1,3);
    c.fillRect(x+7,y+11,2,2); c.fillRect(x+8,y+13,1,4); c.fillRect(x+9,y+17,2,2);
    // Secondary hairline
    c.fillStyle='#050709';
    c.fillRect(x+12,y+5,1,5); c.fillRect(x+13,y+10,1,4); c.fillRect(x+12,y+14,2,3);
    // Buckled edge highlight
    c.fillStyle='#131e2a'; c.fillRect(x+4,y+4,2,1); c.fillRect(x+8,y+14,2,1);
  },

  // -- Ancient sentinel orb (robotic guardian) ---------------------
  ancient_sentinel_orb(c,x,y){
    const cx=x+TS/2, cy=y+TS/2, r=6;
    const t=Date.now()/900;
    // Outer energy ring — pulsing teal
    const pulse=0.5+0.5*Math.sin(t*2.1);
    c.save();
    c.strokeStyle=`rgba(0,220,200,${0.25+pulse*0.35})`;
    c.lineWidth=2;
    c.beginPath(); c.arc(cx,cy,r+3,0,Math.PI*2); c.stroke();
    // Core body — dark metallic sphere
    const grad=c.createRadialGradient(cx-2,cy-2,1,cx,cy,r);
    grad.addColorStop(0,'#4a5a6a');
    grad.addColorStop(0.5,'#1a2a3a');
    grad.addColorStop(1,'#0a0e14');
    c.fillStyle=grad; c.beginPath(); c.arc(cx,cy,r,0,Math.PI*2); c.fill();
    // Teal eye/lens
    c.fillStyle=`rgba(0,${180+Math.round(pulse*75)},${160+Math.round(pulse*60)},0.95)`;
    c.beginPath(); c.arc(cx,cy,3,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(200,255,255,0.7)'; c.beginPath(); c.arc(cx-1,cy-1,1,0,Math.PI*2); c.fill();
    // Rotating scan line
    const angle=t*1.8;
    c.strokeStyle=`rgba(0,220,200,${0.4+pulse*0.3})`;
    c.lineWidth=1;
    c.beginPath();
    c.moveTo(cx,cy);
    c.lineTo(cx+Math.cos(angle)*(r+1), cy+Math.sin(angle)*(r+1));
    c.stroke();
    c.restore();
  },

  // -- Ancient station tiles ---------------------------------------
  ancient_st_floor(c,x,y){
    // Worn amber-gold plate — alien manufacture
    c.fillStyle='#0e0a02'; c.fillRect(x,y,TS,TS);
    const v = ((x/TS*5 + y/TS*11)|0) % 3;
    c.fillStyle = v===0 ? '#130e03' : v===1 ? '#110c02' : '#150f04';
    c.fillRect(x+1,y+1,TS-2,TS-2);
    // Grid seams — ancient tiling pattern
    c.fillStyle='#0a0702'; c.fillRect(x,y+11,TS,1); c.fillRect(x+11,y,1,TS);
    // Faint luminescence in the grout
    c.fillStyle='rgba(80,60,10,0.18)'; c.fillRect(x+1,y+11,TS-2,1); c.fillRect(x+11,y+1,1,TS-2);
    // Wear marks
    if(((x/TS*3+y/TS)|0)%7===0){
      c.fillStyle='rgba(100,80,20,0.12)'; c.beginPath(); c.arc(x+8,y+8,4,0,Math.PI*2); c.fill();
    }
  },
  ancient_st_edge(c,x,y){
    // Structural beam — glowing edge conduit
    c.fillStyle='#100c02'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#1a1204'; c.fillRect(x+2,y+1,TS-4,TS-2);
    // Central conduit channel
    c.fillStyle='#0e0a02'; c.fillRect(x+9,y+1,6,TS-2);
    c.fillStyle='rgba(120,90,15,0.4)'; c.fillRect(x+10,y+2,4,TS-4);
    c.fillStyle='rgba(180,140,30,0.25)'; c.fillRect(x+11,y+3,2,TS-6);
    // Energy nodes at intervals
    c.fillStyle='rgba(200,160,40,0.5)';
    c.fillRect(x+10,y+4,4,2); c.fillRect(x+10,y+10,4,2); c.fillRect(x+10,y+16,4,2);
  },
  ancient_st_corner(c,x,y){
    // Junction cross — two conduits meeting, node at centre
    c.fillStyle='#100c02'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#1a1204'; c.fillRect(x+1,y+1,TS-2,TS-2);
    // Horizontal beam
    c.fillStyle='#0e0a02'; c.fillRect(x+1,y+9,TS-2,6);
    c.fillStyle='rgba(120,90,15,0.4)'; c.fillRect(x+2,y+10,TS-4,4);
    c.fillStyle='rgba(180,140,30,0.25)'; c.fillRect(x+3,y+11,TS-6,2);
    // Vertical beam
    c.fillStyle='#0e0a02'; c.fillRect(x+9,y+1,6,TS-2);
    c.fillStyle='rgba(120,90,15,0.4)'; c.fillRect(x+10,y+2,4,TS-4);
    c.fillStyle='rgba(180,140,30,0.25)'; c.fillRect(x+11,y+3,2,TS-6);
    // Centre node — brightest point
    c.fillStyle='#3a2a04'; c.beginPath(); c.arc(x+12,y+12,5,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(200,160,40,0.6)'; c.beginPath(); c.arc(x+12,y+12,3,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(240,200,80,0.4)'; c.beginPath(); c.arc(x+12,y+12,1.5,0,Math.PI*2); c.fill();
  },
  ancient_st_node(c,x,y){
    // Power node — pulsing diamond on amber floor
    c.fillStyle='#0e0a02'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#130e03'; c.fillRect(x+1,y+1,TS-2,TS-2);
    // Floor seams
    c.fillStyle='#0a0702'; c.fillRect(x,y+11,TS,1); c.fillRect(x+11,y,1,TS);
    // Outer ring
    c.fillStyle='#2a1e04'; c.beginPath(); c.arc(x+12,y+12,8,0,Math.PI*2); c.fill();
    // Diamond body
    c.fillStyle='#4a3408';
    c.beginPath(); c.moveTo(x+12,y+4); c.lineTo(x+20,y+12); c.lineTo(x+12,y+20); c.lineTo(x+4,y+12); c.closePath(); c.fill();
    c.fillStyle='rgba(180,140,30,0.55)';
    c.beginPath(); c.moveTo(x+12,y+6); c.lineTo(x+18,y+12); c.lineTo(x+12,y+18); c.lineTo(x+6,y+12); c.closePath(); c.fill();
    c.fillStyle='rgba(240,200,80,0.4)';
    c.beginPath(); c.moveTo(x+12,y+9); c.lineTo(x+15,y+12); c.lineTo(x+12,y+15); c.lineTo(x+9,y+12); c.closePath(); c.fill();
    // Bright centre
    c.fillStyle='rgba(255,230,120,0.7)'; c.beginPath(); c.arc(x+12,y+12,2,0,Math.PI*2); c.fill();
  },
  ancient_st_fuel(c,x,y){
    // Fuel cell — teal glowing canister on amber floor
    c.fillStyle='#0e0a02'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#130e03'; c.fillRect(x+1,y+1,TS-2,TS-2);
    c.fillStyle='#0a0702'; c.fillRect(x,y+11,TS,1); c.fillRect(x+11,y,1,TS);
    // Canister body
    c.fillStyle='#0d2820'; c.fillRect(x+6,y+4,12,16);
    c.fillStyle='#0a2018'; c.fillRect(x+7,y+5,10,14);
    // Teal glow fill
    c.fillStyle='rgba(20,160,120,0.5)'; c.fillRect(x+7,y+5,10,14);
    c.fillStyle='rgba(40,220,170,0.3)'; c.fillRect(x+8,y+6,8,12);
    // Cap top/bottom
    c.fillStyle='#1a4a38'; c.fillRect(x+5,y+3,14,3); c.fillRect(x+5,y+18,14,3);
    c.fillStyle='#226650'; c.fillRect(x+6,y+4,12,1); c.fillRect(x+6,y+19,12,1);
    // Connector nub
    c.fillStyle='#2a6654'; c.fillRect(x+10,y+1,4,3);
    // Glow halo
    c.fillStyle='rgba(0,200,160,0.15)'; c.beginPath(); c.arc(x+12,y+12,9,0,Math.PI*2); c.fill();
  },
  ancient_st_trap(c,x,y){
    // Energy trap — visible crackling node, hazard diamond markings
    c.fillStyle='#0e0a02'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#130e03'; c.fillRect(x+1,y+1,TS-2,TS-2);
    c.fillStyle='#0a0702'; c.fillRect(x,y+11,TS,1); c.fillRect(x+11,y,1,TS);
    // Hazard border
    c.fillStyle='#2a1e00'; c.fillRect(x+1,y+1,TS-2,2); c.fillRect(x+1,y+TS-3,TS-2,2);
    c.fillStyle='#cc8800'; c.fillRect(x+1,y+1,2,2); c.fillRect(x+TS-3,y+1,2,2);
    c.fillStyle='#cc8800'; c.fillRect(x+1,y+TS-3,2,2); c.fillRect(x+TS-3,y+TS-3,2,2);
    // Central energy burst
    c.fillStyle='rgba(180,120,0,0.5)'; c.beginPath(); c.arc(x+12,y+12,7,0,Math.PI*2); c.fill();
    // Lightning arms
    c.fillStyle='rgba(240,180,0,0.7)';
    c.fillRect(x+11,y+5,2,14); c.fillRect(x+5,y+11,14,2);
    c.fillRect(x+7,y+7,2,2); c.fillRect(x+15,y+7,2,2);
    c.fillRect(x+7,y+15,2,2); c.fillRect(x+15,y+15,2,2);
    c.fillStyle='rgba(255,220,80,0.8)'; c.beginPath(); c.arc(x+12,y+12,2.5,0,Math.PI*2); c.fill();
  },
  ancient_st_glow(c,x,y){
    // Alien light source — soft teal radiance, crystalline emitter
    c.fillStyle='#0a0e06'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#0d1208'; c.fillRect(x+1,y+1,TS-2,TS-2);
    // Glow aura
    c.fillStyle='rgba(30,180,140,0.2)'; c.beginPath(); c.arc(x+12,y+12,10,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(40,220,170,0.25)'; c.beginPath(); c.arc(x+12,y+12,6,0,Math.PI*2); c.fill();
    // Crystal emitter — hexagonal facets
    c.fillStyle='#0a3028';
    c.fillRect(x+8,y+6,8,12); c.fillRect(x+6,y+8,12,8);
    c.fillStyle='rgba(20,160,120,0.6)';
    c.fillRect(x+9,y+7,6,10); c.fillRect(x+7,y+9,10,6);
    c.fillStyle='rgba(80,240,200,0.5)';
    c.fillRect(x+10,y+8,4,8); c.fillRect(x+8,y+10,8,4);
    c.fillStyle='rgba(160,255,230,0.6)'; c.beginPath(); c.arc(x+12,y+12,2,0,Math.PI*2); c.fill();
  },

  // -- Ancient ruin surface tiles -----------------------------------
  // ── Ancient ruined building remnants — 3 variants seeded by position ──
  ancient_ruin_a(c,x,y){
    // Variant A: collapsed L-corner — partial footprint, earth ground around it
    drawSprite('earth_floor', x, y, '#0a1a08');
    // Structure sits in top-left quadrant with 4px margin on outer edges
    const m=4; // margin from tile edge
    // North wall stub (horizontal) — leaves 4px top margin
    c.fillStyle='#1e2c3e'; c.fillRect(x+m,y+m,TS-m-4,4);
    // West wall stub (vertical) — leaves 4px left margin
    c.fillStyle='#1a2838'; c.fillRect(x+m,y+m,4,TS-m-5);
    // Wall top highlight
    c.fillStyle='rgba(60,90,120,0.22)';
    c.fillRect(x+m,y+m,TS-m-4,1); c.fillRect(x+m,y+m,1,TS-m-5);
    // Mortar lines
    c.fillStyle='#080c16';
    c.fillRect(x+m,y+m+8,4,1); c.fillRect(x+m+8,y+m,1,4);
    // Crumbled east end of north wall
    c.fillStyle='#141e2c'; c.fillRect(x+TS-8,y+m,3,3);
    c.fillStyle='#101828'; c.fillRect(x+TS-7,y+m+3,2,2);
    // Interior rubble — scattered small blocks
    c.fillStyle='#162030'; c.fillRect(x+m+6,y+m+6,4,3);
    c.fillStyle='#121c2a'; c.fillRect(x+m+9,y+m+9,3,3);
    c.fillStyle='#182232'; c.fillRect(x+m+4,y+m+12,5,3);
    // Moss on rubble
    c.fillStyle='rgba(35,70,22,0.28)';
    c.fillRect(x+m+4,y+m+14,4,1); c.fillRect(x+m,y+m+16,2,2);
  },
  ancient_ruin_b(c,x,y){
    // Variant B: wall stub — narrow upright, earth ground around it
    drawSprite('earth_floor2', x, y, '#0a1a08');
    // Wall stub occupies centre strip, 5px margin each side, 4px top/bottom
    const wx=x+5, wy=y+4, ww=TS-10, wh=TS-10;
    c.fillStyle='#1e2e44'; c.fillRect(wx,wy,ww,wh);
    c.fillStyle='#1a2840'; c.fillRect(wx+1,wy+1,ww-2,wh-2);
    // Jagged broken top
    c.fillStyle='#0a1008';
    c.fillRect(wx,wy,2,3); c.fillRect(wx+ww-2,wy,2,4); c.fillRect(wx+ww/2|0,wy,2,2);
    // Block courses
    c.fillStyle='#0e1a28';
    c.fillRect(wx,wy+5,ww,1); c.fillRect(wx,wy+10,ww,1);
    // Wall top highlight
    c.fillStyle='rgba(60,90,120,0.20)'; c.fillRect(wx,wy,ww,1);
    // Fallen stones — close to wall base, well inside tile
    c.fillStyle='#14202e'; c.fillRect(x+2,y+TS-7,4,3);
    c.fillStyle='#121e2c'; c.fillRect(x+3,y+TS-5,3,2);
    c.fillStyle='#162230'; c.fillRect(x+TS-6,y+TS-7,4,3);
    c.fillStyle='#101c2a'; c.fillRect(x+TS-5,y+TS-5,3,2);
    // Moss
    c.fillStyle='rgba(30,65,18,0.32)';
    c.fillRect(x+2,y+TS-5,3,1); c.fillRect(x+TS-5,y+TS-5,3,1);
  },
  ancient_ruin_c(c,x,y){
    // Variant C: archway remnant — two pillars + fallen keystone, earth ground around it
    drawSprite('earth_floor', x, y, '#0a1a08');
    const m=4;
    // Left pillar — 4px from left edge, 4px from top/bottom
    c.fillStyle='#1e2e48'; c.fillRect(x+m,y+m,5,TS-m*2);
    // Right pillar — 4px from right edge
    c.fillStyle='#1e2e48'; c.fillRect(x+TS-m-5,y+m,5,TS-m*2);
    // Block courses on pillars
    c.fillStyle='#0e1a2e';
    c.fillRect(x+m,y+m+5,5,1); c.fillRect(x+m,y+m+10,5,1);
    c.fillRect(x+TS-m-5,y+m+5,5,1); c.fillRect(x+TS-m-5,y+m+10,5,1);
    // Pillar top highlights
    c.fillStyle='rgba(60,90,120,0.20)';
    c.fillRect(x+m,y+m,5,1); c.fillRect(x+TS-m-5,y+m,5,1);
    // Fallen keystone — horizontal slab across the gap, upper third
    c.fillStyle='#1c2a42'; c.fillRect(x+m+5,y+m+1,TS-m*2-10,4);
    c.fillStyle='#18263e'; c.fillRect(x+m+6,y+m+4,TS-m*2-12,2);
    // Rubble below — tight cluster, well inside tile
    c.fillStyle='#14202e'; c.fillRect(x+m+3,y+m+10,TS-m*2-6,3);
    c.fillStyle='#121e2c'; c.fillRect(x+m+5,y+m+13,TS-m*2-10,3);
    // Alien glyph on left pillar
    c.fillStyle='rgba(30,80,140,0.22)';
    c.fillRect(x+m+1,y+m+7,3,1); c.fillRect(x+m+2,y+m+6,1,3);
    // Moss at pillar bases
    c.fillStyle='rgba(28,60,16,0.28)';
    c.fillRect(x+m,y+TS-m-3,5,2); c.fillRect(x+TS-m-5,y+TS-m-3,5,2);
  },

  ancient_ruin(c,x,y){
    const v = ((x/TS*13+y/TS*7)|0)%3;
    if(v===0) DRAW.ancient_ruin_a(c,x,y);
    else if(v===1) DRAW.ancient_ruin_b(c,x,y);
    else DRAW.ancient_ruin_c(c,x,y);
  },

  ancient_road(c,x,y){
    // Neighbour-aware ruined road — cracked, overgrown, partially reclaimed
    const tx=(x/TS)|0, ty=(y/TS)|0;
    const grid=G.planets?.[G.curPlanet]?.grid;
    const isRoad=(_x,_y)=>{ const t=grid?.[_y]?.[_x]?.type; return t==='ANCIENT_ROAD'||t==='ANCIENT_WALL'; };
    const nN=isRoad(tx,ty-1), nS=isRoad(tx,ty+1), nE=isRoad(tx+1,ty), nW=isRoad(tx-1,ty);
    const horiz=nE||nW, vert=nN||nS;

    // Stable per-tile pseudo-random — cheap LCG seeded by position
    const seed=(tx*2971+ty*1234+tx*ty*7)&0xffff;
    const rh=(s)=>((seed^(s*6271))&0xff)/255; // 0..1 deterministic per tile+slot

    const roadSurf=rh(0)<0.5?'#1c2a36':'#182432';
    const kerbCol ='#1e2c3c';

    // ── Kerb helper (same as before) ────────────────────────────
    const kerb=(dir)=>{
      c.fillStyle=kerbCol;
      if(dir==='N'){ c.fillRect(x,y,TS,5);
        c.fillStyle='rgba(60,90,120,0.22)'; c.fillRect(x,y,TS,1);
        c.fillStyle='rgba(0,0,0,0.30)';     c.fillRect(x,y+4,TS,1); }
      else if(dir==='S'){ c.fillRect(x,y+TS-5,TS,5);
        c.fillStyle='rgba(60,90,120,0.22)'; c.fillRect(x,y+TS-5,TS,1);
        c.fillStyle='rgba(0,0,0,0.30)';     c.fillRect(x,y+TS-1,TS,1); }
      else if(dir==='W'){ c.fillRect(x,y,5,TS);
        c.fillStyle='rgba(60,90,120,0.22)'; c.fillRect(x,y,1,TS);
        c.fillStyle='rgba(0,0,0,0.30)';     c.fillRect(x+4,y,1,TS); }
      else if(dir==='E'){ c.fillRect(x+TS-5,y,5,TS);
        c.fillStyle='rgba(60,90,120,0.22)'; c.fillRect(x+TS-5,y,1,TS);
        c.fillStyle='rgba(0,0,0,0.30)';     c.fillRect(x+TS-1,y,1,TS); }
    };

    // ── Base fill ───────────────────────────────────────────────
    c.fillStyle='#10181e'; c.fillRect(x,y,TS,TS);

    // ── Road surface + kerbs by orientation ────────────────────
    if(horiz && !vert){
      c.fillStyle=roadSurf; c.fillRect(x,y+5,TS,TS-10);
      kerb('N'); kerb('S');
    } else if(vert && !horiz){
      c.fillStyle=roadSurf; c.fillRect(x+5,y,TS-10,TS);
      kerb('W'); kerb('E');
    } else {
      c.fillStyle=roadSurf; c.fillRect(x,y,TS,TS);
      if(!nN) kerb('N'); if(!nS) kerb('S');
      if(!nW) kerb('W'); if(!nE) kerb('E');
    }

    // ══ RUIN LAYER — drawn on top of the surface ═══════════════

    // ── 1. Longitudinal crack along travel axis ─────────────────
    c.fillStyle='rgba(4,8,14,0.75)';
    if(horiz && !vert){
      c.fillRect(x,y+(TS>>1),TS,1);
      if(rh(1)<0.6) c.fillRect(x,y+(TS>>1)+1,TS,1); // wider crack on 60% of tiles
    } else if(vert && !horiz){
      c.fillRect(x+(TS>>1),y,1,TS);
      if(rh(1)<0.6) c.fillRect(x+(TS>>1)+1,y,1,TS);
    } else {
      // Junction: cross crack
      c.fillRect(x,y+(TS>>1),TS,1); c.fillRect(x+(TS>>1),y,1,TS);
    }

    // ── 2. Secondary diagonal / transverse crack (most tiles) ──
    if(rh(2)<0.72){
      const cx=x+4+((seed*3)&7), cy=y+4+((seed*5)&7);
      const cw=4+((seed*7)&5),   ch=3+((seed*11)&4);
      c.fillStyle='rgba(4,8,14,0.55)';
      if(rh(3)<0.5) c.fillRect(cx,cy,cw,1);   // horizontal crack
      else          c.fillRect(cx,cy,1,ch);    // vertical crack
    }

    // ── 3. Missing slab chunk — exposed dark earth beneath (30%) ─
    if(rh(4)<0.30){
      const bx=x+3+((seed*17)&9), by=y+3+((seed*13)&9);
      const bw=3+((seed*19)&5),   bh=3+((seed*23)&4);
      // Dark earth/dirt showing through broken surface
      c.fillStyle='#0e1208'; c.fillRect(bx,by,bw,bh);
      // Crack outline around the hole
      c.fillStyle='rgba(2,4,6,0.80)';
      c.fillRect(bx-1,by-1,bw+2,1); c.fillRect(bx-1,by+bh,bw+2,1);
      c.fillRect(bx-1,by,1,bh);     c.fillRect(bx+bw,by,1,bh);
    }

    // ── 4. Rubble — small stone chips (40% of tiles) ───────────
    if(rh(5)<0.40){
      const rx=x+2+((seed*31)&15), ry=y+2+((seed*37)&13);
      c.fillStyle='#1a2030'; c.fillRect(rx,ry,3,2);
      c.fillStyle='#161c28'; c.fillRect(rx+2,ry+1,2,2);
      if(rh(6)<0.5){ c.fillStyle='#181e2c'; c.fillRect(rx-2,ry+3,2,2); }
    }

    // ── 5. Grass tufts pushing through cracks (seeded, ~35%) ───
    if(rh(7)<0.35){
      const gx=x+5+((seed*41)&11), gy=y+5+((seed*43)&11);
      // Dark earth base for the tuft
      c.fillStyle='#0a1006'; c.fillRect(gx,gy+2,4,2);
      // Grass blades — 3-4 single-pixel vertical strokes
      const blades=[[0,0],[1,-2],[2,-1],[3,-3]];
      blades.forEach(([bx2,by2],i)=>{
        if(i===3 && rh(8+i)<0.5) return; // 4th blade optional
        const g=40+((seed*(i+13))&30);
        c.fillStyle=`rgb(${g},${g+50},${g>>1})`;
        c.fillRect(gx+bx2, gy+by2, 1, 3-Math.abs(by2));
      });
    }

    // ── 6. Second grass tuft on heavily overgrown tiles (15%) ──
    if(rh(9)<0.15){
      const gx=x+12+((seed*53)&7), gy=y+8+((seed*59)&7);
      c.fillStyle='#0a1006'; c.fillRect(gx,gy+1,3,2);
      c.fillStyle=`rgb(38,88,19)`; c.fillRect(gx,gy,1,3);
      c.fillStyle=`rgb(44,94,22)`; c.fillRect(gx+1,gy-1,1,3);
      c.fillStyle=`rgb(36,84,18)`; c.fillRect(gx+2,gy,1,2);
    }

    // ── 7. Weathering stain — dirt/algae discolouration (50%) ──
    if(rh(10)<0.50){
      const sx=x+1+((seed*67)&16), sy=y+1+((seed*71)&14);
      c.fillStyle='rgba(20,30,10,0.22)'; c.fillRect(sx,sy,5+((seed*79)&5),3);
    }
  },
  ancient_wall(c,x,y){
    // Futuristic Greek marble — dark veined stone with etched meander pattern and faint plasma glow
    const tx=x/TS|0, ty=y/TS|0;
    const grid=G.planets?.[G.curPlanet]?.grid;
    const isWall=(_x,_y)=>{ const t=grid?.[_y]?.[_x]?.type; return t==='ANCIENT_WALL'; };
    const openN=!isWall(tx,ty-1), openS=!isWall(tx,ty+1);
    const openW=!isWall(tx-1,ty), openE=!isWall(tx+1,ty);

    // --- base stone: dark blue-grey marble with subtle tile variation ---
    const stoneVars=['#0f1622','#111824','#0d1520','#101420','#0e1724'];
    const sv=((tx*3+ty*7)^(tx*5))%stoneVars.length;
    c.fillStyle=stoneVars[Math.abs(sv)]; c.fillRect(x,y,TS,TS);

    // --- marble veining: diagonal wisps across the tile ---
    // Use world-coords so veins flow seamlessly across adjacent wall tiles
    const wx=tx*TS, wy=ty*TS;
    const veinSeed=(tx*17+ty*31);
    // Vein 1 — fine light vein
    const v1x=(veinSeed*7)%TS, v1angle=0.35+((veinSeed*3)%10)*0.04;
    c.strokeStyle='rgba(60,90,140,0.28)'; c.lineWidth=1;
    c.beginPath(); c.moveTo(x+v1x,y); c.lineTo(x+v1x+Math.sin(v1angle)*TS,y+TS); c.stroke();
    // Vein 2 — slightly brighter, narrower
    const v2x=(veinSeed*13+8)%TS, v2angle=-0.2+((veinSeed*11)%8)*0.03;
    c.strokeStyle='rgba(80,120,180,0.18)'; c.lineWidth=1;
    c.beginPath(); c.moveTo(x+v2x,y); c.lineTo(x+v2x+Math.sin(v2angle)*TS,y+TS); c.stroke();
    // Vein 3 — very faint horizontal crack
    if((veinSeed%5)===0){
      const vy3=4+((veinSeed*9)%14);
      c.strokeStyle='rgba(40,70,120,0.20)'; c.lineWidth=1;
      c.beginPath(); c.moveTo(x,y+vy3); c.lineTo(x+TS,y+vy3+((veinSeed%3)-1)); c.stroke();
    }
    c.lineWidth=1;

    // --- Greek meander / key fret pattern etched into the stone ---
    // Only draw on interior tiles (not exposed-edge tiles) to avoid clashing with the border trim,
    // but always draw a subtle etch so fully interior walls also have texture.
    // The meander is a tiny 4-px repeating key drawn with faint plasma-teal lines.
    const drawMeander=(px,py,col)=>{
      c.fillStyle=col;
      // Tiny Greek key unit: 4×4 px block tiling offset by tile position
      const ox=((tx*4)%4), oy=((ty*4)%4);
      // Horizontal bar top
      c.fillRect(px+2+ox, py+2+oy, 8, 1);
      // Vertical bar right
      c.fillRect(px+9+ox, py+2+oy, 1, 4);
      // Horizontal bar bottom
      c.fillRect(px+4+ox, py+5+oy, 5, 1);
      // Vertical bar inner-left stub
      c.fillRect(px+4+ox, py+3+oy, 1, 3);
      // Second unit offset by half tile
      const ox2=((tx*4+8)%TS-2), oy2=((ty*4+8)%TS-2);
      if(ox2>0 && ox2<TS-10 && oy2>0 && oy2<TS-8){
        c.fillRect(px+ox2,   py+oy2,   7, 1);
        c.fillRect(px+ox2+6, py+oy2,   1, 4);
        c.fillRect(px+ox2+2, py+oy2+3, 4, 1);
        c.fillRect(px+ox2+2, py+oy2+1, 1, 3);
      }
    };
    drawMeander(x, y, 'rgba(28,180,160,0.13)');

    // --- faint plasma energy sheen — subtle glow across the whole face ---
    // Pulsing is intentionally omitted (no Date.now per render-on-demand policy),
    // but a gentle static gradient gives depth.
    const grad=c.createLinearGradient(x,y,x+TS,y+TS);
    grad.addColorStop(0,  'rgba(20,200,180,0.04)');
    grad.addColorStop(0.5,'rgba(40,232,200,0.02)');
    grad.addColorStop(1,  'rgba(10,160,140,0.05)');
    c.fillStyle=grad; c.fillRect(x,y,TS,TS);

    // --- Teal trim + glow on every exposed edge (unchanged) ---
    if(openN){
      c.fillStyle='#28e8c8';               c.fillRect(x,y,TS,1);
      c.fillStyle='rgba(40,232,200,0.18)'; c.fillRect(x,y+1,TS,2);
    }
    if(openS){
      c.fillStyle='#28e8c8';               c.fillRect(x,y+TS-1,TS,1);
      c.fillStyle='rgba(40,232,200,0.18)'; c.fillRect(x,y+TS-3,TS,2);
    }
    if(openW){
      c.fillStyle='#28e8c8';               c.fillRect(x,y,1,TS);
      c.fillStyle='rgba(40,232,200,0.18)'; c.fillRect(x+1,y,2,TS);
    }
    if(openE){
      c.fillStyle='#28e8c8';               c.fillRect(x+TS-1,y,1,TS);
      c.fillStyle='rgba(40,232,200,0.18)'; c.fillRect(x+TS-3,y,2,TS);
    }
  },
  ancient_outpost_floor(c,x,y){
    // Uniform composite floor panel — identical every tile, no variation
    c.fillStyle='#0a1018'; c.fillRect(x,y,TS,TS);
    // Recessed panel border — 1px inset groove, same on all four edges
    c.fillStyle='rgba(0,0,0,0.60)';
    c.fillRect(x,y,TS,1); c.fillRect(x,y,1,TS);           // top + left groove
    c.fillRect(x,y+TS-1,TS,1); c.fillRect(x+TS-1,y,1,TS); // bottom + right groove
    // Faint inner highlight just inside the groove — slight bevel
    c.fillStyle='rgba(40,100,160,0.10)';
    c.fillRect(x+1,y+1,TS-2,1); c.fillRect(x+1,y+1,1,TS-2);
  },

  // -- Stranded / derelict ship interior tiles ---------------------
  // (These reuse station tiles with slightly warmer tones — ship hull not station)

  // -- Cave tiles --------------------------------------------------
  cave_floor(c,x,y){
    // Seamless rock floor — clean colour variation, no detail marks
    const tx = x/TS, ty = y/TS;
    const h = ((tx*7+ty*11+tx*ty*3)|0 + 600) % 6;
    const bases = ['#201e1a','#1e1c18','#221f1b','#1c1a17','#1f1d19','#211f1b'];
    c.fillStyle = bases[h]; c.fillRect(x,y,TS,TS);
  },
  cave_wall(c,x,y){
    // Solid rock face — seamless, no inset border
    const tx = x/TS, ty = y/TS;
    // Base colour varies per tile
    const bases = ['#2a2620','#282420','#2c2822','#26241e','#2e2a22'];
    const bi = ((tx*5+ty*8)|0 + 500) % 5;
    c.fillStyle = bases[bi]; c.fillRect(x,y,TS,TS);
    // Strata bands — use world y-pixel so bands flow across adjacent wall tiles
    const bandY = y % (TS*3);
    c.fillStyle='#332e24'; c.fillRect(x, y + ((TS*3 - bandY + 2) % TS), TS, 3);
    c.fillStyle='#2e2a1e'; c.fillRect(x, y + ((TS*3 - bandY + 9) % TS), TS, 4);
  },
  cave_stalagtite(c,x,y){
    // Stalactite/stalagmite — stone spike hanging from ceiling
    c.fillStyle='#1a1714'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#222018'; c.fillRect(x+1,y+1,TS-2,TS-2);
    // Rock base (ceiling/floor mount)
    c.fillStyle='#3a3020'; c.fillRect(x+3,y+1,TS-6,5);
    c.fillStyle='#46382a'; c.fillRect(x+4,y+2,TS-8,3);
    // Spike body tapering downward
    c.fillStyle='#3e3428'; c.fillRect(x+7,y+5,10,5);
    c.fillStyle='#3a3020'; c.fillRect(x+8,y+9,8,4);
    c.fillStyle='#322a1e'; c.fillRect(x+9,y+12,6,4);
    c.fillStyle='#2a2418'; c.fillRect(x+10,y+15,4,3);
    c.fillStyle='#221e14'; c.fillRect(x+11,y+17,2,3);
    // Wet drip highlight on one side
    c.fillStyle='rgba(60,90,120,0.4)'; c.fillRect(x+11,y+6,1,12);
    // Tip
    c.fillStyle='#201a10'; c.fillRect(x+11,y+20,2,1);
  },
  cave_exit(c,x,y){
    // Exit shaft upward — lighter glow from above, rocky archway
    c.fillStyle='#1a1714'; c.fillRect(x,y,TS,TS);
    // Sky glow coming down the shaft
    c.fillStyle='rgba(80,110,150,0.50)'; c.beginPath(); c.arc(x+12,y+6,8,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(110,150,190,0.35)'; c.beginPath(); c.arc(x+12,y+4,6,0,Math.PI*2); c.fill();
    // Rocky arch sides
    c.fillStyle='#3a3020'; c.fillRect(x+1,y+1,5,TS-2); c.fillRect(x+TS-6,y+1,5,TS-2);
    c.fillStyle='#46382a'; c.fillRect(x+2,y+2,3,TS-4); c.fillRect(x+TS-5,y+2,3,TS-4);
    // Arch top
    c.fillStyle='#3a3020'; c.fillRect(x+6,y+1,TS-12,5);
    c.fillStyle='#2e2418'; c.fillRect(x+7,y+2,TS-14,3);
    // Floor — lighter inside opening
    c.fillStyle='#242c38'; c.fillRect(x+6,y+18,TS-12,4);
    // Upward arrow hint — subtle
    c.fillStyle='rgba(130,180,220,0.45)';
    c.fillRect(x+11,y+8,2,8); c.fillRect(x+9,y+10,2,2); c.fillRect(x+13,y+10,2,2);
  },
  cave_nest(c,x,y){
    // Organic nest mass — chitinous shell-material mound
    // Mound layers — dark amber-brown organic matter
    c.fillStyle='#3e2a0e'; c.beginPath(); c.arc(x+12,y+13,9,0,Math.PI*2); c.fill();
    c.fillStyle='#543818'; c.beginPath(); c.arc(x+12,y+13,7,0,Math.PI*2); c.fill();
    c.fillStyle='#3a2410'; c.beginPath(); c.arc(x+12,y+14,5,0,Math.PI*2); c.fill();
    c.fillStyle='#241608'; c.beginPath(); c.arc(x+12,y+14,3,0,Math.PI*2); c.fill();
    // Twig/bone fragments radiating out
    c.fillStyle='#6a4828';
    c.fillRect(x+2,y+12,5,2); c.fillRect(x+17,y+14,5,2);
    c.fillRect(x+11,y+2,2,5); c.fillRect(x+13,y+19,2,4);
    c.fillRect(x+4,y+5,2,2); c.fillRect(x+17,y+6,2,2);
    // Membrane web strands
    c.fillStyle='rgba(100,65,25,0.55)';
    c.fillRect(x+5,y+9,8,1); c.fillRect(x+11,y+5,1,8);
  },
  cave_bug(c,x,y){
    // Cave spider/insect — dark segmented body, pale legs
    c.fillStyle='rgba(0,0,0,0)'; // transparent bg — drawn over floor
    // Legs (8 — 4 each side)
    c.fillStyle='#8a5a20';
    c.fillRect(x+2,y+8,4,1);  c.fillRect(x+2,y+11,4,1);
    c.fillRect(x+2,y+6,3,1);  c.fillRect(x+2,y+13,3,1);
    c.fillRect(x+18,y+8,4,1); c.fillRect(x+18,y+11,4,1);
    c.fillRect(x+19,y+6,3,1); c.fillRect(x+19,y+13,3,1);
    // Abdomen
    c.fillStyle='#5a3010'; c.beginPath(); c.arc(x+12,y+14,5,0,Math.PI*2); c.fill();
    c.fillStyle='#7a4518'; c.beginPath(); c.arc(x+12,y+14,4,0,Math.PI*2); c.fill();
    // Thorax
    c.fillStyle='#6a3a14'; c.beginPath(); c.arc(x+12,y+9,4,0,Math.PI*2); c.fill();
    c.fillStyle='#8a5020'; c.beginPath(); c.arc(x+12,y+9,3,0,Math.PI*2); c.fill();
    // Head
    c.fillStyle='#4a2a0c'; c.beginPath(); c.arc(x+12,y+5,3,0,Math.PI*2); c.fill();
    // Eyes — pale amber
    c.fillStyle='#ddaa44'; c.fillRect(x+10,y+4,2,1); c.fillRect(x+13,y+4,2,1);
    // Mandibles
    c.fillStyle='#3a2008'; c.fillRect(x+9,y+7,2,1); c.fillRect(x+13,y+7,2,1);
  },
  cave_queen(c,x,y){
    // Boss cave queen — larger, more imposing, bioluminescent markings
    c.fillStyle='rgba(0,0,0,0)'; // transparent bg
    // Long legs — 3 pairs visible
    c.fillStyle='#7a4818';
    c.fillRect(x+1,y+6,5,2);  c.fillRect(x+18,y+6,5,2);
    c.fillRect(x+1,y+11,6,2); c.fillRect(x+17,y+11,6,2);
    c.fillRect(x+2,y+16,5,2); c.fillRect(x+17,y+16,5,2);
    // Leg highlights
    c.fillStyle='#aa6a28';
    c.fillRect(x+2,y+6,2,1); c.fillRect(x+20,y+6,2,1);
    // Large abdomen
    c.fillStyle='#3a1e06'; c.beginPath(); c.arc(x+12,y+15,7,0,Math.PI*2); c.fill();
    c.fillStyle='#5a2e0a'; c.beginPath(); c.arc(x+12,y+15,6,0,Math.PI*2); c.fill();
    // Abdominal glow stripes
    c.fillStyle='rgba(160,100,20,0.5)';
    c.fillRect(x+7,y+13,10,2); c.fillRect(x+7,y+17,10,2);
    // Thorax
    c.fillStyle='#4a2808'; c.beginPath(); c.arc(x+12,y+9,5,0,Math.PI*2); c.fill();
    c.fillStyle='#6a3c10'; c.beginPath(); c.arc(x+12,y+9,4,0,Math.PI*2); c.fill();
    // Head
    c.fillStyle='#2e1606'; c.beginPath(); c.arc(x+12,y+4,4,0,Math.PI*2); c.fill();
    c.fillStyle='#3e2208'; c.beginPath(); c.arc(x+12,y+4,3,0,Math.PI*2); c.fill();
    // Four glowing eyes
    c.fillStyle='#ffcc44';
    c.fillRect(x+9,y+3,2,2); c.fillRect(x+13,y+3,2,2);
    c.fillStyle='rgba(255,200,50,0.4)'; c.beginPath(); c.arc(x+10,y+4,2,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(255,200,50,0.4)'; c.beginPath(); c.arc(x+14,y+4,2,0,Math.PI*2); c.fill();
    // Crown spines
    c.fillStyle='#5a3010';
    c.fillRect(x+8,y+1,2,3); c.fillRect(x+11,y+0,2,3); c.fillRect(x+14,y+1,2,3);
    // Ovipositor tail
    c.fillStyle='#4a2808'; c.fillRect(x+10,y+21,4,2); c.fillRect(x+11,y+23,2,1);
  },

  // -- Cave entrance (surface level) ------------------------------
  CAVE_ENTRANCE(c,x,y,cell){
    // A hole in the ground — the biome floor is drawn underneath by the caller.
    // We just draw the dark void and a subtle shadow rim to blend with any terrain.
    const cx2 = x + TS/2, cy2 = y + TS/2;
    // Shadow rim — slightly darker than surroundings, elliptical
    const grad = ctx.createRadialGradient(cx2, cy2+2, 3, cx2, cy2+2, 11);
    grad.addColorStop(0, 'rgba(0,0,0,0.85)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.55)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = grad;
    c.beginPath(); c.ellipse(cx2, cy2+1, 11, 9, 0, 0, Math.PI*2); c.fill();
    // Dark void at centre
    c.fillStyle = '#080606';
    c.beginPath(); c.ellipse(cx2, cy2+1, 7, 5, 0, 0, Math.PI*2); c.fill();
    // Faint depth — slightly lighter inner glow so it reads as depth not a stain
    c.fillStyle = 'rgba(30,20,15,0.6)';
    c.beginPath(); c.ellipse(cx2, cy2+1, 4, 3, 0, 0, Math.PI*2); c.fill();
  },

  // -- Underwater tiles -------------------------------------------

  uw_floor(c,x,y){
    // Sandy/silt seabed — position-seeded for consistent variation
    const seed = (x*7+y*13)%32;
    const seed2 = (x*17+y*5)%24;
    // Base colour — slight variation between tiles
    const base = seed<8?'#021828':seed<16?'#021c2e':seed<24?'#011520':'#02182c';
    c.fillStyle=base; c.fillRect(x,y,TS,TS);
    // Silt ripple bands — very subtle horizontal texture
    if(seed%4===0){
      c.fillStyle='rgba(15,50,80,0.12)';
      c.fillRect(x,y+4+(seed%8),TS,2);
      c.fillRect(x,y+14+(seed2%6),TS,1);
    }
    // Sand grains — varied size and opacity
    c.fillStyle='rgba(30,70,110,0.35)';
    c.fillRect(x+2+seed%16,y+3+seed2%16,1+(seed%2),1);
    c.fillRect(x+10+seed2%10,y+16+seed%6,2,1);
    c.fillStyle='rgba(50,100,140,0.2)';
    c.fillRect(x+6+seed%10,y+9+seed2%10,1,1);
    // Caustic light patch — brighter on some tiles
    if(seed%3!==0){
      c.fillStyle='rgba(20,70,120,0.2)';
      c.beginPath(); c.arc(x+6+(seed%10),y+8+(seed2%8),2+(seed%2),0,Math.PI*2); c.fill();
    }
  },

  uw_wall(c,x,y){
    // Underside of land seen from below — murky rock with moss and faint light bleed at water edge
    const seed=(x*11+y*7)%32;
    // Base — very dark, slightly greenish (algae-stained rock)
    c.fillStyle='#010e10'; c.fillRect(x,y,TS,TS);
    // Rock face variation
    c.fillStyle=seed<10?'#020f12':seed<20?'#010d0f':'#011012';
    c.fillRect(x+1,y+1,TS-2,TS-2);
    // Moss/algae patches — greenish blotches on rock face
    c.fillStyle='rgba(8,35,18,0.7)';
    c.fillRect(x+2+(seed%10),y+3+(seed%8),3+(seed%4),2+(seed%3));
    c.fillStyle='rgba(5,28,14,0.5)';
    c.fillRect(x+10+(seed%8),y+12+(seed%6),4,3);
    // Faint light seeping in from the water-edge — brightest at bottom of tile
    // (the "ceiling" of the water body is above, light comes from below)
    c.fillStyle='rgba(10,40,60,0.18)';
    c.fillRect(x,y+TS-5,TS,5);
    c.fillStyle='rgba(10,40,60,0.08)';
    c.fillRect(x,y+TS-9,TS,4);
    // Rock texture seams
    c.fillStyle='rgba(0,0,0,0.4)';
    c.fillRect(x+(seed%12),y+6,TS/3,1);
  },

  uw_kelp(c,x,y){
    // Kelp strand swaying from seabed
    c.fillStyle='#021828'; c.fillRect(x,y,TS,TS);
    const seed=(x*5+y*11)%8;
    // Stalk — sways slightly based on tile position
    const sway = seed<4 ? 1 : -1;
    c.fillStyle='#1a6a30';
    c.fillRect(x+11,y+18,2,6);
    c.fillRect(x+11+sway,y+12,2,7);
    c.fillRect(x+11+sway*2,y+6,2,7);
    c.fillRect(x+10+sway*2,y+2,2,5);
    // Fronds
    c.fillStyle='#1e7a36';
    c.fillRect(x+8+sway,y+8,5,2); c.fillRect(x+12+sway,y+8,4,1);
    c.fillRect(x+7+sway*2,y+4,6,2); c.fillRect(x+13+sway,y+4,3,1);
    c.fillStyle='#267a3a';
    c.fillRect(x+9+sway,y+14,4,2);
  },

  uw_coral(c,x,y){
    // Branching coral formation
    c.fillStyle='#021828'; c.fillRect(x,y,TS,TS);
    const seed=(x*9+y*3)%8;
    const col1 = seed<3 ? '#cc3355' : seed<6 ? '#cc6622' : '#9933aa';
    const col2 = seed<3 ? '#ee4466' : seed<6 ? '#ee7733' : '#aa44bb';
    // Base trunk
    c.fillStyle=col1; c.fillRect(x+10,y+16,4,6);
    // Branches
    c.fillRect(x+6,y+10,4,3); c.fillRect(x+14,y+12,4,3);
    c.fillRect(x+8,y+6,3,5);  c.fillRect(x+13,y+7,3,5);
    // Tips — brighter
    c.fillStyle=col2;
    c.fillRect(x+5,y+8,3,3);  c.fillRect(x+16,y+10,3,3);
    c.fillRect(x+7,y+4,3,3);  c.fillRect(x+14,y+5,3,3);
    c.fillRect(x+10,y+14,4,3);
  },

  uw_vent(c,x,y){
    // Hydrothermal vent — dangerous, impassable
    c.fillStyle='#010c14'; c.fillRect(x,y,TS,TS);
    // Rock chimney
    c.fillStyle='#1a1008'; c.beginPath(); c.arc(x+12,y+16,6,0,Math.PI*2); c.fill();
    c.fillStyle='#2a1a10'; c.beginPath(); c.arc(x+12,y+16,4,0,Math.PI*2); c.fill();
    c.fillStyle='#0e0806'; c.fillRect(x+9,y+6,6,12);
    c.fillStyle='#1a1008'; c.fillRect(x+10,y+5,4,12);
    // Vent opening
    c.fillStyle='#080806'; c.fillRect(x+11,y+4,2,4);
    // Heat shimmer — orange glow
    c.fillStyle='rgba(200,80,10,0.6)'; c.beginPath(); c.arc(x+12,y+5,2,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(200,80,10,0.25)'; c.beginPath(); c.arc(x+12,y+3,3,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(240,120,20,0.15)'; c.beginPath(); c.arc(x+12,y+1,4,0,Math.PI*2); c.fill();
    // Mineral deposits
    c.fillStyle='#443322';
    c.fillRect(x+7,y+15,3,3); c.fillRect(x+14,y+14,3,3);
  },

  uw_wreck(c,x,y){
    // Sunken wreck / debris — lootable
    c.fillStyle='#021828'; c.fillRect(x,y,TS,TS);
    // Corroded hull plate
    c.fillStyle='#2a2018'; c.fillRect(x+3,y+8,TS-6,TS-10);
    c.fillStyle='#1e1a12'; c.fillRect(x+4,y+9,TS-8,TS-12);
    // Rust streaks
    c.fillStyle='rgba(100,50,10,0.5)';
    c.fillRect(x+5,y+9,2,8); c.fillRect(x+12,y+10,2,6); c.fillRect(x+18,y+11,2,5);
    // Broken edge
    c.fillStyle='#3a2c1a';
    c.fillRect(x+3,y+8,3,2); c.fillRect(x+8,y+7,2,2); c.fillRect(x+15,y+8,4,2);
    // Algae growth
    c.fillStyle='rgba(15,55,25,0.55)';
    c.fillRect(x+6,y+14,5,3); c.fillRect(x+14,y+12,4,4);
    // Subtle glow — something might be worth grabbing
    c.fillStyle='rgba(180,140,60,0.2)'; c.beginPath(); c.arc(x+12,y+13,5,0,Math.PI*2); c.fill();
  },

  uw_exit(c,x,y){
    // Surface exit — upward light shaft through water
    c.fillStyle='#021828'; c.fillRect(x,y,TS,TS);
    // Light shaft from above
    c.fillStyle='rgba(40,120,180,0.35)'; c.beginPath(); c.arc(x+12,y+8,7,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(60,150,200,0.25)'; c.beginPath(); c.arc(x+12,y+6,5,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(80,170,220,0.15)'; c.beginPath(); c.arc(x+12,y+4,4,0,Math.PI*2); c.fill();
    // Ripple lines at water surface
    c.strokeStyle='rgba(80,160,220,0.5)'; c.lineWidth=1;
    c.beginPath(); c.moveTo(x+5,y+3); c.lineTo(x+19,y+3); c.stroke();
    c.strokeStyle='rgba(60,130,180,0.3)';
    c.beginPath(); c.moveTo(x+7,y+5); c.lineTo(x+17,y+5); c.stroke();
    // Upward arrow
    c.fillStyle='rgba(100,200,255,0.5)';
    c.fillRect(x+11,y+10,2,8); c.fillRect(x+9,y+12,2,2); c.fillRect(x+13,y+12,2,2);
  },

  // -- Civilization structures -------------------------------------

  civ_hut(c,x,y){
    // Primitive — rounded mud hut with thatch roof
    // Wall — earthen brown
    c.fillStyle='#5a3e20'; c.beginPath(); c.arc(x+12,y+14,8,0,Math.PI*2); c.fill();
    c.fillStyle='#6e4e28'; c.beginPath(); c.arc(x+12,y+14,7,0,Math.PI*2); c.fill();
    // Thatch roof — cone peak
    c.fillStyle='#7a6020';
    c.beginPath(); c.moveTo(x+12,y+2); c.lineTo(x+20,y+13); c.lineTo(x+4,y+13); c.closePath(); c.fill();
    c.fillStyle='#8a7028';
    c.beginPath(); c.moveTo(x+12,y+4); c.lineTo(x+18,y+12); c.lineTo(x+6,y+12); c.closePath(); c.fill();
    // Thatch texture strokes
    c.fillStyle='#6a5818';
    for(let i=0;i<4;i++) c.fillRect(x+6+i*3,y+9,1,4);
    // Door opening — dark
    c.fillStyle='#1a0e06'; c.fillRect(x+10,y+12,4,5);
    // Smoke hole
    c.fillStyle='rgba(60,50,30,0.4)'; c.beginPath(); c.arc(x+12,y+5,2,0,Math.PI*2); c.fill();
  },

  civ_fire_pit(c,x,y){
    // Primitive — stone ring with embers
    // Stone ring
    c.fillStyle='#3a3028';
    c.beginPath(); c.arc(x+12,y+12,8,0,Math.PI*2); c.fill();
    c.fillStyle='#0a0908';
    c.beginPath(); c.arc(x+12,y+12,5,0,Math.PI*2); c.fill();
    // Embers
    c.fillStyle='#331000'; c.beginPath(); c.arc(x+12,y+12,4,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(180,60,0,0.7)'; c.beginPath(); c.arc(x+12,y+13,3,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(240,120,0,0.5)'; c.beginPath(); c.arc(x+11,y+12,2,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(255,200,50,0.4)'; c.beginPath(); c.arc(x+13,y+11,1.5,0,Math.PI*2); c.fill();
    // Log sticks
    c.fillStyle='#2a1a0a';
    c.fillRect(x+7,y+11,10,2); c.save(); c.translate(x+12,y+12); c.rotate(1.0);
    c.fillRect(-5,-1,10,2); c.restore();
    // Outer stones
    c.fillStyle='#4a4038';
    for(let i=0;i<6;i++){
      const a=i/6*Math.PI*2;
      c.fillRect(x+12+Math.round(Math.cos(a)*7)-1, y+12+Math.round(Math.sin(a)*7)-1, 2, 2);
    }
  },

  civ_longhouse(c,x,y){
    // Tribal — long rectangular wooden structure
    // Main body — dark timber
    c.fillStyle='#3a2810'; c.fillRect(x+2,y+6,TS-4,12);
    c.fillStyle='#4a3418'; c.fillRect(x+3,y+7,TS-6,10);
    // Plank texture
    c.fillStyle='#3a2810';
    for(let i=0;i<4;i++) c.fillRect(x+3+i*4,y+7,1,10);
    // Roof — pitched, dark wood beams
    c.fillStyle='#2a1c0c';
    c.beginPath(); c.moveTo(x+1,y+7); c.lineTo(x+12,y+2); c.lineTo(x+TS-1,y+7); c.closePath(); c.fill();
    c.fillStyle='#3a2810';
    c.beginPath(); c.moveTo(x+2,y+7); c.lineTo(x+12,y+3); c.lineTo(x+TS-2,y+7); c.closePath(); c.fill();
    // Ridge beam
    c.fillStyle='#5a3c1a'; c.fillRect(x+2,y+3,TS-4,2);
    // Door
    c.fillStyle='#140c04'; c.fillRect(x+9,y+13,6,5);
    c.fillStyle='#2a1c0c'; c.fillRect(x+10,y+14,4,4);
  },

  civ_totem(c,x,y){
    // Tribal — carved wooden pole with face symbols
    // Base mound
    c.fillStyle='#2a1e0a'; c.beginPath(); c.arc(x+12,y+21,5,0,Math.PI*2); c.fill();
    // Pole body
    c.fillStyle='#4a3418'; c.fillRect(x+9,y+4,6,18);
    c.fillStyle='#5a3e20'; c.fillRect(x+10,y+5,4,16);
    // Top wing finials
    c.fillStyle='#3a2810'; c.fillRect(x+5,y+4,14,3);
    c.fillStyle='#4a3418'; c.fillRect(x+6,y+5,12,2);
    // Carved face — upper
    c.fillStyle='#2a1c0c';
    c.fillRect(x+10,y+7,4,4); // face block
    c.fillStyle='#cc8822'; c.fillRect(x+10,y+8,2,1); c.fillRect(x+12,y+8,2,1); // eyes
    c.fillStyle='#2a1c0c'; c.fillRect(x+10,y+10,4,1); // mouth
    // Carved face — lower
    c.fillStyle='#2a1c0c'; c.fillRect(x+10,y+14,4,4);
    c.fillStyle='#aa6618'; c.fillRect(x+10,y+15,2,1); c.fillRect(x+12,y+15,2,1);
    c.fillStyle='#2a1c0c'; c.fillRect(x+10,y+17,4,1);
  },

  civ_stone_tower(c,x,y){
    // Medieval — crenellated stone tower
    // Base shadow
    c.fillStyle='#1a1814'; c.fillRect(x+2,y+19,TS-4,3);
    // Tower body
    c.fillStyle='#3a3830'; c.fillRect(x+4,y+6,TS-8,16);
    c.fillStyle='#4a4840'; c.fillRect(x+5,y+7,TS-10,14);
    // Stone texture
    c.fillStyle='#3a3830';
    for(let row=0;row<3;row++) for(let col=0;col<2;col++)
      c.fillRect(x+5+col*5+(row%2)*2, y+8+row*4, 4, 3);
    // Crenellations top
    c.fillStyle='#4a4840';
    c.fillRect(x+4,y+3,TS-8,4);
    c.fillStyle='#080808';
    c.fillRect(x+4,y+3,3,3); c.fillRect(x+10,y+3,3,3); c.fillRect(x+16,y+3,3,3);
    // Arrow slit
    c.fillStyle='#0e0c0a'; c.fillRect(x+11,y+10,2,5);
    // Door arch
    c.fillStyle='#1a1814'; c.fillRect(x+9,y+17,6,5);
    c.fillStyle='#0e0c0a';
    c.beginPath(); c.arc(x+12,y+17,3,Math.PI,0); c.fill();
  },

  civ_market(c,x,y){
    // Medieval — market stall with awning
    // Ground platform
    c.fillStyle='#2a2018'; c.fillRect(x+1,y+17,TS-2,5);
    // Posts
    c.fillStyle='#3a2a14'; c.fillRect(x+3,y+8,2,10); c.fillRect(x+TS-5,y+8,2,10);
    // Awning — striped
    c.fillStyle='#882222'; c.fillRect(x+2,y+6,TS-4,5);
    c.fillStyle='#aa3333';
    for(let s=0;s<4;s++) c.fillRect(x+3+s*4,y+6,2,5);
    c.fillStyle='#cc4444'; c.fillRect(x+2,y+6,TS-4,1);
    // Awning drape bottom
    for(let d=0;d<5;d++){
      c.fillStyle='#882222';
      c.beginPath(); c.arc(x+3+d*4,y+11,2,0,Math.PI); c.fill();
    }
    // Goods on counter
    c.fillStyle='#ffe066'; c.fillRect(x+4,y+14,4,3);
    c.fillStyle='#44aa44'; c.fillRect(x+9,y+14,3,3);
    c.fillStyle='#cc6622'; c.fillRect(x+13,y+14,4,3);
    // Table
    c.fillStyle='#3a2a14'; c.fillRect(x+3,y+16,TS-6,2);
  },

  civ_factory(c,x,y){
    // Industrial — blocky building with chimney stack
    // Main building
    c.fillStyle='#282420'; c.fillRect(x+1,y+10,TS-2,12);
    c.fillStyle='#302c28'; c.fillRect(x+2,y+11,TS-4,10);
    // Brick texture
    c.fillStyle='#282420';
    for(let r=0;r<2;r++) for(let b2=0;b2<3;b2++)
      c.fillRect(x+2+b2*5+(r%2)*2, y+12+r*4, 4, 3);
    // Large window — dark glass
    c.fillStyle='#0a1018'; c.fillRect(x+6,y+13,8,5);
    c.fillStyle='rgba(0,80,120,0.3)'; c.fillRect(x+7,y+14,6,3);
    // Chimney stack
    c.fillStyle='#201e1a'; c.fillRect(x+14,y+3,4,9);
    c.fillStyle='#282420'; c.fillRect(x+15,y+4,2,8);
    // Smoke
    c.fillStyle='rgba(60,55,50,0.5)'; c.beginPath(); c.arc(x+16,y+2,2.5,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(50,45,40,0.3)'; c.beginPath(); c.arc(x+15,y+0,2,0,Math.PI*2); c.fill();
    // Door
    c.fillStyle='#0e0c0a'; c.fillRect(x+5,y+18,4,4);
  },

  civ_tenement(c,x,y){
    // Industrial — multi-floor housing block
    // Building body
    c.fillStyle='#2c2824'; c.fillRect(x+1,y+2,TS-2,20);
    c.fillStyle='#363028'; c.fillRect(x+2,y+3,TS-4,18);
    // Floor dividers
    c.fillStyle='#2c2824'; c.fillRect(x+2,y+9,TS-4,1); c.fillRect(x+2,y+15,TS-4,1);
    // Windows — 2 per floor, 3 floors
    const winData = [[5,5],[12,5],[5,11],[12,11],[5,17],[12,17]];
    winData.forEach(([wx,wy],i)=>{
      const lit = (i*7+3)%5 !== 0; // some windows dark
      c.fillStyle='#0a0c10'; c.fillRect(x+wx,y+wy,4,4);
      if(lit){ c.fillStyle='rgba(200,160,60,0.5)'; c.fillRect(x+wx+1,y+wy+1,2,2); }
    });
    // Roof edge
    c.fillStyle='#222018'; c.fillRect(x+1,y+2,TS-2,2);
    // Door
    c.fillStyle='#100e0a'; c.fillRect(x+9,y+18,4,4);
  },

  civ_office(c,x,y){
    // Information age — glass-and-steel office block
    // Building core — dark tinted glass
    c.fillStyle='#0a1018'; c.fillRect(x+2,y+2,TS-4,TS-4);
    // Steel frame verticals
    c.fillStyle='#1e2228'; c.fillRect(x+2,y+2,2,TS-4); c.fillRect(x+TS-4,y+2,2,TS-4);
    c.fillRect(x+10,y+2,1,TS-4);
    // Floor bands — horizontal steel
    c.fillStyle='#1e2228';
    for(let f=0;f<4;f++) c.fillRect(x+2,y+2+f*5,TS-4,1);
    // Window grid — blue-grey tinted
    for(let row=0;row<4;row++) for(let col=0;col<2;col++){
      const wx = x+3+col*7, wy = y+4+row*5;
      c.fillStyle='rgba(40,80,120,0.45)'; c.fillRect(wx,wy,5,3);
      // Reflection glint
      c.fillStyle='rgba(180,210,240,0.15)'; c.fillRect(wx,wy,1,1);
    }
    // Roof — subtle antenna stub
    c.fillStyle='#2a2e34'; c.fillRect(x+11,y+1,2,3);
    c.fillStyle='#3a3e44'; c.fillRect(x+11,y+0,2,1);
  },

  civ_relay_tower(c,x,y){
    // Information age — communications mast with dishes
    // Base platform
    c.fillStyle='#1e2228'; c.fillRect(x+4,y+19,TS-8,3);
    c.fillStyle='#282c32'; c.fillRect(x+5,y+20,TS-10,2);
    // Leg struts
    c.fillStyle='#1a1e24';
    c.fillRect(x+6,y+13,1,7); c.fillRect(x+TS-7,y+13,1,7);
    c.fillRect(x+7,y+15,1,5); c.fillRect(x+TS-8,y+15,1,5);
    // Main mast
    c.fillStyle='#2a2e34'; c.fillRect(x+11,y+3,2,17);
    c.fillStyle='#3a3e44'; c.fillRect(x+11,y+4,1,16);
    // Crossbars
    c.fillStyle='#1e2228';
    c.fillRect(x+6,y+8,TS-12,1); c.fillRect(x+7,y+12,TS-14,1);
    // Dish — offset to side
    c.fillStyle='#2a3040'; c.fillRect(x+3,y+5,6,4);
    c.fillStyle='#3a4050'; c.fillRect(x+4,y+6,4,2);
    c.fillStyle='rgba(0,160,220,0.35)'; c.fillRect(x+4,y+6,4,2);
    // Blinking indicator light
    c.fillStyle='rgba(0,200,100,0.7)'; c.beginPath(); c.arc(x+12,y+3,1.5,0,Math.PI*2); c.fill();
  },

  uw_civ_base(c,x,y,body,accent,kind){
    DRAW.uw_floor(c,x,y);
    const seed = ((x/TS|0)*17 + (y/TS|0)*31) % 7;
    c.fillStyle='rgba(5,20,35,0.38)';
    c.beginPath(); c.ellipse(x+12,y+19,9,3,0,0,Math.PI*2); c.fill();
    c.strokeStyle='rgba(130,230,255,0.28)';
    c.lineWidth=1;
    for(let i=0;i<2;i++){
      const yy = y+5+i*7+seed%2;
      c.beginPath(); c.moveTo(x+2,yy); c.quadraticCurveTo(x+8,yy-2,x+14,yy); c.quadraticCurveTo(x+19,yy+2,x+22,yy); c.stroke();
    }
    c.fillStyle=body;
    c.beginPath(); c.ellipse(x+12,y+13,8,7,0,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(255,255,255,0.10)';
    c.beginPath(); c.ellipse(x+9,y+10,3,2,-0.5,0,Math.PI*2); c.fill();
    c.strokeStyle=accent; c.lineWidth=2;
    c.beginPath(); c.arc(x+12,y+13,9,Math.PI*0.12,Math.PI*0.88); c.stroke();
    c.fillStyle=accent;
    if(kind==='totem'){
      c.fillRect(x+11,y+4,2,16);
      c.beginPath(); c.arc(x+12,y+6,4,0,Math.PI*2); c.fill();
      c.fillStyle='rgba(10,50,65,0.75)'; c.fillRect(x+10,y+5,4,2); c.fillRect(x+10,y+12,4,2);
    } else if(kind==='habitat'){
      c.fillRect(x+5,y+13,3,5); c.fillRect(x+16,y+13,3,5);
      c.fillStyle='rgba(8,35,50,0.85)'; c.fillRect(x+9,y+14,6,5);
    } else if(kind==='bastion'){
      c.fillRect(x+4,y+8,4,11); c.fillRect(x+16,y+8,4,11);
      c.fillStyle='rgba(5,18,28,0.8)'; c.fillRect(x+7,y+10,10,3);
    } else if(kind==='exchange'){
      c.fillRect(x+3,y+16,18,3);
      c.fillStyle='#d8f0b0'; c.fillRect(x+6,y+14,3,2);
      c.fillStyle='#f0b880'; c.fillRect(x+11,y+14,3,2);
      c.fillStyle='#80e0d8'; c.fillRect(x+16,y+14,3,2);
    } else if(kind==='processor'){
      c.fillRect(x+4,y+18,16,3);
      c.fillStyle='rgba(90,210,230,0.45)';
      for(let i=0;i<3;i++) c.fillRect(x+7+i*4,y+8,2,8);
      c.fillStyle='rgba(20,90,110,0.65)'; c.fillRect(x+8,y+11,8,4);
    } else if(kind==='stack'){
      c.fillRect(x+6,y+7,4,12); c.fillRect(x+14,y+5,4,14);
      c.fillStyle='rgba(160,230,255,0.25)';
      c.fillRect(x+7,y+8,2,2); c.fillRect(x+15,y+7,2,2); c.fillRect(x+15,y+13,2,2);
    } else if(kind==='archive'){
      c.strokeStyle=accent; c.lineWidth=1;
      for(let i=0;i<3;i++) c.strokeRect(x+5+i*5,y+6+i%2,5,13);
      c.fillStyle='rgba(180,245,255,0.35)'; c.fillRect(x+8,y+10,8,5);
    } else if(kind==='sonar'){
      c.fillRect(x+11,y+4,2,15);
      c.strokeStyle=accent; c.lineWidth=1;
      c.beginPath(); c.arc(x+12,y+8,5,-0.8,0.8); c.stroke();
      c.beginPath(); c.arc(x+12,y+8,8,-0.6,0.6); c.stroke();
      c.fillStyle='rgba(180,245,255,0.85)'; c.beginPath(); c.arc(x+12,y+5,2,0,Math.PI*2); c.fill();
    } else {
      c.fillStyle='rgba(8,35,50,0.85)'; c.fillRect(x+10,y+14,4,5);
      c.fillStyle=accent; c.fillRect(x+6,y+17,12,2);
    }
    c.fillStyle='rgba(120,230,220,0.28)';
    c.beginPath(); c.arc(x+5+seed,y+5,1.5,0,Math.PI*2); c.fill();
    c.beginPath(); c.arc(x+18-seed%4,y+7+seed%3,1,0,Math.PI*2); c.fill();
  },
  uw_civ_shelter(c,x,y){ DRAW.uw_civ_base(c,x,y,'#0b4f68','#35c8d8','shelter'); },
  uw_civ_reef_totem(c,x,y){ DRAW.uw_civ_base(c,x,y,'#0a4558','#72e0c8','totem'); },
  uw_civ_habitat(c,x,y){ DRAW.uw_civ_base(c,x,y,'#0c5872','#54c8f0','habitat'); },
  uw_civ_bastion(c,x,y){ DRAW.uw_civ_base(c,x,y,'#174b68','#8ad8ff','bastion'); },
  uw_civ_exchange(c,x,y){ DRAW.uw_civ_base(c,x,y,'#0c5064','#90e0d0','exchange'); },
  uw_civ_processor(c,x,y){ DRAW.uw_civ_base(c,x,y,'#123f58','#5cc0dc','processor'); },
  uw_civ_pod_stack(c,x,y){ DRAW.uw_civ_base(c,x,y,'#174866','#78c8f0','stack'); },
  uw_civ_archive(c,x,y){ DRAW.uw_civ_base(c,x,y,'#102f52','#a8e8ff','archive'); },
  uw_civ_sonar(c,x,y){ DRAW.uw_civ_base(c,x,y,'#082846','#b8f0ff','sonar'); },
  // -- Ringworld tiles --------------------------------------------
  rw_floor(c,x,y){
    // Pale silver-grey engineered floor with subtle grid lines
    c.fillStyle='#1a1e22'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#22282e'; c.fillRect(x+1,y+1,TS-2,TS-2);
    // Grid lines
    c.fillStyle='#2a3038';
    c.fillRect(x,y+TS/2-1,TS,1);
    c.fillRect(x+TS/2-1,y,1,TS);
    // Corner rivets
    c.fillStyle='#303840';
    c.fillRect(x+2,y+2,2,2); c.fillRect(x+TS-4,y+2,2,2);
    c.fillRect(x+2,y+TS-4,2,2); c.fillRect(x+TS-4,y+TS-4,2,2);
  },
  rw_wall(c,x,y){
    // Impassable thick metal bulkhead — bright hazard markings
    c.fillStyle='#0c0e11'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#1e262e'; c.fillRect(x+1,y+1,TS-2,TS-2);
    // Bold yellow/black hazard diagonal stripes
    c.save();
    c.beginPath(); c.rect(x+1,y+1,TS-2,TS-2); c.clip();
    const stripeW = 5;
    for(let s=-TS; s<TS*2; s+=stripeW*2){
      c.fillStyle='#554400';
      c.beginPath();
      c.moveTo(x+s,      y+1);
      c.lineTo(x+s+stripeW, y+1);
      c.lineTo(x+s+stripeW+(TS-2), y+TS-1);
      c.lineTo(x+s+(TS-2), y+TS-1);
      c.closePath();
      c.fill();
    }
    c.restore();
    // Bright edge highlight — top/left raised plate edge
    c.fillStyle='#3a4a58';
    c.fillRect(x+1,y+1,TS-2,2);
    c.fillRect(x+1,y+1,2,TS-2);
    // Dark shadow — bottom/right
    c.fillStyle='#060810';
    c.fillRect(x+1,y+TS-3,TS-2,2);
    c.fillRect(x+TS-3,y+1,2,TS-2);
    // Centre bolt
    c.fillStyle='#2a3540';
    c.fillRect(x+TS/2-2,y+TS/2-2,4,4);
    c.fillStyle='#4a6070';
    c.fillRect(x+TS/2-1,y+TS/2-1,2,2);
  },
  ancient_locked_door(c,x,y){
    // Ancient sealed blast door — teal-lit alien tech, locked with SCI
    c.fillStyle='#080d18'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#0e1828'; c.fillRect(x+2,y+2,TS-4,TS-4);
    // Door frame — geometric ancient patterning
    c.fillStyle='#162840'; c.fillRect(x+3,y+3,TS-6,TS-6);
    c.fillStyle='#0c1a30'; c.fillRect(x+5,y+5,TS-10,TS-10);
    // Decorative circuit-like lines on door
    c.fillStyle='#1a3a54';
    c.fillRect(x+5,y+5,TS-10,2);
    c.fillRect(x+5,y+TS-7,TS-10,2);
    c.fillRect(x+5,y+5,2,TS-10);
    c.fillRect(x+TS-7,y+5,2,TS-10);
    // Lock indicator — teal glow (science lock)
    const tp=Date.now()/1000;
    const glow=0.5+0.5*Math.sin(tp*2.1);
    c.fillStyle=`rgba(0,200,210,${0.3+glow*0.5})`; c.fillRect(x+TS/2-4,y+TS/2-4,8,8);
    c.fillStyle='#00ccdd'; c.fillRect(x+TS/2-2,y+TS/2-2,4,4);
    // Label
    c.fillStyle='#1888aa'; c.font='5px monospace';
    c.textAlign='center'; c.fillText('SCI',x+TS/2,y+TS-3); c.textAlign='left';
  },
  ancient_statue(c,x,y){
    // Greek-style stone statue — marble column figure
    const s=TS;
    drawSprite('earth_floor', x, y, '#0a1a08');
    // Pedestal base
    c.fillStyle='#b0a088'; c.fillRect(x+4,y+s-6,s-8,5);
    c.fillStyle='#c8b898'; c.fillRect(x+5,y+s-7,s-10,2);
    // Figure body (toga)
    c.fillStyle='#d4c8a8'; c.fillRect(x+8,y+8,s-16,s-14);
    c.fillStyle='#c0b090'; c.fillRect(x+9,y+9,s-18,s-16);
    // Toga folds — darker vertical lines
    c.fillStyle='#a09070';
    c.fillRect(x+10,y+10,1,s-20);
    c.fillRect(x+13,y+10,1,s-20);
    c.fillRect(x+s-11,y+10,1,s-20);
    // Head
    c.fillStyle='#ddd0b0'; c.fillRect(x+9,y+4,s-18,6);
    // Outline highlight
    c.fillStyle='#e8ddc0'; c.fillRect(x+9,y+4,1,s-10);
    c.fillStyle='#887860'; c.fillRect(x+s-10,y+4,1,s-10);
  },
  rw_locked_door(c,x,y){
    // Red-lit sealed maintenance door
    c.fillStyle='#0e0a0a'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#1a1010'; c.fillRect(x+2,y+2,TS-4,TS-4);
    // Door frame
    c.fillStyle='#2a1515'; c.fillRect(x+3,y+3,TS-6,TS-6);
    c.fillStyle='#1a0c0c'; c.fillRect(x+5,y+5,TS-10,TS-10);
    // Warning stripes
    c.fillStyle='#3a1a00';
    c.fillRect(x+5,y+5,TS-10,3);
    c.fillRect(x+5,y+TS-8,TS-10,3);
    // Lock indicator — red
    c.fillStyle='#cc2200'; c.fillRect(x+TS/2-2,y+TS/2-2,4,4);
    c.fillStyle='rgba(200,30,0,0.5)'; c.fillRect(x+TS/2-4,y+TS/2-4,8,8);
    // Label
    c.fillStyle='#882200'; c.font='6px monospace';
    c.textAlign='center'; c.fillText('LOCK',x+TS/2,y+TS-4); c.textAlign='left';
  },
  rw_open_door(c,x,y){
    // Open doorway — draw floor with open frame
    c.fillStyle='#1a1e22'; c.fillRect(x,y,TS,TS);
    c.fillStyle='#22282e'; c.fillRect(x+1,y+1,TS-2,TS-2);
    c.fillStyle='#2a3038'; c.fillRect(x,y+TS/2-1,TS,1);
    // Recessed door tracks on sides
    c.fillStyle='#0e1216';
    c.fillRect(x,y,3,TS); c.fillRect(x+TS-3,y,3,TS);
    // Open indicator — green
    c.fillStyle='#00aa44'; c.fillRect(x+TS/2-2,y+2,4,4);
  },
  rw_debris(c,x,y){
    // Twisted metal fragment — dark, jagged, scarred
    c.fillStyle='#0a0b0d'; c.fillRect(x,y,TS,TS);
    // Base plate — uneven dark metal
    c.fillStyle='#111418'; c.fillRect(x+1,y+2,TS-3,TS-4);
    c.fillStyle='#0d1014'; c.fillRect(x+2,y+3,TS-5,TS-6);
    // Scorch marks
    c.fillStyle='#0a0a0a';
    c.fillRect(x+3,y+4,4,3); c.fillRect(x+TS-7,y+TS-7,5,3);
    c.fillRect(x+2,y+TS-5,3,2); c.fillRect(x+TS-5,y+3,2,4);
    // Exposed metal seams / cracks
    c.fillStyle='#1c2028';
    c.fillRect(x+4,y+7,TS-8,1);
    c.fillRect(x+7,y+4,1,TS-8);
    // Torn edge highlights
    c.fillStyle='#252a32';
    c.fillRect(x+1,y+2,TS-2,1);
    c.fillRect(x+1,y+2,1,TS-4);
    // Rust/oxidation spots
    c.fillStyle='#1a1208';
    c.fillRect(x+5,y+5,2,2); c.fillRect(x+TS-7,y+8,2,3);
    c.fillRect(x+3,y+TS-6,3,2);
  },
  rw_console(c,x,y){
    // Alien crystalline interface — no screens, just glowing geometric nodes
    c.fillStyle='#08060e'; c.fillRect(x,y,TS,TS);
    // Hexagonal base plate
    c.fillStyle='#100820'; c.fillRect(x+2,y+4,TS-4,TS-6);
    c.fillStyle='#1a0e32'; c.fillRect(x+3,y+5,TS-6,TS-8);
    // Central crystal pillar
    c.fillStyle='#220a44';
    c.fillRect(x+9,y+6,6,TS-10);
    c.fillStyle='#3a1266';
    c.fillRect(x+10,y+7,4,TS-12);
    // Crystal tip glow
    c.fillStyle='#cc44ff';
    c.fillRect(x+11,y+6,2,2);
    c.fillStyle='rgba(180,60,255,0.4)';
    c.fillRect(x+9,y+5,6,4);
    // Side nodes — small glowing crystals
    c.fillStyle='#6622aa'; c.fillRect(x+4,y+10,3,3);
    c.fillStyle='#8833cc'; c.fillRect(x+5,y+11,2,2);
    c.fillStyle='#6622aa'; c.fillRect(x+TS-7,y+10,3,3);
    c.fillStyle='#8833cc'; c.fillRect(x+TS-6,y+11,2,2);
    // Bottom rune-like markings
    c.fillStyle='#441166';
    c.fillRect(x+4,y+TS-6,3,1); c.fillRect(x+9,y+TS-6,6,1); c.fillRect(x+TS-7,y+TS-6,3,1);
    c.fillRect(x+4,y+TS-4,2,1); c.fillRect(x+10,y+TS-4,4,1); c.fillRect(x+TS-6,y+TS-4,2,1);
    // Ambient glow pulse (static approximation — teal/violet)
    c.fillStyle='rgba(140,40,220,0.12)'; c.fillRect(x,y,TS,TS);
  },
  // -- Nuclear War Planet tiles ----------------------------------
  nuke_dirt(c,x,y){
    // Seamless ashen dirt — no hard edges, position-seeded variation
    const tx=x/TS|0, ty=y/TS|0;
    const h=((tx*7+ty*13)%5);
    const base=['#2a2418','#2e2720','#27221a','#312a1e','#292318'];
    c.fillStyle=base[h]; c.fillRect(x,y,TS,TS);
    // Soft noise blobs — no right-angle edges
    const s1=Math.sin(tx*1.3+ty*2.1)*0.5+0.5;
    const s2=Math.cos(tx*2.7-ty*1.5)*0.5+0.5;
    c.fillStyle='rgba(20,16,10,0.25)';
    c.beginPath(); c.arc(x+s1*14+3,y+s2*12+3,4+s1*3,0,Math.PI*2); c.fill();
    // Ash smear — elongated soft blob
    if(h<2){
      c.fillStyle='rgba(55,48,35,0.3)';
      c.beginPath(); c.ellipse(x+s2*10+5,y+s1*8+6,5,2,s1*Math.PI,0,Math.PI*2); c.fill();
    }
    // Tiny pebble flecks
    c.fillStyle='rgba(38,32,24,0.5)';
    const px2=(tx*17+ty*11)%TS, py2=(tx*5+ty*19)%TS;
    c.beginPath(); c.arc(x+px2,y+py2,1,0,Math.PI*2); c.fill();
  },
  nuke_rock(c,x,y){
    // Rubble — concrete chunks, circular not blocky, sits on dirt bg
    const tx=x/TS|0, ty=y/TS|0;
    const h=((tx*11+ty*7)%4);
    // Draw dirt base first so edges blend
    c.fillStyle='#27221a'; c.fillRect(x,y,TS,TS);
    c.fillStyle='rgba(20,16,10,0.3)';
    c.beginPath(); c.arc(x+8,y+9,6,0,Math.PI*2); c.fill();
    // Rubble chunks — rounded irregular blobs, not rectangles
    const chunkCols=['#34302a','#2e2c26','#3c3830','#302e28'];
    const col=chunkCols[h];
    c.fillStyle=col;
    c.beginPath(); c.ellipse(x+10,y+11,7,5,(h*0.4),0,Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(x+16,y+8,4,3,(h*0.6+1),0,Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(x+6,y+15,3,4,(h*0.3+0.5),0,Math.PI*2); c.fill();
    // Highlight top face
    c.fillStyle='rgba(70,65,52,0.6)';
    c.beginPath(); c.ellipse(x+10,y+9,5,3,(h*0.4),0,Math.PI*2); c.fill();
    // Shadow gap between chunks
    c.fillStyle='rgba(0,0,0,0.4)';
    c.beginPath(); c.arc(x+13,y+13,2,0,Math.PI*2); c.fill();
  },
  nuke_crater(c,x,y){
    // Circular blast crater drawn on top of dirt background
    const tx=x/TS|0, ty=y/TS|0;
    // Dirt base — same as nuke_dirt for seamless edge blending
    const h=((tx*7+ty*13)%5);
    const base=['#2a2418','#2e2720','#27221a','#312a1e','#292318'];
    c.fillStyle=base[h]; c.fillRect(x,y,TS,TS);
    // Scorched outer ring — soft alpha circle
    c.fillStyle='rgba(18,14,8,0.55)';
    c.beginPath(); c.arc(x+TS/2,y+TS/2,TS/2-1,0,Math.PI*2); c.fill();
    // Mid ring — darker
    c.fillStyle='rgba(12,10,6,0.6)';
    c.beginPath(); c.arc(x+TS/2,y+TS/2,TS/2-4,0,Math.PI*2); c.fill();
    // Crater floor — darkest centre
    c.fillStyle='rgba(8,6,3,0.7)';
    c.beginPath(); c.arc(x+TS/2,y+TS/2,TS/2-7,0,Math.PI*2); c.fill();
    // Deep centre
    c.fillStyle='rgba(4,3,1,0.8)';
    c.beginPath(); c.arc(x+TS/2,y+TS/2,TS/2-10,0,Math.PI*2); c.fill();
    // Rim highlight — one bright arc to suggest raised lip
    c.strokeStyle='rgba(52,44,30,0.5)';
    c.lineWidth=2;
    c.beginPath(); c.arc(x+TS/2-1,y+TS/2-1,TS/2-3,Math.PI*1.1,Math.PI*1.9); c.stroke();
    // Debris scatter around rim — small arcs, not rects
    c.fillStyle='rgba(48,40,28,0.7)';
    const ang0=(tx*0.9+ty*1.3);
    for(let i=0;i<5;i++){
      const a=ang0+i*1.26;
      const r=TS/2-2;
      c.beginPath(); c.arc(x+TS/2+Math.cos(a)*r,y+TS/2+Math.sin(a)*r,1.5,0,Math.PI*2); c.fill();
    }
  },
  nuke_ruin(c,x,y){
    // Standing wall with punched-out window — clearly a building fragment
    const tx=x/TS|0, ty=y/TS|0;
    const h=((tx*5+ty*11)%3);
    const wallCols=['#3e3830','#454038','#383228'];
    // Dirt base
    c.fillStyle='#27221a'; c.fillRect(x,y,TS,TS);
    // Full-height wall slab — fills most of tile
    c.fillStyle=wallCols[h];
    c.fillRect(x+2,y+1,TS-4,TS-3);
    // Hollow window — the key architectural read
    c.fillStyle='#10100c';
    c.fillRect(x+6,y+4,10,9);
    // Window frame — slightly lighter border inside the hole
    c.fillStyle='rgba(80,72,54,0.7)';
    c.fillRect(x+6,y+4,10,1);   // top frame
    c.fillRect(x+6,y+12,10,1);  // bottom frame
    c.fillRect(x+6,y+4,1,9);    // left frame
    c.fillRect(x+15,y+4,1,9);   // right frame
    // Crumbled top — bite out with dirt-coloured circles
    c.fillStyle='#27221a';
    c.beginPath(); c.arc(x+4, y+1,3,0,Math.PI*2); c.fill();
    c.beginPath(); c.arc(x+TS-4,y+2,2.5,0,Math.PI*2); c.fill();
    c.beginPath(); c.arc(x+13,y+1,2,0,Math.PI*2); c.fill();
    // Rubble at base — small mound
    c.fillStyle='rgba(50,44,32,0.9)';
    c.beginPath(); c.ellipse(x+TS/2,y+TS-3,7,3,0,0,Math.PI*2); c.fill();
    // Soot burn above window
    c.fillStyle='rgba(0,0,0,0.4)';
    c.beginPath(); c.ellipse(x+11,y+4,3,4,0,0,Math.PI*2); c.fill();
    // Highlight top edge
    c.fillStyle='rgba(90,80,60,0.5)';
    c.fillRect(x+2,y+1,TS-4,1);
  },
  nuke_ruin2(c,x,y){
    // Corner section — two walls meeting at right angle, L-shape
    const tx=x/TS|0, ty=y/TS|0;
    const h=((tx*9+ty*5)%3);
    const wallCols=['#3c3830','#42403a','#363230'];
    c.fillStyle='#27221a'; c.fillRect(x,y,TS,TS);
    // Left vertical wall
    c.fillStyle=wallCols[h];
    c.fillRect(x+1,y+1,7,TS-3);
    // Top horizontal wall connecting to right
    c.fillRect(x+1,y+1,TS-4,7);
    // Interior — open (destroyed interior floor)
    c.fillStyle='#1e1a14';
    c.fillRect(x+8,y+8,TS-11,TS-10);
    // Mortar lines on left wall
    c.fillStyle='rgba(20,16,10,0.6)';
    c.fillRect(x+1,y+6,7,1);
    c.fillRect(x+1,y+12,7,1);
    // Mortar lines on top wall
    c.fillRect(x+5,y+1,1,7);
    c.fillRect(x+12,y+1,1,7);
    // Corner joint — slightly lighter
    c.fillStyle='rgba(80,72,52,0.5)';
    c.fillRect(x+1,y+1,7,1);
    c.fillRect(x+1,y+1,1,7);
    // Crumbled far end of top wall
    c.fillStyle='#27221a';
    c.beginPath(); c.arc(x+TS-3,y+4,3,0,Math.PI*2); c.fill();
    c.beginPath(); c.arc(x+TS-5,y+1,2,0,Math.PI*2); c.fill();
    // Rubble inside corner
    c.fillStyle='rgba(52,46,34,0.8)';
    c.beginPath(); c.ellipse(x+12,y+12,3,2,0.5,0,Math.PI*2); c.fill();
    c.beginPath(); c.ellipse(x+15,y+TS-5,2,1.5,0,0,Math.PI*2); c.fill();
    // Soot on inner wall face
    c.fillStyle='rgba(0,0,0,0.3)';
    c.beginPath(); c.ellipse(x+4,y+12,2,5,0,0,Math.PI*2); c.fill();
  },
  nuke_water(c,x,y){
    // Static contaminated water — no animation, position-seeded only
    const tx=x/TS|0, ty=y/TS|0;
    c.fillStyle='#0e1c2e'; c.fillRect(x,y,TS,TS);
    const s1=Math.sin(tx*1.7+ty*2.3)*0.5+0.5;
    const s2=Math.cos(tx*2.1-ty*1.9)*0.5+0.5;
    // Blue shimmer blobs — static
    c.fillStyle='rgba(22,52,80,0.5)';
    c.beginPath(); c.ellipse(x+s1*12+3,y+s2*10+4,6,2,s1*Math.PI,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(18,42,66,0.4)';
    c.beginPath(); c.ellipse(x+s2*8+7,y+s1*10+7,5,2,s2*Math.PI,0,Math.PI*2); c.fill();
    // Yellow-green contamination streaks — static
    c.fillStyle='rgba(70,95,15,0.30)';
    c.beginPath(); c.ellipse(x+s2*10+2,y+s1*6+4,4,2,s1*2,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(90,105,10,0.20)';
    c.beginPath(); c.ellipse(x+s1*6+9,y+s2*8+8,3,1.5,s2,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(150,140,45,0.18)';
    c.beginPath(); c.arc(x+s1*14+2,y+s2*14+2,2,0,Math.PI*2); c.fill();
  },
  nuke_dead_tree(c,x,y){
    const tx=x/TS|0, ty=y/TS|0;
    const h=((tx*7+ty*13)%5);
    const base=['#2a2418','#2e2720','#27221a','#312a1e','#292318'];
    c.fillStyle=base[h]; c.fillRect(x,y,TS,TS);
    const s1=Math.sin(tx*1.3+ty*2.1)*0.5+0.5;
    c.fillStyle='rgba(20,16,10,0.25)';
    c.beginPath(); c.arc(x+s1*14+3,y+s1*12+3,4+s1*3,0,Math.PI*2); c.fill();
    // Charcoal trunk
    c.fillStyle='#0e0c08';
    c.fillRect(x+9,y+7,4,TS-8);
    c.fillStyle='#141210';
    c.fillRect(x+10,y+7,2,TS-8);
    // Branches — use lines for organic feel
    c.strokeStyle='#0e0c08'; c.lineWidth=2; c.lineCap='round';
    c.beginPath(); c.moveTo(x+11,y+9); c.lineTo(x+4,y+7); c.stroke();
    c.beginPath(); c.moveTo(x+11,y+11); c.lineTo(x+TS-4,y+9); c.stroke();
    c.beginPath(); c.moveTo(x+11,y+7); c.lineTo(x+6,y+4); c.stroke();
    c.beginPath(); c.moveTo(x+11,y+7); c.lineTo(x+TS-5,y+5); c.stroke();
    // Twigs
    c.lineWidth=1;
    c.beginPath(); c.moveTo(x+4,y+7); c.lineTo(x+2,y+5); c.stroke();
    c.beginPath(); c.moveTo(x+4,y+7); c.lineTo(x+3,y+9); c.stroke();
    c.beginPath(); c.moveTo(x+TS-4,y+9); c.lineTo(x+TS-2,y+7); c.stroke();
    // Ash at base
    c.fillStyle='rgba(30,26,18,0.5)';
    c.beginPath(); c.ellipse(x+TS/2,y+TS-4,5,2,0,0,Math.PI*2); c.fill();
  },

  // -- Planet surface tile draw functions -------------------------

  earth_forest(c,x,y){
    // Leafy tree — green canopy over dark trunk
    const v=(x*23+y*19)%3;
    const crowns=['#1a5c1a','#1e6420','#166018'];
    const lights=['#2a8c2a','#329432','#288830'];
    // Trunk
    c.fillStyle='#3a2a18'; c.fillRect(x+10,y+14,4,8);
    c.fillStyle='#4a3820'; c.fillRect(x+11,y+15,2,6);
    // Canopy layers
    c.fillStyle=crowns[v]; c.beginPath(); c.ellipse(x+12,y+14,9,7,0,0,Math.PI*2); c.fill();
    c.fillStyle=crowns[v]; c.beginPath(); c.ellipse(x+9, y+12,6,5,0,0,Math.PI*2); c.fill();
    c.fillStyle=crowns[v]; c.beginPath(); c.ellipse(x+15,y+11,5,5,0,0,Math.PI*2); c.fill();
    c.fillStyle=lights[v]; c.beginPath(); c.ellipse(x+12,y+10,5,4,0,0,Math.PI*2); c.fill();
    c.fillStyle='rgba(0,0,0,0.25)'; c.beginPath(); c.ellipse(x+13,y+20,6,2,0,0,Math.PI*2); c.fill();
  },
};
// sprite: key into IMG{} — null means use drawFn or solid colour
// drawFn: optional procedural fallback
