import React, { useRef } from 'react';
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from 'motion/react';

interface TiltCard3DProps {
  children: React.ReactNode;
  className?: string;
  maxTiltDeg?: number;
  enableScrollReveal?: boolean;
}

export const TiltCard3D: React.FC<TiltCard3DProps> = ({
  children,
  className = '',
  maxTiltDeg = 7,
  enableScrollReveal = false,
}) => {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rawGlowX = useMotionValue(50);
  const rawGlowY = useMotionValue(50);
  const rawGlowOpacity = useMotionValue(0);

  const rotateX = useSpring(rawRotateX, { stiffness: 260, damping: 24, mass: 0.6 });
  const rotateY = useSpring(rawRotateY, { stiffness: 260, damping: 24, mass: 0.6 });
  const glowX = useSpring(rawGlowX, { stiffness: 220, damping: 26 });
  const glowY = useSpring(rawGlowY, { stiffness: 220, damping: 26 });
  const glowOpacity = useSpring(rawGlowOpacity, { stiffness: 220, damping: 26 });

  const sheenBackground = useMotionTemplate`radial-gradient(420px circle at ${glowX}% ${glowY}%, rgba(229, 232, 206, 0.28), transparent 65%)`;

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (prefersReducedMotion || e.pointerType === 'touch' || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;

    rawRotateY.set((px - 0.5) * 2 * maxTiltDeg);
    rawRotateX.set((0.5 - py) * 2 * maxTiltDeg);
    rawGlowX.set(px * 100);
    rawGlowY.set(py * 100);
    rawGlowOpacity.set(1);
  };

  const handlePointerLeave = () => {
    rawRotateX.set(0);
    rawRotateY.set(0);
    rawGlowOpacity.set(0);
  };

  return (
    <div style={{ perspective: '1100px' }} className="h-full">
      <motion.div
        ref={cardRef}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        initial={
          enableScrollReveal && !prefersReducedMotion
            ? { opacity: 0, y: 18 }
            : false
        }
        whileInView={
          enableScrollReveal && !prefersReducedMotion
            ? { opacity: 1, y: 0 }
            : undefined
        }
        viewport={enableScrollReveal ? { once: true, amount: 0.1 } : undefined}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{
          rotateX: prefersReducedMotion ? 0 : rotateX,
          rotateY: prefersReducedMotion ? 0 : rotateY,
        }}
        className={`relative h-full ${className}`}
      >
        {children}
        {!prefersReducedMotion && (
          <motion.div
            aria-hidden="true"
            style={{
              background: sheenBackground,
              opacity: glowOpacity,
            }}
            className="pointer-events-none absolute inset-0 rounded-[inherit] z-10"
          />
        )}
      </motion.div>
    </div>
  );
};
