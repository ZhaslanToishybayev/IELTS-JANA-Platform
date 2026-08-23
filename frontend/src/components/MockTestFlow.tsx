'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import type { MockSessionResult, WritingPromptData, SpeakingPromptData } from '@/lib/api';
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
    AlertCircle,
    FileText,
    Square,
    Volume2,
    ChevronDown,
    ChevronUp,
} from 'lucide-react';
import { formatTime } from '@/lib/utils';

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
    { id: 'WRITING', title: 'Writing', icon: PenTool, duration: 60 * 60, description: 'Task 1 (150+ words, 20 min) + Task 2 (250+ words, 40 min).', bgLight: 'bg-amber-50', bgDark: 'dark:bg-amber-900/20', text: 'text-amber-600' },
    { id: 'SPEAKING', title: 'Speaking', icon: Mic, duration: 14 * 60, description: 'Part 1 (general) + Part 2 (cue card) + Part 3 (discussion).', bgLight: 'bg-rose-50', bgDark: 'dark:bg-rose-900/20', text: 'text-rose-600' },
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
    const [writingPrompts, setWritingPrompts] = useState<{ task1: WritingPromptData | null; task2: WritingPromptData | null } | null>(null);
    const [speakingPrompts, setSpeakingPrompts] = useState<{ part1: SpeakingPromptData | null; part2: SpeakingPromptData | null; part3: SpeakingPromptData | null } | null>(null);
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
                const prompts = await api.getMockWritingPromptsAll(token);
                setWritingPrompts(prompts);
                setQuestions([]);
            } else if (section === 'SPEAKING') {
                const prompts = await api.getMockSpeakingPromptsAll(token);
                setSpeakingPrompts(prompts);
                setQuestions([]);
            } else {
                const data = await api.getMockQuestions(token, section, 40, sessionId || undefined);
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
                res = await api.submitMockWriting(token, sessionId, answers['task1'] || '', answers['task2'] || '');
            } else if (activeSection === 'SPEAKING') {
                res = await api.submitMockSpeaking(token, sessionId, answers['part1'] || '', answers['part2'] || '', answers['part3'] || '');
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
        setWritingPrompts(null);
        setSpeakingPrompts(null);
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
                        <PrepScreen section={activeSection} onStart={beginTest} onBack={goToLanding} writingPrompts={writingPrompts} speakingPrompts={speakingPrompts} />
                    </motion.div>
                )}

                {phase === 'TEST' && activeSection && (
                    <motion.div key="test" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {activeSection === 'WRITING' ? (
                            <WritingTestScreen
                                prompts={writingPrompts}
                                answers={answers}
                                setAnswer={setAnswer}
                                timeLeft={timeLeft}
                                isPaused={isPaused}
                                setIsPaused={setIsPaused}
                                onSubmit={handleSubmit}
                                loading={loading}
                                error={error}
                            />
                        ) : activeSection === 'SPEAKING' ? (
                            <SpeakingTestScreen
                                prompts={speakingPrompts}
                                answers={answers}
                                setAnswer={setAnswer}
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
function PrepScreen({ section, onStart, onBack, writingPrompts, speakingPrompts }: {
    section: Section; onStart: () => void; onBack: () => void;
    writingPrompts?: { task1: WritingPromptData | null; task2: WritingPromptData | null } | null;
    speakingPrompts?: { part1: SpeakingPromptData | null; part2: SpeakingPromptData | null; part3: SpeakingPromptData | null } | null;
}) {
    const config = SECTIONS.find(s => s.id === section)!;
    const Icon = config.icon;

    const instructions: Record<Section, string[]> = {
        LISTENING: [
            'The audio will be played only once.',
            'Write your answers while listening.',
            'Transfer answers before time runs out.',
            'You will hear a variety of accents.',
        ],
        READING: [
            'Read each passage carefully before answering.',
            'There is NO extra time to transfer answers.',
            'Manage your time: ~20 minutes per passage.',
            'Answer ALL questions — no penalty for wrong answers.',
        ],
        WRITING: [
            'Task 1: Describe a chart/graph/process (min 150 words, 20 min).',
            'Task 2: Write an essay (min 250 words, 40 min).',
            'Plan before writing. Organize into paragraphs.',
            'Spend a few minutes reviewing your work.',
        ],
        SPEAKING: [
            'Part 1: General questions about yourself.',
            'Part 2: Long turn — speak on a cue card topic.',
            'Part 3: Abstract discussion related to Part 2.',
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

            {section === 'WRITING' && writingPrompts && (
                <div className="space-y-4 mb-6">
                    {writingPrompts.task1 && (
                        <PromptCard
                            icon={<PenTool className="w-4 h-4 text-amber-500" />}
                            label={`Task 1 — ${writingPrompts.task1.title}`}
                            sublabel={`${writingPrompts.task1.word_limit}+ words · ${writingPrompts.task1.time_limit_minutes} min`}
                            text={writingPrompts.task1.prompt_text}
                            tips={writingPrompts.task1.tips}
                        />
                    )}
                    {writingPrompts.task2 && (
                        <PromptCard
                            icon={<PenTool className="w-4 h-4 text-amber-500" />}
                            label={`Task 2 — ${writingPrompts.task2.title}`}
                            sublabel={`${writingPrompts.task2.word_limit}+ words · ${writingPrompts.task2.time_limit_minutes} min`}
                            text={writingPrompts.task2.prompt_text}
                            tips={writingPrompts.task2.tips}
                        />
                    )}
                </div>
            )}

            {section === 'SPEAKING' && speakingPrompts && (
                <div className="space-y-4 mb-6">
                    {speakingPrompts.part1 && (
                        <PromptCard
                            icon={<Mic className="w-4 h-4 text-rose-500" />}
                            label={`Part 1 — ${speakingPrompts.part1.title}`}
                            sublabel="General questions"
                            questions={speakingPrompts.part1.questions}
                        />
                    )}
                    {speakingPrompts.part2 && (
                        <PromptCard
                            icon={<Mic className="w-4 h-4 text-rose-500" />}
                            label={`Part 2 — ${speakingPrompts.part2.title}`}
                            sublabel="Long turn · cue card"
                            text={speakingPrompts.part2.cue_card || undefined}
                            questions={speakingPrompts.part2.questions}
                        />
                    )}
                    {speakingPrompts.part3 && (
                        <PromptCard
                            icon={<Mic className="w-4 h-4 text-rose-500" />}
                            label={`Part 3 — ${speakingPrompts.part3.title}`}
                            sublabel="Discussion"
                            questions={speakingPrompts.part3.questions}
                        />
                    )}
                </div>
            )}

            <div className="card p-8 mb-8">
                <h3 className="font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    Instructions
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

function PromptCard({ icon, label, sublabel, text, tips, questions }: {
    icon: React.ReactNode;
    label: string;
    sublabel: string;
    text?: string;
    tips?: string[];
    questions?: string[];
}) {
    const [expanded, setExpanded] = useState(true);
    return (
        <div className="card overflow-hidden">
            <button onClick={() => setExpanded(!expanded)} className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                <div className="flex items-center gap-3">
                    {icon}
                    <div>
                        <span className="font-black text-slate-900 dark:text-white text-sm">{label}</span>
                        <p className="text-xs text-slate-500">{sublabel}</p>
                    </div>
                </div>
                {expanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
            </button>
            {expanded && (
                <div className="px-4 pb-4 border-t border-slate-100 dark:border-slate-800">
                    {text && <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap mt-3">{text}</p>}
                    {questions && questions.length > 0 && (
                        <div className="mt-3 space-y-2">
                            {questions.map((q, i) => (
                                <div key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                    <span className="font-black text-rose-500 shrink-0">Q{i + 1}.</span> {q}
                                </div>
                            ))}
                        </div>
                    )}
                    {tips && tips.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                            {tips.map((tip, i) => (
                                <span key={i} className="text-xs bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 px-2 py-1 rounded-lg">{tip}</span>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
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
    const isListening = section === 'LISTENING';
    const groupedQuestions = section === 'READING' ? groupByPassage(questions) : isListening ? groupBySection(questions) : null;

    // TTS state for listening — uses backend Edge TTS (natural British voice)
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentPlayingIdx, setCurrentPlayingIdx] = useState<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const playAllPassages = useCallback(async () => {
        if (!isListening) return;
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setIsPlaying(false); setCurrentPlayingIdx(null); return; }

        const passages: { title: string; text: string }[] = [];
        const seen = new Set<string>();
        for (const q of questions) {
            if (q.passage && !seen.has(q.passage)) {
                seen.add(q.passage);
                passages.push({ title: q.section || 'Passage', text: q.passage });
            }
        }
        if (passages.length === 0) return;

        setIsPlaying(true);
        let idx = 0;

        const playNext = () => {
            if (idx >= passages.length) { setIsPlaying(false); setCurrentPlayingIdx(null); audioRef.current = null; return; }
            setCurrentPlayingIdx(idx);
            const audio = new Audio(api.getTtsUrl(passages[idx].text));
            audioRef.current = audio;
            audio.onended = () => { idx++; playNext(); };
            audio.onerror = () => { setIsPlaying(false); setCurrentPlayingIdx(null); audioRef.current = null; };
            audio.play().catch(() => { setIsPlaying(false); setCurrentPlayingIdx(null); });
        };
        playNext();
    }, [isListening, questions]);

    const playSinglePassage = useCallback((passage: string) => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; setIsPlaying(false); setCurrentPlayingIdx(null); }
        setIsPlaying(true);
        const audio = new Audio(api.getTtsUrl(passage));
        audioRef.current = audio;
        audio.onended = () => { setIsPlaying(false); setCurrentPlayingIdx(null); audioRef.current = null; };
        audio.onerror = () => { setIsPlaying(false); setCurrentPlayingIdx(null); audioRef.current = null; };
        audio.play().catch(() => { setIsPlaying(false); setCurrentPlayingIdx(null); });
    }, []);

    const stopPlayback = useCallback(() => {
        if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
        setIsPlaying(false);
        setCurrentPlayingIdx(null);
    }, []);

    useEffect(() => {
        return () => { if (audioRef.current) audioRef.current.pause(); };
    }, []);

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="card p-4 mb-4 flex items-center justify-between sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
                <div className="flex items-center gap-4">
                    <h3 className="font-black text-slate-900 dark:text-white">{config.title}</h3>
                    <span className="text-sm text-slate-500 font-bold">{answeredCount}/{questions.length}</span>
                    {isListening && (
                        <button
                            onClick={isPlaying ? stopPlayback : playAllPassages}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition ${isPlaying ? 'bg-red-100 dark:bg-red-900/20 text-red-600 hover:bg-red-200' : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-200'}`}
                        >
                            {isPlaying ? <><Square className="w-3.5 h-3.5" /> Stop Audio</> : <><Volume2 className="w-3.5 h-3.5" /> Play All Passages</>}
                        </button>
                    )}
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

            {isListening && isPlaying && (
                <div className="card p-3 mb-4 flex items-center gap-3 bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                        {currentPlayingIdx !== null ? `Playing passage ${currentPlayingIdx + 1}...` : 'Starting audio...'}
                    </span>
                </div>
            )}

            <div className="flex-1 overflow-y-auto space-y-4 pb-4">
                {groupedQuestions && !isListening && (
                    groupedQuestions.map((group: any, gIdx: number) => (
                        <div key={gIdx} className="space-y-4">
                            {group.passage && (
                                <div className="card p-6">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-purple-500" />
                                            {group.passage_title || `Passage ${gIdx + 1}`}
                                        </h4>
                                        <span className="text-xs text-slate-400">Read carefully</span>
                                    </div>
                                    <div className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">{group.passage}</div>
                                </div>
                            )}
                            {group.questions.map((q: any, idx: number) => (
                                <QuestionCard key={q.id} question={q} index={group.offset + idx} answer={answers[q.id] || ''} onAnswer={(ans) => setAnswer(q.id, ans)} section={section} />
                            ))}
                        </div>
                    ))
                )}

                {groupedQuestions && isListening && (
                    groupedQuestions.map((group: any, gIdx: number) => {
                        const sectionPassages = questions.filter(q => q.section === group.section_label && q.passage);
                        const uniquePassages = [...new Set(sectionPassages.map(q => q.passage))];
                        const passageText = uniquePassages.filter(Boolean).join('\n\n');
                        return (
                            <div key={gIdx} className="space-y-4">
                                <div className="card p-5 border-l-4 border-l-blue-500">
                                    <div className="flex items-center justify-between mb-3">
                                        <h4 className="font-black text-slate-900 dark:text-white flex items-center gap-2">
                                            <Headphones className="w-4 h-4 text-blue-500" />
                                            {group.section_label}
                                            <span className="text-xs font-normal text-slate-400 ml-1">({group.questions.length} questions)</span>
                                        </h4>
                                    </div>
                                    <div className="text-center py-3">
                                        <button
                                            onClick={() => passageText ? playSinglePassage(passageText) : undefined}
                                            disabled={!passageText}
                                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition inline-flex items-center gap-2"
                                        >
                                            <Volume2 className="w-4 h-4" /> Play Audio
                                        </button>
                                        {!passageText && <p className="text-xs text-slate-400 mt-2">No audio transcript available</p>}
                                    </div>
                                </div>
                                {group.questions.map((q: any, idx: number) => (
                                    <QuestionCard key={q.id} question={q} index={group.offset + idx} answer={answers[q.id] || ''} onAnswer={(ans) => setAnswer(q.id, ans)} section={section} />
                                ))}
                            </div>
                        );
                    })
                )}

                {!groupedQuestions && (
                    questions.map((q, idx) => (
                        <QuestionCard key={q.id} question={q} index={idx} answer={answers[q.id] || ''} onAnswer={(ans) => setAnswer(q.id, ans)} section={section} />
                    ))
                )}
            </div>

            <div className="card p-4 mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-500 font-bold">
                    {answeredCount < questions.length ? `${questions.length - answeredCount} remaining` : 'All answered'}
                </span>
                <button onClick={onSubmit} disabled={loading || answeredCount === 0} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl transition shadow-lg shadow-blue-600/20">
                    {loading ? 'Submitting...' : 'Submit'}
                </button>
            </div>
            {error && <div className="card p-4 mt-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 text-sm">{error}</div>}
        </div>
    );
}

function groupByPassage(questions: any[]) {
    const groups: { passage: string | null; passage_title: string | null; questions: any[]; offset: number }[] = [];
    let current: any = null;
    let offset = 0;
    for (const q of questions) {
        if (!current || current.passage !== (q.passage || null)) {
            current = { passage: q.passage || null, passage_title: q.passage_title || null, questions: [], offset };
            groups.push(current);
        }
        current.questions.push(q);
        offset++;
    }
    return groups;
}

function groupBySection(questions: any[]) {
    const groups: { section_label: string; questions: any[]; offset: number }[] = [];
    let current: any = null;
    let offset = 0;
    for (const q of questions) {
        const sectionLabel = q.section || 'Section 1';
        if (!current || current.section_label !== sectionLabel) {
            current = { section_label: sectionLabel, questions: [], offset };
            groups.push(current);
        }
        current.questions.push(q);
        offset++;
    }
    return groups;
}

// ========== QUESTION CARD ==========
function QuestionCard({ question, index, answer, onAnswer, section }: {
    question: any; index: number; answer: string; onAnswer: (answer: string) => void; section: Section;
}) {
    const options: string[] = question.options || [];
    const isTFNG = question.type === 'TF_NG';
    const isMCQ = question.type === 'MCQ' || options.length > 0;
    const isListening = section === 'LISTENING';

    return (
        <div className="card p-6">
            <div className="flex items-start gap-3 mb-4">
                <span className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-sm font-black text-blue-600 shrink-0">{index + 1}</span>
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
                            <button key={i} onClick={() => onAnswer(letter)} className={`text-left p-4 rounded-xl border-2 transition font-medium text-sm ${isSelected ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'}`}>
                                <span className="font-black mr-2">{letter}.</span> {opt}
                            </button>
                        );
                    })}
                </div>
            )}
            {isTFNG && (
                <div className="flex gap-3 ml-11">
                    {['TRUE', 'FALSE', 'NOT GIVEN'].map((opt) => (
                        <button key={opt} onClick={() => onAnswer(opt)} className={`px-6 py-3 rounded-xl border-2 transition font-black text-sm ${answer === opt ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300'}`}>
                            {opt}
                        </button>
                    ))}
                </div>
            )}
            {!isMCQ && !isTFNG && (
                <div className="ml-11">
                    <input type="text" value={answer} onChange={(e) => onAnswer(e.target.value)} placeholder="Type your answer..." className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white font-medium focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition" />
                </div>
            )}
        </div>
    );
}

// ========== WRITING TEST SCREEN (Multi-task with split timer) ==========
function WritingTestScreen({ prompts, answers, setAnswer, timeLeft, isPaused, setIsPaused, onSubmit, loading, error }: {
    prompts: { task1: WritingPromptData | null; task2: WritingPromptData | null } | null;
    answers: Record<number | string, string>;
    setAnswer: (id: number | string, answer: string) => void;
    timeLeft: number; isPaused: boolean; setIsPaused: (p: boolean) => void;
    onSubmit: () => void; loading: boolean; error: string | null;
}) {
    const TASK1_TIME = 20 * 60;
    const TASK2_TIME = 40 * 60;
    const totalTime = TASK1_TIME + TASK2_TIME;

    const [activeTask, setActiveTask] = useState<'task1' | 'task2'>('task1');
    const [task1TimeLeft, setTask1TimeLeft] = useState(TASK1_TIME);
    const [autoSwitched, setAutoSwitched] = useState(false);

    const elapsed = totalTime - timeLeft;
    const t1Elapsed = Math.min(elapsed, TASK1_TIME);
    const t2Elapsed = Math.max(0, elapsed - TASK1_TIME);
    const t1Remaining = Math.max(0, TASK1_TIME - t1Elapsed);
    const t2Remaining = Math.max(0, TASK2_TIME - t2Elapsed);

    useEffect(() => {
        if (!isPaused && elapsed >= TASK1_TIME && activeTask === 'task1' && !autoSwitched) {
            setActiveTask('task2');
            setAutoSwitched(true);
        }
    }, [elapsed, activeTask, autoSwitched, isPaused]);

    const task1Text = answers['task1'] || '';
    const task2Text = answers['task2'] || '';
    const currentText = activeTask === 'task1' ? task1Text : task2Text;
    const setCurrentText = (t: string) => setAnswer(activeTask, t);

    const wordCount = (t: string) => t.trim() ? t.trim().split(/\s+/).length : 0;
    const t1Words = wordCount(task1Text);
    const t2Words = wordCount(task2Text);
    const currentWords = activeTask === 'task1' ? t1Words : t2Words;
    const currentPrompt = activeTask === 'task1' ? prompts?.task1 : prompts?.task2;
    const minWords = currentPrompt?.word_limit || (activeTask === 'task1' ? 150 : 250);
    const hasEnough = currentWords >= minWords;
    const activeTimeLeft = activeTask === 'task1' ? t1Remaining : t2Remaining;
    const activeTimePct = activeTask === 'task1' ? (t1Elapsed / TASK1_TIME * 100) : (t2Elapsed / TASK2_TIME * 100);

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="card p-4 mb-4 flex items-center justify-between sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
                <div className="flex items-center gap-4">
                    <h3 className="font-black text-slate-900 dark:text-white">Writing</h3>
                    <div className="flex items-center gap-2 text-sm font-bold">
                        <button onClick={() => setActiveTask('task1')} className={`px-3 py-1.5 rounded-lg transition ${activeTask === 'task1' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                            Task 1
                            <span className="ml-1.5 text-xs font-mono">{formatTime(t1Remaining)}</span>
                        </button>
                        <button onClick={() => setActiveTask('task2')} className={`px-3 py-1.5 rounded-lg transition ${activeTask === 'task2' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}>
                            Task 2
                            <span className="ml-1.5 text-xs font-mono">{formatTime(t2Remaining)}</span>
                        </button>
                    </div>
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

            <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full mb-4 overflow-hidden">
                <motion.div className="h-full rounded-full" animate={{ width: `${activeTimePct}%` }}
                    style={{ backgroundColor: activeTimeLeft < 120 ? '#ef4444' : activeTimeLeft < 300 ? '#f59e0b' : '#2563eb' }} />
            </div>

            {currentPrompt && (
                <div className="card p-5 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <PenTool className="w-4 h-4 text-amber-500" />
                        <span className="font-black text-slate-900 dark:text-white text-sm">{currentPrompt.title}</span>
                        <span className="text-xs text-slate-400 ml-auto">Min {minWords} words</span>
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap">{currentPrompt.prompt_text}</p>
                </div>
            )}

            <div className="flex-1 overflow-y-auto">
                <textarea
                    value={currentText}
                    onChange={(e) => setCurrentText(e.target.value)}
                    placeholder={`Write your ${activeTask === 'task1' ? 'Task 1 response' : 'essay'} here...`}
                    className="w-full h-full min-h-[250px] bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-5 py-4 text-slate-900 dark:text-white text-base leading-relaxed focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition resize-none"
                />
            </div>

            <div className="card p-4 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm">
                    <span className={`font-bold ${hasEnough ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {currentWords}/{minWords} words
                    </span>
                    {!hasEnough && <span className="text-amber-500">Need {minWords - currentWords} more</span>}
                    <span className="text-slate-400">|</span>
                    <span className="text-slate-500">{t1Words + t2Words} total</span>
                </div>
                <button onClick={onSubmit} disabled={loading || (t1Words === 0 && t2Words === 0)} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl transition shadow-lg shadow-blue-600/20">
                    {loading ? 'Submitting...' : 'Submit Writing'}
                </button>
            </div>
            {error && <div className="card p-4 mt-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 text-sm">{error}</div>}
        </div>
    );
}

// ========== SPEAKING TEST SCREEN (Multi-part with prep/speak phases) ==========
function SpeakingTestScreen({ prompts, answers, setAnswer, timeLeft, isPaused, setIsPaused, onSubmit, loading, error }: {
    prompts: { part1: SpeakingPromptData | null; part2: SpeakingPromptData | null; part3: SpeakingPromptData | null } | null;
    answers: Record<number | string, string>;
    setAnswer: (id: number | string, answer: string) => void;
    timeLeft: number; isPaused: boolean; setIsPaused: (p: boolean) => void;
    onSubmit: () => void; loading: boolean; error: string | null;
}) {
    const PART1_TIME = 3 * 60;
    const PART2_PREP = 60;
    const PART2_SPEAK = 2 * 60;
    const PART3_TIME = 3 * 60;

    const [activePart, setActivePart] = useState<'part1' | 'part2' | 'part3'>('part1');
    const [speakingPhase, setSpeakingPhase] = useState<'prep' | 'speaking'>('speaking');
    const [phaseTimeLeft, setPhaseTimeLeft] = useState(PART1_TIME);
    const [isRecording, setIsRecording] = useState(false);
    const [audioURLs, setAudioURLs] = useState<Record<string, string>>({});
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const recognitionRef = useRef<any>(null);
    const transcriptRef = useRef('');
    const phaseTimerRef = useRef<NodeJS.Timeout | null>(null);

    const part1Text = answers['part1'] || '';
    const part2Text = answers['part2'] || '';
    const part3Text = answers['part3'] || '';
    const currentText = activePart === 'part1' ? part1Text : activePart === 'part2' ? part2Text : part3Text;
    const setCurrentText = (t: string) => setAnswer(activePart, t);
    transcriptRef.current = currentText;

    const wordCount = (t: string) => t.trim() ? t.trim().split(/\s+/).length : 0;
    const totalWords = wordCount(part1Text) + wordCount(part2Text) + wordCount(part3Text);

    const currentPrompt = activePart === 'part1' ? prompts?.part1 : activePart === 'part2' ? prompts?.part2 : prompts?.part3;

    const parts = ['part1', 'part2', 'part3'] as const;
    const partLabels = { part1: 'Part 1 — General', part2: 'Part 2 — Cue Card', part3: 'Part 3 — Discussion' };

    const getPartConfig = (part: string) => {
        if (part === 'part1') return { prepTime: 0, speakTime: PART1_TIME };
        if (part === 'part2') return { prepTime: PART2_PREP, speakTime: PART2_SPEAK };
        return { prepTime: 0, speakTime: PART3_TIME };
    };

    // Phase timer for prep/speak auto-advance
    useEffect(() => {
        if (isPaused || speakingPhase === 'prep' && activePart !== 'part2') return;

        phaseTimerRef.current = setInterval(() => {
            setPhaseTimeLeft(prev => {
                if (prev <= 1) {
                    if (speakingPhase === 'prep' && activePart === 'part2') {
                        setSpeakingPhase('speaking');
                        setPhaseTimeLeft(PART2_SPEAK);
                        startRecording();
                    } else {
                        advancePart();
                    }
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => { if (phaseTimerRef.current) clearInterval(phaseTimerRef.current); };
    }, [activePart, speakingPhase, isPaused]);

    const advancePart = () => {
        stopRecording();
        if (activePart === 'part1') {
            setActivePart('part2');
            setSpeakingPhase('prep');
            setPhaseTimeLeft(PART2_PREP);
        } else if (activePart === 'part2') {
            setActivePart('part3');
            setSpeakingPhase('speaking');
            setPhaseTimeLeft(PART3_TIME);
        } else {
            onSubmit();
        }
    };

    const switchToPart = (part: 'part1' | 'part2' | 'part3') => {
        stopRecording();
        setActivePart(part);
        const config = getPartConfig(part);
        if (config.prepTime > 0 && !(answers[part] || '').trim()) {
            setSpeakingPhase('prep');
            setPhaseTimeLeft(config.prepTime);
        } else {
            setSpeakingPhase('speaking');
            setPhaseTimeLeft(config.speakTime);
        }
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            chunksRef.current = [];
            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                setAudioURLs(prev => ({ ...prev, [activePart]: URL.createObjectURL(blob) }));
                stream.getTracks().forEach(t => t.stop());
            };
            mediaRecorder.start();
            setIsRecording(true);

            try {
                const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                if (SR) {
                    const recognition = new SR();
                    recognition.continuous = true;
                    recognition.interimResults = true;
                    recognition.lang = 'en-GB';
                    recognition.onresult = (event: any) => {
                        let final = '';
                        for (let i = 0; i < event.results.length; i++) {
                            if (event.results[i].isFinal) final += event.results[i][0].transcript + ' ';
                        }
                        if (final) setCurrentText((transcriptRef.current + ' ' + final).trim());
                    };
                    recognition.onerror = () => {};
                    recognition.start();
                    recognitionRef.current = recognition;
                }
            } catch {}
        } catch {}
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') mediaRecorderRef.current.stop();
        if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }
        setIsRecording(false);
    };

    useEffect(() => {
        return () => {
            if (recognitionRef.current) { try { recognitionRef.current.stop(); } catch {} }
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
            if (phaseTimerRef.current) clearInterval(phaseTimerRef.current);
        };
    }, []);

    const partProgress = parts.map(p => {
        const text = answers[p] || '';
        return { part: p, hasContent: !!text.trim() };
    });

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            <div className="card p-4 mb-4 flex items-center justify-between sticky top-0 z-10 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
                <div className="flex items-center gap-4">
                    <h3 className="font-black text-slate-900 dark:text-white">Speaking</h3>
                    <div className="flex items-center gap-1 text-sm font-bold">
                        {parts.map(p => (
                            <button key={p} onClick={() => switchToPart(p)} className={`px-2 py-1 rounded-lg transition text-xs flex items-center gap-1 ${activePart === p ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' : partProgress.find(pp => pp.part === p)?.hasContent ? 'text-emerald-500' : 'text-slate-500 hover:text-slate-700'}`}>
                                {p.replace('part', 'P')}
                                {partProgress.find(pp => pp.part === p)?.hasContent && <CheckCircle2 className="w-3 h-3" />}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-center">
                        <div className={`font-mono text-lg font-black ${phaseTimeLeft < 30 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>
                            {formatTime(phaseTimeLeft)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase">
                            {speakingPhase === 'prep' ? 'Prep Time' : 'Speaking Time'}
                        </div>
                    </div>
                    <button onClick={() => setIsPaused(!isPaused)} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition">
                        {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {speakingPhase === 'prep' && activePart === 'part2' && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="card p-4 mb-4 bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <p className="font-black text-amber-700 dark:text-amber-300 text-sm">Preparation Time</p>
                            <p className="text-xs text-amber-600 dark:text-amber-400">Read the cue card carefully. You will have {PART2_SPEAK / 60} minutes to speak after this.</p>
                        </div>
                    </div>
                </motion.div>
            )}

            {currentPrompt && (
                <div className="card p-5 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Mic className="w-4 h-4 text-rose-500" />
                        <span className="font-black text-slate-900 dark:text-white text-sm">{partLabels[activePart]}</span>
                    </div>
                    {currentPrompt.cue_card && (
                        <div className="p-4 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-200 dark:border-rose-800 mb-3">
                            <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{currentPrompt.cue_card}</p>
                        </div>
                    )}
                    {currentPrompt.questions?.length > 0 && (
                        <div className="space-y-2">
                            {currentPrompt.questions.map((q: string, i: number) => (
                                <div key={i} className="text-sm text-slate-600 dark:text-slate-400 flex items-start gap-2">
                                    <span className="font-black text-rose-500 shrink-0">Q{i + 1}.</span> {q}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                {speakingPhase === 'speaking' && (
                    <div className="card p-4">
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                                <Mic className="w-4 h-4 text-rose-500" /> Recording
                            </span>
                            <div className="flex items-center gap-2">
                                {!isRecording ? (
                                    <button onClick={startRecording} className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold rounded-xl transition">
                                        <Mic className="w-4 h-4" /> Start
                                    </button>
                                ) : (
                                    <button onClick={stopRecording} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-xl transition">
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
                        {audioURLs[activePart] && !isRecording && (
                            <div className="mt-3"><audio controls src={audioURLs[activePart]} className="w-full h-10" /></div>
                        )}
                    </div>
                )}

                <div className="card p-4 flex-1">
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-400" /> Transcript
                        </span>
                        <span className={`text-xs font-bold ${currentText.trim() ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {wordCount(currentText)} words
                        </span>
                    </div>
                    <textarea
                        value={currentText}
                        onChange={(e) => setCurrentText(e.target.value)}
                        placeholder="Speech transcribed here automatically, or type manually..."
                        className="w-full min-h-[100px] bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white text-sm leading-relaxed focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition resize-none"
                    />
                </div>
            </div>

            <div className="card p-4 mt-4 flex items-center justify-between">
                <span className="text-sm text-slate-500 font-bold">
                    {totalWords > 0 ? `${totalWords} words across all parts` : 'Record or type your response'}
                </span>
                <div className="flex items-center gap-3">
                    {activePart !== 'part3' && (
                        <button onClick={advancePart} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition text-sm">
                            Skip to {activePart === 'part1' ? 'Part 2' : 'Part 3'}
                        </button>
                    )}
                    <button onClick={onSubmit} disabled={loading || totalWords === 0} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-black rounded-xl transition shadow-lg shadow-blue-600/20">
                        {loading ? 'Submitting...' : 'Submit Speaking'}
                    </button>
                </div>
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

                {raw.tasks && Object.keys(raw.tasks).length > 0 && (
                    <div className="mt-6 space-y-3 text-sm">
                        {Object.entries(raw.tasks).map(([task, data]: [string, any]) => (
                            <div key={task} className="text-left max-w-md mx-auto p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-black text-slate-900 dark:text-white">{task === 'task1' ? 'Task 1' : 'Task 2'}</span>
                                    <span className="font-bold text-blue-600">{data.score?.toFixed(1)} · {data.words}w</span>
                                </div>
                                {data.feedback && <p className="text-slate-500 text-xs">{data.feedback}</p>}
                            </div>
                        ))}
                    </div>
                )}

                {raw.parts && Object.keys(raw.parts).length > 0 && (
                    <div className="mt-6 space-y-3 text-sm">
                        {Object.entries(raw.parts).map(([part, data]: [string, any]) => (
                            <div key={part} className="text-left max-w-md mx-auto p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-black text-slate-900 dark:text-white">{part === 'part1' ? 'Part 1' : part === 'part2' ? 'Part 2' : 'Part 3'}</span>
                                    <span className="font-bold text-blue-600">{data.band?.toFixed(1)} · {data.words}w</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {raw.total_words && !raw.tasks && !raw.parts && (
                    <div className="mt-6 text-sm text-slate-500">
                        <span className="font-bold">{raw.total_words} words</span>
                    </div>
                )}
            </motion.div>

            <div className="flex gap-4 justify-center">
                <button onClick={onBack} className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl transition">Back</button>
                <button onClick={onContinue} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition shadow-lg shadow-blue-600/20">Continue</button>
            </div>
        </div>
    );
}

// ========== RESULTS SCREEN ==========
function ResultsScreen({ results, onBack }: { results: Record<string, MockSessionResult>; onBack: () => void }) {
    const sectionEntries = Object.entries(results);
    const scores = sectionEntries.map(([sec, res]) => {
        const s = (res?.scores || {}) as Record<string, any>;
        const config = SECTIONS.find(s2 => s2.id === sec.toUpperCase() as Section);
        const raw = s[`${sec}_raw`];
        return { section: sec, band: s[sec] || 0, config, raw };
    }).filter(s => s.config);
    const overall = scores.length > 0
        ? (scores.reduce((sum, s) => sum + (typeof s.band === 'number' ? s.band : 0), 0) / scores.length).toFixed(1)
        : '—';

    const downloadPDF = () => {
        const w = window.open('', '_blank');
        if (!w) return;
        const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
        const sectionRows = scores.map(({ section, band, config, raw }) => {
            let detail = '';
            if (raw?.correct !== undefined) detail = `${raw.correct}/${raw.total} correct (${Math.round(raw.correct / raw.total * 100)}%)`;
            if (raw?.tasks) detail = Object.entries(raw.tasks).map(([t, d]: [string, any]) => `${t === 'task1' ? 'Task 1' : 'Task 2'}: ${d.score?.toFixed(1)} (${d.words}w)`).join(' · ');
            if (raw?.parts) detail = Object.entries(raw.parts).map(([p, d]: [string, any]) => `${p === 'part1' ? 'Part 1' : p === 'part2' ? 'Part 2' : 'Part 3'}: ${d.band?.toFixed(1)} (${d.words}w)`).join(' · ');
            return `<tr><td style="padding:10px 16px;font-weight:700">${config!.title}</td><td style="padding:10px 16px;text-align:center;font-size:24px;font-weight:900;color:#2563eb">${typeof band === 'number' ? band.toFixed(1) : band}</td><td style="padding:10px 16px;color:#64748b;font-size:13px">${detail}</td></tr>`;
        }).join('');

        w.document.write(`<!DOCTYPE html><html><head><title>IELTS Mock Test Results</title><style>
body{font-family:system-ui,-apple-system,sans-serif;margin:40px;color:#0f172a}
h1{font-size:28px;font-weight:900;margin-bottom:4px}
.subtitle{color:#64748b;margin-bottom:32px}
.overall{text-align:center;padding:32px;background:#f8fafc;border-radius:16px;margin-bottom:32px}
.overall .score{font-size:64px;font-weight:900;color:#2563eb}
.overall .label{text-transform:uppercase;font-size:12px;font-weight:700;color:#64748b;letter-spacing:1px}
table{width:100%;border-collapse:collapse;margin-bottom:32px}
table td{border-bottom:1px solid #e2e8f0}
.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e2e8f0;color:#94a3b8;font-size:12px;text-align:center}
@media print{body{margin:20px}}
</style></head><body>
<h1>IELTS Mock Test Results</h1>
<p class="subtitle">IELTS JANA Platform · ${date}</p>
<div class="overall"><div class="score">${overall}</div><div class="label">Overall Estimated Band</div></div>
<table><tbody>${sectionRows}</tbody></table>
<div class="footer">Generated by IELTS JANA Platform · ${date}</div>
</body></html>`);
        w.document.close();
        setTimeout(() => w.print(), 300);
    };

    const shareResults = async () => {
        const text = `IELTS Mock Test Results\nOverall: ${overall}\n${scores.map(s => `${s.config?.title}: ${typeof s.band === 'number' ? s.band.toFixed(1) : s.band}`).join('\n')}\n\nGenerated by IELTS JANA Platform`;
        if (navigator.share) {
            try { await navigator.share({ title: 'IELTS Mock Test Results', text }); } catch {}
        } else {
            await navigator.clipboard.writeText(text);
        }
    };

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
            <div className="flex gap-3 mb-6">
                <button onClick={downloadPDF} className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
                    <FileText className="w-4 h-4" /> Download PDF
                </button>
                <button onClick={shareResults} className="flex-1 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-xl transition flex items-center justify-center gap-2">
                    Share Results
                </button>
            </div>
            <button onClick={onBack} className="w-full py-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-black rounded-2xl transition">
                Back to Mock Test
            </button>
        </div>
    );
}
