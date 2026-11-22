// Render: every pixel of the museum is drawn on one canvas — marble floor,
// red-carpet lanes, glowing exhibits, the gold vault, sweeping cones and the
// HUD. Nothing is loaded from a file: all art is canvas drawing.
import {
  VIEW_W, VIEW_H, HUD_H, ROOM, COLORS, OBSTACLES, VAULT, DIAMOND,
  EXIT_DOOR, ALARM_MAX, SMOKE_RADIUS,
} from './config.js';

function drawCone(ctx, x, y, facing, range, halfAngle, fill) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function drawDiamond(ctx, x, y, r, glow) {
  ctx.save();
  ctx.translate(x, y);
  if (glow) {
    const g = ctx.createRadialGradient(0, 0, 2, 0, 0, r * 3.2);
    g.addColorStop(0, 'rgba(255, 233, 163, 0.55)');
    g.addColorStop(1, 'rgba(255, 233, 163, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * 3.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.85, -r * 0.25);
  ctx.lineTo(0, r);
  ctx.lineTo(-r * 0.85, -r * 0.25);
  ctx.closePath();
  ctx.fillStyle = '#bfe9ff';
  ctx.fill();
  ctx.strokeStyle = COLORS.goldGlow;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-r * 0.85, -r * 0.25);
  ctx.lineTo(r * 0.85, -r * 0.25);
  ctx.moveTo(0, -r);
  ctx.lineTo(0, r);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
}

function drawThief(ctx, thief) {
  const { x, y } = thief;
  ctx.save();
  ctx.translate(x, y);
  // Soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 11, 14, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  // Body: dark coat, gold trim, flat cap.
  ctx.rotate(thief.facing);
  ctx.fillStyle = COLORS.thiefCoat;
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.thiefTrim;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.thiefTrim;
  ctx.beginPath();
  ctx.arc(9, 0, 4, 0, Math.PI * 2); // satchel
  ctx.fill();
  ctx.fillStyle = '#e8e4d8';
  ctx.beginPath();
  ctx.arc(4, -6, 2.2, 0, Math.PI * 2); // eye glint
  ctx.arc(4, 6, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (thief.hasLoot) {
    drawDiamond(ctx, x, y - 26, 7, true);
  }
}

function drawGuard(ctx, guard) {
  const { x, y } = guard;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, 12, 15, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(guard.facing);
  ctx.fillStyle = guard.alerted ? COLORS.guardAlert : COLORS.guardBody;
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#ffd9d9';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Flashlight beam nub and cap brim.
  ctx.fillStyle = '#fff2b0';
  ctx.beginPath();
  ctx.arc(14, 0, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a1f1f';
  ctx.fillRect(-14, -9, 8, 18);
  ctx.restore();
  if (guard.alerted) {
    ctx.fillStyle = COLORS.guardAlert;
    ctx.font = 'bold 20px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('!', x, y - 24);
  }
}

function drawCamera(ctx, camera) {
  const { x, y } = camera;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#39406b';
  ctx.fillRect(-7, -7, 14, 14);
  ctx.strokeStyle = camera.spotted ? COLORS.guardAlert : '#8fb7ff';
  ctx.lineWidth = 2;
  ctx.strokeRect(-7, -7, 14, 14);
  ctx.rotate(camera.facing);
  ctx.fillStyle = camera.spotted ? COLORS.guardAlert : '#cfe6ff';
  ctx.beginPath();
  ctx.arc(11, 0, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (camera.spotted) {
    ctx.fillStyle = COLORS.guardAlert;
    ctx.font = 'bold 16px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('REC', x, y - 16);
  }
}

function drawHud(ctx, state) {
  ctx.fillStyle = COLORS.hudBg;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#2a3257';
  ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);

  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 24px Georgia, serif';
  ctx.fillText('MIDNIGHT AT THE MARLOW MUSEUM', 24, 30);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '15px Georgia, serif';
  ctx.fillText('Rook the thief  ·  steal the Star of Marlow, slip out the door', 24, 52);

  // Alarm meter.
  const ax = 640;
  const ay = 20;
  const aw = 300;
  const ah = 20;
  ctx.fillStyle = '#000';
  ctx.fillRect(ax - 2, ay - 2, aw + 4, ah + 4);
  const frac = state.alarm / ALARM_MAX;
  ctx.fillStyle = frac < 0.45 ? COLORS.alarmLow : frac < 0.75 ? COLORS.alarmMid : COLORS.alarmHigh;
  ctx.fillRect(ax, ay, aw * frac, ah);
  ctx.strokeStyle = '#e8e4d8';
  ctx.lineWidth = 1;
  ctx.strokeRect(ax - 2, ay - 2, aw + 4, ah + 4);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = 'bold 14px Georgia, serif';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', ax, ay - 5);
  ctx.textAlign = 'right';
  ctx.fillText(`${Math.round(state.alarm)}%`, ax + aw, ay + 16);
  ctx.textAlign = 'left';

  // Loot, smoke, timer, detections.
  const bx = 980;
  ctx.font = '16px Georgia, serif';
  ctx.fillStyle = state.hasLoot ? COLORS.goldGlow : COLORS.hudText;
  ctx.fillText(state.hasLoot ? '◆ STAR — GOT IT!' : '◇ Star of Marlow — in the vault', bx, 26);
  ctx.fillStyle = COLORS.hudText;
  ctx.fillText(`Smoke: ${'●'.repeat(state.smokeLeft)}${'○'.repeat(2 - state.smokeLeft)}  (Q)`, bx, 48);
  ctx.textAlign = 'right';
  ctx.fillText(`⏱ ${formatTime(state.elapsed)}`, VIEW_W - 24, 26);
  ctx.fillText(`Spotted ${state.detections}×`, VIEW_W - 24, 48);
  ctx.textAlign = 'left';
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

function drawRoom(ctx, state, time) {
  // Floor: checker marble.
  const tile = 64;
  for (let y = ROOM.y; y < ROOM.y + ROOM.h; y += tile) {
    for (let x = ROOM.x; x < ROOM.x + ROOM.w; x += tile) {
      const odd = ((x - ROOM.x) / tile + (y - ROOM.y) / tile) % 2 === 0;
      ctx.fillStyle = odd ? COLORS.floorLight : COLORS.floorDark;
      ctx.fillRect(x, y, tile, tile);
    }
  }
  // Red carpet lanes down the centre and across the middle.
  ctx.fillStyle = COLORS.carpet;
  ctx.fillRect(ROOM.x + 560, ROOM.y, 110, ROOM.h);
  ctx.fillRect(ROOM.x, ROOM.y + 280, ROOM.w, 46);
  ctx.strokeStyle = COLORS.carpetEdge;
  ctx.lineWidth = 3;
  ctx.strokeRect(ROOM.x + 560, ROOM.y, 110, ROOM.h);
  ctx.strokeRect(ROOM.x, ROOM.y + 280, ROOM.w, 46);

  // Walls.
  ctx.strokeStyle = COLORS.wallEdge;
  ctx.lineWidth = 8;
  ctx.strokeRect(ROOM.x - 4, ROOM.y - 4, ROOM.w + 8, ROOM.h + 8);

  // Exit door, bottom-left wall, green and glowing.
  ctx.fillStyle = '#1d5c33';
  ctx.fillRect(EXIT_DOOR.x, EXIT_DOOR.y, EXIT_DOOR.w, EXIT_DOOR.h);
  ctx.strokeStyle = '#57d977';
  ctx.lineWidth = 3;
  ctx.strokeRect(EXIT_DOOR.x, EXIT_DOOR.y, EXIT_DOOR.w, EXIT_DOOR.h);
  ctx.fillStyle = '#d9ffe6';
  ctx.font = 'bold 13px Georgia, serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(EXIT_DOOR.x + 13, EXIT_DOOR.y + 58);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('EXIT', 0, 4);
  ctx.restore();

  // Vault: steel door with a gold frame, top-right.
  ctx.fillStyle = '#3d445f';
  ctx.fillRect(VAULT.x, VAULT.y, VAULT.w, VAULT.h);
  ctx.strokeStyle = COLORS.gold;
  ctx.lineWidth = 4;
  ctx.strokeRect(VAULT.x, VAULT.y, VAULT.w, VAULT.h);
  ctx.strokeStyle = '#20263f';
  ctx.lineWidth = 2;
  for (let i = 1; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(VAULT.x + 12, VAULT.y + i * 22);
    ctx.lineTo(VAULT.x + VAULT.w - 12, VAULT.y + i * 22);
    ctx.stroke();
  }
  ctx.fillStyle = COLORS.gold;
  ctx.font = 'bold 13px Georgia, serif';
  ctx.fillText('VAULT', VAULT.x + VAULT.w / 2, VAULT.y + VAULT.h - 10);

  // The diamond, pulsing gold when still in the vault.
  if (!state.hasLoot) {
    const pulse = 1 + 0.12 * Math.sin(time * 3);
    drawDiamond(ctx, DIAMOND.x, DIAMOND.y, DIAMOND.r * pulse, true);
  }

  // Pedestals with their exhibits.
  for (const o of OBSTACLES) {
    ctx.fillStyle = COLORS.pedestal;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.fillStyle = COLORS.pedestalTop;
    ctx.fillRect(o.x + 5, o.y + 5, o.w - 10, o.h - 10);
    ctx.strokeStyle = '#5a6699';
    ctx.lineWidth = 2;
    ctx.strokeRect(o.x, o.y, o.w, o.h);
    const glow = ctx.createRadialGradient(
      o.x + o.w / 2, o.y + o.h / 2, 2,
      o.x + o.w / 2, o.y + o.h / 2, 46,
    );
    glow.addColorStop(0, 'rgba(143, 183, 255, 0.35)');
    glow.addColorStop(1, 'rgba(143, 183, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(o.x + o.w / 2, o.y + o.h / 2, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = COLORS.exhibitGlow;
    ctx.font = '11px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(o.label, o.x + o.w / 2, o.y + o.h / 2 + 4);
  }

  // Smoke clouds block sight — draw them as soft grey puffs.
  for (const s of state.smokes) {
    const g = ctx.createRadialGradient(s.x, s.y, 4, s.x, s.y, SMOKE_RADIUS);
    g.addColorStop(0, COLORS.smoke);
    g.addColorStop(1, 'rgba(200,205,220,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(s.x, s.y, SMOKE_RADIUS, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOverlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(5, 7, 16, 0.60)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 52px Georgia, serif';
  ctx.fillText(title, VIEW_W / 2, 250);
  ctx.fillStyle = COLORS.hudText;
  ctx.font = '20px Georgia, serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 310 + i * 34));
  ctx.textAlign = 'left';
}

export function render(ctx, state, time) {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  drawRoom(ctx, state, time);

  // Vision cones under the figures: cameras first, then guards.
  for (const cam of state.cameras) {
    drawCone(ctx, cam.x, cam.y, cam.facing, 265, 0.42,
      cam.spotted ? COLORS.cameraAlert : COLORS.cameraCone);
  }
  for (const guard of state.guards) {
    drawCone(ctx, guard.x, guard.y, guard.facing, 235, 0.52,
      guard.alerted ? COLORS.coneAlert : COLORS.coneCalm);
  }

  // Click-to-move marker.
  if (state.moveTarget) {
    ctx.strokeStyle = 'rgba(245, 197, 66, 0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(state.moveTarget.x, state.moveTarget.y, 9, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(state.moveTarget.x - 13, state.moveTarget.y);
    ctx.lineTo(state.moveTarget.x + 13, state.moveTarget.y);
    ctx.moveTo(state.moveTarget.x, state.moveTarget.y - 13);
    ctx.lineTo(state.moveTarget.x, state.moveTarget.y + 13);
    ctx.stroke();
  }

  for (const cam of state.cameras) drawCamera(ctx, cam);
  for (const guard of state.guards) drawGuard(ctx, guard);
  drawThief(ctx, state.thief);
  drawHud(ctx, state);

  if (state.phase === 'title') {
    drawOverlay(ctx, 'MIDNIGHT AT THE MARLOW MUSEUM', [
      'You are Rook. The Star of Marlow waits in the vault — and the night',
      'watch is out. Slip past the guards and the cameras, grab the diamond,',
      'and reach the green EXIT door before the alarm hits 100%.',
      '',
      'WASD / arrows — move    ·    click — walk there    ·    Shift — sneak',
      'Q — smoke pellet (2)    ·    P — pause    ·    M — mute    ·    R — restart',
      '',
      'Press Enter or click to begin the heist.',
    ], COLORS.gold);
  } else if (state.phase === 'paused') {
    drawOverlay(ctx, 'PAUSED', [
      'The museum holds its breath.',
      'P — resume    ·    R — restart the heist    ·    M — mute',
    ], COLORS.hudText);
  } else if (state.phase === 'won') {
    drawOverlay(ctx, 'CLEAN GETAWAY!', [
      `Rook slips into the night with the Star of Marlow.`,
      `Time ${formatTime(state.elapsed)}  ·  spotted ${state.detections} times  ·  alarm peaked at ${Math.round(state.alarmPeak)}%`,
      '',
      'Press R to run it again — faster, quieter.',
    ], COLORS.goldGlow);
  } else if (state.phase === 'lost') {
    drawOverlay(ctx, state.lostReason === 'caught' ? 'CAUGHT!' : 'LOCKDOWN!', [
      state.lostReason === 'caught'
        ? 'A guard grabbed Rook by the collar. The Star stays in its vault.'
        : 'The alarm hit 100%. Steel shutters slam down over every door.',
      `Time ${formatTime(state.elapsed)}  ·  spotted ${state.detections} times`,
      '',
      'Press R to try the heist again.',
    ], COLORS.guardAlert);
  }
}
