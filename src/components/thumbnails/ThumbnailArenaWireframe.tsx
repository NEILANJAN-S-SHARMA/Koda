import React, { useState } from 'react';
import { Award, Check, Eye, EyeOff } from 'lucide-react';
import thumbAImg from '../../assets/images/koda_master_frame_1794598216948.jpg';
import thumbBImg from '../../assets/images/koda_thumb_b_1794598216967.jpg';
import thumbCImg from '../../assets/images/koda_thumb_c_1794598217533.jpg';
import { KodaProject } from '../../types/koda';
import { EmergeBlock } from '../shared/EmergeBlock';
import { TiltCard3D } from '../shared/TiltCard3D';

interface ThumbnailArenaWireframeProps {
  project: KodaProject;
  onSelectThumbnail: (thumbnailId: string) => void;
}

const THUMB_IMAGES: Record<'A' | 'B' | 'C', { src: string; headline: string }> = {
  A: {
    src: thumbAImg,
    headline: '0.3s CLUTCH',
  },
  B: {
    src: thumbBImg,
    headline: '1v4 BREAKDOWN',
  },
  C: {
    src: thumbCImg,
    headline: 'MAP 3 DECIDER',
  },
};

export const ThumbnailArenaWireframe: React.FC<ThumbnailArenaWireframeProps> = ({
  project,
  onSelectThumbnail,
}) => {
  const [showHeatmap, setShowHeatmap] = useState(true);

  return (
    <div className="space-y-8">
      <EmergeBlock order={0}>
        <div className="pb-6 border-b border-[#789575]/60 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#192418]">
              Thumbnail A/B & Saliency Arena
            </h1>
            <p className="text-xs text-[#3F523E] mt-1">
              Simulated eye-tracking attention heatmaps and predicted CTR hierarchy across three 16:9 compositions.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowHeatmap((prev) => !prev)}
            aria-pressed={showHeatmap}
            className={`inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-md border transition-colors whitespace-nowrap shrink-0 ${
              showHeatmap
                ? 'bg-[#3B5239] border-[#2C3D2B] text-[#D4DAB4]'
                : 'bg-[#C7CFA3] border-[#789575] text-[#192418] hover:bg-[#BDC799]'
            }`}
          >
            {showHeatmap ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            Toggle Attention Heatmap Overlay
          </button>
        </div>
      </EmergeBlock>

      {showHeatmap && (
        <EmergeBlock order={1}>
          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-[#2C3D2B]">
            <span className="font-mono text-[#3F523E]">Attention Intensity:</span>
            <span className="inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#192418]" />
              High gaze focus
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#789575]" />
              Moderate scan path
            </span>
            <span className="inline-flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D4DAB4] border border-[#3B5239]" />
              Peripheral falloff
            </span>
          </div>
        </EmergeBlock>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {project.thumbnails.map((variant, index) => {
          const isSelected = project.selectedThumbnailId === variant.id;
          const media = THUMB_IMAGES[variant.variantKey];
          return (
            <EmergeBlock key={variant.id} order={index + 1.5}>
              <TiltCard3D maxTiltDeg={6}>
              <article
                className={`h-full border rounded-lg overflow-hidden flex flex-col justify-between transition-colors ${
                  isSelected
                    ? 'border-[#3B5239] bg-[#B9C493] ring-1 ring-[#3B5239]'
                    : 'border-[#789575] bg-[#C7CFA3]'
                }`}
              >
                <div>
                  {/* 16:9 Thumbnail Frame + Saliency Overlay */}
                  <div className="aspect-video w-full bg-[#192418] border-b border-[#789575] relative overflow-hidden">
                    <img
                      src={media.src}
                      alt={`Thumbnail Variant ${variant.variantKey}: ${variant.title}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#192418]/85 via-transparent to-[#192418]/45" />

                    <div className="relative z-10 h-full p-4 flex flex-col justify-between">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-[#D4DAB4] bg-[#192418]/85 backdrop-blur-xs px-2 py-0.5 rounded border border-[#789575]/65">
                          Variant {variant.variantKey}
                        </span>
                        {variant.isAutoWinner && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-[#192418] bg-[#D4DAB4] px-2 py-0.5 rounded border border-[#3B5239]">
                            <Award className="w-3 h-3 text-[#3B5239]" />
                            AUTO-SELECTED WINNER
                          </span>
                        )}
                      </div>

                      <div>
                        <p className="text-lg font-bold tracking-tight text-[#D4DAB4] drop-shadow-sm font-display">
                          {media.headline}
                        </p>
                      </div>
                    </div>

                    {/* Simulated Radial Heatmap Overlay */}
                    <div
                      className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
                        showHeatmap ? 'opacity-90' : 'opacity-0'
                      }`}
                    >
                      {variant.heatmapHotspots.map((spot, idx) => {
                        const gradientColor =
                          spot.intensity === 'high'
                            ? 'rgba(212, 218, 180, 0.8), rgba(120, 149, 117, 0.5) 45%, transparent 74%'
                            : spot.intensity === 'medium'
                            ? 'rgba(120, 149, 117, 0.7), rgba(212, 218, 180, 0.3) 50%, transparent 75%'
                            : 'rgba(120, 149, 117, 0.4), transparent 70%';
                        return (
                          <div
                            key={idx}
                            style={{
                              left: `${spot.xPercent}%`,
                              top: `${spot.yPercent}%`,
                              width: `${spot.radiusPercent * 2}%`,
                              height: `${spot.radiusPercent * 2}%`,
                              transform: 'translate(-50%, -50%)',
                              background: `radial-gradient(circle, ${gradientColor})`,
                            }}
                            className="absolute rounded-full"
                          />
                        );
                      })}
                    </div>
                  </div>

                  {/* Metrics & Critique */}
                  <div className="p-5 space-y-3.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-xs font-medium text-[#2C3D2B]">
                        Predicted CTR (Simulated)
                      </span>
                      <span className="text-xl font-semibold font-mono text-[#192418] tabular-nums">
                        {variant.predictedCtr.toFixed(1)}%
                      </span>
                    </div>

                    <div className="w-full h-2 bg-[#D4DAB4] border border-[#789575]/45 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          variant.isAutoWinner ? 'bg-[#3B5239]' : 'bg-[#789575]'
                        }`}
                        style={{ width: `${Math.min(100, variant.predictedCtr * 10)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs font-mono text-[#3F523E] tabular-nums">
                      <span>Hierarchy Score</span>
                      <span className="font-semibold text-[#192418]">{variant.hierarchyScore}/100</span>
                    </div>

                    <p className="text-xs text-[#2C3D2B] leading-relaxed pt-3 border-t border-[#789575]/40">
                      {variant.critique}
                    </p>
                  </div>
                </div>

                <div className="px-5 pb-5">
                  <button
                    type="button"
                    onClick={() => onSelectThumbnail(variant.id)}
                    className={`w-full py-2 px-3 rounded-md text-xs font-semibold inline-flex items-center justify-center gap-1.5 border transition-colors ${
                      isSelected
                        ? 'bg-[#3B5239] border-[#2C3D2B] text-[#D4DAB4]'
                        : 'bg-[#D4DAB4] border-[#789575] text-[#192418] hover:bg-[#BDC799]'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    {isSelected ? 'Selected for Bundle' : `Select Variant ${variant.variantKey}`}
                  </button>
                </div>
              </article>
              </TiltCard3D>
            </EmergeBlock>
          );
        })}
      </div>
    </div>
  );
};
