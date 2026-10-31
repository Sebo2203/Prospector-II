// ─────────────────────────────────────────────────────────────────
//  SOUND ENGINE  (Web Audio API — no files, fully offline)
//
//  Short synthesized cues for ship actions, hazards, and crew damage.
//
//  AudioContext is created on first user interaction to comply with
//  browser autoplay policy — it will silently skip until then.
// ─────────────────────────────────────────────────────────────────
const SFX = (() => {
  let ac = null;

  function ctx() {
    if (!ac) ac = new (window.AudioContext || window.webkitAudioContext)();
    return ac;
  }

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

    // Landing: high-freq engine whine descending to a low thud
    land() {
      try {
        const c  = ctx();
        const t  = c.currentTime;
        // Engine whine descending
        oscRamp('sawtooth', 420, 60, 0.18, t,      0.7);
        // Low impact thud
        oscRamp('sine',     120, 30, 0.35, t + 0.6, 0.5);
        // Short rumble burst (noise-like via detuned saws)
        oscRamp('sawtooth',  80, 40, 0.12, t + 0.65, 0.4);
        oscRamp('sawtooth',  85, 38, 0.10, t + 0.65, 0.4);
      } catch(e) {}
    },

    // Liftoff: low rumble building to rising engine roar
    liftoff() {
      try {
        const c = ctx();
        const t = c.currentTime;
        // Initial ignition thump
        oscRamp('sine',     50, 90,  0.30, t,        0.25);
        // Engine building
        oscRamp('sawtooth', 80, 340, 0.20, t + 0.15, 0.8);
        oscRamp('sawtooth', 78, 350, 0.15, t + 0.15, 0.8);
        // High whine fading out as ship recedes
        oscRamp('square',  340, 600, 0.08, t + 0.7,  0.4);
      } catch(e) {}
    },

    // Docking: two-tone chime — friendly, station-like
    dock() {
      try {
        const c = ctx();
        const t = c.currentTime;
        osc('sine', 523, 0.22, 0,    t,        0.4);   // C5
        osc('sine', 784, 0.18, 0,    t + 0.22, 0.5);   // G5
        osc('sine', 261, 0.12, 0,    t + 0.5,  0.6);   // C4
      } catch(e) {}
    },

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

    // Warning alarm: two rising beeps — oxygen or fuel at 50%
    alarmWarn() {
      try {
        const c = ctx();
        const t = c.currentTime;
        // Two short ascending beeps
        osc('square', 440, 0.18, 0, t,        0.12);
        osc('square', 554, 0.18, 0, t + 0.18, 0.12);
      } catch(e) {}
    },

    // Critical alarm: rapid triple beep — oxygen or fuel at 25%
    alarmCrit() {
      try {
        const c = ctx();
        const t = c.currentTime;
        // Three urgent high beeps
        osc('square', 880, 0.22, 0, t,        0.10);
        osc('square', 880, 0.22, 0, t + 0.15, 0.10);
        osc('square', 880, 0.22, 0, t + 0.30, 0.10);
        // Low drone underneath
        osc('sawtooth', 110, 0.08, 0, t, 0.45);
      } catch(e) {}
    },

    // Hull hit: deep metallic clang — ship takes damage
    hullHit() {
      try {
        const c = ctx();
        const t = c.currentTime;
        // Metal impact — low thud + high ring
        oscRamp('sawtooth', 180, 40,  0.30, t,        0.3);
        oscRamp('sine',     900, 200, 0.12, t,        0.4);
        oscRamp('sine',     400, 100, 0.08, t + 0.05, 0.3);
      } catch(e) {}
    },

    // Crew hit: synthesised grunt — short voiced "oof"
    // Approximates the Minecraft hurt sound: voiced descending
    // pitch burst with breath noise, fast attack, fast decay.
    crewHit() {
      try {
        const c = ctx();
        const t = c.currentTime;

        // Noise burst (breath/impact component) via high-freq oscillator
        const noise = c.createOscillator();
        const nGain = c.createGain();
        const nFilter = c.createBiquadFilter();
        noise.type = 'sawtooth';
        noise.frequency.setValueAtTime(180, t);
        noise.frequency.linearRampToValueAtTime(60, t + 0.12);
        nFilter.type = 'bandpass';
        nFilter.frequency.value = 800;
        nFilter.Q.value = 0.8;
        nGain.gain.setValueAtTime(0.25, t);
        nGain.gain.linearRampToValueAtTime(0, t + 0.14);
        noise.connect(nFilter);
        nFilter.connect(nGain);
        nGain.connect(c.destination);
        noise.start(t); noise.stop(t + 0.15);

        // Voiced component — descending "uh" vowel shape
        const voiced = c.createOscillator();
        const vGain  = c.createGain();
        const vFilter = c.createBiquadFilter();
        voiced.type = 'sawtooth';
        voiced.frequency.setValueAtTime(220, t);
        voiced.frequency.linearRampToValueAtTime(130, t + 0.10);
        vFilter.type = 'lowpass';
        vFilter.frequency.setValueAtTime(1200, t);
        vFilter.frequency.linearRampToValueAtTime(400, t + 0.10);
        vGain.gain.setValueAtTime(0.20, t);
        vGain.gain.linearRampToValueAtTime(0, t + 0.13);
        voiced.connect(vFilter);
        vFilter.connect(vGain);
        vGain.connect(c.destination);
        voiced.start(t); voiced.stop(t + 0.15);

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

