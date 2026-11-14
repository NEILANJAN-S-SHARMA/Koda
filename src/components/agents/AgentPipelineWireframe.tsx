import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Loader2,
  RotateCcw,
  StepForward,
} from 'lucide-react';
import { motion } from 'motion/react';
import { AgentExecutionState, KodaProject, StudioSection } from '../../types/koda';
import { EmergeBlock } from '../shared/EmergeBlock';
import { TiltCard3D } from '../shared/TiltCard3D';

interface AgentPipelineWireframeProps {
  project: KodaProject;
  onAdvanceStep: () => void;
  onResetPipeline: () => void;
  onNavigate: (section: StudioSection) => void;
}

const STATUS_META: Record<
  AgentExecutionState['status'],
  { label: string; badgeClass: string }
> = {
  idle: {
    label: 'Idle',
    badgeClass: 'text-[#3F523E] bg-[#D4DAB4] border-[#789575]/50',
  },
  queued: {
    label: 'Queued',
    badgeClass: 'text-[#2C3D2B] bg-[#D4DAB4] border-[#789575]',
  },
  running: {
    label: 'Running',
    badgeClass: 'text-[#D4DAB4] bg-[#3B5239] border-[#2C3D2B]',
  },
  completed: {
    label: 'Completed',
    badgeClass: 'text-[#141E13] bg-[#789575] border-[#557053]',
  },
  failed: {
    label: 'Failed',
    badgeClass: 'text-[#D4DAB4] bg-[#2C3D2B] border-[#192418]',
  },
};

export const AgentPipelineWireframe: React.FC<AgentPipelineWireframeProps> = ({
  project,
  onAdvanceStep,
  onResetPipeline,
  onNavigate,
}) => {
  const allCompleted = project.agents.every((a) => a.status === 'completed');

  return (
    <div className="space-y-8">
      <EmergeBlock order={0}>
        <div className="pb-6 border-b border-[#789575]/60 flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-[#192418]">
              {project.title}
            </h1>
            <p className="text-xs text-[#3F523E] mt-1">
              Sequential four-agent execution pipeline. Advance each stage manually or reset to replay.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onResetPipeline}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#192418] bg-[#C7CFA3] hover:bg-[#BDC799] border border-[#789575] rounded-md transition-colors whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#3B5239]" />
              Reset Pipeline
            </button>

            <button
              type="button"
              onClick={onAdvanceStep}
              disabled={allCompleted}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#D4DAB4] bg-[#3B5239] hover:bg-[#2C3D2B] disabled:opacity-45 rounded-md transition-colors whitespace-nowrap"
            >
              <StepForward className="w-3.5 h-3.5" />
              {allCompleted ? 'Pipeline Complete' : 'Advance Next Agent'}
            </button>

            {allCompleted && (
              <button
                type="button"
                onClick={() => onNavigate('workbench')}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#141E13] bg-[#789575] hover:bg-[#668263] border border-[#3B5239] rounded-md transition-colors whitespace-nowrap"
              >
                Open Workbench
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </EmergeBlock>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {project.agents.map((agent, index) => {
          const status = STATUS_META[agent.status];
          return (
            <EmergeBlock key={agent.id} order={index + 1}>
              <TiltCard3D maxTiltDeg={4.5}>
              <article
                className={`h-full border rounded-lg p-6 flex flex-col justify-between transition-colors ${
                  agent.status === 'running'
                    ? 'border-[#3B5239] bg-[#B9C493]'
                    : 'border-[#789575] bg-[#C7CFA3]'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-mono font-medium text-[#3F523E]">
                        0{agent.order} · {agent.role}
                      </p>
                      <h2 className="text-base font-semibold text-[#192418] mt-1">
                        {agent.name}
                      </h2>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-mono font-semibold px-2.5 py-0.5 rounded border shrink-0 ${status.badgeClass}`}
                    >
                      {agent.status === 'completed' && (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      {agent.status === 'running' && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      )}
                      {(agent.status === 'idle' || agent.status === 'queued') && (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                      {status.label}
                    </span>
                  </div>

                  <div className="mt-5">
                    <div className="flex items-center justify-between text-xs font-mono text-[#3F523E] mb-1.5 tabular-nums">
                      <span>Progress</span>
                      <span className="font-semibold text-[#192418]">{agent.progress}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#D4DAB4] rounded-full overflow-hidden border border-[#789575]">
                      <motion.div
                        className="h-full w-full bg-[#3B5239] origin-left"
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: agent.progress / 100 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                  </div>

                  <p className="text-xs font-medium text-[#192418] mt-4 leading-relaxed">
                    {agent.currentActivity}
                  </p>

                  <div className="mt-4 border-t border-[#789575]/45 pt-3 space-y-1.5">
                    {agent.logs.map((entry, idx) => (
                      <p
                        key={idx}
                        className="text-[11px] font-mono text-[#2C3D2B] truncate"
                      >
                        {entry}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-[#789575]/45">
                  <p className="text-[11px] font-mono text-[#3F523E]">
                    {agent.integrationBoundaryTodo}
                  </p>
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
