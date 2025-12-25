'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';

// Mock Data for Sections (In real app, fetch from backend)
const LISTENING_QUESTIONS = [
    { id: 1, text: "What is the new address of the caller?", type: "MCQ", options: ["42 Oak Street", "78 Maple Avenue", "3B Maple Avenue"], answer: "78 Maple Avenue" },
    { id: 2, text: "How much is the renewal fee?", type: "MCQ", options: ["$10", "$15", "$50"], answer: "$15" },
    { id: 3, text: "When is the book due back?", type: "MCQ", options: ["Monday", "Thursday", "Saturday"], answer: "Thursday" }
];

const READING_TEXT = `
The history of the pencil begins in 1564, when a large deposit of graphite was discovered in Borrowdale, England. Locals found that the black substance was very useful for marking sheep. This deposit remains the only large scale deposit of graphite ever found in this solid form. 
Chemistry was in its infancy and the substance was thought to be a form of lead. Consequently, it was called plumbago (Latin for 'lead ore'). This misperception remains to this day – we still talk about pencil 'leads', even though a pencil contains no lead at all.
The graphite was cut into sticks and wrapped in string or sheepskin for stability. England would enjoy a monopoly on the production of pencils until a method of reconstituting graphite powder was found in 1662 in Germany. However, the distinctively square English pencils continued to be made with sticks of natural graphite into the 1860s.
`;

const READING_QUESTIONS = [
    { id: 1, text: "Where was the graphite deposit discovered?", type: "MCQ", options: ["Germany", "England", "USA"], answer: "England" },
    { id: 2, text: "What was the original use of the graphite?", type: "MCQ", options: ["Writing letters", "Marking sheep", "Art"], answer: "Marking sheep" },
    { id: 3, text: "Pencils contain lead.", type: "TF", options: ["True", "False", "Not Given"], answer: "False" }
];

export default function MockExamPage() {
    const { user } = useAuth();
    const router = useRouter();

    const [status, setStatus] = useState<'INTRO' | 'LISTENING' | 'READING' | 'WRITING' | 'COMPLETED'>('INTRO');
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [timeLeft, setTimeLeft] = useState(0); // in seconds
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [writingText, setWritingText] = useState("");
    const [results, setResults] = useState<any>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Timer
    useEffect(() => {
        if (!sessionId || status === 'COMPLETED' || status === 'INTRO') return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Auto-submit section if time runs out
                    handleSectionSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [sessionId, status]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const startTest = async () => {
        try {
            const token = user ? 'valid_token' : 'demo';
            const res = await api.startMockExam(token);
            setSessionId(res.id);
            setStatus('LISTENING');
            setTimeLeft(30 * 60); // 30 min for Listening
        } catch (e) {
            console.error(e);
            alert("Failed to start session");
        }
    };

    const handleSectionSubmit = async () => {
        if (!sessionId) return;
        setIsSubmitting(true);
        const token = user ? 'valid_token' : 'demo';

        try {
            if (status === 'LISTENING') {
                await api.submitMockListening(token, sessionId, answers);
                setStatus('READING');
                setTimeLeft(60 * 60); // 60 min
                setAnswers({}); // Reset answer buffer for next section
            } else if (status === 'READING') {
                await api.submitMockReading(token, sessionId, answers);
                setStatus('WRITING');
                setTimeLeft(60 * 60); // 60 min
                setAnswers({});
            } else if (status === 'WRITING') {
                await api.submitMockWriting(token, sessionId, writingText);
                // Fetch results
                const res = await api.getMockResults(token, sessionId);
                setResults(res);
                setStatus('COMPLETED');
            }
        } catch (e) {
            console.error(e);
            alert("Error submitting section. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-purple-500/30">
            {/* Header / Timer */}
            {status !== 'INTRO' && (
                <div className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-white/10 px-6 py-4 flex justify-between items-center shadow-lg">
                    <div className="font-bold text-xl tracking-tight">IELTS Mock Exam</div>
                    <div className={`font-mono text-2xl font-bold px-4 py-1 rounded-lg ${timeLeft < 300 ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-slate-800'}`}>
                        {formatTime(timeLeft)}
                    </div>
                    <div className="text-sm text-white/50 uppercase tracking-widest font-semibold text-xs">
                        {status} SECTION
                    </div>
                </div>
            )}

            <main className="max-w-4xl mx-auto px-6 py-12">

                {status === 'INTRO' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-center py-12"
                    >
                        <h1 className="text-5xl font-extrabold mb-6 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Full Mock Exam</h1>
                        <p className="text-xl text-white/70 mb-12 max-w-2xl mx-auto leading-relaxed">
                            You are about to start a complete simulation of the IELTS test.
                            <br /><br />
                            ⏱️ <strong className="text-white">Total Time:</strong> 2 hours 30 minutes<br />
                            🚫 <strong className="text-white">No Pauses:</strong> Once started, the timer does not stop.<br />
                            🎧 <strong className="text-white">Headphones:</strong> Required for listening section.
                        </p>

                        <button
                            onClick={startTest}
                            className="px-10 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:scale-105 transition shadow-xl hover:shadow-2xl hover:shadow-white/20"
                        >
                            Start Exam Now
                        </button>
                    </motion.div>
                )}

                {status === 'LISTENING' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="bg-white/5 p-6 rounded-2xl mb-8 border border-white/10 flex items-center gap-4">
                            <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-xl">🎧</div>
                            <div>
                                <h2 className="text-xl font-bold">Listening Section</h2>
                                <p className="text-white/60">Listen to the audio and answer the questions.</p>
                            </div>
                            <div className="ml-auto">
                                <audio controls src="/audio/library_call.mp3" className="w-64" />
                            </div>
                        </div>

                        <div className="space-y-6">
                            {LISTENING_QUESTIONS.map((q) => (
                                <div key={q.id} className="bg-slate-800/50 p-6 rounded-xl border border-white/5">
                                    <p className="mb-4 font-medium text-lg">{q.id}. {q.text}</p>
                                    <div className="space-y-2">
                                        {q.options.map(opt => (
                                            <label key={opt} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition">
                                                <input
                                                    type="radio"
                                                    name={`q-${q.id}`}
                                                    value={opt}
                                                    onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                    className="w-5 h-5 accent-purple-500"
                                                />
                                                <span className="text-white/80">{opt}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={handleSectionSubmit}
                                disabled={isSubmitting}
                                className="px-8 py-3 bg-purple-600 rounded-xl font-bold hover:bg-purple-500 transition"
                            >
                                {isSubmitting ? 'Submitting...' : 'Next Section →'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {status === 'READING' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[calc(100vh-200px)]">
                            {/* Text Column - Scrollable */}
                            <div className="bg-white/5 p-8 rounded-2xl border border-white/10 overflow-y-auto h-full">
                                <h2 className="text-2xl font-bold mb-4 font-serif">The History of the Pencil</h2>
                                <p className="text-white/80 leading-relaxed text-lg whitespace-pre-wrap font-serif">
                                    {READING_TEXT}
                                </p>
                            </div>

                            {/* Questions Column - Scrollable */}
                            <div className="overflow-y-auto h-full space-y-6 pr-2">
                                {READING_QUESTIONS.map((q) => (
                                    <div key={q.id} className="bg-slate-800/50 p-6 rounded-xl border border-white/5">
                                        <p className="mb-4 font-medium text-lg">{q.id}. {q.text}</p>
                                        <div className="space-y-2">
                                            {q.options.map(opt => (
                                                <label key={opt} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition">
                                                    <input
                                                        type="radio"
                                                        name={`q-${q.id}`}
                                                        value={opt}
                                                        onChange={(e) => setAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                                        className="w-5 h-5 accent-emerald-500"
                                                    />
                                                    <span className="text-white/80">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}

                                <div className="pt-4">
                                    <button
                                        onClick={handleSectionSubmit}
                                        disabled={isSubmitting}
                                        className="w-full px-8 py-4 bg-emerald-600 rounded-xl font-bold hover:bg-emerald-500 transition text-lg"
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Finish Reading Section →'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {status === 'WRITING' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        <div className="bg-white/5 p-6 rounded-2xl mb-6 border border-white/10">
                            <h2 className="text-xl font-bold mb-2">Writing Task 2</h2>
                            <p className="text-white/70 italic">
                                "Technology is making communication easier but relationships weaker. To what extent do you agree or disagree?"
                            </p>
                        </div>

                        <textarea
                            value={writingText}
                            onChange={(e) => setWritingText(e.target.value)}
                            placeholder="Type your essay here..."
                            className="w-full h-[60vh] bg-black/20 border border-white/10 rounded-xl p-6 text-lg text-white placeholder-white/30 focus:outline-none focus:border-amber-400 resize-none font-serif leading-relaxed"
                        />

                        <div className="mt-8 flex justify-between items-center">
                            <div className="text-white/50">{writingText.split(/\s+/).filter(w => w).length} words</div>
                            <button
                                onClick={handleSectionSubmit}
                                disabled={isSubmitting}
                                className="px-8 py-3 bg-amber-600 rounded-xl font-bold hover:bg-amber-500 transition"
                            >
                                {isSubmitting ? 'Submitting...' : 'Finish Exam'}
                            </button>
                        </div>
                    </motion.div>
                )}

                {status === 'COMPLETED' && results && (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-12">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-2xl">
                            🏆
                        </div>
                        <h2 className="text-4xl font-bold mb-2">Exam Completed!</h2>
                        <p className="text-white/60 mb-12">Here is your estimated performance</p>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mb-12">
                            <div className="bg-white/10 p-6 rounded-2xl border border-white/10">
                                <div className="text-sm text-white/50 mb-1">Overall Band</div>
                                <div className="text-4xl font-bold text-white">{results.scores.overall}</div>
                            </div>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                <div className="text-sm text-white/50 mb-1">Listening</div>
                                <div className="text-2xl font-bold text-purple-300">{results.scores.listening}</div>
                            </div>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                <div className="text-sm text-white/50 mb-1">Reading</div>
                                <div className="text-2xl font-bold text-emerald-300">{results.scores.reading}</div>
                            </div>
                            <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                <div className="text-sm text-white/50 mb-1">Writing</div>
                                <div className="text-2xl font-bold text-amber-300">{results.scores.writing}</div>
                            </div>
                        </div>

                        <a href="/dashboard" className="text-white/50 hover:text-white underline underline-offset-4">Return to Dashboard</a>
                    </motion.div>
                )}

            </main>
        </div>
    );
}
