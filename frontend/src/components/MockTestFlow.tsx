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
    MicOff,
    Clock,
    CheckCircle2,
    ChevronRight,
    Trophy,
    ArrowLeft,
    Play,
    Pause,
    AlertCircle,
    FileText,
    Square,
    RotateCcw,
    Volume2,
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
    standalone?: boolean;
    initialSection?: Section;
}

export default function MockTestPage({ standalone = true, initialSection }: MockTestProps) {
    const { user, token, loading: authLoading } = useAuth();
    const [phase, setPhase] = useState<Phase>('LANDING');
    const [activeSection, setActiveSection] = useState<Section | null>(initialSection || null);
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [questions, setQuestions] = useState<any[]>([]);
    const [answers, setAnswers] = useState<Record<number | string, string>>({});
    const [timeLeft, setTimeLeft] = useState(0);
    const [isPaused, setIsPaused] = useState(false);
    const [result, setResult] = useState<MockSessionResult | null>(null);
    const [allResults, setAllResults] = useState<Record<string, MockSessionResult>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [writingPrompt, setWritingPrompt] = useState<any>(null);
    const [speakingPrompt, setSpeakingPrompt] = useState<any>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

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
            if (!sessionId) {
                const session = await api.startMockExam(token);
                setSessionId(session.id);
            }

            if (section === 'WRITING') {
                const prompt = await api.getMockWritingPrompt(token);
                setWritingPrompt(prompt);
                setQuestions([{ id: 'essay', text: prompt.prompt_text, type: 'ESSAY', options: null, passage: null, passage_title: prompt.title, audio_url: null, section: null }]);
            } else if (section === 'SPEAKING') {
                const prompt = await api.getMockSpeakingPrompt(token);
                setSpeakingPrompt(prompt);
                setQuestions([{ id: 'speech', text: prompt.cue_card || prompt.questions?.[0] || 'Speak about the topic', type: 'SPEECH', options: null, passage: null, passage_title: prompt.title, audio_url: null, section: null }]);
            } else {
                const data = await api.getMockQuestions(token, section, section === 'LISTENING' ? 40 : 40, sessionId || undefined);
                setQuestions(data.questions || []);
            }

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

    const setAnswer = (questionId: number | string, answer: string) => {
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
                const essayText = answers['essay'] || '';
                res = await api.submitMockWriting(token, sessionId, essayText);
            } else if (activeSection === 'SPEAKING') {
                const transcript = answers['speech'] || '';
                res = await api.submitMockSpeaking(token, sessionId, transcript);
            }
            if (res) {
                setResult(res);
                setAllResults(prev => ({ ...prev, [activeSection]: res! }));
            }
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
        setWritingPrompt(null);
        setSpeakingPrompt(null);
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
                                        {completed && (allResults[section.id]?.scores as any)?.[section.title.toLowerCase()] && (
                                            <div className="mt-3 text-sm font-black text-emerald-600">
                                                Band: {(allResults[section.id]?.scores as any)?.[section.title.toLowerCase()]}
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
                        <PrepScreen section={activeSection} onStart={beginTest} onBack={goToLanding} writingPrompt={writingPrompt} speakingPrompt={speakingPrompt} />
                    </motion.div>
                )}

                {phase === 'TEST' && activeSection && (
                    <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {activeSection === 'WRITING' ? (
                            <WritingTestScreen
                                prompt={writingPrompt}
                                essay={answers['essay'] || ''}
                                setEssay={(text) => setAnswer('essay', text)}
                                timeLeft={timeLeft}
                                isPaused={isPaused}
                                setIsPaused={setIsPaused}
                                onSubmit={handleSubmit}
                                loading={loading}
                                error={error}
                            />
                        ) : activeSection === 'SPEAKING' ? (
                            <SpeakingTestScreen
                                prompt={speakingPrompt}
                                transcript={answers['speech'] || ''}
                                setTranscript={(text) => setAnswer('speech', text)}
                                timeLeft={timeLeft}
                                isPaused={isPaused}
                                setIsPaused={setIsPaused}
                                onSubmit={handleSubmit}
                                loading={loading}
                                error={error}
                            />
                        ) : (
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
                        )}
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
function PrepScreen({ section, onStart, onBack, writingPrompt, speakingPrompt }: {
    section: Section; onStart: () => void; onBack: () => void;
    writingPrompt?: any; speakingPrompt?: any;
}) {
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
            'Read the prompt carefully before writing.',
            'Write at least the required number of words.',
            'Organize your essay into clear paragraphs.',
            'Spend a few minutes reviewing your work.',
        ],
        SPEAKING: [
            'Listen to the questions carefully.',
            'Speak clearly and extend your answers.',
            'For Part 2, use the preparation time wisely.',
            'Give examples to support your points.',
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

            {section === 'WRITING' && writingPrompt && (
                <div className="card p-6 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="w-5 h-5 text-amber-500" />
                        <span className="font-black text-slate-900 dark:text-white">Your Writing Prompt</span>
                    </div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">{writingPrompt.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{writingPrompt.prompt_text}</p>
                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                        <span className="font-bold">Min {writingPrompt.word_limit} words</span>
                        <span className="font-bold">{writingPrompt.time_limit_minutes} min</span>
                        {writingPrompt.category && <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">{writingPrompt.category}</span>}
                    </div>
                </div>
            )}

            {section === 'SPEAKING' && speakingPrompt && (
                <div className="card p-6 mb-6">
                    <div className="flex items-center gap-2 mb-3">
                        <Mic className="w-5 h-5 text-rose-500" />
                        <span className="font-black text-slate-900 dark:text-white">Your Speaking Topic</span>
                    </div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2">{speakPrompt(speakingPrompt)}</h3>
                    {speakingPrompt.cue_card && (
                        <div className="mt-3 p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-800">
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{speakingPrompt.cue_card}</p>
                        </div>
                    )}
                    {speakingPrompt.questions?.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {speakingPrompt.questions.map((q: string, i: number) => (
                                <div key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                    <span className="font-black text-rose-500 shrink-0">Q{i + 1}.</span> {q}
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                        <span className="font-bold">Part: {speakPartLabel(speakingPrompt.part)}</span>
                        {speakingPrompt.speak_time_sec && <span className="font-bold">{speakingPrompt.speak_time_sec}s speaking time</span>}
                    </div>
                </div>
            )}

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

function speakPrompt(p: any): string {
    if (p.title) return p.title;
    if (p.part) return `Part ${p.part.replace('PART_', '')}`;
    return 'Speaking Task';
}

function speakPartLabel(part: string): string {
    return part.replace('PART_', '').replace('_', ' ');
}

// ========== TEST SCREEN (Listening/Reading) ==========
function TestScreen({ section, questions, answers, setAnswer, timeLeft, isPaused, setIsPaused, onSubmit, loading, error }: {
    section: Section;
    questions: any[];
    answers: Record<number | string, string>;
    setAnswer: (id: number | string, answer: string) => void;
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

    const groupedQuestions = section === 'READING' ? groupByPassage(questions) : null;

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
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

            <div className="h-1 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 overflow-hidden">
                <motion.div className="h-full bg-blue-600 rounded-full" animate={{ width: `${pct}%` }} />
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                {groupedQuestions ? (
                    groupedQuestions.map((group, gIdx) => (
                        <div key={gIdx} className="space-y-4">
                            {group.passage && (
                                <div className="card p-6">
                                    <h4 className="font-black text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-purple-500" />
                                        {group.passage_title || `Passage ${gIdx + 1}`}
                                    </h4>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">{group.passage}</div>
                                </div>
                            )}
                            {group.questions.map((q: any, idx: number) => (
                                <QuestionCard
                                    key={q.id}
                                    question={q}
                                    index={group.offset + idx}
                                    answer={answers[q.id] || ''}
                                    onAnswer={(ans) => setAnswer(q.id, ans)}
                                    section={section}
                                />
                            ))}
                        </div>
                    ))
                ) : (
                    questions.map((q, idx) => (
                        <QuestionCard
                            key={q.id}
                            question={q}
                            index={idx}
                            answer={answers[q.id] || ''}
                            onAnswer={(ans) => setAnswer(q.id, ans)}
                            section={section}
                        />
                    ))
                )}
            </div>

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

function groupByPassage(questions: any[]): { passage: string | null; passage_title: string | null; questions: any[]; offset: number }[] {
    const groups: { passage: string | null; passage_title: string | null; questions: any[]; offset: number }[] = [];
    let current: any = null;
    let offset = 0;
    for (const q of questions) {
        const key = q.passage || '__none__';
        if (!current || current.passage !== (q.passage || null)) {
            current = { passage: q.passage || null, passage_title: q.passage_title || null, questions: [], offset };
            groups.push(current);
        }
        current.questions.push(q);
        offset++;
    }
    return groups;
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

// ========== WRITING TEST SCREEN ==========
function WritingTestScreen({ prompt, essay, setEssay, timeLeft, isPaused, setIsPaused, onSubmit, loading, error }: {
    prompt: any;
    essay: string;
    setEssay: (text: string) => void;
    timeLeft: number;
    isPaused: boolean;
    setIsPaused: (paused: boolean) => void;
    onSubmit: () => void;
    loading: boolean;
    error: string | null;
}) {
    const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;
    const minWords = prompt?.word_limit || 250;
    const hasEnoughWords = wordCount >= minWords;

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="card p-4 mb-4 flex items-center justify-between sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
                <div className="flex items-center gap-4">
                    <h3 className="font-black text-slate-900 dark:text-white">Writing</h3>
                    <span className={`text-sm font-bold ${hasEnoughWords ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {wordCount}/{minWords} words
                    </span>
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

            {prompt && (
                <div className="card p-5 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <PenTool className="w-4 h-4 text-amber-500" />
                        <span className="font-black text-slate-900 dark:text-white text-sm">{prompt.title}</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{prompt.prompt_text}</p>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                <textarea
                    value={essay}
                    onChange={(e) => setEssay(e.target.value)}
                    placeholder="Write your essay here..."
                    className="w-full h-full min-h-[300px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 text-slate-900 dark:text-white text-base leading-relaxed focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition resize-none"
                />
            </div>

            <div className="card p-4 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                    <span className={`font-bold ${hasEnoughWords ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {wordCount} words
                    </span>
                    {!hasEnoughWords && (
                        <span className="text-amber-500">Need {minWords - wordCount} more words</span>
                    )}
                </div>
                <button
                    onClick={onSubmit}
                    disabled={loading || wordCount === 0}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl transition shadow-lg shadow-blue-600/20"
                >
                    {loading ? 'Submitting...' : 'Submit Essay'}
                </button>
            </div>

            {error && <div className="card p-4 mt-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 text-sm">{error}</div>}
        </div>
    );
}

// ========== SPEAKING TEST SCREEN ==========
function SpeakingTestScreen({ prompt, transcript, setTranscript, timeLeft, isPaused, setIsPaused, onSubmit, loading, error }: {
    prompt: any;
    transcript: string;
    setTranscript: (text: string) => void;
    timeLeft: number;
    isPaused: boolean;
    setIsPaused: (paused: boolean) => void;
    onSubmit: () => void;
    loading: boolean;
    error: string | null;
}) {
    const [isRecording, setIsRecording] = useState(false);
    const [audioURL, setAudioURL] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const recognitionRef = useRef<any>(null);

    const transcriptRef = useRef(transcript);
    transcriptRef.current = transcript;

    const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioURL(URL.createObjectURL(blob));
                stream.getTracks().forEach(t => t.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);

            try {
                const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                if (SpeechRecognition) {
                    const recognition = new SpeechRecognition();
                    recognition.continuous = true;
                    recognition.interimResults = true;
                    recognition.lang = 'en-GB';
                    recognition.onresult = (event: any) => {
                        let finalTranscript = '';
                        for (let i = 0; i < event.results.length; i++) {
                            if (event.results[i].isFinal) {
                                finalTranscript += event.results[i][0].transcript + ' ';
                            }
                        }
                        if (finalTranscript) {
                            setTranscript((transcriptRef.current + ' ' + finalTranscript).trim());
                        }
                    };
                    recognition.onerror = () => {};
                    recognition.start();
                    recognitionRef.current = recognition;
                }
            } catch {}
        } catch (err) {
            console.error('Microphone access denied:', err);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (recognitionRef.current) {
            try { recognitionRef.current.stop(); } catch {}
        }
        setIsRecording(false);
    };

    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                try { recognitionRef.current.stop(); } catch {}
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
            }
        };
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="card p-4 mb-4 flex items-center justify-between sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
                <div className="flex items-center gap-4">
                    <h3 className="font-black text-slate-900 dark:text-white">Speaking</h3>
                    <span className="text-sm text-slate-500 font-bold">{wordCount} words transcribed</span>
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

            {prompt && (
                <div className="card p-5 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Mic className="w-4 h-4 text-rose-500" />
                        <span className="font-black text-slate-900 dark:text-white text-sm">{prompt.title || `Part ${prompt.part}`}</span>
                    </div>
                    {prompt.cue_card && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-800 mb-3">
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{prompt.cue_card}</p>
                        </div>
                    )}
                    {prompt.questions?.length > 0 && (
                        <div className="space-y-2">
                            {prompt.questions.map((q: string, i: number) => (
                                <div key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                    <span className="font-black text-rose-500 shrink-0">Q{i + 1}.</span> {q}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                <div className="card p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                            <Mic className="w-4 h-4 text-rose-500" />
                            Voice Recording
                        </span>
                        <div className="flex items-center gap-2">
                            {!isRecording ? (
                                <button
                                    onClick={startRecording}
                                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition"
                                >
                                    <Mic className="w-4 h-4" /> Start Recording
                                </button>
                            ) : (
                                <button
                                    onClick={stopRecording}
                                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition"
                                >
                                    <Square className="w-4 h-4" /> Stop
                                </button>
                            )}
                        </div>
                    </div>
                    {isRecording && (
                        <div className="flex items-center gap-3 p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="text-sm font-bold text-rose-600">Recording... Speak now</span>
                        </div>
                    )}
                    {audioURL && !isRecording && (
                        <div className="mt-3">
                            <audio controls src={audioURL} className="w-full h-10" />
                        </div>
                    )}
                </div>

                <div className="card p-4 flex-1">
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" />
                            Transcript
                        </span>
                        <span className={`text-xs font-bold ${transcript.trim() ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {wordCount} words
                        </span>
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={transcript}
                        onChange={(e) => setTranscript(e.target.value)}
                        placeholder="Your speech will be transcribed here automatically, or type manually..."
                        className="w-full min-h-[120px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm leading-relaxed focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition resize-none"
                    />
                </div>
            </div>

            <div className="card p-4 mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-500 font-bold">
                    {transcript.trim() ? 'Ready to submit' : 'Record or type your response'}
                </span>
                <button
                    onClick={onSubmit}
                    disabled={loading || !transcript.trim()}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl transition shadow-lg shadow-blue-600/20"
                >
                    {loading ? 'Submitting...' : 'Submit Response'}
                </button>
            </div>

            {error && <div className="card p-4 mt-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 text-sm">{error}</div>}
        </div>
    );
}

// ========== REVIEW SCREEN ==========
function ReviewScreen({ section, result, onContinue, onBack }: { section: Section; result: MockSessionResult; onContinue: () => void; onBack: () => void }) {
    const config = SECTIONS.find(s => s.id === section)!;
    const scores = (result?.scores || {}) as Record<string, any>;
    const sectionScore = scores[section.toLowerCase()] || 0;
    const raw = scores[`${section.toLowerCase()}_raw`] || {};

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

                {raw.words !== undefined && raw.feedback && (
                    <div className="mt-6 text-sm text-slate-500">
                        <span className="font-bold">{raw.words} words</span>
                        <p className="mt-2 text-left max-w-md mx-auto">{raw.feedback}</p>
                    </div>
                )}

                {raw.words !== undefined && raw.sentences && (
                    <div className="mt-6 text-sm text-slate-500">
                        <span className="font-bold">{raw.words} words spoken</span>
                        <span className="text-slate-400 ml-2">({raw.sentences} sentences)</span>
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
function ResultsScreen({ results, onBack }: { results: Record<string, MockSessionResult>; onBack: () => void }) {
    const sectionEntries = Object.entries(results);
    const scores = sectionEntries.map(([sec, res]) => {
        const s = res?.scores || {};
        const config = SECTIONS.find(s2 => s2.id === sec.toUpperCase() as Section);
        return {
            section: sec,
            band: (s as any)[sec] || 0,
            config,
        };
    }).filter(s => s.config);
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
                    if (!config) return null;
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
