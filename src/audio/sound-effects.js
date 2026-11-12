// Offline sampled effects. Audio state stays outside the career and never uses rule RNG.
const SFX = (() => {
  let ac=null,output=null;
  const buffers=new Map(),decodes=new Map(),pending=new Map(),voices=[];
  const weapons={mass_driver:'massDriver',railgun:'railgun',laser_cannon:'laserCannon',pulse_laser:'pulseLaser',artemis:'artemisLaunch'};
  function ctx(){
    if(!ac){
      ac=new (window.AudioContext||window.webkitAudioContext)();output=ac.createDynamicsCompressor();
      output.threshold.value=-3;output.knee.value=0;output.ratio.value=20;output.attack.value=0.002;output.release.value=0.1;
      output.connect(ac.destination);
    }
    return ac;
  }
  function matches(event){
    if(!event || G!==event.career || !G)return false;
    if(event.scope==='pain')return G.mode==='planet'&&G.curPlanet===event.planet;
    if(event.scope==='surface')return (G.mode==='planet'||(G.mode==='inventory'&&G._prevMode==='planet'))&&G.curPlanet===event.planet;
    if(event.scope==='combat')return ['shipcombat','galaxy'].includes(G.mode)&&(!G.shipCombat||G.shipCombat===event.combat);
    return G.mode===event.mode && (event.mode!=='planet'||G.curPlanet===event.planet);
  }
  function stop(voice){try{voice.node.stop();}catch(e){}const index=voices.indexOf(voice);if(index>=0)voices.splice(index,1);}
  function syncContext(){
    for(const [key,event] of pending)if(!matches(event))pending.delete(key);
    for(const voice of [...voices])if(!matches(voice))stop(voice);
  }
  function load(key){
    if(buffers.has(key))return Promise.resolve(buffers.get(key));
    if(!decodes.has(key)){
      try{
        const bytes=Uint8Array.from(atob(AUDIO_SAMPLES[key].split(',')[1]),char=>char.charCodeAt(0));
        decodes.set(key,ctx().decodeAudioData(bytes.buffer).then(buffer=>{buffers.set(key,buffer);return buffer;}).catch(()=>null));
      }catch(e){decodes.set(key,Promise.resolve(null));}
    }
    return decodes.get(key);
  }
  function prepare(){try{const c=ctx();if(c.state==='suspended')void c.resume().catch(()=>{});for(const key of Object.keys(AUDIO_SAMPLES))void load(key);}catch(e){}}
  function start(event,buffer){
    if(pending.get(event.key)!==event)return;
    pending.delete(event.key);
    if(!buffer||!matches(event)||performance.now()-event.born>1500)return;
    const same=voices.filter(voice=>voice.group===event.group);
    const limit=event.group==='pain'||event.group==='alarm'||event.group==='travel'?1:3;
    while(same.length>=limit)stop(same.shift());
    while(voices.length>=8)stop(voices[0]);
    const c=ctx(),node=c.createBufferSource(),gain=c.createGain();
    node.buffer=buffer;gain.gain.value=event.key==='alarmWarn'?0.35:event.key==='alarmCrit'?0.45:0.65;
    node.connect(gain);gain.connect(output);
    const voice={...event,node};voices.push(voice);
    node.onended=()=>{const index=voices.indexOf(voice);if(index>=0)voices.splice(index,1);node.disconnect();gain.disconnect();};
    node.start();
  }
  function sample(key,scope='location',group='effects',combat=G?.shipCombat){
    if(!G || !AUDIO_SAMPLES[key])return;
    const event={key,scope,group,combat,career:G,mode:G.mode,planet:G.curPlanet,born:performance.now()};
    if(!matches(event))return;
    try{
      const c=ctx();if(c.state==='suspended')void c.resume().catch(()=>{});
      if(['pain','alarm','travel'].includes(group))for(const [id,queued] of pending)if(queued.group===group)pending.delete(id);
      pending.set(key,event);
      if(buffers.has(key))start(event,buffers.get(key));
      else void load(key).then(buffer=>{try{start(event,buffer);}catch(e){}});
    }catch(e){}
  }
  // Prime once per genuine interaction; no autoplay, network, or render-driven decoding.
  for(const type of ['keydown','pointerdown'])window.addEventListener(type,prepare,{once:true,capture:true});
  // Helper: create oscillator + gain, connect to output, auto-stop
  function osc(type, freq, startVol, endVol, startTime, duration, dest) {
    const c  = ctx();
    const o  = c.createOscillator();
    const g  = c.createGain();
    o.type   = type;
    o.frequency.setValueAtTime(freq, startTime);
    g.gain.setValueAtTime(startVol, startTime);
    g.gain.linearRampToValueAtTime(endVol, startTime + duration);
    o.connect(g);
    g.connect(dest || c.destination);
    o.start(startTime);
    o.stop(startTime + duration + 0.01);
  }

  // Helper: frequency ramp on an oscillator
  function oscRamp(type, freqStart, freqEnd, vol, startTime, duration, dest) {
    const c  = ctx();
    const o  = c.createOscillator();
    const g  = c.createGain();
    o.type   = type;
    o.frequency.setValueAtTime(freqStart, startTime);
    o.frequency.linearRampToValueAtTime(freqEnd, startTime + duration);
    g.gain.setValueAtTime(vol, startTime);
    g.gain.linearRampToValueAtTime(0, startTime + duration);
    o.connect(g);
    g.connect(dest || c.destination);
    o.start(startTime);
    o.stop(startTime + duration + 0.01);
  }

  return {
    prepare,syncContext,
    shipFire(id,combat=G?.shipCombat){if(weapons[id])sample(weapons[id],combat?'combat':'location','weapons',combat);},
    groundFire(id){
      if(id==='gun_plasma'||id==='energy pulse')sample('groundLaser','surface','weapons');
      else if(['gun_burst','gun_breacher','Spitter Carbine'].includes(id))sample('groundBurst','surface','weapons');
    },
    shipHit(){sample('hullHit','combat','impact');},
    shieldHit(){sample('shieldHit',G?.shipCombat?'combat':'location','impact');},
    coreHit(){sample('hullHit','combat','impact');},
    hullHit(){sample('hullHit',G?.shipCombat?'combat':'location','impact');},
    shipImpact(hull){sample(hull>0?'hullHit':'shieldHit',G?.shipCombat?'combat':'location','impact');},
    ram(combat=G?.shipCombat){sample('ram','combat','collision',combat);},
    asteroid(combat=G?.shipCombat){sample('asteroid','combat','collision',combat);},
    wraith(combat=G?.shipCombat){sample('wraith','combat','collision',combat);},
    boost(){sample('boost','combat','engine');},
    lightning(){sample('lightning',G?.shipCombat?'combat':'location','weather');},
    scan(){sample('scan','location','scan');},
    door(kind='hatch'){sample(kind==='ancient'?'door':'dock','surface','door');},
    // Original station-entry chime: C5, G5, then C4.
    dock(){
      try{
        const t=ctx().currentTime;
        osc('sine',523,0.22,0,t,0.4);
        osc('sine',784,0.18,0,t+0.22,0.5);
        osc('sine',261,0.12,0,t+0.5,0.6);
      }catch(e){}
    },
    land(){sample('land','location','travel');},
    liftoff(){sample('liftoff','location','travel');},
    wormhole(){sample('wormhole','location','travel');}, // Reserved: no wormhole-travel action exists yet.
    explosion(){sample('explosion',G?.shipCombat?'combat':'surface','explosion');},
    alarmWarn(){sample('alarmWarn','location','alarm');},
    alarmCrit(){sample('alarmCrit','location','alarm');},
    crewHit(){if(G?.mode==='planet')sample('crewPain','pain','pain');},
    // Refueling: valve click, a rising pump, then a full-tank confirmation.
    refuel() {
      try {
        const c = ctx();
        const t = c.currentTime;
        oscRamp('square', 240, 110, 0.08, t, 0.07);
        oscRamp('sawtooth', 75, 180, 0.10, t + 0.07, 0.48);
        oscRamp('sine', 95, 150, 0.14, t + 0.10, 0.48);
        osc('sine', 660, 0.12, 0, t + 0.53, 0.17);
        osc('sine', 880, 0.10, 0, t + 0.66, 0.22);
      } catch(e) {}
    },

    // Hull repair: brief tool taps and welding buzz, resolved by a low chime.
    repair() {
      try {
        const c = ctx();
        const t = c.currentTime;
        oscRamp('square', 540, 190, 0.11, t, 0.08);
        oscRamp('sawtooth', 310, 150, 0.09, t + 0.10, 0.18);
        oscRamp('square', 480, 170, 0.09, t + 0.32, 0.07);
        oscRamp('sawtooth', 290, 130, 0.08, t + 0.41, 0.17);
        osc('sine', 392, 0.13, 0, t + 0.56, 0.30);
      } catch(e) {}
    },

    suffocate() {
      // Laboured, desperate breath — low wet rasp, fading out
      try {
        const c = ctx();
        const t = c.currentTime;

        // Raspy inhale — filtered sawtooth sweeping down
        const rasp = c.createOscillator();
        const rGain = c.createGain();
        const rFilter = c.createBiquadFilter();
        rasp.type = 'sawtooth';
        rasp.frequency.setValueAtTime(140, t);
        rasp.frequency.linearRampToValueAtTime(70, t + 0.35);
        rFilter.type = 'bandpass';
        rFilter.frequency.value = 600;
        rFilter.Q.value = 1.2;
        rGain.gain.setValueAtTime(0, t);
        rGain.gain.linearRampToValueAtTime(0.18, t + 0.05);
        rGain.gain.linearRampToValueAtTime(0.12, t + 0.25);
        rGain.gain.linearRampToValueAtTime(0, t + 0.45);
        rasp.connect(rFilter);
        rFilter.connect(rGain);
        rGain.connect(c.destination);
        rasp.start(t); rasp.stop(t + 0.5);

        // Low gurgle — sine wave barely audible underneath
        const gurgle = c.createOscillator();
        const gGain  = c.createGain();
        gurgle.type = 'sine';
        gurgle.frequency.setValueAtTime(90, t);
        gurgle.frequency.linearRampToValueAtTime(55, t + 0.5);
        gGain.gain.setValueAtTime(0.08, t);
        gGain.gain.linearRampToValueAtTime(0, t + 0.5);
        gurgle.connect(gGain);
        gGain.connect(c.destination);
        gurgle.start(t); gurgle.stop(t + 0.55);
      } catch(e) {}
    },

  };
})();
