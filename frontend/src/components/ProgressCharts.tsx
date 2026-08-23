'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface ProgressData {
    date: string;
    band: number;
    accuracy: number;
    attempts: number;
    xp: number;
}

interface SkillData {
    skill: string;
    mastery: number;
    attempts: number;
    category: string;
}

const LIGHT_TOOLTIP = {
    backgroundColor: 'rgba(255,255,255,0.95)',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    color: '#1e293b',
    boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
};


export function ProgressCharts() {
    const { token } = useAuth();
    const [progressHistory, setProgressHistory] = useState<ProgressData[]>([]);
    const [skillData, setSkillData] = useState<SkillData[]>([]);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('7d');

    useEffect(() => {
        if (!token) return;

        const fetchData = async () => {
            try {
                const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 365;
                const [dashboard, history] = await Promise.all([
                    api.getDashboard(token),
                    api.getProgressHistory(token, days),
                ]);

                const skills = dashboard.skills.map((s: { skill_name: string; mastery_probability: number; attempts_count: number; category: string }) => ({
                    skill: s.skill_name,
                    mastery: Math.round(s.mastery_probability * 100),
                    attempts: s.attempts_count,
                    category: s.category,
                }));
                setSkillData(skills);

                const realHistory = history.map((item) => ({
                    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                    band: item.estimated_band,
                    accuracy: item.accuracy_rate * 100,
                    attempts: item.attempts_count,
                    xp: item.xp_earned,
                }));

                setProgressHistory(realHistory.length > 0 ? realHistory : [{
                    date: 'Today',
                    band: dashboard.estimated_band || 4,
                    accuracy: (dashboard.overall_accuracy || 0) * 100,
                    attempts: dashboard.total_attempts,
                    xp: dashboard.xp,
                }]);
            } catch (error) {
                console.error('Failed to fetch progress data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [token, timeRange]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const radarData = skillData.slice(0, 6).map(s => ({
        subject: s.skill.length > 12 ? s.skill.slice(0, 12) + '...' : s.skill,
        value: s.mastery,
        fullMark: 100,
    }));

    return (
        <div className="space-y-8">
            {/* Time Range Selector */}
            <div className="flex justify-end gap-2">
                {(['7d', '30d', 'all'] as const).map((range) => (
                    <button
                        key={range}
                        onClick={() => setTimeRange(range)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition ${
                            timeRange === range
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                    >
                        {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : 'All Time'}
                    </button>
                ))}
            </div>

            {/* Band Score Trend */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-6"
            >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Band Score Trend</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={progressHistory}>
                            <defs>
                                <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-white/10" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                            <YAxis domain={[4, 9]} stroke="#94a3b8" fontSize={12} />
                            <Tooltip contentStyle={LIGHT_TOOLTIP} />
                            <Area
                                type="monotone"
                                dataKey="band"
                                stroke="#3b82f6"
                                fillOpacity={1}
                                fill="url(#bandGradient)"
                                strokeWidth={2.5}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>

            {/* Accuracy & Attempts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="card p-6"
                >
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Accuracy Over Time</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={progressHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                                <YAxis domain={[0, 100]} stroke="#94a3b8" fontSize={10} />
                                <Tooltip
                                    contentStyle={LIGHT_TOOLTIP}
                                    formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Accuracy']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="accuracy"
                                    stroke="#10b981"
                                    strokeWidth={2.5}
                                    dot={{ fill: '#10b981', r: 3 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="card p-6"
                >
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Daily Activity</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={progressHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                                <YAxis stroke="#94a3b8" fontSize={10} />
                                <Tooltip contentStyle={LIGHT_TOOLTIP} />
                                <Bar dataKey="attempts" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Questions" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            </div>

            {/* Skill Radar */}
            {radarData.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="card p-6"
                >
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Skill Mastery Radar</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="#e2e8f0" />
                                <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={11} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#cbd5e1" />
                                <Radar
                                    name="Mastery"
                                    dataKey="value"
                                    stroke="#8b5cf6"
                                    fill="#8b5cf6"
                                    fillOpacity={0.3}
                                />
                            </RadarChart>
                        </ResponsiveContainer>
                    </div>
                </motion.div>
            )}

            {/* XP Over Time */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="card p-6"
            >
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">XP Earned Per Day</h3>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={progressHistory}>
                            <defs>
                                <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} />
                            <YAxis stroke="#94a3b8" fontSize={10} />
                            <Tooltip contentStyle={LIGHT_TOOLTIP} />
                            <Area
                                type="monotone"
                                dataKey="xp"
                                stroke="#f59e0b"
                                fillOpacity={1}
                                fill="url(#xpGradient)"
                                strokeWidth={2.5}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
}
