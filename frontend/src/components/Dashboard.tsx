'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
    ProgressRing,
    MasteryBar,
    StreakDisplay,
    BandScoreDisplay,
} from './Gamification';

interface DashboardData {
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
}

export function Dashboard() {
    const { token, user, logout } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        api.getDashboard(token)
            .then(setData)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    if (loading || !data) {
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

    const xpProgress = ((data.xp % 100) / (data.xp_to_next_level || 100)) * 100;
    const totalXpForLevel = data.xp_to_next_level;
    const currentLevelXp = data.xp % totalXpForLevel;

    const skillsByCategory = data.skills.reduce((acc, skill) => {
        if (!acc[skill.category]) acc[skill.category] = [];
        acc[skill.category].push(skill);
        return acc;
    }, {} as Record<string, typeof data.skills>);

    const categoryLabels: Record<string, string> = {
        'TF_NG': 'True/False/Not Given',
        'HEADINGS': 'Matching Headings',
        'SUMMARY': 'Summary Completion',
        'MATCHING_INFO': 'Matching Information',
        'SENTENCE_COMP': 'Sentence Completion',
        'LISTENING_MCQ': 'Listening - Multiple Choice',
        'LISTENING_FORM': 'Listening - Form Completion',
        'LISTENING_MAP': 'Listening - Map Labeling',
        'LISTENING_NOTES': 'Listening - Note Taking',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                            JANA
                        </h1>
                        <span className="text-white/50">|</span>
                        <span className="text-white/70">Welcome, {data.username}!</span>
                    </div>
                    <div className="flex items-center gap-4">
                        {data.current_streak > 0 && <StreakDisplay streak={data.current_streak} />}
                        <button
                            onClick={logout}
                            className="text-white/60 hover:text-white transition text-sm"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Stats row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    {/* Level & XP */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 flex items-center gap-6"
                    >
                        <ProgressRing progress={xpProgress} size={100}>
                            <div className="text-center">
                                <div className="text-2xl font-bold">{data.level}</div>
                                <div className="text-xs text-white/60">Level</div>
                            </div>
                        </ProgressRing>
                        <div>
                            <div className="text-3xl font-bold">{data.xp} XP</div>
                            <div className="text-white/60 text-sm">
                                {data.xp_to_next_level} XP to Level {data.level + 1}
                            </div>
                            <div className="h-2 bg-white/20 rounded-full mt-2 w-32 overflow-hidden">
                                <motion.div
                                    className="h-full bg-gradient-to-r from-cyan-400 to-purple-500"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${xpProgress}%` }}
                                />
                            </div>
                        </div>
                    </motion.div>

                    {/* Band Score */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                    >
                        <BandScoreDisplay band={data.estimated_band} />
                    </motion.div>

                    {/* Stats */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
                    >
                        <h3 className="text-lg font-semibold mb-4">Your Stats</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-2xl font-bold">{data.total_attempts}</div>
                                <div className="text-white/60 text-sm">Questions</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{(data.overall_accuracy * 100).toFixed(0)}%</div>
                                <div className="text-white/60 text-sm">Accuracy</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{(data.avg_response_time_ms / 1000).toFixed(1)}s</div>
                                <div className="text-white/60 text-sm">Avg. Time</div>
                            </div>
                            <div>
                                <div className="text-2xl font-bold">{data.current_streak}</div>
                                <div className="text-white/60 text-sm">Day Streak</div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Practice CTAs */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mb-6 space-y-4"
                >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <a href="/practice" className="block bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white text-center py-5 rounded-2xl font-bold text-lg transition-all transform hover:scale-[1.02]">
                            📖 Reading
                        </a>
                        <a href="/listening" className="block bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white text-center py-5 rounded-2xl font-bold text-lg transition-all transform hover:scale-[1.02]">
                            🎧 Listening
                        </a>
                        <a href="/writing" className="block bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-center py-5 rounded-2xl font-bold text-lg transition-all transform hover:scale-[1.02]">
                            ✍️ Writing
                        </a>
                        <a href="/speaking" className="block bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-400 hover:to-pink-400 text-white text-center py-5 rounded-2xl font-bold text-lg transition-all transform hover:scale-[1.02]">
                            🎤 Speaking
                        </a>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <a href="/generate" className="flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 py-4 rounded-xl font-bold shadow-lg transition transform hover:scale-[1.02]">
                            <span>🪄</span> Infinite Generator
                        </a>
                        <a href="/mock" className="flex items-center justify-center gap-2 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 py-4 rounded-xl font-bold shadow-lg transition transform hover:scale-[1.02]">
                            <span>⏱️</span> Mock Exam
                        </a>
                        <a href="/leaderboard" className="flex items-center justify-center gap-2 bg-gradient-to-r from-yellow-600 to-amber-600 hover:from-yellow-500 hover:to-amber-500 py-4 rounded-xl font-bold shadow-lg transition transform hover:scale-[1.02]">
                            <span>🏆</span> Leaderboard
                        </a>
                    </div>
                </motion.div>

                {/* Quick Links */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="mb-8 flex flex-wrap gap-3"
                >
                    <a
                        href="/progress"
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition"
                    >
                        📊 View Progress Charts
                    </a>
                    <a
                        href="/skills"
                        className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition"
                    >
                        🌳 Skill Tree
                    </a>
                </motion.div>

                {/* Skills breakdown */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                >
                    <h2 className="text-xl font-bold mb-4">Skill Mastery</h2>

                    <div className="space-y-6">
                        {Object.entries(skillsByCategory).map(([category, skills]) => (
                            <div key={category}>
                                <h3 className="text-white/80 font-medium mb-3">
                                    {categoryLabels[category] || category}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {skills.map((skill) => (
                                        <MasteryBar
                                            key={skill.skill_id}
                                            skillName={skill.skill_name}
                                            mastery={skill.mastery_probability}
                                            category={skill.category}
                                            isUnlocked={skill.is_unlocked}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                {/* Quick tips */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mt-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl p-6"
                >
                    <h3 className="font-bold text-lg mb-2">💡 Pro Tip</h3>
                    <p className="text-white/80">
                        {data.skills.length > 0
                            ? `Focus on improving your ${data.skills.reduce((a, b) =>
                                a.mastery_probability < b.mastery_probability ? a : b
                            ).skill_name
                            } skill - it&apos;s your current weak point!`
                            : 'Complete more practice questions to see personalized recommendations.'}
                    </p>
                </motion.div>
            </main>
        </div>
    );
}
