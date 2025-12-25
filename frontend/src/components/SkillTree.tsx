'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

interface SkillNode {
    skill_id: number;
    skill_name: string;
    category: string;
    mastery_probability: number;
    is_unlocked: boolean;
    is_mastered: boolean;
    requires: number[];
    children: number[];
}

const categoryColors: Record<string, { bg: string; border: string; text: string }> = {
    'TF_NG': { bg: 'bg-blue-500', border: 'border-blue-400', text: 'text-blue-400' },
    'HEADINGS': { bg: 'bg-purple-500', border: 'border-purple-400', text: 'text-purple-400' },
    'SUMMARY': { bg: 'bg-green-500', border: 'border-green-400', text: 'text-green-400' },
};

export function SkillTree() {
    const { token } = useAuth();
    const [nodes, setNodes] = useState<SkillNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ unlocked: 0, mastered: 0 });

    useEffect(() => {
        if (!token) return;

        api.getSkillTree(token)
            .then((data) => {
                setNodes(data.nodes);
                setStats({ unlocked: data.total_unlocked, mastered: data.total_mastered });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) {
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

    // Group nodes by category
    const nodesByCategory = nodes.reduce((acc, node) => {
        if (!acc[node.category]) acc[node.category] = [];
        acc[node.category].push(node);
        return acc;
    }, {} as Record<string, SkillNode[]>);

    // Sort nodes within each category by tier (based on requires length)
    Object.keys(nodesByCategory).forEach(category => {
        nodesByCategory[category].sort((a, b) => a.requires.length - b.requires.length);
    });

    const categoryLabels: Record<string, string> = {
        'TF_NG': 'True/False/Not Given',
        'HEADINGS': 'Matching Headings',
        'SUMMARY': 'Summary Completion',
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-4 md:p-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto mb-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <a href="/dashboard" className="text-white/70 hover:text-white mb-2 inline-block">
                            ← Back to Dashboard
                        </a>
                        <h1 className="text-3xl font-bold">Skill Tree 🌳</h1>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                            <div className="text-2xl font-bold">{stats.unlocked}</div>
                            <div className="text-xs text-white/60">Unlocked</div>
                        </div>
                        <div className="bg-white/10 rounded-xl px-4 py-2 text-center">
                            <div className="text-2xl font-bold">{stats.mastered}</div>
                            <div className="text-xs text-white/60">Mastered</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Skill Tree Grid */}
            <div className="max-w-6xl mx-auto">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {Object.entries(nodesByCategory).map(([category, categoryNodes]) => {
                        const colors = categoryColors[category] || categoryColors['TF_NG'];

                        return (
                            <motion.div
                                key={category}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6"
                            >
                                <h2 className={`text-lg font-bold mb-6 ${colors.text}`}>
                                    {categoryLabels[category] || category}
                                </h2>

                                <div className="space-y-4">
                                    {categoryNodes.map((node, idx) => (
                                        <motion.div
                                            key={node.skill_id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.1 }}
                                        >
                                            {/* Connection line */}
                                            {idx > 0 && (
                                                <div className="flex justify-center mb-2">
                                                    <div className={`w-0.5 h-6 ${node.is_unlocked ? colors.bg : 'bg-gray-600'}`} />
                                                </div>
                                            )}

                                            {/* Skill node */}
                                            <div
                                                className={`relative p-4 rounded-xl border-2 transition-all ${!node.is_unlocked
                                                        ? 'bg-gray-800/50 border-gray-600 opacity-50'
                                                        : node.is_mastered
                                                            ? `${colors.bg}/20 ${colors.border} shadow-lg shadow-${colors.bg}/20`
                                                            : 'bg-white/10 border-white/20'
                                                    }`}
                                            >
                                                {/* Lock icon for locked skills */}
                                                {!node.is_unlocked && (
                                                    <div className="absolute -top-2 -right-2 bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center">
                                                        🔒
                                                    </div>
                                                )}

                                                {/* Mastery star for mastered skills */}
                                                {node.is_mastered && (
                                                    <div className="absolute -top-2 -right-2 bg-yellow-500 rounded-full w-8 h-8 flex items-center justify-center">
                                                        ⭐
                                                    </div>
                                                )}

                                                <div className="flex justify-between items-start mb-3">
                                                    <h3 className="font-semibold">{node.skill_name}</h3>
                                                    <span className="text-sm text-white/60">
                                                        {Math.round(node.mastery_probability * 100)}%
                                                    </span>
                                                </div>

                                                {/* Progress bar */}
                                                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                                                    <motion.div
                                                        className={`h-full ${colors.bg}`}
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${node.mastery_probability * 100}%` }}
                                                        transition={{ duration: 0.8, delay: idx * 0.1 }}
                                                    />
                                                </div>

                                                {/* Tier indicator */}
                                                <div className="mt-2 flex gap-1">
                                                    {[...Array(node.requires.length + 1)].map((_, i) => (
                                                        <div
                                                            key={i}
                                                            className={`w-2 h-2 rounded-full ${colors.bg}`}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="max-w-6xl mx-auto mt-8">
                <div className="bg-white/5 rounded-xl p-4 flex flex-wrap gap-6 justify-center">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-gray-600 rounded" />
                        <span className="text-sm text-white/60">Locked</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-white/20 rounded border border-white/40" />
                        <span className="text-sm text-white/60">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-purple-500/30 rounded border border-purple-400" />
                        <span className="text-sm text-white/60">Mastered</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
