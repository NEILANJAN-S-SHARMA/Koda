import React, { useLayoutEffect, useRef, useState } from 'react';
import { Check, Copy, Download, Package } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { KodaProject } from '../../types/koda';
import { EmergeBlock } from '../shared/EmergeBlock';

interface SeoExportWireframeProps {
  project: KodaProject;
  onUpdateYoutubeTitle: (value: string) => void;
  onUpdateYoutubeDescription: (value: string) => void;
  onUpdateInstagramCaption: (value: string) => void;
  onUpdateTiktokHook: (value: string) => void;
}

type PlatformTab = 'youtube' | 'instagram' | 'tiktok';

const AutoResizeTextarea: React.FC<{
  id: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}> = ({ id, value, onChange, className = '' }) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      id={id}
      rows={1}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full overflow-hidden resize-none bg-[#D4DAB4] border border-[#789575] focus:border-[#3B5239] focus:outline-none rounded-md px-3.5 py-2.5 text-sm text-[#192418] leading-relaxed ${className}`}
    />
  );
};

export const SeoExportWireframe: React.FC<SeoExportWireframeProps> = ({
  project,
  onUpdateYoutubeTitle,
  onUpdateYoutubeDescription,
  onUpdateInstagramCaption,
  onUpdateTiktokHook,
}) => {
  const [platform, setPlatform] = useState<PlatformTab>('youtube');
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const handleCopy = async (field: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1600);
    } catch {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 1600);
    }
  };

  return (
    <div className="space-y-8">
      <EmergeBlock order={0}>
        <div className="pb-6 border-b border-[#789575]/60">
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#192418]">
            Semantic SEO & Export Studio
          </h1>
          <p className="text-xs text-[#3F523E] mt-1">
            Edit platform-specific copy, copy semantic keywords, and review your asset bundle manifest.
          </p>
        </div>
      </EmergeBlock>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* LEFT: PLATFORM SEO EDITOR */}
        <EmergeBlock order={1} className="xl:col-span-7">
          <section className="border border-[#789575] bg-[#C7CFA3] rounded-lg p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#D4DAB4] border border-[#789575] rounded-md w-full sm:w-fit max-w-full">
            {(
              [
                { id: 'youtube', label: 'YouTube' },
                { id: 'instagram', label: 'Instagram Reels' },
                { id: 'tiktok', label: 'TikTok' },
              ] as const
            ).map((tab) => {
              const active = platform === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPlatform(tab.id)}
                  className={`relative flex-1 sm:flex-initial px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded transition-colors whitespace-nowrap ${
                    active ? 'text-[#D4DAB4]' : 'text-[#2C3D2B] hover:text-[#141E13]'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="seo-platform-tab-morph"
                      transition={{ type: 'spring', stiffness: 190, damping: 26, mass: 1 }}
                      className="absolute inset-0 bg-[#3B5239] rounded"
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="popLayout" initial={false}>
            {platform === 'youtube' && (
              <motion.div
                key="youtube"
                initial={{ opacity: 0, scale: 0.985, filter: 'blur(5px)' }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  filter: 'blur(0px)',
                  transitionEnd: { filter: 'none', transform: 'none' },
                }}
                exit={{ opacity: 0, scale: 1.015, filter: 'blur(5px)' }}
                transition={{ duration: 0.62, ease: [0.32, 0.02, 0.18, 1] }}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="yt-title" className="text-xs font-semibold text-[#2C3D2B]">
                      Optimized YouTube Title
                    </label>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] font-mono text-[#3F523E] tabular-nums">
                        {project.seo.youtube.title.length}/100
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy('yt-title', project.seo.youtube.title)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-[#2C3D2B] hover:text-[#141E13]"
                      >
                        {copiedField === 'yt-title' ? (
                          <Check className="w-3.5 h-3.5 text-[#3B5239]" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-[#557053]" />
                        )}
                        {copiedField === 'yt-title' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <input
                    id="yt-title"
                    type="text"
                    value={project.seo.youtube.title}
                    onChange={(e) => onUpdateYoutubeTitle(e.target.value)}
                    className="w-full bg-[#D4DAB4] border border-[#789575] focus:border-[#3B5239] focus:outline-none rounded-md px-3.5 py-2.5 text-sm text-[#192418]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="yt-desc" className="text-xs font-semibold text-[#2C3D2B]">
                      Video Description & Chapters
                    </label>
                    <button
                      type="button"
                      onClick={() => handleCopy('yt-desc', project.seo.youtube.description)}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#2C3D2B] hover:text-[#141E13]"
                    >
                      {copiedField === 'yt-desc' ? (
                        <Check className="w-3.5 h-3.5 text-[#3B5239]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-[#557053]" />
                      )}
                      {copiedField === 'yt-desc' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <AutoResizeTextarea
                    id="yt-desc"
                    value={project.seo.youtube.description}
                    onChange={onUpdateYoutubeDescription}
                  />
                </div>

                <div className="space-y-2 pt-3 border-t border-[#789575]/45">
                  <p className="text-xs font-semibold text-[#2C3D2B]">
                    Semantic Keywords (click to copy)
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {project.seo.youtube.keywords.map((kw) => (
                      <button
                        key={kw}
                        type="button"
                        onClick={() => handleCopy(`kw-${kw}`, kw)}
                        className="px-2.5 py-1 text-xs font-mono bg-[#D4DAB4] hover:bg-[#789575] border border-[#789575] rounded text-[#192418] transition-colors"
                      >
                        {copiedField === `kw-${kw}` ? `Copied: ${kw}` : kw}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {platform === 'instagram' && (
              <motion.div
                key="instagram"
                initial={{ opacity: 0, scale: 0.985, filter: 'blur(5px)' }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  filter: 'blur(0px)',
                  transitionEnd: { filter: 'none', transform: 'none' },
                }}
                exit={{ opacity: 0, scale: 1.015, filter: 'blur(5px)' }}
                transition={{ duration: 0.62, ease: [0.32, 0.02, 0.18, 1] }}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="ig-caption" className="text-xs font-semibold text-[#2C3D2B]">
                      Instagram Reels Caption
                    </label>
                    <span className="text-[11px] font-mono text-[#3F523E] tabular-nums">
                      {project.seo.instagram.caption.length} chars
                    </span>
                  </div>
                  <AutoResizeTextarea
                    id="ig-caption"
                    value={project.seo.instagram.caption}
                    onChange={onUpdateInstagramCaption}
                  />
                </div>
                <p className="text-xs font-mono text-[#3F523E]">
                  {project.seo.instagram.hashtags.join(' ')}
                </p>
              </motion.div>
            )}

            {platform === 'tiktok' && (
              <motion.div
                key="tiktok"
                initial={{ opacity: 0, scale: 0.985, filter: 'blur(5px)' }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  filter: 'blur(0px)',
                  transitionEnd: { filter: 'none', transform: 'none' },
                }}
                exit={{ opacity: 0, scale: 1.015, filter: 'blur(5px)' }}
                transition={{ duration: 0.62, ease: [0.32, 0.02, 0.18, 1] }}
                className="space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="tt-hook" className="text-xs font-semibold text-[#2C3D2B]">
                      TikTok Hook-Oriented Caption
                    </label>
                    <span className="text-[11px] font-mono text-[#3F523E] tabular-nums">
                      {project.seo.tiktok.hookCaption.length} chars
                    </span>
                  </div>
                  <AutoResizeTextarea
                    id="tt-hook"
                    value={project.seo.tiktok.hookCaption}
                    onChange={onUpdateTiktokHook}
                  />
                </div>
                <p className="text-xs font-mono text-[#3F523E]">
                  {project.seo.tiktok.hashtags.join(' ')}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          </section>
        </EmergeBlock>

        {/* RIGHT: EXPORT SYSTEM */}
        <EmergeBlock order={2} className="xl:col-span-5">
          <section className="border border-[#789575] bg-[#C7CFA3] rounded-lg overflow-hidden">
          <div className="px-5 py-3.5 border-b border-[#789575] bg-[#789575] flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold text-[#141E13] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#192418]" />
              Export Bundle Manifest
            </h2>
            <span className="text-[11px] font-mono font-medium text-[#192418]">
              {project.exportManifest.length} items
            </span>
          </div>

          <div className="p-5 sm:p-6 space-y-4">
            <div className="divide-y divide-[#789575]/45 border border-[#789575] rounded-md bg-[#D4DAB4]">
              {project.exportManifest.map((item) => (
                <div
                  key={item.id}
                  className="px-3.5 py-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#192418] truncate">
                      {item.label}
                    </p>
                    <p className="text-[11px] font-mono text-[#3F523E] mt-0.5">
                      {item.format}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono font-medium text-[#2C3D2B] whitespace-nowrap shrink-0 tabular-nums">
                    {item.estimatedSize}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setExportNotice(
                  'TODO Phase 2: Connect GET /api/projects/{id}/export (FastAPI ZipFile stream) to download the full asset bundle.'
                )
              }
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-[#D4DAB4] bg-[#3B5239] hover:bg-[#2C3D2B] rounded-md transition-colors"
            >
              <Download className="w-4 h-4" />
              Download Asset Bundle (.ZIP)
            </button>

            {exportNotice && (
              <p className="text-xs text-[#2C3D2B] bg-[#D4DAB4] border border-[#789575] rounded-md p-3 leading-relaxed">
                {exportNotice}
              </p>
            )}
          </div>
          </section>
        </EmergeBlock>
      </div>
    </div>
  );
};
