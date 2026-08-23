'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import {
    Headphones,
    BookOpen,
    PenTool,
    Mic,
    Clock,
    CheckCircle2,
    ChevronRight,
    Trophy,
    ArrowLeft,
    Play,
    Pause,
    RotateCcw,
    AlertCircle,
    FileText,
} from 'lucide-react';
import { formatTime } from '@/lib/utils';
import type { MockSessionResult } from '@/lib/api';

type Section = 'LISTENING' | 'READING' | 'WRITING' | 'SPEAKING';
type Phase = 'LANDING' | 'PREP' | 'TEST' | 'REVIEW' | 'RESULTS';

interface SectionConfig {
    id: Section;
    title: string;
    icon: React.ElementType;
    duration: number;
    description: string;
    bgLight: string;
    bgDark: string;
    text: string;
}

const SECTIONS: SectionConfig[] = [
    { id: 'LISTENING', title: 'Listening', icon: Headphones, duration: 30 * 60, description: '4 sections, 40 questions. Audio played once only.', bgLight: 'bg-blue-50', bgDark: 'dark:bg-blue-900/20', text: 'text-blue-600' },
    { id: 'READING', title: 'Reading', icon: BookOpen, duration: 60 * 60, description: '3 passages, 40 questions. No extra time for transfer.', bgLight: 'bg-purple-50', bgDark: 'dark:bg-purple-900/20', text: 'text-purple-600' },
    { id: 'WRITING', title: 'Writing', icon: PenTool, duration: 60 * 60, description: 'Task 1 (20 min) + Task 2 (40 min). Min 150/250 words.', bgLight: 'bg-amber-50', bgDark: 'dark:bg-amber-900/20', text: 'text-amber-600' },
    { id: 'SPEAKING', title: 'Speaking', icon: Mic, duration: 14 * 60, description: 'Part 1 (4-5 min) + Part 2 (3-4 min) + Part 3 (4-5 min).', bgLight: 'bg-rose-50', bgDark: 'dark:bg-rose-900/20', text: 'text-rose-600' },
];

interface MockTestProps {
    standalone?: boolean; // true = individual section mode, false = full test
    initialSection?: Section;
}

export default function MockTestPage({ standalone = true, initialSection }: MockTestProps) {
    const { user, token, loading: authLoading } = useAuth();
    const [phase, setPhase] = useState<Phase>('LANDING');
    const [activeSection, setActiveSection] = useState<Section | null>(initialSection || null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [allResults, setAllResults] = useState<Record<Section, any>>({} as any);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Timer
    useEffect(() => {
        if (phase !== 'TEST' || isPaused || timeLeft <= 0) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(t => {
                if (t <= 1) {
                    handleSubmit();
                    return 0;
                }
                return t - 1;
            });
        }, 1000);
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [phase, isPaused, timeLeft]);

    const startSection = useCallback(async (section: Section) => {
        if (!token) return;
        setLoading(true);
        setError(null);
        try {
            // Create or resume session
            if (!sessionId) {
                const session = await api.startMockExam(token);
                setSessionId(session.id);
            }

            // Fetch questions for this section
            const data = await api.getMockQuestions(token, section, section === 'LISTENING' ? 40 : section === 'READING' ? 40 : 2, sessionId || undefined);
            setQuestions(data.questions || []);
            setAnswers({});
            setActiveSection(section);
            const config = SECTIONS.find(s => s.id === section)!;
            setTimeLeft(config.duration);
            setIsPaused(false);
            setPhase('PREP');
        } catch (err: any) {
            setError(err.message || 'Failed to start section');
        } finally {
            setLoading(false);
        }
    }, [token, sessionId]);

    const beginTest = () => setPhase('TEST');

    const setAnswer = (questionId: number, answer: string) => {
        setAnswers(prev => ({ ...prev, [questionId]: answer }));
    };

    const handleSubmit = useCallback(async () => {
        if (!token || !activeSection || !sessionId) return;
        if (timerRef.current) clearInterval(timerRef.current);

        setLoading(true);
        try {
            let res: MockSessionResult | undefined;
            if (activeSection === 'LISTENING') {
                const answerDict: Record<string, string> = {};
                Object.entries(answers).forEach(([qid, ans]) => { answerDict[`q_${qid}`] = ans; });
                res = await api.submitMockListening(token, sessionId, answerDict);
            } else if (activeSection === 'READING') {
                const answerDict: Record<string, string> = {};
                Object.entries(answers).forEach(([qid, ans]) => { answerDict[`q_${qid}`] = ans; });
                res = await api.submitMockReading(token, sessionId, answerDict);
            } else if (activeSection === 'WRITING') {
                const essayText = Object.values(answers).join('\n\n');
                res = await api.submitMockWriting(token, sessionId, essayText);
            } else if (activeSection === 'SPEAKING') {
                const transcript = Object.values(answers).join('\n\n');
                res = await api.submitMockSpeaking(token, sessionId, transcript);
            }
            setResult(res);
            setAllResults(prev => ({ ...prev, [activeSection]: res }));
            setPhase('REVIEW');
        } catch (err: any) {
            setError(err.message || 'Failed to submit');
        } finally {
            setLoading(false);
        }
    }, [token, activeSection, sessionId, answers]);

    const goToLanding = () => {
        setPhase('LANDING');
        setActiveSection(null);
        setResult(null);
        setQuestions([]);
        setAnswers({});
    };

    const goToNextSection = () => {
        const currentIdx = SECTIONS.findIndex(s => s.id === activeSection);
        const nextSection = SECTIONS[currentIdx + 1];
        if (nextSection && standalone) {
            goToLanding();
        } else if (nextSection) {
            startSection(nextSection.id);
        } else {
            setPhase('RESULTS');
        }
    };

    if (authLoading) {
        return <div className="min-h-[60vh] flex items-center justify-center"><div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
    }
    if (!user) return null;

    return (
        <div className="pb-24 max-w-6xl mx-auto px-4 md:px-0">
            <AnimatePresence mode="wait">
                {phase === 'LANDING' && (
                    <motion.div key="landing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <div className="space-y-2 py-6 mb-10">
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                                <Trophy className="w-10 h-10 text-amber-500" />
                                IELTS Mock Test
                            </h1>
                            <p className="text-slate-500 font-medium tracking-tight">Take a full practice test under real IELTS conditions.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {SECTIONS.map((section) => {
                                const Icon = section.icon;
                                const completed = !!allResults[section.id];
                                return (
                                    <motion.button
                                        key={section.id}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={() => startSection(section.id)}
                                        disabled={loading}
                                        className={`card p-8 text-left relative overflow-hidden group ${completed ? 'ring-2 ring-emerald-500' : ''}`}
                                    >
                                        <div className="flex items-start justify-between mb-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${section.bgLight} ${section.bgDark}`}>
                                                <Icon className={`w-7 h-7 ${section.text}`} />
                                            </div>
                                            {completed ? (
                                                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-slate-400">
                                                    <Clock className="w-4 h-4" />
                                                    <span className="text-xs font-bold">{formatTime(section.duration)}</span>
                                                </div>
                                            )}
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{section.title}</h3>
                                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{section.description}</p>
                                        <div className="mt-6 flex items-center gap-2 text-sm font-bold text-blue-600">
                                            {completed ? 'Retake Section' : 'Start Section'}
                                            <ChevronRight className="w-4 h-4" />
                                        </div>
                                        {completed && allResults[section.id]?.scores?.[section.title.toLowerCase()] && (
                                            <div className="mt-3 text-sm font-black text-emerald-600">
                                                Band: {allResults[section.id].scores[section.title.toLowerCase()]}
                                            </div>
                                        )}
                                    </motion.button>
                                );
                            })}
                        </div>

                        {Object.keys(allResults).length > 0 && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8">
                                <button onClick={() => setPhase('RESULTS')} className="w-full card p-6 text-center hover:bg-slate-50 dark:hover:bg-slate-800/80 transition">
                                    <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                                    <span className="font-black text-slate-900 dark:text-white">View Overall Results</span>
                                </button>
                            </motion.div>
                        )}
                    </motion.div>
                )}

                {phase === 'PREP' && activeSection && (
                    <motion.div key="prep" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <PrepScreen section={activeSection} onStart={beginTest} onBack={goToLanding} />
                    </motion.div>
                )}

                {phase === 'TEST' && activeSection && (
                    <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <TestScreen
                            section={activeSection}
                            questions={questions}
                            answers={answers}
                            setAnswer={setAnswer}
                            timeLeft={timeLeft}
                            isPaused={isPaused}
                            setIsPaused={setIsPaused}
                            onSubmit={handleSubmit}
                            loading={loading}
                            error={error}
                        />
                    </motion.div>
                )}

                {phase === 'REVIEW' && activeSection && result && (
                    <motion.div key="review" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <ReviewScreen section={activeSection} result={result} onContinue={goToNextSection} onBack={goToLanding} />
                    </motion.div>
                )}

                {phase === 'RESULTS' && (
                    <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                        <ResultsScreen results={allResults} onBack={goToLanding} />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ========== PREP SCREEN ==========
function PrepScreen({ section, onStart, onBack }: { section: Section; onStart: () => void; onBack: () => void }) {
    const config = SECTIONS.find(s => s.id === section)!;
    const Icon = config.icon;

    const instructions: Record<Section, string[]> = {
        LISTENING: [
            'The audio will be played only once.',
            'Write your answers while listening.',
            'Transfer answers to the answer sheet before time runs out.',
            'You will hear a variety of accents (British, Australian, American).',
        ],
        READING: [
            'Read each passage carefully before answering.',
            'There is NO extra time to transfer answers.',
            'Manage your time: ~20 minutes per passage.',
            'Answer ALL questions — no penalty for wrong answers.',
        ],
        WRITING: [
            'Task 1: Write at least 150 words describing a graph/chart/process. (20 min)',
            'Task 2: Write at least 250 words on an essay topic. (40 min)',
            'Plan before writing. Organize into paragraphs.',
            'Spend 3-5 minutes reviewing your work.',
        ],
        SPEAKING: [
            'Part 1: General questions about yourself (4-5 min).',
            'Part 2: Long turn — speak for 1-2 min on a cue card topic.',
            'Part 3: Abstract discussion related to Part 2 topic (4-5 min).',
            'Speak clearly and extend your answers with examples.',
        ],
    };

    return (
        <div className="max-w-2xl mx-auto py-10">
            <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 mb-8 transition">
                <ArrowLeft className="w-4 h-4" /> Back to sections
            </button>

            <div className="card p-10 text-center mb-8">
                <div className={`w-20 h-20 rounded-3xl mx-auto mb-6 flex items-center justify-center ${config.bgLight} ${config.bgDark}`}>
                    <Icon className={`w-10 h-10 ${config.text}`} />
                </div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">{config.title} Section</h2>
                <div className="flex items-center justify-center gap-2 text-slate-500 mb-6">
                    <Clock className="w-4 h-4" />
                    <span className="font-bold">{formatTime(config.duration)} time limit</span>
                </div>
            </div>

            <div className="card p-8 mb-8">
                <h3 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    Important Instructions
                </h3>
                <ul className="space-y-3">
                    {instructions[section].map((inst, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-400">
                            <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black text-slate-500 shrink-0 mt-0.5">{i + 1}</span>
                            {inst}
                        </li>
                    ))}
                </ul>
            </div>

            <button onClick={onStart} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                <Play className="w-5 h-5" />
                Begin {config.title} Section
            </button>
        </div>
    );
}

// ========== TEST SCREEN ==========
function TestScreen({ section, questions, answers, setAnswer, timeLeft, isPaused, setIsPaused, onSubmit, loading, error }: {
    section: Section;
    questions: any[];
    answers: Record<number, string>;
    setAnswer: (id: number, answer: string) => void;
    timeLeft: number;
    isPaused: boolean;
    setIsPaused: (paused: boolean) => void;
    onSubmit: () => void;
    loading: boolean;
    error: string | null;
}) {
    const config = SECTIONS.find(s => s.id === section)!;
    const answeredCount = Object.keys(answers).length;
    const pct = Math.round((answeredCount / Math.max(questions.length, 1)) * 100);

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Top Bar */}
            <div className="card p-4 mb-4 flex items-center justify-between sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
                <div className="flex items-center gap-4">
                    <h3 className="font-black text-slate-900 dark:text-white">{config.title}</h3>
                    <span className="text-sm text-slate-500 font-bold">{answeredCount}/{questions.length} answered</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className={`flex items-center gap-2 font-mono text-lg font-black ${timeLeft < 300 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                        <Clock className="w-5 h-5" />
                        {formatTime(timeLeft)}
                    </div>
                    <button onClick={() => setIsPaused(!isPaused)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 overflow-hidden">
                <motion.div className="h-full bg-blue-600 rounded-full" animate={{ width: `${pct}%` }} />
            </div>

            {/* Questions */}
            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                {questions.map((q, idx) => (
                    <QuestionCard
                        key={q.id}
                        question={q}
                        index={idx}
                        answer={answers[q.id] || ''}
                        onAnswer={(ans) => setAnswer(q.id, ans)}
                        section={section}
                    />
                ))}
            </div>

            {/* Submit */}
            <div className="card p-4 mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-500 font-bold">
                    {answeredCount < questions.length
                        ? `${questions.length - answeredCount} questions remaining`
                        : 'All questions answered'}
                </span>
                <button
                    onClick={onSubmit}
                    disabled={loading || answeredCount === 0}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl transition shadow-lg shadow-blue-600/20"
                >
                    {loading ? 'Submitting...' : 'Submit Section'}
                </button>
            </div>

            {error && <div className="card p-4 mt-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 text-sm">{error}</div>}
        </div>
    );
}

// ========== QUESTION CARD ==========
function QuestionCard({ question, index, answer, onAnswer, section }: {
    question: any;
    index: number;
    answer: string;
    onAnswer: (answer: string) => void;
    section: Section;
}) {
    const options: string[] = question.options || [];
    const isTFNG = question.type === 'TF_NG';
    const isMCQ = question.type === 'MCQ' || options.length > 0;
    const isHeadings = question.type === 'HEADINGS';
    const isListening = section === 'LISTENING';

    return (
        <div className="card p-6">
            <div className="flex items-start gap-3 mb-4">
                <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-sm font-black text-blue-600 shrink-0">
                    {index + 1}
                </span>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{question.type?.replace(/_/g, ' ')}</span>
                        {isListening && <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded-full">Listen once</span>}
                    </div>
                    <p className="text-slate-900 dark:text-white font-medium leading-relaxed">{question.text}</p>
                </div>
            </div>

            {/* MCQ Options */}
            {isMCQ && !isTFNG && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 ml-11">
                    {options.map((opt: string, i: number) => {
                        const letter = String.fromCharCode(65 + i);
                        const isSelected = answer === letter || answer === opt;
                        return (
                            <button
                                key={i}
                                onClick={() => onAnswer(letter)}
                                className={`text-left p-4 rounded-xl border-2 transition font-medium text-sm ${
                                    isSelected
                                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                                }`}
                            >
                                <span className="font-black mr-2">{letter}.</span> {opt}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* TF/NG Options */}
            {isTFNG && (
                <div className="flex gap-3 ml-11">
                    {['TRUE', 'FALSE', 'NOT GIVEN'].map((opt) => (
                        <button
                            key={opt}
                            onClick={() => onAnswer(opt)}
                            className={`px-6 py-3 rounded-xl border-2 transition font-black text-sm ${
                                answer === opt
                                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'
                            }`}
                        >
                            {opt}
                        </button>
                    ))}
                </div>
            )}

            {/* Free Text Input */}
            {!isMCQ && !isTFNG && (
                <div className="ml-11">
                    <input
                        type="text"
                        value={answer}
                        onChange={(e) => onAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition"
                    />
                </div>
            )}
        </div>
    );
}

// ========== REVIEW SCREEN ==========
function ReviewScreen({ section, result, onContinue, onBack }: { section: Section; result: any; onContinue: () => void; onBack: () => void }) {
    const config = SECTIONS.find(s => s.id === section)!;
    const scores = result?.scores || {};
    const sectionScore = scores[section.toLowerCase()] || scores.listening || scores.reading || 0;
    const raw = result?.[`${section.toLowerCase()}_raw`] || {};

    return (
        <div className="max-w-2xl mx-auto py-10 text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="card p-12 mb-8">
                <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-6" />
                <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{config.title} Complete!</h2>
                <div className="text-6xl font-black text-blue-600 my-6">{typeof sectionScore === 'number' ? sectionScore.toFixed(1) : sectionScore}</div>
                <p className="text-slate-500 font-medium">Your estimated band score</p>

                {raw.correct !== undefined && (
                    <div className="mt-6 flex items-center justify-center gap-8 text-sm">
                        <div><span className="font-black text-slate-900 dark:text-white text-lg">{raw.correct}</span> <span className="text-slate-500">correct</span></div>
                        <div><span className="font-black text-slate-900 dark:text-white text-lg">{raw.total}</span> <span className="text-slate-500">total</span></div>
                        <div><span className="font-black text-slate-900 dark:text-white text-lg">{raw.total ? Math.round(raw.correct / raw.total * 100) : 0}%</span> <span className="text-slate-500">accuracy</span></div>
                    </div>
                )}

                {result?.writing_raw && (
                    <div className="mt-6 text-sm text-slate-500">
                        <span className="font-bold">{result.writing_raw.words} words</span>
                        {result.writing_raw.feedback && <p className="mt-2 text-left max-w-md mx-auto">{result.writing_raw.feedback}</p>}
                    </div>
                )}

                {result?.speaking_raw && (
                    <div className="mt-6 text-sm text-slate-500">
                        <span className="font-bold">{result.speaking_raw.words} words spoken</span>
                    </div>
                )}
            </motion.div>

            <div className="flex gap-4 justify-center">
                <button onClick={onBack} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl transition">
                    Back to Sections
                </button>
                <button onClick={onContinue} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition shadow-lg shadow-blue-600/20">
                    Continue
                </button>
            </div>
        </div>
    );
}

// ========== RESULTS SCREEN ==========
function ResultsScreen({ results, onBack }: { results: Record<Section, any>; onBack: () => void }) {
    const sectionEntries = Object.entries(results) as [Section, any][];
    const scores = sectionEntries.map(([sec, res]) => {
        const s = res?.scores || {};
        return {
            section: sec,
            band: s[sec.toLowerCase()] || s.listening || s.reading || 0,
            config: SECTIONS.find(s2 => s2.id === sec)!,
        };
    });
    const overall = scores.length > 0
        ? (scores.reduce((sum, s) => sum + (typeof s.band === 'number' ? s.band : 0), 0) / scores.length).toFixed(1)
        : '—';

    return (
        <div className="max-w-3xl mx-auto py-10">
            <div className="text-center mb-10">
                <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2">Mock Test Results</h1>
                <p className="text-slate-500 font-medium">Your IELTS estimated performance</p>
            </div>

            <div className="card p-10 text-center mb-8">
                <div className="text-7xl font-black text-blue-600 mb-2">{overall}</div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">Overall Estimated Band</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {scores.map(({ section, band, config }) => {
                    const Icon = config.icon;
                    return (
                        <div key={section} className="card p-6 text-center">
                            <Icon className={`w-8 h-8 ${config.text} mx-auto mb-3`} />
                            <div className="text-2xl font-black text-slate-900 dark:text-white">{typeof band === 'number' ? band.toFixed(1) : band}</div>
                            <div className="text-xs font-bold text-slate-500 uppercase mt-1">{config.title}</div>
                        </div>
                    );
                })}
            </div>

            <button onClick={onBack} className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-2xl transition">
                Back to Mock Test
            </button>
        </div>
    );
}
