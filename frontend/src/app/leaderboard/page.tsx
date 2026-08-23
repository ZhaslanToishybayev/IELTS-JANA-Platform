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
    ChevronRight,
    ChevronLeft,
    Sparkles
} from 'lucide-react';

interface LeaderboardEntry {
    rank: number;
    username: string;
    xp: number;
    level: number;
}

const PAGE_SIZE = 20;

export default function LeaderboardPage() {
    const { user, token, loading: authLoading } = useAuth();
    const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            if (!token) return;
            setLoading(true);
            try {
                const data = await api.getLeaderboard(token, PAGE_SIZE, page * PAGE_SIZE);
                setEntries(data.entries || []);
                setTotal(data.total || 0);
            } catch {
                setEntries([]);
                setTotal(0);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, [token, page]);

    if (authLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) return null;

    const totalPages = Math.ceil(total / PAGE_SIZE);
    const top3 = entries.slice(0, 3);
    const rest = entries.slice(3);

    return (
        <div className="pb-24 max-w-5xl mx-auto px-4 md:px-0">
            <div className="space-y-2 py-6 mb-10">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <Trophy className="w-10 h-10 text-amber-500" />
                    Global Leaderboard
                </h1>
                <p className="text-slate-500 font-medium tracking-tight">Compete with the community and climb to the top.</p>
            </div>

            {loading && entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin" />
                    <span className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Updating rankings...</span>
                </div>
            ) : entries.length === 0 ? (
                <div className="card p-16 text-center !rounded-[3rem]">
                    <Trophy className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-6" />
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">No Rankings Yet</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Be the first to start practicing and claim the top spot!</p>
                </div>
            ) : (
                <div className="space-y-12">
                    {/* Podium */}
                    {page === 0 && top3.length >= 1 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end relative py-10 px-4">
                            {/* 2nd */}
                            {top3[1] && (
                                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="order-2 md:order-1">
                                    <div className="card p-8 !rounded-[2.5rem] border-b-8 border-b-slate-400 text-center relative">
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                                            <div className="w-20 h-20 bg-slate-400/20 rounded-full flex items-center justify-center border-4 border-slate-400">
                                                <Medal className="w-10 h-10 text-slate-500" />
                                            </div>
                                            <span className="absolute -bottom-2 right-0 w-8 h-8 bg-slate-400 text-white rounded-full flex items-center justify-center font-black text-sm">2</span>
                                        </div>
                                        <div className="mt-8 space-y-1">
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white">{top3[1].username}</h3>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                                            <div className="text-left">
                                                <div className="text-[10px] font-black text-slate-400 uppercase">XP</div>
                                                <div className="text-lg font-black text-slate-800 dark:text-white">{top3[1].xp.toLocaleString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-slate-400 uppercase">Level</div>
                                                <div className="text-lg font-black text-slate-800 dark:text-white">{top3[1].level}</div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* 1st */}
                            {top3[0] && (
                                <motion.div initial={{ opacity: 0, scale: 0.9, y: 40 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="order-1 md:order-2">
                                    <div className="card p-10 !rounded-[3rem] bg-slate-900 text-white border-b-8 border-b-amber-500 text-center relative shadow-2xl overflow-hidden group">
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
                                            <h3 className="text-3xl font-black text-white tracking-tight">{top3[0].username}</h3>
                                            <div className="flex items-center justify-center gap-2">
                                                <Sparkles className="w-3 h-3 text-amber-500" />
                                                <p className="text-amber-500 font-black uppercase tracking-[0.2em] text-[10px]">Champion</p>
                                                <Sparkles className="w-3 h-3 text-amber-500" />
                                            </div>
                                        </div>
                                        <div className="mt-8 pt-8 border-t border-white/10 flex justify-between relative z-10">
                                            <div className="text-left">
                                                <div className="text-[10px] font-black text-slate-400 uppercase">Total XP</div>
                                                <div className="text-2xl font-black text-white">{top3[0].xp.toLocaleString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-slate-400 uppercase">Level</div>
                                                <div className="text-2xl font-black text-white">{top3[0].level}</div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* 3rd */}
                            {top3[2] && (
                                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="order-3">
                                    <div className="card p-8 !rounded-[2.5rem] border-b-8 border-b-amber-700 text-center relative">
                                        <div className="absolute -top-12 left-1/2 -translate-x-1/2">
                                            <div className="w-20 h-20 bg-amber-700/20 rounded-full flex items-center justify-center border-4 border-amber-700">
                                                <Medal className="w-10 h-10 text-amber-700" />
                                            </div>
                                            <span className="absolute -bottom-2 right-0 w-8 h-8 bg-amber-700 text-white rounded-full flex items-center justify-center font-black text-sm">3</span>
                                        </div>
                                        <div className="mt-8 space-y-1">
                                            <h3 className="text-xl font-black text-slate-900 dark:text-white">{top3[2].username}</h3>
                                        </div>
                                        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between">
                                            <div className="text-left">
                                                <div className="text-[10px] font-black text-slate-400 uppercase">XP</div>
                                                <div className="text-lg font-black text-slate-800 dark:text-white">{top3[2].xp.toLocaleString()}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[10px] font-black text-slate-400 uppercase">Level</div>
                                                <div className="text-lg font-black text-slate-800 dark:text-white">{top3[2].level}</div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </div>
                    )}

                    {/* Rankings List */}
                    <div className="card !rounded-[2rem] overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-blue-600" />
                                Rankings {page > 0 && `(Page ${page + 1})`}
                            </h4>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{total} total</span>
                        </div>
                        <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                            {(page === 0 ? rest : entries).map((entry, idx) => (
                                <motion.div
                                    key={entry.rank}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: idx * 0.03 }}
                                    className={`px-6 py-4 flex items-center justify-between transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 ${entry.username === user?.username ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className={`w-8 text-center font-black text-lg ${entry.rank <= 3 ? 'text-blue-600' : 'text-slate-300 dark:text-slate-600'}`}>
                                            {entry.rank}
                                        </span>
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 font-black text-sm">
                                                {entry.username.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h5 className="font-black text-slate-900 dark:text-white text-sm">
                                                    {entry.username}
                                                    {entry.username === user?.username && <span className="ml-2 text-[8px] px-1.5 py-0.5 bg-blue-600 text-white rounded-full uppercase">You</span>}
                                                </h5>
                                                <div className="flex items-center gap-1.5 mt-0.5">
                                                    <Target className="w-3 h-3 text-slate-400" />
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Lv {entry.level}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5">
                                            <Zap className="w-3.5 h-3.5 text-blue-600" />
                                            <span className="font-black text-slate-900 dark:text-white text-sm">{entry.xp.toLocaleString()}</span>
                                        </div>
                                        <ChevronRight className="w-4 h-4 text-slate-200 dark:text-slate-700" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-4">
                                <button
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <span className="text-sm font-bold text-slate-500">
                                    Page {page + 1} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                                    disabled={page >= totalPages - 1}
                                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 disabled:opacity-30 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center justify-center p-8 bg-blue-50 dark:bg-blue-900/10 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 text-center">
                        <div className="space-y-2">
                            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto" />
                            <h4 className="text-lg font-black text-slate-900 dark:text-white">Keep Pushing Higher</h4>
                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-sm mx-auto text-sm">Every lesson brings you one step closer to the top.</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
