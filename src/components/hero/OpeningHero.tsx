import React, { useRef } from 'react';
import { ArrowDown, ArrowRight, Play } from 'lucide-react';
import {
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';
import studioHeroImg from '../../assets/images/koda_studio_hero_1794599375980.jpg';
import { StudioSection } from '../../types/koda';
import { AuthMode, AuthUser } from '../auth/AuthPage';
import { EmergeBlock } from '../shared/EmergeBlock';

interface OpeningHeroProps {
  onEnterStudio: (section?: StudioSection) => void;
  onLoadDemo: () => void;
  onOpenAuth: (mode?: AuthMode) => void;
  authUser: AuthUser | null;
  onSignOut: () => void;
}

const LANDING_NAV_LINKS: { label: string; targetId: string }[] = [
  { label: 'Capabilities', targetId: 'landing-capabilities' },
  { label: '3D Stage', targetId: 'landing-stage-3d' },
  { label: 'Outputs', targetId: 'landing-outputs' },
  { label: 'Workflow', targetId: 'landing-workflow' },
];

export const OpeningHero: React.FC<OpeningHeroProps> = ({
  onEnterStudio,
  onLoadDemo,
  onOpenAuth,
  authUser,
  onSignOut,
}) => {
  const sectionRef = useRef<HTMLElement | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const smoothX = useSpring(pointerX, { stiffness: 120, damping: 24, mass: 0.8 });
  const smoothY = useSpring(pointerY, { stiffness: 120, damping: 24, mass: 0.8 });

  const bgRotateX = useTransform(smoothY, [-0.5, 0.5], [2.5, -2.5]);
  const bgRotateY = useTransform(smoothX, [-0.5, 0.5], [-3, 3]);
  const bgShiftX = useTransform(smoothX, [-0.5, 0.5], [-16, 16]);
  const bgShiftY = useTransform(smoothY, [-0.5, 0.5], [-10, 10]);

  const fgRotateX = useTransform(smoothY, [-0.5, 0.5], [3.5, -3.5]);
  const fgRotateY = useTransform(smoothX, [-0.5, 0.5], [-4.5, 4.5]);
  const fgShiftX = useTransform(smoothX, [-0.5, 0.5], [10, -10]);

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (prefersReducedMotion || e.pointerType === 'touch' || !sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    pointerX.set((e.clientX - rect.left) / rect.width - 0.5);
    pointerY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  const handlePointerLeave = () => {
    pointerX.set(0);
    pointerY.set(0);
  };

  const scrollToSection = (targetId: string) => {
    document.getElementById(targetId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  };

  return (
    <section
      ref={sectionRef}
      id="opening-hero"
      aria-label="Koda studio introduction"
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      style={{ perspective: '1400px' }}
      className="relative min-h-screen min-h-[100dvh] w-full overflow-hidden flex flex-col justify-between bg-[#D4DAB4] text-[#D4DAB4]"
    >
      {/* Full-bleed studio backdrop wrapped in a smooth 10-stop bottom dissolve into #D4DAB4 */}
      <div
        aria-hidden="true"
        className="absolute inset-0 overflow-hidden pointer-events-none sage-hero-dissolve"
      >
        <motion.div
          style={
            prefersReducedMotion
              ? undefined
              : {
                  rotateX: bgRotateX,
                  rotateY: bgRotateY,
                  x: bgShiftX,
                  y: bgShiftY,
                  scale: 1.06,
                }
          }
          className="absolute inset-0 bg-gradient-to-br from-[#192418] via-[#2C3D2B] to-[#557053] will-change-transform"
        >
          <img
            src={studioHeroImg}
            alt="Minimalist forest-sage film editing suite with calibrated display and arched daylight windows"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover object-center"
          />
          {/* Measured contrast scrims + sage atmosphere for crisp Pale Sage Ivory legibility */}
          <div className="absolute inset-0 bg-[#789575]/12 mix-blend-color pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#192418]/90 via-[#2C3D2B]/58 to-[#192418]/18" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#192418]/78 via-transparent to-[#192418]/55" />
        </motion.div>
      </div>

      {/* Top Bar Contract: 3 clean zones separated by gap-8 */}
      <motion.header
        initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.94, filter: 'blur(5px)' }}
        animate={{
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
          transitionEnd: { filter: 'none', transform: 'none' },
        }}
        transition={{ duration: 0.85, ease: [0.25, 0.08, 0.16, 1] }}
        className="relative z-10 w-full max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 pt-5 sm:pt-8 flex items-center justify-between gap-4 sm:gap-8"
      >
        <a
          href="#opening-hero"
          className="text-xl sm:text-2xl font-semibold tracking-tight text-[#D4DAB4] font-display whitespace-nowrap shrink-0"
        >
          Koda
        </a>

        <nav
          aria-label="Landing sections"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#C7CFA3]"
        >
          {LANDING_NAV_LINKS.map((item) => (
            <button
              key={item.targetId}
              type="button"
              onClick={() => scrollToSection(item.targetId)}
              className="hover:text-[#D4DAB4] underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            onClick={onLoadDemo}
            className="hover:text-[#D4DAB4] underline-offset-4 hover:underline transition-colors whitespace-nowrap shrink-0"
          >
            Sample Demo
          </button>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {authUser ? (
            <button
              type="button"
              onClick={onSignOut}
              title={`Signed in as ${authUser.email} — click to sign out`}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-medium text-[#D4DAB4] bg-[#2C3D2B]/80 hover:bg-[#3B5239] border border-[#789575]/65 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <span className="max-w-[105px] truncate">{authUser.name}</span>
              <span className="text-[#9BB498]">· Sign out</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenAuth('signin')}
              className="inline-flex items-center min-h-[40px] px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-medium text-[#D4DAB4] bg-[#2C3D2B]/75 hover:bg-[#3B5239] border border-[#789575]/65 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              Sign in
            </button>
          )}

          <motion.button
            type="button"
            whileHover={prefersReducedMotion ? undefined : { y: -1.5, scale: 1.02 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
            onClick={() => onEnterStudio('dashboard')}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-[#192418] bg-[#D4DAB4] hover:bg-[#C7CFA3] rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            Enter Studio
            <ArrowRight className="w-3.5 h-3.5" />
          </motion.button>
        </div>
      </motion.header>

      {/* Editorial Lower-Left Focal Anchor + Lower-Right Scroll Cue with staggered emergence from back */}
      <div className="relative z-10 w-full max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 pb-20 sm:pb-24 pt-10 sm:pt-20 flex flex-col md:flex-row md:items-end justify-between gap-6 sm:gap-8">
        <motion.div
          style={
            prefersReducedMotion
              ? undefined
              : {
                  rotateX: fgRotateX,
                  rotateY: fgRotateY,
                  x: fgShiftX,
                }
          }
          className="max-w-2xl space-y-4 sm:space-y-5 will-change-transform"
        >
          <EmergeBlock order={0} baseDelay={0.05}>
            <p className="text-xs sm:text-sm font-medium tracking-wide text-[#C5D1B8]">
              Autonomous Creator Agents
            </p>
          </EmergeBlock>

          <EmergeBlock order={1} baseDelay={0.05}>
            <h1
              className="font-display font-semibold tracking-tight leading-[1.03] text-[#D4DAB4]"
              style={{ fontSize: 'clamp(2.25rem, 5.4vw, 4.75rem)' }}
            >
              One video in.
              <br />
              Every cut out.
            </h1>
          </EmergeBlock>

          <EmergeBlock order={2} baseDelay={0.05}>
            <p className="text-sm sm:text-base text-[#C7CFA3] max-w-md leading-relaxed">
              Four coordinated post-production agents strip dead air, frame 9:16
              vertical reels, score A/B thumbnails, and package platform SEO.
            </p>
          </EmergeBlock>

          <EmergeBlock order={3} baseDelay={0.05}>
            <div className="flex flex-wrap items-center gap-3 pt-1 sm:pt-2">
              <motion.button
                type="button"
                whileHover={prefersReducedMotion ? undefined : { y: -2, scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                onClick={() => onEnterStudio('dashboard')}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 py-2.5 text-sm font-semibold text-[#192418] bg-[#D4DAB4] hover:bg-[#C7CFA3] border border-[#3B5239]/35 shadow-sm rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Enter Studio
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              <motion.button
                type="button"
                whileHover={prefersReducedMotion ? undefined : { y: -2, scale: 1.02 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                onClick={onLoadDemo}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2.5 text-sm font-semibold text-[#D4DAB4] bg-[#2C3D2B]/90 hover:bg-[#3B5239] border border-[#789575] rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <Play className="w-3.5 h-3.5 text-[#C5D1B8]" />
                Load Sample Demo
              </motion.button>
            </div>
          </EmergeBlock>
        </motion.div>

        <EmergeBlock order={4} baseDelay={0.05} className="self-start md:self-end">
          <motion.button
            type="button"
            whileHover={prefersReducedMotion ? undefined : { y: 2 }}
            onClick={() => scrollToSection('landing-capabilities')}
            className="inline-flex items-center gap-2 min-h-[40px] px-4 py-2 text-xs font-medium text-[#D4DAB4] bg-[#192418]/75 hover:bg-[#2C3D2B] border border-[#789575]/75 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            Scroll to explore
            <ArrowDown className="w-3.5 h-3.5 text-[#C5D1B8]" />
          </motion.button>
        </EmergeBlock>
      </div>
    </section>
  );
};
