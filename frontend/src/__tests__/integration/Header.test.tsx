/**
 * Integration Tests — Header Component
 * 
 * Tests:
 * - Brand rendering (AgroCortex logo, subtitle)
 * - Navigation links (Analiz, Sera)
 * - Active route highlighting
 * - System health status indicator with fetch mocking
 * - Health check fallback mechanism
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../../components/Header';

// Helper to render Header inside a router at a specific path
function renderHeader(initialPath = '/') {
    return render(
        <MemoryRouter initialEntries={[initialPath]}>
            <Header />
        </MemoryRouter>
    );
}

describe('Header — Navigation & System Status', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    // ── Branding ──

    it('renders brand name "AgroCortex"', () => {
        // Mock fetch to prevent unhandled rejections
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
        renderHeader();
        expect(screen.getByText('AgroCortex')).toBeInTheDocument();
    });

    it('renders platform subtitle', () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
        renderHeader();
        expect(screen.getByText('AI PLATFORM')).toBeInTheDocument();
    });

    // ── Navigation ──

    it('renders navigation links', () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
        renderHeader();
        expect(screen.getByText('Analiz')).toBeInTheDocument();
        expect(screen.getByText('Sera')).toBeInTheDocument();
    });

    it('Analiz link points to root "/"', () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
        renderHeader();
        const analiz = screen.getByText('Analiz');
        expect(analiz.closest('a')).toHaveAttribute('href', '/');
    });

    it('Sera link points to "/greenhouse"', () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));
        renderHeader();
        const sera = screen.getByText('Sera');
        expect(sera.closest('a')).toHaveAttribute('href', '/greenhouse');
    });

    // ── System Status ──

    it('shows "Sistem Aktif" when backend is online', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(null, { status: 200 })
        );
        renderHeader();

        await waitFor(() => {
            expect(screen.getByText('Sistem Aktif')).toBeInTheDocument();
        });
    });

    it('shows "Çevrimdışı" when all health checks fail', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
        renderHeader();

        await waitFor(() => {
            expect(screen.getByText('Çevrimdışı')).toBeInTheDocument();
        });
    });

    it('shows "Kontrol..." initially before health check completes', () => {
        // Use a never-resolving promise to keep it in "checking" state
        vi.spyOn(globalThis, 'fetch').mockReturnValue(new Promise(() => {}));
        renderHeader();
        expect(screen.getByText('Kontrol...')).toBeInTheDocument();
    });

    it('tries fallback URL when primary health check fails', async () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        // Primary fails
        fetchSpy.mockRejectedValueOnce(new Error('proxy down'));
        // Fallback succeeds
        fetchSpy.mockResolvedValueOnce(new Response(null, { status: 200 }));

        renderHeader();

        await waitFor(() => {
            expect(screen.getByText('Sistem Aktif')).toBeInTheDocument();
        });

        // Verify it attempted 2 fetches (primary + fallback)
        expect(fetchSpy).toHaveBeenCalledTimes(2);
        expect(fetchSpy).toHaveBeenNthCalledWith(1, '/api/v1/models/status');
        expect(fetchSpy).toHaveBeenNthCalledWith(2, 'http://localhost:8000/health');
    });
});
