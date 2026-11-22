// Midnight at the Marlow Museum — game loop and rules.
// Owns the state machine (title / playing / paused / won / lost), moves the
// thief, asks guards and cameras to watch him, and drives the alarm meter:
// it climbs while he is seen and falls while he stays hidden.
import {
  VIEW_W, VIEW_H, THIEF_START, THIEF_SPEED, THIEF_SNEAK_SPEED,
  THIEF_RADIUS, ALARM_DECAY, ALARM_GUARD_RATE, ALARM_GUARD_CLOSE,
  ALARM_CAMERA_RATE, ALARM_SNEAK_FACTOR, ALARM_LOOT_SPIKE, ALARM_MAX,
  SMOKE_COUNT, SMOKE_DURATION, SMOKE_RADIUS, DIAMOND, EXIT_DOOR,
  GUARD_ROUTES, CAMERA_MOUNTS,
} from './config.js';
import { Guard } from './guards.js';
import { Camera } from './cameras.js';
import { SoundBank } from './audio.js';
import { Input } from './input.js';
import { render } from './render.js';
import { buildShotState, shotFromUrl } from './shots.js';
import { resolveRoomCollision, dist } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const sounds = new SoundBank();
const input = new Input(canvas);

function freshState() {
  return {
    phase: 'title',
    thief: {
      x: THIEF_START.x, y: THIEF_START.y, facing: -Math.PI / 2, speed: 0, hasLoot: false,
    },
    guards: GUARD_ROUTES.map((route, i) => new Guard(route, i)),
    cameras: CAMERA_MOUNTS.map((m) => new Camera(m)),
    alarm: 0,
    alarmPeak: 0,
    hasLoot: false,
    smokeLeft: SMOKE_COUNT,
    smokes: [],
    elapsed: 0,
    detections: 0,
    moveTarget: null,
    lostReason: null,
  };
}

let state = freshState();
let shotMode = null;
let frozenTime = 0;

// A deterministic screenshot state freezes the loop: one rendered frame.
function applyShot(kind) {
  shotMode = kind;
  state = buildShotState(kind);
  frozenTime = kind === 'play' ? 12.4 : kind === 'end' ? 8.0 : 3.0;
  render(ctx, state, frozenTime);
}

function startHeist() {
  state = freshState();
  state.phase = 'playing';
  sounds.ensure();
}

function endHeist(won, reason) {
  state.phase = won ? 'won' : 'lost';
  state.lostReason = reason;
  if (won) sounds.winJingle();
  else sounds.loseDrone();
}

// Is the thief inside any live smoke cloud?
function hiddenBySmoke() {
  for (const s of state.smokes) {
    if (dist(state.thief.x, state.thief.y, s.x, s.y) < SMOKE_RADIUS) return true;
  }
  return false;
}

function moveThief(dt) {
  const thief = state.thief;
  let dir = input.keyDirection();
  if (dir) input.clearMoveTarget();
  else if (input.moveTarget) {
    const d = dist(thief.x, thief.y, input.moveTarget.x, input.moveTarget.y);
    if (d < 8) {
      input.clearMoveTarget();
      state.moveTarget = null;
    } else {
      dir = {
        x: (input.moveTarget.x - thief.x) / d,
        y: (input.moveTarget.y - thief.y) / d,
      };
      state.moveTarget = input.moveTarget;
    }
  } else {
    state.moveTarget = null;
  }
  if (!dir) {
    thief.speed = 0;
    return;
  }
  const sneaking = input.sneaking;
  const speed = sneaking ? THIEF_SNEAK_SPEED : THIEF_SPEED;
  thief.speed = speed;
  thief.facing = Math.atan2(dir.y, dir.x);
  const nx = thief.x + dir.x * speed * dt;
  const ny = thief.y + dir.y * speed * dt;
  const fixed = resolveRoomCollision(nx, ny, THIEF_RADIUS);
  thief.x = fixed.x;
  thief.y = fixed.y;
  sounds.footstep(performance.now() / 1000);
}

function updatePlaying(dt) {
  state.elapsed += dt;
  moveThief(dt);

  // Smoke pellets: Q drops one at the thief's feet.
  if (input.wasPressed('q') && state.smokeLeft > 0) {
    state.smokeLeft -= 1;
    state.smokes.push({ x: state.thief.x, y: state.thief.y, left: SMOKE_DURATION });
    sounds.smokePuff();
  }
  for (const s of state.smokes) s.left -= dt;
  state.smokes = state.smokes.filter((s) => s.left > 0);

  const smoked = hiddenBySmoke();
  let exposure = 0;

  for (const guard of state.guards) {
    guard.update(dt, state.thief);
    const level = guard.watch(state.thief, smoked, dt);
    if (level > 0) {
      exposure = Math.max(exposure, level === 2 ? ALARM_GUARD_CLOSE : ALARM_GUARD_RATE);
      if (level === 2 && !guard.wasSpotted) {
        state.detections += 1;
        sounds.alertSting();
      }
      guard.wasSpotted = true;
    } else {
      guard.wasSpotted = false;
    }
    if (guard.touches(state.thief)) {
      endHeist(false, 'caught');
      return;
    }
  }
  for (const cam of state.cameras) {
    cam.update(dt);
    if (cam.watch(state.thief, smoked)) {
      exposure = Math.max(exposure, ALARM_CAMERA_RATE);
      if (cam.freshSpot()) {
        state.detections += 1;
        sounds.cameraBeep();
      }
    }
  }

  // Alarm: climbs while exposed, falls while hidden. Sneaking slows the climb.
  if (exposure > 0) {
    const rate = input.sneaking ? exposure * ALARM_SNEAK_FACTOR : exposure;
    state.alarm = Math.min(ALARM_MAX, state.alarm + rate * dt);
  } else {
    state.alarm = Math.max(0, state.alarm - ALARM_DECAY * dt);
  }
  state.alarmPeak = Math.max(state.alarmPeak, state.alarm);
  if (state.alarm >= ALARM_MAX) {
    endHeist(false, 'lockdown');
    return;
  }

  // Grab the diamond when close to the vault.
  if (!state.hasLoot && dist(state.thief.x, state.thief.y, DIAMOND.x, DIAMOND.y) < 46) {
    state.hasLoot = true;
    state.thief.hasLoot = true;
    state.alarm = Math.min(ALARM_MAX, state.alarm + ALARM_LOOT_SPIKE);
    sounds.vaultChime();
  }

  // Win: loot in hand, reach the exit door. A generous radius, so both
  // keyboard steering and click-to-move can step through the doorway.
  if (state.hasLoot &&
    dist(state.thief.x, state.thief.y,
      EXIT_DOOR.x + EXIT_DOOR.w / 2, EXIT_DOOR.y + EXIT_DOOR.h / 2) < 44) {
    endHeist(true);
  }
}

function handleMenuKeys() {
  if (input.wasPressed('Enter') || input.wasPressed(' ')) {
    if (state.phase === 'title') startHeist();
    else if (state.phase === 'won' || state.phase === 'lost') startHeist();
  }
  if (input.wasPressed('p') || input.wasPressed('Escape')) {
    if (state.phase === 'playing') state.phase = 'paused';
    else if (state.phase === 'paused') state.phase = 'playing';
  }
  if (input.wasPressed('r')) startHeist();
  if (input.wasPressed('m')) {
    sounds.ensure();
    sounds.toggleMute();
  }
  if (input.wasPressed('Enter') && state.phase === 'paused') state.phase = 'playing';
}

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (shotMode) {
    // Frozen deterministic frame for screenshots; keep rendering so the
    // canvas never goes blank, but never advance the simulation.
    render(ctx, state, frozenTime);
    input.endFrame();
    requestAnimationFrame(frame);
    return;
  }
  handleMenuKeys();
  if (state.phase === 'playing') updatePlaying(dt);
  render(ctx, state, now / 1000);
  input.endFrame();
  requestAnimationFrame(frame);
}

// Click on the title screen also starts the heist.
canvas.addEventListener('pointerdown', () => {
  if (state.phase === 'title' || state.phase === 'won' || state.phase === 'lost') {
    sounds.ensure();
    startHeist();
  }
});

const shot = shotFromUrl();
if (shot) applyShot(shot);

// Read-only probe for automated playtests: lets a test driver read the live
// game state (thief, guards, alarm, phase) without touching the game.
window.__marlow = { getState: () => state };
requestAnimationFrame(frame);
