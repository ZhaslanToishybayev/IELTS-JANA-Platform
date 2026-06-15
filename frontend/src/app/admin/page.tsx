'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    AlertCircle,
    CheckCircle2,
    Database,
    FileJson,
    LayoutDashboard,
    ListChecks,
    ShieldCheck,
    Upload,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type AdminTab = 'dashboard' | 'content' | 'import' | 'questions';

type DashboardStats = Awaited<ReturnType<typeof api.getAdminDashboard>>;
type ContentItem = Awaited<ReturnType<typeof api.getAdminContent>>['content'][number];
type AdminQuestion = Awaited<ReturnType<typeof api.getAdminQuestions>>['questions'][number];

const SAMPLE_IMPORT = JSON.stringify([
    {
        title: 'Urban Food Markets',
        module: 'READING',
        section: 'Passage 1',
        instructions: 'Read the passage and answer the questions.',
        passage: 'Urban food markets have changed from simple trade locations into civic spaces where local producers, restaurants, and residents interact...',
        source: 'original',
        estimated_band: 6.0,
        time_limit_minutes: 20,
        needs_review: true,
        questions: [
            {
                skill_id: 1,
                question_text: 'Urban food markets are now only used for buying basic goods.',
                question_type: 'TF_NG',
                correct_answer: 'FALSE',
                explanation: 'The passage says they are also civic spaces for interaction.',
                difficulty: 5,
                estimated_band: 6.0,
                tags: ['urban life', 'true false not given']
            }
        ]
    }
], null, 2);

export default function AdminPage() {
    const { user, token, loading } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [content, setContent] = useState<ContentItem[]>([]);
    const [questions, setQuestions] = useState<AdminQuestion[]>([]);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved'>('pending');
    const [moduleFilter, setModuleFilter] = useState<'ALL' | 'READING' | 'LISTENING'>('ALL');
    const [jsonInput, setJsonInput] = useState(SAMPLE_IMPORT);
    const [isBusy, setIsBusy] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const selectedModule = moduleFilter === 'ALL' ? undefined : moduleFilter;

    const loadDashboard = useCallback(async () => {
        if (!token) return;
        const data = await api.getAdminDashboard(token);
        setStats(data);
    }, [token]);

    const loadContent = useCallback(async () => {
        if (!token) return;
        const data = await api.getAdminContent(token, statusFilter, selectedModule);
        setContent(data.content);
    }, [token, statusFilter, selectedModule]);

    const loadQuestions = useCallback(async () => {
        if (!token) return;
        const data = await api.getAdminQuestions(token, selectedModule);
        setQuestions(data.questions);
    }, [token, selectedModule]);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [loading, router, user]);

    useEffect(() => {
        if (!token) return;
        setError(null);
        setMessage(null);
        Promise.all([loadDashboard(), loadContent(), loadQuestions()]).catch((err) => {
            setError(err instanceof Error ? err.message : 'Failed to load admin data');
        });
    }, [token, loadDashboard, loadContent, loadQuestions]);

    const importContent = async () => {
        if (!token) return;
        setIsBusy(true);
        setError(null);
        setMessage(null);
        try {
            const payload = JSON.parse(jsonInput);
            if (!Array.isArray(payload)) {
                throw new Error('Import JSON must be an array of test sets');
            }
            const result = await api.importAdminContent(token, payload);
            setMessage(`Imported ${result.count} test set(s). Review them before they enter practice.`);
            setStatusFilter('pending');
            setActiveTab('content');
            await Promise.all([loadDashboard(), loadContent(), loadQuestions()]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Import failed');
        } finally {
            setIsBusy(false);
        }
    };

    const approveContent = async (id: number) => {
        if (!token) return;
        setIsBusy(true);
        setError(null);
        setMessage(null);
        try {
            await api.approveAdminContent(token, id);
            setMessage(`Content #${id} approved for practice.`);
            await Promise.all([loadDashboard(), loadContent(), loadQuestions()]);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Approve failed');
        } finally {
            setIsBusy(false);
        }
    };

    const tabs = useMemo(() => [
        { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
        { id: 'content' as const, label: 'Content Review', icon: ListChecks },
        { id: 'import' as const, label: 'JSON Import', icon: FileJson },
        { id: 'questions' as const, label: 'Questions', icon: Database },
    ], []);

    if (loading || !user) return null;

    return (
        <div className="py-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Local Admin</h1>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">
                        Import original IELTS-style content, review it, and approve it for practice.
                    </p>
                </div>

                <div className="card p-2 flex flex-wrap gap-2">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest flex items-center gap-2 transition ${activeTab === tab.id
                                ? 'bg-blue-600 text-white'
                                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {(message || error) && (
                <div className={`card p-4 flex items-start gap-3 ${error ? 'border-rose-200 dark:border-rose-900/40' : 'border-emerald-200 dark:border-emerald-900/40'}`}>
                    {error ? <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5" /> : <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" />}
                    <p className={`font-bold ${error ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {error || message}
                    </p>
                </div>
            )}

            {activeTab === 'dashboard' && stats && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                    <StatCard title="Users" value={stats.users.total} detail={`+${stats.users.new_this_week} this week`} />
                    <StatCard title="Questions" value={stats.questions.total} detail={Object.entries(stats.questions.by_module).map(([key, value]) => `${key}: ${value}`).join(' | ') || 'No questions yet'} />
                    <StatCard title="Attempts" value={stats.attempts.total} detail={`${stats.attempts.today} today | ${stats.attempts.avg_accuracy}% accuracy`} />
                    <StatCard title="Achievements" value={stats.achievements.total} detail={`${stats.achievements.total_unlocked} unlocked`} />
                </div>
            )}

            {activeTab === 'content' && (
                <div className="space-y-5">
                    <Filters
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        moduleFilter={moduleFilter}
                        setModuleFilter={setModuleFilter}
                    />
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                        {content.map((item) => (
                            <div key={item.id} className="card p-6 space-y-4">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-2">
                                            #{item.id} / {item.module}{item.section ? ` / ${item.section}` : ''}
                                        </div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-white">{item.title}</h2>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.approved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-700'}`}>
                                        {item.approved ? 'Approved' : 'Review'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    <Meta label="Questions" value={item.question_count} />
                                    <Meta label="Band" value={item.estimated_band ?? '-'} />
                                    <Meta label="Time" value={item.time_limit_minutes ? `${item.time_limit_minutes}m` : '-'} />
                                    <Meta label="Source" value={item.source} />
                                </div>
                                {!item.approved && (
                                    <button
                                        disabled={isBusy}
                                        onClick={() => approveContent(item.id)}
                                        className="w-full py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs disabled:opacity-50"
                                    >
                                        Approve for Practice
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                    {content.length === 0 && <EmptyState text="No content matches the current filters." />}
                </div>
            )}

            {activeTab === 'import' && (
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
                    <div className="card p-5 space-y-4">
                        <div className="flex items-center justify-between gap-4">
                            <h2 className="text-xl font-black text-slate-900 dark:text-white">Import JSON</h2>
                            <button
                                disabled={isBusy}
                                onClick={importContent}
                                className="px-5 py-3 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs flex items-center gap-2 disabled:opacity-50"
                            >
                                <Upload className="w-4 h-4" />
                                Import
                            </button>
                        </div>
                        <textarea
                            value={jsonInput}
                            onChange={(event) => setJsonInput(event.target.value)}
                            spellCheck={false}
                            className="w-full min-h-[560px] rounded-xl bg-slate-950 text-slate-100 font-mono text-xs leading-relaxed p-4 border border-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="card p-5 h-fit space-y-4">
                        <h3 className="font-black text-slate-900 dark:text-white">Required shape</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                            Import expects an array of test sets. Keep `needs_review: true` for AI drafts or newly written content. Approved content is the only content used in practice.
                        </p>
                        <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                            <p><strong>Reading:</strong> provide `passage` and questions.</p>
                            <p><strong>Listening:</strong> provide `transcript`; `audio_url` can be added later.</p>
                            <p><strong>Question:</strong> `skill_id`, `question_text`, `question_type`, `correct_answer` are required.</p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'questions' && (
                <div className="space-y-5">
                    <Filters
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        moduleFilter={moduleFilter}
                        setModuleFilter={setModuleFilter}
                        hideStatus
                    />
                    <div className="card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800/70 text-[10px] uppercase tracking-widest text-slate-400">
                                    <tr>
                                        <th className="px-5 py-4">ID</th>
                                        <th className="px-5 py-4">Module</th>
                                        <th className="px-5 py-4">Type</th>
                                        <th className="px-5 py-4">Difficulty</th>
                                        <th className="px-5 py-4">Question</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {questions.map((question) => (
                                        <tr key={question.id} className="text-sm">
                                            <td className="px-5 py-4 font-black text-slate-400">#{question.id}</td>
                                            <td className="px-5 py-4 font-bold text-slate-700 dark:text-slate-200">{question.module}</td>
                                            <td className="px-5 py-4 text-blue-600 font-bold">{question.question_type}</td>
                                            <td className="px-5 py-4">{question.difficulty}</td>
                                            <td className="px-5 py-4 text-slate-600 dark:text-slate-300">{question.question_text}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value, detail }: { title: string; value: number; detail: string }) {
    return (
        <div className="card p-6">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">{title}</p>
            <p className="text-4xl font-black text-slate-900 dark:text-white">{value}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-2">{detail}</p>
        </div>
    );
}

function Meta({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-3">
            <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
            <div className="font-black text-slate-900 dark:text-white mt-1">{value}</div>
        </div>
    );
}

function EmptyState({ text }: { text: string }) {
    return (
        <div className="card p-12 text-center text-slate-500 dark:text-slate-400 font-bold">
            {text}
        </div>
    );
}

function Filters({
    statusFilter,
    setStatusFilter,
    moduleFilter,
    setModuleFilter,
    hideStatus = false,
}: {
    statusFilter: 'all' | 'pending' | 'approved';
    setStatusFilter: (value: 'all' | 'pending' | 'approved') => void;
    moduleFilter: 'ALL' | 'READING' | 'LISTENING';
    setModuleFilter: (value: 'ALL' | 'READING' | 'LISTENING') => void;
    hideStatus?: boolean;
}) {
    return (
        <div className="card p-4 flex flex-wrap items-center gap-2">
            {!hideStatus && (['pending', 'approved', 'all'] as const).map((item) => (
                <button
                    key={item}
                    onClick={() => setStatusFilter(item)}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest ${statusFilter === item
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500'
                        }`}
                >
                    {item}
                </button>
            ))}
            {(['ALL', 'READING', 'LISTENING'] as const).map((item) => (
                <button
                    key={item}
                    onClick={() => setModuleFilter(item)}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest ${moduleFilter === item
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-500'
                        }`}
                >
                    {item}
                </button>
            ))}
        </div>
    );
}
