'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
    Trophy,
    Target,
    Flame,
    Star,
    TrendingUp,
    Lock,
    Sparkles,
    CheckCircle2,
    AlertCircle,
    Filter,
    Zap,
    ChevronRight
} from 'lucide-react';

interface Achievement {
    id: number;
    code: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    xp_reward: number;
    rarity: string;
    is_unlocked: boolean;
    unlocked_at: string | null;
}

interface AchievementsData {
    total: number;
    unlocked: number;
    achievements: Achievement[];
    by_category: Record<string, Achievement[]>;
}

const rarityColors: Record<string, string> = {
    COMMON: 'bg-slate-500',
    UNCOMMON: 'bg-emerald-600',
    RARE: 'bg-blue-600',
    EPIC: 'bg-indigo-600',
    LEGENDARY: 'bg-orange-600',
};

const rarityBorders: Record<string, string> = {
    COMMON: 'border-slate-100 dark:border-slate-800',
    UNCOMMON: 'border-emerald-100 dark:border-emerald-900/30',
    RARE: 'border-blue-100 dark:border-blue-900/30',
    EPIC: 'border-indigo-100 dark:border-indigo-900/30',
    LEGENDARY: 'border-orange-100 dark:border-orange-900/30',
};

const categoryLabels: Record<string, { label: string; icon: any }> = {
    STREAK: { label: 'Streaks', icon: Flame },
    LEVEL: { label: 'Levels', icon: Star },
    ACCURACY: { label: 'Accuracy', icon: Target },
    PROGRESS: { label: 'Progress', icon: TrendingUp },
    BAND: { label: 'Target Band', icon: Trophy },
};

export default function Achievements() {
    const { token } = useAuth();
    const [data, setData] = useState<AchievementsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [newAchievements, setNewAchievements] = useState<any[]>([]);

    useEffect(() => {
        if (token) {
            loadAchievements();
            checkForNewAchievements();
        }
    }, [token]);

    const loadAchievements = async () => {
        try {
            setLoading(true);
            const result = await api.getAchievements(token!);
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load achievements');
        } finally {
            setLoading(false);
        }
    };

    const checkForNewAchievements = async () => {
        try {
            const result = await api.checkNewAchievements(token!);
            if (result.new_achievements.length > 0) {
                setNewAchievements(result.new_achievements);
                loadAchievements();
            }
        } catch (err) {
            console.error('Failed to check achievements:', err);
        }
    };

    const filteredAchievements = selectedCategory
        ? data?.achievements.filter(a => a.category === selectedCategory)
        : data?.achievements;

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-slate-500 font-medium tracking-tight">Loading your collection...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
                <div className="max-w-md space-y-4">
                    <div className="w-16 h-16 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full flex items-center justify-center mx-auto">
                        <AlertCircle className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">Connection Error</h2>
                    <p className="text-slate-500 dark:text-slate-400">{error}</p>
                    <button
                        onClick={loadAchievements}
                        className="btn-primary w-full"
                    >
                        Try Again
                    </button>
                </div>
            </div>
        );
    }

    const unlockPercentage = ((data?.unlocked || 0) / (data?.total || 1)) * 100;

    return (
        <div className="py-6 space-y-10">
            {/* New Achievement Popup */}
            <AnimatePresence>
                {newAchievements.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[100] p-6"
                        onClick={() => setNewAchievements([])}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-3xl text-center max-w-md w-full shadow-2xl"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce">
                                <Trophy className="w-12 h-12 text-yellow-600" />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Badge Earned!</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8">You&apos;ve unlocked new potential</p>

                            {newAchievements.map((ach, i) => (
                                <div key={i} className="mb-6 p-6 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                                    <div className="text-4xl mb-4">{ach.icon}</div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white mb-1">{ach.name}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{ach.description}</p>
                                    <div className="flex items-center justify-center gap-1.5 mt-4 text-blue-600 font-black">
                                        <Zap className="w-4 h-4 fill-current" />
                                        <span>+{ach.xp_reward} XP</span>
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={() => setNewAchievements([])}
                                className="w-full btn-primary py-4 text-lg"
                            >
                                Collect Rewards 🎊
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        Achievements
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Track your milestones and unlock rewards as you master IELTS.
                    </p>
                </div>

                <div className="w-full md:w-64 space-y-3">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest text-slate-400">
                        <span>Unlocked</span>
                        <span>{data?.unlocked} / {data?.total}</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                        <motion.div
                            className="bg-blue-600 h-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${unlockPercentage}%` }}
                            transition={{ duration: 1.2, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="p-2 mr-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-400">
                    <Filter className="w-4 h-4" />
                </div>
                <button
                    onClick={() => setSelectedCategory(null)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${selectedCategory === null
                            ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                            : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-200'
                        }`}
                >
                    All
                </button>
                {Object.entries(categoryLabels).map(([key, info]) => {
                    const Icon = info.icon;
                    const isActive = selectedCategory === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setSelectedCategory(key)}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${isActive
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-blue-200'
                                }`}
                        >
                            <Icon className="w-4 h-4" />
                            {info.label}
                        </button>
                    );
                })}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredAchievements?.map((achievement, index) => {
                    const CategoryIcon = categoryLabels[achievement.category]?.icon || Trophy;
                    const isUnlocked = achievement.is_unlocked;

                    return (
                        <motion.div
                            key={achievement.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={`group relative card p-7 flex flex-col h-full transition-all duration-300 ${isUnlocked
                                    ? `border-l-4 ${rarityBorders[achievement.rarity]} shadow-md shadow-slate-200/40 hover:shadow-xl`
                                    : 'opacity-60 grayscale bg-slate-50 dark:bg-slate-900/40'
                                }`}
                        >
                            {/* Rarity & XP Badge */}
                            <div className="flex items-center justify-between mb-6">
                                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-white ${rarityColors[achievement.rarity]}`}>
                                    {achievement.rarity}
                                </div>
                                <div className="flex items-center gap-1 text-blue-600 text-xs font-black uppercase tracking-widest">
                                    <Zap className="w-3.5 h-3.5 fill-current" />
                                    +{achievement.xp_reward} XP
                                </div>
                            </div>

                            {/* Icon & Title */}
                            <div className="flex items-start gap-5 mb-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0 transition-transform group-hover:scale-110 duration-300 ${isUnlocked ? 'bg-slate-100 dark:bg-slate-800 shadow-inner' : 'bg-slate-200 dark:bg-slate-700'
                                    }`}>
                                    {isUnlocked ? achievement.icon : <Lock className="w-6 h-6 text-slate-400" />}
                                </div>
                                <div className="space-y-1 pt-1">
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white leading-tight">
                                        {achievement.name}
                                    </h3>
                                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.15em] text-slate-400">
                                        <CategoryIcon className="w-3 h-3" />
                                        {achievement.category}
                                    </div>
                                </div>
                            </div>

                            {/* Description */}
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed mb-6 flex-grow">
                                {achievement.description}
                            </p>

                            {/* Status Footer */}
                            <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                {isUnlocked && achievement.unlocked_at ? (
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Earned {new Date(achievement.unlocked_at).toLocaleDateString()}
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                                        <Lock className="w-3.5 h-3.5" />
                                        Locked
                                    </div>
                                )}

                                <div className="group-hover:translate-x-1 transition-transform">
                                    <ChevronRight className={`w-4 h-4 ${isUnlocked ? 'text-blue-600' : 'text-slate-300'}`} />
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

