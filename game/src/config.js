// Midnight at the Marlow Museum — shared tuning and room layout.
// Every number that shapes the heist lives here so the other modules stay
// small and single-purpose.
export const VIEW_W = 1280;
export const VIEW_H = 720;
export const HUD_H = 64;

// The playable room, inside the outer wall.
export const ROOM = { x: 24, y: HUD_H + 16, w: 1232, h: 600 };

// Movement speeds in pixels per second.
export const THIEF_SPEED = 205;
export const THIEF_SNEAK_SPEED = 105;
export const GUARD_PATROL_SPEED = 78;
export const GUARD_CHASE_SPEED = 150;

// Alarm (0-100). Rates are per second while the thief is exposed.
export const ALARM_DECAY = 7; // per second while fully hidden
export const ALARM_GUARD_RATE = 34; // seen by a guard, at cone edge
export const ALARM_GUARD_CLOSE = 50; // seen by a guard, close up
export const ALARM_CAMERA_RATE = 26; // seen by a camera
export const ALARM_SNEAK_FACTOR = 0.45; // sneaking halves how fast the alarm climbs
export const ALARM_LOOT_SPIKE = 12; // grabbing the diamond trips a partial alarm
export const ALARM_MAX = 100;

// Vision cones.
export const GUARD_CONE_RANGE = 235;
export const GUARD_CONE_HALF_ANGLE = 0.52; // radians either side of facing
export const CAMERA_CONE_RANGE = 265;
export const CAMERA_CONE_HALF_ANGLE = 0.42;

// Smoke pellet: blocks every cone while it lasts.
export const SMOKE_COUNT = 2;
export const SMOKE_DURATION = 4.5;
export const SMOKE_RADIUS = 95;

// The thief.
export const THIEF_RADIUS = 15;
export const GUARD_RADIUS = 16;
export const CATCH_DISTANCE = 30;

// The loot: the Star of Marlow, locked in the vault at the far wall.
export const VAULT = { x: 1088, y: 132, w: 148, h: 92 };
export const DIAMOND = { x: 1162, y: 178, r: 16 };
export const EXIT_DOOR = { x: 24, y: 560, w: 26, h: 116 };
export const THIEF_START = { x: 92, y: 618 };

// Night palette: deep blue-black room, warm pools of light.
export const COLORS = {
  floorDark: '#141a2e',
  floorLight: '#1a2140',
  wall: '#0a0d1a',
  wallEdge: '#3a4470',
  gold: '#f5c542',
  goldGlow: '#ffe9a3',
  carpet: '#5b1f2e',
  carpetEdge: '#7a2b3e',
  pedestal: '#2c355e',
  pedestalTop: '#46538c',
  exhibitGlow: '#8fb7ff',
  guardBody: '#c94f4f',
  guardAlert: '#ff2e2e',
  coneCalm: 'rgba(255, 214, 90, 0.20)',
  coneAlert: 'rgba(255, 46, 46, 0.34)',
  cameraCone: 'rgba(120, 220, 255, 0.16)',
  cameraAlert: 'rgba(255, 46, 46, 0.30)',
  thiefCoat: '#20242e',
  thiefTrim: '#f5c542',
  hudBg: '#0b0e1c',
  hudText: '#e8e4d8',
  alarmLow: '#57d977',
  alarmMid: '#f5c542',
  alarmHigh: '#ff2e2e',
  smoke: 'rgba(200, 205, 220, 0.55)',
};

// Pedestals and display cases. They block movement, block sight, and make
// three lanes across the room: the red carpet centre, the left gallery and
// the right gallery.
export const OBSTACLES = [
  { x: 300, y: 190, w: 90, h: 54, label: 'VASE' },
  { x: 300, y: 420, w: 90, h: 54, label: 'URN' },
  { x: 560, y: 300, w: 110, h: 60, label: 'SCROLL' },
  { x: 820, y: 190, w: 90, h: 54, label: 'MASK' },
  { x: 820, y: 420, w: 90, h: 54, label: 'COIN' },
  { x: 560, y: 540, w: 110, h: 44, label: 'ARMOR' },
  { x: 150, y: 300, w: 70, h: 70, label: 'STATUE' },
  { x: 1000, y: 330, w: 76, h: 76, label: 'GLOBE' },
];

// Guard patrol routes: each guard walks its waypoints in a loop.
export const GUARD_ROUTES = [
  [
    { x: 260, y: 160 },
    { x: 700, y: 160 },
    { x: 700, y: 560 },
    { x: 260, y: 560 },
  ],
  [
    { x: 980, y: 140 },
    { x: 980, y: 560 },
    { x: 620, y: 560 },
    { x: 620, y: 140 },
  ],
  [
    { x: 430, y: 620 },
    { x: 900, y: 620 },
    { x: 900, y: 300 },
    { x: 430, y: 300 },
  ],
];

// CCTV cameras: fixed mounts that sweep their cones back and forth.
export const CAMERA_MOUNTS = [
  { x: 640, y: 96, baseAngle: Math.PI / 2, sweep: 1.05, speed: 0.55, phase: 0 },
  { x: 1224, y: 420, baseAngle: Math.PI, sweep: 0.9, speed: 0.42, phase: 1.6 },
];
