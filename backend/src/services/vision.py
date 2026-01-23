"""
Topraksız Tarım AI Agent - Vision Service
YOLO-based plant disease detection with fallback color analysis.
"""
from ultralytics import YOLO
from PIL import Image
import io
import logging
import numpy as np
from pathlib import Path

logger = logging.getLogger(__name__)

# Global model instance (lazy loaded)
_yolo_model = None


def get_yolo_model(model_path: str) -> YOLO:
    """Get or load the YOLO model."""
    global _yolo_model
    
    if _yolo_model is None:
        if Path(model_path).exists():
            logger.info(f"Loading custom YOLO model from {model_path}")
            _yolo_model = YOLO(model_path)
        else:
            logger.warning(f"Custom model not found at {model_path}, using default YOLOv8n")
            _yolo_model = YOLO("yolov8n.pt")
    
    return _yolo_model


def analyze_colors_for_disease(image: Image.Image) -> list[dict]:
    """
    Fallback color-based disease detection when YOLO doesn't find plant-specific issues.
    Analyzes yellow/brown patches which may indicate disease.
    """
    # Convert to numpy array
    img_array = np.array(image.convert('RGB'))
    
    # Get image dimensions
    height, width = img_array.shape[:2]
    total_pixels = height * width
    
    # Define color ranges for disease indicators (in RGB)
    detections = []
    
    # Yellow/chlorotic areas (nitrogen deficiency, viral diseases)
    yellow_mask = (
        (img_array[:, :, 0] > 150) &  # R > 150
        (img_array[:, :, 1] > 150) &  # G > 150
        (img_array[:, :, 2] < 100)     # B < 100
    )
    yellow_ratio = np.sum(yellow_mask) / total_pixels
    
    # Brown spots (fungal diseases like early blight)
    brown_mask = (
        (img_array[:, :, 0] > 80) & (img_array[:, :, 0] < 180) &
        (img_array[:, :, 1] > 40) & (img_array[:, :, 1] < 120) &
        (img_array[:, :, 2] < 80)
    )
    brown_ratio = np.sum(brown_mask) / total_pixels
    
    # Dark spots (necrosis, late blight)
    dark_mask = (
        (img_array[:, :, 0] < 60) &
        (img_array[:, :, 1] < 60) &
        (img_array[:, :, 2] < 60)
    )
    dark_ratio = np.sum(dark_mask) / total_pixels
    
    # Generate detections based on color analysis
    if brown_ratio > 0.02:
        confidence = min(0.5 + brown_ratio * 5, 0.85)
        detections.append({
            "class_name": "early_blight_suspected",
            "confidence": confidence,
            "bbox": [0, 0, width, height],
            "source": "color_analysis"
        })
        logger.info(f"Color analysis: Brown spots detected ({brown_ratio:.2%})")
    
    if yellow_ratio > 0.05:
        confidence = min(0.4 + yellow_ratio * 3, 0.80)
        detections.append({
            "class_name": "chlorosis_suspected",
            "confidence": confidence,
            "bbox": [0, 0, width, height],
            "source": "color_analysis"
        })
        logger.info(f"Color analysis: Yellow areas detected ({yellow_ratio:.2%})")
    
    if dark_ratio > 0.03:
        confidence = min(0.4 + dark_ratio * 4, 0.75)
        detections.append({
            "class_name": "necrosis_suspected",
            "confidence": confidence,
            "bbox": [0, 0, width, height],
            "source": "color_analysis"
        })
        logger.info(f"Color analysis: Dark spots detected ({dark_ratio:.2%})")
    
    return detections


def is_plant(image: Image.Image) -> bool:
    """
    Check if the image is likely a plant based on color analysis.
    Plants are dominantly Green, Yellow, or Brown (soil/disease).
    If the image is mostly Blue, Red, or Synthetic colors, reject it.
    """
    img_array = np.array(image.convert('RGB'))
    height, width = img_array.shape[:2]
    total_pixels = height * width
    
    # 1. Green mask (Healthy plant)
    # R < G and B < G
    green_mask = (
        (img_array[:, :, 1] > img_array[:, :, 0]) & 
        (img_array[:, :, 1] > img_array[:, :, 2])
    )
    green_ratio = np.sum(green_mask) / total_pixels
    
    # 2. Yellow/Brown mask (Disease/Soil)
    # R > B and G > B (Roughly)
    earth_tone_mask = (
        (img_array[:, :, 0] > img_array[:, :, 2]) & 
        (img_array[:, :, 1] > img_array[:, :, 2])
    )
    earth_ratio = np.sum(earth_tone_mask) / total_pixels
    
    logger.info(f"Plant Validation: Green Ratio={green_ratio:.2f}, Earth Ratio={earth_ratio:.2f}")
    
    # Thresholds: At least 10% green OR 20% earth tones (for dry plants)
    if green_ratio > 0.10 or earth_ratio > 0.20:
        return True
        
    return False

async def analyze_image_with_yolo(
    image_bytes: bytes,
    settings = None
) -> dict:
    """
    Analyze an image using YOLO with fallback to color analysis.
    
    Args:
        image_bytes: Raw image bytes
        settings: Application settings
        
    Returns:
        dict with detections list
    """
    from ..config import get_settings
    
    if settings is None:
        settings = get_settings()
    
    try:
        # Load image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if needed
        if image.mode != "RGB":
            image = image.convert("RGB")
            
        # 1. Plant Validation Check
        if not is_plant(image):
            logger.warning("Non-plant object detected based on color analysis")
            return {"error": "Non-plant object detected", "detections": []}
        
        # Get model
        model = get_yolo_model(settings.yolo_model_path)
        
        # Run YOLO inference
        results = model.predict(
            source=image,
            conf=settings.yolo_confidence_threshold,
            verbose=False
        )
        
        # Parse YOLO results
        detections = []
        for result in results:
            boxes = result.boxes
            if boxes is not None:
                for i in range(len(boxes)):
                    bbox = boxes.xyxy[i].tolist()
                    confidence = float(boxes.conf[i])
                    class_id = int(boxes.cls[i])
                    class_name = result.names.get(class_id, f"class_{class_id}")
                    
                    detections.append({
                        "class_name": class_name,
                        "confidence": confidence,
                        "bbox": bbox,
                        "source": "yolo"
                    })
        
        # If YOLO didn't find plant-specific diseases, use color analysis
        plant_disease_classes = ["disease", "blight", "spot", "rust", "mildew", "virus", "early_blight", "late_blight"]
        has_disease_detection = any(
            any(dc in d.get("class_name", "").lower() for dc in plant_disease_classes)
            for d in detections
        )
        
        if not has_disease_detection:
            logger.info("YOLO didn't find plant diseases, running color analysis")
            color_detections = analyze_colors_for_disease(image)
            detections.extend(color_detections)
        
        # Sort by confidence
        detections.sort(key=lambda x: x["confidence"], reverse=True)
        
        logger.info(f"Vision analysis: {len(detections)} detections (YOLO + color)")
        return {"detections": detections}
        
    except Exception as e:
        logger.error(f"Vision analysis failed: {str(e)}")
        raise


async def check_yolo_model(settings) -> dict:
    """Check if YOLO model is loaded and working."""
    try:
        model_path = settings.yolo_model_path
        exists = Path(model_path).exists()
        
        return {
            "status": "custom" if exists else "default",
            "model_path": model_path,
            "exists": exists,
            "fallback": "color_analysis"
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
