'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ReadingPractice } from '@/components/ReadingPractice';

export default function PracticePage() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    const practiceModule = searchParams.get('module') || 'READING';
    const questionType = searchParams.get('question_type') || undefined;
    const mode = searchParams.get('mode') || (questionType ? 'drill' : 'weakness');

    return (
        <ReadingPractice
            initialModule={practiceModule}
            initialMode={mode}
            initialQuestionType={questionType}
        />
    );
}
