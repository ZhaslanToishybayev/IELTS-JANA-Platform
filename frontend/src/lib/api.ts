const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface TodayPlan {
    title: string;
    estimated_minutes: number;
    focus_skill: {
        skill_id: number;
        skill_name: string;
        category: string;
        mastery_probability: number;
    } | null;
    tasks: {
        type: string;
        module?: string;
        label: string;
        target: number;
        href?: string;
    }[];
    reason: string;
    reward: {
        xp: number;
        streak: boolean;
    };
}

export interface ReviewMistake {
    id: number;
    module: string;
    question_type: string;
    question_text: string;
    passage_title: string | null;
    passage_excerpt: string | null;
    user_answer: string;
    correct_answer: string;
    explanation: string | null;
    created_at: string;
    question_id: number;
    is_resolved: boolean;
    skill: {
        id: number;
        name: string;
        category: string;
    } | null;
}

export interface ReviewSummary {
    total_unresolved: number;
    by_module: Record<string, number>;
    by_question_type: {
        question_type: string;
        count: number;
    }[];
}

export interface ReviewMistakeFilters {
    module?: string;
    question_type?: string;
    limit?: number;
    resolved?: 'false' | 'true' | 'all';
}

export interface DiagnosticQuestion {
    id: number;
    skill_id: number;
    passage: string;
    passage_title: string | null;
    question_text: string;
    question_type: string;
    options: string[] | null;
    difficulty: number;
}

export interface DiagnosticStatus {
    completed: boolean;
    answered: number;
    target: number;
    remaining: number;
    recommended: boolean;
    session_id: number | null;
    status: string | null;
}

export interface DiagnosticNext {
    question: DiagnosticQuestion;
    target_skill: string;
    reason: string;
    session_progress: number;
}

export interface DiagnosticWeakSkill {
    skill_id: number;
    skill_name: string;
    category: string;
    mastery_probability: number;
    accuracy_rate: number;
    attempts_count: number;
}

export interface DiagnosticResult {
    completed: boolean;
    answered: number;
    accuracy: number;
    estimated_reading_band: number;
    weak_skills: DiagnosticWeakSkill[];
    recommendation: string;
    session_id: number | null;
    status: string | null;
}

export interface DiagnosticStart {
    session_id: number;
    module: string;
    status: string;
    target: number;
    answered: number;
    completed: boolean;
}

export interface DiagnosticSubmitResult {
    id: number;
    question_id: number;
    user_answer: string;
    is_correct: boolean;
    response_time_ms: number;
    xp_earned: number;
    correct_answer: string;
    explanation: string | null;
    new_xp: number;
    new_level: number;
    level_up: boolean;
    new_streak: number;
    mastery_change: number;
    session_id: number;
    diagnostic_completed: boolean;
    completed: boolean;
    answered: number;
    target: number;
}

interface FetchOptions extends RequestInit {
    token?: string;
}

class ApiClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async fetch<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
        const { token, ...fetchOptions } = options;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            ...((fetchOptions.headers as Record<string, string>) || {}),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            ...fetchOptions,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
            throw new Error(error.detail || `HTTP ${response.status}`);
        }

        return response.json();
    }

    // Auth
    async signup(email: string, username: string, password: string) {
        return this.fetch<{ id: number; email: string; username: string }>('/auth/signup', {
            method: 'POST',
            body: JSON.stringify({ email, username, password }),
        });
    }

    async login(email: string, password: string) {
        return this.fetch<{ access_token: string; token_type: string }>('/auth/login/json', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
        });
    }

    async getMe(token: string) {
        return this.fetch<{
            id: number;
            email: string;
            username: string;
            xp: number;
            level: number;
            current_streak: number;
            longest_streak: number;
        }>('/auth/me', { token });
    }

    // Questions
    async getNextQuestion(token: string, category?: string) {
        const params = category ? `?category=${category}` : '';
        return this.fetch<{
            question: {
                id: number;
                skill_id: number;
                passage: string;
                passage_title: string | null;
                question_text: string;
                question_type: string;
                options: string[] | null;
                difficulty: number;
            };
            target_skill: string;
            reason: string;
            session_progress: number;
        }>(`/questions/next${params}`, { token });
    }

    async submitAnswer(token: string, questionId: number, answer: string, responseTimeMs: number) {
        return this.fetch<{
            id: number;
            question_id: number;
            user_answer: string;
            is_correct: boolean;
            response_time_ms: number;
            xp_earned: number;
            correct_answer: string;
            explanation: string | null;
            new_xp: number;
            new_level: number;
            level_up: boolean;
            new_streak: number;
            mastery_change: number;
        }>('/questions/submit', {
            method: 'POST',
            token,
            body: JSON.stringify({
                question_id: questionId,
                user_answer: answer,
                response_time_ms: responseTimeMs,
            }),
        });
    }

    async getCategories(token: string) {
        return this.fetch<{ category: string; question_count: number }[]>('/questions/categories', { token });
    }

    async getNextPractice(token: string, module = 'READING', mode = 'weakness', questionType?: string) {
        const params = new URLSearchParams({ module, mode });
        if (questionType) params.append('question_type', questionType);
        return this.fetch<{
            question: {
                id: number;
                skill_id: number;
                passage: string;
                passage_title: string | null;
                question_text: string;
                question_type: string;
                options: string[] | null;
                difficulty: number;
                audio_url?: string | null;
                audio_duration_sec?: number | null;
                transcript_available?: boolean;
            };
            target_skill: string;
            reason: string;
            session_progress: number;
        }>(`/practice/next?${params.toString()}`, { token });
    }

    async getMistakes(token: string, filters?: string | ReviewMistakeFilters) {
        const params = new URLSearchParams();
        if (typeof filters === 'string') {
            params.set('module', filters);
        } else if (filters) {
            if (filters.module) params.set('module', filters.module);
            if (filters.question_type) params.set('question_type', filters.question_type);
            if (filters.limit) params.set('limit', String(filters.limit));
            if (filters.resolved) params.set('resolved', filters.resolved);
        }
        const query = params.toString() ? `?${params.toString()}` : '';
        return this.fetch<{ mistakes: ReviewMistake[] }>(`/review/mistakes${query}`, { token });
    }

    async getReviewSummary(token: string) {
        return this.fetch<ReviewSummary>('/review/summary', { token });
    }

    async resolveMistake(token: string, mistakeId: number) {
        return this.fetch<{ message: string; id: number }>(`/review/mistakes/${mistakeId}/resolve`, {
            method: 'POST',
            token,
        });
    }

    async getStudyPlan(token: string, minutes = 60) {
        return this.fetch<{ minutes: number; total_attempts: number; items: unknown[] }>(`/study-plan/today?minutes=${minutes}`, { token });
    }

    async getTodayPlan(token: string) {
        return this.fetch<TodayPlan>('/plan/today', { token });
    }

    async getDiagnosticStatus(token: string) {
        return this.fetch<DiagnosticStatus>('/diagnostic/status', { token });
    }

    async startDiagnostic(token: string, restart = false) {
        const params = restart ? '?restart=true' : '';
        return this.fetch<DiagnosticStart>(`/diagnostic/start${params}`, {
            method: 'POST',
            token,
        });
    }

    async getDiagnosticNext(token: string) {
        return this.fetch<DiagnosticNext>('/diagnostic/next', { token });
    }

    async submitDiagnosticAnswer(token: string, questionId: number, answer: string, responseTimeMs: number) {
        return this.fetch<DiagnosticSubmitResult>('/diagnostic/submit', {
            method: 'POST',
            token,
            body: JSON.stringify({
                question_id: questionId,
                user_answer: answer,
                response_time_ms: responseTimeMs,
            }),
        });
    }

    async getDiagnosticResult(token: string) {
        return this.fetch<DiagnosticResult>('/diagnostic/result', { token });
    }

    async getContentTests(token: string, module?: string) {
        const params = module ? `?module=${module}` : '';
        return this.fetch<{ tests: unknown[] }>(`/content/tests${params}`, { token });
    }

    async getAdminDashboard(token: string) {
        return this.fetch<{
            users: { total: number; new_this_week: number; active_this_week: number };
            questions: { total: number; by_module: Record<string, number> };
            attempts: { total: number; today: number; avg_accuracy: number };
            achievements: { total: number; total_unlocked: number };
        }>('/admin/dashboard', { token });
    }

    async getAdminContent(token: string, statusFilter = 'all', module?: string) {
        const params = new URLSearchParams({ status_filter: statusFilter });
        if (module) params.append('module', module);
        return this.fetch<{
            content: {
                id: number;
                title: string;
                module: string;
                section: string | null;
                source: string;
                estimated_band: number | null;
                time_limit_minutes: number | null;
                needs_review: boolean;
                approved: boolean;
                question_count: number;
                created_at: string;
            }[];
        }>(`/admin/content?${params.toString()}`, { token });
    }

    async importAdminContent(token: string, payload: unknown) {
        return this.fetch<{ created_test_sets: number[]; count: number }>('/admin/content/import', {
            method: 'POST',
            token,
            body: JSON.stringify(payload),
        });
    }

    async approveAdminContent(token: string, contentId: number) {
        return this.fetch<{ message: string; id: number }>(`/admin/content/${contentId}/approve`, {
            method: 'POST',
            token,
        });
    }

    async getAdminQuestions(token: string, module?: string) {
        const params = module ? `?module=${module}` : '';
        return this.fetch<{
            total: number;
            questions: {
                id: number;
                skill_id: number;
                passage_title: string | null;
                question_text: string;
                question_type: string;
                difficulty: number;
                module: string;
            }[];
        }>(`/admin/questions${params}`, { token });
    }

    async getWritingPrompts(token: string) {
        return this.fetch<{ prompts: unknown[] }>('/prompts/writing', { token });
    }

    async getSpeakingPrompts(token: string) {
        return this.fetch<{ prompts: unknown[] }>('/prompts/speaking', { token });
    }

    // Dashboard
    async getDashboard(token: string) {
        return this.fetch<{
            username: string;
            level: number;
            xp: number;
            xp_to_next_level: number;
            current_streak: number;
            estimated_band: number;
            total_attempts: number;
            overall_accuracy: number;
            avg_response_time_ms: number;
            skills: {
                skill_id: number;
                skill_name: string;
                category: string;
                mastery_probability: number;
                attempts_count: number;
                accuracy_rate: number;
                is_unlocked: boolean;
            }[];
            section_bands: Record<string, number>;
            weak_question_types: { module: string; question_type: string; mistakes: number }[];
            mistake_log: { id: number; module: string; question_type: string; question_text: string; correct_answer: string }[];
            next_recommended_session: { module: string; mode: string; question_type?: string; duration_minutes: number; reason: string } | null;
        }>('/dashboard/progress', { token });
    }

    async getProgressHistory(token: string, days = 30) {
        return this.fetch<{
            date: string;
            estimated_band: number;
            accuracy_rate: number;
            attempts_count: number;
            xp_earned: number;
        }[]>(`/dashboard/history?days=${days}`, { token });
    }

    // Gamification
    async getGamificationProfile(token: string) {
        return this.fetch<{
            xp: number;
            level: number;
            xp_to_next_level: number;
            current_streak: number;
            longest_streak: number;
            total_questions_answered: number;
            accuracy_rate: number;
        }>('/gamification/profile', { token });
    }

    async getSkillTree(token: string) {
        return this.fetch<{
            nodes: {
                skill_id: number;
                skill_name: string;
                category: string;
                mastery_probability: number;
                is_unlocked: boolean;
                is_mastered: boolean;
                requires: number[];
                children: number[];
            }[];
            total_unlocked: number;
            total_mastered: number;
        }>('/gamification/skill-tree', { token });
    }

    async getLeaderboard(token: string, limit = 10) {
        return this.fetch<{
            rank: number;
            username: string;
            xp: number;
            level: number;
        }[]>(`/gamification/leaderboard?limit=${limit}`, { token });
    }

    // Writing
    async evaluateWriting(token: string, essayText: string, taskType: string, promptText: string) {
        return this.fetch<{
            band_score: number;
            task_response: { score: number; comment: string };
            coherence_cohesion: { score: number; comment: string };
            lexical_resource: { score: number; comment: string };
            grammatical_range: { score: number; comment: string };
            overall_feedback: string;
            improvements: string[];
            annotated_errors?: {
                original_text: string;
                correction: string;
                type: string;
                explanation: string;
            }[];
            error?: string;
        }>('/writing/evaluate', {
            method: 'POST',
            token,
            body: JSON.stringify({
                essay_text: essayText,
                task_type: taskType,
                prompt_text: promptText,
            }),
        });
    }

    async getWritingHistory(token: string) {
        return this.fetch<{ attempts: {
            id: number;
            created_at: string;
            task_type: string;
            prompt_text: string;
            band_score: number;
            criterion_scores: Record<string, number>;
            word_count: number;
            time_spent_sec: number | null;
        }[] }>('/writing/history', { token });
    }

    // Speaking
    async analyzeSpeaking(token: string, audioBlob: Blob, promptText: string) {
        const formData = new FormData();
        formData.append('file', audioBlob, 'speaking.webm');
        formData.append('prompt_text', promptText);

        const response = await fetch(`${this.baseUrl}/speaking/analyze`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ detail: 'An error occurred' }));
            throw new Error(error.detail || `HTTP ${response.status}`);
        }

        return response.json();
    }

    async getSpeakingHistory(token: string) {
        return this.fetch<{ attempts: {
            id: number;
            created_at: string;
            prompt_text: string;
            band_score: number;
            criterion_scores: Record<string, number>;
            time_spent_sec: number | null;
        }[] }>('/speaking/history', { token });
    }

    // Vocabulary
    async getDueFlashcards(token: string) {
        return this.fetch<unknown[]>('/vocabulary/due', { token });
    }

    async addVocabulary(token: string, word: string, definition: string, context?: string) {
        return this.fetch('/vocabulary/add', {
            method: 'POST',
            token,
            body: JSON.stringify({ word, definition, context })
        });
    }

    async reviewFlashcard(token: string, cardId: number, quality: number) {
        return this.fetch('/vocabulary/review', {
            method: 'POST',
            token,
            body: JSON.stringify({ card_id: cardId, quality })
        });
    }

    // Generator
    async generateReadingTest(token: string, url: string) {
        return this.fetch<{
            title: string;
            summary: string;
            questions: {
                question_text: string;
                question_type: string;
                options: string[] | null;
                correct_answer: string;
                explanation: string;
            }[];
        }>('/generator/reading', {
            method: 'POST',
            token,
            body: JSON.stringify({ url, difficulty: 5 })
        });
    }

    // Mock Exam
    async startMockExam(token: string) {
        return this.fetch<{ id: string; status: string }>('/mock/start', {
            method: 'POST',
            token
        });
    }

    async getMockQuestions(token: string, module: string, limit = 12, sessionId?: string) {
        const params = new URLSearchParams({ module, limit: String(limit) });
        if (sessionId) params.append('session_id', sessionId);
        return this.fetch<{ questions: { id: number; text: string; type: string; options: string[] | null; passage?: string; passage_title?: string; audio_url?: string | null; section?: string | null }[] }>(
            `/mock/questions?${params.toString()}`,
            { token }
        );
    }

    async submitMockListening(token: string, sessionId: string, answers: Record<string, unknown>) {
        return this.fetch(`/mock/${sessionId}/listening`, {
            method: 'POST',
            token,
            body: JSON.stringify(answers) // Sends { "q_1": "answer" } directly as dict
        });
    }

    async submitMockReading(token: string, sessionId: string, answers: Record<string, unknown>) {
        return this.fetch(`/mock/${sessionId}/reading`, {
            method: 'POST',
            token,
            body: JSON.stringify(answers)
        });
    }

    async submitMockWriting(token: string, sessionId: string, text: string) {
        return this.fetch(`/mock/${sessionId}/writing`, {
            method: 'POST',
            token,
            body: JSON.stringify({ text })
        });
    }

    async submitMockSpeaking(token: string, sessionId: string, transcript: string) {
        return this.fetch(`/mock/${sessionId}/speaking`, {
            method: 'POST',
            token,
            body: JSON.stringify({ transcript })
        });
    }

    async getMockResults(token: string, sessionId: string) {
        return this.fetch<{
            scores: {
                listening: number;
                listening_raw?: { correct: number; total: number };
                reading: number;
                reading_raw?: { correct: number; total: number };
                writing: number;
                writing_raw?: { words: number };
                speaking: number;
                speaking_raw?: { words: number };
                overall: number;
            };
            status: string;
        }>(`/mock/${sessionId}`, { token });
    }

    // ============ Achievements ============
    async getAchievements(token: string) {
        return this.fetch<{
            total: number;
            unlocked: number;
            achievements: {
                id: number;
                code: string;
                name: string;
                description: string;
                icon: string;
                category: string;
                xp_reward: number;
                rarity: string;
                is_unlocked: boolean;
                unlocked_at: string | null;
            }[];
            by_category: Record<string, any[]>;
        }>('/achievements', { token });
    }

    async getUnlockedAchievements(token: string) {
        return this.fetch<{
            count: number;
            achievements: {
                id: number;
                code: string;
                name: string;
                description: string;
                icon: string;
                xp_reward: number;
                rarity: string;
                unlocked_at: string;
            }[];
        }>('/achievements/unlocked', { token });
    }

    async checkNewAchievements(token: string) {
        return this.fetch<{
            new_achievements: {
                code: string;
                name: string;
                description: string;
                icon: string;
                xp_reward: number;
                rarity: string;
            }[];
            total_xp_earned: number;
        }>('/achievements/check', { method: 'POST', token });
    }

    // ============ Email Verification ============
    async verifyEmail(token: string) {
        return this.fetch<{ message: string }>('/auth/verify-email', {
            method: 'POST',
            body: JSON.stringify({ token }),
        });
    }

    async resendVerification(email: string) {
        return this.fetch<{ message: string }>('/auth/resend-verification', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async forgotPassword(email: string) {
        return this.fetch<{ message: string }>('/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    }

    async resetPassword(resetToken: string, newPassword: string) {
        return this.fetch<{ message: string }>('/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token: resetToken, new_password: newPassword }),
        });
    }

    // ============ Listening ============
    async getListeningQuestions(token: string, difficulty?: number, limit = 10) {
        const params = new URLSearchParams();
        if (difficulty) params.append('difficulty', difficulty.toString());
        params.append('limit', limit.toString());

        return this.fetch<{
            count: number;
            questions: {
                id: number;
                skill_id: number;
                passage_title: string | null;
                question_text: string;
                question_type: string;
                options: string[] | null;
                difficulty: number;
                audio_url: string;
                audio_duration_sec: number | null;
            }[];
        }>(`/listening/questions?${params.toString()}`, { token });
    }

    async getListeningQuestion(token: string, questionId: number) {
        return this.fetch<{
            id: number;
            skill_id: number;
            passage_title: string | null;
            question_text: string;
            question_type: string;
            options: string[] | null;
            difficulty: number;
            audio_url: string;
            audio_duration_sec: number | null;
        }>(`/listening/questions/${questionId}`, { token });
    }

    async getListeningTranscript(token: string, questionId: number) {
        return this.fetch<{
            question_id: number;
            transcript: string;
            passage_title: string | null;
        }>(`/listening/transcript/${questionId}`, { token });
    }

    async submitListeningAnswer(token: string, questionId: number, answer: string, responseTimeMs: number) {
        return this.fetch<{
            is_correct: boolean;
            correct_answer: string;
            explanation: string | null;
            xp_earned: number;
            transcript_available: boolean;
        }>('/listening/submit', {
            method: 'POST',
            token,
            body: JSON.stringify({
                question_id: questionId,
                user_answer: answer,
                response_time_ms: responseTimeMs,
            }),
        });
    }

    async getListeningProgress(token: string) {
        return this.fetch<{
            total_attempts: number;
            correct_attempts: number;
            accuracy: number;
            questions_completed: number;
            questions_available: number;
            completion_percentage: number;
        }>('/listening/progress', { token });
    }

    getAudioUrl(questionId: number) {
        return `${this.baseUrl}/listening/audio/${questionId}`;
    }

}

export const api = new ApiClient(API_URL);

