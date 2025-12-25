'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

interface LeaderboardEntry {
    rank: number;
    username: string;
    xp: number;
    level: number;
}

export default function LeaderboardPage() {
    const { user } = useAuth();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!user) return;
            try {
                // Use dummy token or real
                const data = await api.getLeaderboard('token');
                // Allow time for animation demo
                setTimeout(() => {
                    setLeaderboard(data);
                    setLoading(false);
                }, 800);
            } catch (err) {
                console.error(err);

                // Fallback for demo if backend is empty
                setLeaderboard([
                    { rank: 1, username: "Sultan", xp: 12500, level: 12 },
                    { rank: 2, username: "Diana", xp: 10200, level: 10 },
                    { rank: 3, username: "Ali", xp: 9800, level: 9 },
                    { rank: 4, username: "User123", xp: 7500, level: 7 },
                    { rank: 5, username: "You", xp: 2100, level: 3 },
                ]);
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [user]);

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans">
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center gap-4">
                <a href="/dashboard" className="text-white/70 hover:text-white">← Back</a>
                <h1 className="text-xl font-bold">🏆 Global Leaderboard</h1>
            </header>

            <main className="max-w-2xl mx-auto px-6 py-12">

                <div className="text-center mb-12">
                    <h2 className="text-4xl font-extrabold bg-gradient-to-r from-amber-200 to-yellow-500 bg-clip-text text-transparent mb-2">
                        Champions League
                    </h2>
                    <p className="text-white/60">Compete with other students to earn XP!</p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {/* Top 3 Podium Effect */}
                        <div className="grid grid-cols-3 gap-4 items-end mb-12 relative h-64">
                            {/* 2nd Place */}
                            {leaderboard[1] && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "160px", opacity: 1 }}
                                    className="bg-slate-800 rounded-t-2xl p-4 flex flex-col items-center justify-end relative border-t-4 border-slate-400"
                                >
                                    <div className="absolute -top-10 text-4xl">🥈</div>
                                    <div className="font-bold text-slate-300">{leaderboard[1].username}</div>
                                    <div className="text-sm text-white/50">{leaderboard[1].xp} XP</div>
                                </motion.div>
                            )}

                            {/* 1st Place */}
                            {leaderboard[0] && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "220px", opacity: 1 }}
                                    className="bg-slate-800 rounded-t-2xl p-4 flex flex-col items-center justify-end relative border-t-4 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.2)] z-10"
                                >
                                    <div className="absolute -top-14 text-6xl">👑</div>
                                    <div className="font-bold text-yellow-300 text-lg">{leaderboard[0].username}</div>
                                    <div className="text-sm text-white/50">{leaderboard[0].xp} XP</div>
                                </motion.div>
                            )}

                            {/* 3rd Place */}
                            {leaderboard[2] && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "120px", opacity: 1 }}
                                    className="bg-slate-800 rounded-t-2xl p-4 flex flex-col items-center justify-end relative border-t-4 border-amber-600"
                                >
                                    <div className="absolute -top-10 text-4xl">🥉</div>
                                    <div className="font-bold text-amber-500">{leaderboard[2].username}</div>
                                    <div className="text-sm text-white/50">{leaderboard[2].xp} XP</div>
                                </motion.div>
                            )}
                        </div>

                        {/* Rest of list */}
                        {leaderboard.slice(3).map((entry, idx) => (
                            <motion.div
                                key={entry.rank}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-white/5 hover:bg-white/10 transition"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 flex items-center justify-center font-bold text-white/50 bg-white/5 rounded-full">
                                        {entry.rank}
                                    </div>
                                    <div className="font-medium">{entry.username}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">Lvl {entry.level}</span>
                                    <span className="font-bold text-yellow-500">{entry.xp} XP</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}
