'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, BarChart3, BookOpen, CheckCircle2, Clock, Target } from 'lucide-react';
import { api, type DiagnosticNext, type DiagnosticResult, type DiagnosticStatus } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type SubmitFeedback = {
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string | null;
};

const DIAGNOSTIC_CONTENT_ERROR = 'Reading diagnostic content is not ready yet. Please seed demo content or add approved Reading questions.';

export default function DiagnosticPage() {
    const { token, user, loading: authLoading, updateUser } = useAuth();
    const router = useRouter();
    const [status, setStatus] = useState<DiagnosticStatus | null>(null);
    const [current, setCurrent] = useState<DiagnosticNext | null>(null);
    const [result, setResult] = useState<DiagnosticResult | null>(null);
    const [selectedAnswer, setSelectedAnswer] = useState('');
    const [feedback, setFeedback] = useState<SubmitFeedback | null>(null);
    const [started, setStarted] = useState(false);
    const [startTime, setStartTime] = useState(Date.now());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        }
    }, [authLoading, router, user]);

    const loadResult = useCallback(async (authToken: string) => {
        const diagnosticResult = await api.getDiagnosticResult(authToken);
        setResult(diagnosticResult);
        setCurrent(null);
        setFeedback(null);
    }, []);

    const loadStatus = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const diagnosticStatus = await api.getDiagnosticStatus(token);
            setStatus(diagnosticStatus);
            if (diagnosticStatus.completed) {
                await loadResult(token);
            }
        } catch (err) {
            console.error(err);
            setError('Unable to load your diagnostic right now.');
        } finally {
            setLoading(false);
        }
    }, [loadResult, token]);

    useEffect(() => {
        if (token) {
            loadStatus();
        }
    }, [loadStatus, token]);

    const fetchNextQuestion = async () => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const next = await api.getDiagnosticNext(token);
            setCurrent(next);
            setSelectedAnswer('');
            setFeedback(null);
            setStarted(true);
            setStartTime(Date.now());
        } catch (err) {
            console.error(err);
            setError(DIAGNOSTIC_CONTENT_ERROR);
        } finally {
            setLoading(false);
        }
    };

    const startDiagnostic = async (restart = false) => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            const session = await api.startDiagnostic(token, restart);
            const diagnosticStatus = await api.getDiagnosticStatus(token);
            setStatus(diagnosticStatus);
            setResult(null);
            setStarted(true);
            if (session.completed) {
                await loadResult(token);
            } else {
                const next = await api.getDiagnosticNext(token);
                setCurrent(next);
                setSelectedAnswer('');
                setFeedback(null);
                setStartTime(Date.now());
            }
        } catch (err) {
            console.error(err);
            const message = err instanceof Error && err.message.includes('Reading diagnostic content')
                ? DIAGNOSTIC_CONTENT_ERROR
                : 'Unable to start your diagnostic right now.';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const submitAnswer = async () => {
        if (!token || !current || !selectedAnswer.trim()) return;
        setError(null);
        try {
            const submitted = await api.submitDiagnosticAnswer(
                token,
                current.question.id,
                selectedAnswer.trim(),
                Date.now() - startTime
            );
            setFeedback({
                isCorrect: submitted.is_correct,
                correctAnswer: submitted.correct_answer,
                explanation: submitted.explanation,
            });
            updateUser({
                xp: submitted.new_xp,
                level: submitted.new_level,
                current_streak: submitted.new_streak,
            });
            const updatedStatus = await api.getDiagnosticStatus(token);
            setStatus(updatedStatus);
        } catch (err) {
            console.error(err);
            setError('Unable to submit this answer. Please try again.');
        }
    };

    const continueDiagnostic = async () => {
        if (!token || !status) return;
        if (status.completed) {
            setLoading(true);
            try {
                await loadResult(token);
            } catch (err) {
                console.error(err);
                setError('Unable to load your diagnostic result.');
            } finally {
                setLoading(false);
            }
            return;
        }
        await fetchNextQuestion();
    };

    if (authLoading || !user || loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const target = status?.target || 10;
    const answered = status?.answered || 0;
    const hasDiagnosticSession = Boolean(status?.session_id);
    const activeQuestionNumber = Math.min(answered + (feedback ? 0 : 1), target);
    const weakest = result?.weak_skills[0];
    const weakestHref = weakest
        ? `/practice?module=READING&question_type=${encodeURIComponent(weakest.category)}`
        : '/practice?module=READING';

    if (error && !current && !result) {
        return (
            <div className="py-10">
                <div className="card p-8 max-w-2xl mx-auto text-center space-y-5">
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">Diagnostic unavailable</h1>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{error}</p>
                    <Link href="/dashboard" className="btn-primary inline-flex justify-center">
                        Back to dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (result) {
        return (
            <div className="py-8 space-y-6">
                <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-blue-600">
                    <ArrowLeft className="w-4 h-4" />
                    Back to dashboard
                </Link>

                <div className="card p-8 !rounded-2xl space-y-8">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-2">Reading Diagnostic</p>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white">Your initial skill profile</h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">{result.recommendation}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 min-w-[260px]">
                            <div className="rounded-xl bg-slate-50 dark:bg-slate-800 p-4">
                                <div className="text-xs font-black uppercase tracking-widest text-slate-400">Accuracy</div>
                                <div className="text-3xl font-black text-slate-900 dark:text-white">{Math.round(result.accuracy * 100)}%</div>
                            </div>
                            <div className="rounded-xl bg-blue-50 dark:bg-blue-900/20 p-4">
                                <div className="text-xs font-black uppercase tracking-widest text-blue-600">Band est.</div>
                                <div className="text-3xl font-black text-blue-700 dark:text-blue-300">{result.estimated_reading_band.toFixed(1)}</div>
                            </div>
                        </div>
                    </div>
                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                        This is an estimated Reading profile based on your diagnostic session, not an official IELTS score.
                    </p>

                    <div className="space-y-3">
                        <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                            <Target className="w-5 h-5 text-blue-600" />
                            Weak areas to improve first
                        </h2>
                        {result.weak_skills.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {result.weak_skills.map((skill) => (
                                    <div key={skill.skill_id} className="rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-4">
                                        <div className="text-[10px] font-black uppercase tracking-widest text-blue-600">{skill.category}</div>
                                        <div className="font-black text-slate-900 dark:text-white mt-1">{skill.skill_name}</div>
                                        <div className="text-xs font-bold text-slate-500 mt-2">
                                            {Math.round(skill.mastery_probability * 100)}% mastery - {Math.round(skill.accuracy_rate * 100)}% accuracy
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Answer more Reading diagnostic questions to generate weak areas.
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                        <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl px-5 py-3 text-sm font-black">
                            Go to Today&apos;s Plan
                            <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href={weakestHref} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300">
                            Practice weakest skill
                        </Link>
                        <Link href="/review" className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                            Review mistakes
                        </Link>
                        <button onClick={() => startDiagnostic(true)} className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-black border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200">
                            Retake diagnostic
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!started && !current) {
        return (
            <div className="py-10">
                <div className="card p-8 !rounded-2xl max-w-3xl mx-auto space-y-8">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                            <BookOpen className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-2">
                                {hasDiagnosticSession ? 'Diagnostic in progress' : 'New learner setup'}
                            </p>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white">
                                {hasDiagnosticSession ? 'Resume Reading Diagnostic' : 'Welcome to IELTS JANA'}
                            </h1>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">
                                {hasDiagnosticSession
                                    ? 'Pick up where you left off and finish your first Reading skill profile.'
                                    : "Let's find your Reading weak spots first."}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
                            <Clock className="w-5 h-5 text-blue-600 mb-3" />
                            <div className="text-sm font-black text-slate-900 dark:text-white">10-question Reading Diagnostic</div>
                            <div className="text-xs font-bold text-slate-500">Estimated time: 10 minutes</div>
                        </div>
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
                            <Target className="w-5 h-5 text-blue-600 mb-3" />
                            <div className="text-sm font-black text-slate-900 dark:text-white">Personalized weak skill profile</div>
                            <div className="text-xs font-bold text-slate-500">{answered}/{target} questions completed</div>
                        </div>
                        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-4">
                            <BarChart3 className="w-5 h-5 text-blue-600 mb-3" />
                            <div className="text-sm font-black text-slate-900 dark:text-white">Today&apos;s Plan based on your result</div>
                            <div className="text-xs font-bold text-slate-500">Practice weak skills next</div>
                        </div>
                    </div>

                    <button onClick={() => startDiagnostic()} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl px-6 py-4 text-sm font-black hover:bg-blue-700 transition">
                        {hasDiagnosticSession ? 'Resume Reading Diagnostic' : 'Start Reading Diagnostic'}
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    }

    const question = current?.question;
    const isChoiceQuestion = Boolean(question?.options?.length);

    return (
        <div className="py-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-2">Reading Diagnostic</p>
                    <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                        Question {activeQuestionNumber} / {target}
                    </h1>
                </div>
                <div className="w-full md:w-64 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-600" style={{ width: `${Math.min((answered / target) * 100, 100)}%` }} />
                </div>
            </div>

            {error && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 dark:bg-rose-900/10 dark:border-rose-900/40 px-4 py-3 text-sm font-bold text-rose-700 dark:text-rose-300">
                    {error}
                </div>
            )}

            {question && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-7 card p-7 !rounded-2xl">
                        {question.passage_title && (
                            <h2 className="text-xl font-black text-slate-900 dark:text-white mb-5">{question.passage_title}</h2>
                        )}
                        <p className="text-slate-700 dark:text-slate-300 leading-8 whitespace-pre-line font-medium">
                            {question.passage}
                        </p>
                    </div>

                    <div className="lg:col-span-5 card p-7 !rounded-2xl space-y-6 self-start">
                        <div>
                            <div className="inline-flex rounded-lg bg-blue-50 dark:bg-blue-900/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-blue-700 dark:text-blue-300 mb-3">
                                {question.question_type}
                            </div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white leading-snug">{question.question_text}</h2>
                        </div>

                        <div className="space-y-3">
                            {isChoiceQuestion ? question.options?.map((option, index) => (
                                <button
                                    key={`${option}-${index}`}
                                    disabled={Boolean(feedback)}
                                    onClick={() => setSelectedAnswer(option)}
                                    className={`w-full text-left rounded-xl border-2 p-4 font-bold transition ${selectedAnswer === option
                                            ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100'
                                            : 'border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:border-blue-200'
                                        } ${feedback ? 'cursor-not-allowed opacity-80' : ''}`}
                                >
                                    {String.fromCharCode(65 + index)}. {option}
                                </button>
                            )) : (
                                <input
                                    value={selectedAnswer}
                                    disabled={Boolean(feedback)}
                                    onChange={(event) => setSelectedAnswer(event.target.value)}
                                    className="w-full px-5 py-4 rounded-xl border-2 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-bold outline-none focus:border-blue-600"
                                    placeholder="Type your answer"
                                />
                            )}
                        </div>

                        {feedback ? (
                            <div className="space-y-4">
                                <div className={`rounded-xl p-4 border ${feedback.isCorrect ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                                    <div className="font-black">{feedback.isCorrect ? 'Correct' : 'Incorrect'}</div>
                                    <div className="text-sm font-bold mt-1">Correct answer: {feedback.correctAnswer}</div>
                                    {feedback.explanation && <p className="text-sm mt-2 leading-relaxed">{feedback.explanation}</p>}
                                </div>
                                <button onClick={continueDiagnostic} className="w-full inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl px-5 py-4 text-sm font-black">
                                    {status?.completed ? 'See results' : 'Next question'}
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={submitAnswer}
                                disabled={!selectedAnswer.trim()}
                                className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-black transition ${selectedAnswer.trim()
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                                    }`}
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Submit answer
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
