import { describe, it, expect, vi } from 'vitest';
import { render, screen } from './test-utils';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { ReactNode } from 'react';

function Bomb(): ReactNode {
    throw new Error('Test error');
}

describe('ErrorBoundary', () => {
    it('renders children when no error', () => {
        render(
            <ErrorBoundary>
                <div>Child content</div>
            </ErrorBoundary>
        );
        expect(screen.getByText('Child content')).toBeInTheDocument();
    });

    it('renders fallback UI when error occurs', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <ErrorBoundary>
                <Bomb />
            </ErrorBoundary>
        );
        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
        expect(screen.getByText('Reload Page')).toBeInTheDocument();
        consoleSpy.mockRestore();
    });

    it('renders custom fallback when provided', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        render(
            <ErrorBoundary fallback={<div>Custom error UI</div>}>
                <Bomb />
            </ErrorBoundary>
        );
        expect(screen.getByText('Custom error UI')).toBeInTheDocument();
        consoleSpy.mockRestore();
    });
});
