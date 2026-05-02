/**
 * Integration Tests — Greenhouse Page
 * 
 * Tests:
 * - Initial render with empty plant list
 * - Loading state
 * - Plant list rendering from API
 * - "Add Plant" form toggle and submission
 * - API error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Greenhouse from '../../pages/Greenhouse';

const mockPlants = [
    {
        id: 'plant-1',
        name: 'Domates - Sera A - Sıra 1',
        type: 'Tomato',
        created_at: '2026-03-15T10:00:00Z',
    },
    {
        id: 'plant-2',
        name: 'Biber - Sera B - Sıra 3',
        type: 'Tomato',
        created_at: '2026-03-20T14:30:00Z',
    },
];

function renderGreenhouse() {
    return render(
        <MemoryRouter>
            <Greenhouse />
        </MemoryRouter>
    );
}

describe('Greenhouse Page — Initial Render', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('renders page title', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify([]), { status: 200 })
        );
        renderGreenhouse();

        expect(screen.getByText('Dijital Sera Yönetimi')).toBeInTheDocument();
    });

    it('renders page description', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify([]), { status: 200 })
        );
        renderGreenhouse();

        expect(screen.getByText(/Bitkilerinizi kaydedin/)).toBeInTheDocument();
    });

    it('renders "Yeni Bitki Ekle" button', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify([]), { status: 200 })
        );
        renderGreenhouse();

        expect(screen.getByText(/Yeni Bitki Ekle/)).toBeInTheDocument();
    });
});

describe('Greenhouse Page — Empty State', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('shows empty state message when no plants exist', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify([]), { status: 200 })
        );
        renderGreenhouse();

        await waitFor(() => {
            expect(screen.getByText('Henüz Kayıtlı Bitki Yok')).toBeInTheDocument();
        });
    });

    it('shows empty state instruction', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify([]), { status: 200 })
        );
        renderGreenhouse();

        await waitFor(() => {
            expect(screen.getByText(/Yeni bir bitki ekleyerek/)).toBeInTheDocument();
        });
    });
});

describe('Greenhouse Page — Plant List', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('renders plant cards from API data', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify(mockPlants), { status: 200 })
        );
        renderGreenhouse();

        await waitFor(() => {
            expect(screen.getByText('Domates - Sera A - Sıra 1')).toBeInTheDocument();
            expect(screen.getByText('Biber - Sera B - Sıra 3')).toBeInTheDocument();
        });
    });

    it('shows plant type badges', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify(mockPlants), { status: 200 })
        );
        renderGreenhouse();

        await waitFor(() => {
            const badges = screen.getAllByText('Tomato');
            expect(badges.length).toBe(2);
        });
    });

    it('shows action buttons for each plant', async () => {
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify(mockPlants), { status: 200 })
        );
        renderGreenhouse();

        await waitFor(() => {
            const historyButtons = screen.getAllByText('Geçmiş');
            const analysisButtons = screen.getAllByText('Analiz');
            expect(historyButtons.length).toBe(2);
            expect(analysisButtons.length).toBe(2);
        });
    });
});

describe('Greenhouse Page — Add Plant Flow', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('shows add plant form when button clicked', async () => {
        const user = userEvent.setup();
        vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
            new Response(JSON.stringify([]), { status: 200 })
        );
        renderGreenhouse();

        await user.click(screen.getByText(/Yeni Bitki Ekle/));

        await waitFor(() => {
            expect(screen.getByPlaceholderText(/Domates - Sera A/)).toBeInTheDocument();
            expect(screen.getByText('Kaydet')).toBeInTheDocument();
        });
    });

    it('submits new plant to API', async () => {
        const user = userEvent.setup();
        const fetchSpy = vi.spyOn(globalThis, 'fetch');

        // Initial fetch - empty list
        fetchSpy.mockResolvedValueOnce(
            new Response(JSON.stringify([]), { status: 200 })
        );

        renderGreenhouse();
        await waitFor(() => screen.getByText('Henüz Kayıtlı Bitki Yok'));

        await user.click(screen.getByText(/Yeni Bitki Ekle/));

        const input = await screen.findByPlaceholderText(/Domates - Sera A/);
        await user.type(input, 'Yeni Domates');

        // POST response
        fetchSpy.mockResolvedValueOnce(
            new Response(JSON.stringify({ id: 'new-1', name: 'Yeni Domates', type: 'Tomato', created_at: new Date().toISOString() }), { status: 200 })
        );
        // Re-fetch after add
        fetchSpy.mockResolvedValueOnce(
            new Response(JSON.stringify([{ id: 'new-1', name: 'Yeni Domates', type: 'Tomato', created_at: new Date().toISOString() }]), { status: 200 })
        );

        await user.click(screen.getByText('Kaydet'));

        await waitFor(() => {
            // Verify POST was called
            const postCall = fetchSpy.mock.calls.find(
                call => call[1] && (call[1] as RequestInit).method === 'POST'
            );
            expect(postCall).toBeTruthy();
        });
    });

    it('does not submit when plant name is empty', async () => {
        const user = userEvent.setup();
        const fetchSpy = vi.spyOn(globalThis, 'fetch');
        fetchSpy.mockResolvedValueOnce(
            new Response(JSON.stringify([]), { status: 200 })
        );

        renderGreenhouse();
        await waitFor(() => screen.getByText('Henüz Kayıtlı Bitki Yok'));

        await user.click(screen.getByText(/Yeni Bitki Ekle/));
        await waitFor(() => screen.getByText('Kaydet'));

        // Click save without typing anything
        await user.click(screen.getByText('Kaydet'));

        // Only the initial GET should have been called
        const postCalls = fetchSpy.mock.calls.filter(
            call => call[1] && (call[1] as RequestInit).method === 'POST'
        );
        expect(postCalls.length).toBe(0);
    });
});

describe('Greenhouse Page — API Error Handling', () => {

    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('handles fetch error gracefully (no crash)', async () => {
        vi.spyOn(globalThis, 'fetch').mockRejectedValueOnce(new Error('Server down'));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        renderGreenhouse();

        await waitFor(() => {
            // Should show empty state, not crash
            expect(screen.getByText('Henüz Kayıtlı Bitki Yok')).toBeInTheDocument();
        });

        consoleSpy.mockRestore();
    });
});
