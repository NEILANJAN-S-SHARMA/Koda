export type StudioSection =
  | 'dashboard'
  | 'ingestion'
  | 'agents'
  | 'workbench'
  | 'thumbnails'
  | 'seo';

export type ContentPreset = 'gaming' | 'podcast' | 'tech';

export type OutputTarget =
  | 'horizontal_master'
  | 'vertical_reels'
  | 'ab_thumbnails'
  | 'seo_pack';

export type AgentStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed';

export type AgentId = 'agent_01' | 'agent_02' | 'agent_03' | 'agent_04';

export interface UploadedMedia {
  id: string;
  filename: string;
  fileSizeBytes: number;
  durationSeconds: number;
  resolution: string;
  fps: number;
  codec: string;
  format: 'mp4' | 'mov' | 'webm';
}

export interface ProcessingConfig {
  preset: ContentPreset;
  outputs: OutputTarget[];
  silenceThresholdDb: number;
  minSilenceDurationMs: number;
  targetReelCount: number;
  autoSelectWinner: boolean;
}

export interface TranscriptSegment {
  id: string;
  startSec: number;
  endSec: number;
  speaker: string;
  text: string;
  energyScore: number;
}

export interface SilenceInterval {
  id: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  reason: string;
}

export interface SemanticChapter {
  id: string;
  timestampSec: number;
  timestampLabel: string;
  title: string;
  summary: string;
}

export interface TensionMoment {
  id: string;
  timestampSec: number;
  timestampLabel: string;
  score: number;
  label: string;
  reason: string;
}

export interface VerticalReel {
  id: string;
  index: number;
  title: string;
  tensionScore: number;
  tensionBadge: string;
  hookTimestamp: string;
  startSec: number;
  endSec: number;
  durationSec: number;
  aspectRatio: '9:16';
  captionsEnabled: boolean;
  sampleCaption: string;
  framingNote: string;
}

export interface AttentionHeatmapHotspot {
  xPercent: number;
  yPercent: number;
  radiusPercent: number;
  intensity: 'high' | 'medium' | 'low';
}

export interface ThumbnailVariant {
  id: string;
  variantKey: 'A' | 'B' | 'C';
  title: string;
  predictedCtr: number;
  hierarchyScore: number;
  critique: string;
  focalElements: string[];
  isAutoWinner: boolean;
  heatmapHotspots: AttentionHeatmapHotspot[];
}

export interface PlatformSeoPack {
  youtube: {
    title: string;
    description: string;
    keywords: string[];
    hashtags: string[];
  };
  instagram: {
    caption: string;
    shortDescription: string;
    hashtags: string[];
  };
  tiktok: {
    hookCaption: string;
    searchableKeywords: string[];
    hashtags: string[];
  };
}

export interface AgentExecutionState {
  id: AgentId;
  order: number;
  name: string;
  role: string;
  status: AgentStatus;
  progress: number;
  currentActivity: string;
  integrationBoundaryTodo: string;
  logs: string[];
}

export interface ExportBundleItem {
  id: string;
  label: string;
  format: string;
  estimatedSize: string;
  included: boolean;
  isSimulated: boolean;
}

export interface KodaProject {
  id: string;
  title: string;
  createdAt: string;
  status: 'draft' | 'processing' | 'ready';
  media: UploadedMedia;
  config: ProcessingConfig;
  agents: AgentExecutionState[];
  transcript: TranscriptSegment[];
  removedSilences: SilenceInterval[];
  chapters: SemanticChapter[];
  tensionMoments: TensionMoment[];
  reels: VerticalReel[];
  thumbnails: ThumbnailVariant[];
  selectedThumbnailId: string;
  seo: PlatformSeoPack;
  exportManifest: ExportBundleItem[];
}
