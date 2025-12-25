'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';

export default function GeneratorPage() {
    const { user } = useAuth();
    const [url, setUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [generatedtest, setGeneratedTest] = useState<any>(null);
    const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);

    const handleGenerate = async () => {
        if (!url) return;
        setIsLoading(true);
        try {
            // Use dummy token or real token
            const token = user ? 'valid_token' : 'demo_verify';
            const res = await api.generateReadingTest(token, url);
            setGeneratedTest(res);
        } catch (err) {
            alert('Failed to generate test. Make sure the URL is a valid article.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAnswer = (idx: number, val: string) => {
        setUserAnswers(prev => ({ ...prev, [idx]: val }));
    };

    const submitTest = () => {
        if (!generatedtest) return;
        let correct = 0;
        generatedtest.questions.forEach((q: any, idx: number) => {
            if (userAnswers[idx]?.toLowerCase() === q.correct_answer.toLowerCase()) {
                correct++;
            }
        });
        setScore(correct);
        setSubmitted(true);
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-900 to-purple-900 text-white">
            <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
                    <a href="/dashboard" className="text-white/70 hover:text-white">← Back</a>
                    <h1 className="text-xl font-bold">🪄 Infinite Test Generator</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-12">
                {!generatedtest ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white/10 backdrop-blur-md rounded-2xl p-8 text-center border border-white/10"
                    >
                        <h2 className="text-3xl font-bold mb-4">Turn any content into a Test</h2>
                        <p className="text-white/70 mb-8 max-w-lg mx-auto">
                            Paste a link to any news article (BBC, CNN, TechCrunch) and AI will instantly generate an IELTS Reading test for you.
                        </p>

                        <div className="flex gap-4 max-w-2xl mx-auto">
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="https://www.bbc.com/news/technology..."
                                className="flex-1 bg-black/20 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-400 transition"
                            />
                            <button
                                onClick={handleGenerate}
                                disabled={isLoading || !url}
                                className="px-8 py-3 bg-purple-500 rounded-xl font-bold hover:bg-purple-400 transition disabled:opacity-50 flex items-center gap-2"
                            >
                                {isLoading ? <span className="animate-spin">⏳</span> : '✨'}
                                {isLoading ? 'Generating...' : 'Generate'}
                            </button>
                        </div>

                        <div className="mt-8 text-sm text-white/40">
                            Try: BBC News, Science Daily, The Guardian, TechCrunch
                        </div>
                    </motion.div>
                ) : (
                    <div className="space-y-8">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-white/5 rounded-2xl p-6 border border-white/10"
                        >
                            <span className="bg-purple-500/30 text-purple-200 px-3 py-1 rounded-full text-sm mb-2 inline-block">Generated Test</span>
                            <h2 className="text-2xl font-bold mb-2">{generatedtest.title}</h2>
                            <p className="text-white/70 italic">{generatedtest.summary}</p>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:text-purple-200 text-sm mt-2 inline-block">Read Original Article ↗</a>
                        </motion.div>

                        <div className="space-y-6">
                            {generatedtest.questions.map((q: any, idx: number) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className={`p-6 rounded-xl border ${submitted
                                            ? userAnswers[idx]?.toLowerCase() === q.correct_answer.toLowerCase()
                                                ? 'bg-green-500/10 border-green-500/30'
                                                : 'bg-red-500/10 border-red-500/30'
                                            : 'bg-white/10 border-white/10'
                                        }`}
                                >
                                    <div className="flex justify-between mb-4">
                                        <h3 className="font-bold text-lg">Question {idx + 1}</h3>
                                        <span className="text-sm text-white/50">{q.question_type}</span>
                                    </div>
                                    <p className="text-white/90 mb-4">{q.question_text}</p>

                                    {q.options ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {q.options.map((opt: string) => (
                                                <button
                                                    key={opt}
                                                    onClick={() => !submitted && handleAnswer(idx, opt)}
                                                    className={`p-3 rounded-lg text-left transition ${userAnswers[idx] === opt
                                                            ? 'bg-purple-500 text-white'
                                                            : 'bg-white/5 hover:bg-white/10'
                                                        }`}
                                                    disabled={submitted}
                                                >
                                                    {opt}
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <input
                                            type="text"
                                            value={userAnswers[idx] || ''}
                                            onChange={(e) => handleAnswer(idx, e.target.value)}
                                            placeholder="Type your answer..."
                                            disabled={submitted}
                                            className="w-full bg-black/20 border border-white/20 rounded-lg p-3 text-white focus:border-purple-400 outline-none"
                                        />
                                    )}

                                    {submitted && (
                                        <div className="mt-4 pt-4 border-t border-white/10 text-sm">
                                            <div className="flex gap-2 mb-1">
                                                <span className="text-white/60">Correct Answer:</span>
                                                <span className="font-bold text-green-400">{q.correct_answer}</span>
                                            </div>
                                            <p className="text-white/80">{q.explanation}</p>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        {!submitted ? (
                            <button
                                onClick={submitTest}
                                className="w-full py-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl font-bold hover:from-purple-400 hover:to-indigo-400 transition shadow-lg text-lg"
                            >
                                Submit Test
                            </button>
                        ) : (
                            <div className="bg-white/10 rounded-xl p-6 text-center">
                                <h3 className="text-2xl font-bold mb-2">Score: {score} / {generatedtest.questions.length}</h3>
                                <button
                                    onClick={() => { setGeneratedTest(null); setUrl(''); setSubmitted(false); setUserAnswers({}); }}
                                    className="bg-white/20 px-6 py-2 rounded-lg hover:bg-white/30 transition mt-4"
                                >
                                    Generate Another
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
