import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';

// Sticker "6" yang mengekor kursor — pengganti "moon"-nya ADNIGHT.
export default function Sticker6() {
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 60, damping: 12, mass: 0.8 });
  const sy = useSpring(y, { stiffness: 60, damping: 12, mass: 0.8 });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      x.set(e.clientX + 28);
      y.set(e.clientY + 28);
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, [x, y]);

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        x: sx,
        y: sy,
        zIndex: 'var(--z-sticker)' as unknown as number,
        pointerEvents: 'none',
        width: 56,
        height: 56,
        borderRadius: '50%',
        background: 'var(--magenta)',
        color: 'var(--ink)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'var(--font-bit)',
        fontSize: 38,
        fontWeight: 700,
        mixBlendMode: 'difference',
      }}
    >
      6
    </motion.div>
  );
}
