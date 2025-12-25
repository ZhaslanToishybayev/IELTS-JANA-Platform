'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
    Trophy,
    Target,
    Crown,
    Medal,
    Zap,
    TrendingUp,
    BarChart3,
    ArrowLeft,
    ChevronRight,
    Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface LeaderboardEntry {
    rank: number;
    username: string;
    xp: number;
    level: number;
}

export default function LeaderboardPage() {
    const { user, token } = useAuth();
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!user) return;
            try {
                const data = await api.getLeaderboard(token || 'token');
                setLeaderboard(data);
            } catch (err) {
                console.error(err);
                // Fallback for demo
                setLeaderboard([
                    { rank: 1, username: "Sultan", xp: 12500, level: 12 },
                    { rank: 2, username: "Diana", xp: 10200, level: 10 },
                    { rank: 3, username: "Ali", xp: 9800, level: 9 },
                    { rank: 4, username: "User123", xp: 7500, level: 7 },
                    { rank: 5, username: "You", xp: 2100, level: 3 },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [user, token]);

    if (!user) return null;

    return (
        <div className="pb-24 max-w-5xl mx-auto px-4 md:px-0">
            {/* Header Area */}
            <div className="space-y-2 py-6 mb-10">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <Trophy className="w-10 h-10 text-amber-500" />
                    Global Leaderboard
                </h1>
                <p className="text-slate-500 font-medium tracking-tight">Compete with the community and climb to the top of the Champions League.</p>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Updating rankings...</span>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Podium Area */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end relative py-10 px-4">
                        {/* 2nd Place */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="order-2 md:order-1"
                        >
                            <div className="card p-8 !rounded-[2.5rem] bg-white dark:bg-slate-900 border-b-8 border-b-slate-400 text-center relative shadow-xl shadow-slate-200/40">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                                    <div className="w-20 h-20 bg-slate-400/20 rounded-full flex items-center justify-center border-4 border-slate-400">
                                        <Medal className="w-10 h-10 text-slate-500" />
                                    </div>
                                    <span className="absolute -bottom-2 right-0 w-8 h-8 bg-slate-400 text-white rounded-full flex items-center justify-center font-black text-sm">2</span>
                                </div>
                                <div className="mt-8 space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{leaderboard[1]?.username || '-'}</h3>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Intermediate Master</p>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                                    <div className="text-left">
                                        <div className="text-[10px] font-black text-slate-400 uppercase">XP</div>
                                        <div className="text-lg font-black text-slate-800 dark:text-white">{leaderboard[1]?.xp || 0}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-400 uppercase">Level</div>
                                        <div className="text-lg font-black text-slate-800 dark:text-white">{leaderboard[1]?.level || 0}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* 1st Place */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 40 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            className="order-1 md:order-2"
                        >
                            <div className="card p-10 !rounded-[3rem] bg-slate-900 text-white border-b-8 border-b-amber-500 text-center relative shadow-2xl shadow-blue-900/10 dark:shadow-none overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                                    <Crown className="w-32 h-32" />
                                </div>
                                <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-10">
                                    <div className="w-28 h-28 bg-amber-500 rounded-full flex items-center justify-center border-4 border-white shadow-xl">
                                        <Crown className="w-14 h-14 text-white" />
                                    </div>
                                    <span className="absolute -bottom-2 right-0 w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center font-black text-lg">1</span>
                                </div>
                                <div className="mt-14 space-y-1 relative z-10">
                                    <h3 className="text-3xl font-black text-white tracking-tight">{leaderboard[0]?.username || 'King'}</h3>
                                    <div className="flex items-center justify-center gap-2">
                                        <Sparkles className="w-3 h-3 text-amber-500" />
                                        <p className="text-amber-500 font-black uppercase tracking-[0.2em] text-[10px]">Champion Scholar</p>
                                        <Sparkles className="w-3 h-3 text-amber-500" />
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t border-white/10 flex justify-between relative z-10">
                                    <div className="text-left">
                                        <div className="text-[10px] font-black text-slate-400 uppercase">Total XP</div>
                                        <div className="text-2xl font-black text-white">{leaderboard[0]?.xp || 0}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-400 uppercase">Expert Lvl</div>
                                        <div className="text-2xl font-black text-white">{leaderboard[0]?.level || 0}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* 3rd Place */}
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="order-3"
                        >
                            <div className="card p-8 !rounded-[2.5rem] bg-white dark:bg-slate-900 border-b-8 border-b-amber-700 text-center relative shadow-xl shadow-slate-200/40">
                                <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                                    <div className="w-20 h-20 bg-amber-700/20 rounded-full flex items-center justify-center border-4 border-amber-700">
                                        <Medal className="w-10 h-10 text-amber-700" />
                                    </div>
                                    <span className="absolute -bottom-2 right-0 w-8 h-8 bg-amber-700 text-white rounded-full flex items-center justify-center font-black text-sm">3</span>
                                </div>
                                <div className="mt-8 space-y-1">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white">{leaderboard[2]?.username || '-'}</h3>
                                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Emerging Talent</p>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                                    <div className="text-left">
                                        <div className="text-[10px] font-black text-slate-400 uppercase">XP</div>
                                        <div className="text-lg font-black text-slate-800 dark:text-white">{leaderboard[2]?.xp || 0}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] font-black text-slate-400 uppercase">Level</div>
                                        <div className="text-lg font-black text-slate-800 dark:text-white">{leaderboard[2]?.level || 0}</div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    {/* Rankings List */}
                    <div className="card !rounded-[3rem] overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none bg-white dark:bg-slate-900">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                Top Rankings
                            </h4>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Pool</span>
                        </div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {leaderboard.map((entry, idx) => (
                                <motion.div
                                    key={entry.rank}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`px-8 py-5 flex items-center justify-between transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${entry.username === 'You' ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                >
                                    <div className="flex items-center gap-6">
                                        <span className={`w-8 text-center font-black text-lg ${idx < 3 ? 'text-blue-600' : 'text-slate-300'}`}>
                                            {entry.rank}
                                        </span>
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black">
                                                {entry.username.charAt(0)}
                                            </div>
                                            <div>
                                                <h5 className="font-black text-slate-900 dark:text-white text-sm">
                                                    {entry.username}
                                                    {entry.username === 'You' && <span className="ml-2 text-[8px] px-1.5 py-0.5 bg-blue-600 text-white rounded-full uppercase tracking-tighter">You</span>}
                                                </h5>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <Target className="w-3 h-3 text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Lv {entry.level}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <div className="flex items-center gap-1.5 justify-end">
                                                <Zap className="w-3.5 h-3.5 text-blue-600" />
                                                <span className="font-black text-slate-900 dark:text-white">{entry.xp.toLocaleString()}</span>
                                            </div>
                                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Experience Points</div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-200" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-center p-10 bg-blue-50 dark:bg-blue-900/10 rounded-[2.5rem] border border-blue-100 dark:border-blue-900/30 text-center space-y-3">
                        <div className="space-y-2">
                            <TrendingUp className="w-10 h-10 text-blue-600 mx-auto" />
                            <h4 className="text-xl font-black text-slate-900 dark:text-white">Keep Pushing Higher</h4>
                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto tracking-tight">Every lesson you complete takes you one step closer to the top tier. Good luck on your journey!</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

