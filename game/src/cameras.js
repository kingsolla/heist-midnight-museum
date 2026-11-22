// CCTV cameras: fixed mounts that sweep a cone back and forth across the
// room. A camera never chases, but being caught in its sweep drives the
// alarm up fast, and it beeps a warning when it spots the thief.
import {
  CAMERA_CONE_RANGE, CAMERA_CONE_HALF_ANGLE,
} from './config.js';
import { insideVisionCone } from './world.js';

export class Camera {
  constructor(mount) {
    this.x = mount.x;
    this.y = mount.y;
    this.baseAngle = mount.baseAngle;
    this.sweep = mount.sweep;
    this.speed = mount.speed;
    this.phase = mount.phase;
    this.time = mount.phase;
    this.facing = mount.baseAngle;
    this.spotted = false; // currently sees the thief
    this.beeped = false;
  }

  update(dt) {
    this.time += dt;
    // Pendulum sweep: sine wave around the base angle.
    this.facing = this.baseAngle + Math.sin(this.time * this.speed) * this.sweep;
  }

  // Returns true while the thief is inside the sweeping cone.
  watch(thief, thiefHiddenBySmoke) {
    if (thiefHiddenBySmoke) {
      this.spotted = false;
      this.beeped = false;
      return false;
    }
    this.spotted = insideVisionCone(
      this.x, this.y, this.facing,
      CAMERA_CONE_RANGE, CAMERA_CONE_HALF_ANGLE, thief.x, thief.y,
    );
    if (!this.spotted) this.beeped = false;
    return this.spotted;
  }

  // True only on the first frame of a fresh spotting, for the warning beep.
  freshSpot() {
    if (this.spotted && !this.beeped) {
      this.beeped = true;
      return true;
    }
    return false;
  }
}
