/**
 * Station Manager (Phase 4)
 * Orchestrates the portfolio station lifecycle: registration, curve placement,
 * proximity detection, smooth automated braking, docking, spatial content UI,
 * and seamless departure resumption.
 */
import * as THREE from 'three';
import { Station } from './station.js';
import { StationContentUI } from './stationContent.js';

export const STATION_CONFIGS = [
  {
    id: 'station_01',
    name: 'INTRODUCTION',
    category: 'Who I Am',
    progress: 0.12,
    triggerDistance: 0.024,
    platformSide: 'right',
    accentColor: 0x00e5ff
  },
  {
    id: 'station_02',
    name: 'PROJECTS',
    category: 'Projects',
    progress: 0.32,
    triggerDistance: 0.024,
    platformSide: 'left',
    accentColor: 0x38bdf8
  },
  {
    id: 'station_03',
    name: 'HACKATHONS',
    category: 'Hackathons',
    progress: 0.52,
    triggerDistance: 0.024,
    platformSide: 'right',
    accentColor: 0xa855f7
  },
  {
    id: 'station_04',
    name: 'CERTIFICATES',
    category: 'Certificates',
    progress: 0.72,
    triggerDistance: 0.024,
    platformSide: 'left',
    accentColor: 0x10b981
  },
  {
    id: 'station_05',
    name: 'CONNECT',
    category: 'Contact & Links',
    progress: 0.90,
    triggerDistance: 0.024,
    platformSide: 'right',
    accentColor: 0xec4899
  }
];

export class StationManager {
  constructor({ scene, track, trainSystem, cameraSystem, audio, container }) {
    this.scene = scene;
    this.track = track;
    this.trainSystem = trainSystem;
    this.cameraSystem = cameraSystem;
    this.audio = audio;
    this.container = container;

    this.stations = [];
    this.currentStation = null;
    this.activeStation = null;
    this.approachingStation = null;

    // Raycaster for 3D station interaction
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.initUI();
    this.initStations();
    this.bindInteractions();
  }

  /**
   * Initializes the Spatial Content UI overlay
   */
  initUI() {
    this.ui = new StationContentUI({
      container: this.container,
      onOpen: (station) => this.handleContentOpened(station),
      onClose: (station) => this.handleContentClosed(station),
      onDepart: (station) => this.handleDeparture(station),
      audio: this.audio
    });
  }

  /**
   * Constructs and registers all stations from central config
   */
  initStations() {
    STATION_CONFIGS.forEach((config) => {
      const station = new Station({
        config,
        track: this.track,
        scene: this.scene
      });
      this.stations.push(station);
    });
  }

  /**
   * Binds click / tap raycasting for direct 3D station interactions
   */
  bindInteractions() {
    const domElement = this.container || window;

    const handlePointerDown = (event) => {
      // Don't intercept clicks on UI buttons
      if (event.target.closest && (event.target.closest('button') || event.target.closest('.station-modal-panel'))) {
        return;
      }

      const rect = this.container.getBoundingClientRect();
      const clientX = event.clientX || (event.touches && event.touches[0].clientX);
      const clientY = event.clientY || (event.touches && event.touches[0].clientY);

      if (clientX === undefined || clientY === undefined) return;

      this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;

      if (!this.cameraSystem) return;

      this.raycaster.setFromCamera(this.mouse, this.cameraSystem.getCamera());

      // Collect all interactive meshes from active station
      if (this.currentStation && (this.currentStation.state === 'stopped' || this.currentStation.state === 'approaching')) {
        const targets = this.currentStation.getInteractiveTargets();
        const intersects = this.raycaster.intersectObjects(targets, true);

        if (intersects.length > 0) {
          event.preventDefault();
          this.openStationContent(this.currentStation);
        }
      }
    };

    domElement.addEventListener('click', handlePointerDown);
  }

  /**
   * Master update loop called every frame from scene.tick()
   */
  update(delta) {
    if (!this.trainSystem || !this.track) return;

    const trainState = this.trainSystem.getState();
    const trainProgress = trainState.progress;

    // 1. Update individual stations (animations, glows)
    this.stations.forEach((station) => station.update(delta));

    // 2. Proximity detection & automated deceleration
    let closestStation = null;
    let minDistance = Infinity;

    for (let i = 0; i < this.stations.length; i++) {
      const station = this.stations[i];
      const dist = Math.abs(station.progress - trainProgress);
      if (dist < minDistance) {
        minDistance = dist;
        closestStation = station;
      }
    }

    if (!closestStation) return;

    const triggerDist = closestStation.triggerDistance;
    const progressDiff = closestStation.progress - trainProgress; // Positive if station is ahead
    const absDiff = Math.abs(progressDiff);

    // Station Proximity State Machine
    if (absDiff <= triggerDist) {
      this.activeStation = closestStation;

      // Handle train approaching from forward or reverse
      if (closestStation.state === 'inactive') {
        closestStation.setState('approaching');
        this.approachingStation = closestStation;
      }

      // Smooth automated stopping as train nears station progress
      if (closestStation.state === 'approaching' || closestStation.state === 'stopping') {
        closestStation.setState('stopping');

        // Apply smooth deceleration profile toward station center
        const distanceRatio = absDiff / triggerDist; // 1 at boundary, 0 at center
        const approachSpeedLimit = Math.max(0.8, trainState.maxSpeed * Math.pow(distanceRatio, 1.2));

        if (Math.abs(trainState.speed) > approachSpeedLimit) {
          const dir = Math.sign(trainState.speed) || Math.sign(progressDiff) || 1;
          trainState.targetSpeed = dir * approachSpeedLimit;
        }

        // Full stop threshold when train is aligned with station platform
        if (absDiff < 0.0018 || Math.abs(trainState.speed) < 0.3) {
          this.dockAtStation(closestStation);
        }
      } else if (closestStation.state === 'stopped') {
        // Hold train stationary while docked
        trainState.speed = 0;
        trainState.targetSpeed = 0;
      }
    } else {
      // Train is outside station trigger zone
      if (closestStation.state === 'leaving' || closestStation.state === 'approaching' || closestStation.state === 'stopping') {
        closestStation.setState('inactive');
      }
      if (this.currentStation === closestStation && closestStation.state === 'inactive') {
        this.currentStation = null;
        this.ui.hideDockedPrompt();
      }
    }
  }

  /**
   * Docks the train at the station: plays arrival audio and activates UI prompt
   */
  dockAtStation(station) {
    if (station.state === 'stopped') return;

    station.setState('stopped');
    this.currentStation = station;

    // Align train precisely with the station stop mark
    const trainState = this.trainSystem.getState();
    trainState.progress = station.progress;
    trainState.speed = 0;
    trainState.targetSpeed = 0;
    this.trainSystem.updatePositionFromProgress(0.016);

    // Play arrival chime & brake release
    if (this.audio) {
      this.audio.playStationArrival();
    }

    // Show docked interaction prompt
    this.ui.showDockedPrompt(station);
  }

  /**
   * Opens the station content spatial UI and frames the station with the camera
   */
  openStationContent(station) {
    if (!station) return;
    station.setState('content_open');

    // Smooth camera transition toward the station
    if (this.cameraSystem) {
      const focus = station.getFocusCoordinates();
      this.cameraSystem.setStationFocus(focus.position, focus.tangent, focus.platformSide);
    }

    this.ui.open(station);
  }

  handleContentOpened(station) {
    if (station) {
      station.setState('content_open');
    }
  }

  /**
   * Closes the spatial content UI and smoothly returns the camera to the train
   */
  handleContentClosed(station) {
    if (station) {
      station.setState('stopped');
    }
    // Return camera to dynamic train follow mode
    if (this.cameraSystem) {
      this.cameraSystem.clearStationFocus();
    }
  }

  /**
   * Handles departure from the station: initiates acceleration and restores scroll control
   */
  handleDeparture(station) {
    const active = station || this.currentStation;
    if (!active) return;

    active.setState('leaving');

    if (this.cameraSystem) {
      this.cameraSystem.clearStationFocus();
    }

    // Give train an initial forward departure momentum
    const departureSpeed = 6.5;
    this.trainSystem.setTrainSpeed(departureSpeed);
    const state = this.trainSystem.getState();
    state.speed = departureSpeed * 0.4;
    state.targetSpeed = departureSpeed;

    // Temporarily disengage current station so it doesn't immediately re-stop
    setTimeout(() => {
      if (active.state === 'leaving') {
        active.setState('inactive');
      }
      this.currentStation = null;
    }, 1800);
  }

  /**
   * Returns whether the train is currently stopped at a station
   */
  isStoppedAtStation() {
    return this.currentStation && this.currentStation.state === 'stopped';
  }

  /**
   * Returns current active station
   */
  getCurrentStation() {
    return this.currentStation;
  }

  /**
   * Resets station states for replaying entrance
   */
  reset() {
    this.stations.forEach((s) => s.setState('inactive'));
    this.currentStation = null;
    this.activeStation = null;
    this.approachingStation = null;
    if (this.cameraSystem) {
      this.cameraSystem.clearStationFocus();
    }
    this.ui.reset();
  }

  /**
   * Cleans up station geometries and DOM overlays
   */
  dispose() {
    this.reset();
    this.stations.forEach((s) => s.dispose());
    this.stations = [];
  }
}
