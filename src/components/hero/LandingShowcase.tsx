import React from 'react';
import { ArrowRight, Play } from 'lucide-react';
import { motion, useReducedMotion } from 'motion/react';
import masterFrameImg from '../../assets/images/koda_master_frame_1794598216948.jpg';
import reelPortraitImg from '../../assets/images/koda_reel_portrait_1794598219671.jpg';
import thumbBImg from '../../assets/images/koda_thumb_b_1794598216967.jpg';
import thumbCImg from '../../assets/images/koda_thumb_c_1794598217533.jpg';
import { StudioSection } from '../../types/koda';
import { AuthMode, AuthUser } from '../auth/AuthPage';
import { TiltCard3D } from '../shared/TiltCard3D';
import { StudioRig3D } from '../three/StudioRig3D';

interface LandingShowcaseProps {
  onEnterStudio: (section?: StudioSection) => void;
  onLoadDemo: () => void;
  onOpenAuth?: (mode?: AuthMode) => void;
  authUser?: AuthUser | null;
}

const CAPABILITIES = [
  {
    number: '01',
    title: 'Dead-Air Pruning & ASR Index',
    metric: 'Up to 68% silence removed',
    detail:
      'Whisper speech boundaries isolate filler pauses and dead mic segments while keeping natural pacing intact across the horizontal 16:9 cut.',
  },
  {
    number: '02',
    title: 'Tension-Beat Moment Scoring',
    metric: 'Ranked peak highlight windows',
    detail:
      'Frame-level energy and transcript shifts pinpoint clutch plays, key arguments, and high-retention transitions ready for short-form extraction.',
  },
  {
    number: '03',
    title: '9:16 Vertical Reel Framing',
    metric: '3 portrait cuts per master',
    detail:
      'Subject-centered 9:16 crop tracks speakers and focal action with safe-zone kinetic caption placement for Shorts, Reels, and TikTok.',
  },
  {
    number: '04',
    title: 'Saliency A/B Covers & SEO',
    metric: '3 scored 16:9 covers + packs',
    detail:
      'Gaze heatmap critic benchmarks three thumbnail variants alongside tailored YouTube chapters, Instagram captions, and TikTok hooks.',
  },
];

const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Ingest Long-Form Cut',
    description:
      'Drop in a raw stream VOD, podcast episode, or studio commentary and pick a silence-trimming preset.',
  },
  {
    step: '02',
    title: 'Run Four Studio Agents',
    description:
      'Inspect transcript cut markers, tension-beat timelines, vertical reel crops, and saliency scores in one workspace.',
  },
  {
    step: '03',
    title: 'Export Platform Bundle',
    description:
      'Review chapters, tags, and A/B thumbnail winners, then package the full multi-platform release bundle.',
  },
];

export const LandingShowcase: React.FC<LandingShowcaseProps> = ({
  onEnterStudio,
  onLoadDemo,
  onOpenAuth,
  authUser,
}) => {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="bg-[#D4DAB4] text-[#192418]">
      {/* 01. Core Capabilities */}
      <section
        id="landing-capabilities"
        className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 pt-8 sm:pt-12 lg:pt-16 pb-14 sm:pb-20 lg:pb-24"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-start">
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-4 space-y-4"
          >
            <p className="text-xs font-mono font-medium text-[#3F523E]">
              01 · Post-Production Pipeline
            </p>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[#192418] leading-tight">
              Four specialists built for long-form creators.
            </h2>
            <p className="text-sm sm:text-base text-[#2C3D2B] leading-relaxed">
              Instead of scrubbing hours of dead air and rebuilding aspect ratios
              by hand, Koda turns one source recording into a structured release package.
            </p>
          </motion.div>

          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CAPABILITIES.map((item) => (
              <TiltCard3D key={item.number} enableScrollReveal maxTiltDeg={6}>
                <div className="h-full border border-[#789575] bg-[#C7CFA3] rounded-lg p-5 sm:p-6 lg:p-7 flex flex-col justify-between gap-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs font-mono">
                      <span className="font-bold text-[#3B5239]">{item.number}</span>
                      <span className="text-[#3F523E] tabular-nums">{item.metric}</span>
                    </div>
                    <h3 className="text-lg font-semibold text-[#192418]">
                      {item.title}
                    </h3>
                    <p className="text-sm text-[#2C3D2B] leading-relaxed">
                      {item.detail}
                    </p>
                  </div>
                </div>
              </TiltCard3D>
            ))}
          </div>
        </div>
      </section>

      {/* 02. Interactive 3D Multi-Cut Stage */}
      <section
        id="landing-stage-3d"
        className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 py-14 sm:py-20 lg:py-24 border-t border-[#789575]/45 space-y-8"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-mono font-medium text-[#3F523E]">
              02 · Real-Time 3D Studio Rig
            </p>
            <h2 className="text-2xl sm:text-4xl font-semibold tracking-tight text-[#192418]">
              Explore the multi-cut spatial assembly.
            </h2>
            <p className="text-sm sm:text-base text-[#2C3D2B] leading-relaxed">
              Orbit the 16:9 horizontal master, three orbiting 9:16 vertical reels,
              acoustic dead-air ring, and saliency gimbal in real time.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onEnterStudio('agents')}
            className="self-start md:self-end inline-flex items-center gap-2 min-h-[40px] px-4 py-2 text-xs sm:text-sm font-semibold text-[#192418] bg-[#C7CFA3] hover:bg-[#B9C493] border border-[#789575] rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            Inspect Agent Pipeline
            <ArrowRight className="w-4 h-4 text-[#3B5239]" />
          </button>
        </div>

        <StudioRig3D />
      </section>

      {/* 03. Deliverable Showcase */}
      <section
        id="landing-outputs"
        className="max-w-[1440px] mx-auto px-5 sm:px-10 lg:px-14 py-14 sm:py-20 lg:py-24 border-t border-[#789575]/45 space-y-10"
      >
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <p className="text-xs font-mono font-medium text-[#3F523E]">
              03 · Studio Deliverables
            </p>
            <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#192418]">
              Every format framed before you export.
            </h2>
          </div>
          <button
            type="button"
            onClick={() => onEnterStudio('workbench')}
            className="self-start md:self-end inline-flex items-center gap-2 px-4 py-2 text-xs sm:text-sm font-semibold text-[#192418] bg-[#C7CFA3] hover:bg-[#B9C493] border border-[#789575] rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            Inspect Workbench
            <ArrowRight className="w-4 h-4 text-[#3B5239]" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* 16:9 Master Frame — borderless, feathered into #D4DAB4 */}
          <div className="lg:col-span-7">
            <TiltCard3D enableScrollReveal maxTiltDeg={4}>
              <div className="flex flex-col gap-3">
                <div className="relative aspect-video overflow-hidden sage-photo-feather">
                  <img
                    src={masterFrameImg}
                    alt="16:9 tightened horizontal master cut preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover sage-photo-grade"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[#789575]/32 mix-blend-color pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[#D4DAB4]/20 mix-blend-soft-light pointer-events-none"
                  />
                </div>
                <div className="px-1 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                  <div>
                    <p className="text-xs font-mono text-[#3F523E]">16:9 Horizontal Master</p>
                    <p className="text-base sm:text-lg font-semibold text-[#192418] mt-0.5">
                      Silence-pruned timeline with clickable chapter markers
                    </p>
                  </div>
                  <span className="text-xs font-mono font-semibold text-[#2C3D2B] tabular-nums whitespace-nowrap shrink-0">
                    14m 18s
                  </span>
                </div>
              </div>
            </TiltCard3D>
          </div>

          {/* 9:16 Vertical Reel + A/B Covers — borderless, feathered into #D4DAB4 */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-7">
            <TiltCard3D enableScrollReveal maxTiltDeg={5}>
              <div className="flex flex-col gap-2.5">
                <div className="relative aspect-[3/4] overflow-hidden sage-photo-feather">
                  <img
                    src={reelPortraitImg}
                    alt="9:16 vertical reel portrait crop"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover sage-photo-grade"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[#789575]/32 mix-blend-color pointer-events-none"
                  />
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[#D4DAB4]/20 mix-blend-soft-light pointer-events-none"
                  />
                </div>
                <div className="px-1">
                  <p className="text-[11px] font-mono text-[#3F523E]">9:16 Vertical Reel</p>
                  <p className="text-sm font-semibold text-[#192418]">Safe-zone captions</p>
                </div>
              </div>
            </TiltCard3D>

            <div className="flex flex-col gap-7">
              <TiltCard3D enableScrollReveal maxTiltDeg={5}>
                <div className="flex flex-col gap-2">
                  <div className="relative aspect-video overflow-hidden sage-photo-feather">
                    <img
                      src={thumbBImg}
                      alt="Thumbnail A/B arena high-contrast variant"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover sage-photo-grade"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[#789575]/32 mix-blend-color pointer-events-none"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[#D4DAB4]/20 mix-blend-soft-light pointer-events-none"
                    />
                  </div>
                  <div className="px-1 text-xs">
                    <p className="font-semibold text-[#192418]">Variant B · Saliency Critic</p>
                    <p className="text-[#3F523E] font-mono mt-0.5 tabular-nums">
                      Predicted CTR 9.4%
                    </p>
                  </div>
                </div>
              </TiltCard3D>

              <TiltCard3D enableScrollReveal maxTiltDeg={5}>
                <div className="flex flex-col gap-2">
                  <div className="relative aspect-video overflow-hidden sage-photo-feather">
                    <img
                      src={thumbCImg}
                      alt="Thumbnail A/B arena reaction frame variant"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover sage-photo-grade"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[#789575]/32 mix-blend-color pointer-events-none"
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-[#D4DAB4]/20 mix-blend-soft-light pointer-events-none"
                    />
                  </div>
                  <div className="px-1 text-xs">
                    <p className="font-semibold text-[#192418]">Variant C · Gaze Benchmarked</p>
                    <p className="text-[#3F523E] font-mono mt-0.5 tabular-nums">
                      Predicted CTR 8.7%
                    </p>
                  </div>
                </div>
              </TiltCard3D>
            </div>
          </div>
        </div>
      </section>

      {/* 04. Workflow + Studio Window Launch Callout */}
      <section
        id="landing-workflow"
        className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 py-20 lg:py-24 border-t border-[#789575]/45 space-y-14"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {WORKFLOW_STEPS.map((item, idx) => (
            <motion.div
              key={item.step}
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20, rotateX: 8 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{
                duration: 0.5,
                delay: idx * 0.08,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="space-y-2.5 pt-4 border-t border-[#789575]"
            >
              <span className="text-xs font-mono font-bold text-[#3B5239]">
                {item.step}
              </span>
              <h3 className="text-lg font-semibold text-[#192418]">
                {item.title}
              </h3>
              <p className="text-sm text-[#2C3D2B] leading-relaxed">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>

        <TiltCard3D enableScrollReveal maxTiltDeg={3}>
          <div className="rounded-lg bg-[#2C3D2B] border border-[#789575] p-8 sm:p-10 lg:p-12 flex flex-col lg:flex-row lg:items-center justify-between gap-8 text-[#D4DAB4]">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs font-mono text-[#C5D1B8]">
                Dedicated Studio Environment
              </p>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#D4DAB4]">
                Open the Koda workspace when you are ready to cut.
              </h2>
              <p className="text-sm text-[#C7CFA3] leading-relaxed">
                Launch the full interactive studio with preloaded demo footage, live
                timeline markers, vertical reel switching, and platform SEO exports.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => onEnterStudio('dashboard')}
                className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[#192418] bg-[#D4DAB4] hover:bg-[#C7CFA3] rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                Enter Studio
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={onLoadDemo}
                className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#D4DAB4] bg-[#3B5239] hover:bg-[#496547] border border-[#789575] rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                <Play className="w-3.5 h-3.5 text-[#C5D1B8]" />
                Load Sample Demo
              </button>

              {onOpenAuth && !authUser && (
                <button
                  type="button"
                  onClick={() => onOpenAuth('signup')}
                  className="inline-flex items-center gap-2 px-4 py-3 text-sm font-semibold text-[#D4DAB4] hover:text-[#192418] bg-transparent hover:bg-[#C7CFA3] border border-[#789575] rounded-md transition-colors whitespace-nowrap shrink-0"
                >
                  Create Account
                </button>
              )}
            </div>
          </div>
        </TiltCard3D>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-[#789575]/45">
        <div className="max-w-[1440px] mx-auto px-6 sm:px-10 lg:px-14 py-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[#3F523E]">
          <div className="flex items-center gap-3">
            <span className="font-display font-semibold text-sm text-[#192418]">
              Koda
            </span>
            <span aria-hidden="true">·</span>
            <span>Autonomous Creator Post-Production Studio</span>
          </div>
          <div className="flex items-center gap-5">
            {onOpenAuth && !authUser && (
              <button
                type="button"
                onClick={() => onOpenAuth('signin')}
                className="font-semibold text-[#3F523E] hover:text-[#192418] transition-colors whitespace-nowrap"
              >
                Sign in
              </button>
            )}
            <button
              type="button"
              onClick={() => onEnterStudio('dashboard')}
              className="font-semibold text-[#2C3D2B] hover:text-[#192418] inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              Enter Studio
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
