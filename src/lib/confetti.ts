// A small, dependency-free confetti burst drawn on a throwaway canvas.
const COLORS = [
  '#bc3c23',
  '#b22065',
  '#7136ba',
  '#f4a6d0',
  '#ffb397',
  '#ffd36e',
];
const GRAVITY = 0.32;
const DRAG = 0.985;
const LIFETIME_MS = 2600;

type Piece = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
  wobble: number;
  round: boolean;
};

type Burst = {
  x: number;
  y: number;
  angle: number;
  spread: number;
  count: number;
  speed: number;
};

function makePieces({ x, y, angle, spread, count, speed }: Burst) {
  return Array.from({ length: count }, (): Piece => {
    const a = ((angle + (Math.random() - 0.5) * spread) * Math.PI) / 180;
    const v = speed * (0.55 + Math.random() * 0.6);
    return {
      x,
      y,
      vx: Math.cos(a) * v,
      vy: -Math.sin(a) * v,
      size: 5 + Math.random() * 6,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      rotation: Math.random() * Math.PI,
      spin: (Math.random() - 0.5) * 0.3,
      wobble: Math.random() * 10,
      round: Math.random() < 0.3,
    };
  });
}

/** Fires two side cannons plus a centre pop; a no-op for reduced motion. */
export function fireConfetti(origin?: { x: number; y: number }) {
  if (typeof window === 'undefined') return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth;
  const height = window.innerHeight;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    width: '100%',
    height: '100%',
    pointerEvents: 'none',
    zIndex: '100',
  });
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }
  ctx.scale(dpr, dpr);

  const scale = Math.min(1, width / 900) * 0.4 + 0.6;
  const cx = origin?.x ?? width / 2;
  const cy = origin?.y ?? height * 0.35;
  let pieces = [
    ...makePieces({
      x: 0,
      y: height * 0.7,
      angle: 60,
      spread: 40,
      count: 70,
      speed: 22 * scale,
    }),
    ...makePieces({
      x: width,
      y: height * 0.7,
      angle: 120,
      spread: 40,
      count: 70,
      speed: 22 * scale,
    }),
    ...makePieces({
      x: cx,
      y: cy,
      angle: 90,
      spread: 160,
      count: 50,
      speed: 14 * scale,
    }),
  ];

  const start = performance.now();
  const frame = (now: number) => {
    const elapsed = now - start;
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, elapsed - 1800) / 800);
    for (const p of pieces) {
      p.vx *= DRAG;
      p.vy = p.vy * DRAG + GRAVITY;
      p.x += p.vx + Math.sin(p.wobble + elapsed / 180) * 0.6;
      p.y += p.vy;
      p.rotation += p.spin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Flip the ribbon's height to fake a 3D tumble.
        const flip = Math.cos(p.rotation * 2);
        ctx.fillRect(
          -p.size / 2,
          (-p.size / 4) * flip,
          p.size,
          (p.size / 2) * flip
        );
      }
      ctx.restore();
    }
    pieces = pieces.filter((p) => p.y < height + 20);
    if (elapsed < LIFETIME_MS && pieces.length) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  };
  requestAnimationFrame(frame);
}
