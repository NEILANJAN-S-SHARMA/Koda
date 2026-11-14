# Koda — Autonomous Creator Agents (Phase 1 Scaffolding)

**Koda** is an autonomous AI co-editor that transforms long-form video content into tightened 16:9 masters, vertical 9:16 tension reels, A/B attention-mapped thumbnails, and platform-ready SEO asset bundles.

## Phase 1 Scope (UI Wireframes, Boilerplates & Design Scaffolding)

This repository currently implements the foundational ~50% scaffolding:

- **Design System & Studio Shell**: Koda dark-mode post-production aesthetic (`#0B0D12` canvas, `#141821` elevated surfaces, `#7C3AED` Electric Violet, `#06B6D4` Cyan, `#10B981` Emerald), `Plus Jakarta Sans` + `DM Sans` + `JetBrains Mono` typography.
- **Data Architecture & Mock Seed**: Complete TypeScript interfaces (`src/types/koda.ts`), interconnected demo project data (`src/data/mockProjectData.ts`), and environment-driven API client boilerplate (`src/services/api.ts`).
- **Six Workspace Wireframes**:
  1. Studio Dashboard (`DashboardWireframe`)
  2. New Project & Media Ingestion (`IngestionWireframe`)
  3. 4-Agent Orchestration Pipeline (`AgentPipelineWireframe`)
  4. Multi-Cut Workbench (`WorkbenchWireframe`)
  5. Thumbnail A/B & Saliency Heatmap Arena (`ThumbnailArenaWireframe`)
  6. Semantic SEO & Export Studio (`SeoExportWireframe`)
- **FastAPI Backend Boilerplate**: Pydantic v2 schemas (`backend/schemas.py`) and REST route stubs (`backend/main.py`).

## Running Locally

### Frontend (Vite + React + TypeScript)
```bash
npm install
npm run dev
```

### Backend Boilerplate (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Phase 2 Roadmap (Upcoming)
- Automated pipeline runner, retry states, and live processing logs.
- Interactive video playback sync, chapter timeline scrubbing, and reel preview animations.
- Real downloadable `.ZIP` asset bundle generation via FastAPI / JSZip.
- Full frontend-to-FastAPI state persistence and `TODO` AI integration boundaries (Whisper ASR, Gemini Vision, FFmpeg).
