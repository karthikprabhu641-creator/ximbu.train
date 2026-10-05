/**
 * 3D Train System & Controller
 * Procedurally constructs and controls a sleek, aerodynamic, futuristic bullet train
 * with PBR metallic shaders, dual LED headlights, undercarriage bogies, and interior cabin glow.
 */
import * as THREE from 'three';

export class TrainSystem {
  constructor({ scene, track }) {
    this.scene = scene;
    this.track = track;

    // Movement & Kinematic States
    this.state = {
      position: new THREE.Vector3(0, 0, 0),
      direction: new THREE.Vector3(0, 0, -1),
      speed: 0,
      targetSpeed: 0,
      maxSpeed: 28,
      acceleration: 8,
      deceleration: 12,
      progress: 0.015
    };

    this.orientationTarget = new THREE.Object3D();
    this.directionTarget = new THREE.Vector3();

    this.group = new THREE.Group();
    this.group.name = 'TrainRoot';

    // Train physical dimensions
    this.length = 26;
    this.width = 3.2;
    this.height = 3.4;

    this.initMaterials();
    this.loadTrain();

    if (this.scene) {
      this.scene.add(this.group);
    }
  }

  initMaterials() {
    // Obsidian Metallic Carbon Chassis
    this.bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0x111622,
      metalness: 0.88,
      roughness: 0.22,
      envMapIntensity: 1.5
    });

    // Brushed Silver / Titanium Aerodynamic Panels
    this.accentMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.95,
      roughness: 0.15
    });

    // Dark Tinted Panoramic Window Glass
    this.windowMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x050a14,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.6,
      thickness: 0.4,
      transparent: true,
      opacity: 0.92
    });

    // High-Intensity Forward LED Headlights
    this.headlightMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff
    });

    // Cyan Neon Aerodynamic Strip & Undercarriage Emissive Trim
    this.cyanNeonMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff
    });

    // Undercarriage Steel Bogies & Wheel Assemblies
    this.wheelMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.92,
      roughness: 0.3
    });

    // Cabin Interior Warm Lighting
    this.interiorGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffeedd,
      transparent: true,
      opacity: 0.35
    });
  }

  /**
   * Constructs the futuristic aerodynamic train model
   */
  loadTrain() {
    this.trainModel = new THREE.Group();
    this.trainModel.name = 'TrainModel';

    // 1. Aerodynamic Main Body & Cockpit
    this.buildBody();

    // 2. Panoramic Window Ribbons
    this.buildWindows();

    // 3. Roof Fluting & Pantograph / Receiver
    this.buildRoofDetails();

    // 4. Undercarriage Bogies & Steel Wheel Sets
    this.buildUndercarriage();

    // 5. High-Tech Forward Headlights & Volumetric Beams
    this.buildLighting();

    this.group.add(this.trainModel);

    // Initial placement on track
    this.updatePositionFromProgress();
  }

  /**
   * Main Aerodynamic Streamlined Body
   */
  buildBody() {
    // Passenger Carriage Body Box
    const carriageGeom = new THREE.BoxGeometry(
      this.width,
      this.height,
      this.length - 7
    );
    const carriage = new THREE.Mesh(carriageGeom, this.bodyMaterial);
    carriage.position.set(0, this.height / 2 + 0.65, 3.5);
    carriage.castShadow = true;
    carriage.receiveShadow = true;
    this.trainModel.add(carriage);

    // Aerodynamic Tapered Front Cockpit / Nose Cone
    // Extruded tapered nose profile pointing in -Z direction
    const noseGeom = new THREE.ConeGeometry(
      this.width / 1.7,
      7.2,
      4
    );
    // Orient cone horizontally forward
    noseGeom.rotateY(Math.PI / 4);
    noseGeom.rotateX(-Math.PI / 2);

    const nose = new THREE.Mesh(noseGeom, this.bodyMaterial);
    nose.position.set(0, this.height / 2 + 0.55, -this.length / 2 + 3.4);
    nose.scale.set(1.15, 0.72, 1);
    nose.castShadow = true;
    this.trainModel.add(nose);

    // Cockpit Pilot Windshield (Tinted Forward Rake)
    const windshieldGeom = new THREE.BoxGeometry(this.width * 0.75, 1.1, 2.2);
    const windshield = new THREE.Mesh(windshieldGeom, this.windowMaterial);
    windshield.position.set(0, this.height + 0.1, -this.length / 2 + 5.5);
    windshield.rotation.x = 0.35;
    this.trainModel.add(windshield);

    // Lateral Brushed Titanium Aero Racing Stripes
    const stripeGeom = new THREE.BoxGeometry(this.width + 0.04, 0.14, this.length - 2);
    const stripe = new THREE.Mesh(stripeGeom, this.accentMaterial);
    stripe.position.set(0, 1.4, 1);
    this.trainModel.add(stripe);

    // Cyan Emissive Edge Lighting running along lower chassis
    const neonGeom = new THREE.BoxGeometry(this.width + 0.06, 0.05, this.length - 4);
    const neonStrip = new THREE.Mesh(neonGeom, this.cyanNeonMaterial);
    neonStrip.position.set(0, 0.78, 1);
    this.trainModel.add(neonStrip);
  }

  /**
   * Panoramic Continuous Window Ribbon
   */
  buildWindows() {
    const windowLength = this.length - 8;
    const windowGeom = new THREE.BoxGeometry(this.width + 0.03, 1.1, windowLength);
    const windowStrip = new THREE.Mesh(windowGeom, this.windowMaterial);
    windowStrip.position.set(0, this.height / 2 + 0.95, 3.5);
    this.trainModel.add(windowStrip);

    // Interior Warm Light Core (Simulates passengers / interior ambiance)
    const interiorCore = new THREE.Mesh(
      new THREE.BoxGeometry(this.width - 0.4, 0.8, windowLength - 1),
      this.interiorGlowMaterial
    );
    interiorCore.position.set(0, this.height / 2 + 0.95, 3.5);
    this.trainModel.add(interiorCore);
  }

  /**
   * Roof Detailing: Streamlined Air Intake Fins & Pantograph
   */
  buildRoofDetails() {
    // Air conditioning / intake cowlings
    const cowlGeom = new THREE.BoxGeometry(this.width * 0.55, 0.35, 4.5);
    const cowl1 = new THREE.Mesh(cowlGeom, this.accentMaterial);
    cowl1.position.set(0, this.height + 0.8, 1.5);
    this.trainModel.add(cowl1);

    const cowl2 = new THREE.Mesh(cowlGeom, this.accentMaterial);
    cowl2.position.set(0, this.height + 0.8, 8.5);
    this.trainModel.add(cowl2);

    // Aerodynamic High-Speed Pantograph (Z-arm)
    const pantograph = new THREE.Group();
    pantograph.position.set(0, this.height + 0.78, 12);

    const baseGeom = new THREE.BoxGeometry(1.6, 0.15, 2.2);
    const pBase = new THREE.Mesh(baseGeom, this.wheelMaterial);
    pantograph.add(pBase);

    // Collector bar
    const barGeom = new THREE.BoxGeometry(2.4, 0.08, 0.15);
    const pBar = new THREE.Mesh(barGeom, this.accentMaterial);
    pBar.position.set(0, 1.6, 0);
    pantograph.add(pBar);

    this.trainModel.add(pantograph);
  }

  /**
   * Undercarriage Bogies and Steel Wheel Assemblies positioned precisely on the rails
   */
  buildUndercarriage() {
    const gauge = 2.4; // matches rail gauge exactly
    const bogieZPositions = [-this.length / 2 + 6, 2, this.length / 2 - 2];

    this.wheels = [];

    bogieZPositions.forEach((bogieZ) => {
      const bogie = new THREE.Group();
      bogie.position.set(0, 0.45, bogieZ);

      // Bogie frame
      const frameGeom = new THREE.BoxGeometry(this.width * 0.85, 0.3, 4.2);
      const frame = new THREE.Mesh(frameGeom, this.wheelMaterial);
      bogie.add(frame);

      // 4 wheels per bogie (2 axles)
      [-1.4, 1.4].forEach((axleZ) => {
        // Left wheel
        const wheelGeom = new THREE.CylinderGeometry(0.44, 0.44, 0.14, 16);
        wheelGeom.rotateZ(Math.PI / 2);

        const leftWheel = new THREE.Mesh(wheelGeom, this.wheelMaterial);
        leftWheel.position.set(-gauge / 2, 0, axleZ);
        bogie.add(leftWheel);
        this.wheels.push(leftWheel);

        // Right wheel
        const rightWheel = new THREE.Mesh(wheelGeom, this.wheelMaterial);
        rightWheel.position.set(gauge / 2, 0, axleZ);
        bogie.add(rightWheel);
        this.wheels.push(rightWheel);
      });

      this.trainModel.add(bogie);
    });
  }

  /**
   * Dual High-Intensity Forward Headlights & Atmospheric Beams
   */
  buildLighting() {
    const noseZ = -this.length / 2 - 0.15;
    const lightY = 1.35;
    const lightSpread = 0.95;

    // Dual LED Headlight lenses
    const lensGeom = new THREE.SphereGeometry(0.2, 12, 12);

    const leftLens = new THREE.Mesh(lensGeom, this.headlightMaterial);
    leftLens.position.set(-lightSpread, lightY, noseZ);
    this.trainModel.add(leftLens);

    const rightLens = new THREE.Mesh(lensGeom, this.headlightMaterial);
    rightLens.position.set(lightSpread, lightY, noseZ);
    this.trainModel.add(rightLens);

    // Real Forward Spotlight casting bright beam down the tracks
    this.headlightSpot = new THREE.SpotLight(0xdff4ff, 5.5);
    this.headlightSpot.position.set(0, lightY + 0.2, noseZ);
    this.headlightSpot.target.position.set(0, 0.2, noseZ - 70);
    this.headlightSpot.angle = Math.PI / 7;
    this.headlightSpot.penumbra = 0.65;
    this.headlightSpot.distance = 110;
    this.headlightSpot.castShadow = true;

    this.trainModel.add(this.headlightSpot);
    this.trainModel.add(this.headlightSpot.target);

    // Subtle Undercarriage Cyan Ambient Glow
    const underGlow = new THREE.PointLight(0x00f0ff, 2.2, 8);
    underGlow.position.set(0, 0.5, 0);
    this.trainModel.add(underGlow);
  }

  /**
   * Sets world position directly
   */
  setTrainPosition(x, y, z) {
    this.state.position.set(x, y, z);
    this.group.position.copy(this.state.position);
  }

  /**
   * Sets forward travel direction vector
   */
  setTrainDirection(dirVector, deltaTime) {
    this.state.direction.copy(dirVector).normalize();
    this.directionTarget.copy(this.group.position).add(this.state.direction);
    this.orientationTarget.position.copy(this.group.position);
    this.orientationTarget.lookAt(this.directionTarget);

    if (deltaTime === undefined) {
      this.group.quaternion.copy(this.orientationTarget.quaternion);
    } else {
      const blend = 1 - Math.exp(-8 * deltaTime);
      this.group.quaternion.slerp(this.orientationTarget.quaternion, blend);
    }
  }

  /**
   * Sets target speed
   */
  setTrainSpeed(speed) {
    this.state.targetSpeed = Math.max(-this.state.maxSpeed, Math.min(this.state.maxSpeed, speed));
  }

  /**
   * Updates train position and orientation along track path
   */
  updatePositionFromProgress(deltaTime) {
    if (!this.track) return;

    const point = this.track.getPointAt(this.state.progress);
    const tangent = this.track.getTangentAt(this.state.progress);

    // Center train vertically on top of rails (rail height offset)
    const railOffset = 0.28;
    this.setTrainPosition(point.x, point.y + railOffset, point.z);
    this.setTrainDirection(tangent, deltaTime);
  }

  /**
   * Main per-frame physics / kinematic update loop
   */
  updateTrain(deltaTime) {
    const dt = Math.min(deltaTime, 0.1);

    // Accelerate / decelerate toward target speed
    if (this.state.speed !== this.state.targetSpeed) {
      const reversing = this.state.speed !== 0 &&
        Math.sign(this.state.speed) !== Math.sign(this.state.targetSpeed);
      const slowing = Math.abs(this.state.targetSpeed) < Math.abs(this.state.speed);
      const rate = reversing || slowing ? this.state.deceleration : this.state.acceleration;
      const difference = this.state.targetSpeed - this.state.speed;
      this.state.speed += Math.sign(difference) * Math.min(Math.abs(difference), rate * dt);
    }

    if (this.state.speed !== 0 && this.track) {
      const distance = this.state.speed * dt;
      const progressDelta = distance / this.track.totalLength;
      const nextProgress = this.state.progress + progressDelta;
      this.state.progress = Math.max(0, Math.min(1, nextProgress));
      if (this.state.progress === 0 || this.state.progress === 1) {
        this.state.speed = 0;
        this.state.targetSpeed = 0;
      }
      this.updatePositionFromProgress(dt);

      // Spin wheels proportionally to speed
      const wheelAngularSpeed = this.state.speed / 0.44;
      if (this.wheels) {
        this.wheels.forEach((w) => {
          w.rotation.x += wheelAngularSpeed * dt;
        });
      }
    }
  }

  /**
   * Returns current train state object
   */
  getState() {
    return this.state;
  }

  /**
   * Returns train root mesh group
   */
  getMesh() {
    return this.group;
  }
}
