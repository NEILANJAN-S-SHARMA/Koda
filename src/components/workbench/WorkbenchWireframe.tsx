import React, { useEffect, useMemo, useState } from 'react';
import { Captions, Pause, Play, Scissors } from 'lucide-react';
import { motion } from 'motion/react';
import masterFrameImg from '../../assets/images/koda_master_frame_1794598216948.jpg';
import reelPortraitImg from '../../assets/images/koda_reel_portrait_1794598219671.jpg';
import { formatDuration } from '../../lib/formatters';
import { KodaProject } from '../../types/koda';
import { EmergeBlock } from '../shared/EmergeBlock';

interface WorkbenchWireframeProps {
  project: KodaProject;
  onToggleReelCaption: (reelId: string) => void;
  onSelectReel: (reelId: string) => void;
  selectedReelId: string;
}

const MASTER_FRAME_SRC = masterFrameImg;
const REEL_PORTRAIT_SRC = reelPortraitImg;

export const WorkbenchWireframe: React.FC<WorkbenchWireframeProps> = ({
  project,
  onToggleReelCaption,
  onSelectReel,
  selectedReelId,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(project.chapters[0]?.timestampSec ?? 0);

  const totalDuration = project.media.durationSeconds || 560;
  const removedTotal = project.removedSilences.reduce(
    (sum, item) => sum + item.durationSec,
    0
  );

  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      setCurrentSec((prev) => (prev + 1 >= totalDuration ? 0 : prev + 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isPlaying, totalDuration]);

  const waveformBars = useMemo(
    () =>
      Array.from({ length: 72 }, (_, idx) => {
        const wave = Math.abs(Math.sin(idx * 0.45) * 0.65 + Math.cos(idx * 0.9) * 0.35);
        return Math.max(18, Math.round(wave * 100));
      }),
    []
  );

  return (
    <div className="space-y-8">
      <EmergeBlock order={0}>
        <div className="pb-6 border-b border-[#789575]/60 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#192418]">
              {project.title}
            </h1>
            <p className="text-xs text-[#3F523E] mt-1">
              Cleaned 16:9 horizontal master paired with auto-framed 9:16 vertical tension reels.
            </p>
          </div>
          <p className="text-xs font-mono font-semibold text-[#2C3D2B] tabular-nums whitespace-nowrap shrink-0">
            {formatDuration(totalDuration)} raw · -{removedTotal}s silence stripped
          </p>
        </div>
      </EmergeBlock>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT: CLEANED HORIZONTAL MASTER */}
        <EmergeBlock order={1} className="xl:col-span-7">
          <section className="border border-[#789575] bg-[#C7CFA3] rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#789575] bg-[#789575] flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#141E13]">
              Cleaned Horizontal Master
            </h2>
            <span className="text-xs font-mono font-medium text-[#192418] tabular-nums">
              16:9 · {project.media.resolution} · {project.media.fps} fps
            </span>
          </div>

          {/* 16:9 NLE Monitor */}
          <div className="aspect-video w-full bg-[#192418] relative overflow-hidden">
            <img
              src={MASTER_FRAME_SRC}
              alt="Master horizontal video preview frame"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#192418]/90 via-transparent to-[#192418]/50" />

            {/* Top HUD */}
            <div className="absolute top-3.5 inset-x-4 flex items-center justify-between text-[11px] font-mono text-[#D4DAB4]">
              <span className="bg-[#192418]/80 backdrop-blur-xs px-2.5 py-0.5 rounded border border-[#789575]/65 truncate max-w-[65%]">
                {project.media.filename}
              </span>
              <span className="bg-[#192418]/80 backdrop-blur-xs px-2.5 py-0.5 rounded border border-[#789575]/65 tabular-nums">
                {formatDuration(currentSec)} / {formatDuration(totalDuration)}
              </span>
            </div>

            {/* Bottom Transport Bar */}
            <div className="absolute bottom-3.5 inset-x-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsPlaying((prev) => !prev)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-[#192418] bg-[#D4DAB4] hover:bg-[#C7CFA3] border border-[#789575] rounded-md transition-colors"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-[#192418]" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-[#3B5239]" />
                    Play Preview
                  </>
                )}
              </button>

              <span className="text-[11px] font-mono text-[#D4DAB4] bg-[#192418]/80 backdrop-blur-xs px-2.5 py-1 rounded border border-[#789575]/65 tabular-nums">
                {isPlaying ? 'Playing' : 'Paused'} · Demo Monitor
              </span>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Timeline + Waveform + Dead-Air Regions */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 font-semibold text-[#192418]">
                  <Scissors className="w-3.5 h-3.5 text-[#3B5239]" />
                  Master Timeline
                </span>
                <span className="text-[11px] font-mono text-[#3F523E] tabular-nums">
                  {project.removedSilences.length} dead-air cuts removed
                </span>
              </div>

              <div
                className="relative h-12 bg-[#D4DAB4] border border-[#789575] rounded-md overflow-hidden cursor-pointer select-none"
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  setCurrentSec(Math.round(ratio * totalDuration));
                }}
                title="Click timeline to scrub timestamp"
              >
                {/* Audio Waveform Bars */}
                <div className="absolute inset-0 flex items-center justify-between px-1 gap-[2px] opacity-90">
                  {waveformBars.map((heightPct, i) => (
                    <div
                      key={i}
                      style={{ height: `${heightPct * 0.65}%` }}
                      className="flex-1 bg-[#557053] rounded-full"
                    />
                  ))}
                </div>

                {/* Removed silence segments */}
                {project.removedSilences.map((sil) => {
                  const leftPct = (sil.startSec / totalDuration) * 100;
                  const widthPct = Math.max(1.5, (sil.durationSec / totalDuration) * 100);
                  return (
                    <div
                      key={sil.id}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                      title={`${formatDuration(sil.startSec)}–${formatDuration(sil.endSec)}: ${sil.reason}`}
                      className="absolute inset-y-0 bg-[#D4DAB4]/90 border-x border-[#2C3D2B] sage-hatch"
                    />
                  );
                })}

                {/* Playhead */}
                <div
                  style={{ left: `${(currentSec / totalDuration) * 100}%` }}
                  className="absolute inset-y-0 w-0.5 bg-[#192418]"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-[#3F523E]">
                <span>Forest sage · Retained program</span>
                <span>Hatched ivory · Stripped silence</span>
              </div>
            </div>

            {/* Semantic Chapter Navigation */}
            <div className="space-y-2.5 pt-4 border-t border-[#789575]/45">
              <p className="text-xs font-semibold text-[#2C3D2B]">
                Semantic Chapters
              </p>
              <div className="flex flex-wrap gap-2">
                {project.chapters.map((chapter) => {
                  const active = Math.abs(currentSec - chapter.timestampSec) < 5;
                  return (
                    <button
                      key={chapter.id}
                      type="button"
                      onClick={() => setCurrentSec(chapter.timestampSec)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-[#3B5239] border-[#2C3D2B] text-[#D4DAB4] font-semibold'
                          : 'bg-[#D4DAB4] border-[#789575] text-[#2C3D2B] hover:bg-[#BDC799]'
                      }`}
                    >
                      <span
                        className={`font-mono mr-1.5 tabular-nums ${
                          active ? 'text-[#C7CFA3]' : 'text-[#557053]'
                        }`}
                      >
                        {chapter.timestampLabel}
                      </span>
                      {chapter.title}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          </section>
        </EmergeBlock>

        {/* RIGHT: VERTICAL TENSION REELS */}
        <EmergeBlock order={2} className="xl:col-span-5">
          <section className="border border-[#789575] bg-[#C7CFA3] rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#789575] bg-[#789575] flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[#141E13]">
              Vertical Tension Reels
            </h2>
            <span className="text-xs font-mono font-medium text-[#192418] tabular-nums">
              9:16 · {project.reels.length} cuts
            </span>
          </div>

          <div className="divide-y divide-[#789575]/45">
            {project.reels.map((reel) => {
              const isSelected = reel.id === selectedReelId;
              return (
                <div
                  key={reel.id}
                  onClick={() => onSelectReel(reel.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectReel(reel.id);
                    }
                  }}
                  style={{ perspective: '700px' }}
                  className={`p-4 transition-colors cursor-pointer flex gap-4 ${
                    isSelected ? 'bg-[#B9C493]' : 'bg-[#D4DAB4]/60 hover:bg-[#BDC799]'
                  }`}
                >
                  {/* 9:16 Portrait Preview with 3D tilt */}
                  <motion.div
                    animate={
                      isSelected
                        ? { rotateY: 6, scale: 1.03 }
                        : { rotateY: 0, scale: 1 }
                    }
                    whileHover={{ rotateY: -8, scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                    className="w-20 aspect-[9/16] rounded border border-[#3B5239] bg-[#192418] shrink-0 relative overflow-hidden"
                  >
                    <img
                      src={REEL_PORTRAIT_SRC}
                      alt={`Vertical reel preview for ${reel.title}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#192418]/90 via-transparent to-[#192418]/40" />
                    <span className="absolute top-1.5 left-1.5 text-[10px] font-mono text-[#D4DAB4] bg-[#192418]/80 px-1 rounded">
                      0{reel.index}
                    </span>

                    {reel.captionsEnabled && (
                      <div className="absolute bottom-2 inset-x-1.5 bg-[#D4DAB4] border border-[#3B5239] rounded px-1 py-0.5 text-[8px] font-bold text-[#192418] text-center leading-tight">
                        {reel.sampleCaption.slice(0, 22)}
                      </div>
                    )}
                  </motion.div>

                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-mono font-semibold text-[#2C3D2B] tabular-nums">
                          {reel.tensionBadge}
                        </span>
                        <span className="text-[11px] font-mono text-[#3F523E] tabular-nums">
                          {reel.durationSec}s
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-[#192418] mt-1 leading-snug">
                        {reel.title}
                      </h3>
                      <p className="text-xs text-[#2C3D2B] mt-1">
                        Hook {reel.hookTimestamp} · {reel.framingNote}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-[#789575]/40">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleReelCaption(reel.id);
                        }}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                          reel.captionsEnabled
                            ? 'bg-[#3B5239] border-[#2C3D2B] text-[#D4DAB4]'
                            : 'bg-[#D4DAB4] border-[#789575] text-[#2C3D2B] hover:bg-[#C7CFA3]'
                        }`}
                      >
                        <Captions className="w-3.5 h-3.5" />
                        {reel.captionsEnabled ? 'Captions On' : 'Captions Off'}
                      </button>

                      <span
                        className={`text-[11px] font-mono ${
                          isSelected ? 'text-[#192418] font-semibold' : 'text-[#3F523E]'
                        }`}
                      >
                        {isSelected ? 'Active Reel' : 'Select'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          </section>
        </EmergeBlock>
      </div>
    </div>
  );
};
