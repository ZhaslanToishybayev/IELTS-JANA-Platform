import { describe, it, expect, vi } from 'vitest';
import { render, screen } from './test-utils';
import { Sidebar } from '@/components/Sidebar';

vi.mock('next/navigation', () => ({
    usePathname: () => '/dashboard',
}));

describe('Sidebar', () => {
    it('renders JANA branding', () => {
        render(<Sidebar />);
        expect(screen.getByText('JANA')).toBeInTheDocument();
    });

    it('renders navigation links', () => {
        render(<Sidebar />);
        expect(screen.getByText('Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Diagnostic')).toBeInTheDocument();
        expect(screen.getByText('Reading')).toBeInTheDocument();
    });

    it('highlights active route', () => {
        render(<Sidebar />);
        const dashboardLink = screen.getByText('Dashboard').closest('a');
        expect(dashboardLink?.className).toContain('sidebar-link-active');
    });
});
