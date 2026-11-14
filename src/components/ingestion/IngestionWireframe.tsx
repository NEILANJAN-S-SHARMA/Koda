import React, { useRef, useState } from 'react';
import { ArrowRight, Check, FileVideo, UploadCloud } from 'lucide-react';
import { CONTENT_PRESETS, OUTPUT_OPTION_META } from '../../data/mockProjectData';
import { formatBytes } from '../../lib/formatters';
import { ContentPreset, OutputTarget } from '../../types/koda';
import { EmergeBlock } from '../shared/EmergeBlock';

interface IngestionWireframeProps {
  selectedPreset: ContentPreset;
  selectedOutputs: OutputTarget[];
  projectTitle: string;
  onChangeTitle: (title: string) => void;
  onChangePreset: (preset: ContentPreset) => void;
  onToggleOutput: (output: OutputTarget) => void;
  onFileSelected: (file: { name: string; size: number }) => void;
  selectedFile: { name: string; size: number } | null;
  onHandOff: () => void;
  onLoadDemo: () => void;
}

const PRESET_KEYS: ContentPreset[] = ['gaming', 'podcast', 'tech'];
const OUTPUT_KEYS: OutputTarget[] = [
  'horizontal_master',
  'vertical_reels',
  'ab_thumbnails',
  'seo_pack',
];

export const IngestionWireframe: React.FC<IngestionWireframeProps> = ({
  selectedPreset,
  selectedOutputs,
  projectTitle,
  onChangeTitle,
  onChangePreset,
  onToggleOutput,
  onFileSelected,
  selectedFile,
  onHandOff,
  onLoadDemo,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    onFileSelected({ name: file.name, size: file.size });
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <EmergeBlock order={0}>
        <div className="pb-6 border-b border-[#789575]/60 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#192418]">
              New Studio Project
            </h1>
            <p className="text-xs text-[#3F523E] mt-1">
              Ingest source footage, choose a content profile, and select output deliverables before handing off to Koda.
            </p>
          </div>

          <button
            type="button"
            onClick={onLoadDemo}
            className="text-xs font-semibold text-[#192418] bg-[#C7CFA3] hover:bg-[#BDC799] border border-[#789575] px-3.5 py-2 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            Use Sample Gaming VOD
          </button>
        </div>
      </EmergeBlock>

      <EmergeBlock order={1}>
        <div className="space-y-2">
          <label htmlFor="project-title-input" className="block text-xs font-semibold text-[#2C3D2B]">
            Project Title
          </label>
          <input
            id="project-title-input"
            type="text"
            value={projectTitle}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder="e.g., Champions Map 3 — Full VOD Breakdown"
            className="w-full bg-[#C7CFA3] border border-[#789575] focus:border-[#3B5239] focus:outline-none rounded-md px-3.5 py-2.5 text-sm font-medium text-[#192418] placeholder:text-[#557053]"
          />
        </div>
      </EmergeBlock>

      <EmergeBlock order={2}>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            handleFiles(e.dataTransfer.files);
          }}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-[#3B5239] bg-[#789575]/30'
              : 'border-[#789575] bg-[#C7CFA3] hover:bg-[#BDC799]'
          }`}
        >
        <input
          ref={inputRef}
          type="file"
          accept=".mp4,.mov,video/mp4,video/quicktime"
          onChange={(e) => handleFiles(e.target.files)}
          className="sr-only"
        />

        {selectedFile ? (
          <div className="flex flex-col items-center gap-2">
            <FileVideo className="w-8 h-8 text-[#3B5239]" />
            <p className="text-sm font-semibold text-[#192418]">{selectedFile.name}</p>
            <p className="text-xs font-mono text-[#3F523E] tabular-nums">
              {formatBytes(selectedFile.size)} · Ready for pipeline handoff
            </p>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="mt-2 text-xs font-semibold text-[#2C3D2B] hover:text-[#141E13] underline underline-offset-2 transition-colors"
            >
              Replace source file
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <UploadCloud className="w-8 h-8 text-[#3B5239]" />
            <div>
              <p className="text-sm font-semibold text-[#192418]">
                Drop source video here (.mp4, .mov)
              </p>
              <p className="text-xs text-[#3F523E] mt-1">
                Select a local recording or launch directly with the sample esports VOD.
              </p>
            </div>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 text-xs font-semibold text-[#D4DAB4] bg-[#3B5239] hover:bg-[#2C3D2B] rounded-md transition-colors whitespace-nowrap"
            >
              Browse Local Video
            </button>
          </div>
        )}
        </div>
      </EmergeBlock>

      <EmergeBlock order={3}>
        <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-[#192418]">Content Preset</h2>
          <p className="text-xs text-[#3F523E] mt-0.5">
            Configures dead-air thresholds, tension scoring weights, and default outputs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {PRESET_KEYS.map((key) => {
            const preset = CONTENT_PRESETS[key];
            const active = selectedPreset === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onChangePreset(key)}
                className={`text-left p-5 rounded-lg border transition-colors flex flex-col justify-between ${
                  active
                    ? 'bg-[#3B5239] border-[#2C3D2B] text-[#D4DAB4]'
                    : 'bg-[#C7CFA3] border-[#789575] text-[#192418] hover:bg-[#BDC799]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`text-sm font-semibold ${
                        active ? 'text-[#D4DAB4]' : 'text-[#192418]'
                      }`}
                    >
                      {preset.label}
                    </span>
                    {active && (
                      <span className="text-[11px] font-mono font-semibold text-[#D4DAB4] bg-[#789575] px-2 py-0.5 rounded">
                        Selected
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-2 leading-relaxed ${
                      active ? 'text-[#C7CFA3]' : 'text-[#2C3D2B]'
                    }`}
                  >
                    {preset.description}
                  </p>
                </div>

                <p
                  className={`text-[11px] font-mono mt-4 pt-3 border-t tabular-nums ${
                    active
                      ? 'text-[#C5D1B8] border-[#789575]/45'
                      : 'text-[#3F523E] border-[#789575]/45'
                  }`}
                >
                  {preset.silenceThresholdDb} dB · {preset.minSilenceDurationMs} ms min pause
                </p>
              </button>
            );
          })}
        </div>
        </section>
      </EmergeBlock>

      <EmergeBlock order={4}>
        <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-[#192418]">Output Deliverables</h2>
          <p className="text-xs text-[#3F523E] mt-0.5">
            Choose the assets Koda should generate for this project.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {OUTPUT_KEYS.map((key) => {
            const meta = OUTPUT_OPTION_META[key];
            const checked = selectedOutputs.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => onToggleOutput(key)}
                className={`text-left p-4 rounded-lg border transition-colors flex items-start justify-between gap-3 ${
                  checked
                    ? 'bg-[#B9C493] border-[#3B5239]'
                    : 'bg-[#C7CFA3] border-[#789575]/80 hover:bg-[#BDC799]'
                }`}
              >
                <div>
                  <p className="text-sm font-semibold text-[#192418]">{meta.label}</p>
                  <p className="text-xs text-[#2C3D2B] mt-1">{meta.description}</p>
                  <p className="text-[11px] font-mono text-[#3F523E] mt-2">
                    {meta.formatHint}
                  </p>
                </div>
                <span
                  className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                    checked
                      ? 'bg-[#3B5239] border-[#3B5239] text-[#D4DAB4]'
                      : 'border-[#789575] bg-[#D4DAB4]'
                  }`}
                >
                  {checked && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                </span>
              </button>
            );
          })}
        </div>
        </section>
      </EmergeBlock>

      <EmergeBlock order={5}>
        <div className="pt-5 border-t border-[#789575]/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-xs text-[#3F523E] font-mono font-medium tabular-nums">
            {selectedOutputs.length} deliverables selected
          </p>

          <button
            type="button"
            onClick={onHandOff}
            disabled={selectedOutputs.length === 0}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-[#D4DAB4] bg-[#3B5239] hover:bg-[#2C3D2B] disabled:opacity-40 disabled:cursor-not-allowed rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            Hand Off to Koda
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </EmergeBlock>
    </div>
  );
};
