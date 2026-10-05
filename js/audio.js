/**
 * Procedural Audio Synthesizer & Railway Audio Manager (Web Audio API)
 * Generates cinematic UI sound effects, electric train traction motor hum,
 * rhythmic wheel-on-rail track clatter, and atmospheric wind rush dynamically.
 */
export class ProceduralAudio {
  constructor() {
    this.ctx = null;
    this.isEnabled = true;
    this.isInitialized = false;

    // Train loop nodes
    this.isTrainAudioPlaying = false;
    this.motorOsc = null;
    this.motorGain = null;
    this.windNode = null;
    this.windGain = null;
    this.trackTimer = null;
    this.trainSpeedRatio = 0;
  }

  /**
   * Initializes the AudioContext upon user gesture.
   */
  init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        this.isInitialized = true;
      }
    } catch (e) {
      console.warn('Web Audio not supported or restricted:', e);
    }
  }

  /**
   * Resumes AudioContext if suspended.
   */
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  setMuted(muted) {
    this.isEnabled = !muted;
    if (muted) {
      this.stopTrainAmbience();
    }
  }

  /**
   * Plays a subtle, high-tech micro hover sound.
   */
  playHover() {
    if (!this.isEnabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.08);

    gain.gain.setValueAtTime(0.02, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  /**
   * Synthesizes an immersive cinematic digital transition sound:
   * 1. Sub-bass pulse
   * 2. Digital ascending charge
   * 3. Filtered noise glitch
   * 4. Flash bloom burst
   */
  playTransition() {
    this.init();
    if (!this.isEnabled || !this.ctx) return;
    this.resume();

    const now = this.ctx.currentTime;

    // 1. Sub-Bass Impact & Swell
    const subOsc = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(90, now);
    subOsc.frequency.exponentialRampToValueAtTime(38, now + 1.2);

    subGain.gain.setValueAtTime(0.01, now);
    subGain.gain.linearRampToValueAtTime(0.18, now + 0.3);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

    subOsc.connect(subGain);
    subGain.connect(this.ctx.destination);
    subOsc.start(now);
    subOsc.stop(now + 1.6);

    // 2. High-Tech Ascending Digital Riser
    const riserOsc = this.ctx.createOscillator();
    const riserGain = this.ctx.createGain();
    riserOsc.type = 'sawtooth';
    riserOsc.frequency.setValueAtTime(220, now);
    riserOsc.frequency.exponentialRampToValueAtTime(1400, now + 1.4);

    const riserFilter = this.ctx.createBiquadFilter();
    riserFilter.type = 'lowpass';
    riserFilter.frequency.setValueAtTime(400, now);
    riserFilter.frequency.exponentialRampToValueAtTime(3200, now + 1.4);

    riserGain.gain.setValueAtTime(0.001, now);
    riserGain.gain.linearRampToValueAtTime(0.05, now + 1.0);
    riserGain.gain.linearRampToValueAtTime(0.12, now + 1.35);
    riserGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

    riserOsc.connect(riserFilter);
    riserFilter.connect(riserGain);
    riserGain.connect(this.ctx.destination);
    riserOsc.start(now);
    riserOsc.stop(now + 1.6);

    // 3. Digital Glitch Burst
    this.playGlitchBurst(now + 0.45, 0.12);
    this.playGlitchBurst(now + 0.75, 0.08);
    this.playGlitchBurst(now + 1.15, 0.18);

    // 4. Flash Bloom Resonance
    const flashOsc = this.ctx.createOscillator();
    const flashGain = this.ctx.createGain();
    flashOsc.type = 'sine';
    flashOsc.frequency.setValueAtTime(620, now + 1.35);
    flashOsc.frequency.exponentialRampToValueAtTime(180, now + 2.1);

    flashGain.gain.setValueAtTime(0.0001, now + 1.35);
    flashGain.gain.linearRampToValueAtTime(0.15, now + 1.42);
    flashGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);

    flashOsc.connect(flashGain);
    flashGain.connect(this.ctx.destination);
    flashOsc.start(now + 1.35);
    flashOsc.stop(now + 2.1);
  }

  playGlitchBurst(startTime, duration) {
    if (!this.ctx) return;
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800 + Math.random() * 1200, startTime);
    filter.Q.value = 4;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.04, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(startTime);
    noise.stop(startTime + duration);
  }

  // =========================================================================
  // PHASE 2: 3D RAILWAY & TRAIN AUDIO ENGINE
  // =========================================================================

  /**
   * Starts ambient train movement audio loops (traction motor & wind rush)
   */
  startTrainAmbience() {
    this.init();
    if (!this.isEnabled || !this.ctx || this.isTrainAudioPlaying) return;
    this.resume();
    this.isTrainAudioPlaying = true;

    const now = this.ctx.currentTime;

    // 1. Electric Traction Motor Hum (sub-bass triangle)
    this.motorOsc = this.ctx.createOscillator();
    this.motorGain = this.ctx.createGain();

    this.motorOsc.type = 'triangle';
    this.motorOsc.frequency.setValueAtTime(68, now);

    this.motorGain.gain.setValueAtTime(0.0001, now);
    this.motorGain.gain.linearRampToValueAtTime(0.0001, now + 0.5);

    this.motorOsc.connect(this.motorGain);
    this.motorGain.connect(this.ctx.destination);
    this.motorOsc.start(now);

    // 2. Ambient Wind Rush (filtered white noise)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.windNode = this.ctx.createBufferSource();
    this.windNode.buffer = noiseBuffer;
    this.windNode.loop = true;

    const windFilter = this.ctx.createBiquadFilter();
    windFilter.type = 'lowpass';
    windFilter.frequency.setValueAtTime(260, now);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0.0001, now);
    this.windGain.gain.linearRampToValueAtTime(0.0001, now + 0.5);

    this.windNode.connect(windFilter);
    windFilter.connect(this.windGain);
    this.windGain.connect(this.ctx.destination);
    this.windNode.start(now);

    // 3. Start rhythmic track click-clack cadence
    this.scheduleTrackClick();
  }

  /**
   * Modulates sound pitch and volume with train velocity
   */
  updateTrainAudio(speed, maxSpeed = 45) {
    if (!this.ctx || !this.isTrainAudioPlaying) return;

    const ratio = Math.max(0, Math.min(1, speed / maxSpeed));
    this.trainSpeedRatio = ratio;
    const now = this.ctx.currentTime;

    if (this.motorOsc) {
      // Frequency ramps up from 68Hz to 180Hz with speed
      this.motorOsc.frequency.setTargetAtTime(68 + ratio * 110, now, 0.2);
    }

    if (this.motorGain) {
      this.motorGain.gain.setTargetAtTime(0.0001 + ratio * 0.055, now, 0.2);
    }

    if (this.windGain) {
      this.windGain.gain.setTargetAtTime(0.0001 + ratio * 0.045, now, 0.2);
    }
  }

  /**
   * Procedural rhythmic steel wheel on rail joint clatter ("click-clack")
   */
  scheduleTrackClick() {
    if (!this.isTrainAudioPlaying || !this.ctx) return;

    const playClick = () => {
      if (!this.isTrainAudioPlaying || !this.ctx || !this.isEnabled) return;
      const now = this.ctx.currentTime;

      if (this.trainSpeedRatio > 0.08) {
        this.triggerRailJoint(now, 0.03 * this.trainSpeedRatio);
        this.triggerRailJoint(now + 0.12, 0.02 * this.trainSpeedRatio);
      }

      const cadence = 1800 - this.trainSpeedRatio * 900;
      this.trackTimer = setTimeout(playClick, cadence + Math.random() * 250);
    };

    this.trackTimer = setTimeout(playClick, 1200);
  }

  triggerRailJoint(time, volume) {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, time);
    osc.frequency.exponentialRampToValueAtTime(55, time + 0.06);

    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(time);
    osc.stop(time + 0.06);
  }

  /**
   * Stops train movement audio cleanly
   */
  stopTrainAmbience() {
    this.isTrainAudioPlaying = false;
    clearTimeout(this.trackTimer);

    if (this.ctx) {
      const now = this.ctx.currentTime;
      if (this.motorGain) {
        this.motorGain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      }
      if (this.windGain) {
        this.windGain.gain.linearRampToValueAtTime(0.0001, now + 0.4);
      }
      setTimeout(() => {
        try {
          if (this.motorOsc) this.motorOsc.stop();
          if (this.windNode) this.windNode.stop();
        } catch (e) {}
        this.motorOsc = null;
        this.motorGain = null;
        this.windNode = null;
        this.windGain = null;
      }, 450);
    }
  }

  /**
   * Synthesizes a futuristic station arrival sound:
   * Smooth pneumatic air-brake release hiss + soothing two-tone harmonic arrival chime.
   */
  playStationArrival() {
    if (!this.isEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    // 1. Soft Pneumatic Brake Hiss
    try {
      const bufferSize = this.ctx.sampleRate * 0.7;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.28));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, now);
      filter.Q.setValueAtTime(3.0, now);
      const hissGain = this.ctx.createGain();
      hissGain.gain.setValueAtTime(0.04, now);
      hissGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
      noise.connect(filter);
      filter.connect(hissGain);
      hissGain.connect(this.ctx.destination);
      noise.start(now);
    } catch (e) {}

    // 2. Harmonic Dual Chime (e.g. Eb5 to Ab5)
    [ { freq: 622.25, time: now + 0.15 }, { freq: 830.61, time: now + 0.38 } ].forEach(({ freq, time }) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      gain.gain.setValueAtTime(0.05, time);
      gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.8);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(time);
      osc.stop(time + 0.85);
    });
  }

  /**
   * Synthesizes an interactive station selection tone
   */
  playStationInteract() {
    if (!this.isEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, now);
    osc.frequency.exponentialRampToValueAtTime(1040, now + 0.12);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.22);
  }

  /**
   * Synthesizes a subtle station content close sound
   */
  playStationClose() {
    if (!this.isEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(740, now);
    osc.frequency.exponentialRampToValueAtTime(370, now + 0.15);

    gain.gain.setValueAtTime(0.04, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  /**
   * Synthesizes station departure throttle-up tone
   */
  playStationDepart() {
    if (!this.isEnabled || !this.ctx) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(190, now + 0.6);

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);
    filter.frequency.linearRampToValueAtTime(600, now + 0.6);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.7);
  }
}
