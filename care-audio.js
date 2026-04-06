// care-audio.js - Audio Engine for realistic 90s retro sounds
console.log('care-audio.js loaded');

const CareAudio = (() => {
  'use strict';

  let ctx = null;
  let ambient = null;
  let noiseBuffer = null;
  let endingMusic = null;
  let ambientMusic = null;
  let initialized = false;

  const endingTracks = {
    good:     { file: 'ending_good.mp3',     volume: 0.5 },
    bad:      { file: 'ending_bad.mp3',      volume: 0.6 },
    neutral:  { file: 'ending_neutral.mp3',  volume: 0.4 },
    cyber:    { file: 'ending_cyber.mp3',    volume: 0.7 },
    virus:    { file: 'ending_virus.mp3',    volume: 0.6 },
    shutdown: { file: 'ending_shutdown.mp3', volume: 0.3 }
  };

  function init() {
    if (ctx) return true;
    try {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      initialized = true;
      return true;
    } catch (e) {
      console.warn('Audio context not supported:', e);
      return false;
    }
  }

  function isInitialized() {
    return initialized;
  }

  function createNoiseBuffer() {
    if (!init()) return null;
    if (noiseBuffer) return noiseBuffer;
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    noiseBuffer = buffer;
    return buffer;
  }

  function playBoot() {
    if (!init()) return;
    const now = ctx.currentTime;
    // PC Speaker Beep
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.setValueAtTime(0.2, now + 0.2);
    gain.gain.linearRampToValueAtTime(0, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.3);
    // Simulated Disk Seek
    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer();
    const filter = ctx.createBiquadFilter();
    const nGain = ctx.createGain();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, now + 0.4);
    nGain.gain.setValueAtTime(0, now);
    nGain.gain.linearRampToValueAtTime(0.05, now + 0.5);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.5);
    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);
    noise.start(now + 0.4);
    noise.stop(now + 2);
  }

  function playClick() {
    if (!init()) return;
    if (ctx.state === 'suspended') return;
    const now = ctx.currentTime;

    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    filter.type = 'highpass';
    filter.frequency.setValueAtTime(1500 + Math.random() * 1000, now);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start(now);
    noise.stop(now + 0.06);

    const thud = ctx.createOscillator();
    const thudGain = ctx.createGain();
    thud.type = 'sine';
    thud.frequency.setValueAtTime(120, now);
    thudGain.gain.setValueAtTime(0.03, now);
    thudGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    thud.connect(thudGain);
    thudGain.connect(ctx.destination);
    thud.start(now);
    thud.stop(now + 0.04);
  }

  function playProcess() {
    if (!init()) return;
    if (ctx.state === 'suspended') return;
    const now = ctx.currentTime;
    // Short bursts of noise to simulate HDD seeks
    for (let i = 0; i < 5; i++) {
      const t = now + i * 0.08;
      const noise = ctx.createBufferSource();
      noise.buffer = createNoiseBuffer();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800 + Math.random() * 400, t);
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(t);
      noise.stop(t + 0.05);
    }
  }

  function startAmbient() {
    if (!init()) return;
    if (ambient) return;

    const hum = ctx.createOscillator();
    const humGain = ctx.createGain();
    hum.type = 'sine';
    hum.frequency.setValueAtTime(55, ctx.currentTime);
    humGain.gain.setValueAtTime(0.02, ctx.currentTime);
    hum.connect(humGain);
    humGain.connect(ctx.destination);

    const noise = ctx.createBufferSource();
    noise.buffer = createNoiseBuffer();
    noise.loop = true;
    const filter = ctx.createBiquadFilter();
    const nGain = ctx.createGain();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, ctx.currentTime);
    filter.Q.setValueAtTime(1.5, ctx.currentTime);
    nGain.gain.setValueAtTime(0.04, ctx.currentTime);

    noise.connect(filter);
    filter.connect(nGain);
    nGain.connect(ctx.destination);

    hum.start();
    noise.start();

    // Intermittent HDD Activity
    const hddInterval = setInterval(() => {
      if (Math.random() > 0.7) {
        const now = ctx.currentTime;
        const hN = ctx.createBufferSource();
        hN.buffer = createNoiseBuffer();
        const hF = ctx.createBiquadFilter();
        const hG = ctx.createGain();
        hF.type = 'bandpass';
        hF.frequency.setValueAtTime(600 + Math.random() * 200, now);
        hG.gain.setValueAtTime(0.02, now);
        hG.gain.exponentialRampToValueAtTime(0.0001, now + 0.1);
        hN.connect(hF);
        hF.connect(hG);
        hG.connect(ctx.destination);
        hN.start(now);
        hN.stop(now + 0.15);
      }
    }, 1500);

    ambient = { hum, noise, humGain, nGain, hddInterval };
  }

  function resume() {
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function playEndingMusic(endingType) {
    stopEndingMusic();
    stopAmbient();
    const track = endingTracks[endingType] || endingTracks.neutral;
    try {
      const audio = new Audio(`assets/music/${track.file}`);
      audio.volume = track.volume;
      audio.loop = false;
      audio.play().catch(() => {});
      endingMusic = audio;
    } catch (e) {
      console.warn('Ending music failed:', e);
    }
  }

  function stopEndingMusic() {
    if (endingMusic) {
      endingMusic.pause();
      endingMusic = null;
    }
  }

  function stopAmbient() {
    if (ambient) {
      clearInterval(ambient.hddInterval);
      try { ambient.hum.stop(); } catch(e) {}
      try { ambient.noise.stop(); } catch(e) {}
      ambient = null;
    }
    if (ambientMusic) {
      ambientMusic.pause();
      ambientMusic = null;
    }
  }

  return { playBoot, playClick, playProcess, startAmbient, resume, playEndingMusic, stopEndingMusic, stopAmbient, isInitialized };
})();

window.CareAudio = CareAudio;