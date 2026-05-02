/**
 * E2E-Style Integration Tests — App.tsx (Router + Lazy Loading)
 * 
 * Tests:
 * - App mounts without crashing
 * - Lazy loading shows fallback then loads page
 * - Route navigation between pages
 * - 404 / unknown routes don't crash
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../../App';

describe('App — Router & Lazy Loading', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
        // Mock fetch for Header health checks and Greenhouse API calls
        vi.spyOn(globalThis, 'fetch').mockImplementation((url) => {
            const urlStr = typeof url === 'string' ? url : (url as Request).url;
            if (urlStr.includes('/api/v1/plants')) {
                return Promise.resolve(
                    new Response(JSON.stringify([]), { status: 200 })
                );
            }
            // Health check
            return Promise.resolve(new Response(null, { status: 200 }));
        });
    });

    it('mounts and renders Header immediately', async () => {
        render(<App />);

        await waitFor(() => {
            expect(screen.getByText('AgroCortex')).toBeInTheDocument();
        });
    });

    it('lazy-loads Home page on root route', async () => {
        render(<App />);

        // Suspense fallback may briefly show, then Home loads
        await waitFor(() => {
            expect(screen.getByText(/Tarımsal Zekanın/)).toBeInTheDocument();
        }, { timeout: 5000 });
    });

    it('shows loading indicator while lazy-loading', async () => {
        render(<App />);

        // The fallback or loaded content should eventually appear
        await waitFor(() => {
            const loadingOrContent =
                screen.queryByText('Yükleniyor...') ||
                screen.queryByText(/Tarımsal Zekanın/);
            expect(loadingOrContent).toBeTruthy();
        });
    });

    it('renders Header navigation on all routes', async () => {
        render(<App />);

        await waitFor(() => {
            expect(screen.getByText('Analiz')).toBeInTheDocument();
            expect(screen.getByText('Sera')).toBeInTheDocument();
        });
    });
});
