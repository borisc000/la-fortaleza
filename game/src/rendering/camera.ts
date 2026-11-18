import * as THREE from 'three';
import { CAMERA } from '../content/config.ts';
import { cameraRadius, recoverDistance, safeCameraDistance } from './collision.ts';
import type { Obstacle } from './collision.ts';

export class ThirdPersonCamera {
  readonly camera = new THREE.PerspectiveCamera(CAMERA.fov, 1, CAMERA.near, CAMERA.far);
  readonly target = new THREE.Vector3(0, CAMERA.targetHeight, 0);
  yaw = 0; pitch: number = CAMERA.pitch; desiredDistance: number = CAMERA.distance; distance: number = CAMERA.distance;
  obstructed = false;
  private direction = new THREE.Vector3();
  setDistance(distance: number) {
    if (Number.isFinite(distance)) this.desiredDistance = THREE.MathUtils.clamp(distance, CAMERA.minDistance, CAMERA.maxDistance);
  }
  zoom(deltaPixels: number) {
    this.setDistance(this.desiredDistance + THREE.MathUtils.clamp(deltaPixels * CAMERA.wheelSensitivity, -1, 1));
  }
  rotate(dx: number, dy: number, sensitivity = 0.003, invert = false) {
    this.yaw -= dx * sensitivity;
    this.pitch = THREE.MathUtils.clamp(this.pitch + dy * sensitivity * (invert ? -1 : 1), CAMERA.minPitch, CAMERA.maxPitch);
  }
  reset(yaw: number) { this.yaw = yaw; this.pitch = CAMERA.pitch; this.distance = this.desiredDistance; }
  resize(width: number, height: number) { this.camera.aspect = width / Math.max(1, height); this.camera.updateProjectionMatrix(); }
  update(position: THREE.Vector3, obstacles: readonly Obstacle[], dt: number) {
    this.target.copy(position).y += CAMERA.targetHeight;
    this.direction.set(Math.sin(this.yaw) * Math.cos(this.pitch), Math.sin(this.pitch), Math.cos(this.yaw) * Math.cos(this.pitch));
    const safe = safeCameraDistance(this.target, this.direction, this.desiredDistance, cameraRadius(this.camera.fov, this.camera.aspect, this.camera.near), obstacles);
    this.obstructed = safe < this.desiredDistance - 0.05;
    this.distance = recoverDistance(this.distance, safe, dt, CAMERA.recovery);
    this.camera.position.copy(this.target).addScaledVector(this.direction, this.distance);
    this.camera.lookAt(this.target);
  }
}
