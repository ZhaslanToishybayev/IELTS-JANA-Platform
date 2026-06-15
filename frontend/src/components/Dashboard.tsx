'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api, type DiagnosticResult, type DiagnosticStatus, type TodayPlan } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
    ProgressRing,
    MasteryBar,
    StreakDisplay,
    BandScoreDisplay,
} from './Gamification';
import {
    BookOpen,
    Headphones,
    PenTool,
    Mic2,
    Zap,
    Trophy,
    BarChart3,
    Clock,
    Target,
    Sparkles,
    ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface DashboardData {
    username: string;
    level: number;
    xp: number;
    xp_to_next_level: number;
    current_streak: number;
    estimated_band: number;
    total_attempts: number;
    overall_accuracy: number;
    avg_response_time_ms: number;
    skills: {
        skill_id: number;
        skill_name: string;
        category: string;
        mastery_probability: number;
        attempts_count: number;
        accuracy_rate: number;
        is_unlocked: boolean;
    }[];
    section_bands: Record<string, number>;
    weak_question_types: { module: string; question_type: string; mistakes: number }[];
    mistake_log: { id: number; module: string; question_type: string; question_text: string; correct_answer: string }[];
    next_recommended_session: { module: string; mode: string; question_type?: string; duration_minutes: number; reason: string } | null;
}

export function Dashboard() {
    const { token } = useAuth();
    const [data, setData] = useState<DashboardData | null>(null);
    const [todayPlan, setTodayPlan] = useState<TodayPlan | null>(null);
    const [diagnosticStatus, setDiagnosticStatus] = useState<DiagnosticStatus | null>(null);
    const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
    const [planError, setPlanError] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;

        const authToken = token;
        let cancelled = false;

        async function loadDashboard() {
            setLoading(true);
            setError(null);
            setPlanError(null);

            const [dashboardResult, planResult, diagnosticStatusResult] = await Promise.allSettled([
                api.getDashboard(authToken),
                api.getTodayPlan(authToken),
                api.getDiagnosticStatus(authToken),
            ]);

            if (cancelled) return;

            if (dashboardResult.status === 'fulfilled') {
                setData(dashboardResult.value);
            } else {
                console.error(dashboardResult.reason);
                setError('Unable to load your dashboard right now.');
            }

            if (planResult.status === 'fulfilled') {
                setTodayPlan(planResult.value);
            } else {
                console.error(planResult.reason);
                setPlanError("Today's plan is temporarily unavailable.");
            }

            if (diagnosticStatusResult.status === 'fulfilled') {
                setDiagnosticStatus(diagnosticStatusResult.value);
                if (diagnosticStatusResult.value.completed) {
                    try {
                        setDiagnosticResult(await api.getDiagnosticResult(authToken));
                    } catch (diagnosticError) {
                        console.error(diagnosticError);
                    }
                }
            } else {
                console.error(diagnosticStatusResult.reason);
            }

            setLoading(false);
        }

        loadDashboard();

        return () => {
            cancelled = true;
        };
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center px-4">
                <div className="card p-6 text-center max-w-md">
                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Dashboard unavailable</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{error || 'Please try again in a moment.'}</p>
                </div>
            </div>
        );
    }

    const xpProgress = ((data.xp % 100) / (data.xp_to_next_level || 100)) * 100;

    const skillsByCategory = data.skills.reduce((acc, skill) => {
        if (!acc[skill.category]) acc[skill.category] = [];
        acc[skill.category].push(skill);
        return acc;
    }, {} as Record<string, typeof data.skills>);

    const categoryLabels: Record<string, string> = {
        'TF_NG': 'True/False/Not Given',
        'HEADINGS': 'Matching Headings',
        'SUMMARY': 'Summary Completion',
        'MATCHING_INFO': 'Matching Information',
        'SENTENCE_COMP': 'Sentence Completion',
        'LISTENING_MCQ': 'Listening - Multiple Choice',
        'LISTENING_FORM': 'Listening - Form Completion',
        'LISTENING_MAP': 'Listening - Map Labeling',
        'LISTENING_NOTES': 'Listening - Note Taking',
    };

    const todayPlanCtaHref = todayPlan?.tasks.find((task) => task.href)?.href || '/practice';
    const diagnosticWeakest = diagnosticResult?.weak_skills[0];
    const diagnosticCtaHref = diagnosticStatus?.completed
        ? diagnosticWeakest
            ? `/practice?module=READING&question_type=${encodeURIComponent(diagnosticWeakest.category)}`
            : '/review'
        : '/diagnostic';

    return (
        <div className="py-6 space-y-8">
            {/* Page Title */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Welcome back, {data.username}!
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        You&apos;re making great progress. Ready for today&apos;s session?
                    </p>
                </div>
                {data.current_streak > 0 && <StreakDisplay streak={data.current_streak} />}
            </div>

            {/* Overview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Level Card */}
                <div className="card p-6 flex items-center gap-8 lg:col-span-1">
                    <ProgressRing progress={xpProgress} size={110} strokeWidth={8}>
                        <div className="text-center">
                            <div className="text-3xl font-black text-blue-600">{data.level}</div>
                            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Level</div>
                        </div>
                    </ProgressRing>
                    <div className="flex-1">
                        <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">
                            {data.xp} <span className="text-lg font-medium text-slate-400">XP</span>
                        </div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-3">
                            {data.xp_to_next_level - (data.xp % 100)} XP to Next Level
                        </p>
                        <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full w-full overflow-hidden">
                            <motion.div
                                className="h-full bg-blue-600"
                                initial={{ width: 0 }}
                                animate={{ width: `${xpProgress}%` }}
                                transition={{ duration: 1, ease: 'easeOut' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Performance Stats */}
                <div className="card p-6 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-xs">Performance</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1">
                            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                {data.total_attempts}
                                <BookOpen className="w-4 h-4 text-slate-300" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Questions</p>
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                {(data.overall_accuracy * 100).toFixed(0)}%
                                <Target className="w-4 h-4 text-slate-300" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Accuracy</p>
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                {(data.avg_response_time_ms / 1000).toFixed(1)}s
                                <Clock className="w-4 h-4 text-slate-300" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Avg. Time</p>
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                                Lvl.{data.level}
                                <Trophy className="w-4 h-4 text-slate-300" />
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Rank</p>
                        </div>
                    </div>
                </div>

                {/* Band Score Card */}
                <div className="lg:col-span-1">
                    <BandScoreDisplay band={data.estimated_band} />
                </div>
            </div>

            {/* Reading Diagnostic */}
            {diagnosticStatus && (
                <div className="card p-5 !rounded-2xl">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-11 h-11 bg-slate-900 dark:bg-white rounded-xl flex items-center justify-center text-white dark:text-slate-900">
                                <BookOpen className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                                    {diagnosticStatus.completed ? 'Diagnostic completed' : 'Complete your Reading Diagnostic'}
                                </h2>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
                                    {diagnosticStatus.completed
                                        ? diagnosticWeakest
                                            ? `Weakest Reading skill: ${diagnosticWeakest.skill_name}`
                                            : `Accuracy: ${Math.round((diagnosticResult?.accuracy || 0) * 100)}%`
                                        : `${diagnosticStatus.answered}/${diagnosticStatus.target} questions completed`}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                            {!diagnosticStatus.completed && (
                                <div className="w-full sm:w-40 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-600"
                                        style={{ width: `${Math.min((diagnosticStatus.answered / diagnosticStatus.target) * 100, 100)}%` }}
                                    />
                                </div>
                            )}
                            <Link href={diagnosticCtaHref} className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl px-5 py-3 text-sm font-black hover:bg-blue-700 transition">
                                {diagnosticStatus.completed
                                    ? diagnosticWeakest ? 'Practice weakest skill' : 'Review mistakes'
                                    : 'Start diagnostic'}
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Today's Plan */}
            <div className="card p-6 !rounded-2xl overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="space-y-4 flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="w-11 h-11 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                                <Target className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                    {todayPlan?.title || "Today's IELTS Plan"}
                                </h2>
                                <div className="flex flex-wrap items-center gap-3 text-xs font-black uppercase tracking-widest text-slate-400 mt-1">
                                    <span className="flex items-center gap-1.5">
                                        <Clock className="w-3.5 h-3.5" />
                                        {todayPlan?.estimated_minutes || 25} min
                                    </span>
                                    <span>
                                        {todayPlan?.focus_skill
                                            ? `${todayPlan.focus_skill.skill_name} (${Math.round(todayPlan.focus_skill.mastery_probability * 100)}%)`
                                            : 'Initial diagnostic'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {planError ? (
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{planError}</p>
                        ) : (
                            <>
                                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 max-w-2xl">
                                    {todayPlan?.reason}
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                                    {todayPlan?.tasks.slice(0, 3).map((task) => (
                                        <div key={`${task.type}-${task.label}`} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                            <div className="text-sm font-black text-slate-900 dark:text-white">{task.label}</div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mt-2">
                                                Target: {task.target}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    <div className="lg:w-56 flex flex-col gap-3">
                        {todayPlan && (
                            <div className="flex items-center justify-between rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 px-4 py-3">
                                <span className="text-xs font-black uppercase tracking-widest text-blue-700 dark:text-blue-300">Reward</span>
                                <span className="text-sm font-black text-blue-700 dark:text-blue-300">+{todayPlan.reward.xp} XP</span>
                            </div>
                        )}
                        <Link href={todayPlanCtaHref} className="inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl px-5 py-3 text-sm font-black hover:opacity-95 transition">
                            Start today&apos;s plan
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Action Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                    { label: 'Reading', href: '/practice', color: 'bg-blue-600', icon: BookOpen },
                    { label: 'Listening', href: '/listening', color: 'bg-indigo-600', icon: Headphones },
                    { label: 'Writing', href: '/writing', color: 'bg-slate-800', icon: PenTool },
                    { label: 'Speaking', href: '/speaking', color: 'bg-slate-700', icon: Mic2 },
                ].map((action) => (
                    <Link
                        key={action.label}
                        href={action.href}
                        className="group relative overflow-hidden card p-6 hover:border-blue-500 transition-all duration-300"
                    >
                        <div className="relative z-10 flex flex-col justify-between h-full min-h-[100px]">
                            <div className={`w-12 h-12 ${action.color} rounded-xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                <action.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                    {action.label}
                                </h3>
                                <p className="text-xs font-medium text-slate-500 flex items-center gap-1 mt-1">
                                    Start Practice <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                                </p>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>

            {/* AI Recommendations & Tools */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <div className="card p-6 !rounded-2xl">
                        <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-5">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                            IELTS Bands by Section
                        </h2>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {['reading', 'listening', 'writing', 'speaking'].map((section) => (
                                <div key={section} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{section}</div>
                                    <div className="text-3xl font-black text-slate-900 dark:text-white">
                                        {data.section_bands?.[section]?.toFixed(1) || '-'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {data.weak_question_types?.length > 0 && (
                        <div className="card p-6 !rounded-2xl">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2 mb-5">
                                <Target className="w-5 h-5 text-rose-500" />
                                Weak Question Types
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {data.weak_question_types.map((item) => (
                                    <div key={`${item.module}-${item.question_type}`} className="flex items-center justify-between p-4 rounded-xl bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30">
                                        <div>
                                            <div className="font-black text-slate-900 dark:text-white">{item.question_type}</div>
                                            <div className="text-[10px] font-black uppercase tracking-widest text-rose-500">{item.module}</div>
                                        </div>
                                        <div className="text-sm font-black text-rose-600">{item.mistakes} mistakes</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Mastery Breakdown */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                                <Target className="w-5 h-5 text-blue-600" />
                                Skill Mastery Breakdown
                            </h2>
                            <Link href="/skills" className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-widest">
                                View Skill Tree
                            </Link>
                        </div>

                        <div className="space-y-6">
                            {Object.entries(skillsByCategory).map(([category, skills]) => (
                                <div key={category} className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">
                                        {categoryLabels[category] || category}
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {skills.map((skill) => (
                                            <MasteryBar
                                                key={skill.skill_id}
                                                skillName={skill.skill_name}
                                                mastery={skill.mastery_probability}
                                                category={skill.category}
                                                isUnlocked={skill.is_unlocked}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {data.next_recommended_session && (
                        <Link href={data.next_recommended_session.module === 'LISTENING' ? '/listening' : '/practice'} className="block bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl p-6 hover:opacity-95 transition">
                            <h3 className="font-black uppercase tracking-widest text-xs mb-3">Next Session</h3>
                            <div className="text-2xl font-black mb-2">{data.next_recommended_session.module}</div>
                            <p className="text-sm opacity-80 leading-relaxed">{data.next_recommended_session.reason}</p>
                            <div className="mt-4 text-xs font-black uppercase tracking-widest opacity-60">{data.next_recommended_session.duration_minutes} minutes</div>
                        </Link>
                    )}

                    {data.mistake_log?.length > 0 && (
                        <div className="card p-6 !rounded-2xl">
                            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Mistake Log</h3>
                            <div className="space-y-3">
                                {data.mistake_log.slice(0, 3).map((item) => (
                                    <div key={item.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-blue-600 mb-1">{item.module} / {item.question_type}</div>
                                        <p className="text-xs font-bold text-slate-600 dark:text-slate-300 line-clamp-2">{item.question_text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Pro Tip Card */}
                    <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/50 rounded-2xl p-6 relative overflow-hidden">
                        <Sparkles className="w-8 h-8 text-blue-600/20 absolute -top-1 -right-1" />
                        <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            AI Recommendation
                        </h3>
                        <p className="text-sm text-blue-800/80 dark:text-blue-400/80 leading-relaxed font-medium">
                            {data.skills.length > 0
                                ? `Focus on your ${data.skills.reduce((a, b) =>
                                    a.mastery_probability < b.mastery_probability ? a : b
                                ).skill_name
                                } - improving your weak points is the fastest way to hit Band 8.0!`
                                : 'Complete 5 more questions to unlock personalized AI strategy recommendations.'}
                        </p>
                    </div>

                    {/* Secondary Actions */}
                    <div className="space-y-3">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 pl-1">Powerful Tools</h3>
                        <Link href="/generate" className="flex items-center justify-between w-full card p-4 hover:border-blue-300 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                                    <Sparkles className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tight">Infinite Prep Generator</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/mock" className="flex items-center justify-between w-full card p-4 hover:border-orange-300 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-50 dark:bg-orange-900/30 rounded-lg text-orange-600">
                                    <Clock className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tight">Full Mock Exam</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/leaderboard" className="flex items-center justify-between w-full card p-4 hover:border-yellow-300 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-yellow-600">
                                    <Trophy className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tight">Global Leaderboard</span>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
