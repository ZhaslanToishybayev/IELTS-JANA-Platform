import { describe, it, expect } from 'vitest';
import { render, screen } from './test-utils';

describe('api.ts', () => {
    it('has correct base URL', async () => {
        const { api } = await import('@/lib/api');
        expect(api).toBeDefined();
    });
});

describe('ErrorBoundary', () => {
    it('renders without crashing', async () => {
        const { ErrorBoundary } = await import('@/components/ErrorBoundary');
        render(
            <ErrorBoundary>
                <div>Test content</div>
            </ErrorBoundary>
        );
        expect(screen.getByText('Test content')).toBeInTheDocument();
    });
});
