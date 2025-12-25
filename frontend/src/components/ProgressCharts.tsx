'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, BarChart, Bar, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
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
                // Fetch dashboard data which includes skills
                const dashboard = await api.getDashboard(token);

                // Transform skills for radar chart
                const skills = dashboard.skills.map((s: { skill_name: string; mastery_probability: number; attempts_count: number; category: string }) => ({
                    skill: s.skill_name,
                    mastery: Math.round(s.mastery_probability * 100),
                    attempts: s.attempts_count,
                    category: s.category,
                }));
                setSkillData(skills);

                // Generate mock progress history based on current data
                // In production, this would come from dashboard_metrics table
                const today = new Date();
                const mockHistory: ProgressData[] = [];
                const baseAccuracy = dashboard.overall_accuracy || 0.5;
                const baseBand = dashboard.estimated_band || 5.0;

                for (let i = 13; i >= 0; i--) {
                    const date = new Date(today);
                    date.setDate(date.getDate() - i);

                    // Simulate gradual improvement
                    const progress = (14 - i) / 14;
                    const dailyVariance = Math.random() * 0.1 - 0.05;

                    mockHistory.push({
                        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                        band: Math.max(4, Math.min(9, baseBand - 0.5 + progress * 0.8 + dailyVariance)),
                        accuracy: Math.max(0, Math.min(100, (baseAccuracy * 100 - 15 + progress * 20 + dailyVariance * 100))),
                        attempts: Math.floor(Math.random() * 15) + 5,
                        xp: Math.floor(Math.random() * 200) + 50,
                    });
                }

                setProgressHistory(mockHistory);
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
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-purple-400 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    const filteredHistory = timeRange === '7d'
        ? progressHistory.slice(-7)
        : timeRange === '30d'
            ? progressHistory
            : progressHistory;

    // Prepare radar chart data (top skills)
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
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${timeRange === range
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
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
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
            >
                <h3 className="text-lg font-semibold text-white mb-4">📈 Band Score Trend</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredHistory}>
                            <defs>
                                <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                            <YAxis domain={[4, 9]} stroke="rgba(255,255,255,0.5)" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="band"
                                stroke="#818cf8"
                                fillOpacity={1}
                                fill="url(#bandGradient)"
                                strokeWidth={2}
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
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
                >
                    <h3 className="text-lg font-semibold text-white mb-4">🎯 Accuracy Over Time</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={filteredHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={10} />
                                <YAxis domain={[0, 100]} stroke="rgba(255,255,255,0.5)" fontSize={10} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                    }}
                                    formatter={(value) => [`${Number(value).toFixed(1)}%`, 'Accuracy']}
                                />
                                <Line
                                    type="monotone"
                                    dataKey="accuracy"
                                    stroke="#10b981"
                                    strokeWidth={2}
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
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
                >
                    <h3 className="text-lg font-semibold text-white mb-4">📊 Daily Activity</h3>
                    <div className="h-48">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={filteredHistory}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                                <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={10} />
                                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: 'rgba(0,0,0,0.8)',
                                        border: 'none',
                                        borderRadius: '8px',
                                        color: 'white',
                                    }}
                                />
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
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
                >
                    <h3 className="text-lg font-semibold text-white mb-4">🎯 Skill Mastery Radar</h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <RadarChart data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.2)" />
                                <PolarAngleAxis dataKey="subject" stroke="rgba(255,255,255,0.7)" fontSize={11} />
                                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="rgba(255,255,255,0.3)" />
                                <Radar
                                    name="Mastery"
                                    dataKey="value"
                                    stroke="#a855f7"
                                    fill="#a855f7"
                                    fillOpacity={0.5}
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
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6"
            >
                <h3 className="text-lg font-semibold text-white mb-4">⚡ XP Earned Per Day</h3>
                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredHistory}>
                            <defs>
                                <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8} />
                                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={10} />
                            <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'rgba(0,0,0,0.8)',
                                    border: 'none',
                                    borderRadius: '8px',
                                    color: 'white',
                                }}
                            />
                            <Area
                                type="monotone"
                                dataKey="xp"
                                stroke="#f59e0b"
                                fillOpacity={1}
                                fill="url(#xpGradient)"
                                strokeWidth={2}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </motion.div>
        </div>
    );
}
