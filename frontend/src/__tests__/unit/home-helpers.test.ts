/**
 * Unit Tests — Home page helper functions
 * 
 * Tests pure business logic functions extracted from the Home component:
 * - getDisplayName() — disease name localization
 * - getSeverity() — confidence → severity mapping
 * - healthScore computation
 * 
 * These are "domain logic" tests — they validate agronomic business rules.
 */

import { describe, it, expect } from 'vitest';

// ── Re-create the pure functions from Home.tsx ──
// (In a real refactor, these would be in a separate module)
const DISEASE_TR: Record<string, string> = {
    early_blight_suspected: 'Erken Yanıklık (Şüpheli)',
    early_blight: 'Erken Yanıklık',
    late_blight: 'Geç Yanıklık',
    chlorosis_suspected: 'Kloroz / Sararma',
    necrosis_suspected: 'Nekroz / Doku Ölümü',
    leaf_spot: 'Yaprak Lekesi',
    leaf_mold: 'Yaprak Küfü',
    septoria_leaf_spot: 'Septoria Yaprak Lekesi',
    spider_mites: 'Kırmızı Örümcek',
    target_spot: 'Hedef Leke',
    mosaic_virus: 'Mozaik Virüsü',
    yellow_leaf_curl_virus: 'Sarı Yaprak Kıvrılma Virüsü',
    bacterial_spot: 'Bakteriyel Leke',
    healthy: 'Sağlıklı',
};

interface Detection {
    class_name: string;
    display_name?: string;
    confidence: number;
    bbox: number[];
    source?: string;
}

function getDisplayName(det: Detection): string {
    if (det.display_name) return det.display_name;
    const key = det.class_name.toLowerCase();
    if (DISEASE_TR[key]) return DISEASE_TR[key];
    return det.class_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function getSeverity(confidence: number): 'high' | 'medium' | 'low' {
    if (confidence >= 0.8) return 'high';
    if (confidence >= 0.5) return 'medium';
    return 'low';
}

function computeHealthScore(hasDisease: boolean, detections: Detection[]): number {
    if (!hasDisease) return 96;
    const dets = detections || [];
    const avgConf = dets.reduce((s, d) => s + d.confidence, 0) / (dets.length || 1);
    return Math.max(8, Math.round(100 - (dets.length * 15) - (avgConf * 30)));
}

// ═══════════════════════════════════
// getDisplayName tests
// ═══════════════════════════════════

describe('getDisplayName() — Disease name localization', () => {

    it('returns display_name if provided by backend', () => {
        const det: Detection = {
            class_name: 'early_blight',
            display_name: 'Custom Name From Backend',
            confidence: 0.9,
            bbox: [0, 0, 100, 100],
        };
        expect(getDisplayName(det)).toBe('Custom Name From Backend');
    });

    it('returns Turkish name for known diseases', () => {
        const det: Detection = {
            class_name: 'early_blight',
            confidence: 0.9,
            bbox: [0, 0, 100, 100],
        };
        expect(getDisplayName(det)).toBe('Erken Yanıklık');
    });

    it('handles case-insensitive class names', () => {
        const det: Detection = {
            class_name: 'Late_Blight',
            confidence: 0.7,
            bbox: [0, 0, 100, 100],
        };
        expect(getDisplayName(det)).toBe('Geç Yanıklık');
    });

    it('returns healthy label in Turkish', () => {
        const det: Detection = {
            class_name: 'healthy',
            confidence: 0.95,
            bbox: [0, 0, 100, 100],
        };
        expect(getDisplayName(det)).toBe('Sağlıklı');
    });

    it('fallback: formats unknown class names nicely', () => {
        const det: Detection = {
            class_name: 'powdery_mildew_stage_2',
            confidence: 0.6,
            bbox: [0, 0, 100, 100],
        };
        // Should replace underscores with spaces and capitalize
        const result = getDisplayName(det);
        expect(result).toBe('Powdery Mildew Stage 2');
    });

    it('maps all known disease keys to Turkish', () => {
        // Verify every key in DISEASE_TR has a valid mapping
        Object.keys(DISEASE_TR).forEach(key => {
            const det: Detection = { class_name: key, confidence: 0.5, bbox: [] };
            expect(getDisplayName(det)).toBe(DISEASE_TR[key]);
        });
    });
});

// ═══════════════════════════════════
// getSeverity tests
// ═══════════════════════════════════

describe('getSeverity() — Confidence → Severity mapping', () => {

    it('returns "high" for confidence >= 0.8', () => {
        expect(getSeverity(0.8)).toBe('high');
        expect(getSeverity(0.95)).toBe('high');
        expect(getSeverity(1.0)).toBe('high');
    });

    it('returns "medium" for confidence 0.5-0.79', () => {
        expect(getSeverity(0.5)).toBe('medium');
        expect(getSeverity(0.65)).toBe('medium');
        expect(getSeverity(0.79)).toBe('medium');
    });

    it('returns "low" for confidence < 0.5', () => {
        expect(getSeverity(0.49)).toBe('low');
        expect(getSeverity(0.1)).toBe('low');
        expect(getSeverity(0.0)).toBe('low');
    });

    // Edge case: exactly at boundary
    it('boundary: 0.8 is high, 0.5 is medium', () => {
        expect(getSeverity(0.8)).toBe('high');
        expect(getSeverity(0.5)).toBe('medium');
    });
});

// ═══════════════════════════════════
// healthScore computation tests
// ═══════════════════════════════════

describe('computeHealthScore() — Plant health scoring', () => {

    it('returns 96 if no disease detected', () => {
        expect(computeHealthScore(false, [])).toBe(96);
    });

    it('reduces score based on number of detections', () => {
        const oneDet = computeHealthScore(true, [
            { class_name: 'early_blight', confidence: 0.5, bbox: [] }
        ]);
        const twoDets = computeHealthScore(true, [
            { class_name: 'early_blight', confidence: 0.5, bbox: [] },
            { class_name: 'late_blight', confidence: 0.5, bbox: [] }
        ]);
        expect(twoDets).toBeLessThan(oneDet);
    });

    it('reduces score based on confidence level', () => {
        const lowConf = computeHealthScore(true, [
            { class_name: 'early_blight', confidence: 0.3, bbox: [] }
        ]);
        const highConf = computeHealthScore(true, [
            { class_name: 'early_blight', confidence: 0.95, bbox: [] }
        ]);
        expect(highConf).toBeLessThan(lowConf);
    });

    it('never goes below 8 (floor value)', () => {
        const extreme = computeHealthScore(true, [
            { class_name: 'a', confidence: 1.0, bbox: [] },
            { class_name: 'b', confidence: 1.0, bbox: [] },
            { class_name: 'c', confidence: 1.0, bbox: [] },
            { class_name: 'd', confidence: 1.0, bbox: [] },
            { class_name: 'e', confidence: 1.0, bbox: [] },
            { class_name: 'f', confidence: 1.0, bbox: [] },
        ]);
        expect(extreme).toBe(8);
    });

    it('handles single high-confidence detection', () => {
        const score = computeHealthScore(true, [
            { class_name: 'late_blight', confidence: 0.9, bbox: [] }
        ]);
        // 100 - 15 - 27 = 58
        expect(score).toBe(58);
    });
});
