'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SessionStats {
    totalQuestions: number;
    correctAnswers: number;
    xpEarned: number;
    timeSpent: number; // seconds
    skillsImproved: string[];
    streakBonus: boolean;
    newLevel?: number;
}

interface SessionSummaryProps {
    stats: SessionStats;
    onContinue: () => void;
    onFinish: () => void;
}

export function SessionSummary({ stats, onContinue, onFinish }: SessionSummaryProps) {
    const [showDetails, setShowDetails] = useState(false);
    const accuracy = stats.totalQuestions > 0
        ? Math.round((stats.correctAnswers / stats.totalQuestions) * 100)
        : 0;

    useEffect(() => {
        const timer = setTimeout(() => setShowDetails(true), 500);
        return () => clearTimeout(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getAccuracyEmoji = () => {
        if (accuracy >= 90) return '🌟';
        if (accuracy >= 70) return '🎯';
        if (accuracy >= 50) return '👍';
        return '💪';
    };

    const getAccuracyMessage = () => {
        if (accuracy >= 90) return 'Outstanding!';
        if (accuracy >= 70) return 'Great job!';
        if (accuracy >= 50) return 'Good effort!';
        return 'Keep practicing!';
    };

    return (
        <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full"
            >
                {/* Header */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-center mb-6"
                >
                    <div className="text-6xl mb-4">{getAccuracyEmoji()}</div>
                    <h2 className="text-3xl font-bold text-white mb-2">Session Complete!</h2>
                    <p className="text-white/70 text-lg">{getAccuracyMessage()}</p>
                </motion.div>

                {/* Stats Grid */}
                {showDetails && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="grid grid-cols-2 gap-4 mb-6"
                    >
                        <div className="bg-white/10 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-cyan-400">{stats.correctAnswers}/{stats.totalQuestions}</div>
                            <div className="text-white/60 text-sm">Correct</div>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-green-400">{accuracy}%</div>
                            <div className="text-white/60 text-sm">Accuracy</div>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-yellow-400">+{stats.xpEarned}</div>
                            <div className="text-white/60 text-sm">XP Earned</div>
                        </div>
                        <div className="bg-white/10 rounded-xl p-4 text-center">
                            <div className="text-3xl font-bold text-purple-400">{formatTime(stats.timeSpent)}</div>
                            <div className="text-white/60 text-sm">Time</div>
                        </div>
                    </motion.div>
                )}

                {/* Skills Improved */}
                {showDetails && stats.skillsImproved.length > 0 && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="mb-6"
                    >
                        <h3 className="text-white/80 text-sm font-medium mb-2">Skills Practiced:</h3>
                        <div className="flex flex-wrap gap-2">
                            {stats.skillsImproved.map((skill, idx) => (
                                <span
                                    key={idx}
                                    className="bg-purple-500/30 text-purple-200 px-3 py-1 rounded-full text-sm"
                                >
                                    {skill}
                                </span>
                            ))}
                        </div>
                    </motion.div>
                )}

                {/* Bonuses */}
                {showDetails && (stats.streakBonus || stats.newLevel) && (
                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="mb-6 space-y-2"
                    >
                        {stats.streakBonus && (
                            <div className="bg-orange-500/20 border border-orange-500/50 rounded-xl p-3 flex items-center gap-3">
                                <span className="text-2xl">🔥</span>
                                <span className="text-orange-200">Streak bonus applied!</span>
                            </div>
                        )}
                        {stats.newLevel && (
                            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-xl p-3 flex items-center gap-3">
                                <span className="text-2xl">🎉</span>
                                <span className="text-yellow-200">Level up! You reached Level {stats.newLevel}</span>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Actions */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="space-y-3"
                >
                    <button
                        onClick={onContinue}
                        className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-500 text-white rounded-xl font-bold text-lg hover:from-cyan-400 hover:to-purple-400 transition"
                    >
                        Continue Practice
                    </button>
                    <button
                        onClick={onFinish}
                        className="w-full py-3 bg-white/10 text-white/80 rounded-xl font-medium hover:bg-white/20 transition"
                    >
                        Return to Dashboard
                    </button>
                </motion.div>
            </motion.div>
        </div>
    );
}

// Export a hook to manage session tracking
export function useSessionTracker() {
    const [sessionStats, setSessionStats] = useState<SessionStats>({
        totalQuestions: 0,
        correctAnswers: 0,
        xpEarned: 0,
        timeSpent: 0,
        skillsImproved: [],
        streakBonus: false,
    });
    const [startTime] = useState(Date.now());
    const [showSummary, setShowSummary] = useState(false);

    const recordAttempt = (isCorrect: boolean, xp: number, skillName: string) => {
        setSessionStats(prev => ({
            ...prev,
            totalQuestions: prev.totalQuestions + 1,
            correctAnswers: prev.correctAnswers + (isCorrect ? 1 : 0),
            xpEarned: prev.xpEarned + xp,
            skillsImproved: prev.skillsImproved.includes(skillName)
                ? prev.skillsImproved
                : [...prev.skillsImproved, skillName],
        }));
    };

    const endSession = () => {
        setSessionStats(prev => ({
            ...prev,
            timeSpent: Math.floor((Date.now() - startTime) / 1000),
        }));
        setShowSummary(true);
    };

    const resetSession = () => {
        setSessionStats({
            totalQuestions: 0,
            correctAnswers: 0,
            xpEarned: 0,
            timeSpent: 0,
            skillsImproved: [],
            streakBonus: false,
        });
        setShowSummary(false);
    };

    return {
        sessionStats,
        showSummary,
        recordAttempt,
        endSession,
        resetSession,
        setShowSummary,
    };
}
