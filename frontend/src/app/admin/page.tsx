'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

interface DashboardStats {
    users: {
        total: number;
        new_this_week: number;
        active_this_week: number;
    };
    questions: {
        total: number;
        by_module: Record<string, number>;
    };
    attempts: {
        total: number;
        today: number;
        avg_accuracy: number;
    };
    achievements: {
        total: number;
        total_unlocked: number;
    };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export default function AdminPage() {
    const { token, user } = useAuth();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'dashboard' | 'questions' | 'users' | 'achievements'>('dashboard');

    useEffect(() => {
        if (token) {
            loadDashboard();
        }
    }, [token]);

    const loadDashboard = async () => {
        try {
            const res = await fetch(`${API_URL}/admin/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                if (res.status === 403) {
                    setError('Нет доступа. Требуются права администратора.');
                } else {
                    throw new Error('Failed to load dashboard');
                }
                return;
            }

            const data = await res.json();
            setStats(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка загрузки');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center">
                <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">🔒</div>
                    <h1 className="text-2xl font-bold text-white mb-2">Доступ запрещён</h1>
                    <p className="text-gray-400 mb-6">{error}</p>
                    <Link
                        href="/dashboard"
                        className="px-6 py-3 bg-gray-700 rounded-xl text-white hover:bg-gray-600 transition-colors"
                    >
                        ← Вернуться
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900 text-white">
            {/* Header */}
            <div className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold flex items-center gap-2">
                                ⚙️ Admin Panel
                            </h1>
                            <p className="text-gray-400 text-sm">
                                Управление платформой IELTS JANA
                            </p>
                        </div>
                        <Link
                            href="/dashboard"
                            className="text-gray-400 hover:text-white transition-colors"
                        >
                            ← Dashboard
                        </Link>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                    {[
                        { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
                        { id: 'questions', label: '❓ Вопросы', icon: '❓' },
                        { id: 'users', label: '👥 Пользователи', icon: '👥' },
                        { id: 'achievements', label: '🏆 Достижения', icon: '🏆' },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${activeTab === tab.id
                                    ? 'bg-orange-600 text-white'
                                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Dashboard Tab */}
                {activeTab === 'dashboard' && stats && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        {/* Stats Grid */}
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {/* Users */}
                            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6">
                                <div className="text-4xl mb-2">👥</div>
                                <p className="text-blue-200">Пользователей</p>
                                <p className="text-3xl font-bold">{stats.users.total}</p>
                                <p className="text-blue-300 text-sm mt-2">
                                    +{stats.users.new_this_week} за неделю
                                </p>
                            </div>

                            {/* Questions */}
                            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-6">
                                <div className="text-4xl mb-2">❓</div>
                                <p className="text-purple-200">Вопросов</p>
                                <p className="text-3xl font-bold">{stats.questions.total}</p>
                                <div className="text-purple-300 text-sm mt-2">
                                    {Object.entries(stats.questions.by_module).map(([k, v]) => (
                                        <span key={k} className="mr-2">{k}: {v}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Attempts */}
                            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-2xl p-6">
                                <div className="text-4xl mb-2">📝</div>
                                <p className="text-green-200">Попыток</p>
                                <p className="text-3xl font-bold">{stats.attempts.total}</p>
                                <p className="text-green-300 text-sm mt-2">
                                    Сегодня: {stats.attempts.today} | Точность: {stats.attempts.avg_accuracy}%
                                </p>
                            </div>

                            {/* Achievements */}
                            <div className="bg-gradient-to-br from-yellow-600 to-orange-700 rounded-2xl p-6">
                                <div className="text-4xl mb-2">🏆</div>
                                <p className="text-yellow-200">Достижений</p>
                                <p className="text-3xl font-bold">{stats.achievements.total}</p>
                                <p className="text-yellow-300 text-sm mt-2">
                                    Разблокировано: {stats.achievements.total_unlocked}
                                </p>
                            </div>
                        </div>

                        {/* Activity Stats */}
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-gray-800/50 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold mb-4">📈 Активность за неделю</h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Новые пользователи</span>
                                        <span className="text-green-400 font-semibold">+{stats.users.new_this_week}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Активные пользователи</span>
                                        <span className="text-blue-400 font-semibold">{stats.users.active_this_week}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-400">Средняя точность</span>
                                        <span className="text-purple-400 font-semibold">{stats.attempts.avg_accuracy}%</span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-800/50 rounded-2xl p-6">
                                <h3 className="text-lg font-semibold mb-4">⚡ Быстрые действия</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button className="p-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors text-left">
                                        <span className="text-xl">➕</span>
                                        <p className="text-sm mt-1">Добавить вопрос</p>
                                    </button>
                                    <button className="p-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors text-left">
                                        <span className="text-xl">🏆</span>
                                        <p className="text-sm mt-1">Добавить достижение</p>
                                    </button>
                                    <button className="p-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors text-left">
                                        <span className="text-xl">📊</span>
                                        <p className="text-sm mt-1">Экспорт данных</p>
                                    </button>
                                    <button className="p-3 bg-gray-700 rounded-xl hover:bg-gray-600 transition-colors text-left">
                                        <span className="text-xl">🔄</span>
                                        <p className="text-sm mt-1">Seed данные</p>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* Other tabs placeholder */}
                {activeTab !== 'dashboard' && (
                    <div className="text-center py-12">
                        <div className="text-6xl mb-4">🚧</div>
                        <h2 className="text-xl font-semibold mb-2">В разработке</h2>
                        <p className="text-gray-400">
                            Функционал "{activeTab}" будет доступен в следующем обновлении
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
