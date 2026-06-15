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

    if (loading || !user) {
        return null;
    }

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
