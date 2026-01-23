"""
Topraksız Tarım AI Agent - API Routes
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import JSONResponse
import uuid
import json
from datetime import datetime
import logging
import io
from PIL import Image

from .schemas import (
    AnalysisRequest, AnalysisResponse, AnalysisStatus,
    ChatRequest, ChatResponse, VisionAnalysis, RAGResult,
    ActionRecommendation, Detection, SensorData
)
from ..config import get_settings, Settings
from ..agents.graph import run_analysis_pipeline

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/analyze", response_model=AnalysisResponse, tags=["Analysis"])
async def analyze_image(
    file: UploadFile = File(...),
    query: str = Form(None),
    sensor_data: str = Form(None),
    settings: Settings = Depends(get_settings)
):
    """
    Analyze an uploaded plant image.
    
    This endpoint triggers the full multi-agent analysis pipeline:
    1. Vision Agent: YOLO-based disease detection
    2. RAG Agent: Knowledge retrieval
    3. Decision Agent: Action recommendations
    """
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Check file size
    contents = await file.read()
    if len(contents) > settings.max_upload_size:
        raise HTTPException(status_code=400, detail="File too large")
    
    # Generate analysis ID
    analysis_id = str(uuid.uuid4())
    
    # Parse sensor data
    sensor_values = None
    if sensor_data:
        try:
            sensor_values = json.loads(sensor_data)
            logger.info(f"Received sensor data: {sensor_values}")
        except Exception as e:
            logger.warning(f"Failed to parse sensor data: {e}")
    
    try:
        # Run the multi-agent pipeline
        result = await run_analysis_pipeline(
            image_bytes=contents,
            query=query,
            sensor_data=sensor_values,
            settings=settings
        )
        
        return AnalysisResponse(
            id=analysis_id,
            status=AnalysisStatus.COMPLETED,
            created_at=datetime.utcnow(),
            vision=result.get("vision"),
            rag=result.get("rag"),
            recommendations=result.get("recommendations", []),
            summary=result.get("summary", "Analiz tamamlandı.")
        )
        
    except Exception as e:
        logger.error(f"Analysis failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(
    request: ChatRequest,
    settings: Settings = Depends(get_settings)
):
    """
    Chat with the agricultural AI assistant.
    
    Supports context-aware conversations about plant health,
    diseases, and farming recommendations.
    """
    try:
        # Import here to avoid circular imports
        from ..agents.rag_agent import get_rag_response
        
        response = await get_rag_response(
            query=request.message,
            history=request.history,
            settings=settings
        )
        
        return ChatResponse(
            message=response["answer"],
            sources=response.get("sources", [])
        )
        
    except Exception as e:
        logger.error(f"Chat failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")


@router.get("/models/status", tags=["Models"])
async def get_model_status(settings: Settings = Depends(get_settings)):
    """Get the status of loaded AI models."""
    from ..services.vision import check_yolo_model
    from ..services.embeddings import check_ollama_connection
    
    return {
        "yolo": await check_yolo_model(settings),
        "ollama": await check_ollama_connection(settings),
    }


@router.post("/knowledge/search", tags=["Knowledge"])
async def search_knowledge(
    query: str,
    top_k: int = 5,
    settings: Settings = Depends(get_settings)
):
    """Search the agricultural knowledge base."""
    from ..services.rag import search_knowledge_base
    
    results = await search_knowledge_base(query, top_k, settings)
    return {"query": query, "results": results}
