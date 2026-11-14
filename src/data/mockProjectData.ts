import { ContentPreset, KodaProject, OutputTarget } from '../types/koda';

export const CONTENT_PRESETS: Record<
  ContentPreset,
  {
    label: string;
    description: string;
    silenceThresholdDb: number;
    minSilenceDurationMs: number;
    recommendedOutputs: OutputTarget[];
  }
> = {
  gaming: {
    label: 'Gaming / Esports VOD',
    description:
      'Aggressive dead-air stripping between rounds, audio-spike clutch detection, and high-contrast 9:16 kill-feed framing.',
    silenceThresholdDb: -38,
    minSilenceDurationMs: 650,
    recommendedOutputs: [
      'horizontal_master',
      'vertical_reels',
      'ab_thumbnails',
      'seo_pack',
    ],
  },
  podcast: {
    label: 'Podcast',
    description:
      'Speaker-diarized pause tightening, debate-peak extraction, and multi-cam vertical crop suggestions.',
    silenceThresholdDb: -42,
    minSilenceDurationMs: 900,
    recommendedOutputs: [
      'horizontal_master',
      'vertical_reels',
      'seo_pack',
    ],
  },
  tech: {
    label: 'Tech / Educational',
    description:
      'Semantic chapter boundary segmentation, slide/code-change scene triggers, and search-indexed YouTube metadata.',
    silenceThresholdDb: -40,
    minSilenceDurationMs: 750,
    recommendedOutputs: [
      'horizontal_master',
      'ab_thumbnails',
      'seo_pack',
    ],
  },
};

export const OUTPUT_OPTION_META: Record<
  OutputTarget,
  { label: string; formatHint: string; description: string }
> = {
  horizontal_master: {
    label: 'Tightened 16:9 Master',
    formatHint: 'MP4 · 1920x1080',
    description: 'Dead-air stripped timeline with semantic chapter markers.',
  },
  vertical_reels: {
    label: '9:16 Tension Reels',
    formatHint: '3x MP4 · 1080x1920',
    description: 'Highest-tension short-form clips with dynamic caption overlay.',
  },
  ab_thumbnails: {
    label: 'A/B Heatmap Thumbnails',
    formatHint: '3x PNG · 1280x720',
    description: 'Three visual variations with simulated gaze saliency maps.',
  },
  seo_pack: {
    label: 'Semantic SEO Pack',
    formatHint: 'JSON / TXT Bundle',
    description: 'Platform-tailored titles, descriptions, hooks, and hashtags.',
  },
};

export const SAMPLE_DEMO_PROJECT: KodaProject = {
  id: 'proj_val_grandfinals_01',
  title: 'Valorant Champions — Ascent Map 3 Clutch VOD',
  createdAt: '2026-11-13 09:40',
  status: 'ready',
  media: {
    id: 'media_vod_01',
    filename: 'champions_ascent_map3_raw_vod.mp4',
    fileSizeBytes: 1_842_000_000,
    durationSeconds: 560, // 09:20 raw -> tightened in workbench
    resolution: '1920x1080',
    fps: 60,
    codec: 'H.264 / AAC',
    format: 'mp4',
  },
  config: {
    preset: 'gaming',
    outputs: [
      'horizontal_master',
      'vertical_reels',
      'ab_thumbnails',
      'seo_pack',
    ],
    silenceThresholdDb: -38,
    minSilenceDurationMs: 650,
    targetReelCount: 3,
    autoSelectWinner: true,
  },
  agents: [
    {
      id: 'agent_01',
      order: 1,
      name: 'Whisper ASR & Dead-Air Stripper',
      role: 'Speech Transcription & Silence Removal',
      status: 'completed',
      progress: 100,
      currentActivity: 'Identified 4 dead-air intervals totaling 48s across 09:20 source.',
      // TODO: Integrate OpenAI Whisper or compatible ASR provider.
      integrationBoundaryTodo:
        'TODO: Integrate OpenAI Whisper or compatible ASR provider.',
      logs: [
        'Loaded audio stream (48kHz stereo, -14.2 LUFS).',
        'Generated 128 timestamped transcript segments.',
        'Flagged 4 silence intervals below -38 dB (>650ms).',
      ],
    },
    {
      id: 'agent_02',
      order: 2,
      name: 'Multimodal Vision Tension-Beat Detector',
      role: 'Scene Transitions & High-Energy Scoring',
      status: 'completed',
      progress: 100,
      currentActivity: 'Scored 6 key scene transitions; peaked at 96/100 during 1v4 clutch.',
      // TODO: Integrate Gemini Vision for video understanding and scene analysis.
      integrationBoundaryTodo:
        'TODO: Integrate Gemini Vision for video understanding and scene analysis.',
      logs: [
        'Sampled keyframes at 2 fps for UI & kill-feed state shifts.',
        'Correlated audio peak at 06:45 with 1v4 spike defuse round.',
        'Ranked top 3 candidate windows for 9:16 vertical extraction.',
      ],
    },
    {
      id: 'agent_03',
      order: 3,
      name: 'Automated 9:16 Video Stitcher',
      role: 'Vertical Reframing & Caption Layout',
      status: 'completed',
      progress: 100,
      currentActivity: 'Prepared 3 vertical reel compositions with safe-zone caption tracks.',
      // TODO: Integrate FFmpeg for actual trimming, cropping, rendering, and encoding.
      integrationBoundaryTodo:
        'TODO: Integrate FFmpeg for actual trimming, cropping, rendering, and encoding.',
      logs: [
        'Computed center-weighted facecam + crosshair crop tracks.',
        'Aligned word-level caption timing to 9:16 lower-third safe zone.',
        'Generated metadata manifests for Reel 01, Reel 02, and Reel 03.',
      ],
    },
    {
      id: 'agent_04',
      order: 4,
      name: 'Saliency Heatmap & Thumbnail A/B Critic',
      role: 'Visual Attention Modeling & CTR Ranking',
      status: 'completed',
      progress: 100,
      currentActivity: 'Auto-selected Variant A (8.9% simulated CTR) as highest focal clarity.',
      // TODO: Integrate Gemini Vision and a suitable visual attention prediction model.
      integrationBoundaryTodo:
        'TODO: Integrate Gemini Vision and a suitable visual attention prediction model.',
      logs: [
        'Evaluated 3 16:9 thumbnail compositions for gaze entry & contrast.',
        'Simulated radial attention maps across primary face/HUD anchors.',
        'Recommended Variant A (+1.5% delta over Variant B).',
      ],
    },
  ],
  transcript: [
    {
      id: 'seg_01',
      startSec: 0,
      endSec: 42,
      speaker: 'Caster A',
      text: 'Welcome back to Map 3 on Ascent — everything comes down to this final regulation half.',
      energyScore: 68,
    },
    {
      id: 'seg_02',
      startSec: 134,
      endSec: 195,
      speaker: 'Analyst',
      text: 'Watch the mid-market utility setup here; they are baiting the early Sova recon before hitting A Main.',
      energyScore: 81,
    },
    {
      id: 'seg_03',
      startSec: 405,
      endSec: 446,
      speaker: 'Caster A',
      text: 'One versus four on the site! Three bullets left in the Vandal — he sticks the half and wins the round!',
      energyScore: 96,
    },
  ],
  removedSilences: [
    {
      id: 'sil_01',
      startSec: 48,
      endSec: 60,
      durationSec: 12,
      reason: 'Pre-round buy phase silence (-44 dB)',
    },
    {
      id: 'sil_02',
      startSec: 198,
      endSec: 213,
      durationSec: 15,
      reason: 'Tactical timeout dead air (-47 dB)',
    },
    {
      id: 'sil_03',
      startSec: 320,
      endSec: 331,
      durationSec: 11,
      reason: 'Rotation pause without comms (-41 dB)',
    },
    {
      id: 'sil_04',
      startSec: 490,
      endSec: 500,
      durationSec: 10,
      reason: 'Post-round scoreboard transition (-45 dB)',
    },
  ],
  chapters: [
    {
      id: 'chap_01',
      timestampSec: 0,
      timestampLabel: '00:00',
      title: 'Intro',
      summary: 'Map 3 stakes and team economy breakdown before pistol round.',
    },
    {
      id: 'chap_02',
      timestampSec: 134,
      timestampLabel: '02:14',
      title: 'Main Breakdown',
      summary: 'Mid-control utility protocol and A-Main conditioning play.',
    },
    {
      id: 'chap_03',
      timestampSec: 405,
      timestampLabel: '06:45',
      title: 'Climax',
      summary: '1v4 post-plant clutch with 0.3s remaining on spike defuse.',
    },
  ],
  tensionMoments: [
    {
      id: 'ten_01',
      timestampSec: 405,
      timestampLabel: '06:45',
      score: 96,
      label: 'Peak Tension · 1v4 Site Clutch',
      reason: 'Sustained crowd + caster audio peak combined with rapid 4-kill feed.',
    },
    {
      id: 'ten_02',
      timestampSec: 148,
      timestampLabel: '02:28',
      score: 91,
      label: 'High Engagement · Mid-Lane Entry',
      reason: 'Double flash timing and instant trade frag sequence.',
    },
    {
      id: 'ten_03',
      timestampSec: 26,
      timestampLabel: '00:26',
      score: 87,
      label: 'Strong Hook · Pistol Ace Threat',
      reason: 'High opening pacing ideal for 3-second retention hook.',
    },
  ],
  reels: [
    {
      id: 'reel_01',
      index: 1,
      title: '1v4 Vandal Clutch on Ascent A-Site',
      tensionScore: 96,
      tensionBadge: '96/100 Peak Tension',
      hookTimestamp: '06:45',
      startSec: 405,
      endSec: 446,
      durationSec: 41,
      aspectRatio: '9:16',
      captionsEnabled: true,
      sampleCaption: 'THREE BULLETS LEFT — HE STICKS THE HALF!',
      framingNote: 'Split 9:16: Top 30% player cam · Bottom 70% crosshair center crop',
    },
    {
      id: 'reel_02',
      index: 2,
      title: 'Why That Mid Utility Bait Broke Defense',
      tensionScore: 91,
      tensionBadge: '91/100 High Engagement',
      hookTimestamp: '02:28',
      startSec: 148,
      endSec: 184,
      durationSec: 36,
      aspectRatio: '9:16',
      captionsEnabled: true,
      sampleCaption: 'WATCH THE SOVA RECON BAIT AT MARKET...',
      framingNote: 'Full-frame 9:16 dynamic pan tracking minimap to A-Main entry',
    },
    {
      id: 'reel_03',
      index: 3,
      title: '0.3 Seconds From Elimination — Round 1 Hook',
      tensionScore: 87,
      tensionBadge: '87/100 Strong Hook',
      hookTimestamp: '00:26',
      startSec: 26,
      endSec: 55,
      durationSec: 29,
      aspectRatio: '9:16',
      captionsEnabled: false,
      sampleCaption: 'PISTOL ROUND OPENING 3K IN 4 SECONDS',
      framingNote: 'Center-locked 9:16 with top telemetry overlay',
    },
  ],
  thumbnails: [
    {
      id: 'thumb_a',
      variantKey: 'A',
      title: 'High-Contrast Subject + "0.3s CLUTCH" Focal Callout',
      predictedCtr: 8.9,
      hierarchyScore: 94,
      critique:
        'Strongest visual hierarchy: isolated foreground silhouette, clean two-word tension hook, and uncluttered left focal anchor.',
      focalElements: ['Foreground Player Reaction', '0.3s Timer Callout', 'Spike Glow Contrast'],
      isAutoWinner: true,
      heatmapHotspots: [
        { xPercent: 32, yPercent: 44, radiusPercent: 26, intensity: 'high' },
        { xPercent: 72, yPercent: 36, radiusPercent: 20, intensity: 'medium' },
        { xPercent: 68, yPercent: 74, radiusPercent: 16, intensity: 'low' },
      ],
    },
    {
      id: 'thumb_b',
      variantKey: 'B',
      title: 'Split-Frame Kill Feed + Tactical Minimap Overlay',
      predictedCtr: 7.4,
      hierarchyScore: 81,
      critique:
        'Good information density for core competitive viewers, though the split divider dilutes initial mobile feed eye-catch.',
      focalElements: ['4x Kill Feed Banner', 'Center Crosshair Frame'],
      isAutoWinner: false,
      heatmapHotspots: [
        { xPercent: 50, yPercent: 48, radiusPercent: 24, intensity: 'medium' },
        { xPercent: 80, yPercent: 22, radiusPercent: 18, intensity: 'high' },
      ],
    },
    {
      id: 'thumb_c',
      variantKey: 'C',
      title: 'Minimalist Wide Arena Shot + Scoreboard Tag',
      predictedCtr: 6.8,
      hierarchyScore: 73,
      critique:
        'Atmospheric wide composition lacks a clear close-up emotional anchor at small mobile thumbnail dimensions.',
      focalElements: ['Ascent A-Site Architecture', 'Match Score Overlay'],
      isAutoWinner: false,
      heatmapHotspots: [
        { xPercent: 52, yPercent: 56, radiusPercent: 22, intensity: 'medium' },
        { xPercent: 20, yPercent: 24, radiusPercent: 15, intensity: 'low' },
      ],
    },
  ],
  selectedThumbnailId: 'thumb_a',
  seo: {
    youtube: {
      title: 'How One 1v4 Vandal Clutch Saved Map 3 on Ascent (Full Breakdown)',
      description:
        'A tightened breakdown of the decisive Map 3 regulation comeback on Ascent, covering the mid-market utility conditioning, dead-air-free round pacing, and the 0.3s 1v4 post-plant clutch.\n\n00:00 Intro\n02:14 Main Breakdown\n06:45 Climax',
      keywords: [
        'valorant champions breakdown',
        'ascent 1v4 clutch',
        'vandal post plant guide',
        'esports vod review',
        'competitive fps strategy',
      ],
      hashtags: ['#Valorant', '#EsportsVOD', '#AscentClutch'],
    },
    instagram: {
      caption:
        'Three bullets left in the magazine and 0.3s on the clock. Watch how the mid-market utility bait set up this Ascent Map 3 comeback.',
      shortDescription: 'Map 3 Ascent 1v4 post-plant highlight + tactical callout.',
      hashtags: ['#valorantclips', '#fpsclutch', '#gaminghighlights', '#esports'],
    },
    tiktok: {
      hookCaption: 'POV: You have 3 bullets left in a 1v4 for tournament point.',
      searchableKeywords: [
        'valorant 1v4 clutch',
        'ascent post plant',
        'vandal highlight',
      ],
      hashtags: ['#valorant', '#clutch', '#gaming', '#fyp'],
    },
  },
  exportManifest: [
    {
      id: 'exp_master',
      label: 'Tightened 16:9 Horizontal Master',
      format: 'MP4 (Metadata Stub)',
      estimatedSize: '640 MB (Simulated)',
      included: true,
      isSimulated: true,
    },
    {
      id: 'exp_reels',
      label: '3x Vertical 9:16 Tension Reels',
      format: 'MP4 + SRT Captions (Stub)',
      estimatedSize: '142 MB (Simulated)',
      included: true,
      isSimulated: true,
    },
    {
      id: 'exp_thumbs',
      label: 'Thumbnail Variants A, B, C + Heatmap Report',
      format: 'JSON / SVG Spec',
      estimatedSize: '4.2 MB',
      included: true,
      isSimulated: true,
    },
    {
      id: 'exp_seo',
      label: 'Multi-Platform SEO & Chapter Manifest',
      format: 'JSON + TXT',
      estimatedSize: '24 KB',
      included: true,
      isSimulated: false,
    },
  ],
};

export const RECENT_PROJECTS_SEED: KodaProject[] = [
  SAMPLE_DEMO_PROJECT,
  {
    ...SAMPLE_DEMO_PROJECT,
    id: 'proj_founder_pod_02',
    title: 'Founders Unfiltered Ep. 42 — Scaling AI Infra',
    createdAt: '2026-11-12 16:15',
    status: 'ready',
    media: {
      id: 'media_pod_02',
      filename: 'founders_ep42_multicam_master.mov',
      fileSizeBytes: 3_120_000_000,
      durationSeconds: 2680,
      resolution: '3840x2160',
      fps: 30,
      codec: 'ProRes 422',
      format: 'mov',
    },
    config: {
      preset: 'podcast',
      outputs: ['horizontal_master', 'vertical_reels', 'seo_pack'],
      silenceThresholdDb: -42,
      minSilenceDurationMs: 900,
      targetReelCount: 3,
      autoSelectWinner: true,
    },
  },
  {
    ...SAMPLE_DEMO_PROJECT,
    id: 'proj_react_compiler_03',
    title: 'Deep Dive: Zero-Overhead State Machines in TypeScript',
    createdAt: '2026-11-10 11:05',
    status: 'draft',
    media: {
      id: 'media_tech_03',
      filename: 'ts_state_machines_lecture.mp4',
      fileSizeBytes: 980_000_000,
      durationSeconds: 1140,
      resolution: '1920x1080',
      fps: 60,
      codec: 'H.264',
      format: 'mp4',
    },
    config: {
      preset: 'tech',
      outputs: ['horizontal_master', 'ab_thumbnails', 'seo_pack'],
      silenceThresholdDb: -40,
      minSilenceDurationMs: 750,
      targetReelCount: 2,
      autoSelectWinner: true,
    },
  },
  {
    ...SAMPLE_DEMO_PROJECT,
    id: 'proj_apex_scrims_04',
    title: 'ALGS Scrims Block B — Endgame Zone Rotations',
    createdAt: '2026-11-09 20:10',
    status: 'ready',
    media: {
      id: 'media_gaming_04',
      filename: 'algs_scrims_block_b_vod.mp4',
      fileSizeBytes: 2_310_000_000,
      durationSeconds: 1840,
      resolution: '1920x1080',
      fps: 60,
      codec: 'H.264 / AAC',
      format: 'mp4',
    },
    config: {
      preset: 'gaming',
      outputs: ['horizontal_master', 'vertical_reels', 'ab_thumbnails', 'seo_pack'],
      silenceThresholdDb: -38,
      minSilenceDurationMs: 650,
      targetReelCount: 3,
      autoSelectWinner: true,
    },
  },
  {
    ...SAMPLE_DEMO_PROJECT,
    id: 'proj_design_crit_05',
    title: 'Post-Production Color Pipelines for Creators',
    createdAt: '2026-11-08 14:30',
    status: 'ready',
    media: {
      id: 'media_tech_05',
      filename: 'color_pipeline_session.mov',
      fileSizeBytes: 1_540_000_000,
      durationSeconds: 1420,
      resolution: '3840x2160',
      fps: 30,
      codec: 'ProRes 422',
      format: 'mov',
    },
    config: {
      preset: 'tech',
      outputs: ['horizontal_master', 'ab_thumbnails', 'seo_pack'],
      silenceThresholdDb: -40,
      minSilenceDurationMs: 750,
      targetReelCount: 2,
      autoSelectWinner: true,
    },
  },
];

