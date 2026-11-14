import React from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface EmergeBlockProps {
  order?: number;
  baseDelay?: number;
  className?: string;
  children: React.ReactNode;
}

const EMERGE_EASE: [number, number, number, number] = [0.25, 0.08, 0.16, 1];

export const EmergeBlock: React.FC<EmergeBlockProps> = ({
  order = 0,
  baseDelay = 0.08,
  className = '',
  children,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      initial={
        prefersReducedMotion
          ? { opacity: 0 }
          : {
              opacity: 0,
              scale: 0.86,
              y: 20,
              rotateX: 5,
              transformPerspective: 1150,
              filter: 'blur(6px)',
            }
      }
      animate={
        prefersReducedMotion
          ? { opacity: 1 }
          : {
              opacity: 1,
              scale: 1,
              y: 0,
              rotateX: 0,
              transformPerspective: 1150,
              filter: 'blur(0px)',
              transitionEnd: {
                transform: 'none',
                filter: 'none',
              },
            }
      }
      transition={{
        duration: prefersReducedMotion ? 0.18 : 0.9,
        delay: prefersReducedMotion ? 0 : baseDelay + order * 0.09,
        ease: EMERGE_EASE,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};
