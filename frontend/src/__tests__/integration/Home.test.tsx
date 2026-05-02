/**
 * Integration Tests — Home Page
 * 
 * Tests the core analysis workflow:
 * - Initial render (hero, upload zone)
 * - File upload interaction
 * - Analysis button visibility
 * - Loading state during analysis
 * - Successful result rendering
 * - Error state handling
 * - Reset flow
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Home from '../../pages/Home';

// ── Mock data ──
const mockAnalysisResult = {
    id: 'test-1234-5678-abcd',
    status: 'complete',
    vision: {
        detections: [
            {
                class_name: 'early_blight',
                confidence: 0.85,
                bbox: [10, 20, 100, 150],
                source: 'yolo',
            },
            {
                class_name: 'chlorosis_suspected',
                confidence: 0.62,
                bbox: [50, 60, 200, 250],
                source: 'color_analysis',
            },
        ],
        summary: 'Bitkide erken yanıklık belirtileri tespit edildi.',
        has_disease: true,
    },
    rag: {
        query: 'early_blight treatment',
        answer: '## Erken Yanıklık Tedavisi\n\nFungisit uygulaması önerilir.',
        sources: [
            { title: 'Tarım Bakanlığı Kılavuzu' },
        ],
    },
    recommendations: [
        {
            action: 'Fungisit Uygulayın',
            priority: 'high',
            category: 'kimyasal',
            details: 'Mancozeb bazlı fungisit uygulayın.',
            timeframe: '24 saat içinde',
        },
        {
            action: 'Sulama Düzenini Kontrol Edin',
            priority: 'medium',
            category: 'kültürel',
            details: 'Aşırı sulamadan kaçının.',
        },
    ],
    summary: 'Bitkide hastalık tespit edildi.',
};

// Helper
function renderHome() {
    return render(
        <MemoryRouter>
            <Home />
        </MemoryRouter>
    );
}

function createMockFile(name = 'test-plant.jpg', type = 'image/jpeg') {
    return new File(['(mock image data)'], name, { type });
}

describe('Home Page — Initial Render', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('renders the hero section with title', () => {
        renderHome();
        expect(screen.getByText(/Tarımsal Zekanın/)).toBeInTheDocument();
        expect(screen.getByText(/Bilimsel Standartı/)).toBeInTheDocument();
    });

    it('renders the version badge', () => {
        renderHome();
        expect(screen.getByText(/AI-Powered Plant Diagnostics/)).toBeInTheDocument();
    });

    it('renders the upload dropzone', () => {
        renderHome();
        expect(screen.getByText('Görseli Buraya Bırakın')).toBeInTheDocument();
        expect(screen.getByText(/dosya seçmek için tıklayın/)).toBeInTheDocument();
    });

    it('renders supported format info', () => {
        renderHome();
        expect(screen.getByText(/JPG, PNG, WebP/)).toBeInTheDocument();
    });

    it('renders the sensor panel', () => {
        renderHome();
        expect(screen.getByText('Canlı Sensör Entegrasyonu')).toBeInTheDocument();
    });

    it('does NOT show analyze button without image', () => {
        renderHome();
        expect(screen.queryByText('Analiz Raporunu Oluştur')).not.toBeInTheDocument();
    });

    it('does NOT show results section initially', () => {
        renderHome();
        expect(screen.queryByText('Analiz Raporu')).not.toBeInTheDocument();
    });
});

describe('Home Page — File Upload Flow', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('shows analyze button after uploading an image', async () => {
        const user = userEvent.setup();
        renderHome();

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        expect(input).toBeTruthy();

        const file = createMockFile();
        await user.upload(input, file);

        await waitFor(() => {
            expect(screen.getByText('Analiz Raporunu Oluştur')).toBeInTheDocument();
        });
    });

    it('shows image preview after upload', async () => {
        const user = userEvent.setup();
        renderHome();

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        const file = createMockFile();
        await user.upload(input, file);

        await waitFor(() => {
            const img = screen.getByAltText('Preview');
            expect(img).toBeInTheDocument();
            expect(img.getAttribute('src')).toContain('blob:');
        });
    });

    it('hides dropzone after upload', async () => {
        const user = userEvent.setup();
        renderHome();

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        await user.upload(input, createMockFile());

        await waitFor(() => {
            expect(screen.queryByText('Görseli Buraya Bırakın')).not.toBeInTheDocument();
        });
    });
});

describe('Home Page — Analysis API Integration', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('shows loading state when analyzing', async () => {
        const user = userEvent.setup();
        // Fetch that never resolves to keep loading state
        vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));

        renderHome();

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        await user.upload(input, createMockFile());

        await waitFor(() => {
            expect(screen.getByText('Analiz Raporunu Oluştur')).toBeInTheDocument();
        });

        await user.click(screen.getByText('Analiz Raporunu Oluştur'));

        await waitFor(() => {
            expect(screen.getByText('AI Pipeline Çalışıyor...')).toBeInTheDocument();
        });
    });

    it('shows pipeline steps during loading', async () => {
        const user = userEvent.setup();
        vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));

        renderHome();

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        await user.upload(input, createMockFile());
        await waitFor(() => screen.getByText('Analiz Raporunu Oluştur'));
        await user.click(screen.getByText('Analiz Raporunu Oluştur'));

        await waitFor(() => {
            expect(screen.getByText('Vision (YOLO)')).toBeInTheDocument();
            expect(screen.getByText('RAG Arama')).toBeInTheDocument();
            expect(screen.getByText('Karar Motoru')).toBeInTheDocument();
        });
    });

    it('renders full result after successful analysis', async () => {
        const user = userEvent.setup();
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify(mockAnalysisResult), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            })
        );

        renderHome();

        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        await user.upload(input, createMockFile());
        await waitFor(() => screen.getByText('Analiz Raporunu Oluştur'));
        await user.click(screen.getByText('Analiz Raporunu Oluştur'));

        // Wait for results
        await waitFor(() => {
            expect(screen.getByText('Analiz Raporu')).toBeInTheDocument();
        });

        // Disease detections (appear in both summary badges and disease cards)
        expect(screen.getAllByText('Erken Yanıklık').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Kloroz / Sararma').length).toBeGreaterThan(0);

        // Recommendations
        expect(screen.getByText('Fungisit Uygulayın')).toBeInTheDocument();
        expect(screen.getByText(/Mancozeb bazlı/)).toBeInTheDocument();

        // RAG section
        expect(screen.getByText('Akademik Analiz & Bulgular')).toBeInTheDocument();
        expect(screen.getByText(/Tarım Bakanlığı Kılavuzu/)).toBeInTheDocument();
    });

    it('shows priority badges for recommendations', async () => {
        const user = userEvent.setup();
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify(mockAnalysisResult), { status: 200 })
        );

        renderHome();
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        await user.upload(input, createMockFile());
        await waitFor(() => screen.getByText('Analiz Raporunu Oluştur'));
        await user.click(screen.getByText('Analiz Raporunu Oluştur'));

        await waitFor(() => {
            expect(screen.getByText('Yüksek')).toBeInTheDocument();
            expect(screen.getByText('Orta')).toBeInTheDocument();
        });
    });

    it('shows timeframe when available', async () => {
        const user = userEvent.setup();
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify(mockAnalysisResult), { status: 200 })
        );

        renderHome();
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        await user.upload(input, createMockFile());
        await waitFor(() => screen.getByText('Analiz Raporunu Oluştur'));
        await user.click(screen.getByText('Analiz Raporunu Oluştur'));

        await waitFor(() => {
            expect(screen.getByText('24 saat içinde')).toBeInTheDocument();
        });
    });

    it('displays error message when API fails', async () => {
        const user = userEvent.setup();
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response('Internal Server Error', { status: 500 })
        );

        renderHome();
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        await user.upload(input, createMockFile());
        await waitFor(() => screen.getByText('Analiz Raporunu Oluştur'));
        await user.click(screen.getByText('Analiz Raporunu Oluştur'));

        await waitFor(() => {
            expect(screen.getByText('Internal Server Error')).toBeInTheDocument();
        });
    });

    it('displays error message when network fails', async () => {
        const user = userEvent.setup();
        vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Network error'));

        renderHome();
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        await user.upload(input, createMockFile());
        await waitFor(() => screen.getByText('Analiz Raporunu Oluştur'));
        await user.click(screen.getByText('Analiz Raporunu Oluştur'));

        await waitFor(() => {
            expect(screen.getByText('Network error')).toBeInTheDocument();
        });
    });
});

describe('Home Page — Reset / New Analysis Flow', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('"Yeni Analiz" button resets to upload state', async () => {
        const user = userEvent.setup();
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify(mockAnalysisResult), { status: 200 })
        );

        renderHome();
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        await user.upload(input, createMockFile());
        await waitFor(() => screen.getByText('Analiz Raporunu Oluştur'));
        await user.click(screen.getByText('Analiz Raporunu Oluştur'));

        await waitFor(() => screen.getByText('Analiz Raporu'));

        // Click reset
        await user.click(screen.getByText('Yeni Analiz'));

        await waitFor(() => {
            // Should be back to upload state
            expect(screen.getByText('Görseli Buraya Bırakın')).toBeInTheDocument();
            // Results should be gone
            expect(screen.queryByText('Analiz Raporu')).not.toBeInTheDocument();
        });
    });
});

describe('Home Page — Sensor Correlation Section', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('shows sensor values in correlation cards after results', async () => {
        const user = userEvent.setup();
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify(mockAnalysisResult), { status: 200 })
        );

        renderHome();
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        await user.upload(input, createMockFile());
        await waitFor(() => screen.getByText('Analiz Raporunu Oluştur'));
        await user.click(screen.getByText('Analiz Raporunu Oluştur'));

        await waitFor(() => {
            expect(screen.getByText('Sensör Korelasyonu')).toBeInTheDocument();
        });
    });
});

describe('Home Page — Healthy Plant Result', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('shows "Sağlıklı Bitki" badge when no detections', async () => {
        const user = userEvent.setup();
        const healthyResult = {
            ...mockAnalysisResult,
            vision: {
                detections: [],
                summary: 'Bitki sağlıklı görünüyor.',
                has_disease: false,
            },
            recommendations: [],
        };

        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify(healthyResult), { status: 200 })
        );

        renderHome();
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        await user.upload(input, createMockFile());
        await waitFor(() => screen.getByText('Analiz Raporunu Oluştur'));
        await user.click(screen.getByText('Analiz Raporunu Oluştur'));

        await waitFor(() => {
            expect(screen.getByText('Sağlıklı Bitki')).toBeInTheDocument();
        });
    });
});
