/**
 * Unit Tests — lib/utils.ts
 * 
 * Tests the `cn()` utility function which merges Tailwind classes
 * with conflict resolution via clsx + tailwind-merge.
 */

import { describe, it, expect } from 'vitest';
import { cn } from '../../lib/utils';

describe('cn() — Tailwind class merge utility', () => {

    it('merges multiple class strings', () => {
        const result = cn('px-4', 'py-2', 'bg-white');
        expect(result).toContain('px-4');
        expect(result).toContain('py-2');
        expect(result).toContain('bg-white');
    });

    it('resolves Tailwind conflicts (last wins)', () => {
        // tailwind-merge should resolve px-4 vs px-8 → px-8
        const result = cn('px-4', 'px-8');
        expect(result).toBe('px-8');
        expect(result).not.toContain('px-4');
    });

    it('handles conditional classes (falsy values ignored)', () => {
        const isActive = false;
        const result = cn('base-class', isActive && 'active-class');
        expect(result).toContain('base-class');
        expect(result).not.toContain('active-class');
    });

    it('handles truthy conditional classes', () => {
        const isActive = true;
        const result = cn('base-class', isActive && 'active-class');
        expect(result).toContain('base-class');
        expect(result).toContain('active-class');
    });

    it('handles array inputs', () => {
        const result = cn(['foo', 'bar']);
        expect(result).toContain('foo');
        expect(result).toContain('bar');
    });

    it('handles undefined and null gracefully', () => {
        const result = cn('valid-class', undefined, null, '');
        expect(result).toBe('valid-class');
    });

    it('handles object syntax { className: boolean }', () => {
        const result = cn({ 'text-red-500': true, 'text-blue-500': false });
        expect(result).toContain('text-red-500');
        expect(result).not.toContain('text-blue-500');
    });

    it('resolves bg color conflicts', () => {
        const result = cn('bg-red-500', 'bg-emerald-500');
        expect(result).toBe('bg-emerald-500');
    });
});
