import { render, type RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { vi } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/lib/auth';

vi.mock('@/lib/api', () => ({
    api: {
        getMe: vi.fn().mockRejectedValue(new Error('Not authenticated')),
        login: vi.fn(),
        signup: vi.fn(),
        getDashboard: vi.fn(),
        getTodayPlan: vi.fn(),
        getDiagnosticStatus: vi.fn(),
        getReviewSummary: vi.fn(),
        getMistakes: vi.fn(),
        getWritingHistory: vi.fn(),
        getSpeakingHistory: vi.fn(),
        getAchievements: vi.fn(),
        getLeaderboard: vi.fn(),
        getProgressHistory: vi.fn(),
        getSkillTree: vi.fn(),
        getDueFlashcards: vi.fn(),
        getListeningProgress: vi.fn(),
        getAdminDashboard: vi.fn(),
    },
}));

function AllProviders({ children }: { children: React.ReactNode }) {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
                gcTime: 0,
            },
        },
    });
    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                {children}
            </AuthProvider>
        </QueryClientProvider>
    );
}

function customRender(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
    return render(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react';
export { customRender as render };
