"""
Topraksız Tarım AI Agent - Pydantic Schemas
"""
from pydantic import BaseModel, Field
from typing import Optional, Any
from enum import Enum
from datetime import datetime


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    version: str
    services: dict[str, str]


class AnalysisStatus(str, Enum):
    """Analysis status enum."""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Detection(BaseModel):
    """YOLO detection result."""
    class_name: str = Field(..., description="Detected class name")
    confidence: float = Field(..., ge=0, le=1, description="Detection confidence")
    bbox: list[float] = Field(..., description="Bounding box [x1, y1, x2, y2]")


class VisionAnalysis(BaseModel):
    """Vision analysis result."""
    detections: list[Detection] = Field(default_factory=list)
    summary: str = Field(..., description="Summary of detected issues")
    has_disease: bool = Field(..., description="Whether disease was detected")


class RAGResult(BaseModel):
    """RAG search result."""
    query: str
    answer: str
    sources: list[dict[str, Any]] = Field(default_factory=list)
    confidence: float = Field(..., ge=0, le=1)


class ActionRecommendation(BaseModel):
    """Recommended action."""
    action: str = Field(..., description="Recommended action")
    priority: str = Field(..., description="Priority level: high, medium, low")
    details: str = Field(..., description="Detailed explanation")
    timeframe: Optional[str] = Field(None, description="Recommended timeframe")


class SensorData(BaseModel):
    """IoT sensor data."""
    ph: Optional[float] = Field(None, description="Water pH level")
    ec: Optional[float] = Field(None, description="Electrical Conductivity (mS/cm)")
    temperature: Optional[float] = Field(None, description="Water Temperature (°C)")


class AnalysisRequest(BaseModel):
    """Analysis request body."""
    query: Optional[str] = Field(None, description="Optional text query")
    include_rag: bool = Field(True, description="Include RAG search")
    sensor_data: Optional[SensorData] = Field(None, description="IoT sensor data")


class AnalysisResponse(BaseModel):
    """Complete analysis response."""
    id: str = Field(..., description="Analysis ID")
    status: AnalysisStatus
    created_at: datetime
    
    # Vision Analysis
    vision: Optional[VisionAnalysis] = None
    
    # RAG Results
    rag: Optional[RAGResult] = None
    
    # Recommendations
    recommendations: list[ActionRecommendation] = Field(default_factory=list)
    
    # Overall summary
    summary: str = Field(..., description="Overall analysis summary")


class ChatMessage(BaseModel):
    """Chat message."""
    role: str = Field(..., description="Message role: user, assistant")
    content: str = Field(..., description="Message content")


class ChatRequest(BaseModel):
    """Chat request."""
    message: str = Field(..., description="User message")
    history: list[ChatMessage] = Field(default_factory=list, description="Chat history")
    image_id: Optional[str] = Field(None, description="Associated image analysis ID")


class ChatResponse(BaseModel):
    """Chat response."""
    message: str = Field(..., description="Assistant response")
    sources: list[dict[str, Any]] = Field(default_factory=list)
