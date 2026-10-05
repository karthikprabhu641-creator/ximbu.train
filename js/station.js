/**
 * 3D Station Component (Phase 4)
 * Procedurally constructs and manages a futuristic, cinematic railway station
 * aligned precisely to the railway curve at a designated spline progress.
 */
import * as THREE from 'three';

export class Station {
  constructor({ config, track, scene }) {
    this.config = config;
    this.track = track;
    this.scene = scene;

    this.id = config.id;
    this.name = config.name;
    this.category = config.category;
    this.progress = config.progress;
    this.triggerDistance = config.triggerDistance || 0.024;
    this.platformSide = config.platformSide || 'right';
    this.accentColor = config.accentColor || 0x00e5ff;

    this.state = 'inactive'; // 'inactive', 'approaching', 'stopping', 'stopped', 'selected', 'content_open', 'leaving'
    this.signGlowIntensity = 1.0;
    this.targetGlowIntensity = 1.0;
    this.time = 0;

    this.group = new THREE.Group();
    this.group.name = `Station_${this.id}`;

    // World transform cache
    this.worldPosition = new THREE.Vector3();
    this.worldTangent = new THREE.Vector3();
    this.platformOffset = new THREE.Vector3();

    this.init();

    if (this.scene) {
      this.scene.add(this.group);
    }
  }

  /**
   * Initializes station geometry, alignment on track spline, materials, and props
   */
  init() {
    if (!this.track) return;

    // 1. Calculate track position & frame at station progress
    this.track.getPointAt(this.progress, this.worldPosition);
    this.track.getTangentAt(this.progress, this.worldTangent);

    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(this.worldTangent, up).normalize();
    const sideMultiplier = this.platformSide === 'left' ? -1 : 1;

    // Build rotation frame aligned with track curve
    const trackFrame = new THREE.Matrix4().makeBasis(
      right,
      up,
      this.worldTangent
    );
    this.group.quaternion.setFromRotationMatrix(trackFrame);

    // Platform center offset: clearance from train centerline (3.6m) + half platform width (2.2m)
    const lateralDistance = 3.65 * sideMultiplier;
    this.platformOffset.copy(right).multiplyScalar(lateralDistance);

    // Station root sits at track level
    this.group.position.copy(this.worldPosition).add(this.platformOffset);
    // Align platform vertically with top of rail (0.28m)
    this.group.position.y = this.worldPosition.y + 0.28;

    // 2. Build station architectural elements
    this.buildPlatform(sideMultiplier);
    this.buildCanopy(sideMultiplier);
    this.buildStationSign(sideMultiplier);
    this.buildProps(sideMultiplier);
    this.buildPlatformLighting(sideMultiplier);
  }

  /**
   * Builds the raised dark concrete platform with tactile warning strip and neon edge line
   */
  buildPlatform(sideMultiplier) {
    const platformLength = 36;
    const platformWidth = 4.4;
    const platformHeight = 0.58;

    this.platformLength = platformLength;

    // Platform Deck (Dark architectural concrete / slate composite)
    const deckGeometry = new THREE.BoxGeometry(platformWidth, platformHeight, platformLength);
    const deckMaterial = new THREE.MeshStandardMaterial({
      color: 0x141a24,
      metalness: 0.35,
      roughness: 0.82
    });
    const deck = new THREE.Mesh(deckGeometry, deckMaterial);
    deck.position.set(0, platformHeight / 2, 0);
    deck.receiveShadow = true;
    this.group.add(deck);

    // Platform Trackside Curb Trim (High-tech titanium bevel)
    const curbSide = -sideMultiplier * (platformWidth / 2 - 0.12);
    const curbGeom = new THREE.BoxGeometry(0.24, platformHeight + 0.04, platformLength);
    const curbMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.88,
      roughness: 0.25
    });
    const curb = new THREE.Mesh(curbGeom, curbMaterial);
    curb.position.set(curbSide, platformHeight / 2, 0);
    this.group.add(curb);

    // Glowing Platform Edge LED Strip
    const edgeStripGeom = new THREE.BoxGeometry(0.08, 0.04, platformLength);
    this.edgeNeonMaterial = new THREE.MeshBasicMaterial({
      color: this.accentColor
    });
    const edgeStrip = new THREE.Mesh(edgeStripGeom, this.edgeNeonMaterial);
    edgeStrip.position.set(curbSide, platformHeight + 0.02, 0);
    this.group.add(edgeStrip);

    // High-friction tactile safety strip
    const tactileGeom = new THREE.BoxGeometry(0.45, 0.02, platformLength - 0.6);
    const tactileMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.1,
      roughness: 0.95
    });
    const tactile = new THREE.Mesh(tactileGeom, tactileMat);
    tactile.position.set(curbSide + (sideMultiplier * 0.45), platformHeight + 0.01, 0);
    this.group.add(tactile);
  }

  /**
   * Builds an aerodynamic cantilevered station canopy
   */
  buildCanopy(sideMultiplier) {
    const canopyLength = 26;
    const canopyWidth = 4.8;
    const canopyHeight = 4.2;

    const canopyGroup = new THREE.Group();

    // Steel support pylons on the outer platform edge
    const outerX = sideMultiplier * 1.8;
    const pylonGeom = new THREE.BoxGeometry(0.28, canopyHeight, 0.35);
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.85,
      roughness: 0.3
    });

    const pylonOffsets = [-9, 0, 9];
    pylonOffsets.forEach((z) => {
      const pylon = new THREE.Mesh(pylonGeom, pylonMat);
      pylon.position.set(outerX, canopyHeight / 2 + 0.58, z);
      pylon.castShadow = true;
      canopyGroup.add(pylon);

      // Cantilever crossarm extending over the platform
      const armGeom = new THREE.BoxGeometry(canopyWidth * 0.88, 0.18, 0.28);
      const arm = new THREE.Mesh(armGeom, pylonMat);
      arm.position.set(-sideMultiplier * 0.3, canopyHeight + 0.58, z);
      canopyGroup.add(arm);
    });

    // Glass / translucent composite roof canopy
    const roofGeom = new THREE.BoxGeometry(canopyWidth, 0.1, canopyLength);
    const roofMat = new THREE.MeshPhysicalMaterial({
      color: 0x0b1320,
      metalness: 0.2,
      roughness: 0.1,
      transmission: 0.65,
      thickness: 0.25,
      transparent: true,
      opacity: 0.85
    });
    const roof = new THREE.Mesh(roofGeom, roofMat);
    roof.position.set(0, canopyHeight + 0.65, 0);
    canopyGroup.add(roof);

    // Glowing architectural roof rib neon
    const roofNeonGeom = new THREE.BoxGeometry(canopyWidth, 0.05, 0.12);
    pylonOffsets.forEach((z) => {
      const rib = new THREE.Mesh(roofNeonGeom, this.edgeNeonMaterial);
      rib.position.set(0, canopyHeight + 0.72, z);
      canopyGroup.add(rib);
    });

    this.group.add(canopyGroup);
  }

  /**
   * Builds the illuminated 3D station totem & signage with high-contrast text
   */
  buildStationSign(sideMultiplier) {
    const signGroup = new THREE.Group();

    // 1. Dynamic Canvas Texture for Station Header
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 340;
    const ctx = canvas.getContext('2d');

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, 1024, 0);
    bgGrad.addColorStop(0, '#040810');
    bgGrad.addColorStop(0.5, '#0a1424');
    bgGrad.addColorStop(1, '#040810');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1024, 340);

    // Accent line borders
    const hexAccent = '#' + this.accentColor.toString(16).padStart(6, '0');
    ctx.strokeStyle = hexAccent;
    ctx.lineWidth = 6;
    ctx.strokeRect(14, 14, 996, 312);

    // Station Terminal ID
    ctx.fillStyle = hexAccent;
    ctx.font = '700 36px "Orbitron", monospace, sans-serif';
    ctx.letterSpacing = '8px';
    ctx.fillText(`STATION // ${this.id.toUpperCase()} • KM ${Math.round(this.progress * 100)}`, 48, 76);

    // Big Bold Station Name
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 84px "Syncopate", "Orbitron", sans-serif';
    ctx.letterSpacing = '6px';
    ctx.fillText(this.name, 48, 185);

    // Category / Subtitle
    ctx.fillStyle = '#94a3b8';
    ctx.font = '600 38px "Space Grotesk", sans-serif';
    ctx.letterSpacing = '4px';
    ctx.fillText(`ARCHIVE // ${this.category.toUpperCase()}`, 48, 270);

    // Right-hand status indicator beacon
    ctx.fillStyle = hexAccent;
    ctx.beginPath();
    ctx.arc(930, 170, 28, 0, Math.PI * 2);
    ctx.fill();

    const signTexture = new THREE.CanvasTexture(canvas);
    signTexture.anisotropy = 8;

    // Sign Box Geometry (Double-sided sign facing both arrival directions)
    const signBoxGeom = new THREE.BoxGeometry(0.18, 1.8, 5.2);
    this.signMaterial = new THREE.MeshStandardMaterial({
      map: signTexture,
      emissive: this.accentColor,
      emissiveMap: signTexture,
      emissiveIntensity: 0.65,
      metalness: 0.8,
      roughness: 0.2
    });

    const signMesh = new THREE.Mesh(signBoxGeom, this.signMaterial);
    // Face toward approaching train
    signMesh.position.set(-sideMultiplier * 0.4, 4.4, -4);
    signMesh.rotation.y = Math.PI / 2;
    signGroup.add(signMesh);

    // Totem mounting mast
    const totemPylonGeom = new THREE.CylinderGeometry(0.08, 0.12, 3.4, 8);
    const totemMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
    const pylon1 = new THREE.Mesh(totemPylonGeom, totemMat);
    pylon1.position.set(-sideMultiplier * 0.4, 2.3, -5.8);
    const pylon2 = new THREE.Mesh(totemPylonGeom, totemMat);
    pylon2.position.set(-sideMultiplier * 0.4, 2.3, -2.2);
    signGroup.add(pylon1);
    signGroup.add(pylon2);

    this.signMesh = signMesh;
    this.group.add(signGroup);
  }

  /**
   * Builds high-tech platform props (interactive holographic kiosk, benches, bollards)
   */
  buildProps(sideMultiplier) {
    const propsGroup = new THREE.Group();

    // 1. Interactive Terminal Column (Primary Click / Touch Area)
    const kioskGroup = new THREE.Group();
    kioskGroup.name = 'InteractiveKiosk';

    const kioskBaseGeom = new THREE.BoxGeometry(0.75, 1.5, 0.75);
    const kioskBaseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.8,
      roughness: 0.3
    });
    const kioskBase = new THREE.Mesh(kioskBaseGeom, kioskBaseMat);
    kioskBase.position.set(0, 1.35, 0);
    kioskGroup.add(kioskBase);

    // Glowing interactive holographic screen angled at user
    const screenGeom = new THREE.BoxGeometry(0.65, 0.85, 0.1);
    this.kioskScreenMat = new THREE.MeshBasicMaterial({
      color: this.accentColor
    });
    const kioskScreen = new THREE.Mesh(screenGeom, this.kioskScreenMat);
    kioskScreen.position.set(0, 2.05, 0.12);
    kioskScreen.rotation.x = -Math.PI / 8;
    kioskGroup.add(kioskScreen);

    // Ground interactive pulse ring
    const ringGeom = new THREE.RingGeometry(0.8, 1.05, 32);
    this.ringMat = new THREE.MeshBasicMaterial({
      color: this.accentColor,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.65
    });
    const groundRing = new THREE.Mesh(ringGeom, this.ringMat);
    groundRing.rotation.x = -Math.PI / 2;
    groundRing.position.set(0, 0.6, 0);
    kioskGroup.add(groundRing);
    this.groundRing = groundRing;

    // Position kiosk along the center of the platform
    kioskGroup.position.set(0, 0, 0);
    propsGroup.add(kioskGroup);
    this.interactiveKiosk = kioskGroup;

    // 2. Minimalist waiting benches
    const benchGeom = new THREE.BoxGeometry(0.85, 0.42, 2.6);
    const benchMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.6,
      roughness: 0.5
    });
    [-8, 8].forEach((z) => {
      const bench = new THREE.Mesh(benchGeom, benchMat);
      bench.position.set(sideMultiplier * 0.8, 0.8, z);
      propsGroup.add(bench);
    });

    this.group.add(propsGroup);
  }

  /**
   * Builds subtle, atmospheric localized platform spotlights
   */
  buildPlatformLighting(sideMultiplier) {
    // Soft downlights on platform
    this.stationLight = new THREE.PointLight(this.accentColor, 1.2, 18, 1.8);
    this.stationLight.position.set(0, 3.8, 0);
    this.stationLight.castShadow = false; // keep fast
    this.group.add(this.stationLight);

    // Secondary sign accent light
    this.signSpotlight = new THREE.PointLight(0xffffff, 0.8, 10, 1.5);
    this.signSpotlight.position.set(-sideMultiplier * 0.4, 4.8, -4);
    this.group.add(this.signSpotlight);
  }

  /**
   * Updates station state, lighting breathing, and sign glow effects
   */
  update(delta) {
    this.time += delta;

    // Animate interactive ground ring breathing
    if (this.groundRing && this.ringMat) {
      const pulse = (Math.sin(this.time * 2.8) + 1) * 0.5;
      const baseOpacity = this.state === 'stopped' ? 0.9 : 0.45;
      this.ringMat.opacity = baseOpacity + pulse * 0.25;
      const scale = 1.0 + pulse * 0.08;
      this.groundRing.scale.set(scale, scale, 1);
    }

    // Smoothly blend sign & light intensity according to state
    if (this.state === 'approaching' || this.state === 'stopped' || this.state === 'selected') {
      this.targetGlowIntensity = 2.0;
    } else {
      this.targetGlowIntensity = 0.6;
    }

    this.signGlowIntensity += (this.targetGlowIntensity - this.signGlowIntensity) * Math.min(1, delta * 3.5);

    if (this.signMaterial) {
      this.signMaterial.emissiveIntensity = this.signGlowIntensity;
    }
    if (this.stationLight) {
      this.stationLight.intensity = this.signGlowIntensity * 1.4;
    }
  }

  /**
   * Sets the station interaction state
   */
  setState(newState) {
    this.state = newState;
    if (newState === 'stopped') {
      this.targetGlowIntensity = 2.2;
    } else if (newState === 'leaving') {
      this.targetGlowIntensity = 0.5;
    } else if (newState === 'inactive') {
      this.targetGlowIntensity = 0.6;
    }
  }

  /**
   * Returns root mesh group for scene queries or disposal
   */
  getGroup() {
    return this.group;
  }

  /**
   * Returns interactive mesh targets for raycasting
   */
  getInteractiveTargets() {
    return [this.interactiveKiosk, this.signMesh].filter(Boolean);
  }

  /**
   * Returns station coordinates for camera focus
   */
  getFocusCoordinates() {
    return {
      position: this.group.position.clone(),
      tangent: this.worldTangent.clone(),
      platformSide: this.platformSide
    };
  }

  /**
   * Cleanup
   */
  dispose() {
    if (this.scene && this.group) {
      this.scene.remove(this.group);
    }
  }
}
