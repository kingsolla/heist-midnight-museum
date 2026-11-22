// Shot presets: deterministic states for reproducible screenshots.
// ?shot=start  — title screen over the room, thief at the door, alarm low.
// ?shot=play   — mid-heist: thief near the vault, one guard alerted, alarm ~60.
// ?shot=end    — the getaway: thief at the exit with the diamond, won screen.
// Each shot shows the whole room in one frame: thief, guards, cameras,
// vault and diamond, alarm meter.
import {
  THIEF_START, DIAMOND, EXIT_DOOR, GUARD_ROUTES, CAMERA_MOUNTS,
} from './config.js';
import { Guard } from './guards.js';
import { Camera } from './cameras.js';

export function buildShotState(kind) {
  const guards = GUARD_ROUTES.map((route, i) => {
    const g = new Guard(route, i);
    // Walk each guard part-way along its patrol so the frame feels alive.
    for (let step = 0; step < 3 + i * 2; step++) {
      const target = route[g.targetIndex];
      const d = Math.hypot(target.x - g.x, target.y - g.y);
      const a = Math.atan2(target.y - g.y, target.x - g.x);
      g.facing = a;
      g.x = target.x;
      g.y = target.y;
      g.targetIndex = (g.targetIndex + 1) % route.length;
      void d;
    }
    return g;
  });
  const cameras = CAMERA_MOUNTS.map((m) => {
    const c = new Camera(m);
    c.time = m.phase + 2.1;
    c.facing = m.baseAngle + Math.sin(c.time * m.speed) * m.sweep;
    return c;
  });
  const base = {
    guards,
    cameras,
    smokes: [],
    smokeLeft: 2,
    detections: 0,
    alarmPeak: 0,
    moveTarget: null,
    lostReason: null,
  };

  if (kind === 'play') {
    const thief = {
      x: 1010, y: 250, facing: -Math.PI / 2, speed: 0, hasLoot: false,
    };
    guards[1].x = 980;
    guards[1].y = 330;
    guards[1].facing = Math.atan2(thief.y - 330, thief.x - 980);
    guards[1].alerted = true;
    guards[1].suspicion = 1;
    guards[0].x = 520;
    guards[0].y = 160;
    guards[0].facing = 0;
    guards[2].x = 700;
    guards[2].y = 560;
    guards[2].facing = Math.PI;
    cameras[0].facing = Math.PI / 2 + 0.5;
    return {
      ...base,
      phase: 'playing',
      thief,
      alarm: 62,
      hasLoot: false,
      elapsed: 74,
      detections: 3,
      alarmPeak: 62,
      smokes: [{ x: 880, y: 300, left: 2.5 }],
    };
  }

  if (kind === 'end') {
    return {
      ...base,
      phase: 'won',
      thief: {
        x: EXIT_DOOR.x + 40, y: EXIT_DOOR.y + 58, facing: Math.PI, speed: 0, hasLoot: true,
      },
      alarm: 48,
      hasLoot: true,
      elapsed: 143,
      detections: 4,
      alarmPeak: 71,
    };
  }

  // Default: start.
  return {
    ...base,
    phase: 'title',
    thief: {
      x: THIEF_START.x, y: THIEF_START.y, facing: -Math.PI / 2, speed: 0, hasLoot: false,
    },
    alarm: 8,
    hasLoot: false,
    elapsed: 0,
    detections: 0,
    alarmPeak: 8,
  };
}

export function shotFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const shot = params.get('shot');
  if (shot === 'start' || shot === 'play' || shot === 'end') return shot;
  return null;
}
