'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Filter, RotateCcw, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Mistake = {
    id: number;
    module: string;
    question_type: string;
    question_text: string;
    user_answer: string;
    correct_answer: string;
    explanation: string | null;
    created_at: string;
};

const MODULES = ['ALL', 'READING', 'LISTENING', 'WRITING', 'SPEAKING'];

export default function ReviewPage() {
    const { user, token, loading } = useAuth();
    const router = useRouter();
    const [module, setModule] = useState('ALL');
    const [mistakes, setMistakes] = useState<Mistake[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const loadMistakes = async () => {
        if (!token) return;
        setIsLoading(true);
        try {
            const result = await api.getMistakes(token, module === 'ALL' ? undefined : module);
            setMistakes(result.mistakes);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [loading, router, user]);

    useEffect(() => {
        loadMistakes().catch(console.error);
    }, [module, token]);

    const resolve = async (id: number) => {
        if (!token) return;
        await api.resolveMistake(token, id);
        setMistakes((items) => items.filter((item) => item.id !== id));
    };

    if (loading || !user) return null;

    return (
        <div className="py-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mistake Review</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Turn wrong answers into your next band-score gains.</p>
                </div>
                <button onClick={loadMistakes} className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            <div className="card p-4 flex flex-wrap items-center gap-2">
                <Filter className="w-4 h-4 text-slate-400 mr-2" />
                {MODULES.map((item) => (
                    <button
                        key={item}
                        onClick={() => setModule(item)}
                        className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${module === item
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-blue-600'
                            }`}
                    >
                        {item}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="min-h-[40vh] flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : mistakes.length === 0 ? (
                <div className="card p-12 text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-9 h-9" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">No open mistakes</h2>
                    <p className="text-slate-500 font-medium">Practice a few questions and your review queue will appear here.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {mistakes.map((mistake) => (
                        <div key={mistake.id} className="card p-6 !rounded-2xl space-y-5 border-l-4 border-l-rose-500">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">
                                        {mistake.module} / {mistake.question_type}
                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                                        {mistake.question_text}
                                    </h2>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Your answer</div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200">{mistake.user_answer || '-'}</div>
                                </div>
                                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/30">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-emerald-600 mb-1">Correct answer</div>
                                    <div className="font-bold text-slate-800 dark:text-slate-200">{mistake.correct_answer}</div>
                                </div>
                            </div>

                            {mistake.explanation && (
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 flex items-center gap-2">
                                        <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                                        Explanation
                                    </div>
                                    <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{mistake.explanation}</p>
                                </div>
                            )}

                            <button
                                onClick={() => resolve(mistake.id)}
                                className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs hover:opacity-90 transition"
                            >
                                Mark as Resolved
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
