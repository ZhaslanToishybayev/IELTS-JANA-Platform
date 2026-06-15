'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, CheckCircle2, Headphones, Mic2, PenTool, Play, ShieldCheck } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type MockStatus = 'INTRO' | 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING' | 'COMPLETED';

type MockQuestion = {
    id: number;
    text: string;
    type: string;
    options: string[] | null;
    passage?: string;
    passage_title?: string;
    audio_url?: string | null;
    section?: string | null;
};

const SECTION_SECONDS: Record<Exclude<MockStatus, 'INTRO' | 'COMPLETED'>, number> = {
    LISTENING: 30 * 60,
    READING: 60 * 60,
    WRITING: 60 * 60,
    SPEAKING: 14 * 60,
};

const WRITING_PROMPT = 'Some people believe that online learning can replace classroom learning. To what extent do you agree or disagree?';
const SPEAKING_PROMPT = 'Part 2: Describe a skill you would like to learn. Explain what the skill is, why you want to learn it, and how it could help you in the future.';

export default function MockExamPage() {
    const { user, token, loading } = useAuth();
    const router = useRouter();
    const [status, setStatus] = useState<MockStatus>('INTRO');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [writingText, setWritingText] = useState('');
    const [speakingText, setSpeakingText] = useState('');
    const [listeningQuestions, setListeningQuestions] = useState<MockQuestion[]>([]);
    const [readingQuestions, setReadingQuestions] = useState<MockQuestion[]>([]);
    const [results, setResults] = useState<Awaited<ReturnType<typeof api.getMockResults>> | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!loading && !user) router.push('/login');
    }, [loading, router, user]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const startTest = async () => {
        if (!token) return;
        setIsSubmitting(true);
        setError(null);
        try {
            const session = await api.startMockExam(token);
            const [listening, reading] = await Promise.all([
                api.getMockQuestions(token, 'LISTENING', 12, session.id),
                api.getMockQuestions(token, 'READING', 12, session.id),
            ]);
            setSessionId(session.id);
            setListeningQuestions(listening.questions);
            setReadingQuestions(reading.questions);
            setAnswers({});
            setStatus('LISTENING');
            setTimeLeft(SECTION_SECONDS.LISTENING);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to start mock test');
        } finally {
            setIsSubmitting(false);
        }
    };

    const submitSection = useCallback(async () => {
        if (!token || !sessionId || isSubmitting) return;
        setIsSubmitting(true);
        setError(null);
        try {
            if (status === 'LISTENING') {
                await api.submitMockListening(token, sessionId, answers);
                setAnswers({});
                setStatus('READING');
                setTimeLeft(SECTION_SECONDS.READING);
            } else if (status === 'READING') {
                await api.submitMockReading(token, sessionId, answers);
                setAnswers({});
                setStatus('WRITING');
                setTimeLeft(SECTION_SECONDS.WRITING);
            } else if (status === 'WRITING') {
                await api.submitMockWriting(token, sessionId, writingText);
                setStatus('SPEAKING');
                setTimeLeft(SECTION_SECONDS.SPEAKING);
            } else if (status === 'SPEAKING') {
                await api.submitMockSpeaking(token, sessionId, speakingText);
                const finalResults = await api.getMockResults(token, sessionId);
                setResults(finalResults);
                setStatus('COMPLETED');
                setTimeLeft(0);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error submitting section');
        } finally {
            setIsSubmitting(false);
        }
    }, [answers, isSubmitting, sessionId, speakingText, status, token, writingText]);

    useEffect(() => {
        if (status === 'INTRO' || status === 'COMPLETED' || !sessionId) return;
        const timer = setInterval(() => {
            setTimeLeft((current) => {
                if (current <= 1) {
                    window.clearInterval(timer);
                    submitSection();
                    return 0;
                }
                return current - 1;
            });
        }, 1000);
        return () => window.clearInterval(timer);
    }, [sessionId, status, submitSection]);

    const playListening = () => {
        const transcript = listeningQuestions[0]?.passage || '';
        if (!transcript || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(transcript);
        utterance.rate = 0.92;
        window.speechSynthesis.speak(utterance);
    };

    const currentQuestions = status === 'LISTENING' ? listeningQuestions : readingQuestions;
    const answeredCount = useMemo(() => currentQuestions.filter((question) => answers[`q_${question.id}`]?.trim()).length, [answers, currentQuestions]);

    if (loading || !user) return null;

    return (
        <div className="py-6 space-y-6">
            {status !== 'INTRO' && status !== 'COMPLETED' && (
                <div className="card p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 sticky top-4 z-30">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">IELTS Mock Test</p>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white">{status}</h1>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        {(status === 'LISTENING' || status === 'READING') && (
                            <span className="px-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 font-black text-slate-600 dark:text-slate-300">
                                {answeredCount}/{currentQuestions.length} answered
                            </span>
                        )}
                        <span className={`px-4 py-2 rounded-xl font-mono font-black ${timeLeft < 300 ? 'bg-rose-50 text-rose-600' : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </div>
            )}

            {error && (
                <div className="card p-4 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 font-bold">
                    {error}
                </div>
            )}

            {status === 'INTRO' && (
                <div className="card p-8 md:p-12 space-y-8">
                    <div className="max-w-3xl">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-6">
                            <ShieldCheck className="w-7 h-7" />
                        </div>
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4">Full IELTS Mock Test</h1>
                        <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed">
                            This run locks a real question set to your session, scores unanswered questions as wrong, records mistakes, and updates your progress.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <SectionCard icon={Headphones} title="Listening" detail="30 minutes" />
                        <SectionCard icon={BookOpen} title="Reading" detail="60 minutes" />
                        <SectionCard icon={PenTool} title="Writing" detail="60 minutes" />
                        <SectionCard icon={Mic2} title="Speaking" detail="14 minutes" />
                    </div>
                    <button
                        onClick={startTest}
                        disabled={isSubmitting}
                        className="px-8 py-4 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs disabled:opacity-50"
                    >
                        {isSubmitting ? 'Starting...' : 'Start Test'}
                    </button>
                </div>
            )}

            {status === 'LISTENING' && (
                <SectionShell
                    title="Listening Section"
                    description="Play the audio once, then answer every question. Transcript is hidden during the test."
                    action={(
                        <button onClick={playListening} className="px-5 py-3 rounded-xl bg-blue-600 text-white font-black flex items-center gap-2">
                            <Play className="w-4 h-4" />
                            Play Audio
                        </button>
                    )}
                >
                    <QuestionList questions={listeningQuestions} answers={answers} setAnswers={setAnswers} />
                    <SubmitButton label="Submit Listening" onClick={submitSection} disabled={isSubmitting || listeningQuestions.length === 0} />
                </SectionShell>
            )}

            {status === 'READING' && (
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_520px] gap-6">
                    <div className="card p-8 max-h-[calc(100vh-180px)] overflow-y-auto">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-3">Reading Passage</p>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-6">{readingQuestions[0]?.passage_title || 'Passage'}</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-8 whitespace-pre-line">{readingQuestions[0]?.passage || 'No passage available.'}</p>
                    </div>
                    <div className="space-y-5">
                        <QuestionList questions={readingQuestions} answers={answers} setAnswers={setAnswers} />
                        <SubmitButton label="Submit Reading" onClick={submitSection} disabled={isSubmitting || readingQuestions.length === 0} />
                    </div>
                </div>
            )}

            {status === 'WRITING' && (
                <SectionShell title="Writing Task 2" description={WRITING_PROMPT}>
                    <textarea
                        value={writingText}
                        onChange={(event) => setWritingText(event.target.value)}
                        className="w-full min-h-[480px] card p-5 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 leading-8"
                        placeholder="Write your essay here..."
                    />
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500">{writingText.split(/\s+/).filter(Boolean).length} words</span>
                        <SubmitButton label="Submit Writing" onClick={submitSection} disabled={isSubmitting} compact />
                    </div>
                </SectionShell>
            )}

            {status === 'SPEAKING' && (
                <SectionShell title="Speaking Simulation" description={SPEAKING_PROMPT}>
                    <textarea
                        value={speakingText}
                        onChange={(event) => setSpeakingText(event.target.value)}
                        className="w-full min-h-[320px] card p-5 text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500 leading-8"
                        placeholder="Record yourself externally or type a transcript of your answer here..."
                    />
                    <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-500">{speakingText.split(/\s+/).filter(Boolean).length} words</span>
                        <SubmitButton label="Finish Test" onClick={submitSection} disabled={isSubmitting} compact />
                    </div>
                </SectionShell>
            )}

            {status === 'COMPLETED' && results && (
                <div className="card p-8 md:p-12 space-y-8">
                    <div className="text-center">
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white">Mock Test Completed</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Scores are deterministic from your submitted answers.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        <ScoreCard title="Overall" value={results.scores.overall} />
                        <ScoreCard title="Listening" value={results.scores.listening} detail={rawDetail(results.scores.listening_raw)} />
                        <ScoreCard title="Reading" value={results.scores.reading} detail={rawDetail(results.scores.reading_raw)} />
                        <ScoreCard title="Writing" value={results.scores.writing} detail={`${results.scores.writing_raw?.words ?? 0} words`} />
                        <ScoreCard title="Speaking" value={results.scores.speaking} detail={`${results.scores.speaking_raw?.words ?? 0} words`} />
                    </div>
                    <div className="flex justify-center">
                        <button onClick={() => router.push('/review')} className="px-6 py-3 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-xs">
                            Review Mistakes
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function SectionShell({ title, description, action, children }: { title: string; description: string; action?: ReactNode; children: ReactNode }) {
    return (
        <div className="space-y-5">
            <div className="card p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h2>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">{description}</p>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

function QuestionList({ questions, answers, setAnswers }: { questions: MockQuestion[]; answers: Record<string, string>; setAnswers: Dispatch<SetStateAction<Record<string, string>>> }) {
    return (
        <div className="space-y-4">
            {questions.map((question, index) => (
                <div key={question.id} className="card p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                        <h3 className="font-black text-slate-900 dark:text-white leading-snug">{index + 1}. {question.text}</h3>
                        <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-[10px] font-black uppercase tracking-widest">
                            {question.type}
                        </span>
                    </div>
                    {question.options?.length ? (
                        <div className="space-y-2">
                            {question.options.map((option) => (
                                <label key={option} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                                    <input
                                        type="radio"
                                        name={`q_${question.id}`}
                                        value={option}
                                        checked={answers[`q_${question.id}`] === option}
                                        onChange={(event) => setAnswers((current) => ({ ...current, [`q_${question.id}`]: event.target.value }))}
                                        className="w-4 h-4 accent-blue-600"
                                    />
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">{option}</span>
                                </label>
                            ))}
                        </div>
                    ) : (
                        <input
                            value={answers[`q_${question.id}`] || ''}
                            onChange={(event) => setAnswers((current) => ({ ...current, [`q_${question.id}`]: event.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Type your answer"
                        />
                    )}
                </div>
            ))}
            {questions.length === 0 && (
                <div className="card p-8 text-center text-slate-500 font-bold">No approved questions available for this section.</div>
            )}
        </div>
    );
}

function SubmitButton({ label, onClick, disabled, compact = false }: { label: string; onClick: () => void; disabled: boolean; compact?: boolean }) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`${compact ? 'px-6' : 'w-full'} py-4 rounded-xl bg-blue-600 text-white font-black uppercase tracking-widest text-xs disabled:opacity-50`}
        >
            {disabled ? 'Please wait...' : label}
        </button>
    );
}

function SectionCard({ icon: Icon, title, detail }: { icon: LucideIcon; title: string; detail: string }) {
    return (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-4">
            <Icon className="w-5 h-5 text-blue-600 mb-3" />
            <p className="font-black text-slate-900 dark:text-white">{title}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{detail}</p>
        </div>
    );
}

function ScoreCard({ title, value, detail }: { title: string; value: number; detail?: string }) {
    return (
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/70 p-5 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">{title}</p>
            <p className="text-3xl font-black text-slate-900 dark:text-white">{value || 0}</p>
            {detail && <p className="text-xs font-bold text-slate-500 mt-2">{detail}</p>}
        </div>
    );
}

function rawDetail(raw?: { correct: number; total: number }) {
    if (!raw) return '0/0 correct';
    return `${raw.correct}/${raw.total} correct`;
}
