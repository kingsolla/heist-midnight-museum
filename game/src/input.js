// Input: WASD / arrow keys to move, Shift to sneak, Q for a smoke pellet,
// mouse click for click-to-move, plus the menu keys (P pause, R restart,
// M mute, Enter / Space to start).
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.moveTarget = null; // {x, y} in canvas coordinates, or null
    this.pressed = new Set(); // keys pressed since last poll
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
        e.preventDefault();
      }
      if (!e.repeat) this.pressed.add(k);
      this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      this.keys.delete(k);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
      this.moveTarget = null;
    });

    canvas.addEventListener('pointerdown', (e) => {
      const rect = canvas.getBoundingClientRect();
      const sx = canvas.width / rect.width;
      const sy = canvas.height / rect.height;
      this.moveTarget = {
        x: (e.clientX - rect.left) * sx,
        y: (e.clientY - rect.top) * sy,
      };
    });
  }

  // Direction from the held keys, as a unit vector (or null).
  keyDirection() {
    let dx = 0;
    let dy = 0;
    if (this.keys.has('a') || this.keys.has('ArrowLeft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('ArrowRight')) dx += 1;
    if (this.keys.has('w') || this.keys.has('ArrowUp')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('ArrowDown')) dy += 1;
    if (dx === 0 && dy === 0) return null;
    const len = Math.hypot(dx, dy);
    return { x: dx / len, y: dy / len };
  }

  get sneaking() {
    return this.keys.has('Shift');
  }

  // True once per physical press; callers drain the set each frame.
  wasPressed(key) {
    return this.pressed.has(key);
  }

  endFrame() {
    this.pressed.clear();
  }

  clearMoveTarget() {
    this.moveTarget = null;
  }
}
