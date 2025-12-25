'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { EssayFeedback } from '@/components/EssayFeedback';
import {
    ArrowLeft,
    PenTool,
    Clock,
    FileText,
    Target,
    CheckCircle2,
    AlertCircle,
    ChevronRight,
    Sparkles,
    Zap,
    BookOpen,
    Info,
    History,
    TrendingUp,
    Award
} from 'lucide-react';
import Link from 'next/link';

const WRITING_PROMPTS = [
    {
        id: 1,
        type: 'Task 1',
        title: 'Data Analysis',
        prompt: 'The graph below shows the number of books read by men and women at Burnaby Public Library from 2011 to 2014. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        wordLimit: 150,
        timeLimit: 20,
        category: 'ACADEMIC',
        tips: [
            'Start with a clear overview of the main trends',
            'Group similar data points together',
            'Use specific figures to support your points',
            'Compare trends between categories',
        ],
    },
    {
        id: 2,
        type: 'Task 2',
        title: 'Global Issues',
        prompt: 'Some people believe that technology has made our lives too complex, and the solution is to live a simpler life without technology. To what extent do you agree or disagree?',
        wordLimit: 250,
        timeLimit: 40,
        category: 'ESSAY',
        tips: [
            'Clearly state your position in the introduction',
            'Develop 2-3 main arguments with examples',
            'Consider counterarguments briefly',
            'Write a strong conclusion summarizing your view',
        ],
    },
    {
        id: 3,
        type: 'Task 2',
        title: 'Environment',
        prompt: 'Some people think that environmental problems should be solved on a global scale, while others believe it is better to deal with them nationally. Discuss both views and give your own opinion.',
        wordLimit: 250,
        timeLimit: 40,
        category: 'ESSAY',
        tips: [
            'Present both viewpoints fairly',
            'Give specific examples for each view',
            'Clearly state your own position',
            'Use linking words to show contrast',
        ],
    },
];

export default function WritingPage() {
    const { user, token } = useAuth();
    const [selectedPrompt, setSelectedPrompt] = useState<typeof WRITING_PROMPTS[0] | null>(null);
    const [essay, setEssay] = useState('');
    const [wordCount, setWordCount] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isWriting, setIsWriting] = useState(false);
    const [showFeedback, setShowFeedback] = useState(false);
    const [checkResult, setCheckResult] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (isWriting && timeLeft > 0) {
            timer = setInterval(() => {
                setTimeLeft(prev => prev - 1);
            }, 1000);
        } else if (timeLeft === 0 && isWriting) {
            submitEssay();
        }
        return () => clearInterval(timer);
    }, [isWriting, timeLeft]);

    const startWriting = (prompt: typeof WRITING_PROMPTS[0]) => {
        setSelectedPrompt(prompt);
        setEssay('');
        setWordCount(0);
        setTimeLeft(prompt.timeLimit * 60);
        setIsWriting(true);
        setShowFeedback(false);
        setCheckResult(null);
    };

    const handleEssayChange = (text: string) => {
        setEssay(text);
        const words = text.trim().split(/\s+/).filter(w => w.length > 0);
        setWordCount(words.length);
    };

    const submitEssay = async () => {
        if (!selectedPrompt) return;

        setIsWriting(false);
        setShowFeedback(true);
        setIsAnalyzing(true);

        try {
            const res = await api.evaluateWriting(
                token || 'demo_token',
                essay,
                selectedPrompt.type,
                selectedPrompt.prompt
            );

            setCheckResult(res);
        } catch (err) {
            console.error(err);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!user) return null;

    return (
        <div className="pb-24 max-w-6xl mx-auto">
            {!selectedPrompt ? (
                // Prompt Selection View
                <div className="space-y-10 py-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Writing Practice</h1>
                        <p className="text-slate-500 font-medium">Master Task 1 and Task 2 with real-time AI evaluation.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {WRITING_PROMPTS.map((prompt, idx) => (
                            <motion.div
                                key={prompt.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => startWriting(prompt)}
                                className="group card p-8 !rounded-3xl cursor-pointer hover:border-blue-600 transition-all duration-300 shadow-xl shadow-slate-200/40 dark:shadow-none interactive flex flex-col h-full"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                                        <PenTool className="w-6 h-6" />
                                    </div>
                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        {prompt.type}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                                    {prompt.title}
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-8 flex-1 line-clamp-3">
                                    {prompt.prompt}
                                </p>
                                <div className="flex items-center gap-4 pt-6 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        {prompt.timeLimit}m
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                        <FileText className="w-3.5 h-3.5" />
                                        {prompt.wordLimit}+ words
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ) : showFeedback ? (
                // Detailed Feedback View
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSelectedPrompt(null)}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Writing Analysis</h2>
                        </div>
                    </div>

                    {isAnalyzing ? (
                        <div className="card !rounded-3xl p-16 flex flex-col items-center justify-center space-y-6 text-center shadow-xl shadow-slate-200/40">
                            <div className="relative">
                                <div className="w-20 h-20 border-4 border-blue-100 dark:border-slate-800 rounded-full" />
                                <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Sparkles className="w-8 h-8 text-blue-600 animate-pulse" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-slate-900 dark:text-white">Analyzing your essay...</h3>
                                <p className="text-slate-500 font-medium max-w-xs mx-auto">Our AI examiner is evaluating your response according to IELTS criteria.</p>
                            </div>
                        </div>
                    ) : checkResult ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Left Column: Stats & Marks */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="card p-8 !rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none border-t-4 border-t-blue-600">
                                    <div className="text-center space-y-2">
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Overall Band</span>
                                        <div className="text-7xl font-black text-blue-600 tracking-tighter">
                                            {checkResult.band_score}
                                        </div>
                                    </div>

                                    <div className="mt-10 space-y-4">
                                        {[
                                            { label: 'Task Response', score: checkResult.task_response.score },
                                            { label: 'C&C', score: checkResult.coherence_cohesion.score },
                                            { label: 'Vocabulary', score: checkResult.lexical_resource.score },
                                            { label: 'Grammar', score: checkResult.grammatical_range.score },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                                <span className="text-xs font-bold text-slate-500 uppercase">{item.label}</span>
                                                <span className="font-black text-slate-900 dark:text-white">{item.score}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="card p-6 !rounded-3xl bg-slate-900 text-white space-y-4">
                                    <div className="flex items-center gap-2 text-blue-400">
                                        <Award className="w-5 h-5" />
                                        <h4 className="font-black uppercase tracking-widest text-xs">AI Examiner Note</h4>
                                    </div>
                                    <p className="text-blue-100/80 text-sm leading-relaxed italic italic font-medium">
                                        &quot;{checkResult.overall_feedback}&quot;
                                    </p>
                                </div>
                            </div>

                            {/* Right Column: Detailed Corrections */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="card p-8 !rounded-3xl shadow-xl shadow-slate-200/40 dark:shadow-none border-t-4 border-t-amber-500">
                                    <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                        <TrendingUp className="w-5 h-5 text-amber-500" />
                                        Review & Improvement
                                    </h4>

                                    <div className="space-y-6">
                                        {checkResult.annotated_errors?.length > 0 ? (
                                            <EssayFeedback essayText={essay} errors={checkResult.annotated_errors} />
                                        ) : (
                                            <div className="p-8 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 text-center space-y-3">
                                                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                                                <h5 className="font-black text-emerald-900 dark:text-emerald-100 uppercase tracking-widest text-xs">Exceptional Clarity</h5>
                                                <p className="text-emerald-700 dark:text-emerald-300 text-sm font-medium">No major mechanical or grammatical errors were detected.</p>
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            <h5 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Specific Actions</h5>
                                            <div className="grid gap-3">
                                                {checkResult.improvements.map((imp: string, i: number) => (
                                                    <div key={i} className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                        <div className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center flex-shrink-0 text-blue-600 font-black text-xs">
                                                            {i + 1}
                                                        </div>
                                                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                            {imp}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => setSelectedPrompt(null)}
                                        className="btn-primary flex-1 py-5 !rounded-2xl flex items-center justify-center gap-2 font-black text-lg shadow-xl shadow-blue-600/20"
                                    >
                                        Next Task
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card p-20 text-center space-y-4 !rounded-3xl border-rose-100">
                            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
                            <h3 className="text-xl font-black text-slate-900">Analysis Interrupted</h3>
                            <button onClick={submitEssay} className="btn-primary">Retry Evaluation</button>
                        </div>
                    )}
                </div>
            ) : (
                // Focused Writing Interface
                <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="card p-10 !rounded-[2.5rem] border-t-8 border-t-blue-600 shadow-2xl shadow-slate-200/50 dark:shadow-none">
                        <div className="flex flex-col md:flex-row gap-10">
                            {/* Left Side: Prompt & Rules */}
                            <div className="md:w-1/3 space-y-8 border-r border-slate-100 dark:border-slate-800 pr-10">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 justify-between">
                                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-600 rounded-lg text-[10px] font-black tracking-[0.1em] uppercase">
                                            {selectedPrompt.type}
                                        </span>
                                        <div className="flex items-center gap-1.5 text-rose-600 font-mono font-bold text-lg">
                                            <Clock className="w-5 h-5" />
                                            {formatTime(timeLeft)}
                                        </div>
                                    </div>
                                    <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                                        {selectedPrompt.title}
                                    </h2>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">
                                            &quot;{selectedPrompt.prompt}&quot;
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                                            <Info className="w-3.5 h-3.5" />
                                            Focus Area
                                        </h4>
                                        <div className="space-y-2">
                                            {selectedPrompt.tips.map((tip, i) => (
                                                <div key={i} className="flex items-start gap-3 text-xs font-bold text-slate-500">
                                                    <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5" />
                                                    {tip}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Workspace */}
                            <div className="md:w-2/3 flex flex-col space-y-6">
                                <div className="flex-1 min-h-[500px] flex flex-col relative">
                                    <textarea
                                        value={essay}
                                        onChange={(e) => handleEssayChange(e.target.value)}
                                        placeholder="Begin typing your response..."
                                        className="flex-1 w-full bg-transparent border-non resize-none focus:outline-none text-xl text-slate-900 dark:text-white font-medium leading-[1.8] placeholder-slate-300"
                                        autoFocus
                                    />

                                    <div className="flex items-center justify-between py-6 mt-6 border-t border-slate-100 dark:border-slate-800">
                                        <div className="flex items-center gap-6">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Words</span>
                                                <span className={`text-2xl font-black tracking-tighter ${wordCount >= selectedPrompt.wordLimit ? 'text-emerald-500' : 'text-slate-900 dark:text-white'}`}>
                                                    {wordCount}
                                                </span>
                                            </div>
                                            <div className="w-px h-10 bg-slate-100 dark:bg-slate-800" />
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Target</span>
                                                <span className="text-2xl font-black tracking-tighter text-slate-400">
                                                    {selectedPrompt.wordLimit}+
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => setSelectedPrompt(null)}
                                                className="px-6 py-4 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold hover:bg-slate-100 transition-all uppercase tracking-widest text-[10px]"
                                            >
                                                Exit
                                            </button>
                                            <button
                                                onClick={submitEssay}
                                                disabled={wordCount < 10}
                                                className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all duration-300 shadow-xl ${wordCount >= 10
                                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20 active:scale-95'
                                                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
                                                    }`}
                                            >
                                                Submit Draft
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

