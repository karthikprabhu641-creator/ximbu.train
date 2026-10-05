/**
 * 3D Railway World Scene Manager
 * Master Three.js engine coordinating the railway track, procedural train,
 * terrain environment, cinematic lighting, and follow camera.
 */
import * as THREE from 'three';
import { RailwayTrackSystem } from './track.js';
import { TrainSystem } from './train.js';
import { EnvironmentSystem } from './environment.js';
import { LightingSystem } from './lighting.js';
import { CinematicCamera } from './camera.js';
import { StationManager } from './stationManager.js';

export class RailwayScene {
  constructor({ container, audio }) {
    this.container = container;
    this.audio = audio;

    this.scene = null;
    this.renderer = null;
    this.cameraSystem = null;
    this.trackSystem = null;
    this.trainSystem = null;
    this.environmentSystem = null;
    this.lightingSystem = null;
    this.stationManager = null;

    this.isRunning = false;
    this.animationFrameId = null;
    this.clock = new THREE.Clock();
    this.inputElement = document.getElementById('main-scene') || container;
    this.scrollTargetSpeed = 0;
    this.cameraDirection = new THREE.Vector3();
    this.touchPosition = null;
    this.inputResetTimer = null;
    this.speedReadout = document.querySelector('.scene-coordinates');

    this.boundResize = () => this.handleResize();
    this.boundWheel = (event) => this.handleWheel(event);
    this.boundTouchStart = (event) => this.handleTouchStart(event);
    this.boundTouchMove = (event) => this.handleTouchMove(event);
    this.boundTouchEnd = () => { this.touchPosition = null; };
  }

  /**
   * Initializes the Three.js canvas and 3D systems
   */
  init() {
    if (!this.container) return;

    // 1. Three.js Scene & Atmospheric Fog
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x04070d);
    this.scene.fog = new THREE.FogExp2(0x050812, 0.0068);

    // 2. High-Performance WebGL Renderer
    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false
    });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.18;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 3. Cinematic Follow Camera
    this.cameraSystem = new CinematicCamera({ container: this.container });

    // 4. Lighting System
    this.lightingSystem = new LightingSystem({ scene: this.scene });

    // 5. Modular Railway Track System
    this.trackSystem = new RailwayTrackSystem({ scene: this.scene });

    // 6. Terrain & Distant Environment
    this.environmentSystem = new EnvironmentSystem({
      scene: this.scene,
      trackLength: this.trackSystem.totalLength
    });

    // 7. Futuristic Bullet Train System
    this.trainSystem = new TrainSystem({
      scene: this.scene,
      track: this.trackSystem
    });

    // 8. Interactive Station Management System (Phase 4)
    this.stationManager = new StationManager({
      scene: this.scene,
      track: this.trackSystem,
      trainSystem: this.trainSystem,
      cameraSystem: this.cameraSystem,
      audio: this.audio,
      container: document.getElementById('main-scene') || this.container
    });

    // Align initial camera behind the train
    const trainPos = this.trainSystem.getState().position;
    this.cameraSystem.snapToTarget(trainPos, this.trainSystem.getState().direction);

    // Window resize binding
    window.addEventListener('resize', this.boundResize);
    this.inputElement.addEventListener('wheel', this.boundWheel, { passive: false });
    this.inputElement.addEventListener('touchstart', this.boundTouchStart, { passive: false });
    this.inputElement.addEventListener('touchmove', this.boundTouchMove, { passive: false });
    this.inputElement.addEventListener('touchend', this.boundTouchEnd, { passive: false });
    this.inputElement.addEventListener('touchcancel', this.boundTouchEnd, { passive: false });
  }

  /**
   * Starts active rendering and train foundation motion
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.clock.start();

    if (this.trainSystem) {
      this.scrollTargetSpeed = 0;
      this.trainSystem.setTrainSpeed(0);
    }

    // Start train movement audio
    if (this.audio) {
      this.audio.startTrainAmbience();
    }

    this.tick();
  }

  /**
   * Pauses active rendering
   */
  stop() {
    this.isRunning = false;
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.audio) {
      this.audio.stopTrainAmbience();
    }
    if (this.inputResetTimer) {
      clearTimeout(this.inputResetTimer);
      this.inputResetTimer = null;
    }
    this.scrollTargetSpeed = 0;
    if (this.trainSystem) {
      this.trainSystem.setTrainSpeed(0);
      this.trainSystem.state.speed = 0;
    }
  }

  /**
   * Master per-frame animation loop
   */
  tick() {
    if (!this.isRunning) return;

    const delta = this.clock.getDelta();

    // 1. Update Train Kinematics & Wheel Rotation
    if (this.trainSystem) {
      this.trainSystem.updateTrain(delta);
      const trainState = this.trainSystem.getState();

      // 2. Update Interactive Stations & Proximity Braking (Phase 4)
      if (this.stationManager) {
        this.stationManager.update(delta);
      }

      // 3. Smoothly Update Follow Camera
      if (this.cameraSystem) {
        this.cameraDirection.copy(trainState.direction);
        if (trainState.speed < 0) this.cameraDirection.negate();
        this.cameraSystem.update(trainState.position, this.cameraDirection, delta);
      }

      // 4. Update Dynamic Shadow Light Position
      if (this.lightingSystem) {
        this.lightingSystem.update(trainState.position);
      }

      // 5. Modulate Train Audio with Velocity
      if (this.audio) {
        this.audio.updateTrainAudio(Math.abs(trainState.speed), trainState.maxSpeed);
      }

      if (this.speedReadout) {
        const dockedStation = this.stationManager ? this.stationManager.getCurrentStation() : null;
        if (dockedStation && dockedStation.state === 'stopped') {
          this.speedReadout.textContent = `STATION: ${dockedStation.name} | DOCKED | ROUTE: ${Math.round(trainState.progress * 100)}%`;
        } else {
          const travel = trainState.speed < -0.05 ? 'REV' : trainState.speed > 0.05 ? 'FWD' : 'STOP';
          this.speedReadout.textContent = `SPEED: ${Math.abs(trainState.speed).toFixed(1)} M/S | ${travel} | ROUTE: ${Math.round(trainState.progress * 100)}%`;
        }
      }
    }

    // 6. Update Ambient Airborne Dust Particles
    if (this.environmentSystem) {
      this.environmentSystem.update(delta);
    }

    // 7. Render Frame
    if (this.renderer && this.scene && this.cameraSystem) {
      this.renderer.render(this.scene, this.cameraSystem.getCamera());
    }

    this.animationFrameId = requestAnimationFrame(() => this.tick());
  }

  /**
   * Viewport resize handler
   */
  handleResize() {
    if (!this.container || !this.renderer || !this.cameraSystem) return;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.cameraSystem.onResize(width, height);
  }

  handleWheel(event) {
    if (!this.isRunning || (event.target.closest && (event.target.closest('button') || event.target.closest('.station-modal-panel')))) return;
    event.preventDefault();
    this.applyJourneyInput(Math.max(-5, Math.min(5, event.deltaY * 0.035)));
  }

  handleTouchStart(event) {
    if (!this.isRunning || (event.target.closest && (event.target.closest('button') || event.target.closest('.station-modal-panel')))) return;
    if (event.touches.length) {
      event.preventDefault();
      this.touchPosition = event.touches[0].clientY;
    }
  }

  handleTouchMove(event) {
    if (!this.isRunning || this.touchPosition === null || !event.touches.length) return;
    event.preventDefault();
    const currentY = event.touches[0].clientY;
    const swipeDistance = this.touchPosition - currentY;
    this.touchPosition = currentY;
    this.applyJourneyInput(Math.max(-4, Math.min(4, swipeDistance * 0.12)));
  }

  applyJourneyInput(speedChange) {
    if (!this.trainSystem || speedChange === 0) return;

    // While docked at a station, prioritize station docking
    if (this.stationManager && this.stationManager.isStoppedAtStation()) {
      // If user scrolls forward firmly, initiate smooth departure
      if (speedChange > 1.2) {
        this.stationManager.handleDeparture();
      }
      return;
    }

    const inputDirection = Math.sign(speedChange);
    if (this.scrollTargetSpeed !== 0 && Math.sign(this.scrollTargetSpeed) !== inputDirection) {
      this.scrollTargetSpeed = speedChange;
    } else {
      this.scrollTargetSpeed += speedChange;
    }
    this.scrollTargetSpeed = Math.max(
      -this.trainSystem.state.maxSpeed,
      Math.min(this.trainSystem.state.maxSpeed, this.scrollTargetSpeed)
    );
    this.trainSystem.setTrainSpeed(this.scrollTargetSpeed);

    if (this.inputResetTimer) clearTimeout(this.inputResetTimer);
    const speed = this.trainSystem.state.speed;
    const reversing = speed !== 0 && Math.sign(speed) !== Math.sign(this.scrollTargetSpeed);
    const brakingTime = reversing ? Math.abs(speed) / this.trainSystem.state.deceleration * 1000 : 0;
    this.inputResetTimer = setTimeout(() => {
      this.scrollTargetSpeed = 0;
      this.trainSystem?.setTrainSpeed(0);
      this.inputResetTimer = null;
    }, 240 + Math.min(brakingTime, 3000));
  }

  /**
   * Cleans up Three.js scene, geometry, and event listeners
   */
  destroy() {
    this.stop();
    if (this.stationManager) {
      this.stationManager.dispose();
      this.stationManager = null;
    }
    window.removeEventListener('resize', this.boundResize);
    this.inputElement.removeEventListener('wheel', this.boundWheel);
    this.inputElement.removeEventListener('touchstart', this.boundTouchStart);
    this.inputElement.removeEventListener('touchmove', this.boundTouchMove);
    this.inputElement.removeEventListener('touchend', this.boundTouchEnd);
    this.inputElement.removeEventListener('touchcancel', this.boundTouchEnd);

    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
      this.renderer.dispose();
    }

    this.scene = null;
    this.renderer = null;
  }
}
