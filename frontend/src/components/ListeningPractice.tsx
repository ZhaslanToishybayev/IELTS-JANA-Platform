'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
    XPGainAnimation,
    LevelUpAnimation,
    CorrectIncorrectFeedback,
} from './Gamification';

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
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const fetchNextQuestion = useCallback(async () => {
        if (!token) return;
        setLoading(true);

        try {
            // For now, fetch from questions endpoint with listening filter
            const response = await fetch(`http://localhost:8000/api/questions/next?module=LISTENING`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setQuestion(data.question);
            } else {
                // Fallback to any question if no listening questions
                const data = await api.getNextQuestion(token);
                setQuestion(data.question as ListeningQuestion);
            }

            setSelectedAnswer('');
            setSubmitted(false);
            setResult(null);
            setStartTime(Date.now());
            setPlayCount(0);
            setShowTranscript(false);
        } catch (error) {
            console.error('Failed to fetch question:', error);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchNextQuestion();
    }, [fetchNextQuestion]);

    const handlePlayAudio = () => {
        // Since we don't have real audio files, we'll simulate playback
        setIsPlaying(true);
        setPlayCount(prev => prev + 1);

        // Simulate audio duration
        const duration = question?.audio_duration_sec || 30;
        setTimeout(() => {
            setIsPlaying(false);
        }, Math.min(duration * 1000, 5000)); // Max 5 seconds for demo
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (!question) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center text-white text-center p-4">
                <div>
                    <h2 className="text-2xl font-bold mb-4">🎧 No Listening questions available</h2>
                    <p className="text-white/70 mb-6">Complete more Reading exercises first, or check back later.</p>
                    <a href="/dashboard" className="bg-cyan-600 px-6 py-3 rounded-xl hover:bg-cyan-700 transition">
                        Go to Dashboard
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-cyan-900 to-teal-900 pb-32">
            {/* Header */}
            <div className="bg-black/20 backdrop-blur-sm p-4 sticky top-0 z-40">
                <div className="max-w-4xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <a href="/dashboard" className="text-white/70 hover:text-white">
                            ← Back
                        </a>
                        <span className="text-cyan-400 font-medium">🎧 Listening Practice</span>
                    </div>
                    <div className="bg-cyan-500/20 text-cyan-300 px-3 py-1 rounded-full text-sm">
                        Plays: {playCount}/2
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-4 mt-4">
                {/* Audio Player Section */}
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6">
                    <h3 className="text-white font-bold text-lg mb-4">
                        🎧 {question.passage_title || 'Audio Clip'}
                    </h3>

                    {/* Simulated Audio Player */}
                    <div className="bg-black/30 rounded-xl p-4 mb-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={handlePlayAudio}
                                disabled={isPlaying || playCount >= 2}
                                className={`w-14 h-14 rounded-full flex items-center justify-center transition ${isPlaying
                                    ? 'bg-cyan-500 animate-pulse'
                                    : playCount >= 2
                                        ? 'bg-gray-600 cursor-not-allowed'
                                        : 'bg-cyan-600 hover:bg-cyan-500'
                                    }`}
                            >
                                {isPlaying ? (
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <rect x="6" y="4" width="4" height="16" fill="currentColor" />
                                        <rect x="14" y="4" width="4" height="16" fill="currentColor" />
                                    </svg>
                                ) : (
                                    <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M8 5v14l11-7z" />
                                    </svg>
                                )}
                            </button>

                            <div className="flex-1">
                                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                                    <motion.div
                                        className="h-full bg-cyan-400"
                                        initial={{ width: '0%' }}
                                        animate={{ width: isPlaying ? '100%' : '0%' }}
                                        transition={{ duration: question.audio_duration_sec || 30, ease: 'linear' }}
                                    />
                                </div>
                                <div className="flex justify-between text-white/50 text-sm mt-1">
                                    <span>0:00</span>
                                    <span>{Math.floor((question.audio_duration_sec || 30) / 60)}:{String((question.audio_duration_sec || 30) % 60).padStart(2, '0')}</span>
                                </div>
                            </div>
                        </div>

                        {playCount >= 2 && (
                            <p className="text-amber-400 text-sm mt-2">
                                ⚠️ You&apos;ve used both plays. Answer based on what you heard.
                            </p>
                        )}
                    </div>

                    {/* Transcript Toggle (for demo/accessibility) */}
                    <button
                        onClick={() => setShowTranscript(!showTranscript)}
                        className="text-cyan-400 text-sm hover:underline"
                    >
                        {showTranscript ? 'Hide' : 'Show'} Transcript (Demo Mode)
                    </button>

                    {showTranscript && (
                        <div className="mt-4 p-4 bg-black/20 rounded-lg text-white/80 text-sm whitespace-pre-line max-h-48 overflow-y-auto">
                            {question.passage}
                        </div>
                    )}
                </div>

                {/* Question */}
                <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 mb-6">
                    <h4 className="text-white font-semibold text-lg mb-4">
                        {question.question_text}
                    </h4>

                    {/* Answer Options or Text Input */}
                    {question.question_type === 'MCQ' ? (
                        <div className="space-y-3">
                            {question.options?.map((option, idx) => (
                                <motion.button
                                    key={idx}
                                    onClick={() => !submitted && setSelectedAnswer(option)}
                                    disabled={submitted}
                                    whileHover={!submitted ? { scale: 1.02 } : {}}
                                    whileTap={!submitted ? { scale: 0.98 } : {}}
                                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${selectedAnswer === option
                                        ? 'border-cyan-400 bg-cyan-500/30 text-white'
                                        : 'border-white/20 bg-white/5 text-white/80 hover:bg-white/10'
                                        } ${submitted ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                >
                                    <span className="font-medium">{String.fromCharCode(65 + idx)}.</span> {option}
                                </motion.button>
                            ))}
                        </div>
                    ) : (
                        <input
                            type="text"
                            value={selectedAnswer}
                            onChange={(e) => !submitted && setSelectedAnswer(e.target.value)}
                            disabled={submitted}
                            placeholder="Type your answer..."
                            className="w-full bg-white/10 hover:bg-white/15 focus:bg-white/20 border-2 border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:outline-none focus:border-cyan-400 transition"
                        />
                    )}
                </div>

                {/* Submit button */}
                {!submitted && (
                    <motion.button
                        onClick={handleSubmit}
                        disabled={!selectedAnswer}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${selectedAnswer
                            ? 'bg-gradient-to-r from-cyan-500 to-teal-500 text-white hover:from-cyan-400 hover:to-teal-400'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        Check Answer
                    </motion.button>
                )}
            </div>

            {/* Animations */}
            <XPGainAnimation amount={result?.xpEarned || 0} show={showXP} />
            <LevelUpAnimation
                level={result?.newLevel || 1}
                show={showLevelUp}
                onComplete={() => setShowLevelUp(false)}
            />

            {/* Feedback */}
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
