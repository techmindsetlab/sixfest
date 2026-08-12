import { useEffect, useRef } from 'react';

// Generative "maya" field: volt-tropis gradient yang di-glitch per kolom.
// Amplitudo glitch naik di sisi kanan divider (mengikuti kursor) dan saat
// scroll cepat — terjemahan web dari instalasi motion-reactive SIXFEST.
export default function HeroMaya() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const base = document.createElement('canvas');
    const baseCtx = base.getContext('2d')!;
    const grain = document.createElement('canvas');
    const grainCtx = grain.getContext('2d')!;

    const paintBase = () => {
      base.width = w;
      base.height = h;
      const g = baseCtx.createLinearGradient(0, h, w, 0);
      g.addColorStop(0, '#0a0a0a');
      g.addColorStop(0.28, '#4a0e4e');
      g.addColorStop(0.52, '#ff2e9a');
      g.addColorStop(0.74, '#7a2bff');
      g.addColorStop(1, '#00e5ff');
      baseCtx.fillStyle = g;
      baseCtx.fillRect(0, 0, w, h);
    };

    const paintGrain = () => {
      const gw = 256;
      grain.width = gw;
      grain.height = gw;
      const img = grainCtx.createImageData(gw, gw);
      for (let i = 0; i < img.data.length; i += 4) {
        const v = Math.random() * 255;
        img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
        img.data[i + 3] = 26;
      }
      grainCtx.putImageData(img, 0, 0);
    };

    const resize = () => {
      w = Math.floor(canvas.clientWidth * dpr);
      h = Math.floor(canvas.clientHeight * dpr);
      canvas.width = w;
      canvas.height = h;
      paintBase();
      paintGrain();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    let mouseX = 0.5;
    let divider = 0.5;
    let pointerSpeed = 0;
    let lastPX = 0;
    let lastPY = 0;
    const onMove = (e: PointerEvent) => {
      mouseX = e.clientX / innerWidth;
      const dx = e.clientX - lastPX;
      const dy = e.clientY - lastPY;
      pointerSpeed = Math.min(1, Math.hypot(dx, dy) / 60);
      lastPX = e.clientX;
      lastPY = e.clientY;
    };
    window.addEventListener('pointermove', onMove);

    let t = 0;
    const draw = () => {
      if (!w || !h) {
        raf = requestAnimationFrame(draw);
        return;
      }
      t += 0.016;
      divider += (mouseX - divider) * 0.06;
      pointerSpeed *= 0.94;

      const lenis = (window as any).lenis;
      const scrollV = Math.min(1, Math.abs(lenis?.velocity ?? 0) / 30);
      const energy = Math.min(1, pointerSpeed + scrollV);

      ctx.clearRect(0, 0, w, h);
      const slice = Math.max(6, Math.floor(w / 160));
      const divPx = divider * w;

      for (let x = 0; x < w; x += slice) {
        const maya = x > divPx ? 1 : 0.08;
        const n =
          Math.sin(x * 0.02 + t * 2.1) * Math.sin(x * 0.005 - t * 1.3) +
          Math.sin(x * 0.05 + t * 5.7) * 0.5;
        const amp = maya * (h * 0.012 + energy * h * 0.09);
        const dy = n * amp;
        const jitter = maya * energy > 0.4 && Math.random() < 0.12 ? (Math.random() - 0.5) * slice * 4 : 0;
        ctx.drawImage(base, x, 0, slice, h, x + jitter, dy, slice, h);
      }

      ctx.globalCompositeOperation = 'overlay';
      ctx.drawImage(grain, 0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';

      raf = requestAnimationFrame(draw);
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
