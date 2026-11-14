import os
from typing import Dict
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from schemas import (
    AgentExecutionState,
    CreateProjectRequest,
    KodaProjectSummary,
    ProcessingConfig,
    UploadedMedia,
)

app = FastAPI(
    title="Koda Autonomous Creator Agents API",
    version="0.5.0-scaffold",
    description="Phase 1 backend boilerplate for Koda multi-agent video post-production.",
)

cors_origins = os.getenv("KODA_CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins if origin.strip()],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory scaffolding store (TODO: Replace with PostgreSQL / persistent storage in Phase 2)
PROJECTS_STORE: Dict[str, KodaProjectSummary] = {}


def _build_default_agents() -> list[AgentExecutionState]:
    return [
        AgentExecutionState(
            id="agent_01",
            order=1,
            name="Whisper ASR & Dead-Air Stripper",
            role="Speech Transcription & Silence Removal",
            status="queued",
            progress=0,
            current_activity="Awaiting audio track extraction.",
            integration_boundary_todo="TODO: Integrate OpenAI Whisper or compatible ASR provider.",
        ),
        AgentExecutionState(
            id="agent_02",
            order=2,
            name="Multimodal Vision Tension-Beat Detector",
            role="Scene Transitions & High-Energy Scoring",
            status="queued",
            progress=0,
            current_activity="Awaiting keyframe sampling.",
            integration_boundary_todo="TODO: Integrate Gemini Vision for video understanding and scene analysis.",
        ),
        AgentExecutionState(
            id="agent_03",
            order=3,
            name="Automated 9:16 Video Stitcher",
            role="Vertical Reframing & Caption Layout",
            status="queued",
            progress=0,
            current_activity="Awaiting clip boundary coordinates.",
            integration_boundary_todo="TODO: Integrate FFmpeg for actual trimming, cropping, rendering, and encoding.",
        ),
        AgentExecutionState(
            id="agent_04",
            order=4,
            name="Saliency Heatmap & Thumbnail A/B Critic",
            role="Visual Attention Modeling & CTR Ranking",
            status="queued",
            progress=0,
            current_activity="Awaiting candidate frame evaluation.",
            integration_boundary_todo="TODO: Integrate Gemini Vision and a suitable visual attention prediction model.",
        ),
    ]


@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "mode": "phase1_boilerplate",
        "message": "Koda FastAPI scaffolding active.",
    }


@app.get("/api/projects")
def list_projects():
    return {"projects": list(PROJECTS_STORE.values())}


@app.post("/api/projects", status_code=201)
def create_project(payload: CreateProjectRequest):
    project_id = f"proj_{len(PROJECTS_STORE) + 1:03d}"
    project = KodaProjectSummary(
        id=project_id,
        title=payload.title,
        status="draft",
        preset=payload.preset,
        media=UploadedMedia(
            id=f"media_{project_id}",
            filename=payload.filename or "demo_upload.mp4",
            file_size_bytes=1_024_000_000,
            duration_seconds=560,
            resolution="1920x1080",
            fps=60,
            codec="H.264 / AAC",
            format="mp4",
        ),
        config=ProcessingConfig(preset=payload.preset, outputs=payload.outputs),
        agents=_build_default_agents(),
    )
    PROJECTS_STORE[project_id] = project
    return project


@app.get("/api/projects/{project_id}")
def get_project(project_id: str):
    if project_id not in PROJECTS_STORE:
        raise HTTPException(status_code=404, detail="Project not found")
    return PROJECTS_STORE[project_id]


@app.delete("/api/projects/{project_id}")
def delete_project(project_id: str):
    if project_id not in PROJECTS_STORE:
        raise HTTPException(status_code=404, detail="Project not found")
    del PROJECTS_STORE[project_id]
    return {"deleted": True, "project_id": project_id}


@app.post("/api/upload")
async def upload_video(file: UploadFile = File(...)):
    allowed_extensions = (".mp4", ".mov", ".webm")
    if not file.filename or not file.filename.lower().endswith(allowed_extensions):
        raise HTTPException(
            status_code=400,
            detail="Unsupported video format. Accepted: .mp4, .mov, .webm",
        )
    # TODO: Stream file to local storage directory in Phase 2
    return {
        "filename": file.filename,
        "content_type": file.content_type,
        "status": "validated_scaffold",
    }


@app.post("/api/projects/{project_id}/process")
def start_processing(project_id: str):
    # TODO: Trigger async simulated pipeline runner in Phase 2
    return {"project_id": project_id, "status": "queued_scaffold"}


@app.get("/api/projects/{project_id}/status")
def get_processing_status(project_id: str):
    if project_id not in PROJECTS_STORE:
        raise HTTPException(status_code=404, detail="Project not found")
    project = PROJECTS_STORE[project_id]
    return {"project_id": project_id, "status": project.status, "agents": project.agents}


@app.post("/api/projects/{project_id}/advance")
def advance_pipeline(project_id: str):
    # TODO: Advance simulated agent step state in Phase 2
    return {"project_id": project_id, "advanced": True, "mode": "scaffold"}


@app.get("/api/projects/{project_id}/outputs")
def get_outputs(project_id: str):
    # TODO: Return full chapters, reels, and thumbnail variants in Phase 2
    return {"project_id": project_id, "outputs": "phase2_todo"}


@app.get("/api/projects/{project_id}/metadata")
def get_metadata(project_id: str):
    # TODO: Return platform SEO metadata in Phase 2
    return {"project_id": project_id, "metadata": "phase2_todo"}


@app.get("/api/projects/{project_id}/export")
def export_bundle(project_id: str):
    # TODO: Generate downloadable StreamingResponse ZIP archive in Phase 2
    return {"project_id": project_id, "export": "zip_generation_phase2_todo"}
