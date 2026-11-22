// Geometry helpers: collision and line of sight for the museum floor.
// Everything here is pure math, no game state, so it is easy to test.
import { ROOM, OBSTACLES } from './config.js';

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(bx - ax, by - ay);
}

export function angleTo(ax, ay, bx, by) {
  return Math.atan2(by - ay, bx - ax);
}

// Smallest absolute difference between two angles, in radians.
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

// Is a point inside a rectangle?
export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// Push a circle out of a rectangle; returns the corrected centre.
export function resolveCircleRect(cx, cy, radius, r) {
  const nx = clamp(cx, r.x, r.x + r.w);
  const ny = clamp(cy, r.y, r.y + r.h);
  const dx = cx - nx;
  const dy = cy - ny;
  const d2 = dx * dx + dy * dy;
  if (d2 >= radius * radius) return { x: cx, y: cy };
  if (d2 === 0) return { x: cx, y: r.y - radius }; // centre inside: push up
  const d = Math.sqrt(d2);
  const push = (radius - d) / d;
  return { x: cx + dx * push, y: cy + dy * push };
}

// Keep a circle inside the room and out of every pedestal.
export function resolveRoomCollision(x, y, radius) {
  let px = clamp(x, ROOM.x + radius, ROOM.x + ROOM.w - radius);
  let py = clamp(y, ROOM.y + radius, ROOM.y + ROOM.h - radius);
  for (const o of OBSTACLES) {
    const fixed = resolveCircleRect(px, py, radius, o);
    px = fixed.x;
    py = fixed.y;
  }
  return { x: px, y: py };
}

// Does segment (ax,ay)-(bx,by) cross rectangle r? Used for sight lines.
export function segmentHitsRect(ax, ay, bx, by, r) {
  if (pointInRect(ax, ay, r) || pointInRect(bx, by, r)) return true;
  const edges = [
    [r.x, r.y, r.x + r.w, r.y],
    [r.x + r.w, r.y, r.x + r.w, r.y + r.h],
    [r.x + r.w, r.y + r.h, r.x, r.y + r.h],
    [r.x, r.y + r.h, r.x, r.y],
  ];
  for (const [cx, cy, dx, dy] of edges) {
    if (segmentsCross(ax, ay, bx, by, cx, cy, dx, dy)) return true;
  }
  return false;
}

function segmentsCross(ax, ay, bx, by, cx, cy, dx, dy) {
  const d1 = (dx - cx) * (ay - cy) - (dy - cy) * (ax - cx);
  const d2 = (dx - cx) * (by - cy) - (dy - cy) * (bx - cx);
  const d3 = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
  const d4 = (bx - ax) * (dy - ay) - (by - ay) * (dx - ax);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
    ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

// True when nothing (pedestal) stands between the two points.
export function hasLineOfSight(ax, ay, bx, by) {
  for (const o of OBSTACLES) {
    if (segmentHitsRect(ax, ay, bx, by, o)) return false;
  }
  return true;
}

// True when a point lies inside a vision cone and can be seen.
export function insideVisionCone(eyeX, eyeY, facing, range, halfAngle, tx, ty) {
  const d = dist(eyeX, eyeY, tx, ty);
  if (d > range) return false;
  if (d < 12) return true; // right under the watcher's nose
  if (angleDiff(angleTo(eyeX, eyeY, tx, ty), facing) > halfAngle) return false;
  return hasLineOfSight(eyeX, eyeY, tx, ty);
}
