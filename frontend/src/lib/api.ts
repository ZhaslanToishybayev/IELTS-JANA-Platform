const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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

    // Vocabulary
    async getDueFlashcards(token: string) {
        return this.fetch<any[]>('/vocabulary/due', { token });
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

    async submitMockListening(token: string, sessionId: string, answers: Record<string, any>) {
        return this.fetch(`/mock/${sessionId}/listening`, {
            method: 'POST',
            token,
            body: JSON.stringify(answers) // Sends { "q_1": "answer" } directly as dict
        });
    }

    async submitMockReading(token: string, sessionId: string, answers: Record<string, any>) {
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

    async getMockResults(token: string, sessionId: string) {
        return this.fetch<{
            scores: {
                listening: number;
                reading: number;
                writing: number;
                overall: number;
            };
            status: string;
        }>(`/mock/${sessionId}`, { token });
    }


}

export const api = new ApiClient(API_URL);
