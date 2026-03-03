"""
Topraksız Tarım AI Agent - Vision Agent
Uses YOLO for plant disease detection with Turkish localization.
"""
from .state import AgentState
from ..services.vision import analyze_image_with_yolo
import logging

logger = logging.getLogger(__name__)

# Disease class name → Turkish display name mapping
DISEASE_NAME_TR = {
    # YOLO model classes
    "early_blight": "Erken Yanıklık",
    "late_blight": "Geç Yanıklık",
    "leaf_spot": "Yaprak Lekesi",
    "leaf_mold": "Yaprak Küfü",
    "septoria_leaf_spot": "Septoria Yaprak Lekesi",
    "spider_mites": "Kırmızı Örümcek",
    "target_spot": "Hedef Leke",
    "mosaic_virus": "Mozaik Virüsü",
    "yellow_leaf_curl_virus": "Sarı Yaprak Kıvrılma Virüsü",
    "bacterial_spot": "Bakteriyel Leke",
    "healthy": "Sağlıklı",
    # Color analysis classes
    "early_blight_suspected": "Erken Yanıklık (Şüpheli)",
    "chlorosis_suspected": "Kloroz / Sararma",
    "necrosis_suspected": "Nekroz / Doku Ölümü",
    # Generic YOLO classes
    "person": "İnsan",
    "cat": "Kedi",
    "dog": "Köpek",
}


def get_turkish_name(class_name: str) -> str:
    """Get Turkish display name for a disease class."""
    key = class_name.lower().strip()
    if key in DISEASE_NAME_TR:
        return DISEASE_NAME_TR[key]
    # Try partial matching
    for eng, tr in DISEASE_NAME_TR.items():
        if eng in key or key in eng:
            return tr
    # Fallback: Clean underscore and capitalize
    return class_name.replace("_", " ").title()


async def vision_node(state: AgentState) -> AgentState:
    """
    Vision Agent Node - Analyzes images using YOLO.
    
    Input: image_bytes
    Output: detections, vision_summary, has_disease
    """
    image_bytes = state.get("image_bytes")
    
    if not image_bytes:
        logger.warning("No image provided, skipping vision analysis")
        return {
            "vision_summary": "Görsel sağlanmadı.",
            "has_disease": False,
            "detections": []
        }
    
    try:
        settings = state.get("_settings")
        result = await analyze_image_with_yolo(image_bytes, settings)
        
        # Check if the service returned specific error regarding non-plant
        if result.get("error") == "Non-plant object detected":
            return {
                "error": "Lütfen geçerli bir bitki görseli yükleyin. Yüklediğiniz görselde bitki tespit edilemedi.",
                "detections": [],
                "has_disease": False,
                "vision_summary": "Bitki görseli tespit edilemedi."
            }

        detections = result.get("detections", [])
        
        # Enrich detections with Turkish display names
        for det in detections:
            det["display_name"] = get_turkish_name(det.get("class_name", ""))
        
        # Determine if disease was detected  
        disease_keywords = [
            "disease", "hastalık", "infected", "enfekte",
            "blight", "spot", "virus", "fungus", "bacteria",
            "chlorosis", "necrosis", "mildew", "rust", "suspected"
        ]
        has_disease = any(
            any(dc in d.get("class_name", "").lower() for dc in disease_keywords)
            for d in detections
        )
        
        # Build Turkish summary
        if not detections:
            summary_text = "Görüntü analizi tamamlandı. Herhangi bir hastalık belirtisi tespit edilmedi. Bitki sağlıklı görünmektedir."
        elif has_disease:
            disease_names = [d.get("display_name", d.get("class_name")) for d in detections]
            unique_names = list(dict.fromkeys(disease_names))  # preserve order, remove dups
            summary_text = (
                f"Görüntü analizi tamamlandı. {len(detections)} tespit yapıldı. "
                f"Tespit edilen durumlar: {', '.join(unique_names)}. "
                f"Hastalık belirtileri mevcut — detaylı analiz ve tedavi önerileri hazırlanıyor."
            )
        else:
            summary_text = (
                f"Görüntü analizi tamamlandı. {len(detections)} nesne tespit edildi. "
                f"Doğrudan hastalık belirtisi görülmemekle birlikte, detaylı analiz yapılıyor."
            )
        
        logger.info(f"Vision: {len(detections)} detections, disease={has_disease}")
        
        return {
            "detections": detections,
            "has_disease": has_disease,
            "vision_summary": summary_text
        }
    except Exception as e:
        logger.error(f"Vision agent failed: {e}", exc_info=True)
        return {
            "detections": [],
            "has_disease": False,
            "vision_summary": f"Görüntü analizi sırasında hata oluştu: {str(e)}",
            "error": str(e)
        }
