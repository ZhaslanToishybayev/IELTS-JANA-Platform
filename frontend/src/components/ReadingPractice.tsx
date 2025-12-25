'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import {
    XPGainAnimation,
    LevelUpAnimation,
    CorrectIncorrectFeedback,
} from './Gamification';
import {
    ArrowLeft,
    Clock,
    BarChart,
    BookOpen,
    Info,
    CheckCircle2,
    ChevronRight,
    Sparkles,
    AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface Question {
    id: number;
    skill_id: number;
    passage: string;
    passage_title: string | null;
    question_text: string;
    question_type: string;
    options: string[] | null;
    difficulty: number;
}

interface PracticeState {
    question: Question | null;
    targetSkill: string;
    reason: string;
    sessionProgress: number;
    loading: boolean;
    selectedAnswer: string | null;
    submitted: boolean;
    result: {
        isCorrect: boolean;
        xpEarned: number;
        correctAnswer: string;
        explanation: string | null;
        newLevel: number;
        levelUp: boolean;
        newStreak: number;
        masteryChange: number;
    } | null;
    startTime: number;
}

export function ReadingPractice() {
    const { token, updateUser } = useAuth();
    const { playSuccess, playError } = useSoundEffects();
    const [state, setState] = useState<PracticeState>({
        question: null,
        targetSkill: '',
        reason: '',
        sessionProgress: 0,
        loading: true,
        selectedAnswer: null,
        submitted: false,
        result: null,
        startTime: Date.now(),
    });
    const [showXP, setShowXP] = useState(false);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    const fetchNextQuestion = useCallback(async () => {
        if (!token) return;

        setState(prev => ({ ...prev, loading: true }));

        try {
            const data = await api.getNextQuestion(token);
            setState({
                question: data.question,
                targetSkill: data.target_skill,
                reason: data.reason,
                sessionProgress: data.session_progress,
                loading: false,
                selectedAnswer: null,
                submitted: false,
                result: null,
                startTime: Date.now(),
            });
            setElapsedTime(0);
        } catch (error) {
            console.error('Failed to fetch question:', error);
            setState(prev => ({ ...prev, loading: false }));
        }
    }, [token]);

    useEffect(() => {
        fetchNextQuestion();
    }, [fetchNextQuestion]);

    useEffect(() => {
        if (state.loading || state.submitted) return;

        const timer = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - state.startTime) / 1000));
        }, 1000);

        return () => clearInterval(timer);
    }, [state.loading, state.submitted, state.startTime]);

    const handleSelectAnswer = (answer: string) => {
        if (!state.submitted) {
            setState(prev => ({ ...prev, selectedAnswer: answer }));
        }
    };

    const handleSubmit = async () => {
        if (!token || !state.question || !state.selectedAnswer) return;

        const responseTimeMs = Date.now() - state.startTime;
        setState(prev => ({ ...prev, submitted: true }));

        try {
            const result = await api.submitAnswer(
                token,
                state.question.id,
                state.selectedAnswer,
                responseTimeMs
            );

            setState(prev => ({
                ...prev,
                result: {
                    isCorrect: result.is_correct,
                    xpEarned: result.xp_earned,
                    correctAnswer: result.correct_answer,
                    explanation: result.explanation,
                    newLevel: result.new_level,
                    levelUp: result.level_up,
                    newStreak: result.new_streak,
                    masteryChange: result.mastery_change,
                },
            }));

            updateUser({
                xp: result.new_xp,
                level: result.new_level,
                current_streak: result.new_streak,
            });

            if (result.is_correct && result.xp_earned > 0) {
                setShowXP(true);
                setTimeout(() => setShowXP(false), 1500);
            }

            if (result.level_up) {
                setTimeout(() => setShowLevelUp(true), 500);
            }
        } catch (error) {
            console.error('Failed to submit answer:', error);
        }
    };

    const handleContinue = () => {
        fetchNextQuestion();
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getDifficultyLabel = (d: number) => {
        if (d <= 3) return { label: 'Novice', color: 'text-green-600 bg-green-50' };
        if (d <= 6) return { label: 'Intermediate', color: 'text-amber-600 bg-amber-50' };
        return { label: 'Expert', color: 'text-rose-600 bg-rose-50' };
    };

    if (state.loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Generating your next challenge...</p>
            </div>
        );
    }

    if (!state.question) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6">
                <div className="max-w-md w-full card p-10 text-center space-y-6">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Challenges Found</h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            We couldn&apos;t find any new questions for your current level. Try changing your focus or checking back later.
                        </p>
                    </div>
                    <Link href="/dashboard" className="btn-primary block w-full text-center">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const difficulty = getDifficultyLabel(state.question.difficulty);

    return (
        <div className="pb-24">
            {/* Context Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Reading Practice
                        </h1>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${difficulty.color}`}>
                            {difficulty.label}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 pl-12">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{state.targetSkill}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question {state.sessionProgress}</span>
                    </div>
                </div>

                <div className="flex items-center gap-4 pl-12 md:pl-0">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="font-mono font-bold text-slate-700 dark:text-slate-200">
                            {formatTime(elapsedTime)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Session Progress Bar */}
            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-10 overflow-hidden">
                <motion.div
                    className="h-full bg-blue-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((state.sessionProgress / 10) * 100, 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />
            </div>

            {/* Content Sidebar Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Passage Column */}
                <div className="lg:col-span-7 space-y-6">
                    <div className="card p-8 md:p-10 !rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none border-t-4 border-t-blue-600">
                        {state.question.passage_title && (
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
                                {state.question.passage_title}
                            </h2>
                        )}
                        <div className="prose prose-slate dark:prose-invert max-w-none">
                            <p className="text-slate-700 dark:text-slate-300 leading-[1.8] text-lg font-medium whitespace-pre-line selection:bg-blue-100 dark:selection:bg-blue-900/40">
                                {state.question.passage}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Question Column */}
                <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8 self-start">
                    <div className="card p-8 space-y-8 !rounded-3xl">
                        <div className="space-y-4">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold uppercase tracking-widest">
                                <Info className="w-3.5 h-3.5" />
                                {state.question.question_type.replace('_', ' ')}
                            </div>
                            <h3 className="text-xl font-black text-slate-900 dark:text-white leading-snug">
                                {state.question.question_text}
                            </h3>
                        </div>

                        {/* Options */}
                        <div className="space-y-3">
                            {state.question.options?.map((option, idx) => {
                                const isSelected = state.selectedAnswer === option;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => handleSelectAnswer(option)}
                                        disabled={state.submitted}
                                        className={`w-full group text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4 ${isSelected
                                                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                                                : 'border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                            } ${state.submitted ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold transition-colors ${isSelected
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-hover:text-blue-600'
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className={`pt-0.5 leading-relaxed font-semibold ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {option}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Feedback & Actions */}
                        {!state.submitted ? (
                            <button
                                onClick={handleSubmit}
                                disabled={!state.selectedAnswer}
                                className={`w-full py-5 rounded-2xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${state.selectedAnswer
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 active:scale-[0.98]'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                Submit Answer
                            </button>
                        ) : (
                            <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <button
                                    onClick={handleContinue}
                                    className="w-full py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 dark:shadow-none active:scale-[0.98]"
                                >
                                    Continue
                                    <ChevronRight className="w-5 h-5" />
                                </button>

                                {state.result?.explanation && (
                                    <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                                        <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
                                            <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                            Why is this correct?
                                        </h4>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                            &quot;{state.result.explanation}&quot;
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Animations */}
            <XPGainAnimation amount={state.result?.xpEarned || 0} show={showXP} />
            <LevelUpAnimation
                level={state.result?.newLevel || 1}
                show={showLevelUp}
                onComplete={() => setShowLevelUp(false)}
            />

            {/* Global Overlay Feedback */}
            <CorrectIncorrectFeedback
                isCorrect={state.result?.isCorrect || false}
                show={state.submitted && state.result !== null}
                explanation={state.result?.explanation || undefined}
                correctAnswer={state.result?.correctAnswer}
                onContinue={handleContinue}
            />
        </div>
    );
}

