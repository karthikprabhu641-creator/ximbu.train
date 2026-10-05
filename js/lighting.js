/**
 * Cinematic Lighting System
 * Balanced ambient illumination, soft directional moonlight with shadows,
 * and atmospheric rim lights optimized for high-performance rendering.
 */
import * as THREE from 'three';

export class LightingSystem {
  constructor({ scene }) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.group.name = 'Lighting';

    this.initLights();

    if (this.scene) {
      this.scene.add(this.group);
    }
  }

  initLights() {
    // 1. Cool Deep Ambient Fill (prevents pitch-black harshness)
    this.ambientLight = new THREE.AmbientLight(0x182438, 1.4);
    this.group.add(this.ambientLight);

    // 2. Main Directional Moonlight / Dusk Light
    this.directionalLight = new THREE.DirectionalLight(0x94c8e8, 2.2);
    this.directionalLight.position.set(40, 65, 30);
    this.directionalLight.castShadow = true;

    // Shadow map optimization
    this.directionalLight.shadow.mapSize.width = 1024;
    this.directionalLight.shadow.mapSize.height = 1024;
    this.directionalLight.shadow.camera.near = 10;
    this.directionalLight.shadow.camera.far = 160;
    this.directionalLight.shadow.camera.left = -45;
    this.directionalLight.shadow.camera.right = 45;
    this.directionalLight.shadow.camera.top = 45;
    this.directionalLight.shadow.camera.bottom = -45;
    this.directionalLight.shadow.bias = -0.0008;

    this.group.add(this.directionalLight);

    // 3. Subtle Cyan Rim Light from opposing angle for dramatic cinematic contouring
    this.rimLight = new THREE.DirectionalLight(0x00e5ff, 0.75);
    this.rimLight.position.set(-50, 20, -60);
    this.group.add(this.rimLight);

    // 4. Soft Hemisphere sky/ground gradient light
    this.hemiLight = new THREE.HemisphereLight(0x283b58, 0x070c14, 0.95);
    this.group.add(this.hemiLight);
  }

  /**
   * Updates shadow camera focal position to track train
   */
  update(targetPosition) {
    if (this.directionalLight && targetPosition) {
      this.directionalLight.position.z = targetPosition.z + 30;
      this.directionalLight.target.position.copy(targetPosition);
      this.directionalLight.target.updateMatrixWorld();
    }
  }
}
