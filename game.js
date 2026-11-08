/* ============================================================
   Duck Duck Shoot
   ============================================================ */
(() => {
  'use strict';

  // ---------- constants ----------
  const W = 1440;
  const H = 900;
  const MAP_W = 1350;
  const MAP_H = 900;
  const MAP_SCALE = MAP_W / 1536; // 0.87890625
  const PANEL_X = 1170;
  const TAU = Math.PI * 2;

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  const stage = document.getElementById('stage');
  const duckGrid = document.getElementById('duckGrid');
  const upgradeBox = document.getElementById('upgradeBox');
  const startBtn = document.getElementById('startBtn');
  const livesNum = document.getElementById('livesNum');
  const crumbsNum = document.getElementById('crumbsNum');
  const hudRoundNum = document.getElementById('hudRoundNum');
  const toast = document.getElementById('toast');
  const resourceBox = document.getElementById('resourceBox');
  const titleScreen = document.getElementById('title-screen');
  const titleCanvas = document.getElementById('titleCanvas');
  const titleCtx = titleCanvas.getContext('2d');
  const startDiffs = document.getElementById('startDiffs');
  const titleSoundBtn = document.getElementById('titleSoundBtn');
  const endScreen = document.getElementById('end-screen');
  const endTitle = document.getElementById('end-title');
  const endSub = document.getElementById('end-sub');
  const againBtn = document.getElementById('againBtn');
  const titleBtn = document.getElementById('titleBtn');
  const speedBtns = Array.from(document.querySelectorAll('.speed-btn'));
  const soundBtn = document.getElementById('soundBtn');
  const hudRoundTotal = document.getElementById('hudRoundTotal');
  const hudMeta = document.getElementById('hudMeta');
  const hudDiffTag = document.getElementById('hudDiffTag');
  const mapScreen = document.getElementById('map-screen');
  const mapGrid = document.getElementById('mapGrid');
  const mapDiffLabel = document.getElementById('mapDiffLabel');
  const startMapBtn = document.getElementById('startMapBtn');
  const mapBackBtn = document.getElementById('mapBackBtn');
  const warningBanner = document.getElementById('warning-banner');

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1);
  const rand = (a, b) => a + Math.random() * (b - a);
  const choice = arr => arr[(Math.random() * arr.length) | 0];
  const shuffle = arr => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const ASSETS = {
    map: 'assets/map.png',
    bathtub: 'assets/maps/map-bathtub.png',
    plaza: 'assets/maps/map-plaza.png',
    frozen: 'assets/maps/map-frozen.png',
    quack: 'assets/duck-quack.png',
    bread: 'assets/duck-bread.png',
    frost: 'assets/duck-frost.png',
    laser: 'assets/duck-laser.png',
    baker: 'assets/duck-baker.png',
    house: 'assets/duck-house.png',
    loaf: 'assets/crumb-loaf.png',
    small: 'assets/goose-small.png',
    goose: 'assets/goose.png',
    honker: 'assets/goose-honker.png',
    ghost: 'assets/goose-ghost.png',
    skater: 'assets/goose-skater.png',
    mother: 'assets/goose-mother.png',
    rainbow: 'assets/goose-rainbow.png',
    boss: 'assets/goose-boss.png',
    galleon: 'assets/goose-galleon.png'
  };

  const DIFFICULTIES = {
    easy: { label: 'Easy', rounds: 40, lives: 150, price: 0.85, speed: 1, threat: 0.85, bossHp: 0.8, extraBalloons: 0, galleons: [] },
    medium: { label: 'Medium', rounds: 80, lives: 100, price: 1, speed: 1, threat: 1, bossHp: 1, extraBalloons: 0, galleons: [80] },
    hard: { label: 'Hard', rounds: 120, lives: 50, price: 1.1, speed: 1, threat: 1.25, bossHp: 1.2, extraBalloons: 0, galleons: [60, 80, 100, 120] },
    xtra: { label: 'XTRA HARD', rounds: 120, lives: 1, price: 1.25, speed: 1.2, threat: 1.45, bossHp: 1.35, extraBalloons: 1, galleons: [60, 80, 100, 120] }
  };
  const BEST_KEY = 'dpd-best-v2';
  const images = {};
  const tintCache = {};

  // ---------- audio ----------
  const Sound = (() => {
    const AC = window.AudioContext || window.webkitAudioContext;
    let ctx = null;
    let master = null;
    let musicBus = null;
    let sfxBus = null;
    let musicDelay = null;
    let noiseBuf = null;
    let muted = false;
    let musicTimer = null;
    let musicPlaying = false;
    let musicStep = 0;
    let musicNext = 0;
    const last = Object.create(null);

    try { muted = localStorage.getItem('dpd-muted') === '1'; } catch (e) { /* storage can be blocked */ }

    const BPM = 112;
    const STEP_DUR = 60 / BPM / 4;
    const midi = n => 440 * Math.pow(2, (n - 69) / 12);

    // C · G · Am · F · C · G · F · G
    const CHORDS = [
      { bass: 48, notes: [60, 64, 67] },
      { bass: 43, notes: [59, 62, 67] },
      { bass: 45, notes: [57, 60, 64] },
      { bass: 41, notes: [57, 60, 65] },
      { bass: 48, notes: [60, 64, 67] },
      { bass: 43, notes: [59, 62, 67] },
      { bass: 41, notes: [57, 60, 65] },
      { bass: 43, notes: [59, 62, 67] }
    ];

    const MELODY = [
      [76, 0, 79, 0, 76, 0, 74, 0, 72, 0, 74, 0, 76, 0, 79, 0],
      [74, 0, 71, 0, 67, 0, 71, 0, 74, 0, 76, 0, 74, 0, 71, 0],
      [72, 0, 76, 0, 69, 0, 72, 0, 76, 0, 79, 0, 76, 0, 72, 0],
      [69, 0, 72, 0, 77, 0, 76, 0, 74, 0, 72, 0, 69, 0, 67, 0],
      [76, 0, 79, 0, 81, 0, 79, 0, 76, 0, 74, 0, 72, 0, 74, 0],
      [74, 0, 79, 0, 83, 0, 81, 0, 79, 0, 74, 0, 71, 0, 74, 0],
      [72, 0, 76, 0, 81, 0, 79, 0, 76, 0, 72, 0, 69, 0, 72, 0],
      [77, 0, 81, 0, 79, 0, 77, 0, 76, 0, 74, 0, 72, 0, 67, 0]
    ];

    function ensure() {
      if (!AC) return null;
      if (!ctx) {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = muted ? 0.0001 : 0.9;
        master.connect(ctx.destination);

        musicBus = ctx.createGain();
        musicBus.gain.value = 0.13;
        musicBus.connect(master);

        musicDelay = ctx.createDelay(0.5);
        musicDelay.delayTime.value = 0.26;
        const feedback = ctx.createGain();
        feedback.gain.value = 0.17;
        const wet = ctx.createGain();
        wet.gain.value = 0.2;
        musicDelay.connect(feedback);
        feedback.connect(musicDelay);
        musicDelay.connect(wet);
        wet.connect(musicBus);

        sfxBus = ctx.createGain();
        sfxBus.gain.value = 0.55;
        sfxBus.connect(master);

        const len = Math.floor(ctx.sampleRate * 1.2);
        noiseBuf = ctx.createBuffer(1, len, ctx.sampleRate);
        const data = noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      }
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }

    function voice(when, freq, dur, opts = {}) {
      if (!ctx || muted) return;
      const t0 = Math.max(ctx.currentTime, when);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = opts.type || 'triangle';
      osc.frequency.setValueAtTime(Math.max(20, freq), t0);
      if (opts.end) osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.end), t0 + dur);
      const vol = opts.vol == null ? 0.08 : opts.vol;
      const attack = Math.min(dur * 0.45, opts.attack == null ? 0.006 : opts.attack);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol), t0 + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      osc.connect(gain);
      gain.connect(opts.bus === 'sfx' ? sfxBus : musicBus);
      if (opts.delay) gain.connect(musicDelay);
      osc.start(t0);
      osc.stop(t0 + dur + 0.03);
    }

    function noiseAt(when, dur, opts = {}) {
      if (!ctx || muted || !noiseBuf) return;
      const t0 = Math.max(ctx.currentTime, when);
      const src = ctx.createBufferSource();
      src.buffer = noiseBuf;
      const filter = ctx.createBiquadFilter();
      filter.type = opts.type || 'highpass';
      filter.frequency.value = opts.freq || 2500;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(opts.vol || 0.04, t0 + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(opts.bus === 'sfx' ? sfxBus : musicBus);
      src.start(t0);
      src.stop(t0 + dur + 0.02);
    }

    function playStep(step, when) {
      const bar = Math.floor(step / 16) % CHORDS.length;
      const s = step % 16;
      const chord = CHORDS[bar];

      if (s === 0 || s === 8) voice(when, 150, 0.16, { type: 'sine', vol: 0.15, end: 44 });
      if (s === 4 || s === 12) noiseAt(when, 0.08, { type: 'highpass', freq: 1800, vol: 0.022 });
      if (s % 2 === 0) noiseAt(when, 0.03, { type: 'highpass', freq: 6500, vol: 0.008 });

      if (s === 0) {
        voice(when, midi(chord.bass), 0.28, { type: 'triangle', vol: 0.1 });
        for (const n of chord.notes) {
          voice(when, midi(n - 12), 0.82, { type: 'sine', vol: 0.012, attack: 0.18 });
        }
      }
      if (s === 6) voice(when, midi(chord.bass + 7), 0.16, { type: 'triangle', vol: 0.055 });
      if (s === 10) voice(when, midi(chord.bass + 12), 0.16, { type: 'triangle', vol: 0.05 });
      if (s === 14) voice(when, midi(chord.bass + 7), 0.14, { type: 'triangle', vol: 0.045 });

      if (s === 2 || s === 6 || s === 10 || s === 14) {
        const n = chord.notes[(s / 2) % 3];
        voice(when, midi(n), 0.14, { type: 'triangle', vol: 0.032, delay: true });
      }

      const m = MELODY[bar][s];
      if (m) {
        voice(when, midi(m), 0.2, { type: 'triangle', vol: 0.06, delay: true });
        voice(when, midi(m + 12), 0.12, { type: 'sine', vol: 0.015 });
      }
    }

    function pump() {
      if (!ctx || !musicPlaying) return;
      while (musicNext < ctx.currentTime + 0.3) {
        playStep(musicStep, musicNext);
        musicNext += STEP_DUR;
        musicStep = (musicStep + 1) % 128;
      }
    }

    function startMusic() {
      if (!ensure() || musicPlaying) return;
      musicPlaying = true;
      musicStep = 0;
      musicNext = ctx.currentTime + 0.06;
      musicTimer = setInterval(pump, 70);
      pump();
    }

    function gate(key, gap) {
      const now = performance.now();
      if (last[key] && now - last[key] < gap) return false;
      last[key] = now;
      return true;
    }

    const ready = () => !!(ctx && !muted);
    const now = () => ctx.currentTime;

    return {
      ensure,
      startMusic,
      isMuted: () => muted,
      toggleMute() {
        muted = !muted;
        try { localStorage.setItem('dpd-muted', muted ? '1' : '0'); } catch (e) { /* ignore */ }
        if (master) master.gain.setTargetAtTime(muted ? 0.0001 : 0.9, ctx.currentTime, 0.015);
        if (!muted) { ensure(); if (ctx) ctx.resume(); }
        return muted;
      },
      pageVisibility(hidden) {
        if (!ctx) return;
        if (hidden) ctx.suspend();
        else if (!muted) ctx.resume();
      },
      pop() {
        if (!ready() || !gate('pop', 26)) return;
        const f = 480 + Math.random() * 340;
        voice(now(), f, 0.06, { type: 'triangle', vol: 0.075, end: f * 0.45, bus: 'sfx' });
        noiseAt(now(), 0.025, { type: 'highpass', freq: 3400, vol: 0.018, bus: 'sfx' });
      },
      quack() {
        if (!ready() || !gate('quack', 105)) return;
        voice(now(), 620, 0.09, { type: 'sawtooth', vol: 0.04, end: 300, bus: 'sfx' });
        voice(now() + 0.05, 900, 0.07, { type: 'triangle', vol: 0.028, end: 410, bus: 'sfx' });
      },
      laser() {
        if (!ready() || !gate('laser', 70)) return;
        voice(now(), 1600, 0.08, { type: 'square', vol: 0.022, end: 380, bus: 'sfx' });
        noiseAt(now(), 0.05, { type: 'highpass', freq: 2200, vol: 0.016, bus: 'sfx' });
      },
      frost() {
        if (!ready() || !gate('frost', 90)) return;
        voice(now(), 880, 0.17, { type: 'sine', vol: 0.045, end: 1550, bus: 'sfx' });
        voice(now() + 0.03, 1400, 0.12, { type: 'triangle', vol: 0.02, end: 1950, bus: 'sfx' });
      },
      throwBread() {
        if (!ready() || !gate('bread', 120)) return;
        voice(now(), 280, 0.1, { type: 'triangle', vol: 0.03, end: 620, bus: 'sfx' });
        noiseAt(now(), 0.09, { type: 'bandpass', freq: 900, vol: 0.025, bus: 'sfx' });
      },
      breadBoom() {
        if (!ready() || !gate('boom', 90)) return;
        voice(now(), 130, 0.2, { type: 'sine', vol: 0.11, end: 52, bus: 'sfx' });
        noiseAt(now(), 0.16, { type: 'lowpass', freq: 780, vol: 0.05, bus: 'sfx' });
      },
      honk(big = false) {
        if (!ready() || !gate('honk', 115)) return;
        const base = big ? 190 : 290;
        voice(now(), base, 0.22, { type: 'sawtooth', vol: 0.05, end: base * 0.72, bus: 'sfx' });
        voice(now() + 0.03, base * 1.45, 0.18, { type: 'square', vol: 0.018, end: base, bus: 'sfx' });
      },
      leak() {
        if (!ready()) return;
        voice(now(), 230, 0.48, { type: 'sawtooth', vol: 0.08, end: 78, bus: 'sfx' });
        voice(now() + 0.05, 165, 0.4, { type: 'triangle', vol: 0.055, end: 58, bus: 'sfx' });
      },
      place() {
        if (!ready() || !gate('place', 70)) return;
        voice(now(), 380, 0.09, { type: 'triangle', vol: 0.06, end: 580, bus: 'sfx' });
        noiseAt(now(), 0.06, { type: 'highpass', freq: 1200, vol: 0.025, bus: 'sfx' });
      },
      upgrade() {
        if (!ready() || !gate('buy', 80)) return;
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          voice(now() + i * 0.055, f, 0.1, { type: 'triangle', vol: 0.045, bus: 'sfx' });
        });
      },
      sell() {
        if (!ready() || !gate('sell', 80)) return;
        [880, 1174.7].forEach((f, i) => {
          voice(now() + i * 0.06, f, 0.08, { type: 'triangle', vol: 0.04, bus: 'sfx' });
        });
      },
      collect() {
        if (!ready() || !gate('crumb', 55)) return;
        [740, 988].forEach((f, i) => {
          voice(now() + i * 0.045, f, 0.075, { type: 'sine', vol: 0.035, bus: 'sfx' });
        });
      },
      warning() {
        if (!ready()) return;
        [220, 330].forEach((f, i) => {
          voice(now() + i * 0.18, f, 0.22, { type: 'square', vol: 0.03, bus: 'sfx' });
        });
      },
      click() {
        if (!ready() || !gate('click', 45)) return;
        voice(now(), 660, 0.035, { type: 'triangle', vol: 0.018, bus: 'sfx' });
      },
      roundStart() {
        if (!ready()) return;
        [392, 523.25, 659.25].forEach((f, i) => {
          voice(now() + i * 0.09, f, 0.15, { type: 'triangle', vol: 0.05, bus: 'sfx' });
        });
      },
      roundClear() {
        if (!ready()) return;
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          voice(now() + i * 0.1, f, 0.18, { type: 'triangle', vol: 0.055, bus: 'sfx' });
        });
      },
      victory() {
        if (!ready()) return;
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
          voice(now() + i * 0.14, f, 0.3, { type: 'triangle', vol: 0.06, bus: 'sfx' });
        });
        voice(now(), 130.8, 0.65, { type: 'sine', vol: 0.07, end: 98, bus: 'sfx' });
      },
      defeat() {
        if (!ready()) return;
        [392, 329.6, 261.6, 196].forEach((f, i) => {
          voice(now() + i * 0.19, f, 0.26, { type: 'sawtooth', vol: 0.035, bus: 'sfx' });
        });
        voice(now(), 98, 0.9, { type: 'sine', vol: 0.06, end: 49, bus: 'sfx' });
      }
    };
  })();

  // ---------- ducks ----------
  const DUCKS = {
    quack: {
      name: 'Quack', full: 'Quack Blaster', cost: 200, range: 120, cd: 0.55, sprite: 'quack',
      blurb: 'Sonic wave · pierces up to 3 geese in a line, fast', specials: [],
      paths: [
        { name: 'Louder', icon: 'assets/skills/quack-louder.png', desc: 'Each tier pierces 1 more goose.' },
        { name: 'Rapid Quacks', icon: 'assets/skills/quack-rapid-quacks.png', desc: 'Fires 13% faster per tier.' },
        { name: 'Echo', icon: 'assets/skills/quack-echo.png', desc: 'Each tier bounces to 1 more goose.' }
      ]
    },
    bread: {
      name: 'Bread', full: 'Bread Bomber', cost: 450, range: 150, cd: 1.25, sprite: 'bread',
      blurb: 'Lobbed baguette · splash pops 1 balloon each, foil too', specials: ['Splash', 'Pops foil'],
      paths: [
        { name: 'Bigger Loaves', icon: 'assets/skills/bread-bigger-loaves.png', desc: 'Splash radius +8 per tier.' },
        { name: 'Sourdough Volley', icon: 'assets/skills/bread-sourdough-volley.png', desc: 'Fires 12% faster per tier.' },
        { name: 'Foil Cutter', icon: 'assets/skills/bread-foil-cutter.png', desc: '+1 pop per tier on foil Honkers.' }
      ]
    },
    frost: {
      name: 'Frost', full: 'Frost Duck', cost: 300, range: 110, cd: 1.2, sprite: 'frost',
      blurb: 'Frost puff · reveals Ghosts, slows geese, pops 1', specials: ['Slows', 'Sees ghosts'],
      paths: [
        { name: 'Deep Freeze', icon: 'assets/skills/frost-deep-freeze.png', desc: 'Slow lasts +0.5s per tier.' },
        { name: 'Blizzard', icon: 'assets/skills/frost-blizzard.png', desc: 'Range +16 per tier.' },
        { name: 'Icicles', icon: 'assets/skills/frost-icicles.png', desc: 'Pops +1 balloon on the nearest goose.' }
      ]
    },
    laser: {
      name: 'Laser', full: 'Laser Duck', cost: 1500, range: 190, cd: 0.45, sprite: 'laser',
      blurb: 'Long beam · sees Ghosts and pops foil', specials: ['Sees ghosts', 'Pops foil'],
      paths: [
        { name: 'Wider Beam', icon: 'assets/skills/laser-wider-beam.png', desc: 'Thicker beam, easier to land.' },
        { name: 'Ghost Vision', icon: 'assets/skills/laser-ghost-vision.png', desc: 'Nearby ducks see Ghost Geese.' },
        { name: 'Overcharge', icon: 'assets/skills/laser-overcharge.png', desc: 'Beam pierces +1 goose per tier.' }
      ]
    },
    baker: {
      name: 'Baker', full: 'Baker Duck', cost: 550, range: 0, cd: 0, sprite: 'baker', height: 64,
      blurb: 'Bakes crumb loaves · click them to collect', specials: ['Makes crumbs'], utility: true,
      paths: [
        { name: 'Bigger Oven', icon: 'assets/skills/baker-bigger-oven.png', desc: '+5 crumbs per loaf per tier.' },
        { name: 'Crumb Cart', icon: 'assets/skills/baker-crumb-cart.png', desc: 'Tier 1 auto-collects; +10% per tier after.' },
        { name: 'Bakery Chain', icon: 'assets/skills/baker-bakery-chain.png', desc: 'Bakes 12% faster; tier 5 pays +100 per round.' }
      ]
    },
    house: {
      name: 'House', full: 'Duck House', cost: 800, range: 140, cd: 0, sprite: 'house', height: 74,
      blurb: 'Buffs nearby ducks · +15% speed, +10% range', specials: ['Buffs ducks'], utility: true,
      paths: [
        { name: 'Drills', icon: 'assets/skills/house-drills.png', desc: '+6% aura attack speed per tier.' },
        { name: 'Lookout', icon: 'assets/skills/house-lookout.png', desc: '+12 aura radius; tier 2 sees Ghosts.' },
        { name: 'Supplies', icon: 'assets/skills/house-supplies.png', desc: '5% cheaper in aura; tier 3 pops foil.' }
      ]
    }
  };
  const DUCK_ORDER = ['quack', 'bread', 'frost', 'laser', 'baker', 'house'];
  const TIER_COST = [0.5, 1, 2, 4, 8];

  // ---------- geese ----------
  const GEESE = {
    little: { name: 'Little goose', sprite: 'small', balloons: 1, speed: 118, height: 56, crop: 0.33 },
    goose: { name: 'Goose', sprite: 'goose', balloons: 3, speed: 92, height: 64, crop: 0.36 },
    honker: { name: 'Honker', sprite: 'honker', balloons: 2, speed: 62, foil: true, height: 66, crop: 0.27 },
    ghost: { name: 'Ghost Goose', sprite: 'ghost', balloons: 2, speed: 88, hidden: true, height: 60, crop: 0.36 },
    skater: { name: 'Skater Goose', sprite: 'skater', balloons: 2, speed: 150, height: 60, crop: 0.31 },
    mother: { name: 'Mother Goose', sprite: 'mother', balloons: 4, speed: 56, height: 72, crop: 0.28, mother: true },
    rainbow: { name: 'Rainbow Goose', sprite: 'rainbow', balloons: 8, speed: 88, height: 62, crop: 0.5, rainbow: true },
    boss: { name: 'Goose Balloon Boss', sprite: 'boss', balloons: 40, speed: 34, height: 126, crop: 0, boss: true, faceDir: -1 },
    galleon: { name: 'Goose Galleon', sprite: 'galleon', balloons: 400, speed: 26, height: 260, crop: 0, boss: true, galleon: true, faceDir: 1 }
  };

  const BALLOON_COLORS = ['#ef4d62', '#ffd24a', '#4fc3f7', '#ff8fca', '#8fdc5c', '#b28bff', '#ff9a3d'];
  const RAINBOW_COLORS = ['#ef4d62', '#ff9a3d', '#ffd24a', '#8fdc5c', '#4fc3f7', '#4f7df7', '#b28bff', '#ff8fca'];
  const STAT_MAX = { pops: 1, pierce: 1, range: 1, speed: 1 };

  // ---------- maps & track ----------
  const POND_POLY = [
    [688, 272], [784, 272], [792, 304], [800, 328], [816, 336], [840, 344], [880, 352], [912, 368],
    [928, 392], [936, 408], [944, 424], [944, 448], [936, 464], [936, 480], [928, 496], [896, 512],
    [896, 528], [904, 544], [896, 560], [896, 592], [888, 608], [864, 624], [856, 640], [824, 656],
    [808, 664], [776, 648], [752, 632], [744, 608], [752, 592], [760, 576], [752, 560], [720, 552],
    [688, 544], [680, 528], [680, 512], [680, 496], [672, 480], [656, 464], [648, 448], [640, 424],
    [632, 408], [632, 392], [640, 376], [640, 368], [640, 352], [648, 336], [656, 328], [672, 312],
    [680, 304]
  ];

  const MAPS = {
    pond: {
      name: 'Pond Park', asset: 'map', thumb: 'assets/map.png', speed: 1,
      note: 'The classic pond · open lawn',
      track: [
        [-40, 225], [150, 225], [195, 245], [212, 320], [212, 500], [235, 575], [295, 622], [370, 642],
        [420, 675], [440, 750], [465, 830], [530, 868], [610, 870], [670, 848], [692, 790], [690, 730],
        [660, 650], [590, 575], [515, 505], [488, 420], [505, 330], [565, 255], [650, 225], [730, 222],
        [810, 220], [890, 185], [960, 145], [1040, 135], [1125, 160], [1185, 230], [1205, 330],
        [1212, 430], [1255, 500], [1340, 525], [1440, 520], [1576, 518]
      ],
      blockers: [{ type: 'poly', pts: POND_POLY, margin: 10 }]
    },
    bathtub: {
      name: 'Bathtub Bay', asset: 'bathtub', thumb: 'assets/maps/map-bathtub.png', speed: 1,
      note: 'Bubble trouble · the tub is off-limits',
      track: [
        [-40, 285], [150, 290], [205, 340], [205, 480], [195, 600], [220, 700], [290, 780], [390, 800],
        [480, 760], [500, 680], [475, 580], [470, 460], [500, 350], [570, 270], [700, 240], [820, 240],
        [950, 265], [1050, 330], [1100, 440], [1110, 580], [1140, 680], [1220, 710], [1300, 690],
        [1355, 600], [1360, 460], [1390, 370], [1450, 355], [1576, 355]
      ],
      blockers: [{ type: 'ellipse', cx: 775, cy: 508, rx: 280, ry: 145, margin: 8 }]
    },
    plaza: {
      name: 'Fountain Plaza', asset: 'plaza', thumb: 'assets/maps/map-plaza.png', speed: 1,
      note: 'Fountain views · mind the buildings',
      track: [
        [-40, 315], [150, 320], [240, 370], [270, 460], [280, 580], [330, 680], [410, 710], [500, 680],
        [545, 580], [560, 420], [600, 250], [680, 150], [800, 135], [920, 160], [1000, 240], [1050, 370],
        [1100, 500], [1170, 570], [1260, 570], [1360, 520], [1450, 495], [1576, 495]
      ],
      blockers: [
        { type: 'ellipse', cx: 770, cy: 482, rx: 195, ry: 150, margin: 6 },
        { type: 'poly', pts: [[0, 0], [285, 0], [285, 228], [0, 228]], margin: 4 }
      ]
    },
    frozen: {
      name: 'Frozen Lake', asset: 'frozen', thumb: 'assets/maps/map-frozen.png', speed: 1.1,
      note: 'Slippery track · geese move 10% faster',
      track: [
        [-40, 470], [150, 490], [250, 550], [330, 560], [375, 500], [355, 420], [305, 330], [310, 210],
        [400, 130], [530, 125], [620, 175], [690, 240], [800, 280], [900, 235], [1000, 175], [1140, 170],
        [1250, 235], [1295, 345], [1250, 465], [1170, 555], [1160, 650], [1230, 725], [1400, 755], [1576, 740]
      ],
      blockers: [{ type: 'ellipse', cx: 800, cy: 505, rx: 370, ry: 185, margin: 8 }]
    }
  };

  // Pond Park scaled to the start screen's cover background. The decorative
  // geese walk this copy of the track without touching the live game track.
  const TITLE_BG_SCALE = 0.9375;
  const TITLE_BG_OFFSET_Y = -30;
  const TITLE_TRACK = MAPS.pond.track.map(([x, y]) => ({
    x: x * TITLE_BG_SCALE,
    y: y * TITLE_BG_SCALE + TITLE_BG_OFFSET_Y
  }));
  const TITLE_SEGS = [];
  let TITLE_LEN = 0;
  for (let i = 0; i < TITLE_TRACK.length - 1; i++) {
    const a = TITLE_TRACK[i];
    const b = TITLE_TRACK[i + 1];
    const len = dist(a.x, a.y, b.x, b.y);
    TITLE_SEGS.push({ a, b, len, start: TITLE_LEN });
    TITLE_LEN += len;
  }

  function titlePosAt(d) {
    d = ((d % TITLE_LEN) + TITLE_LEN) % TITLE_LEN;
    let seg = TITLE_SEGS[TITLE_SEGS.length - 1];
    for (const s of TITLE_SEGS) {
      if (d <= s.start + s.len) { seg = s; break; }
    }
    const t = clamp((d - seg.start) / seg.len, 0, 1);
    return {
      x: lerp(seg.a.x, seg.b.x, t),
      y: lerp(seg.a.y, seg.b.y, t),
      face: seg.b.x >= seg.a.x ? 1 : -1
    };
  }

  const titleGeese = [
    { type: 'goose', offset: 0.06, speed: 0.0105, phase: 0.4, size: 54 },
    { type: 'skater', offset: 0.34, speed: 0.013, phase: 2.1, size: 52 },
    { type: 'mother', offset: 0.61, speed: 0.0085, phase: 3.7, size: 64 },
    { type: 'rainbow', offset: 0.83, speed: 0.011, phase: 5.2, size: 56 }
  ];
  const titleDucks = [
    { sprite: 'quack', x: 128, y: 764, size: 76, phase: 0.2 },
    { sprite: 'frost', x: 306, y: 806, size: 64, phase: 1.5 },
    { sprite: 'laser', x: 1112, y: 802, size: 68, phase: 2.8 },
    { sprite: 'bread', x: 1288, y: 758, size: 74, phase: 4.1 }
  ];

  let ACTIVE_MAP = MAPS.pond;
  let TRACK_MAP = [];
  let SEGMENTS = [];
  let TRACK_LEN = 0;
  let LEAK_D = 0;
  let ACTIVE_BLOCKERS = [];

  function setMap(key) {
    ACTIVE_MAP = MAPS[key] || MAPS.pond;
    TRACK_MAP = ACTIVE_MAP.track.map(([x, y]) => ({ x: x * MAP_SCALE, y: y * MAP_SCALE }));
    SEGMENTS = [];
    TRACK_LEN = 0;
    for (let i = 0; i < TRACK_MAP.length - 1; i++) {
      const a = TRACK_MAP[i];
      const b = TRACK_MAP[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const len = Math.hypot(dx, dy);
      SEGMENTS.push({ x: a.x, y: a.y, dx, dy, len, start: TRACK_LEN, end: TRACK_LEN + len });
      TRACK_LEN += len;
    }
    LEAK_D = TRACK_LEN;
    const trigger = PANEL_X - 24;
    for (const s of SEGMENTS) {
      if (s.x < trigger && s.x + s.dx >= trigger && s.dx > 0) {
        const t = (trigger - s.x) / s.dx;
        LEAK_D = s.start + s.len * t;
        break;
      }
    }
    ACTIVE_BLOCKERS = (ACTIVE_MAP.blockers || []).map(b => {
      if (b.type === 'ellipse') {
        return {
          type: 'ellipse',
          cx: b.cx * MAP_SCALE,
          cy: b.cy * MAP_SCALE,
          rx: b.rx * MAP_SCALE + (b.margin || 0),
          ry: b.ry * MAP_SCALE + (b.margin || 0)
        };
      }
      return {
        type: 'poly',
        pts: b.pts.map(([x, y]) => ({ x: x * MAP_SCALE, y: y * MAP_SCALE })),
        margin: b.margin || 0
      };
    });
  }

  function posAt(d) {
    d = clamp(d, 0, TRACK_LEN);
    let seg = SEGMENTS[0];
    for (let i = 0; i < SEGMENTS.length; i++) {
      if (d <= SEGMENTS[i].end || i === SEGMENTS.length - 1) { seg = SEGMENTS[i]; break; }
    }
    const t = seg.len === 0 ? 0 : (d - seg.start) / seg.len;
    return {
      x: seg.x + seg.dx * t,
      y: seg.y + seg.dy * t,
      face: seg.dx >= 0 ? 1 : -1
    };
  }

  function distToTrack(x, y) {
    let best = Infinity;
    for (let i = 0; i < TRACK_MAP.length - 1; i++) {
      const a = TRACK_MAP[i];
      const b = TRACK_MAP[i + 1];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const l2 = dx * dx + dy * dy || 1;
      let t = ((x - a.x) * dx + (y - a.y) * dy) / l2;
      t = clamp(t, 0, 1);
      const px = a.x + dx * t;
      const py = a.y + dy * t;
      const d = Math.hypot(x - px, y - py);
      if (d < best) best = d;
    }
    return best;
  }

  function pointInPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  }

  function onBlocked(x, y) {
    for (const b of ACTIVE_BLOCKERS) {
      if (b.type === 'ellipse') {
        const nx = (x - b.cx) / b.rx;
        const ny = (y - b.cy) / b.ry;
        if (nx * nx + ny * ny <= 1) return true;
      } else {
        if (pointInPoly(x, y, b.pts)) return true;
        if (b.margin > 0) {
          for (let i = 0, j = b.pts.length - 1; i < b.pts.length; j = i++) {
            const a = b.pts[j], c = b.pts[i];
            const dx = c.x - a.x, dy = c.y - a.y;
            const l2 = dx * dx + dy * dy || 1;
            let t = ((x - a.x) * dx + (y - a.y) * dy) / l2;
            t = clamp(t, 0, 1);
            if (Math.hypot(x - (a.x + dx * t), y - (a.y + dy * t)) < b.margin) return true;
          }
        }
      }
    }
    return false;
  }

  setMap('pond');

  function placementValid(type, x, y) {
    if (x < 30 || y < 56 || x > PANEL_X - 36 || y > H - 34) return false;
    if (distToTrack(x, y) < 45) return false;
    if (onBlocked(x, y)) return false;
    for (const d of state.ducks) {
      if (dist(x, y, d.x, d.y) < 44) return false;
    }
    return true;
  }

  // ---------- state ----------
  const state = {
    phase: 'title',
    time: 0,
    round: 1,
    lives: 100,
    crumbs: 650,
    speed: 1,
    mapKey: 'pond',
    difficulty: 'medium',
    maxRounds: 80,
    ducks: [],
    geese: [],
    shots: [],
    eggs: [],
    loaves: [],
    effects: [],
    particles: [],
    texts: [],
    wave: [],
    roundActive: false,
    spawnTimer: 0,
    spawnInterval: 0.72,
    selected: null,
    placing: null,
    hover: null,
    mouse: { x: 0, y: 0, inside: false },
    shake: 0,
    flash: 0,
    nextId: 1,
    debugTrack: false
  };

  const selection = { map: 'pond', difficulty: 'medium' };

  function loadBestScores() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (e) {
      return {};
    }
  }

  const bestScores = loadBestScores();

  function bestFor(mapKey, difficulty) {
    return bestScores[mapKey + ':' + difficulty] || 0;
  }

  function recordBest(round) {
    const key = state.mapKey + ':' + state.difficulty;
    if (round > (bestScores[key] || 0)) {
      bestScores[key] = round;
      try { localStorage.setItem(BEST_KEY, JSON.stringify(bestScores)); } catch (e) { /* storage can be blocked */ }
      if (!document.getElementById('map-screen').classList.contains('hidden')) updateMapSelection();
    }
  }

  // ---------- helpers ----------
  function addText(x, y, text, opts = {}) {
    state.texts.push({
      x, y, text,
      color: opts.color || '#fff',
      outline: opts.outline || '#3f2510',
      size: opts.size || 16,
      life: opts.life || 0.8,
      maxLife: opts.life || 0.8,
      vy: opts.vy == null ? -38 : opts.vy,
      vx: opts.vx || 0
    });
    if (state.texts.length > 90) state.texts.shift();
  }

  function burst(x, y, color, n = 9, power = 180) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const sp = rand(power * 0.25, power);
      state.particles.push({
        x: x + rand(-4, 4),
        y: y + rand(-4, 4),
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - rand(20, 80),
        size: rand(2.6, 6),
        color,
        rot: Math.random() * TAU,
        vr: rand(-9, 9),
        life: rand(0.45, 0.95),
        maxLife: 1,
        shape: Math.random() < 0.35 ? 'circle' : 'rect'
      });
    }
    if (state.particles.length > 500) state.particles.splice(0, state.particles.length - 500);
  }

  function addEffect(e) { state.effects.push(e); }

  function shakeScreen(v) { state.shake = Math.max(state.shake, v); }

  function showToast(msg, ms = 1700) {
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => toast.classList.remove('show'), ms);
  }

  function shakeCrumbs() {
    resourceBox.classList.remove('shake');
    void resourceBox.offsetWidth;
    resourceBox.classList.add('shake');
  }

  function roundRectPath(c, x, y, w, h, r) {
    r = Math.min(r, w / 2, h / 2);
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.quadraticCurveTo(x + w, y, x + w, y + r);
    c.lineTo(x + w, y + h - r);
    c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    c.lineTo(x + r, y + h);
    c.quadraticCurveTo(x, y + h, x, y + h - r);
    c.lineTo(x, y + r);
    c.quadraticCurveTo(x, y, x + r, y);
    c.closePath();
  }

  // ---------- duck stats ----------
  function computeStatsFor(type, tiers, buff = null) {
    const def = DUCKS[type];
    let cd = def.cd;
    let range = def.range;
    if (type === 'quack') cd *= 1 - tiers[1] * 0.13;
    if (type === 'bread') cd *= 1 - tiers[1] * 0.12;
    if (type === 'frost') range += tiers[1] * 16;
    if (type === 'house') range = 140 + tiers[1] * 12;
    if (type === 'baker' || type === 'house') cd = 0;
    if (buff && type !== 'house') {
      if (cd > 0) cd /= 1 + (buff.speed || 0);
      range *= 1 + (buff.range || 0);
    }
    let pierce = 0;
    if (type === 'quack') pierce = 3 + tiers[0];
    else if (type === 'bread') pierce = 1 + tiers[0];
    else if (type === 'frost') pierce = 1 + tiers[2];
    else if (type === 'laser') pierce = Math.min(3, 1 + tiers[2]);
    const speed = cd > 0 ? 1 / cd : 0;
    return { pops: pierce * speed, pierce, range, speed };
  }

  function refreshStatMax() {
    const max = { pops: 1, pierce: 1, range: 1, speed: 1 };
    for (const key of DUCK_ORDER) {
      const s = computeStatsFor(key, [0, 0, 0]);
      max.pops = Math.max(max.pops, s.pops);
      max.pierce = Math.max(max.pierce, s.pierce);
      max.range = Math.max(max.range, s.range);
      max.speed = Math.max(max.speed, s.speed);
    }
    Object.assign(STAT_MAX, max);
  }
  refreshStatMax();

  function getDuckBuffs(d) {
    let speed = 0;
    let range = 0;
    let discount = 0;
    let ghost = false;
    let foil = false;
    for (const h of state.ducks) {
      if (h.type !== 'house' || h === d) continue;
      const rad = 140 + h.tiers[1] * 12;
      if (dist(d.x, d.y, h.x, h.y) > rad) continue;
      speed += 0.15 + h.tiers[0] * 0.06;
      range += 0.10;
      discount += h.tiers[2] * 0.05;
      if (h.tiers[1] >= 2) ghost = true;
      if (h.tiers[2] >= 3) foil = true;
    }
    return { speed, range: Math.min(0.5, range), ghost, foil, discount: Math.min(0.5, discount) };
  }

  function duckStats(d, tiers = d.tiers) {
    return computeStatsFor(d.type, tiers, getDuckBuffs(d));
  }

  function specialsFor(type, buffs = null) {
    const list = (DUCKS[type].specials || []).slice();
    if (buffs) {
      if (buffs.ghost && !list.includes('Sees ghosts')) list.push('Sees ghosts');
      if (buffs.foil && !list.includes('Pops foil')) list.push('Pops foil');
    }
    return list;
  }

  function duckRange(d) {
    if (d.type === 'house') return 140 + d.tiers[1] * 12;
    const def = DUCKS[d.type];
    let r = def.range;
    if (d.type === 'frost') r += d.tiers[1] * 16;
    return r * (1 + getDuckBuffs(d).range);
  }

  function duckCooldown(d) {
    const def = DUCKS[d.type];
    let cd = def.cd;
    if (d.type === 'quack') cd *= 1 - d.tiers[1] * 0.13;
    if (d.type === 'bread') cd *= 1 - d.tiers[1] * 0.12;
    return Math.max(0.06, cd / (1 + getDuckBuffs(d).speed));
  }

  function duckSeesGhost(d) {
    return d.type === 'laser' || d.type === 'frost' || !!d.ghostAura || getDuckBuffs(d).ghost;
  }

  function duckCanFoil(d) {
    return d.type === 'bread' || d.type === 'laser' || getDuckBuffs(d).foil;
  }

  function duckPrice(type) {
    return Math.round(DUCKS[type].cost * DIFFICULTIES[state.difficulty].price);
  }

  function placementDiscount(x, y) {
    let disc = 0;
    for (const h of state.ducks) {
      if (h.type !== 'house') continue;
      const rad = 140 + h.tiers[1] * 12;
      if (dist(x, y, h.x, h.y) <= rad) disc += h.tiers[2] * 0.05;
    }
    return Math.min(0.5, disc);
  }

  function duckCostAt(type, x, y) {
    return Math.max(1, Math.round(duckPrice(type) * (1 - placementDiscount(x, y))));
  }

  function upgradeCost(d, i) {
    const def = DUCKS[d.type];
    const base = def.cost * TIER_COST[d.tiers[i]] * DIFFICULTIES[state.difficulty].price;
    return Math.max(1, Math.round(base * (1 - getDuckBuffs(d).discount)));
  }

  function bakeInterval(d) {
    return 6 * (1 - d.tiers[2] * 0.12);
  }

  function bakeValue(d) {
    const base = 15 + d.tiers[0] * 5;
    return Math.round(base * (1 + Math.max(0, d.tiers[1] - 1) * 0.10));
  }

  function makeDuck(type, x, y, cost) {
    const def = DUCKS[type];
    return {
      id: state.nextId++,
      type,
      x, y,
      tiers: [0, 0, 0],
      invested: cost == null ? duckPrice(type) : cost,
      timer: rand(0, 0.22),
      bakeTimer: type === 'baker' ? 1.4 : 0,
      face: 1,
      phase: Math.random() * TAU,
      squash: 0,
      ghostAura: false,
      target: null
    };
  }

  function canUpgrade(d, path) {
    if (d.tiers[path] >= 5) return false;
    const t = d.tiers.slice();
    t[path]++;
    const majors = t.filter(v => v > 2).length;
    const used = t.filter(v => v > 0).length;
    return majors <= 1 && used <= 2;
  }

  function makeGoose(type, d = 0) {
    const def = GEESE[type];
    const p = posAt(d);
    const roundScale = 1 + Math.max(0, state.round - 30) * 0.01;
    const diff = DIFFICULTIES[state.difficulty];
    const bossBonus = def.boss
      ? Math.floor(Math.max(0, state.round - 10) * (def.galleon ? 1.5 : 0.35) * (diff.bossHp || 1))
      : 0;
    const balloons = def.balloons + (diff.extraBalloons || 0) + bossBonus;
    return {
      id: state.nextId++,
      type,
      def,
      x: p.x,
      y: p.y,
      d,
      face: p.face,
      balloons,
      maxBalloons: balloons,
      foil: !!def.foil,
      hidden: !!def.hidden,
      speedBase: def.speed * roundScale * (ACTIVE_MAP.speed || 1) * (diff.speed || 1),
      slowT: 0,
      phase: Math.random() * TAU,
      flying: false,
      flyT: 0,
      alpha: 1,
      hurt: 0,
      laid: 0,
      layTimer: 2.8
    };
  }

  // ---------- waves ----------
  // Wave size is tuned against the crumbs each round creates. Popping every
  // balloon pays 1 crumb, and clear rewards shrink late, so a player who keeps
  // roughly 80% of new income in damage keeps pace. Spending much more than
  // 20% on idle utility (or missing coverage) starts leaking lives.
  function waveHash(round, salt = 0) {
    let x = Math.imul(round ^ 0x9e3779b9, 0x85ebca6b) ^ Math.imul(salt + 1, 0xc2b2ae35);
    x ^= x >>> 16;
    return x >>> 0;
  }

  function waveCount(base, threat) {
    return Math.max(1, Math.round(base * threat));
  }

  function bossPackSize(round) {
    if (round % 30 === 0) return round >= 90 ? 3 : 2;
    return round % 10 === 0 ? 1 : 0;
  }

  function galleonPackSize(round) {
    if (round % 30 === 0) return round >= 90 ? 2 : 1;
    return (DIFFICULTIES[state.difficulty].galleons || []).includes(round) ? 1 : 0;
  }

  function roundEventLabel(round) {
    if (round % 30 === 0) {
      if (round >= 120) return 'FINAL GAUNTLET';
      if (round >= 90) return 'DOUBLE GALLEON';
      if (round >= 60) return 'GALLEON STORM';
      return 'GALLEON RUSH';
    }
    if (round % 10 === 0) return galleonPackSize(round) ? 'GALLEON + BOSS' : 'BOSS ROUND';
    if (galleonPackSize(round)) return 'GALLEON INCOMING';
    return '';
  }

  function buildWave(round) {
    const q = [];
    const diff = DIFFICULTIES[state.difficulty];
    const threat = diff.threat || 1;
    const push = (type, count) => {
      const n = waveCount(count, threat);
      for (let i = 0; i < n; i++) q.push({ type });
    };

    push('little', Math.min(58, 14 + Math.floor(round * 1.02)));
    if (round >= 3) push('goose', Math.min(38, 3 + Math.floor((round - 2) * 1.12)));
    if (round >= 8) push('honker', Math.min(22, 1 + Math.floor((round - 8) * 0.9)));
    if (round >= 18) push('ghost', Math.min(24, 2 + Math.floor((round - 18) * 0.8)));
    if (round >= 12) push('skater', Math.min(30, 2 + Math.floor((round - 12) * 0.9)));
    if (round >= 20) push('mother', Math.min(12, 1 + Math.floor((round - 20) * 0.35)));
    if (round >= 32) push('rainbow', Math.min(16, 1 + Math.floor((round - 32) * 0.5)));

    const late = Math.max(0, round - 40);
    if (late > 0) {
      push('little', Math.ceil(late * 0.3));
      push('goose', Math.ceil(late * 0.18));
      if (round >= 50) push('ghost', Math.ceil(late * 0.14));
      if (round >= 55) push('skater', Math.ceil(late * 0.12));
    }

    // Every round after the opening has a randomly chosen flock, so no two
    // runs settle into the same tower-versus-single-enemy rhythm.
    const pool = [];
    if (round >= 3) pool.push('goose');
    if (round >= 8) pool.push('honker');
    if (round >= 12) pool.push('skater');
    if (round >= 18) pool.push('ghost');
    if (round >= 20) pool.push('mother');
    if (round >= 32) pool.push('rainbow');
    if (pool.length) {
      const featured = pool[waveHash(round) % pool.length];
      push(featured, 2 + Math.floor(round / 10));
    }

    if (round % 30 === 0) {
      push('ghost', round >= 90 ? 18 : 12);
      if (round >= 60) push('rainbow', round >= 120 ? 16 : 10);
      if (round >= 90) push('skater', 10);
      if (round >= 120) push('mother', 6);
    }

    shuffle(q);

    const bosses = bossPackSize(round);
    for (let i = 0; i < bosses; i++) {
      q.splice(Math.floor(q.length * (0.38 + i * 0.14)), 0, { type: 'boss' });
    }
    const galleons = galleonPackSize(round);
    for (let i = 0; i < galleons; i++) {
      q.splice(Math.floor(q.length * (0.52 + i * 0.22)), 0, { type: 'galleon' });
    }
    return q;
  }

  function roundClearReward(round) {
    return Math.max(50, 100 - Math.floor(Math.max(0, round - 20) * 0.5));
  }

  function startRound() {
    if (state.phase !== 'idle' || state.roundActive) return;
    hideWarning();
    state.wave = buildWave(state.round);
    state.roundActive = true;
    state.phase = 'running';
    Sound.roundStart();
    state.spawnTimer = 0.22;
    state.spawnInterval = Math.max(0.18, 0.68 - state.round * 0.005);
    const event = roundEventLabel(state.round);
    if (event) showToast(`${event} — Round ${state.round}`, 1900);
    for (const d of state.ducks) {
      if (d.type === 'baker') d.bakeTimer = Math.min(1.4, bakeInterval(d));
    }
    state.hover = null;
    updateHUD();
  }

  function spawnGoose(type, d = 0) {
    state.geese.push(makeGoose(type, d));
  }

  function updateSpawning(dt) {
    if (!state.roundActive) return;
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0 && state.wave.length) {
      const next = state.wave.shift();
      spawnGoose(next.type);
      state.spawnTimer = state.spawnInterval;
    }
  }

  // ---------- geese ----------
  function gooseCenter(g) {
    return { x: g.x, y: g.y - g.def.height * 0.42 };
  }

  function popBalloon(g, opts = {}) {
    if (!g || g.flying || g.balloons <= 0) return false;
    if (g.hidden && !opts.canGhost) return false;
    if (g.foil && !opts.canFoil) return false;
    g.balloons--;
    state.crumbs += 1;
    Sound.pop();
    g.hurt = 0.2;
    const color = opts.color || BALLOON_COLORS[g.balloons % BALLOON_COLORS.length];
    burst(g.x + rand(-16, 16), g.y - g.def.height * 0.72, color, 8);
    addText(g.x + rand(-14, 14), g.y - g.def.height * 0.75, '+1', {
      size: 12, color: '#fff6c9', life: 0.6, vy: -48
    });
    if (g.balloons <= 0) defeatGoose(g);
    return true;
  }

  function defeatGoose(g) {
    if (g.flying) return;
    g.flying = true;
    g.flyT = 0;
    Sound.honk(g.type === 'boss');
    addText(g.x, g.y - g.def.height * 0.9, g.type === 'galleon' ? 'GALLEON DOWN!' : 'HONK!', {
      size: g.type === 'galleon' ? 34 : g.def.boss ? 34 : 24, color: '#ffd447', life: 1.05, vy: -52, outline: '#5a3512'
    });
    if (g.type === 'galleon') {
      shakeScreen(22);
      addText(g.x, g.y - 22, '×3 BOSSES!', { size: 27, color: '#fff', life: 1.2, vy: -34 });
      for (let i = 0; i < 3; i++) {
        const child = makeGoose('boss', Math.max(0, g.d - 15 - i * 18));
        child.phase = i * 1.2;
        state.geese.push(child);
      }
      burst(g.x, g.y - g.def.height * 0.45, '#ffe9a8', 40, 340);
      burst(g.x, g.y - 80, '#8fd8ff', 24, 260);
      return;
    }
    if (g.type === 'boss') {
      shakeScreen(13);
      addText(g.x, g.y - 18, '×6!', { size: 27, color: '#fff', life: 1.1, vy: -34 });
      for (let i = 0; i < 6; i++) {
        const child = makeGoose('goose', Math.max(0, g.d - 10 - i * 12));
        child.phase = i * 1.1;
        state.geese.push(child);
      }
      burst(g.x, g.y - g.def.height * 0.45, '#ffe9a8', 28, 300);
    } else {
      burst(g.x, g.y - g.def.height * 0.45, '#ffffff', 7, 140);
    }
  }

  function leakGoose(g) {
    const lost = g.balloons;
    if (lost <= 0) { g.flying = true; g.flyT = 2; return; }
    state.lives = Math.max(0, state.lives - lost);
    Sound.leak();
    state.flash = 1;
    shakeScreen(7);
    addText(g.x, g.y - 30, '-' + lost, { size: 28, color: '#ff6b5c', life: 1.1, vy: -40 });
    burst(g.x, g.y - 20, '#ff5a4a', 12, 200);
    g.balloons = 0;
    g.flying = true;
    g.flyT = 2;
    if (state.lives <= 0) loseGame();
  }

  function layEgg(g) {
    state.eggs.push({
      id: state.nextId++,
      d: Math.max(0, g.d - 12),
      t: 0,
      hatch: 5,
      phase: Math.random() * TAU
    });
  }

  function updateEggs(dt) {
    for (const e of state.eggs) {
      e.t += dt;
      if (e.t >= e.hatch && !e.done) {
        e.done = true;
        const child = makeGoose('little', e.d);
        state.geese.push(child);
        const p = posAt(e.d);
        burst(p.x, p.y - 16, '#fff2c8', 11, 150);
        addText(p.x, p.y - 34, 'HATCH!', { size: 15, color: '#fff0b0', life: 0.8, vy: -34 });
      }
    }
    state.eggs = state.eggs.filter(e => !e.done);
  }

  function updateGeese(dt) {
    for (const g of state.geese) {
      if (g.flying) {
        g.flyT += dt;
        g.alpha = Math.max(0, 1 - g.flyT / 1.15);
        g.x += Math.sin(g.flyT * 11 + g.phase) * 38 * dt;
        g.y -= (360 + g.flyT * 520) * dt;
        continue;
      }
      if (g.slowT > 0) {
        g.slowT -= dt;
        if (g.slowT < 0) g.slowT = 0;
      }
      if (g.hurt > 0) g.hurt = Math.max(0, g.hurt - dt);

      if (g.def.mother && state.roundActive && g.laid < 4) {
        g.layTimer -= dt;
        if (g.layTimer <= 0) {
          g.layTimer = 3;
          g.laid++;
          layEgg(g);
        }
      }

      const lighter = 1 + (1 - g.balloons / g.maxBalloons) * 0.85;
      const spd = g.speedBase * lighter * (g.slowT > 0 ? 0.5 : 1);
      g.d += spd * dt;

      if (g.d >= LEAK_D) {
        g.d = LEAK_D;
        const p = posAt(g.d);
        g.x = p.x;
        g.y = p.y;
        leakGoose(g);
        if (state.phase === 'lost') return;
        continue;
      }
      const p = posAt(g.d);
      g.x = p.x;
      g.y = p.y;
      g.face = p.face;
    }
    state.geese = state.geese.filter(g => !(g.flying && g.flyT > 1.3));
  }

  // ---------- targeting & firing ----------
  function pickTarget(d) {
    if (DUCKS[d.type].utility) return null;
    let best = null;
    let bestD = -1;
    const range = duckRange(d);
    for (const g of state.geese) {
      if (g.flying || g.balloons <= 0) continue;
      if (g.hidden && !duckSeesGhost(d)) continue;
      if (dist(d.x, d.y, g.x, g.y) > range + 14) continue;
      if (g.d > bestD) { bestD = g.d; best = g; }
    }
    return best;
  }

  function duckMuzzle(d) {
    return { x: d.x + d.face * 20, y: d.y - 16 };
  }

  function fire(d, target) {
    const m = duckMuzzle(d);
    const def = DUCKS[d.type];
    const seesGhost = duckSeesGhost(d);

    if (d.type === 'quack') {
      const tx = target.x;
      const ty = target.y - 16;
      state.shots.push({
        kind: 'wave',
        x: m.x, y: m.y,
        angle: Math.atan2(ty - m.y, tx - m.x),
        speed: 560,
        life: 0, maxLife: 0.5,
        pierce: 3 + d.tiers[0],
        hits: 0,
        bounces: d.tiers[2],
        hit: new Set(),
        seesGhost,
        canFoil: duckCanFoil(d),
        done: false
      });
      Sound.quack();
      addEffect({ kind: 'flash', x: m.x, y: m.y, r: 14, life: 0.12, maxLife: 0.12, color: '#dff9ff' });
    } else if (d.type === 'bread') {
      const splash = 50 + d.tiers[0] * 8;
      state.shots.push({
        kind: 'bread',
        sx: m.x, sy: m.y,
        tx: target.x, ty: target.y,
        x: m.x, y: m.y,
        t: 0, dur: 0.55, arc: 62,
        splash,
        canFoil: true,
        bonus: d.tiers[2],
        seesGhost,
        rot: 0,
        done: false
      });
      Sound.throwBread();
    } else if (d.type === 'frost') {
      state.shots.push({
        kind: 'frost',
        sx: m.x, sy: m.y,
        tx: target.x, ty: target.y - 14,
        x: m.x, y: m.y,
        t: 0, dur: 0.3,
        slowDur: 2 + d.tiers[0] * 0.5,
        pops: 1 + d.tiers[2],
        seesGhost,
        canFoil: duckCanFoil(d),
        done: false
      });
      Sound.frost();
    } else if (d.type === 'laser') {
      fireLaser(d, target);
    }
  }

  function fireLaser(d, target) {
    const m = duckMuzzle(d);
    Sound.laser();
    const range = duckRange(d);
    const c = gooseCenter(target);
    const ang = Math.atan2(c.y - m.y, c.x - m.x);
    const cos = Math.cos(ang);
    const sin = Math.sin(ang);
    const width = 2.6 + d.tiers[0] * 1.7;
    const maxHits = Math.min(3, 1 + d.tiers[2]);
    const ex = m.x + cos * range;
    const ey = m.y + sin * range;

    const hits = [];
    for (const g of state.geese) {
      if (g.flying || g.balloons <= 0) continue;
      const gc = gooseCenter(g);
      const px = gc.x - m.x;
      const py = gc.y - m.y;
      const proj = px * cos + py * sin;
      if (proj < 0 || proj > range + 10) continue;
      const perp = Math.abs(-px * sin + py * cos);
      if (perp < 24 + width) hits.push({ g, proj });
    }
    hits.sort((a, b) => a.proj - b.proj);

    for (let i = 0; i < Math.min(hits.length, maxHits); i++) {
      const g = hits[i].g;
      popBalloon(g, { canFoil: true, canGhost: true });
      const gc = gooseCenter(g);
      burst(gc.x, gc.y, '#ff6a5a', 5, 130);
    }

    addEffect({
      kind: 'beam', x1: m.x, y1: m.y, x2: ex, y2: ey,
      width, life: 0.11, maxLife: 0.11
    });
    addEffect({ kind: 'flash', x: m.x, y: m.y, r: 12 + width * 2, life: 0.1, maxLife: 0.1, color: '#ff9a8a' });
  }

  function updateDucks(dt) {
    for (const d of state.ducks) d.ghostAura = false;

    for (const src of state.ducks) {
      if (src.type === 'laser' && src.tiers[1] > 0) {
        const rad = 150 + src.tiers[1] * 25;
        for (const d of state.ducks) {
          if (dist(d.x, d.y, src.x, src.y) <= rad) d.ghostAura = true;
        }
      }
    }

    for (const d of state.ducks) {
      if (d.type === 'house') continue;
      if (d.type === 'baker') {
        if (!state.roundActive) {
          d.bakeTimer = Math.min(1.4, bakeInterval(d));
          continue;
        }
        d.bakeTimer -= dt;
        if (d.bakeTimer <= 0) {
          d.bakeTimer += bakeInterval(d);
          spawnLoaf(d);
        }
        continue;
      }
      d.timer -= dt;
      d.squash = Math.max(0, d.squash - dt * 6.5);
      const target = pickTarget(d);
      d.target = target;
      if (target) d.face = target.x >= d.x ? 1 : -1;
      if (target && d.timer <= 0) {
        d.timer = duckCooldown(d);
        d.squash = 1;
        fire(d, target);
      }
      if (d.timer < -0.25) d.timer = 0;
    }
  }

  // ---------- Baker loaves ----------
  function spawnLoaf(d) {
    if (state.loaves.length >= 36) state.loaves.shift();
    const tx = clamp(d.x + rand(-34, 34), 42, PANEL_X - 52);
    const ty = clamp(d.y + rand(8, 26), 76, H - 42);
    state.loaves.push({
      id: state.nextId++,
      bakerId: d.id,
      sx: d.x,
      sy: d.y - 20,
      tx,
      ty,
      x: d.x,
      y: d.y - 20,
      t: 0,
      land: 0.48,
      value: bakeValue(d),
      auto: d.tiers[1] > 0,
      collected: false,
      phase: Math.random() * TAU
    });
  }

  function collectLoaf(l, silent = false) {
    if (!l || l.collected) return;
    l.collected = true;
    state.crumbs += l.value;
    Sound.collect();
    burst(l.x, l.y - 8, '#ffd86d', 7, 120);
    if (!silent) addText(l.x, l.y - 24, '+' + l.value, { size: 16, color: '#ffe37e', life: 0.85, vy: -40 });
  }

  function collectAllLoaves() {
    let total = 0;
    for (const l of state.loaves) {
      if (l.collected) continue;
      l.collected = true;
      total += l.value;
    }
    if (total > 0) {
      state.crumbs += total;
      Sound.collect();
      addText(585, 430, `+${total} crumbs`, { size: 22, color: '#ffe37e', life: 1.2, vy: -28 });
    }
    state.loaves = [];
    return total;
  }

  function updateLoaves(dt) {
    for (const l of state.loaves) {
      if (l.collected) continue;
      l.t += dt;
      const k = clamp(l.t / l.land, 0, 1);
      if (k < 1) {
        l.x = lerp(l.sx, l.tx, k);
        l.y = lerp(l.sy, l.ty, k) - Math.sin(k * Math.PI) * 34;
      } else {
        l.x = l.tx;
        l.y = l.ty;
        if (l.auto && l.t > l.land + 0.15) collectLoaf(l, true);
      }
    }
    state.loaves = state.loaves.filter(l => !l.collected);
  }

  // ---------- shots ----------
  function updateShots(dt) {
    for (const s of state.shots) {
      if (s.kind === 'wave') {
        s.life += dt;
        s.x += Math.cos(s.angle) * s.speed * dt;
        s.y += Math.sin(s.angle) * s.speed * dt;
        if (s.life > s.maxLife) { s.done = true; continue; }

        for (const g of state.geese) {
          if (s.done) break;
          if (g.flying || g.balloons <= 0 || s.hit.has(g.id)) continue;
          if (g.hidden && !s.seesGhost) continue;
          const gc = gooseCenter(g);
          if (dist(s.x, s.y, gc.x, gc.y) > 34) continue;

          const ok = popBalloon(g, { canFoil: s.canFoil, canGhost: s.seesGhost });
          s.hit.add(g.id);
          if (!ok) continue;

          s.hits++;
          burst(s.x, s.y, '#d9f7ff', 4, 110);
          if (s.hits >= s.pierce) { s.done = true; break; }

          if (s.bounces > 0) {
            let best = null;
            let bd = 260;
            for (const g2 of state.geese) {
              if (g2.flying || g2.balloons <= 0 || s.hit.has(g2.id)) continue;
              if (g2.hidden && !s.seesGhost) continue;
              const gc2 = gooseCenter(g2);
              const dd = dist(s.x, s.y, gc2.x, gc2.y);
              if (dd < bd) { bd = dd; best = g2; }
            }
            if (best) {
              const bc = gooseCenter(best);
              s.angle = Math.atan2(bc.y - s.y, bc.x - s.x);
              s.bounces--;
              s.life = Math.max(0, s.life - 0.12);
              s.maxLife = Math.max(s.maxLife, s.life + 0.3);
            }
          }
        }
      } else if (s.kind === 'bread') {
        s.t += dt;
        const k = clamp(s.t / s.dur, 0, 1);
        s.x = lerp(s.sx, s.tx, k);
        s.y = lerp(s.sy, s.ty, k) - Math.sin(k * Math.PI) * s.arc;
        s.rot = s.t * 13;
        if (k >= 1) { explodeBread(s); s.done = true; }
      } else if (s.kind === 'frost') {
        s.t += dt;
        const k = clamp(s.t / s.dur, 0, 1);
        s.x = lerp(s.sx, s.tx, k);
        s.y = lerp(s.sy, s.ty, k);
        if (k >= 1) { frostImpact(s); s.done = true; }
      }
    }
    state.shots = state.shots.filter(s => !s.done);
  }

  function explodeBread(s) {
    Sound.breadBoom();
    addEffect({ kind: 'blast', x: s.tx, y: s.ty, r: s.splash, life: 0.38, maxLife: 0.38 });
    burst(s.tx, s.ty, '#f3d49a', 12, 200);
    for (const g of state.geese) {
      if (g.flying || g.balloons <= 0) continue;
      if (g.hidden && !s.seesGhost) continue;
      if (dist(s.tx, s.ty, g.x, g.y) > s.splash + 8) continue;
      if (g.foil && !s.canFoil) continue;
      const pops = 1 + (g.foil ? s.bonus : 0);
      for (let i = 0; i < pops && g.balloons > 0 && !g.flying; i++) {
        popBalloon(g, { canFoil: s.canFoil, canGhost: s.seesGhost });
      }
    }
  }

  function frostImpact(s) {
    addEffect({ kind: 'puff', x: s.tx, y: s.ty, r: 68, life: 0.45, maxLife: 0.45 });
    for (const g of state.geese) {
      if (g.flying || g.balloons <= 0) continue;
      if (g.hidden && !s.seesGhost) continue;
      if (dist(s.tx, s.ty, g.x, g.y) <= 78) g.slowT = Math.max(g.slowT, s.slowDur);
    }
    let near = null;
    let nd = 72;
    for (const g of state.geese) {
      if (g.flying || g.balloons <= 0) continue;
      if (g.hidden && !s.seesGhost) continue;
      const dd = dist(s.tx, s.ty, g.x, g.y);
      if (dd < nd) { nd = dd; near = g; }
    }
    if (near) {
      for (let i = 0; i < s.pops && near.balloons > 0 && !near.flying; i++) {
        popBalloon(near, { canFoil: s.canFoil, canGhost: s.seesGhost });
      }
    }
  }

  // ---------- ambient updates ----------
  function updateEffects(dt) {
    for (const e of state.effects) e.life -= dt;
    state.effects = state.effects.filter(e => e.life > 0);
  }

  function updateParticles(dt) {
    for (const p of state.particles) {
      p.life -= dt;
      p.vy += 760 * dt;
      p.vx *= 1 - 1.2 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
    }
    state.particles = state.particles.filter(p => p.life > 0);
  }

  function updateTexts(dt) {
    for (const t of state.texts) {
      t.life -= dt;
      t.x += t.vx * dt;
      t.y += t.vy * dt;
    }
    state.texts = state.texts.filter(t => t.life > 0);
  }

  function checkRoundEnd() {
    if (state.phase !== 'running' || !state.roundActive) return;
    if (state.wave.length > 0) return;
    if (state.geese.some(g => !g.flying && g.balloons > 0)) return;
    if (state.eggs.length > 0) return;

    state.roundActive = false;
    collectAllLoaves();
    const chainBonus = state.ducks.filter(d => d.type === 'baker' && d.tiers[2] >= 5).length * 100;
    const reward = roundClearReward(state.round) + chainBonus;
    state.crumbs += reward;
    recordBest(state.round);
    burst(585, 380, '#ffe37e', 18, 240);
    addText(585, 330, `+${reward} crumbs`, { size: 28, color: '#ffe37e', life: 1.4, vy: -30 });
    if (chainBonus) {
      addText(585, 365, `Bakery Chain +${chainBonus}`, { size: 18, color: '#ffd15a', life: 1.5, vy: -24 });
    }

    if (state.round >= state.maxRounds) {
      Sound.victory();
      winGame();
    } else {
      state.phase = 'idle';
      state.round++;
      state.roundActive = false;
      Sound.roundClear();
      showToast(`Round cleared!   +${reward}`);
      if (roundEventLabel(state.round) && state.round <= state.maxRounds) {
        showRoundWarning();
      } else {
        hideWarning();
      }
      state.hover = null;
      updateHUD();
    }
  }

  function update(dt) {
    state.time += dt;
    updateEffects(dt);
    updateParticles(dt);
    updateTexts(dt);

    if (state.phase === 'title' || state.phase === 'victory' || state.phase === 'lost') return;

    state.shake = Math.max(0, state.shake - dt * 34);
    state.flash = Math.max(0, state.flash - dt * 2.4);

    updateSpawning(dt);
    updateGeese(dt);
    updateEggs(dt);
    if (state.phase === 'lost') return;
    updateDucks(dt);
    updateShots(dt);
    updateLoaves(dt);
    checkRoundEnd();
  }

  // ---------- game over ----------
  function winGame() {
    state.phase = 'victory';
    state.roundActive = false;
    state.placing = null;
    state.selected = null;
    recordBest(state.maxRounds);
    renderUpgradeBox();
    updateHUD();
    endTitle.textContent = 'Victory!';
    endSub.textContent = `All ${state.maxRounds} rounds cleared on ${ACTIVE_MAP.name} (${DIFFICULTIES[state.difficulty].label}). The pond is safe, the geese went home, and the balloons are confetti.`;
    endScreen.classList.remove('hidden');
    burst(585, 400, '#ffe37e', 40, 340);
    burst(585, 400, '#8fdc5c', 26, 280);
  }

  function loseGame() {
    if (state.phase === 'lost') return;
    Sound.defeat();
    state.phase = 'lost';
    state.roundActive = false;
    state.placing = null;
    state.selected = null;
    recordBest(Math.max(0, state.round - 1));
    renderUpgradeBox();
    updateHUD();
    endTitle.textContent = 'The geese got through';
    endSub.textContent = `They floated off with the pond on round ${state.round} of ${state.maxRounds} (${ACTIVE_MAP.name}, ${DIFFICULTIES[state.difficulty].label}). The ducks are very sorry.`;
    endScreen.classList.remove('hidden');
  }

  // ---------- drawing ----------
  function drawMap() {
    const img = images[ACTIVE_MAP.asset];
    if (img) ctx.drawImage(img, 0, 0, MAP_W, MAP_H);
    else {
      ctx.fillStyle = '#6cae3f';
      ctx.fillRect(0, 0, MAP_W, MAP_H);
    }
  }

  function drawDebugTrack() {
    if (!state.debugTrack) return;
    ctx.save();
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(255,70,220,.78)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = 0; i < TRACK_MAP.length; i++) {
      const p = TRACK_MAP[i];
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    }
    ctx.stroke();
    ctx.fillStyle = '#ff40cf';
    for (const p of TRACK_MAP) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, TAU);
      ctx.fill();
    }
    ctx.strokeStyle = 'rgba(60,255,170,.85)';
    ctx.lineWidth = 3;
    for (const b of ACTIVE_BLOCKERS) {
      ctx.beginPath();
      if (b.type === 'ellipse') {
        ctx.ellipse(b.cx, b.cy, b.rx, b.ry, 0, 0, TAU);
      } else {
        b.pts.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
        ctx.closePath();
      }
      ctx.stroke();
    }
    const leak = posAt(LEAK_D);
    ctx.strokeStyle = '#ff4040';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(leak.x, leak.y, 18, 0, TAU);
    ctx.stroke();
    ctx.restore();
  }

  function drawHouseAuras() {
    for (const h of state.ducks) {
      if (h.type !== 'house') continue;
      const rad = duckRange(h);
      const active = state.selected === h || state.hover === h;
      ctx.save();
      ctx.beginPath();
      ctx.arc(h.x, h.y, rad, 0, TAU);
      ctx.fillStyle = active ? 'rgba(255,220,120,.10)' : 'rgba(180,235,120,.055)';
      ctx.fill();
      ctx.setLineDash([7, 7]);
      ctx.lineDashOffset = -state.time * 12;
      ctx.strokeStyle = active ? 'rgba(255,220,120,.65)' : 'rgba(190,240,140,.28)';
      ctx.lineWidth = active ? 2.4 : 1.5;
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawEggs() {
    for (const e of state.eggs) {
      const p = posAt(e.d);
      const k = clamp(e.t / e.hatch, 0, 1);
      const wob = Math.sin(state.time * 12 + e.phase) * (k > 0.7 ? 2.6 : 0.8);
      ctx.save();
      ctx.translate(p.x + wob, p.y - 10);
      ctx.fillStyle = 'rgba(40,24,10,.25)';
      ctx.beginPath();
      ctx.ellipse(0, 12, 12, 4, 0, 0, TAU);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(0, 0, 10, 13, 0.08, 0, TAU);
      ctx.fillStyle = '#fff4d6';
      ctx.fill();
      ctx.strokeStyle = '#b99362';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,210,90,.9)';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(0, 0, 15, -Math.PI / 2, -Math.PI / 2 + k * TAU);
      ctx.stroke();
      if (k > 0.55) {
        ctx.strokeStyle = '#8a6a45';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-5, -1);
        ctx.lineTo(-1, 3);
        ctx.lineTo(3, -2);
        ctx.lineTo(6, 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawLoaves() {
    for (const l of state.loaves) {
      const bob = l.t >= l.land ? Math.sin(state.time * 3 + l.phase) * 1.8 : 0;
      ctx.save();
      ctx.translate(l.x, l.y + bob);
      ctx.fillStyle = 'rgba(45,26,10,.25)';
      ctx.beginPath();
      ctx.ellipse(0, 12, 15, 4, 0, 0, TAU);
      ctx.fill();
      if (l.auto) {
        ctx.strokeStyle = 'rgba(255,225,120,.75)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(0, -2, 18 + Math.sin(state.time * 4 + l.phase) * 2, 0, TAU);
        ctx.stroke();
      }
      const img = images.loaf;
      if (img) ctx.drawImage(img, -17, -18, 34, 30);
      else {
        ctx.fillStyle = '#e0a653';
        ctx.strokeStyle = '#8c5622';
        ctx.lineWidth = 2;
        roundRectPath(ctx, -15, -8, 30, 18, 7);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawGalleonBar(g) {
    if (!g || g.flying) return;
    const w = 430;
    const x = 585 - w / 2;
    const y = 30;
    const k = clamp(g.balloons / g.maxBalloons, 0, 1);
    ctx.save();
    roundRectPath(ctx, x, y, w, 24, 12);
    ctx.fillStyle = 'rgba(32,17,8,.82)';
    ctx.fill();
    ctx.strokeStyle = '#ffd15a';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    roundRectPath(ctx, x + 4, y + 4, Math.max(0, (w - 8) * k), 16, 8);
    const grd = ctx.createLinearGradient(x, y, x + w, y);
    grd.addColorStop(0, '#ff5d4a');
    grd.addColorStop(0.5, '#ff9a3d');
    grd.addColorStop(1, '#ffd15a');
    ctx.fillStyle = grd;
    ctx.fill();
    ctx.font = "15px 'Lilita One', sans-serif";
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#fff';
    ctx.strokeStyle = 'rgba(50,24,8,.85)';
    ctx.lineWidth = 3;
    ctx.strokeText(`GOOSE GALLEON  ${g.balloons} / ${g.maxBalloons}`, 585, y + 13);
    ctx.fillText(`GOOSE GALLEON  ${g.balloons} / ${g.maxBalloons}`, 585, y + 13);
    ctx.restore();
  }

  function drawRange(x, y, r, stroke, fill) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, TAU);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 2.4;
    ctx.stroke();
    ctx.restore();
  }

  function drawRanges() {
    const seen = new Set();
    const list = [state.selected, state.hover];
    for (const d of list) {
      if (!d || seen.has(d)) continue;
      if (!state.ducks.includes(d)) continue;
      seen.add(d);
      drawRange(d.x, d.y, duckRange(d), 'rgba(255,255,255,.88)', 'rgba(255,255,255,.13)');
    }
  }

  function drawDuck(d) {
    const def = DUCKS[d.type];
    const img = images[def.sprite];
    if (!img) return;
    const h = def.height || 62;
    const w = h * img.width / img.height;
    const bob = Math.sin(state.time * 2.3 + d.phase) * 1.2;
    const sq = d.squash;

    ctx.save();
    ctx.translate(d.x, d.y);
    ctx.fillStyle = 'rgba(35,22,8,.24)';
    ctx.beginPath();
    ctx.ellipse(0, 26, w * 0.36, 7.5, 0, 0, TAU);
    ctx.fill();

    if (state.selected === d) {
      ctx.beginPath();
      ctx.ellipse(0, 26, w * 0.46, 10, 0, 0, TAU);
      ctx.strokeStyle = 'rgba(255,214,90,.95)';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.translate(0, bob);
    ctx.scale(d.face, 1);
    ctx.scale(1 + sq * 0.16, 1 - sq * 0.13);
    ctx.drawImage(img, -w / 2, -h + 26, w, h);
    ctx.restore();

    const total = d.tiers[0] + d.tiers[1] + d.tiers[2];
    if (total > 0) {
      const bx = d.x + (d.face > 0 ? 19 : -19);
      const by = d.y - 32 + bob;
      ctx.save();
      ctx.beginPath();
      ctx.arc(bx, by, 9, 0, TAU);
      ctx.fillStyle = '#3a2413';
      ctx.fill();
      ctx.strokeStyle = '#ffd15a';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = "10px 'Lilita One', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(total), bx, by + 0.5);
      ctx.restore();
    }
  }

  function drawGoose(g) {
    const img = images[g.def.sprite];
    if (!img) return;
    const h = g.def.height;
    const crop = Math.floor(img.height * (g.def.crop || 0));
    const srcH = img.height - crop;
    const w = h * img.width / srcH;
    const bob = g.flying ? 0 : Math.sin(state.time * 8 + g.phase) * 2.1;
    const facing = (g.def.faceDir || 1) * g.face;

    ctx.save();
    ctx.globalAlpha = 0.26 * g.alpha;
    ctx.fillStyle = '#2a1a0a';
    ctx.beginPath();
    ctx.ellipse(g.x, g.y + 6, Math.max(14, w * 0.34), Math.max(5, h * 0.06), 0, 0, TAU);
    ctx.fill();
    ctx.restore();

    if (g.slowT > 0 && !g.flying) {
      ctx.save();
      const grd = ctx.createRadialGradient(g.x, g.y - h * 0.4, 4, g.x, g.y - h * 0.4, h * 0.55);
      grd.addColorStop(0, 'rgba(150,220,255,.18)');
      grd.addColorStop(1, 'rgba(150,220,255,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(g.x, g.y - h * 0.4, h * 0.55, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    if (g.hidden && !g.flying) {
      ctx.save();
      const grd = ctx.createRadialGradient(g.x, g.y - h * 0.4, 3, g.x, g.y - h * 0.4, h * 0.6);
      grd.addColorStop(0, 'rgba(196,160,255,.28)');
      grd.addColorStop(1, 'rgba(196,160,255,0)');
      ctx.fillStyle = grd;
      ctx.beginPath();
      ctx.arc(g.x, g.y - h * 0.4, h * 0.6, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    ctx.globalAlpha = (g.hidden ? 0.56 : 1) * g.alpha;
    ctx.translate(g.x, g.y + 9 + bob);
    const tilt = g.flying
      ? Math.sin(g.flyT * 10) * 0.08
      : Math.sin(state.time * 6 + g.phase) * 0.032;
    ctx.rotate(tilt);
    ctx.scale(facing, 1);
    ctx.drawImage(img, 0, crop, img.width, srcH, -w / 2, -h, w, h);
    ctx.restore();

    if (g.hurt > 0) {
      ctx.save();
      ctx.globalAlpha = g.hurt * 1.4;
      ctx.fillStyle = 'rgba(255,255,255,.6)';
      ctx.beginPath();
      ctx.ellipse(g.x, g.y - h * 0.45, w * 0.38, h * 0.3, 0, 0, TAU);
      ctx.fill();
      ctx.restore();
    }

    if (g.slowT > 0 && !g.flying) {
      ctx.save();
      ctx.fillStyle = 'rgba(230,248,255,.9)';
      for (let i = 0; i < 3; i++) {
        const a = state.time * 2 + i * 2.1;
        const sx = g.x + Math.cos(a) * (w * 0.38);
        const sy = g.y - h * 0.55 + Math.sin(a * 1.3) * 10;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.8, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }

    drawBalloons(g, h, bob);
  }

  function drawBalloons(g, h, bob) {
    const n = g.balloons;
    if (n <= 0) return;
    if (g.def.galleon) return;
    const shown = g.def.rainbow ? n : Math.min(n, g.def.boss ? 8 : 6);
    const r = g.def.boss ? 5.5 : 7;
    const cx = g.x;
    const cy = g.y - h + 12 + bob;
    const spread = g.def.boss ? 0.48 : 0.42;

    ctx.save();
    ctx.globalAlpha = (g.hidden ? 0.6 : 1) * g.alpha;

    for (let i = 0; i < shown; i++) {
      const t = shown === 1 ? 0 : (i / (shown - 1) - 0.5);
      const ang = -Math.PI / 2 + t * spread * 2.2;
      const dd = 19 + (i % 2) * 7 + (shown > 4 ? 4 : 0);
      const float = Math.sin(state.time * 2.3 + i * 1.3 + g.phase);
      const bx = cx + Math.cos(ang) * dd + float * 1.4;
      const by = cy + Math.sin(ang) * dd * 0.92 + Math.cos(state.time * 2 + i) * 1.5;
      const color = g.def.rainbow
        ? RAINBOW_COLORS[i % RAINBOW_COLORS.length]
        : BALLOON_COLORS[(i + g.id) % BALLOON_COLORS.length];

      ctx.beginPath();
      ctx.moveTo(cx + t * 12, cy + 2);
      ctx.quadraticCurveTo(cx + t * 16, (cy + by) / 2, bx, by + r * 0.7);
      ctx.strokeStyle = 'rgba(58,36,16,.5)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(bx, by, r, 0, TAU);
      if (g.foil) {
        const grd = ctx.createLinearGradient(bx - r, by - r, bx + r, by + r);
        grd.addColorStop(0, '#f8f8fb');
        grd.addColorStop(0.35, '#c9ccd6');
        grd.addColorStop(0.55, '#ffffff');
        grd.addColorStop(1, '#9aa0ad');
        ctx.fillStyle = grd;
      } else {
        const grd = ctx.createRadialGradient(bx - r * 0.35, by - r * 0.4, r * 0.1, bx, by, r * 1.2);
        grd.addColorStop(0, '#ffffff');
        grd.addColorStop(0.25, color);
        grd.addColorStop(1, color);
        ctx.fillStyle = grd;
      }
      ctx.fill();
      ctx.strokeStyle = 'rgba(70,42,18,.4)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(bx - r * 0.32, by - r * 0.34, r * 0.24, 0, TAU);
      ctx.fillStyle = 'rgba(255,255,255,.7)';
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(bx - r * 0.2, by + r);
      ctx.lineTo(bx + r * 0.2, by + r);
      ctx.lineTo(bx, by + r + 3);
      ctx.closePath();
      ctx.fillStyle = g.foil ? '#b9bdc7' : color;
      ctx.fill();
    }

    if (n > shown) {
      const label = '×' + n;
      ctx.font = "11px 'Lilita One', sans-serif";
      const tw = ctx.measureText(label).width + 12;
      const bx = cx - tw / 2;
      const by = Math.max(cy - 41, 18);
      roundRectPath(ctx, bx, by - 9, tw, 18, 9);
      ctx.fillStyle = 'rgba(42,25,10,.86)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,220,160,.55)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, cx, by + 0.5);
    }

    ctx.restore();
  }

  function drawSoundWave(s) {
    const k = clamp(s.life / s.maxLife, 0, 1);
    const fade = Math.pow(1 - k, 0.6);
    const amp = 8 + Math.sin(k * Math.PI) * 8;
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.angle);
    ctx.globalCompositeOperation = 'lighter';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.globalAlpha = fade * 0.3;
    ctx.strokeStyle = '#b9f2ff';
    ctx.lineWidth = 1.2;
    for (let j = 0; j < 3; j++) {
      ctx.beginPath();
      ctx.moveTo(-30 - j * 8, -7 + j * 7);
      ctx.lineTo(-15 - j * 8, -7 + j * 7);
      ctx.stroke();
    }

    for (let line = 0; line < 3; line++) {
      const spread = (line - 1) * 5;
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const t = i / 24;
        const x = (t - 0.5) * 40;
        const env = Math.sin(t * Math.PI);
        const y = spread * env + Math.sin(t * Math.PI * 3.2 - s.life * 46 + line * 0.85) * amp * env * (line === 1 ? 1 : 0.6);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = line === 1 ? '#ffffff' : '#c7f6ff';
      ctx.lineWidth = line === 1 ? 2.6 : 1.5;
      ctx.globalAlpha = fade * (line === 1 ? 0.95 : 0.55);
      ctx.shadowColor = 'rgba(150,235,255,.95)';
      ctx.shadowBlur = 12;
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBread(s) {
    ctx.save();
    ctx.translate(s.x, s.y);
    ctx.rotate(s.rot);
    ctx.fillStyle = 'rgba(40,22,8,.18)';
    ctx.beginPath();
    ctx.ellipse(2, 8, 13, 4, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = '#e2b06a';
    ctx.strokeStyle = '#8a5624';
    ctx.lineWidth = 2;
    roundRectPath(ctx, -15, -5, 30, 10, 5);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = 'rgba(140,82,30,.7)';
    ctx.lineWidth = 1.5;
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 8 - 2, -4);
      ctx.lineTo(i * 8 + 2, 4);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawFrost(s) {
    ctx.save();
    ctx.globalAlpha = 0.85;
    for (let i = 0; i < 4; i++) {
      const a = i * 1.7 + s.t * 8;
      const r = 9 + (i % 2) * 5;
      ctx.beginPath();
      ctx.arc(s.x + Math.cos(a) * r * 0.5, s.y + Math.sin(a) * r * 0.4, 5.5 - i * 0.6, 0, TAU);
      ctx.fillStyle = i % 2 ? 'rgba(220,248,255,.9)' : 'rgba(160,220,255,.8)';
      ctx.fill();
    }
    ctx.restore();
  }

  function drawShots() {
    for (const s of state.shots) {
      if (s.kind === 'wave') drawSoundWave(s);
      else if (s.kind === 'bread') drawBread(s);
      else if (s.kind === 'frost') drawFrost(s);
    }
  }

  function drawEffects() {
    for (const e of state.effects) {
      const k = clamp(e.life / e.maxLife, 0, 1);
      if (e.kind === 'beam') {
        ctx.save();
        ctx.globalAlpha = k;
        ctx.globalCompositeOperation = 'lighter';
        ctx.strokeStyle = 'rgba(255,32,20,.62)';
        ctx.lineWidth = e.width * 2.2;
        ctx.shadowColor = '#ff2a12';
        ctx.shadowBlur = 14;
        ctx.beginPath();
        ctx.moveTo(e.x1, e.y1);
        ctx.lineTo(e.x2, e.y2);
        ctx.stroke();
        ctx.strokeStyle = '#ff9a80';
        ctx.lineWidth = Math.max(1.1, e.width * 0.4);
        ctx.shadowBlur = 5;
        ctx.stroke();
        ctx.restore();
      } else if (e.kind === 'blast') {
        const rr = e.r * (1.35 - k * 0.45);
        ctx.save();
        ctx.globalAlpha = k * 0.55;
        ctx.fillStyle = '#ffe2a8';
        ctx.beginPath();
        ctx.arc(e.x, e.y, rr, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = k;
        ctx.strokeStyle = '#d9a35b';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(e.x, e.y, rr, 0, TAU);
        ctx.stroke();
        ctx.restore();
      } else if (e.kind === 'puff') {
        const rr = e.r * (1.25 - k * 0.35);
        ctx.save();
        ctx.globalAlpha = k * 0.6;
        ctx.fillStyle = '#dff4ff';
        ctx.beginPath();
        ctx.arc(e.x, e.y, rr, 0, TAU);
        ctx.fill();
        ctx.globalAlpha = k * 0.9;
        ctx.strokeStyle = '#a9dcff';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(e.x, e.y, rr, 0, TAU);
        ctx.stroke();
        ctx.restore();
      } else if (e.kind === 'flash') {
        ctx.save();
        ctx.globalAlpha = k;
        const grd = ctx.createRadialGradient(e.x, e.y, 1, e.x, e.y, e.r);
        grd.addColorStop(0, e.color);
        grd.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grd;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
  }

  function drawParticles() {
    for (const p of state.particles) {
      const a = clamp(p.life * 2.4, 0, 1);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      if (p.shape === 'circle') {
        ctx.beginPath();
        ctx.arc(0, 0, p.size * 0.55, 0, TAU);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      }
      ctx.restore();
    }
  }

  function drawTexts() {
    for (const t of state.texts) {
      const a = clamp(t.life / t.maxLife * 1.5, 0, 1);
      const grow = 1 + (1 - clamp(t.life / t.maxLife, 0, 1)) * 0.12;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(t.x, t.y);
      ctx.scale(grow, grow);
      ctx.font = `${t.size}px 'Lilita One', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = Math.max(2, t.size * 0.3);
      ctx.strokeStyle = t.outline;
      ctx.lineJoin = 'round';
      ctx.strokeText(t.text, 0, 0);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, 0, 0);
      ctx.restore();
    }
  }

  function tintedSprite(key) {
    if (tintCache[key]) return tintCache[key];
    const img = images[key];
    if (!img) return null;
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = 'source-atop';
    g.fillStyle = 'rgba(255,60,48,.62)';
    g.fillRect(0, 0, c.width, c.height);
    tintCache[key] = c;
    return c;
  }

  function drawPlacementGhost() {
    if (!state.placing || !state.mouse.inside) return;
    const def = DUCKS[state.placing];
    const x = state.mouse.x;
    const y = state.mouse.y;
    const valid = placementValid(state.placing, x, y);
    const img = images[def.sprite];
    if (!img) return;

    drawRange(x, y, def.range,
      valid ? 'rgba(255,255,255,.9)' : 'rgba(255,74,58,.92)',
      valid ? 'rgba(255,255,255,.12)' : 'rgba(255,60,45,.17)');

    const h = def.height || 62;
    const w = h * img.width / img.height;
    ctx.save();
    ctx.globalAlpha = 0.86;
    ctx.drawImage(img, x - w / 2, y - h + 26, w, h);
    if (!valid) {
      const t = tintedSprite(def.sprite);
      if (t) ctx.drawImage(t, x - w / 2, y - h + 26, w, h);
    }
    ctx.restore();
  }

  function drawFlash() {
    if (state.flash <= 0) return;
    ctx.save();
    const grd = ctx.createRadialGradient(W / 2, H / 2, H * 0.25, W / 2, H / 2, H * 0.78);
    grd.addColorStop(0, 'rgba(255,50,35,0)');
    grd.addColorStop(1, `rgba(255,42,28,${0.4 * state.flash})`);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    drawMap();
    drawDebugTrack();
    drawHouseAuras();
    drawEggs();
    drawRanges();

    const ents = [];
    for (const d of state.ducks) ents.push({ y: d.y + 20, o: d, kind: 'duck' });
    for (const g of state.geese) ents.push({ y: g.y, o: g, kind: 'goose' });
    ents.sort((a, b) => a.y - b.y);

    ctx.save();
    if (state.shake > 0.3) {
      ctx.translate(rand(-state.shake, state.shake), rand(-state.shake, state.shake));
    }
    for (const e of ents) {
      if (e.kind === 'duck') drawDuck(e.o);
      else drawGoose(e.o);
    }
    drawShots();
    drawLoaves();
    drawEffects();
    drawParticles();
    drawTexts();
    drawPlacementGhost();
    ctx.restore();

    const galleon = state.geese.find(g => g.type === 'galleon' && !g.flying && g.balloons > 0);
    if (galleon) drawGalleonBar(galleon);
    drawFlash();
  }

  // ---------- start-screen decorations ----------
  function drawTitleDecor() {
    if (!titleCtx || titleScreen.classList.contains('hidden')) return;
    const c = titleCtx;
    const t = state.time;
    c.clearRect(0, 0, W, H);

    for (const g of titleGeese) {
      const def = GEESE[g.type];
      const img = images[def.sprite];
      if (!img) continue;
      const lap = ((g.offset + t * g.speed) % 1 + 1) % 1;
      const p = titlePosAt(lap * TITLE_LEN);
      const h = g.size;
      const crop = Math.floor(img.height * (def.crop || 0));
      const srcH = img.height - crop;
      const w = h * img.width / srcH;
      const bob = Math.sin(t * 6 + g.phase) * 1.8;
      const facing = (def.faceDir || 1) * p.face;

      c.save();
      c.globalAlpha = .2;
      c.fillStyle = '#1d1205';
      c.beginPath();
      c.ellipse(p.x, p.y + 4, w * .3, h * .06, 0, 0, TAU);
      c.fill();
      c.restore();

      const count = def.rainbow ? 4 : Math.min(3, def.balloons);
      for (let i = 0; i < count; i++) {
        const spread = i - (count - 1) / 2;
        const bx = p.x + spread * 13;
        const by = p.y - h - 17 + Math.abs(spread) * 2 + Math.sin(t * 2 + i * 1.7 + g.phase) * 3;
        c.save();
        c.globalAlpha = .9;
        c.strokeStyle = 'rgba(255,245,220,.5)';
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(p.x + spread * 3, p.y - h * .62 + bob);
        c.lineTo(bx, by + 6);
        c.stroke();
        c.beginPath();
        c.arc(bx, by, 6, 0, TAU);
        c.fillStyle = BALLOON_COLORS[i % BALLOON_COLORS.length];
        c.fill();
        c.strokeStyle = 'rgba(60,30,10,.35)';
        c.lineWidth = 1;
        c.stroke();
        c.fillStyle = 'rgba(255,255,255,.55)';
        c.beginPath();
        c.arc(bx - 2, by - 2, 1.8, 0, TAU);
        c.fill();
        c.restore();
      }

      c.save();
      c.translate(p.x, p.y + bob);
      c.rotate(Math.sin(t * 5 + g.phase) * .028);
      c.scale(facing, 1);
      c.globalAlpha = .94;
      c.drawImage(img, 0, crop, img.width, srcH, -w / 2, -h, w, h);
      c.restore();
    }

    for (const d of titleDucks) {
      const img = images[d.sprite];
      if (!img) continue;
      const h = d.size;
      const w = h * img.width / img.height;
      const bob = Math.sin(t * 2.1 + d.phase) * 4;
      c.save();
      c.globalAlpha = .2;
      c.fillStyle = '#1b1205';
      c.beginPath();
      c.ellipse(d.x, d.y + 11, w * .34, 7, 0, 0, TAU);
      c.fill();
      c.restore();
      c.save();
      c.translate(d.x, d.y + bob);
      c.drawImage(img, -w / 2, -h + 10, w, h);
      c.restore();
    }
  }

  // ---------- UI ----------
  const STAT_DEFS = [
    { key: 'pops', label: 'Pops/sec' },
    { key: 'pierce', label: 'Pierce' },
    { key: 'range', label: 'Range' },
    { key: 'speed', label: 'Speed' }
  ];

  function statText(key, s) {
    if (key === 'pops') return s.pops > 0 ? s.pops.toFixed(1) : '—';
    if (key === 'pierce') return s.pierce > 0 ? String(s.pierce) : '—';
    if (key === 'range') return s.range > 0 ? String(Math.round(s.range)) : '—';
    return s.speed > 0 ? s.speed.toFixed(2) : '—';
  }

  function statWidth(key, s) {
    return clamp((s[key] / STAT_MAX[key]) * 100, 0, 100);
  }

  function cardStatRows(s) {
    return STAT_DEFS.map(cfg => `<span class="stat-row" title="${cfg.label}">
      <span class="stat-label">${cfg.label}</span>
      <span class="stat-track"><i style="width:${statWidth(cfg.key, s).toFixed(1)}%"></i></span>
    </span>`).join('');
  }

  function badgeClass(label) {
    if (/ghost/i.test(label)) return 'ghost';
    if (/foil/i.test(label)) return 'foil';
    if (/slow/i.test(label)) return 'slow';
    if (/splash/i.test(label)) return 'splash';
    if (/crumb|bake/i.test(label)) return 'crumb';
    if (/buff/i.test(label)) return 'buff';
    return '';
  }

  function badgeMarkup(label) {
    return `<span class="badge ${badgeClass(label)}">${label}</span>`;
  }

  function specialsMarkup(type, buffs = null) {
    return specialsFor(type, buffs).map(badgeMarkup).join('');
  }

  function selectedStatMarkup(d) {
    const s = duckStats(d);
    return `<div class="duck-stat-grid">${STAT_DEFS.map(cfg => `
      <div class="dstat" data-stat="${cfg.key}">
        <div class="dstat-head"><span class="dstat-label">${cfg.label}</span><span class="dstat-value" data-stat-value>${statText(cfg.key, s)}</span></div>
        <span class="dstat-track"><i data-stat-fill style="width:${statWidth(cfg.key, s).toFixed(1)}%"></i></span>
      </div>`).join('')}</div>`;
  }

  function applyStatPreview(d, path) {
    if (!d || !upgradeBox.querySelector('.duck-stat-grid')) return;
    const tiers = d.tiers.slice();
    if (path != null && tiers[path] < 5) tiers[path]++;
    const s = computeStatsFor(d.type, tiers, getDuckBuffs(d));
    for (const cfg of STAT_DEFS) {
      const box = upgradeBox.querySelector(`.dstat[data-stat="${cfg.key}"]`);
      if (!box) continue;
      box.classList.toggle('preview', path != null);
      const value = box.querySelector('[data-stat-value]');
      const fill = box.querySelector('[data-stat-fill]');
      if (value) value.textContent = statText(cfg.key, s);
      if (fill) fill.style.width = statWidth(cfg.key, s).toFixed(1) + '%';
    }
  }

  function buildCards() {
    duckGrid.innerHTML = DUCK_ORDER.map(key => {
      const def = DUCKS[key];
      const s = computeStatsFor(key, [0, 0, 0]);
      return `<button class="duck-card" data-duck="${key}" type="button" title="${def.blurb}">
        <span class="card-top">
          <img class="card-sprite" src="${ASSETS[def.sprite]}" alt="">
          <span class="card-info">
            <span class="card-name">${def.name}</span>
            <span class="card-price"><span class="coin"></span><b data-card-price>${duckPrice(key)}</b></span>
          </span>
        </span>
        <span class="card-stats">${cardStatRows(s)}</span>
        <span class="card-specials">${specialsMarkup(key)}</span>
      </button>`;
    }).join('');
  }

  function renderUpgradeBox() {
    const d = state.selected;
    if (!d || !state.ducks.includes(d)) {
      upgradeBox.innerHTML =
        `<div class="up-head"><span class="up-name">Upgrades</span></div>
         <div class="upgrade-hint">Click a duck on the lawn to see its upgrades.<br>Only one path can go past tier 2.</div>`;
      return;
    }
    const def = DUCKS[d.type];
    const refund = Math.floor(d.invested * 0.7);
    let html = `<div class="up-head">
      <span class="up-name">${def.full}</span>
      <button class="sell-btn" id="sellBtn" type="button">Sell +${refund}</button>
    </div>
    <div class="up-base">${def.blurb}</div>
    ${selectedStatMarkup(d)}
    <div class="duck-specials">${specialsMarkup(d.type, getDuckBuffs(d))}</div>`;

    def.paths.forEach((path, i) => {
      const tier = d.tiers[i];
      const maxed = tier >= 5;
      const allowed = maxed ? false : canUpgrade(d, i);
      const cost = maxed ? null : upgradeCost(d, i);
      const pips = [0, 1, 2, 3, 4]
        .map(k => `<span class="pip ${k < tier ? 'on' : ''}"></span>`)
        .join('');
      const lockNote = maxed ? ' Maxed out.' : allowed ? '' : ' Locked: only one path can pass tier 2, and one other path can be upgraded.';
      html += `<div class="up-path ${maxed ? 'maxed' : ''} ${!allowed && !maxed ? 'locked' : ''}" data-path="${i}">
        <button class="up-buy" data-buy="${i}" type="button"
          ${maxed || !allowed ? 'disabled' : ''}
          title="${path.desc}${lockNote}">
          <img class="up-icon" src="${path.icon}" alt="" width="36" height="36" draggable="false">
          <span class="up-mid">
            <span class="up-path-name">${path.name}</span>
            <span class="up-desc">${path.desc}</span>
          </span>
          <span class="up-right">
            <span class="pips">${pips}</span>
            <span class="price-pill ${maxed ? 'max' : ''}" data-price="${cost == null ? '' : cost}">${maxed ? 'MAX' : '$' + cost}</span>
          </span>
        </button>
      </div>`;
    });

    upgradeBox.innerHTML = html;
    updateUpgradeAffordability();
  }

  function updateUpgradeAffordability() {
    const d = state.selected;
    if (!d) return;
    const buttons = upgradeBox.querySelectorAll('.up-buy[data-buy]');
    for (const btn of buttons) {
      const i = parseInt(btn.dataset.buy, 10);
      if (d.tiers[i] >= 5) continue;
      const cost = upgradeCost(d, i);
      const pill = btn.querySelector('.price-pill');
      if (pill) {
        pill.textContent = '$' + cost;
        pill.classList.toggle('cant', state.crumbs < cost);
      }
    }
  }

  const lastUI = { lives: -1, crumbs: -1, round: -1, roundTotal: '', meta: '', diffTag: '', diffClass: '', running: null, activeKey: null, poor: {} };

  function setText(el, val, key) {
    if (lastUI[key] !== val) {
      el.textContent = val;
      lastUI[key] = val;
    }
  }

  function updateHUD() {
    setText(livesNum, String(state.lives), 'lives');
    setText(crumbsNum, String(state.crumbs), 'crumbs');
    setText(hudRoundNum, String(Math.min(state.round, state.maxRounds)), 'round');
    setText(hudRoundTotal, '/ ' + state.maxRounds, 'roundTotal');
    const diff = DIFFICULTIES[state.difficulty];
    setText(hudDiffTag, diff.label, 'diffTag');
    if (lastUI.diffClass !== state.difficulty) {
      lastUI.diffClass = state.difficulty;
      hudDiffTag.className = 'diff-tag ' + state.difficulty;
    }
    const event = roundEventLabel(state.round);
    setText(hudMeta, event ? `${ACTIVE_MAP.name} · ${event}` : ACTIVE_MAP.name, 'meta');

    if (lastUI.running !== state.roundActive) {
      lastUI.running = state.roundActive;
      startBtn.disabled = state.roundActive;
      startBtn.textContent = state.roundActive ? 'Geese incoming…' : '▶ Start Round';
      startBtn.classList.toggle('running', state.roundActive);
    }

    const activeKey = state.placing || (state.selected ? state.selected.type : null);
    for (const card of duckGrid.children) {
      const key = card.dataset.duck;
      const price = state.placing === key && state.mouse.inside
        ? duckCostAt(key, state.mouse.x, state.mouse.y)
        : duckPrice(key);
      const priceEl = card.querySelector('[data-card-price]');
      if (priceEl && priceEl.textContent !== String(price)) priceEl.textContent = String(price);
      const poor = state.crumbs < price;
      if (lastUI.poor[key] !== poor) {
        lastUI.poor[key] = poor;
        card.classList.toggle('poor', poor);
      }
      card.classList.toggle('active', key === activeKey);
    }
    updateUpgradeAffordability();
  }

  function setSpeed(v) {
    state.speed = v;
    for (const b of speedBtns) b.classList.toggle('active', parseInt(b.dataset.speed, 10) === v);
    Sound.click();
  }

  function syncSoundBtn() {
    const isMuted = Sound.isMuted();
    for (const btn of [soundBtn, titleSoundBtn]) {
      if (!btn) continue;
      btn.classList.toggle('muted', isMuted);
      btn.setAttribute('aria-label', isMuted ? 'Unmute soundtrack and sounds' : 'Mute soundtrack and sounds');
      btn.title = isMuted ? 'Sound off (M)' : 'Sound on (M)';
    }
  }

  // ---------- game lifecycle ----------
  function resetGame() {
    state.phase = 'idle';
    state.time = 0;
    state.round = 1;
    state.lives = DIFFICULTIES[state.difficulty].lives;
    state.maxRounds = DIFFICULTIES[state.difficulty].rounds;
    state.crumbs = 650;
    state.ducks = [];
    state.geese = [];
    state.shots = [];
    state.eggs = [];
    state.loaves = [];
    state.effects = [];
    state.particles = [];
    state.texts = [];
    state.wave = [];
    state.roundActive = false;
    state.spawnTimer = 0;
    state.spawnInterval = 0.72;
    state.selected = null;
    state.placing = null;
    state.hover = null;
    state.shake = 0;
    state.flash = 0;
    state.nextId = 1;
    setMap(state.mapKey);
    hideWarning();
    lastUI.lives = -1;
    lastUI.crumbs = -1;
    lastUI.round = -1;
    lastUI.roundTotal = '';
    lastUI.meta = '';
    lastUI.diffTag = '';
    lastUI.diffClass = '';
    lastUI.running = null;
    lastUI.poor = {};
    setSpeed(1);
    endScreen.classList.add('hidden');
    toast.classList.remove('show');
    renderUpgradeBox();
    updateHUD();
  }

  function buildStartDiffs() {
    const order = ['easy', 'medium', 'hard', 'xtra'];
    startDiffs.innerHTML = order.filter(key => DIFFICULTIES[key]).map(key => {
      const d = DIFFICULTIES[key];
      const extra = key === 'xtra'
        ? '<span class="sd-extra">20% faster geese · +1 balloon each · Galleons every 30 rounds</span>'
        : '';
      return `<button class="start-diff ${key}" data-start-diff="${key}" type="button" aria-label="${d.label}: ${d.rounds} rounds, ${d.lives} ${d.lives === 1 ? 'life' : 'lives'}">
        <span class="sd-name">${d.label}</span>
        <span class="sd-sub">${d.rounds} rounds · ${d.lives} ${d.lives === 1 ? 'life' : 'lives'}</span>
        <span class="sd-price">Ducks ×${d.price}</span>
        ${extra}
      </button>`;
    }).join('');
  }

  function buildMapSelect() {
    mapGrid.innerHTML = Object.entries(MAPS).map(([key, m]) => `<button class="map-card" data-map="${key}" type="button">
      <img src="${m.thumb}" alt="">
      <span class="map-card-body">
        <span class="map-name">${m.name}</span>
        <span class="map-note">${m.note}</span>
        <span class="map-best" data-best-map="${key}"></span>
      </span>
    </button>`).join('');
    updateMapSelection();
  }

  function updateMapSelection() {
    mapScreen.style.setProperty('--map-img', `url('${MAPS[selection.map].thumb}')`);
    for (const card of mapGrid.children) {
      const key = card.dataset.map;
      card.classList.toggle('selected', key === selection.map);
      const best = card.querySelector('[data-best-map]');
      if (best) {
        const n = bestFor(key, selection.difficulty);
        best.textContent = `Best ${DIFFICULTIES[selection.difficulty].label}: ${n ? 'round ' + n : '—'}`;
      }
    }
    if (mapDiffLabel) {
      mapDiffLabel.textContent = DIFFICULTIES[selection.difficulty].label;
      mapDiffLabel.className = 'diff-tag ' + selection.difficulty;
    }
    startMapBtn.textContent = `▶ Start ${DIFFICULTIES[selection.difficulty].label}`;
  }

  function openMapSelect() {
    Sound.ensure();
    Sound.click();
    endScreen.classList.add('hidden');
    titleScreen.classList.add('hidden');
    mapScreen.classList.remove('hidden');
    buildMapSelect();
  }

  function startSelectedMap() {
    state.mapKey = selection.map;
    state.difficulty = selection.difficulty;
    titleScreen.classList.add('hidden');
    mapScreen.classList.add('hidden');
    Sound.ensure();
    Sound.startMusic();
    resetGame();
    Sound.click();
  }

  function beginGame() {
    startSelectedMap();
  }

  function showTitle() {
    Sound.click();
    resetGame();
    state.phase = 'title';
    mapScreen.classList.add('hidden');
    endScreen.classList.add('hidden');
    titleScreen.classList.remove('hidden');
  }

  function showRoundWarning() {
    const label = roundEventLabel(state.round);
    if (!label) { hideWarning(); return; }
    warningBanner.innerHTML = `<span>${label} — Round ${state.round}!</span>`;
    warningBanner.classList.remove('hidden');
    void warningBanner.offsetWidth;
    warningBanner.classList.add('show');
    Sound.warning();
    showToast(`${label} on round ${state.round}!`, 2600);
  }

  function hideWarning() {
    warningBanner.classList.remove('show');
    warningBanner.classList.add('hidden');
  }

  // ---------- input ----------
  function canvasPos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (W / r.width),
      y: (e.clientY - r.top) * (H / r.height)
    };
  }

  function hitDuck(x, y) {
    let best = null;
    let bd = 34;
    for (const d of state.ducks) {
      const dd = dist(x, y, d.x, d.y - 4);
      if (dd < bd) { bd = dd; best = d; }
    }
    return best;
  }

  function hitLoaf(x, y) {
    for (let i = state.loaves.length - 1; i >= 0; i--) {
      const l = state.loaves[i];
      if (l.collected || l.t < l.land) continue;
      if (dist(x, y, l.x, l.y) < 26) return l;
    }
    return null;
  }

  function attemptPlace(x, y) {
    if (!state.placing) return;
    const type = state.placing;
    const cost = duckCostAt(type, x, y);
    if (!placementValid(type, x, y)) {
      addText(x, y - 20, 'No room!', { size: 16, color: '#ffb3a8', life: 0.7, vy: -30 });
      shakeScreen(1.5);
      return;
    }
    if (state.crumbs < cost) {
      shakeCrumbs();
      return;
    }
    state.crumbs -= cost;
    const duck = makeDuck(type, x, y, cost);
    state.ducks.push(duck);
    Sound.place();
    state.selected = duck;
    state.placing = null;
    state.hover = null;
    burst(x, y + 20, '#f8e0a4', 14, 150);
    addText(x, y - 34, '-' + cost, { size: 17, color: '#ffe37e', life: 0.85, vy: -40 });
    renderUpgradeBox();
    updateHUD();
  }

  function selectCard(key) {
    if (state.phase !== 'idle' && state.phase !== 'running') return;
    if (state.crumbs < duckPrice(key)) { shakeCrumbs(); return; }
    Sound.click();
    if (state.placing === key) {
      state.placing = null;
      updateHUD();
      return;
    }
    state.placing = key;
    state.selected = null;
    state.hover = null;
    renderUpgradeBox();
    updateHUD();
  }

  function bindUI() {
    duckGrid.addEventListener('click', e => {
      const btn = e.target.closest('[data-duck]');
      if (!btn) return;
      selectCard(btn.dataset.duck);
    });

    mapGrid.addEventListener('click', e => {
      const btn = e.target.closest('[data-map]');
      if (!btn) return;
      selection.map = btn.dataset.map;
      Sound.click();
      updateMapSelection();
    });

    startDiffs.addEventListener('click', e => {
      const btn = e.target.closest('[data-start-diff]');
      if (!btn) return;
      selection.difficulty = btn.dataset.startDiff;
      openMapSelect();
    });

    startMapBtn.addEventListener('click', () => { startSelectedMap(); });
    mapBackBtn.addEventListener('click', showTitle);

    upgradeBox.addEventListener('pointerover', e => {
      const path = e.target.closest('.up-path[data-path]');
      if (!path || !state.selected) return;
      applyStatPreview(state.selected, parseInt(path.dataset.path, 10));
    });
    upgradeBox.addEventListener('pointerout', e => {
      const path = e.target.closest('.up-path[data-path]');
      if (!path || !state.selected) return;
      if (path.contains(e.relatedTarget)) return;
      applyStatPreview(state.selected, null);
    });

    upgradeBox.addEventListener('click', e => {
      const sell = e.target.closest('#sellBtn');
      if (sell) {
        const d = state.selected;
        if (!d) return;
        const refund = Math.floor(d.invested * 0.7);
        state.crumbs += refund;
        Sound.sell();
        state.ducks = state.ducks.filter(x => x !== d);
        state.selected = null;
        state.hover = null;
        addText(d.x, d.y - 34, '+' + refund, { size: 18, color: '#ffe37e', life: 1, vy: -44 });
        burst(d.x, d.y, '#ffe0a0', 10, 150);
        renderUpgradeBox();
        updateHUD();
        return;
      }
      const buy = e.target.closest('[data-buy]');
      if (buy) {
        buyUpgrade(parseInt(buy.dataset.buy, 10));
      }
    });

    startBtn.addEventListener('click', startRound);

    for (const b of speedBtns) {
      b.addEventListener('click', () => setSpeed(parseInt(b.dataset.speed, 10)));
    }

    againBtn.addEventListener('click', beginGame);
    titleBtn.addEventListener('click', showTitle);

    for (const btn of [soundBtn, titleSoundBtn]) {
      if (!btn) continue;
      btn.addEventListener('click', () => {
        Sound.toggleMute();
        syncSoundBtn();
        Sound.click();
      });
    }
    window.addEventListener('pointerdown', () => Sound.ensure(), { once: true });
    document.addEventListener('visibilitychange', () => Sound.pageVisibility(document.hidden));

    canvas.addEventListener('mousemove', e => {
      const p = canvasPos(e);
      state.mouse.x = p.x;
      state.mouse.y = p.y;
      state.mouse.inside = true;
      state.hover = state.placing ? null : hitDuck(p.x, p.y);
      const loaf = state.placing ? null : hitLoaf(p.x, p.y);
      canvas.style.cursor = state.placing ? 'crosshair' : (state.hover || loaf ? 'pointer' : 'default');
    });
    canvas.addEventListener('mouseleave', () => {
      state.mouse.inside = false;
      state.hover = null;
    });
    canvas.addEventListener('click', e => {
      if (state.phase !== 'idle' && state.phase !== 'running') return;
      const p = canvasPos(e);
      if (state.placing) {
        attemptPlace(p.x, p.y);
        return;
      }
      const loaf = hitLoaf(p.x, p.y);
      if (loaf) {
        collectLoaf(loaf);
        updateHUD();
        return;
      }
      const d = hitDuck(p.x, p.y);
      state.selected = d || null;
      state.hover = null;
      renderUpgradeBox();
      updateHUD();
    });
    canvas.addEventListener('contextmenu', e => {
      e.preventDefault();
      state.placing = null;
      state.selected = null;
      renderUpgradeBox();
      updateHUD();
    });

    window.addEventListener('keydown', e => {
      if (e.key.toLowerCase() === 'm' && !e.repeat) {
        Sound.toggleMute();
        syncSoundBtn();
      } else if (e.key.toLowerCase() === 't' && !e.repeat) {
        state.debugTrack = !state.debugTrack;
        showToast(state.debugTrack ? 'Track overlay ON' : 'Track overlay OFF', 900);
      } else if (e.key === 'Escape') {
        state.placing = null;
        state.selected = null;
        renderUpgradeBox();
        updateHUD();
      } else if (e.code === 'Space') {
        if (state.phase === 'idle' && titleScreen.classList.contains('hidden') && mapScreen.classList.contains('hidden') && endScreen.classList.contains('hidden')) {
          e.preventDefault();
          startRound();
        }
      } else if (e.key === 'Enter' && !mapScreen.classList.contains('hidden')) {
        startSelectedMap();
      } else if (e.key === 'Enter' && !endScreen.classList.contains('hidden')) {
        beginGame();
      }
    });

    window.addEventListener('resize', resize);
  }

  function buyUpgrade(i) {
    const d = state.selected;
    if (!d || !state.ducks.includes(d)) return;
    if (d.tiers[i] >= 5 || !canUpgrade(d, i)) return;
    const def = DUCKS[d.type];
    const cost = upgradeCost(d, i);
    if (state.crumbs < cost) { shakeCrumbs(); return; }
    state.crumbs -= cost;
    d.tiers[i]++;
    d.invested += cost;
    Sound.upgrade();
    burst(d.x, d.y - 18, '#ffe37e', 12, 150);
    addText(d.x, d.y - 42, def.paths[i].name + ' ' + d.tiers[i], {
      size: 13, color: '#ffe9a8', life: 0.9, vy: -38
    });
    renderUpgradeBox();
    updateHUD();
  }

  // ---------- sizing ----------
  // Phones held upright get their own layout: the board (cropped at the panel edge, as on desktop) on top and the
  // shop underneath, scaled up to fill the rest of the screen. Desktop and landscape keep the 1440x900 stage.
  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const portrait = vh > vw * 1.05;
    document.body.classList.toggle('portrait', portrait);
    let sw = W, sh = H;
    if (portrait) {
      sw = PANEL_X;
      sh = Math.max(Math.round(PANEL_X * 1.45), Math.round(sw * vh / vw));
      stage.style.setProperty('--pz', Math.max(1.3, Math.min(2.4, (sh - H) / 660)).toFixed(3));
    }
    stage.style.width = sw + 'px';
    stage.style.height = sh + 'px';
    const s = Math.min(vw / sw, vh / sh);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }

  // ---------- boot ----------
  function loadAssets() {
    return Promise.all(Object.entries(ASSETS).map(([key, src]) => new Promise(resolve => {
      const img = new Image();
      img.onload = () => { images[key] = img; resolve(); };
      img.onerror = () => { console.warn('Missing asset', src); resolve(); };
      img.src = src;
    })));
  }

  let last = performance.now();
  function frame(now) {
    const raw = Math.min(0.05, (now - last) / 1000);
    last = now;
    const speed = (state.phase === 'running' || state.phase === 'idle') ? state.speed : 1;
    update(raw * speed);
    draw();
    drawTitleDecor();
    updateHUD();
    requestAnimationFrame(frame);
  }

  loadAssets().then(() => {
    buildCards();
    buildStartDiffs();
    buildMapSelect();
    bindUI();
    resize();
    syncSoundBtn();
    resetGame();
    state.phase = 'title';
    requestAnimationFrame(t => { last = t; frame(t); });
  });
})();
