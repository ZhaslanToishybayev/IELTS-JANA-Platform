'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import {
    XPGainAnimation,
    LevelUpAnimation,
    StreakDisplay,
    CorrectIncorrectFeedback,
} from './Gamification';

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
    const { playSuccess, playError, playLevelUp } = useSoundEffects(); // Added useSoundEffects hook
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

    // Timer
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

            // Update user context
            updateUser({
                xp: result.new_xp,
                level: result.new_level,
                current_streak: result.new_streak,
            });

            // Show animations
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
        if (d <= 3) return { label: 'Easy', color: 'text-green-400' };
        if (d <= 6) return { label: 'Medium', color: 'text-yellow-400' };
        return { label: 'Hard', color: 'text-red-400' };
    };

    if (state.loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-purple-400 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (!state.question) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center text-white text-center p-4">
                <div>
                    <h2 className="text-2xl font-bold mb-4">No questions available</h2>
                    <p className="text-white/70 mb-6">Check back later for more practice exercises.</p>
                    <a href="/dashboard" className="bg-purple-600 px-6 py-3 rounded-xl hover:bg-purple-700 transition">
                        Go to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    const difficulty = getDifficultyLabel(state.question.difficulty);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 pb-32">
            {/* Header */}
            <div className="bg-black/20 backdrop-blur-sm p-4 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <a href="/dashboard" className="text-white/70 hover:text-white">
                            ← Back
                        </a>
                        <span className="text-white/50">|</span>
                        <span className="text-white font-medium">Q{state.sessionProgress}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-white/80">
                            <span className={difficulty.color}>{difficulty.label}</span>
                        </div>
                        <div className="bg-white/10 px-3 py-1 rounded-full text-white font-mono">
                            ⏱ {formatTime(elapsedTime)}
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress bar */}
            <div className="h-1 bg-white/10">
                <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((state.sessionProgress / 10) * 100, 100)}%` }}
                />
            </div>

            {/* Main content */}
            <div className="max-w-4xl mx-auto p-4 mt-4">
                {/* Skill info */}
                <div className="mb-4 flex flex-wrap gap-2">
                    <span className="bg-purple-500/30 text-purple-200 px-3 py-1 rounded-full text-sm">
                        {state.targetSkill}
                    </span>
                    <span className="bg-white/10 text-white/70 px-3 py-1 rounded-full text-sm">
                        {state.question.question_type.replace('_', '/')}
                    </span>
                </div>

                {/* Passage */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
                    {state.question.passage_title && (
                        <h3 className="text-white font-bold text-lg mb-4">{state.question.passage_title}</h3>
                    )}
                    <p className="text-white/90 leading-relaxed whitespace-pre-line">
                        {state.question.passage}
                    </p>
                </div>

                {/* Question */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6">
                    <h4 className="text-white font-semibold text-lg mb-4">
                        {state.question.question_text}
                    </h4>

                    {/* Options */}
                    <div className="space-y-3">
                        {state.question.options?.map((option, idx) => (
                            <motion.button
                                key={idx}
                                onClick={() => handleSelectAnswer(option)}
                                disabled={state.submitted}
                                whileHover={!state.submitted ? { scale: 1.02 } : {}}
                                whileTap={!state.submitted ? { scale: 0.98 } : {}}
                                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${state.selectedAnswer === option
                                    ? 'border-purple-400 bg-purple-500/30 text-white'
                                    : 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10'
                                    } ${state.submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                            >
                                <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {option}
                            </motion.button>
                        ))}
                    </div>
                </div>

                {/* Submit button */}
                {!state.submitted && (
                    <motion.button
                        onClick={handleSubmit}
                        disabled={!state.selectedAnswer}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${state.selectedAnswer
                            ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white hover:from-cyan-400 hover:to-purple-400'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        Check Answer
                    </motion.button>
                )}
            </div>

            {/* Animations */}
            <XPGainAnimation amount={state.result?.xpEarned || 0} show={showXP} />
            <LevelUpAnimation
                level={state.result?.newLevel || 1}
                show={showLevelUp}
                onComplete={() => setShowLevelUp(false)}
            />

            {/* Feedback */}
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
