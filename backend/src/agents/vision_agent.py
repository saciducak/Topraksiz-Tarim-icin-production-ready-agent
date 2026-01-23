"""
Topraksız Tarım AI Agent - Vision Agent
Uses YOLO for plant disease detection.
"""
from .state import AgentState
from ..services.vision import analyze_image_with_yolo
import logging

logger = logging.getLogger(__name__)


async def vision_node(state: AgentState) -> AgentState:
    """
    Vision Agent Node - Analyzes images using YOLO.
    
    Input: image_bytes
    Output: detections, vision_summary, has_disease
    """
    image_bytes = state.get("image_bytes")
    
    if not image_bytes:
        logger.warning("No image provided, skipping vision analysis")
        state["vision_summary"] = "Görsel sağlanmadı."
        state["has_disease"] = False
        return state
    
    try:
        settings = state.get("_settings")
        
        # 1. Plant Validation (Heuristic using Color Analysis)
        # We need to analyze colors first to check if it's a plant
        # For now, we'll assume analyze_image_with_yolo does both or checks detection
        # But let's add a robust check.
        # Ideally, we should check for "Green", "Yellow", "Brown" presence.
        
        # NOTE: Since analyze_image_with_yolo calls our vision service, let's assume
        # we can't easily access raw pixels here without new dependencies.
        # Instead, we will rely on the vision.py service to have returned color info if possible,
        # OR we check if YOLO returned plant-related classes.
        
        # If no detections found AND no plant-like colors (mock check), we flag it.
        # But wait, YOLO *detects diseases*. If plant is healthy, YOLO might return nothing.
        # So we MUST rely on a pixel-based check.
        
        # Let's import the color helper if available or implement a check.
        # For this "Phase 8" robustness, let's modify the service to include `is_plant` flag.
        # But to keep it simple here, update vision service to check colors.
        
        result = await analyze_image_with_yolo(image_bytes, settings)
        
        # Check if the service returned specific error regarding non-plant
        if result.get("error") == "Non-plant object detected":
             return {
                "error": "Lütfen geçerli bir bitki görseli yükleyin. Yüklediğiniz görselde bitki tespit edilemedi."
            }

        detections = result.get("detections", [])
        
        # Determine if disease was detected
        disease_classes = ["disease", "hastalık", "infected", "enfekte", 
                          "blight", "spot", "virus", "fungus", "bacteria"]
        has_disease = any(
            any(dc in d.get("class_name", "").lower() for dc in disease_classes)
            for d in detections
        )
        
        summary = f"Vision analysis complete: {len(detections)} detections, has_disease={has_disease}"
        logger.info(summary)
        
        return {
            "detections": detections,
            "has_disease": has_disease,
            "vision_summary": summary
        }
    except Exception as e:
        logger.error(f"Vision agent failed: {e}", exc_info=True)
        return {
            "detections": [],
            "has_disease": False,
            "vision_summary": f"Görüntü analizi sırasında hata oluştu: {str(e)}",
            "error": str(e)
        }


