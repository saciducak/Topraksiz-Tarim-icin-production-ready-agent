"""
Topraksız Tarım AI Agent - Vision Service
YOLO-based plant disease detection with robust fallback color analysis.
"""
from ultralytics import YOLO
from PIL import Image
import io
import logging
import numpy as np
import torch
from pathlib import Path

logger = logging.getLogger(__name__)

# Global model instance (lazy loaded)
_yolo_model = None
_yolo_load_error = None


def get_yolo_model(model_path: str) -> YOLO:
    """Get or load the YOLO model with PyTorch 2.6+ compatibility."""
    global _yolo_model, _yolo_load_error

    if _yolo_model is not None:
        return _yolo_model

    if _yolo_load_error is not None:
        # Already failed once, don't retry to avoid blocking
        raise RuntimeError(f"YOLO model previously failed: {_yolo_load_error}")

    try:
        model_file = Path(model_path)
        if not model_file.exists():
            logger.warning(f"Custom model not found at {model_path}, trying default yolov8n")
            _yolo_model = YOLO("yolov8n.pt")
            return _yolo_model

        logger.info(f"Loading custom YOLO model from {model_path}")

        # Fix for PyTorch 2.6+: Add ultralytics safe globals
        try:
            import ultralytics.nn.tasks as tasks
            safe_classes = []
            for attr_name in ['DetectionModel', 'SegmentationModel', 'ClassificationModel', 'PoseModel']:
                cls = getattr(tasks, attr_name, None)
                if cls is not None:
                    safe_classes.append(cls)
            if safe_classes:
                torch.serialization.add_safe_globals(safe_classes)
                logger.info(f"Registered {len(safe_classes)} safe globals for PyTorch 2.6+")
        except Exception as e:
            logger.warning(f"Could not register safe globals (older PyTorch?): {e}")

        _yolo_model = YOLO(model_path)
        logger.info("YOLO model loaded successfully")
        return _yolo_model

    except Exception as e:
        _yolo_load_error = str(e)
        logger.error(f"YOLO model loading failed: {e}")
        raise


def analyze_colors_for_disease(image: Image.Image) -> list[dict]:
    """
    Color-based disease detection.
    Analyzes brown, yellow, dark patches which indicate disease.
    Uses HSV color space for more accurate detection.
    """
    img_rgb = np.array(image.convert('RGB'))
    img_hsv = np.array(image.convert('HSV'))

    height, width = img_rgb.shape[:2]
    total_pixels = height * width

    detections = []

    # ── HSV-based analysis (more accurate than RGB) ──
    h, s, v = img_hsv[:, :, 0], img_hsv[:, :, 1], img_hsv[:, :, 2]

    # 1. Brown spots (fungal diseases — early blight, late blight)
    # Hue 10-30, Saturation > 40, Value 40-180
    brown_mask = (
        (h >= 10) & (h <= 30) &
        (s > 40) &
        (v > 40) & (v < 180)
    )
    brown_ratio = np.sum(brown_mask) / total_pixels

    # 2. Yellow/Chlorotic areas (nitrogen deficiency, viruses)
    # Hue 25-45, Saturation > 50, Value > 120
    yellow_mask = (
        (h >= 25) & (h <= 50) &
        (s > 50) &
        (v > 120)
    )
    yellow_ratio = np.sum(yellow_mask) / total_pixels

    # 3. Dark necrotic spots (tissue death)
    # Very low value across all channels
    dark_mask = (
        (img_rgb[:, :, 0] < 70) &
        (img_rgb[:, :, 1] < 70) &
        (img_rgb[:, :, 2] < 70)
    )
    dark_ratio = np.sum(dark_mask) / total_pixels

    # 4. Reddish-brown spots (rust, bacterial spots)
    red_brown_mask = (
        (h >= 0) & (h <= 15) &
        (s > 60) &
        (v > 50) & (v < 200)
    )
    red_brown_ratio = np.sum(red_brown_mask) / total_pixels

    # 5. White/powdery areas (powdery mildew)
    white_mask = (
        (s < 30) &
        (v > 200)
    )
    white_ratio = np.sum(white_mask) / total_pixels

    # ── Generate detections with LOWER thresholds ──
    logger.info(
        f"Color ratios: brown={brown_ratio:.4f}, yellow={yellow_ratio:.4f}, "
        f"dark={dark_ratio:.4f}, red_brown={red_brown_ratio:.4f}, white={white_ratio:.4f}"
    )

    if brown_ratio > 0.01:  # 1% threshold
        confidence = min(0.45 + brown_ratio * 8, 0.92)
        detections.append({
            "class_name": "early_blight_suspected",
            "display_name": "Erken Yanıklık (Şüpheli)",
            "confidence": round(confidence, 3),
            "bbox": [0, 0, width, height],
            "source": "color_analysis"
        })
        logger.info(f"🔴 Brown spots: {brown_ratio:.2%} → confidence {confidence:.2f}")

    if yellow_ratio > 0.03:  # 3% threshold
        confidence = min(0.40 + yellow_ratio * 5, 0.85)
        detections.append({
            "class_name": "chlorosis_suspected",
            "display_name": "Kloroz / Sararma",
            "confidence": round(confidence, 3),
            "bbox": [0, 0, width, height],
            "source": "color_analysis"
        })
        logger.info(f"🟡 Yellow areas: {yellow_ratio:.2%} → confidence {confidence:.2f}")

    if dark_ratio > 0.02:  # 2% threshold
        confidence = min(0.40 + dark_ratio * 6, 0.80)
        detections.append({
            "class_name": "necrosis_suspected",
            "display_name": "Nekroz / Doku Ölümü",
            "confidence": round(confidence, 3),
            "bbox": [0, 0, width, height],
            "source": "color_analysis"
        })
        logger.info(f"⚫ Dark spots: {dark_ratio:.2%} → confidence {confidence:.2f}")

    if red_brown_ratio > 0.01:
        confidence = min(0.45 + red_brown_ratio * 7, 0.88)
        detections.append({
            "class_name": "bacterial_spot_suspected",
            "display_name": "Bakteriyel Leke (Şüpheli)",
            "confidence": round(confidence, 3),
            "bbox": [0, 0, width, height],
            "source": "color_analysis"
        })
        logger.info(f"🟤 Red-brown spots: {red_brown_ratio:.2%} → confidence {confidence:.2f}")

    if white_ratio > 0.05:
        confidence = min(0.35 + white_ratio * 4, 0.78)
        detections.append({
            "class_name": "powdery_mildew_suspected",
            "display_name": "Külleme (Şüpheli)",
            "confidence": round(confidence, 3),
            "bbox": [0, 0, width, height],
            "source": "color_analysis"
        })
        logger.info(f"⚪ White patches: {white_ratio:.2%} → confidence {confidence:.2f}")

    return detections


def is_plant(image: Image.Image) -> bool:
    """
    Check if the image is likely a plant based on color analysis.
    Uses a permissive check to avoid false negatives.
    """
    img_array = np.array(image.convert('RGB'))
    height, width = img_array.shape[:2]
    total_pixels = height * width

    # Green dominant pixels (healthy plant)
    green_mask = (
        (img_array[:, :, 1] > img_array[:, :, 0]) &
        (img_array[:, :, 1] > img_array[:, :, 2])
    )
    green_ratio = np.sum(green_mask) / total_pixels

    # Earth/warm tone pixels (diseased/dry plant)
    earth_mask = (
        (img_array[:, :, 0] > img_array[:, :, 2]) &
        (img_array[:, :, 1] > img_array[:, :, 2])
    )
    earth_ratio = np.sum(earth_mask) / total_pixels

    logger.info(f"Plant validation: green={green_ratio:.2%}, earth={earth_ratio:.2%}")

    # Very permissive: almost any natural image passes
    return green_ratio > 0.05 or earth_ratio > 0.15


async def analyze_image_with_yolo(
    image_bytes: bytes,
    settings=None
) -> dict:
    """
    Analyze an image using YOLO with robust fallback to color analysis.
    CRITICAL: Color analysis ALWAYS runs as supplement/fallback.
    """
    from ..config import get_settings

    if settings is None:
        settings = get_settings()

    # Load image first (common for both paths)
    image = Image.open(io.BytesIO(image_bytes))
    if image.mode != "RGB":
        image = image.convert("RGB")

    # 1. Plant Validation
    if not is_plant(image):
        logger.warning("Non-plant object detected")
        return {"error": "Non-plant object detected", "detections": []}

    detections = []
    yolo_succeeded = False

    # 2. Try YOLO (may fail due to model issues)
    try:
        model = get_yolo_model(settings.yolo_model_path)

        results = model.predict(
            source=image,
            conf=settings.yolo_confidence_threshold,
            verbose=False
        )

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

        yolo_succeeded = True
        logger.info(f"YOLO found {len(detections)} detections")

    except Exception as e:
        logger.error(f"YOLO inference failed (using color analysis): {e}")
        # DO NOT raise — fall through to color analysis

    # 3. Color analysis — ALWAYS runs if YOLO finds nothing or fails
    plant_disease_classes = [
        "disease", "blight", "spot", "rust", "mildew",
        "virus", "early_blight", "late_blight"
    ]
    has_yolo_disease = any(
        any(dc in d.get("class_name", "").lower() for dc in plant_disease_classes)
        for d in detections
    )

    if not has_yolo_disease:
        logger.info("Running color analysis (YOLO found no diseases or failed)")
        color_detections = analyze_colors_for_disease(image)
        detections.extend(color_detections)
        logger.info(f"Color analysis found {len(color_detections)} detections")

    # Sort by confidence
    detections.sort(key=lambda x: x["confidence"], reverse=True)

    source = "yolo+color" if yolo_succeeded else "color_analysis_only"
    logger.info(f"Vision total: {len(detections)} detections [{source}]")

    return {"detections": detections, "analysis_source": source}


async def check_yolo_model(settings) -> dict:
    """Check if YOLO model is loaded and working."""
    try:
        model_path = settings.yolo_model_path
        exists = Path(model_path).exists()

        return {
            "status": "custom" if exists else "default",
            "model_path": model_path,
            "exists": exists,
            "fallback": "color_analysis",
            "yolo_error": _yolo_load_error
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }
