'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from './auth';
import { api } from './api';

export function useDashboard() {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['dashboard'],
        queryFn: () => api.getDashboard(token!),
        enabled: !!token,
    });
}

export function useTodayPlan() {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['todayPlan'],
        queryFn: () => api.getTodayPlan(token!),
        enabled: !!token,
    });
}

export function useDiagnosticStatus() {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['diagnosticStatus'],
        queryFn: () => api.getDiagnosticStatus(token!),
        enabled: !!token,
    });
}

export function useDiagnosticResult(enabled = false) {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['diagnosticResult'],
        queryFn: () => api.getDiagnosticResult(token!),
        enabled: !!token && enabled,
    });
}

export function useReviewSummary() {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['reviewSummary'],
        queryFn: () => api.getReviewSummary(token!),
        enabled: !!token,
    });
}

export function useMistakes(filters?: string) {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['mistakes', filters],
        queryFn: () => api.getMistakes(token!, filters),
        enabled: !!token,
    });
}

export function useWritingHistory() {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['writingHistory'],
        queryFn: () => api.getWritingHistory(token!),
        enabled: !!token,
    });
}

export function useSpeakingHistory() {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['speakingHistory'],
        queryFn: () => api.getSpeakingHistory(token!),
        enabled: !!token,
    });
}

export function useAchievements() {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['achievements'],
        queryFn: () => api.getAchievements(token!),
        enabled: !!token,
    });
}

export function useLeaderboard(limit = 20, offset = 0) {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['leaderboard', limit, offset],
        queryFn: () => api.getLeaderboard(token!, limit, offset),
        enabled: !!token,
    });
}

export function useProgressHistory(days = 30) {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['progressHistory', days],
        queryFn: () => api.getProgressHistory(token!, days),
        enabled: !!token,
    });
}

export function useSkillTree() {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['skillTree'],
        queryFn: () => api.getSkillTree(token!),
        enabled: !!token,
    });
}

export function useDueFlashcards() {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['flashcards'],
        queryFn: () => api.getDueFlashcards(token!),
        enabled: !!token,
    });
}

export function useListeningProgress() {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['listeningProgress'],
        queryFn: () => api.getListeningProgress(token!),
        enabled: !!token,
    });
}

export function useAdminDashboard() {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['adminDashboard'],
        queryFn: () => api.getAdminDashboard(token!),
        enabled: !!token,
    });
}

export function useAdminMockResults(limit = 50, offset = 0, status?: string) {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['adminMockResults', limit, offset, status],
        queryFn: () => api.getAdminMockResults(token!, limit, offset, status),
        enabled: !!token,
    });
}

export function useAdminMockSummary() {
    const { token } = useAuth();
    return useQuery({
        queryKey: ['adminMockSummary'],
        queryFn: () => api.getAdminMockSummary(token!),
        enabled: !!token,
    });
}
