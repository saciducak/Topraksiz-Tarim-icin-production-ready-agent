"""
Topraksız Tarım AI Agent - Decision Agent
LLM-powered actionable recommendations with smart fallback.
"""
from .state import AgentState
from ..services.rag import generate_answer
import logging
import json

logger = logging.getLogger(__name__)

# Fallback templates when LLM is unavailable
FALLBACK_RECOMMENDATIONS = {
    "blight": {
        "action": "Yanıklık Müdahalesi",
        "priority": "high",
        "category": "kimyasal",
        "details": "Enfekte yaprakları hemen uzaklaştırın. Bakır bazlı fungisit (%1 Bordö bulamacı) veya Mancozeb uygulayın. 7-10 gün arayla tekrarlayın.",
        "timeframe": "Acil — 24-48 Saat"
    },
    "chlorosis": {
        "action": "Beslenme Düzenlemesi",
        "priority": "medium",
        "category": "kültürel",
        "details": "pH seviyesini kontrol edin (ideal: 5.5-6.8). Demir şelat veya yaprak gübresi uygulayın. Azot eksikliği varsa amonyum nitrat ekleyin.",
        "timeframe": "1-3 Gün"
    },
    "necrosis": {
        "action": "Nekroz Kontrolü",
        "priority": "high",
        "category": "kimyasal",
        "details": "Nekrotik dokuları kesin. Bakır oksiklorür uygulayın. Havalandırmayı artırın ve sulama rejimini düzenleyin.",
        "timeframe": "Acil — 24 Saat"
    },
    "healthy": {
        "action": "Koruyucu Bakım",
        "priority": "low",
        "category": "kültürel",
        "details": "Bitkiniz sağlıklı görünüyor. Düzenli sulama, haftada bir yaprak kontrolü ve aylık gübrelemeye devam edin.",
        "timeframe": "Haftalık"
    }
}


def get_fallback_recommendations(detections: list, has_disease: bool) -> list:
    """Generate recommendations from templates when LLM is unavailable."""
    recommendations = []

    if detections:
        for det in detections:
            cls = det.get('class_name', '').lower()
            display = det.get('display_name', det.get('class_name', 'Bilinmeyen'))
            confidence_pct = int(det.get('confidence', 0) * 100)

            # Find matching template
            template = None
            for key, tmpl in FALLBACK_RECOMMENDATIONS.items():
                if key in cls:
                    template = tmpl.copy()
                    break

            if template:
                template["action"] = f"{display} — {template['action']}"
                template["details"] = f"**Tespit:** {display} (Güven: %{confidence_pct})\n\n{template['details']}"
            else:
                template = {
                    "action": f"{display} Müdahalesi",
                    "priority": "high" if det.get('confidence', 0) > 0.5 else "medium",
                    "category": "genel",
                    "details": (
                        f"**Tespit:** {display} (Güven: %{confidence_pct})\n\n"
                        "Bu durumun detaylı analizi için bir ziraat mühendisine danışmanız önerilir. "
                        "Etkilenen yaprakları izole edin ve genel bir fungisit uygulayın."
                    ),
                    "timeframe": "24-48 Saat"
                }
            recommendations.append(template)
    elif not has_disease:
        recommendations.append(FALLBACK_RECOMMENDATIONS["healthy"].copy())
    else:
        recommendations.append({
            "action": "Detaylı İnceleme",
            "priority": "medium",
            "category": "genel",
            "details": "Hastalık tam teşhis edilemedi, ancak belirtiler var. Ziraat mühendisine danışmanız önerilir.",
            "timeframe": "24 Saat"
        })

    return recommendations


async def decision_node(state: AgentState):
    """
    Decision Agent Node - Generates smart, LLM-powered recommendations.
    Falls back to templates if LLM unavailable.
    """
    logger.info("Decision agent generating recommendations...")

    try:
        detections = state.get("detections", [])
        rag_response = state.get("rag_answer", "")
        has_disease = state.get("has_disease", False)
        sensor_data = state.get("sensor_data")
        settings = state.get("_settings")

        # Try LLM-powered recommendations
        try:
            recommendations = await _generate_llm_recommendations(
                detections, rag_response, has_disease, sensor_data, settings
            )
            if recommendations:
                logger.info(f"LLM generated {len(recommendations)} recommendations")
                return {
                    "recommendations": recommendations,
                    "final_report": "Analiz tamamlandı — AI destekli öneriler hazırlandı."
                }
        except Exception as llm_err:
            logger.warning(f"LLM recommendation failed, using fallback: {llm_err}")

        # Fallback to template-based recommendations
        recommendations = get_fallback_recommendations(detections, has_disease)
        logger.info(f"Fallback generated {len(recommendations)} recommendations")

        return {
            "recommendations": recommendations,
            "final_report": "Analiz tamamlandı."
        }

    except Exception as e:
        logger.error(f"Decision agent failed: {e}", exc_info=True)
        return {
            "recommendations": [{
                "action": "Sistem Hatası",
                "priority": "high",
                "category": "sistem",
                "details": "Karar mekanizması çalışırken bir hata oluştu. Lütfen tekrar deneyin.",
                "timeframe": "Hemen"
            }],
            "final_report": f"Analiz hatası: {str(e)}",
            "error": str(e)
        }


async def _generate_llm_recommendations(
    detections: list,
    rag_response: str,
    has_disease: bool,
    sensor_data: dict,
    settings
) -> list:
    """Use LLM to generate smart, context-aware recommendations."""

    # Build detection summary
    det_summary = "Tespit yok — bitki sağlıklı görünüyor."
    if detections:
        det_lines = []
        for d in detections:
            name = d.get("display_name", d.get("class_name", "?"))
            conf = int(d.get("confidence", 0) * 100)
            det_lines.append(f"- {name} (güven: %{conf})")
        det_summary = "\n".join(det_lines)

    # Build sensor context
    sensor_text = "Sensör verisi yok."
    if sensor_data:
        parts = []
        if 'ph' in sensor_data:
            parts.append(f"pH: {sensor_data['ph']}")
        if 'ec' in sensor_data:
            parts.append(f"EC: {sensor_data['ec']} mS/cm")
        if 'temperature' in sensor_data:
            parts.append(f"Sıcaklık: {sensor_data['temperature']}°C")
        if parts:
            sensor_text = " | ".join(parts)

    prompt = f"""Aşağıdaki bitki analiz sonuçlarına göre TEDAVİ ÖNERİLERİ oluştur.

TESPİTLER:
{det_summary}

SENSÖR VERİLERİ: {sensor_text}

RAG ANALİZ ÖZETİ:
{rag_response[:800] if rag_response else 'Yok'}

GÖREV: Yukarıdaki verilere dayanarak 2-4 arasında somut TEDAVİ ÖNERİSİ üret.

KESİN FORMAT — Aşağıdaki JSON formatında SADECE bir JSON array döndür, başka hiçbir şey yazma:
[
  {{
    "action": "Öneri başlığı (Türkçe, kısa)",
    "priority": "high|medium|low",
    "category": "kimyasal|organik|kültürel|genel",
    "details": "Detaylı açıklama. Dozaj, süre, uygulama yöntemi belirt. 2-3 cümle.",
    "timeframe": "Süre (ör: Acil - 24 Saat)"
  }}
]

KURALLAR:
- SADECE JSON array döndür, markdown veya açıklama ekleme
- Tüm metinler Türkçe olacak
- Her öneri somut ve uygulanabilir olacak
- priority: hastalık varsa high, risk varsa medium, sağlıklıysa low"""

    system_prompt = "Sen ziraat mühendisi uzmanısın. Verilen tarımsal analiz sonuçlarına göre TEDAVİ ÖNERİLERİ üretiyorsun. SADECE geçerli JSON array formatında yanıt ver."

    raw = await generate_answer(
        query="Tedavi önerileri",
        context=[],
        settings=settings,
        custom_user_prompt=prompt,
        custom_system_prompt=system_prompt
    )

    # Parse JSON from LLM response
    try:
        # Try to extract JSON array from response
        cleaned = raw.strip()
        # Find JSON array boundaries
        start = cleaned.find('[')
        end = cleaned.rfind(']')
        if start != -1 and end != -1:
            json_str = cleaned[start:end + 1]
            recommendations = json.loads(json_str)
            # Validate structure
            valid = []
            for rec in recommendations:
                if isinstance(rec, dict) and 'action' in rec:
                    valid.append({
                        "action": str(rec.get("action", "")),
                        "priority": str(rec.get("priority", "medium")),
                        "category": str(rec.get("category", "genel")),
                        "details": str(rec.get("details", "")),
                        "timeframe": str(rec.get("timeframe", ""))
                    })
            if valid:
                return valid
    except (json.JSONDecodeError, ValueError) as e:
        logger.warning(f"Failed to parse LLM recommendations JSON: {e}")

    return None  # Signal to use fallback
