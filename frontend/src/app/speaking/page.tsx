'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';

const SPEAKING_TOPICS = [
    {
        id: 1,
        part: 'Part 1',
        title: 'Hometown',
        questions: [
            'Where are you from?',
            'What do you like most about your hometown?',
            'Has your hometown changed much in recent years?',
            'Would you recommend tourists to visit your hometown?',
        ],
        timePerQuestion: 30,
    },
    {
        id: 2,
        part: 'Part 2',
        title: 'Describe a Book',
        cueCard: `Describe a book that you have read recently.

You should say:
• what the book was about
• why you decided to read it
• what you learned from it
and explain whether you would recommend it to others.`,
        prepTime: 60,
        speakTime: 120,
    },
    {
        id: 3,
        part: 'Part 2',
        title: 'Memorable Journey',
        cueCard: `Describe a memorable journey you have taken.

You should say:
• where you went
• how you traveled
• who you went with
and explain why this journey was memorable.`,
        prepTime: 60,
        speakTime: 120,
    },
    {
        id: 4,
        part: 'Part 3',
        title: 'Technology & Society',
        questions: [
            'How has technology changed the way people communicate?',
            'Do you think technology has made people more or less sociable?',
            'What might be the negative effects of too much screen time?',
            'How do you think technology will change in the next 20 years?',
        ],
        timePerQuestion: 60,
    },
];

type RecordingState = 'idle' | 'preparing' | 'recording' | 'finished';

import { api } from '@/lib/api';
import { SpeakingFeedback } from '@/components/SpeakingFeedback';

export default function SpeakingPage() {
    const { user, token } = useAuth();
    const [selectedTopic, setSelectedTopic] = useState<typeof SPEAKING_TOPICS[0] | null>(null);
    const [recordingState, setRecordingState] = useState<RecordingState>('idle');
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [timeLeft, setTimeLeft] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [permissionError, setPermissionError] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [feedback, setFeedback] = useState<any>(null);

    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);

    const submitForAnalysis = async () => {
        if (!token || !audioUrl || chunksRef.current.length === 0 && !selectedTopic) return;

        setIsAnalyzing(true);
        // Re-create blob if needed, but we usually clear chunks on stop.
        // Better way: store the final blob in state when stopping recording.
        // For now, let's fetch the blob from the object URL to be safe/simple
        try {
            const audioBlob = await fetch(audioUrl).then(r => r.blob());
            const promptText = selectedTopic?.cueCard || selectedTopic?.questions?.join(" ") || "General Speaking";

            const result = await api.analyzeSpeaking(token, audioBlob, promptText);
            setFeedback(result);
        } catch (err) {
            console.error(err);
            alert("Analysis failed. Please try again.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    const startPractice = async (topic: typeof SPEAKING_TOPICS[0]) => {
        try {
            // Request microphone permission early
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                chunksRef.current = []; // Reset chunks for next time

                // Stop all tracks to release microphone
                stream.getTracks().forEach(track => track.stop());
            };

            setSelectedTopic(topic);
            setCurrentQuestionIdx(0);
            setPermissionError(false);

            if (topic.prepTime) {
                setRecordingState('preparing');
                setTimeLeft(topic.prepTime);
                startTimer(topic.prepTime, () => beginRecording(topic));
            } else {
                beginRecording(topic);
            }
        } catch (err) {
            console.error("Microphone permission denied:", err);
            setPermissionError(true);
        }
    };

    const beginRecording = (topic: typeof SPEAKING_TOPICS[0]) => {
        if (!mediaRecorderRef.current) return;

        setRecordingState('recording');
        setTimeLeft(topic.speakTime || topic.timePerQuestion || 60);
        setIsRecording(true);

        mediaRecorderRef.current.start();
        startTimer(topic.speakTime || topic.timePerQuestion || 60, () => nextQuestion(topic));
    };

    const startTimer = (seconds: number, onComplete: () => void) => {
        if (timerRef.current) clearInterval(timerRef.current);

        let remaining = seconds;
        timerRef.current = setInterval(() => {
            remaining -= 1;
            setTimeLeft(remaining);

            if (remaining <= 0) {
                if (timerRef.current) clearInterval(timerRef.current);
                onComplete();
            }
        }, 1000);
    };

    const nextQuestion = (topic: typeof SPEAKING_TOPICS[0]) => {
        const questions = topic.questions || [];
        if (currentQuestionIdx < questions.length - 1) {
            // For Part 1/3, we might want to keep recording continuously or stop/start per question
            // For simplicity/MVP, let's keep recording continuously but reset timer
            setCurrentQuestionIdx(prev => prev + 1);
            setTimeLeft(topic.timePerQuestion || 30);
            startTimer(topic.timePerQuestion || 30, () => nextQuestion(topic));
        } else {
            finishRecording();
        }
    };

    const finishRecording = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
        }
        setRecordingState('finished');
        setIsRecording(false);
    };

    const resetPractice = () => {
        setSelectedTopic(null);
        setRecordingState('idle');
        setCurrentQuestionIdx(0);
        setTimeLeft(0);
        setIsRecording(false);
        setAudioUrl(null);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!user) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-rose-900 to-pink-900 text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-black/20 backdrop-blur-sm border-b border-white/10">
                <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <a href="/dashboard" className="text-white/70 hover:text-white">
                            ← Back
                        </a>
                        <h1 className="text-xl font-bold">🎤 Speaking Practice</h1>
                    </div>
                    {isRecording && (
                        <div className="flex items-center gap-2">
                            <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1 }}
                                className="w-3 h-3 bg-red-500 rounded-full"
                            />
                            <span className="text-red-400 font-medium">Recording</span>
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-8">
                {permissionError && (
                    <div className="mb-6 bg-red-500/20 border border-red-500/50 p-4 rounded-xl text-center">
                        <h3 className="text-red-300 font-bold mb-2">Microphone Access Required</h3>
                        <p className="text-white/70">Please allow microphone access to practice speaking.</p>
                        <button
                            onClick={() => setPermissionError(false)}
                            className="mt-3 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition"
                        >
                            Dismiss
                        </button>
                    </div>
                )}

                {!selectedTopic ? (
                    // Topic Selection
                    <div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-8"
                        >
                            <h2 className="text-3xl font-bold mb-4">Choose a Speaking Topic</h2>
                            <p className="text-white/70">Practice IELTS Speaking with real audio recording</p>
                        </motion.div>

                        <div className="grid gap-6">
                            {SPEAKING_TOPICS.map((topic, idx) => (
                                <motion.div
                                    key={topic.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/15 transition cursor-pointer"
                                    onClick={() => startPractice(topic)}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <span className="bg-rose-500/30 text-rose-300 px-3 py-1 rounded-full text-sm">
                                                {topic.part}
                                            </span>
                                            <h3 className="text-xl font-bold mt-2">{topic.title}</h3>
                                        </div>
                                        <div className="text-right text-white/60 text-sm">
                                            {topic.prepTime && <div>{topic.prepTime}s prep</div>}
                                            <div>{topic.speakTime || topic.timePerQuestion}s per {topic.questions ? 'question' : 'response'}</div>
                                        </div>
                                    </div>
                                    {topic.questions && (
                                        <p className="text-white/70 text-sm">{topic.questions.length} questions</p>
                                    )}
                                    {topic.cueCard && (
                                        <p className="text-white/70 text-sm line-clamp-2">{topic.cueCard.split('\n')[0]}</p>
                                    )}
                                </motion.div>
                            ))}
                        </div>

                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.4 }}
                            className="mt-8 bg-amber-500/20 border border-amber-500/50 rounded-xl p-4"
                        >
                            <h4 className="font-bold text-amber-300 mb-2">🚧 Coming Soon</h4>
                            <p className="text-white/70 text-sm">
                                AI feedback for speaking (pronunciation & fluency) is under development!
                            </p>
                        </motion.div>
                    </div>
                ) : recordingState === 'finished' ? (
                    // Finished Screen
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 text-center"
                    >
                        {isAnalyzing ? (
                            <div className="py-8">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    className="w-16 h-16 border-4 border-rose-400 border-t-transparent rounded-full mb-6 mx-auto"
                                />
                                <h3 className="text-2xl font-bold animate-pulse">Analysing Speech...</h3>
                                <p className="text-white/60 mt-2">Gemini AI is listening to your recording...</p>
                            </div>
                        ) : feedback ? (
                            <div className="space-y-6">
                                <div className="space-y-6">
                                    <div className="bg-white/10 rounded-xl p-6 relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 to-pink-500" />
                                        <div className="text-sm uppercase tracking-widest text-white/60 mb-2">Estimated Band Score</div>
                                        <div className="text-6xl font-bold text-rose-400 mb-2">{feedback.band_score}</div>
                                        <p className="text-white/90">{feedback.overall_feedback}</p>
                                    </div>

                                    {/* Transcription & Errors */}
                                    {feedback.transcription && (
                                        <SpeakingFeedback
                                            transcription={feedback.transcription}
                                            errors={feedback.annotated_errors || []}
                                        />
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                                        {[
                                            { name: "Fluency", data: feedback.fluency_coherence },
                                            { name: "Vocabulary", data: feedback.lexical_resource },
                                            { name: "Grammar", data: feedback.grammatical_range },
                                            { name: "Pronunciation", data: feedback.pronunciation }
                                        ].map(criterion => (
                                            <div key={criterion.name} className="bg-white/5 p-4 rounded-xl">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-medium text-white/80">{criterion.name}</span>
                                                    <span className="font-bold text-rose-400">{criterion.data?.score || '-'}</span>
                                                </div>
                                                <p className="text-xs text-white/50">{criterion.data?.comment || 'No comment'}</p>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-left">
                                        <h4 className="font-bold text-emerald-400 mb-2">💡 Top Improvements</h4>
                                        <ul className="list-disc list-inside text-sm text-white/80 space-y-1">
                                            {feedback.improvements?.map((imp: string, i: number) => (
                                                <li key={i}>{imp}</li>
                                            ))}
                                        </ul>
                                    </div>

                                    <div className="flex gap-4 pt-2">
                                        <button
                                            onClick={resetPractice}
                                            className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition"
                                        >
                                            Try New Topic
                                        </button>
                                        <a
                                            href="/dashboard"
                                            className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl font-bold text-center hover:from-rose-400 hover:to-pink-400 transition"
                                        >
                                            Dashboard
                                        </a>
                                    </div>
                                </div>
                                ) : (
                                <>
                                    <div className="text-6xl mb-4">🎉</div>
                                    <h2 className="text-2xl font-bold mb-2">Great Practice!</h2>
                                    <p className="text-white/70 mb-6">You completed the {selectedTopic.title} topic</p>

                                    <div className="bg-white/10 rounded-xl p-6 mb-8 max-w-md mx-auto">
                                        <h4 className="font-medium mb-4">Listen to your recording</h4>
                                        {audioUrl && (
                                            <div className="flex justify-center">
                                                <audio controls src={audioUrl} className="w-full" />
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        onClick={submitForAnalysis}
                                        className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl font-bold text-xl mb-4 hover:shadow-lg hover:shadow-purple-500/20 transition transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                    >
                                        <span>✨</span> Analyze with AI Examiner
                                    </button>

                                    <div className="flex gap-4">
                                        <button
                                            onClick={resetPractice}
                                            className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition"
                                        >
                                            Try Another Topic
                                        </button>
                                        <a
                                            href="/dashboard"
                                            className="flex-1 py-3 bg-white/10 rounded-xl font-medium text-center hover:bg-white/20 transition"
                                        >
                                            Dashboard
                                        </a>
                                    </div>
                                </>
                        )}
                            </motion.div>
                        ) : (
                            // Recording Interface
                            <div>
                                {/* Timer */}
                                <motion.div
                                    initial={{ scale: 0.8, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="text-center mb-8"
                                >
                                    <div className={`text-7xl font-mono font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-white'}`}>
                                        {formatTime(timeLeft)}
                                    </div>
                                    <div className="text-white/60 mt-2">
                                        {recordingState === 'preparing' ? 'Preparation Time' : 'Recording... Speak now!'}
                                    </div>
                                </motion.div>

                                {/* Content Card */}
                                <motion.div
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-6"
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <span className="bg-rose-500/30 text-rose-300 px-3 py-1 rounded-full text-sm">
                                            {selectedTopic.part}
                                        </span>
                                        {selectedTopic.questions && (
                                            <span className="text-white/60 text-sm">
                                                Question {currentQuestionIdx + 1} of {selectedTopic.questions.length}
                                            </span>
                                        )}
                                    </div>

                                    {selectedTopic.cueCard ? (
                                        <div className="whitespace-pre-line text-white/90 text-left text-lg leading-relaxed">{selectedTopic.cueCard}</div>
                                    ) : selectedTopic.questions ? (
                                        <div className="text-2xl font-medium text-center py-8">{selectedTopic.questions[currentQuestionIdx]}</div>
                                    ) : null}
                                </motion.div>

                                {/* Stop Button */}
                                <div className="flex justify-center mt-8 gap-4">
                                    {recordingState === 'preparing' && (
                                        <button
                                            onClick={() => beginRecording(selectedTopic!)}
                                            className="px-8 py-3 bg-rose-600 hover:bg-rose-500 rounded-xl font-bold transition shadow-lg shadow-rose-500/20"
                                        >
                                            Start Speaking Now
                                        </button>
                                    )}

                                    {recordingState === 'recording' && (
                                        <button
                                            onClick={finishRecording}
                                            className="px-8 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition"
                                        >
                                            Finish Early
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </main>
        </div>
    );
}
