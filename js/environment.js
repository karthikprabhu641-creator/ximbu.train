/**
 * Environment System
 * Procedurally generates terrain embankments, distant mountain ridges,
 * and ambient atmospheric dust particles to establish deep cinematic scale.
 */
import * as THREE from 'three';

export class EnvironmentSystem {
  constructor({ scene, trackLength = 600 }) {
    this.scene = scene;
    this.trackLength = trackLength;

    this.group = new THREE.Group();
    this.group.name = 'Environment';

    this.initMaterials();
    this.buildTerrain();
    this.buildDistantMountains();
    this.buildAtmosphericParticles();

    if (this.scene) {
      this.scene.add(this.group);
    }
  }

  initMaterials() {
    // Dark volcanic / gravel landscape ground
    this.terrainMaterial = new THREE.MeshStandardMaterial({
      color: 0x070b12,
      roughness: 0.95,
      metalness: 0.05,
      flatShading: true
    });

    // Distant mountain silhouette material
    this.mountainMaterial = new THREE.MeshStandardMaterial({
      color: 0x05070f,
      roughness: 0.98,
      metalness: 0.0,
      flatShading: true
    });

    // Glowing cyan/white atmospheric dust particles
    this.particleMaterial = new THREE.PointsMaterial({
      color: 0x64d2ff,
      size: 0.28,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending
    });
  }

  /**
   * Generates terrain alongside the railway track
   */
  buildTerrain() {
    const width = 180;
    const depth = this.trackLength + 120;
    const segsX = 40;
    const segsZ = 80;

    const geom = new THREE.PlaneGeometry(width, depth, segsX, segsZ);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;

    // Displace vertices to create natural rolling embankments flanking the flat track bed
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Keep railway bed flat in center (-6 to +6)
      const distFromCenter = Math.abs(x);
      let elevation = 0;

      if (distFromCenter > 5) {
        // Natural rolling rise on both sides of track
        const slope = (distFromCenter - 5) * 0.18;
        const noise = Math.sin(x * 0.08) * Math.cos(z * 0.04) * 2.8 + Math.sin(z * 0.02) * 1.5;
        elevation = Math.max(0, slope + noise) - 0.5;
      } else {
        elevation = -0.55; // Slightly below ballast bed
      }

      pos.setY(i, elevation);
    }

    geom.computeVertexNormals();

    const terrain = new THREE.Mesh(geom, this.terrainMaterial);
    terrain.position.set(0, 0, -this.trackLength / 2 + 50);
    terrain.receiveShadow = true;
    this.group.add(terrain);
  }

  /**
   * Generates distant mountain ridges for cinematic horizon depth
   */
  buildDistantMountains() {
    const mountainGroup = new THREE.Group();

    // Left ridge
    this.createMountainRidge(mountainGroup, -90, -this.trackLength / 2, 28, 48);

    // Right ridge
    this.createMountainRidge(mountainGroup, 90, -this.trackLength / 2, 32, 52);

    // Far horizon backdrop ridge
    this.createMountainRidge(mountainGroup, 0, -this.trackLength - 80, 45, 75, true);

    this.group.add(mountainGroup);
  }

  createMountainRidge(parent, posX, posZ, minHeight, maxHeight, isBackdrop = false) {
    const segments = 24;
    const length = isBackdrop ? 240 : this.trackLength + 150;
    const geom = new THREE.ConeGeometry(isBackdrop ? 85 : 35, maxHeight, segments);

    const mountain = new THREE.Mesh(geom, this.mountainMaterial);
    mountain.position.set(posX, maxHeight / 2 - 5, posZ);
    mountain.scale.set(isBackdrop ? 2.5 : 1.2, 1, isBackdrop ? 0.8 : 3.5);
    parent.add(mountain);
  }

  /**
   * Generates subtle airborne dust / spark particles drifting near the track
   */
  buildAtmosphericParticles() {
    const count = 350;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const velocities = [];

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 60;
      positions[i * 3 + 1] = Math.random() * 12 + 0.5;
      positions[i * 3 + 2] = (Math.random() - 0.5) * (this.trackLength * 0.8);

      velocities.push({
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.08,
        vz: -Math.random() * 0.4 - 0.1
      });
    }

    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.particleMesh = new THREE.Points(geom, this.particleMaterial);
    this.velocities = velocities;
    this.group.add(this.particleMesh);
  }

  /**
   * Per-frame animation for ambient airborne motes
   */
  update(deltaTime) {
    if (!this.particleMesh) return;

    const pos = this.particleMesh.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let y = pos.getY(i) + this.velocities[i].vy * deltaTime;
      let z = pos.getZ(i) + this.velocities[i].vz * deltaTime;

      // Wrap particles around
      if (y < 0.2) y = 12;
      if (y > 12) y = 0.2;
      if (z < -this.trackLength) z = 40;

      pos.setY(i, y);
      pos.setZ(i, z);
    }
    pos.needsUpdate = true;
  }
}
