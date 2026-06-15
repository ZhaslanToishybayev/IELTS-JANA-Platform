'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    AlertCircle,
    ArrowRight,
    BookOpen,
    CheckCircle2,
    Filter,
    RotateCcw,
    Sparkles,
} from 'lucide-react';
import { api, type ReviewMistake, type ReviewSummary } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const MODULES = ['ALL', 'READING', 'LISTENING'];
const RESOLVED_FILTERS = [
    { label: 'Unresolved', value: 'false' },
    { label: 'Reviewed', value: 'true' },
    { label: 'All', value: 'all' },
] as const;

function formatDate(value: string) {
    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(value));
}

function practiceHref(mistake: ReviewMistake) {
    const params = new URLSearchParams({
        module: mistake.module,
        question_type: mistake.question_type,
    });
    return `/practice?${params.toString()}`;
}

export default function ReviewPage() {
    const { user, token, loading } = useAuth();
    const router = useRouter();
    const [module, setModule] = useState('ALL');
    const [questionType, setQuestionType] = useState('ALL');
    const [resolved, setResolved] = useState<'false' | 'true' | 'all'>('false');
    const [mistakes, setMistakes] = useState<ReviewMistake[]>([]);
    const [summary, setSummary] = useState<ReviewSummary | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [resolvingId, setResolvingId] = useState<number | null>(null);

    const loadReviewData = useCallback(async () => {
        if (!token) return;
        setIsLoading(true);
        setError(null);
        try {
            const filters = {
                module: module === 'ALL' ? undefined : module,
                question_type: questionType === 'ALL' ? undefined : questionType,
                resolved,
                limit: 50,
            };
            const [mistakeResult, summaryResult] = await Promise.all([
                api.getMistakes(token, filters),
                api.getReviewSummary(token),
            ]);
            setMistakes(mistakeResult.mistakes);
            setSummary(summaryResult);
        } catch (err) {
            console.error(err);
            setError('Unable to load mistake review right now.');
        } finally {
            setIsLoading(false);
        }
    }, [module, questionType, resolved, token]);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [loading, router, user]);

    useEffect(() => {
        loadReviewData();
    }, [loadReviewData]);

    const questionTypes = useMemo(() => {
        const fromSummary = summary?.by_question_type.map((item) => item.question_type) || [];
        const fromMistakes = mistakes.map((mistake) => mistake.question_type);
        return Array.from(new Set([...fromSummary, ...fromMistakes])).sort();
    }, [mistakes, summary]);

    const topWeakType = summary?.by_question_type[0];
    const hasActiveFilters = module !== 'ALL' || questionType !== 'ALL' || resolved !== 'false';
    const recommendation = topWeakType
        ? `Focus on ${topWeakType.question_type}: it appears most often in your unresolved mistakes.`
        : 'Keep practicing and this page will turn misses into a focused review queue.';

    const resetFilters = () => {
        setModule('ALL');
        setQuestionType('ALL');
        setResolved('false');
    };

    const resolve = async (id: number) => {
        if (!token) return;
        setResolvingId(id);
        try {
            await api.resolveMistake(token, id);
            await loadReviewData();
        } finally {
            setResolvingId(null);
        }
    };

    if (loading || !user) return null;

    return (
        <div className="py-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Mistake Review</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Turn wrong answers into your next band-score gains.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Link href="/practice" className="px-4 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest flex items-center gap-2 hover:opacity-90 transition">
                        <BookOpen className="w-4 h-4" />
                        Back to practice
                    </Link>
                    <button onClick={loadReviewData} className="px-4 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest flex items-center gap-2">
                        <RotateCcw className="w-4 h-4" />
                        Refresh
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="card p-6 !rounded-2xl">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Unresolved</div>
                    <div className="text-4xl font-black text-slate-900 dark:text-white">{summary?.total_unresolved ?? '-'}</div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Open mistakes waiting for review.</p>
                </div>
                <div className="card p-6 !rounded-2xl">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Weak type</div>
                    <div className="text-2xl font-black text-slate-900 dark:text-white">{topWeakType?.question_type || 'No pattern yet'}</div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{topWeakType ? `${topWeakType.count} unresolved mistakes` : 'New patterns appear after practice.'}</p>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-6 relative overflow-hidden">
                    <Sparkles className="w-8 h-8 text-blue-600/20 absolute -top-1 -right-1" />
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">Recommendation</div>
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-300 leading-relaxed">{recommendation}</p>
                </div>
            </div>

            <div className="card p-4 !rounded-2xl space-y-4">
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <Filter className="w-4 h-4" />
                    Filters
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {MODULES.map((item) => (
                        <button
                            key={item}
                            onClick={() => setModule(item)}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${module === item
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-blue-600'
                                }`}
                        >
                            {item === 'ALL' ? 'All modules' : item}
                        </button>
                    ))}
                    <select
                        value={questionType}
                        onChange={(event) => setQuestionType(event.target.value)}
                        className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-800 outline-none"
                    >
                        <option value="ALL">All question types</option>
                        {questionTypes.map((item) => (
                            <option key={item} value={item}>{item}</option>
                        ))}
                    </select>
                    {RESOLVED_FILTERS.map((item) => (
                        <button
                            key={item.value}
                            onClick={() => setResolved(item.value)}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition ${resolved === item.value
                                ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                                : 'bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            {item.label}
                        </button>
                    ))}
                    {hasActiveFilters && (
                        <button onClick={resetFilters} className="px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition">
                            Reset
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="card p-5 !rounded-2xl border-l-4 border-l-rose-500 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{error}</p>
                </div>
            )}

            {isLoading ? (
                <div className="min-h-[40vh] flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : mistakes.length === 0 ? (
                <div className="card p-12 text-center space-y-4 !rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-500 flex items-center justify-center mx-auto">
                        <CheckCircle2 className="w-9 h-9" />
                    </div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                        {hasActiveFilters ? 'No mistakes match these filters' : 'No mistakes yet'}
                    </h2>
                    <p className="text-slate-500 font-medium">
                        {hasActiveFilters ? 'Reset filters or switch back to unresolved mistakes.' : 'Practice a few questions and your review queue will appear here.'}
                    </p>
                    <div className="flex flex-wrap justify-center gap-3">
                        {hasActiveFilters && (
                            <button onClick={resetFilters} className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-black uppercase tracking-widest text-xs">
                                Reset filters
                            </button>
                        )}
                        <Link href="/practice" className="px-5 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs">
                            Go to practice
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    {mistakes.map((mistake) => (
                        <article key={mistake.id} className={`card p-6 !rounded-2xl space-y-5 border-l-4 ${mistake.is_resolved ? 'border-l-emerald-500' : 'border-l-rose-500'}`}>
                            <div className="flex items-start justify-between gap-4">
                                <div className="space-y-3">
                                    <div className="flex flex-wrap gap-2">
                                        <span className="px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                                            {mistake.module}
                                        </span>
                                        <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest">
                                            {mistake.question_type}
                                        </span>
                                        {mistake.skill && (
                                            <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 text-[10px] font-black uppercase tracking-widest">
                                                {mistake.skill.name}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-lg font-black text-slate-900 dark:text-white leading-snug">
                                        {mistake.question_text}
                                    </h2>
                                </div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 whitespace-nowrap">
                                    {formatDate(mistake.created_at)}
                                </div>
                            </div>

                            {(mistake.passage_title || mistake.passage_excerpt) && (
                                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                    {mistake.passage_title && (
                                        <div className="text-sm font-black text-slate-900 dark:text-white mb-2">{mistake.passage_title}</div>
                                    )}
                                    {mistake.passage_excerpt && (
                                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{mistake.passage_excerpt}</p>
                                    )}
                                </div>
                            )}

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

                            <div className="flex flex-col sm:flex-row gap-3">
                                {!mistake.is_resolved && (
                                    <button
                                        onClick={() => resolve(mistake.id)}
                                        disabled={resolvingId === mistake.id}
                                        className="flex-1 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs hover:opacity-90 transition disabled:opacity-60"
                                    >
                                        {resolvingId === mistake.id ? 'Saving...' : 'Mark as reviewed'}
                                    </button>
                                )}
                                <Link href={practiceHref(mistake)} className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition flex items-center justify-center gap-2">
                                    Practice similar
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
}
