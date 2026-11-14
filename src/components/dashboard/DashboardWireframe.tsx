import React from 'react';
import { ArrowRight, Film, Play, Plus } from 'lucide-react';
import { KodaProject, StudioSection } from '../../types/koda';
import { formatBytes, formatDuration } from '../../lib/formatters';
import { EmergeBlock } from '../shared/EmergeBlock';

interface DashboardWireframeProps {
  projects: KodaProject[];
  activeProjectId: string | null;
  backendMode: string;
  onSelectProject: (projectId: string, nextSection?: StudioSection) => void;
  onLoadDemo: () => void;
  onNavigate: (section: StudioSection) => void;
}

const AGENT_CARDS = [
  {
    step: '01',
    title: 'Whisper ASR & Dead-Air',
    description:
      'Speech segmentation, timestamp index, and silence removal intervals.',
    hook: 'OpenAI Whisper ASR',
  },
  {
    step: '02',
    title: 'Tension-Beat Detector',
    description:
      'Scene transition scoring and high-energy highlight window ranking.',
    hook: 'Gemini Vision API',
  },
  {
    step: '03',
    title: '9:16 Video Stitcher',
    description:
      'Vertical crop framing, safe-zone caption layout, and reel manifests.',
    hook: 'FFmpeg Render Graph',
  },
  {
    step: '04',
    title: 'Saliency & A/B Critic',
    description:
      'Three 16:9 variants, radial gaze heatmaps, and predicted CTR ranking.',
    hook: 'Vision Saliency Model',
  },
];

export const DashboardWireframe: React.FC<DashboardWireframeProps> = ({
  projects,
  activeProjectId,
  backendMode,
  onSelectProject,
  onLoadDemo,
  onNavigate,
}) => {
  return (
    <div className="space-y-10">
      {/* Studio Overview Strip */}
      <EmergeBlock order={0}>
        <section className="rounded-lg bg-[#C7CFA3] border border-[#789575] p-5 lg:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#192418]">
              Studio Workspace
            </h2>
            <p className="text-xs sm:text-sm text-[#2C3D2B] mt-1 leading-relaxed">
              Inspect active post-production projects, advance the four-agent pipeline,
              or jump directly into the cut workbench and A/B thumbnail arena.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onLoadDemo}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#192418] bg-[#D4DAB4] hover:bg-[#BDC799] border border-[#789575] rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5 text-[#3B5239]" />
              Load Sample Demo Data
            </button>

            <button
              type="button"
              onClick={() => onNavigate('ingestion')}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#D4DAB4] bg-[#3B5239] hover:bg-[#2C3D2B] rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              New Project
            </button>
          </div>
        </section>
      </EmergeBlock>

      {/* Recent Projects Table */}
      <section aria-labelledby="recent-projects-heading" className="space-y-4">
        <EmergeBlock order={1}>
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h2
                id="recent-projects-heading"
                className="text-base font-semibold text-[#192418]"
              >
                Recent Studio Projects
              </h2>
              <p className="text-xs text-[#3F523E] mt-0.5">
                Select a project to inspect its timeline, vertical reels, thumbnails, and SEO bundle.
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-[#3F523E] tabular-nums whitespace-nowrap shrink-0">
              {projects.length} total
            </span>
          </div>
        </EmergeBlock>

        <EmergeBlock order={2}>
          <div className="border border-[#789575] bg-[#C7CFA3] rounded-lg overflow-hidden">
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="border-b border-[#789575] bg-[#789575] text-[11px] font-semibold text-[#141E13]">
                <th className="py-3 px-3 sm:px-4 w-auto">Project</th>
                <th className="hidden md:table-cell py-3 px-3 w-20">Preset</th>
                <th className="hidden lg:table-cell py-3 px-3 w-40 xl:w-44">Source</th>
                <th className="hidden sm:table-cell py-3 px-3 text-right w-20">Duration</th>
                <th className="py-3 px-2 sm:px-3 text-right w-16 sm:w-20">State</th>
                <th className="py-3 px-3 sm:px-4 text-right w-24 sm:w-36">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#789575]/45 text-sm">
              {projects.map((project) => {
                const isCurrent = project.id === activeProjectId;
                return (
                  <tr
                    key={project.id}
                    className={`transition-colors ${
                      isCurrent ? 'bg-[#B9C493]' : 'bg-[#D4DAB4]/75 hover:bg-[#BDC799]'
                    }`}
                  >
                    <td className="py-3.5 px-4 min-w-0 align-top sm:align-middle">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <Film
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            isCurrent ? 'text-[#2C3D2B]' : 'text-[#557053]'
                          }`}
                        />
                        <div className="min-w-0">
                          <span className="font-semibold text-[#192418] leading-snug break-words block">
                            {project.title}
                          </span>
                          <span className="text-[11px] font-mono text-[#3F523E] mt-0.5 block sm:hidden tabular-nums">
                            {project.config.preset} · {formatDuration(project.media.durationSeconds)}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell py-3.5 px-3 text-xs font-medium text-[#2C3D2B] capitalize whitespace-nowrap">
                      {project.config.preset}
                    </td>
                    <td className="hidden lg:table-cell py-3.5 px-3 text-xs font-mono text-[#2C3D2B] tabular-nums whitespace-nowrap">
                      {project.media.resolution} · {formatBytes(project.media.fileSizeBytes)}
                    </td>
                    <td className="hidden sm:table-cell py-3.5 px-3 text-xs font-mono text-[#2C3D2B] text-right tabular-nums whitespace-nowrap">
                      {formatDuration(project.media.durationSeconds)}
                    </td>
                    <td className="py-3.5 px-3 text-xs font-mono text-right whitespace-nowrap">
                      <span
                        className={
                          project.status === 'ready'
                            ? 'text-[#2C3D2B] font-semibold'
                            : 'text-[#557053] font-medium'
                        }
                      >
                        {project.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectProject(project.id, 'workbench')}
                        className="inline-flex items-center justify-end gap-1.5 text-xs font-semibold text-[#2C3D2B] hover:text-[#141E13] transition-colors whitespace-nowrap"
                      >
                        <span className="hidden sm:inline">Open Workbench</span>
                        <span className="sm:hidden">Workbench</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#3B5239] shrink-0" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </EmergeBlock>
      </section>

      {/* Unified 4-Agent Architecture Strip */}
      <section aria-labelledby="architecture-scaffold-heading" className="space-y-4">
        <EmergeBlock order={3}>
          <div className="flex items-baseline justify-between gap-4">
            <div>
              <h2
                id="architecture-scaffold-heading"
                className="text-base font-semibold text-[#192418]"
              >
                Autonomous Agent Pipeline
              </h2>
              <p className="text-xs text-[#3F523E] mt-0.5">
                Four specialized stages executed sequentially from ingestion to final export.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('agents')}
              className="text-xs font-semibold text-[#2C3D2B] hover:text-[#141E13] inline-flex items-center gap-1 whitespace-nowrap shrink-0 transition-colors"
            >
              Inspect Pipeline
              <ArrowRight className="w-3.5 h-3.5 text-[#557053]" />
            </button>
          </div>
        </EmergeBlock>

        <EmergeBlock order={4}>
          <div className="border border-[#789575] bg-[#C7CFA3] rounded-lg grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#789575]/60 overflow-hidden">
            {AGENT_CARDS.map((card) => (
              <button
                key={card.step}
                type="button"
                onClick={() => onNavigate('agents')}
                className="text-left p-5 hover:bg-[#789575]/25 flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-[#3B5239] tabular-nums">
                      {card.step}
                    </span>
                    <span className="text-[11px] font-mono font-medium text-[#3F523E]">
                      {card.hook}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#192418] mt-3">
                    {card.title}
                  </h3>
                  <p className="text-xs text-[#2C3D2B] mt-1.5 leading-relaxed">
                    {card.description}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </EmergeBlock>
      </section>

      {/* Studio Activity & Environment Footer Strip */}
      <EmergeBlock order={5}>
        <section
          aria-labelledby="processing-history-heading"
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-5 border-t border-[#789575]/55"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2
                id="processing-history-heading"
                className="text-sm font-semibold text-[#192418]"
              >
                Recent Processing History
              </h2>
              <span className="text-xs font-mono text-[#3F523E]">Latest runs</span>
            </div>
            <div className="divide-y divide-[#789575]/35 text-xs">
              {projects.slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="py-2.5 flex items-center justify-between gap-4"
                >
                  <span className="text-[#192418] font-medium truncate">{item.title}</span>
                  <span className="font-mono text-[#3F523E] whitespace-nowrap shrink-0 tabular-nums">
                    {item.createdAt}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#192418]">
                Studio Environment
              </h2>
              <span className="text-xs font-mono text-[#3F523E]">{backendMode}</span>
            </div>
            <div className="divide-y divide-[#789575]/35 text-xs">
              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-[#3F523E]">Backend Contract</span>
                <span className="font-mono font-medium text-[#192418]">FastAPI REST v0.5</span>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-[#3F523E]">Media Pipeline</span>
                <span className="font-mono font-medium text-[#192418]">Local Studio Seed</span>
              </div>
              <div className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-[#3F523E]">Bundle Export</span>
                <span className="font-mono text-[#3F523E]">Phase 2 ZIP Stream</span>
              </div>
            </div>
          </div>
        </section>
      </EmergeBlock>
    </div>
  );
};
