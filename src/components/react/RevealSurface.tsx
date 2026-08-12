import { useEffect, useRef } from 'react';

// Permukaan "nyata" (bone) yang meleleh mengikuti kursor, mengungkap layer
// "maya" di baliknya — ala segerman.dev, versi 2D canvas ringan.
// Mask low-res menampung jejak partikel smoky; permukaan di-punch dengan
// destination-out + blur supaya tepiannya feathered.
export default function RevealSurface() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const MS = 0.35;

    const mask = document.createElement('canvas');
    const mctx = mask.getContext('2d')!;

    const ro = new ResizeObserver(() => {
      w = Math.floor(canvas.clientWidth * dpr);
      h = Math.floor(canvas.clientHeight * dpr);
      canvas.width = w;
      canvas.height = h;
      mask.width = Math.max(1, Math.floor(w * MS));
      mask.height = Math.max(1, Math.floor(h * MS));
    });
    ro.observe(canvas);

    type Particle = { x: number; y: number; vx: number; vy: number; r: number; life: number };
    const parts: Particle[] = [];
    let lastX = -1;
    let lastY = -1;

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      if (e.clientY < rect.top || e.clientY > rect.bottom) return;
      const x = (e.clientX - rect.left) * dpr;
      const y = (e.clientY - rect.top) * dpr;
      const dx = lastX < 0 ? 0 : x - lastX;
      const dy = lastY < 0 ? 0 : y - lastY;
      const speed = Math.hypot(dx, dy);
      const count = Math.min(6, 1 + Math.floor(speed / 20));
      for (let i = 0; i < count; i++) {
        const t = i / count;
        parts.push({
          x: x - dx * t,
          y: y - dy * t,
          vx: dx * 0.06 + (Math.random() - 0.5) * 2,
          vy: dy * 0.06 + (Math.random() - 0.5) * 2,
          r: (36 + speed * 0.7 + Math.random() * 30) * dpr,
          life: 1,
        });
      }
      lastX = x;
      lastY = y;
    };
    window.addEventListener('pointermove', onMove);

    let raf = 0;
    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!w || !h) return;

      // jejak lama menutup pelan-pelan
      mctx.globalCompositeOperation = 'destination-out';
      mctx.fillStyle = 'rgba(0,0,0,0.03)';
      mctx.fillRect(0, 0, mask.width, mask.height);
      mctx.globalCompositeOperation = 'source-over';

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.vx += Math.sin(p.y * 0.01 + p.x * 0.004) * 0.35;
        p.r *= 1.012;
        p.life -= 0.012;
        if (p.life <= 0) {
          parts.splice(i, 1);
          continue;
        }
        const mx = p.x * MS;
        const my = p.y * MS;
        const mr = Math.max(1, p.r * MS);
        const g = mctx.createRadialGradient(mx, my, 0, mx, my, mr);
        g.addColorStop(0, `rgba(255,255,255,${0.28 * p.life})`);
        g.addColorStop(1, 'rgba(255,255,255,0)');
        mctx.fillStyle = g;
        mctx.beginPath();
        mctx.arc(mx, my, mr, 0, Math.PI * 2);
        mctx.fill();
      }

      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = '#f5f1e8';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.filter = 'blur(12px)';
      ctx.drawImage(mask, 0, 0, w, h);
      ctx.filter = 'none';
      ctx.globalCompositeOperation = 'source-over';
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}
