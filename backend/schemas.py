from typing import List, Literal, Optional
from pydantic import BaseModel, Field


ContentPreset = Literal["gaming", "podcast", "tech"]
OutputTarget = Literal[
    "horizontal_master", "vertical_reels", "ab_thumbnails", "seo_pack"
]
AgentStatus = Literal["idle", "queued", "running", "completed", "failed"]


class UploadedMedia(BaseModel):
    id: str
    filename: str
    file_size_bytes: int
    duration_seconds: int
    resolution: str
    fps: int
    codec: str
    format: Literal["mp4", "mov", "webm"]


class ProcessingConfig(BaseModel):
    preset: ContentPreset
    outputs: List[OutputTarget]
    silence_threshold_db: int = -38
    min_silence_duration_ms: int = 650
    target_reel_count: int = 3
    auto_select_winner: bool = True


class AgentExecutionState(BaseModel):
    id: str
    order: int
    name: str
    role: str
    status: AgentStatus
    progress: int = Field(ge=0, le=100)
    current_activity: str
    integration_boundary_todo: str
    logs: List[str] = []


class SemanticChapter(BaseModel):
    id: str
    timestamp_sec: int
    timestamp_label: str
    title: str
    summary: str


class VerticalReel(BaseModel):
    id: str
    index: int
    title: str
    tension_score: int
    hook_timestamp: str
    duration_sec: int
    aspect_ratio: Literal["9:16"] = "9:16"
    captions_enabled: bool = True


class ThumbnailVariant(BaseModel):
    id: str
    variant_key: Literal["A", "B", "C"]
    title: str
    predicted_ctr: float
    hierarchy_score: int
    critique: str
    is_auto_winner: bool = False


class CreateProjectRequest(BaseModel):
    title: str
    preset: ContentPreset = "gaming"
    outputs: List[OutputTarget] = [
        "horizontal_master",
        "vertical_reels",
        "ab_thumbnails",
        "seo_pack",
    ]
    filename: Optional[str] = "demo_upload.mp4"


class KodaProjectSummary(BaseModel):
    id: str
    title: str
    status: Literal["draft", "processing", "ready"]
    preset: ContentPreset
    media: UploadedMedia
    config: ProcessingConfig
    agents: List[AgentExecutionState]
