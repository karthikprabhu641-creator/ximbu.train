/**
 * 3D Railway World Scene Controller (Phase 2)
 * Coordinates the Three.js RailwayScene lifecycle, canvas mounting,
 * HUD telemetry interactions, sound toggling, and return to entrance.
 */
import { RailwayScene } from './scene.js';

export class MainScenePlaceholder {
  constructor({ onReplay, audio }) {
    this.onReplay = onReplay;
    this.audio = audio;

    this.container = document.getElementById('main-scene');
    this.canvasMount = document.getElementById('webgl-canvas-container');
    this.replayButton = document.getElementById('replay-button');
    this.audioToggleBtn = document.getElementById('scene-audio-toggle');
    this.audioToggleText = document.getElementById('scene-audio-text');

    this.railwayScene = null;
    this.isAudioMuted = false;

    this.init();
  }

  init() {
    // Replay Entrance button
    if (this.replayButton) {
      this.replayButton.addEventListener('click', (e) => {
        e.preventDefault();
        this.hide();
        if (typeof this.onReplay === 'function') {
          this.onReplay();
        }
      });
    }

    // 3D Scene Audio Mute / Unmute Toggle
    if (this.audioToggleBtn) {
      this.audioToggleBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleAudio();
      });
    }
  }

  /**
   * Toggles audio in the 3D railway world
   */
  toggleAudio() {
    this.isAudioMuted = !this.isAudioMuted;

    if (this.audio) {
      this.audio.setMuted(this.isAudioMuted);
    }

    if (this.audioToggleBtn) {
      this.audioToggleBtn.classList.toggle('is-muted', this.isAudioMuted);
    }
    if (this.audioToggleText) {
      this.audioToggleText.textContent = this.isAudioMuted ? 'AUDIO // OFF' : 'AUDIO // ON';
    }
  }

  /**
   * Activates and mounts the 3D Railway World
   */
  show() {
    if (this.container) {
      this.container.classList.add('is-active');
    }

    // Lazy-initialize Three.js world on first entrance
    if (!this.railwayScene && this.canvasMount) {
      this.railwayScene = new RailwayScene({
        container: this.canvasMount,
        audio: this.audio
      });
      this.railwayScene.init();
    }

    // Start 3D rendering and motion
    if (this.railwayScene) {
      this.railwayScene.start();
    }
  }

  /**
   * Pauses the 3D railway world
   */
  hide() {
    if (this.container) {
      this.container.classList.remove('is-active');
    }

    if (this.railwayScene) {
      if (this.railwayScene.stationManager) {
        this.railwayScene.stationManager.reset();
      }
      this.railwayScene.stop();
    }
  }

  /**
   * Phase 3 Hooks
   */
  getRailwayScene() {
    return this.railwayScene;
  }

  getTrain() {
    return this.railwayScene ? this.railwayScene.trainSystem : null;
  }

  getTrack() {
    return this.railwayScene ? this.railwayScene.trackSystem : null;
  }
}
