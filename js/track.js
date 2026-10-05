/**
 * Railway Track System
 * Builds a continuous spline railway with reusable instanced track components.
 */
import * as THREE from 'three';

export class RailwayTrackSystem {
  constructor({ scene, length = 600, segmentLength = 20 }) {
    this.scene = scene;
    this.totalLength = length;
    this.segmentLength = segmentLength;

    // Track gauge standard dimensions (Three.js units)
    this.railGauge = 2.4;       // distance between rails
    this.railHeight = 0.28;
    this.railWidth = 0.14;
    this.sleeperSpacing = 1.25;  // distance between ties
    this.sleeperWidth = 3.6;
    this.sleeperHeight = 0.24;
    this.sleeperDepth = 0.55;

    this.group = new THREE.Group();
    this.group.name = 'RailwayTrack';

    // Materials
    this.initMaterials();

    // Define route data independently from its rendered geometry.
    this.initPath();

    // Build the track segments
    this.buildTrack();

    if (this.scene) {
      this.scene.add(this.group);
    }
  }

  initMaterials() {
    // Highly polished steel rails with anisotropic specular look
    this.railMaterial = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      metalness: 0.92,
      roughness: 0.18,
      envMapIntensity: 1.2
    });

    // Dark concrete / reinforced railway sleepers
    this.sleeperMaterial = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      metalness: 0.2,
      roughness: 0.85
    });

    // Ballast gravel railway bed
    this.ballastMaterial = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.1,
      roughness: 0.95
    });

    // Steel catenary overhead structures
    this.catenaryMaterial = new THREE.MeshStandardMaterial({
      color: 0x334155,
      metalness: 0.75,
      roughness: 0.35
    });

    // Overhead high-voltage line
    this.wireMaterial = new THREE.LineBasicMaterial({
      color: 0x64748b,
      transparent: true,
      opacity: 0.7
    });

    // Signal lantern glowing materials
    this.signalGreenMaterial = new THREE.MeshBasicMaterial({ color: 0x10b981 });
    this.signalAmberMaterial = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
  }

  /**
   * Defines a continuous route with a straight approach, broad turns and an S-curve.
   */
  initPath() {
    const route = [
      [0, 0, 100], [0, 0, 20], [2, 0, -60],
      [18, 0, -125], [43, 0, -185], [62, 0, -255],
      [61, 0, -325], [39, 0, -385], [4, 0, -430],
      [-34, 0, -470], [-56, 0, -525], [-52, 0, -585],
      [-25, 0, -640], [14, 0, -680], [42, 0, -730],
      [40, 0, -790], [17, 0, -850], [-2, 0, -920]
    ];

    this.routePoints = route.map(([x, y, z]) => new THREE.Vector3(x, y, z));
    this.curve = new THREE.CatmullRomCurve3(this.routePoints, false, 'centripetal');
    this.curve.arcLengthDivisions = Math.max(200, Math.ceil(this.curve.getLength() * 2));
    this.curve.updateArcLengths();
    this.totalLength = this.curve.getLength();
    this.routeSections = [
      { name: 'starting_section', progress: 0 },
      { name: 'gentle_curve', progress: 0.15 },
      { name: 'left_turn', progress: 0.33 },
      { name: 'straight', progress: 0.55 },
      { name: 'right_turn', progress: 0.66 },
      { name: 's_curve', progress: 0.77 },
      { name: 'final_straight', progress: 0.93 }
    ];
  }

  /**
   * Returns world position at progress t (0 to 1)
   */
  getPointAt(t, target) {
    return this.curve.getPointAt(Math.max(0, Math.min(1, t)), target);
  }

  /**
   * Returns normalized tangent direction at progress t (0 to 1)
   */
  getTangentAt(t, target) {
    return this.curve.getTangentAt(Math.max(0, Math.min(1, t)), target);
  }

  getSectionAtProgress(progress) {
    const normalizedProgress = Math.max(0, Math.min(1, progress));
    for (let i = this.routeSections.length - 1; i >= 0; i--) {
      if (normalizedProgress >= this.routeSections[i].progress) {
        return this.routeSections[i].name;
      }
    }
    return this.routeSections[0].name;
  }

  /**
   * Returns track elevation at distance
   */
  getYAtZ(z) {
    return this.getPointAt(this.getProgressAtZ(z)).y;
  }

  getProgressAtZ(z) {
    let closestProgress = 0;
    let closestDistance = Infinity;
    const samples = Math.ceil(this.totalLength / 4);

    for (let i = 0; i <= samples; i++) {
      const progress = i / samples;
      const point = this.getPointAt(progress);
      const distance = Math.abs(point.z - z);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestProgress = progress;
      }
    }

    return closestProgress;
  }

  /**
   * Constructs all components of the railway
   */
  buildTrack() {
    this.buildBallast();
    this.buildRails();
    this.buildSleepers();
    this.buildCatenaryPylons();
  }

  /**
   * Builds the raised gravel ballast bed
   */
  buildBallast() {
    const spacing = 3.5;
    const count = Math.ceil(this.totalLength / spacing);
    const geometry = new THREE.BoxGeometry(5.4, 0.58, spacing + 0.15);
    const ballast = new THREE.InstancedMesh(geometry, this.ballastMaterial, count);
    const dummy = new THREE.Object3D();
    const frame = new THREE.Matrix4();
    const tangent = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);

    for (let i = 0; i < count; i++) {
      const progress = Math.min(1, (i * spacing) / this.totalLength);
      const point = this.getPointAt(progress);
      this.getTrackFrame(progress, tangent, right, up, frame);
      dummy.position.set(point.x, point.y - 0.29, point.z);
      dummy.quaternion.setFromRotationMatrix(frame);
      dummy.updateMatrix();
      ballast.setMatrixAt(i, dummy.matrix);
    }

    ballast.receiveShadow = true;
    ballast.instanceMatrix.needsUpdate = true;
    this.group.add(ballast);
  }

  /**
   * Builds left and right steel rails using optimized extruded geometry
   */
  buildRails() {
    const divisions = Math.ceil(this.totalLength / 1.5);
    const railPaths = [[], []];
    const tangent = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const frame = new THREE.Matrix4();

    for (let i = 0; i <= divisions; i++) {
      const progress = i / divisions;
      const point = this.getPointAt(progress);
      this.getTrackFrame(progress, tangent, right, up, frame);
      for (let rail = 0; rail < 2; rail++) {
        const side = rail === 0 ? -1 : 1;
        railPaths[rail].push(point.clone()
          .addScaledVector(right, side * this.railGauge / 2)
          .add(new THREE.Vector3(0, this.railHeight / 2, 0)));
      }
    }

    railPaths.forEach((points) => {
      const geometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points, false, 'centripetal'),
        divisions,
        this.railHeight / 2,
        6,
        false
      );
      const rail = new THREE.Mesh(geometry, this.railMaterial);
      rail.castShadow = true;
      rail.receiveShadow = true;
      this.group.add(rail);
    });
  }

  /**
   * Builds concrete sleepers (ties) using InstancedMesh for maximum GPU efficiency
   */
  buildSleepers() {
    const count = Math.floor(this.totalLength / this.sleeperSpacing) + 1;
    const sleeperGeom = new THREE.BoxGeometry(
      this.sleeperWidth,
      this.sleeperHeight,
      this.sleeperDepth
    );

    const instancedSleepers = new THREE.InstancedMesh(
      sleeperGeom,
      this.sleeperMaterial,
      count
    );
    instancedSleepers.castShadow = true;
    instancedSleepers.receiveShadow = true;

    const dummy = new THREE.Object3D();
    const tangent = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const frame = new THREE.Matrix4();

    for (let i = 0; i < count; i++) {
      const progress = Math.min(1, (i * this.sleeperSpacing) / this.totalLength);
      const point = this.getPointAt(progress);
      this.getTrackFrame(progress, tangent, right, up, frame);
      dummy.position.set(point.x, point.y - this.sleeperHeight / 2, point.z);
      dummy.quaternion.setFromRotationMatrix(frame);
      dummy.scale.set(1, 1, 1);
      dummy.updateMatrix();
      instancedSleepers.setMatrixAt(i, dummy.matrix);
    }

    instancedSleepers.instanceMatrix.needsUpdate = true;
    this.group.add(instancedSleepers);
  }

  /**
   * Builds overhead catenary electric support gantries along the line
   */
  buildCatenaryPylons() {
    const spacing = 45;
    const count = Math.floor(this.totalLength / spacing) + 1;
    const pylonGroup = new THREE.Group();
    const template = this.createSingleGantry();
    const tangent = new THREE.Vector3();
    const right = new THREE.Vector3();
    const up = new THREE.Vector3(0, 1, 0);
    const frame = new THREE.Matrix4();
    const wirePoints = [];

    for (let i = 0; i < count; i++) {
      const progress = Math.min(1, (i * spacing) / this.totalLength);
      const point = this.getPointAt(progress);
      this.getTrackFrame(progress, tangent, right, up, frame);
      const gantry = template.clone();
      gantry.position.copy(point);
      gantry.quaternion.setFromRotationMatrix(frame);
      pylonGroup.add(gantry);
      wirePoints.push(point.clone().add(new THREE.Vector3(0, 6.2, 0)));
    }

    const wireGeom = new THREE.BufferGeometry().setFromPoints(wirePoints);
    const wire = new THREE.Line(wireGeom, this.wireMaterial);
    pylonGroup.add(wire);

    this.group.add(pylonGroup);
  }

  getTrackFrame(progress, tangent, right, up, frame) {
    this.getTangentAt(progress, tangent);
    right.crossVectors(up, tangent).normalize();
    up.set(0, 1, 0);
    frame.makeBasis(right, up, tangent);
    return frame;
  }

  /**
   * Helper to build a single arching high-tech catenary portal
   */
  createSingleGantry() {
    const gantry = new THREE.Group();
    const height = 7.5;
    const span = 9.2;
    const mastRadius = 0.16;

    // Left and Right Vertical Masts
    const mastGeom = new THREE.CylinderGeometry(mastRadius * 0.8, mastRadius, height, 8);
    const leftMast = new THREE.Mesh(mastGeom, this.catenaryMaterial);
    leftMast.position.set(-span / 2, height / 2, 0);
    gantry.add(leftMast);

    const rightMast = new THREE.Mesh(mastGeom, this.catenaryMaterial);
    rightMast.position.set(span / 2, height / 2, 0);
    gantry.add(rightMast);

    // Horizontal Overhead Crossbeam Truss
    const beamGeom = new THREE.BoxGeometry(span, 0.35, 0.45);
    const crossbeam = new THREE.Mesh(beamGeom, this.catenaryMaterial);
    crossbeam.position.set(0, height - 0.2, 0);
    gantry.add(crossbeam);

    // Drop insulators
    const insulatorGeom = new THREE.CylinderGeometry(0.06, 0.06, 0.9, 6);
    const insulator = new THREE.Mesh(insulatorGeom, this.sleeperMaterial);
    insulator.position.set(0, height - 0.8, 0);
    gantry.add(insulator);

    // Trackside Signal Lantern on alternating gantries
    if (Math.random() > 0.5) {
      const signalBox = new THREE.Mesh(
        new THREE.BoxGeometry(0.35, 0.7, 0.25),
        this.sleeperMaterial
      );
      signalBox.position.set(-span / 2 + 0.45, 3.8, 0);

      const lens = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        this.signalGreenMaterial
      );
      lens.position.set(-span / 2 + 0.45, 3.95, 0.14);
      gantry.add(signalBox);
      gantry.add(lens);
    }

    return gantry;
  }
}
