/**
 * Test Setup — Global configuration for Vitest + React Testing Library
 * 
 * This file runs before every test suite and:
 * 1. Extends expect with @testing-library/jest-dom matchers
 * 2. Mocks browser APIs not available in jsdom (IntersectionObserver, matchMedia, etc.)
 * 3. Cleans up after each test
 */

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// ── Auto-cleanup after each test ──
afterEach(() => {
    cleanup();
});

// ── Mock IntersectionObserver (used by framer-motion, lazy loading) ──
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
});
window.IntersectionObserver = mockIntersectionObserver as any;

// ── Mock matchMedia (used by responsive components) ──
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// ── Mock URL.createObjectURL (used by image upload preview) ──
URL.createObjectURL = vi.fn(() => 'blob:http://localhost:3000/mock-blob-url');
URL.revokeObjectURL = vi.fn();

// ── Mock ResizeObserver (used by recharts, Three.js canvas) ──
window.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));

// ── Mock Canvas/WebGL context (ThreeBackground uses WebGL) ──
HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    canvas: {},
    clearRect: vi.fn(),
    drawImage: vi.fn(),
    getImageData: vi.fn(),
    putImageData: vi.fn(),
    createImageBitmap: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ width: 0 })),
}) as any;
