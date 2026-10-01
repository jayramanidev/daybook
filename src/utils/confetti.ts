/**
 * Subtle paper-snippet canvas confetti for Dayfold completion moments.
 * Metaphor: Tiny folded sheets fluttering down like paper when the day is done.
 */

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  vRot: number;
  color: string;
  opacity: number;
  flutterSpeed: number;
  flutterAngle: number;
}

// Dayfold ink-and-paper palette colors
const CONFETTI_COLORS = [
  '#3447FF', // Cobalt
  '#5CCFAB', // Sea Glass (Done)
  '#FFB547', // Amber (Tomorrow)
  '#7B88FF', // Night Cobalt
  '#6FDDB9', // Night Sea Glass
  '#FFC46B', // Soft Amber
  '#E2DDF2', // Lilac Shade
];

let activeAnimationId: number | null = null;

export function triggerCompletionConfetti(canvas: HTMLCanvasElement | null) {
  if (!canvas) return;

  // Respect prefers-reduced-motion
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return;
  }

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  if (activeAnimationId !== null) {
    cancelAnimationFrame(activeAnimationId);
    activeAnimationId = null;
  }

  const width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
  const height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

  const particles: Particle[] = [];
  const particleCount = 42; // Subtle, elegant amount

  // Origin point near top-middle where DayTitle completion moment occurs
  const originX = width / 2;
  const originY = Math.min(height * 0.28, 220);

  for (let i = 0; i < particleCount; i++) {
    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
    const speed = 2.5 + Math.random() * 4.5;
    particles.push({
      x: originX + (Math.random() - 0.5) * 40,
      y: originY + (Math.random() - 0.5) * 20,
      vx: Math.cos(angle) * speed * (0.8 + Math.random() * 0.4),
      vy: Math.sin(angle) * speed * 0.8 - (2.5 + Math.random() * 2), // initial upward burst
      width: 5 + Math.random() * 5,
      height: 7 + Math.random() * 7,
      rotation: Math.random() * Math.PI * 2,
      vRot: (Math.random() - 0.5) * 0.15,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      opacity: 1,
      flutterSpeed: 0.05 + Math.random() * 0.08,
      flutterAngle: Math.random() * Math.PI * 2,
    });
  }

  let frameCount = 0;

  function render() {
    frameCount++;
    ctx!.clearRect(0, 0, width, height);

    let activeParticles = 0;

    for (const p of particles) {
      // Physics
      p.x += p.vx + Math.sin(p.flutterAngle) * 0.8;
      p.y += p.vy;
      p.vy += 0.12; // gentle gravity
      p.vx *= 0.98; // air drag
      p.rotation += p.vRot;
      p.flutterAngle += p.flutterSpeed;

      // Start fading after 60 frames (~1s)
      if (frameCount > 50) {
        p.opacity -= 0.014;
      }

      if (p.opacity > 0 && p.y < height + 20) {
        activeParticles++;

        ctx!.save();
        ctx!.translate(p.x, p.y);
        ctx!.rotate(p.rotation);
        // Simulate paper 3D flutter by scaling one axis with sinusoidal wave
        const flutterScale = Math.cos(p.flutterAngle);
        ctx!.scale(1, flutterScale);
        ctx!.globalAlpha = Math.max(0, p.opacity);
        ctx!.fillStyle = p.color;

        // Draw small rounded paper snippet
        ctx!.beginPath();
        ctx!.roundRect(-p.width / 2, -p.height / 2, p.width, p.height, 1.5);
        ctx!.fill();
        ctx!.restore();
      }
    }

    if (activeParticles > 0) {
      activeAnimationId = requestAnimationFrame(render);
    } else {
      ctx!.clearRect(0, 0, width, height);
      activeAnimationId = null;
    }
  }

  activeAnimationId = requestAnimationFrame(render);
}
