'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
    XPGainAnimation,
    LevelUpAnimation,
    CorrectIncorrectFeedback,
} from './Gamification';
import {
    ArrowLeft,
    Play,
    Pause,
    RotateCcw,
    Volume2,
    FileText,
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Sparkles,
    Info,
    Clock,
    Headphones
} from 'lucide-react';
import Link from 'next/link';

interface ListeningQuestion {
    id: number;
    skill_id: number;
    passage: string;
    passage_title: string | null;
    question_text: string;
    question_type: string;
    options: string[] | null;
    difficulty: number;
    audio_url?: string;
    audio_duration_sec?: number;
}

export function ListeningPractice() {
    const { token, updateUser } = useAuth();
    const [question, setQuestion] = useState<ListeningQuestion | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedAnswer, setSelectedAnswer] = useState<string>('');
    const [submitted, setSubmitted] = useState(false);
    const [result, setResult] = useState<{
        isCorrect: boolean;
        xpEarned: number;
        correctAnswer: string;
        explanation: string | null;
        levelUp: boolean;
        newLevel: number;
    } | null>(null);
    const [showXP, setShowXP] = useState(false);
    const [showLevelUp, setShowLevelUp] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());
    const [isPlaying, setIsPlaying] = useState(false);
    const [showTranscript, setShowTranscript] = useState(false);
    const [playCount, setPlayCount] = useState(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    const fetchNextQuestion = useCallback(async () => {
        if (!token) return;
        setLoading(true);

        try {
            const response = await fetch(`http://localhost:8000/api/questions/next?module=LISTENING`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setQuestion(data.question);
            } else {
                const data = await api.getNextQuestion(token);
                setQuestion(data.question as ListeningQuestion);
            }

            setSelectedAnswer('');
            setSubmitted(false);
            setResult(null);
            setStartTime(Date.now());
            setPlayCount(0);
            setShowTranscript(false);
            setElapsedTime(0);
        } catch (error) {
            console.error('Failed to fetch question:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchNextQuestion();
    }, [fetchNextQuestion]);

    useEffect(() => {
        if (loading || submitted) return;
        const timer = setInterval(() => {
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);
        return () => clearInterval(timer);
    }, [loading, submitted, startTime]);

    const handlePlayAudio = () => {
        setIsPlaying(true);
        setPlayCount(prev => prev + 1);
        const duration = question?.audio_duration_sec || 30;
        setTimeout(() => {
            setIsPlaying(false);
        }, Math.min(duration * 1000, 5000));
    };

    const handleSubmit = async () => {
        if (!token || !question || !selectedAnswer) return;

        const responseTimeMs = Date.now() - startTime;
        setSubmitted(true);

        try {
            const res = await api.submitAnswer(token, question.id, selectedAnswer, responseTimeMs);

            setResult({
                isCorrect: res.is_correct,
                xpEarned: res.xp_earned,
                correctAnswer: res.correct_answer,
                explanation: res.explanation,
                levelUp: res.level_up,
                newLevel: res.new_level,
            });

            updateUser({
                xp: res.new_xp,
                level: res.new_level,
                current_streak: res.new_streak,
            });

            if (res.is_correct && res.xp_earned > 0) {
                setShowXP(true);
                setTimeout(() => setShowXP(false), 1500);
            }

            if (res.level_up) {
                setTimeout(() => setShowLevelUp(true), 500);
            }
        } catch (error) {
            console.error('Failed to submit:', error);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-medium animate-pulse">Tuning your focus...</p>
            </div>
        );
    }

    if (!question) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
                <div className="max-w-md w-full card p-10 space-y-6">
                    <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400">
                        <AlertCircle className="w-10 h-10" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">No Audio Found</h2>
                    <p className="text-slate-500 dark:text-slate-400">
                        Check back later or try Reading practice to level up.
                    </p>
                    <Link href="/dashboard" className="btn-primary block w-full">
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-24">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                            Listening Practice
                        </h1>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-600">
                            Play {playCount}/2
                        </span>
                    </div>
                    <div className="flex items-center gap-2 pl-12">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{question.question_type.replace('_', ' ')}</span>
                        <span className="w-1 h-1 bg-slate-300 rounded-full" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Skill ID: {question.skill_id}</span>
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

            {/* Audio Section Card */}
            <div className="card p-8 md:p-10 !rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none border-t-4 border-t-blue-600 mb-10">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <button
                        onClick={handlePlayAudio}
                        disabled={isPlaying || playCount >= 2}
                        className={`w-20 h-20 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 shadow-xl ${isPlaying
                                ? 'bg-blue-600 text-white animate-pulse'
                                : playCount >= 2
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-300 cursor-not-allowed'
                                    : 'bg-white dark:bg-slate-800 text-blue-600 hover:scale-110 border-2 border-blue-100 dark:border-blue-900/30'
                            }`}
                    >
                        {isPlaying ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current ml-1" />}
                    </button>

                    <div className="flex-1 w-full space-y-4">
                        <div className="flex items-center justify-between text-sm">
                            <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs flex items-center gap-2">
                                <Volume2 className="w-4 h-4 text-slate-400" />
                                {question.passage_title || 'IELTS Audio Recording'}
                            </h3>
                            <span className="font-mono text-slate-400 font-bold">
                                {formatTime(isPlaying ? 5 : 0)} / {formatTime(question.audio_duration_sec || 30)}
                            </span>
                        </div>

                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-blue-600"
                                initial={{ width: '0%' }}
                                animate={{ width: isPlaying ? '100%' : '0%' }}
                                transition={{ duration: question.audio_duration_sec || 30, ease: 'linear' }}
                            />
                        </div>

                        {playCount >= 2 && !submitted && (
                            <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg text-xs font-bold">
                                <AlertCircle className="w-3.5 h-3.5" />
                                Limited to 2 plays. Answer based on your notes.
                            </div>
                        )}
                    </div>
                </div>

                {/* Transcript Disclosure */}
                <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => setShowTranscript(!showTranscript)}
                        className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors"
                    >
                        <FileText className="w-3.5 h-3.5" />
                        {showTranscript ? 'Hide' : 'Show'} Transcript (Debug)
                    </button>
                    <AnimatePresence>
                        {showTranscript && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="overflow-hidden"
                            >
                                <p className="mt-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-line border border-slate-100 dark:border-slate-800">
                                    &quot;{question.passage}&quot;
                                </p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Question Interface */}
            <div className="max-w-2xl mx-auto space-y-8">
                <div className="space-y-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold uppercase tracking-widest">
                        <Info className="w-3.5 h-3.5" />
                        {question.question_type}
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">
                        {question.question_text}
                    </h2>
                </div>

                <div className="space-y-3">
                    {question.question_type === 'MCQ' ? (
                        <div className="grid grid-cols-1 gap-3">
                            {question.options?.map((option, idx) => {
                                const isSelected = selectedAnswer === option;
                                return (
                                    <button
                                        key={idx}
                                        onClick={() => !submitted && setSelectedAnswer(option)}
                                        disabled={submitted}
                                        className={`w-full group text-left p-5 rounded-2xl border-2 transition-all duration-200 flex items-start gap-4 ${isSelected
                                                ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-900/20'
                                                : 'border-white dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                            } ${submitted ? 'cursor-not-allowed opacity-80 shadow-none' : 'shadow-md shadow-slate-200/30'}`}
                                    >
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 font-bold transition-colors ${isSelected
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/40 group-hover:text-blue-600'
                                            }`}>
                                            {String.fromCharCode(65 + idx)}
                                        </div>
                                        <span className={`pt-0.5 font-bold ${isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-slate-600 dark:text-slate-400'}`}>
                                            {option}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="relative group">
                            <input
                                type="text"
                                value={selectedAnswer}
                                onChange={(e) => !submitted && setSelectedAnswer(e.target.value)}
                                disabled={submitted}
                                placeholder="Type your answer strictly as heard..."
                                className="w-full bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl px-6 py-5 text-slate-900 dark:text-white font-bold placeholder-slate-400 focus:outline-none focus:border-blue-600 transition-all shadow-md shadow-slate-200/30 dark:shadow-none"
                            />
                            <div className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300">
                                <PenTool className="w-5 h-5" />
                            </div>
                        </div>
                    )}
                </div>

                {!submitted ? (
                    <button
                        onClick={handleSubmit}
                        disabled={!selectedAnswer}
                        className={`w-full py-5 rounded-2xl font-black text-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg ${selectedAnswer
                                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 active:scale-[0.98]'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                            }`}
                    >
                        <CheckCircle2 className="w-5 h-5" />
                        Check Answer
                    </button>
                ) : (
                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <button
                            onClick={fetchNextQuestion}
                            className="w-full py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-xl shadow-slate-900/10 dark:shadow-none active:scale-[0.98]"
                        >
                            Continue
                            <ChevronRight className="w-5 h-5" />
                        </button>

                        {result?.explanation && (
                            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-3 flex items-center gap-2">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                    Examiner's Insight
                                </h4>
                                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed italic">
                                    &quot;{result.explanation}&quot;
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Global Overlays */}
            <XPGainAnimation amount={result?.xpEarned || 0} show={showXP} />
            <LevelUpAnimation
                level={result?.newLevel || 1}
                show={showLevelUp}
                onComplete={() => setShowLevelUp(false)}
            />
            <CorrectIncorrectFeedback
                isCorrect={result?.isCorrect || false}
                show={submitted && result !== null}
                explanation={result?.explanation || undefined}
                correctAnswer={result?.correctAnswer}
                onContinue={fetchNextQuestion}
            />
        </div>
    );
}

