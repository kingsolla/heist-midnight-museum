// Guards: patrol waypoints, watch with a vision cone, and chase the thief
// once they spot him. A guard who touches the thief ends the heist.
import {
  GUARD_PATROL_SPEED, GUARD_CHASE_SPEED, GUARD_CONE_RANGE,
  GUARD_CONE_HALF_ANGLE, GUARD_RADIUS, CATCH_DISTANCE,
} from './config.js';
import { dist, angleTo, angleDiff, insideVisionCone, resolveRoomCollision } from './world.js';

export class Guard {
  constructor(route, startIndex = 0) {
    this.route = route;
    this.x = route[startIndex].x;
    this.y = route[startIndex].y;
    this.targetIndex = (startIndex + 1) % route.length;
    this.facing = 0;
    this.alerted = false; // currently sees the thief
    this.suspicion = 0; // 0..1, builds while the thief is in the cone
    this.chaseTime = 0;
  }

  // Move along the patrol, or toward the thief while alerted.
  update(dt, thief) {
    if (this.alerted) {
      this.chaseTime += dt;
      const d = dist(this.x, this.y, thief.x, thief.y);
      if (d > 4) {
        const a = angleTo(this.x, this.y, thief.x, thief.y);
        this.facing = a;
        const step = GUARD_CHASE_SPEED * dt;
        const nx = this.x + Math.cos(a) * step;
        const ny = this.y + Math.sin(a) * step;
        const fixed = resolveRoomCollision(nx, ny, GUARD_RADIUS);
        this.x = fixed.x;
        this.y = fixed.y;
      }
      // Give up the chase after 3 seconds without a fresh sighting.
      if (this.chaseTime > 3) {
        this.alerted = false;
        this.chaseTime = 0;
        this.suspicion = 0;
      }
      return;
    }
    const target = this.route[this.targetIndex];
    const d = dist(this.x, this.y, target.x, target.y);
    const a = angleTo(this.x, this.y, target.x, target.y);
    this.facing = a;
    const step = GUARD_PATROL_SPEED * dt;
    if (d <= step) {
      this.x = target.x;
      this.y = target.y;
      this.targetIndex = (this.targetIndex + 1) % this.route.length;
    } else {
      const nx = this.x + Math.cos(a) * step;
      const ny = this.y + Math.sin(a) * step;
      const fixed = resolveRoomCollision(nx, ny, GUARD_RADIUS);
      this.x = fixed.x;
      this.y = fixed.y;
    }
  }

  // Watch the thief. dt scales suspicion so a glimpse is a warning, not an
  // instant chase: about half a second of continuous sight turns a guard.
  // Returns how exposed he is: 0 hidden, 1 glimpsed, 2 close.
  watch(thief, thiefHiddenBySmoke, dt) {
    if (thiefHiddenBySmoke) {
      this.suspicion = Math.max(0, this.suspicion - 0.8 * dt);
      if (this.suspicion <= 0) this.alerted = false;
      return 0;
    }
    const seen = insideVisionCone(
      this.x, this.y, this.facing,
      GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE, thief.x, thief.y,
    );
    if (!seen) {
      this.suspicion = Math.max(0, this.suspicion - 0.6 * dt);
      if (this.suspicion <= 0) this.alerted = false;
      return 0;
    }
    const d = dist(this.x, this.y, thief.x, thief.y);
    this.suspicion = Math.min(1, this.suspicion + 1.1 * dt);
    if (this.suspicion > 0.55) {
      this.alerted = true;
      this.chaseTime = 0;
    }
    return d < GUARD_CONE_RANGE * 0.45 ? 2 : 1;
  }

  touches(thief) {
    return dist(this.x, this.y, thief.x, thief.y) < CATCH_DISTANCE;
  }
}
export function guardCone(guard) {
  return {
    x: guard.x, y: guard.y, facing: guard.facing,
    range: GUARD_CONE_RANGE, halfAngle: GUARD_CONE_HALF_ANGLE,
    alerted: guard.alerted,
  };
}
