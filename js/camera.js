/**
 * Cinematic Follow Camera System
 * Smooth third-person interpolation (lerp) tracking behind and above the train,
 * with subtle atmospheric floating sway and responsive FOV adjustment.
 */
import * as THREE from 'three';

export class CinematicCamera {
  constructor({ container }) {
    this.container = container || window;

    const width = this.container.clientWidth || window.innerWidth;
    const height = this.container.clientHeight || window.innerHeight;

    // Perspective Camera
    this.camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 1200);

    // Camera offset relative to train in local coordinate space
    // Behind (+Z), elevated (+Y), slightly offset for dynamic cinematic framing
    this.offset = new THREE.Vector3(0, 5.2, 17.5);
    this.lookOffset = new THREE.Vector3(0, 2.2, -6.5);

    this.currentPosition = new THREE.Vector3();
    this.currentLookAt = new THREE.Vector3();

    // Lerp damping factor (smooth follow, 0.05 = velvet smooth)
    this.followSpeed = 3.2;
    this.forward = new THREE.Vector3(0, 0, -1);
    this.pathRotation = new THREE.Quaternion();
    this.desiredPosition = new THREE.Vector3();
    this.desiredLookAt = new THREE.Vector3();
    this.cameraTarget = new THREE.Object3D();

    // Floating cinematic sway timer
    this.time = 0;

    // Station Focus Mode
    this.isStationMode = false;
    this.stationFocusPosition = new THREE.Vector3();
    this.stationFocusLookAt = new THREE.Vector3();
  }

  /**
   * Focuses camera smoothly onto a station platform and architectural signage
   */
  setStationFocus(stationPos, tangent, platformSide = 'right') {
    if (!stationPos) return;
    this.isStationMode = true;

    const sideSign = platformSide === 'left' ? -1 : 1;
    const up = new THREE.Vector3(0, 1, 0);
    const normal = new THREE.Vector3().crossVectors(tangent || this.forward, up).normalize().multiplyScalar(sideSign);

    // Position camera elevated and set back from platform to view both platform & train
    this.stationFocusPosition.copy(stationPos)
      .addScaledVector(normal, 9.5)
      .addScaledVector(tangent || this.forward, -4.5);
    this.stationFocusPosition.y = stationPos.y + 4.2;

    // Look slightly elevated toward the station sign / kiosk
    this.stationFocusLookAt.copy(stationPos)
      .addScaledVector(normal, 2.5)
      .addScaledVector(tangent || this.forward, 3.0);
    this.stationFocusLookAt.y = stationPos.y + 2.4;
  }

  /**
   * Returns camera to dynamic train follow mode
   */
  clearStationFocus() {
    this.isStationMode = false;
  }

  /**
   * Initializes camera position immediately behind train without initial jump
   */
  snapToTarget(trainPosition, direction = this.forward) {
    if (!trainPosition) return;
    this.pathRotation.setFromUnitVectors(this.forward, direction);
    this.currentPosition.copy(this.offset).applyQuaternion(this.pathRotation).add(trainPosition);
    this.currentLookAt.copy(this.lookOffset).applyQuaternion(this.pathRotation).add(trainPosition);

    this.camera.position.copy(this.currentPosition);
    this.camera.lookAt(this.currentLookAt);
  }

  /**
   * Smoothly updates camera position and orientation each frame
   */
  update(trainPosition, direction, deltaTime) {
    if (!trainPosition) return;

    this.time += deltaTime || 0.016;

    if (this.isStationMode) {
      // Subtle architectural breathing motion
      const swayX = Math.sin(this.time * 0.3) * 0.15;
      const swayY = Math.cos(this.time * 0.4) * 0.1;

      this.desiredPosition.copy(this.stationFocusPosition);
      this.desiredPosition.x += swayX;
      this.desiredPosition.y += swayY;

      this.desiredLookAt.copy(this.stationFocusLookAt);

      const blend = 1 - Math.exp( -2.4 * (deltaTime || 0.016));
      this.currentPosition.lerp(this.desiredPosition, blend);
      this.currentLookAt.lerp(this.desiredLookAt, blend);

      this.camera.position.copy(this.currentPosition);
      this.cameraTarget.position.copy(this.currentPosition);
      this.cameraTarget.lookAt(this.currentLookAt);
      this.camera.quaternion.slerp(this.cameraTarget.quaternion, blend);
      return;
    }

    this.pathRotation.setFromUnitVectors(this.forward, direction || this.forward);

    // Subtle atmospheric floating sway (breathing camera)
    const swayX = Math.sin(this.time * 0.45) * 0.35;
    const swayY = Math.cos(this.time * 0.6) * 0.18;

    this.desiredPosition.copy(this.offset).applyQuaternion(this.pathRotation).add(trainPosition);
    this.desiredPosition.x += swayX;
    this.desiredPosition.y += swayY;

    this.desiredLookAt.copy(this.lookOffset).applyQuaternion(this.pathRotation).add(trainPosition);

    const blend = 1 - Math.exp(-this.followSpeed * (deltaTime || 0.016));
    this.currentPosition.lerp(this.desiredPosition, blend);
    this.currentLookAt.lerp(this.desiredLookAt, blend);

    this.camera.position.copy(this.currentPosition);
    this.cameraTarget.position.copy(this.currentPosition);
    this.cameraTarget.lookAt(this.currentLookAt);
    this.camera.quaternion.slerp(this.cameraTarget.quaternion, blend);
  }

  /**
   * Handles viewport resizing
   */
  onResize(width, height) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  getCamera() {
    return this.camera;
  }
}
