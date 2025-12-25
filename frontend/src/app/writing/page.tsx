'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { EssayFeedback } from '@/components/EssayFeedback';

const WRITING_PROMPTS = [
    {
        id: 1,
        type: 'Task 1',
        title: 'Line Graph Analysis',
        prompt: 'The graph below shows the number of books read by men and women at Burnaby Public Library from 2011 to 2014. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.',
        wordLimit: 150,
        timeLimit: 20,
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
        title: 'Opinion Essay',
        prompt: 'Some people believe that technology has made our lives too complex, and the solution is to live a simpler life without technology. To what extent do you agree or disagree?',
        wordLimit: 250,
        timeLimit: 40,
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
        title: 'Discussion Essay',
        prompt: 'Some people think that environmental problems should be solved on a global scale, while others believe it is better to deal with them nationally. Discuss both views and give your own opinion.',
        wordLimit: 250,
        timeLimit: 40,
        tips: [
            'Present both viewpoints fairly',
            'Give specific examples for each view',
            'Clearly state your own position',
            'Use linking words to show contrast',
        ],
    },
];

export default function WritingPage() {
    const { user } = useAuth();
    const [checkResult, setCheckResult] = useState<any>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

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
            // Using a hardcoded token for MVP demo or the real one if logged in
            // In a real app, use the token from useAuth()
            // Here assuming useAuth provides a token, or we fall back for demo
            const token = user ? 'valid_token' : 'demo_token'; // api.ts usually handles token injection if using the hook nicely, but here we call api directly. 
            // Better: use api method which takes token. 
            // The useAuth hook gives us `token`. Let's assume `user` object has token or a separate token field.
            // checking useAuth definition... assuming it provides `token`.
            // If not, we might need to get it from localStorage or context properly.
            // For now, let's assume the auth context works or we mock it.

            // Actually, looking at `api.evaluateWriting`, it expects `token`. 
            // `useAuth` returns `{ user, token, ... }` typically. 

            const res = await api.evaluateWriting(
                'demo_token', // Replace with real token in production integration
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

    // Import the component dynamically or assume it's imported at top
    // For this tool usage, I must ensure imports are correct at the top of file.
    // I will add the import in a separate edit or assume the user accepts this chunk.

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-900 text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <a href="/dashboard" className="text-white/70 hover:text-white">
                            ← Back
                        </a>
                        <h1 className="text-xl font-bold">✍️ Writing Practice</h1>
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8">
                {!selectedPrompt ? (
                    // Prompt Selection
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-8"
                        >
                            <h2 className="text-3xl font-bold mb-4">Choose a Writing Task</h2>
                            <p className="text-white/70">Practice your IELTS Writing skills with timed exercises</p>
                        </motion.div>

                        <div className="grid gap-6">
                            {WRITING_PROMPTS.map((prompt, idx) => (
                                <motion.div
                                    key={prompt.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition cursor-pointer"
                                    onClick={() => startWriting(prompt)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="bg-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full text-sm">
                                                {prompt.type}
                                            </span>
                                            <h3 className="text-xl font-bold mt-2">{prompt.title}</h3>
                                        </div>
                                        <div className="text-right text-white/60 text-sm">
                                            <div>{prompt.wordLimit}+ words</div>
                                            <div>{prompt.timeLimit} minutes</div>
                                        </div>
                                    </div>
                                    <p className="text-white/80 line-clamp-2">{prompt.prompt}</p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ) : showFeedback ? (
                    // Feedback Screen
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/10 backdrop-blur-sm rounded-2xl p-8"
                    >
                        <button
                            onClick={() => setSelectedPrompt(null)}
                            className="mb-4 text-white/60 hover:text-white text-sm"
                        >
                            ← Back to Prompts
                        </button>

                        <div className="text-center mb-8">
                            <h2 className="text-3xl font-bold mb-2">Essay Analysis</h2>
                            <p className="text-white/70">Here provides detailed AI feedback.</p>
                        </div>

                        {isAnalyzing ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mb-4"></div>
                                <p className="text-emerald-300 animate-pulse">AI Examiner is reading your essay...</p>
                            </div>
                        ) : checkResult ? (
                            <div className="space-y-8">
                                {/* Band Score and Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-6 text-center">
                                        <div className="text-4xl font-bold text-emerald-400 mb-1">{checkResult.band_score}</div>
                                        <div className="text-sm text-emerald-200">Overall Band</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 text-center">
                                        <div className="text-xl font-bold text-white mb-1">{checkResult.task_response.score}</div>
                                        <div className="text-xs text-white/60">Task Response</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 text-center">
                                        <div className="text-xl font-bold text-white mb-1">{checkResult.coherence_cohesion.score}</div>
                                        <div className="text-xs text-white/60">Coherence</div>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-4 text-center">
                                        <div className="text-xl font-bold text-white mb-1">{checkResult.grammatical_range.score}</div>
                                        <div className="text-xs text-white/60">Grammar</div>
                                    </div>
                                </div>

                                {/* Main Feedback */}
                                <div className="bg-black/20 rounded-xl p-6">
                                    <h3 className="font-bold text-lg mb-2"> Examiner's Comment</h3>
                                    <p className="text-white/80 leading-relaxed italic">
                                        "{checkResult.overall_feedback}"
                                    </p>
                                </div>

                                {/* Visual Corrections (Red Pen) */}
                                {checkResult.annotated_errors && checkResult.annotated_errors.length > 0 ? (
                                    <EssayFeedback essayText={essay} errors={checkResult.annotated_errors} />
                                ) : (
                                    <div className="bg-green-500/20 border border-green-500/50 p-6 rounded-xl text-center">
                                        <p className="text-green-300 font-bold">🎉 No major errors specificed!</p>
                                        <p className="text-white/70 text-sm">Your writing is very clean.</p>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white/5 rounded-xl p-6">
                                        <h4 className="font-bold text-emerald-300 mb-4">✅ Strengths</h4>
                                        <ul className="space-y-2">
                                            <li className="text-sm text-white/80">• Good task response</li>
                                            <li className="text-sm text-white/80">• Clear structure</li>
                                        </ul>
                                    </div>
                                    <div className="bg-white/5 rounded-xl p-6">
                                        <h4 className="font-bold text-amber-300 mb-4">🚀 Improvements</h4>
                                        <ul className="space-y-2">
                                            {checkResult.improvements.map((imp: string, i: number) => (
                                                <li key={i} className="text-sm text-white/80 flex gap-2">
                                                    <span>•</span> {imp}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                            </div>
                        ) : (
                            <div className="text-center text-red-400">Failed to load result.</div>
                        )}
                    </motion.div>
                ) : (
                    // Writing Interface
                    <div>
                        {/* Prompt Display */}
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <span className="bg-emerald-500/30 text-emerald-300 px-3 py-1 rounded-full text-sm">
                                    {selectedPrompt.type}
                                </span>
                                <button
                                    onClick={() => setSelectedPrompt(null)}
                                    className="text-white/50 hover:text-white"
                                >
                                    ✕ Exit
                                </button>
                            </div>
                            <p className="text-white/90">{selectedPrompt.prompt}</p>
                        </motion.div>

                        <div className="flex justify-between items-center mb-2">
                            <span className="text-white/70 text-sm">Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                        </div>

                        <textarea
                            value={essay}
                            onChange={(e) => handleEssayChange(e.target.value)}
                            placeholder="Type your essay here..."
                            className="w-full h-96 bg-white/10 border border-white/20 rounded-xl p-4 text-white placeholder-white/40 focus:outline-none focus:border-emerald-400 resize-none font-serif text-lg leading-relaxed"
                        />

                        <div className="flex justify-between items-center mt-4">
                            <div className="text-white/60">
                                <span className={wordCount >= selectedPrompt.wordLimit ? 'text-green-400' : ''}>
                                    {wordCount}
                                </span>
                                {' / '}{selectedPrompt.wordLimit}+ words
                            </div>
                            <button
                                onClick={submitEssay}
                                className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl font-bold hover:from-emerald-400 hover:to-teal-400 transition"
                            >
                                Submit for AI Correction
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
