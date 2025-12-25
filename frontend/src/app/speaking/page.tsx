'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { SpeakingFeedback } from '@/components/SpeakingFeedback';
import {
    ArrowLeft,
    Mic,
    MicOff,
    Clock,
    Play,
    RotateCcw,
    CheckCircle2,
    AlertCircle,
    Sparkles,
    ChevronRight,
    TrendingUp,
    Volume2,
    Award,
    BookOpen,
    Info,
    History,
    StopCircle,
    Pause
} from 'lucide-react';
import Link from 'next/link';

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
        prepTime: 10, // Shortened for demo/dev, real is 60
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
        if (!token || !audioUrl || !selectedTopic) return;
        setIsAnalyzing(true);
        try {
            const audioBlob = await fetch(audioUrl).then(r => r.blob());
            const promptText = selectedTopic?.cueCard || selectedTopic?.questions?.join(" ") || "General Speaking";
            const result = await api.analyzeSpeaking(token, audioBlob, promptText);
            setFeedback(result);
        } catch (err) {
            console.error(err);
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
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data);
            };
            mediaRecorderRef.current.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                const url = URL.createObjectURL(blob);
                setAudioUrl(url);
                chunksRef.current = [];
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
        setFeedback(null);
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!user) return null;

    return (
        <div className="pb-24 max-w-5xl mx-auto px-4 md:px-0">
            {!selectedTopic ? (
                // Topic Selection View
                <div className="space-y-10 py-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Speaking Practice</h1>
                        <p className="text-slate-500 font-medium tracking-tight">Practice IELTS Speaking with real-time AI fluency and pronunciation checks.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {SPEAKING_TOPICS.map((topic, idx) => (
                            <motion.div
                                key={topic.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                onClick={() => startPractice(topic)}
                                className="group card p-8 !rounded-3xl cursor-pointer hover:border-blue-600 transition-all duration-300 shadow-xl shadow-slate-200/40 dark:shadow-none interactive flex flex-col"
                            >
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-14 h-14 bg-rose-50 dark:bg-rose-900/30 rounded-2xl flex items-center justify-center text-rose-500 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300 shadow-lg shadow-rose-200/40 dark:shadow-none">
                                        <Mic className="w-7 h-7" />
                                    </div>
                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[10px] font-black uppercase tracking-widest text-slate-500">
                                        {topic.part}
                                    </span>
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                                    {topic.title}
                                </h3>
                                <div className="space-y-4">
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed font-medium">
                                        {topic.cueCard ? 'Complete cue card response with 1-min preparation.' : `Answer ${topic.questions?.length} structured questions in real-time.`}
                                    </p>
                                    <div className="flex items-center gap-4 pt-6 mt-4 border-t border-slate-100 dark:border-slate-800">
                                        {topic.prepTime && (
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                                <History className="w-3.5 h-3.5" />
                                                {topic.prepTime}s Prep
                                            </div>
                                        )}
                                        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                                            <Clock className="w-3.5 h-3.5" />
                                            {topic.speakTime || topic.timePerQuestion}s Limit
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ) : recordingState === 'finished' ? (
                // Feedback & Review View
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-4">
                        <button onClick={resetPractice} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Speaking Analysis</h2>
                    </div>

                    {isAnalyzing ? (
                        <div className="card !rounded-3xl p-16 flex flex-col items-center justify-center space-y-6 text-center shadow-xl shadow-slate-200/40">
                            <div className="relative">
                                <div className="w-24 h-24 border-4 border-rose-100 dark:border-slate-800 rounded-full" />
                                <div className="w-24 h-24 border-4 border-rose-500 border-t-transparent rounded-full animate-spin absolute top-0" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Volume2 className="w-10 h-10 text-rose-500 animate-pulse" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Analyzing your voice...</h3>
                                <p className="text-slate-500 font-medium max-w-xs mx-auto tracking-tight">Our AI is processing fluency, pronunciation, and lexical range.</p>
                            </div>
                        </div>
                    ) : feedback ? (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* Score & Audio Sidebar */}
                            <div className="lg:col-span-1 space-y-6">
                                <div className="card p-8 !rounded-[2.5rem] shadow-xl shadow-slate-200/40 dark:shadow-none border-t-4 border-t-rose-500">
                                    <div className="text-center space-y-2 mb-8">
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estimated Band</span>
                                        <div className="text-8xl font-black text-rose-500 tracking-tighter">
                                            {feedback.band_score}
                                        </div>
                                    </div>

                                    {audioUrl && (
                                        <div className="bg-slate-50 dark:bg-slate-800/80 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 mb-8">
                                            <div className="flex items-center gap-3 mb-3">
                                                <Volume2 className="w-4 h-4 text-slate-400" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Playback Recording</span>
                                            </div>
                                            <audio src={audioUrl} controls className="w-full h-10 brightness-95 rounded-xl" />
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {[
                                            { label: 'Fluency', score: feedback.fluency_coherence.score },
                                            { label: 'Pronunciation', score: feedback.pronunciation.score },
                                            { label: 'Vocabulary', score: feedback.lexical_resource.score },
                                            { label: 'Grammar', score: feedback.grammatical_range.score },
                                        ].map((item) => (
                                            <div key={item.label} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                                <span className="text-xs font-bold text-slate-500 uppercase">{item.label}</span>
                                                <span className="font-black text-slate-900 dark:text-white">{item.score}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Detailed Analysis */}
                            <div className="lg:col-span-2 space-y-8">
                                <div className="card p-10 !rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none space-y-10">
                                    <div className="space-y-6">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                                            <Sparkles className="w-5 h-5 text-rose-500" />
                                            Examiner Review
                                        </h4>
                                        <p className="text-lg text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic border-l-4 border-rose-100 dark:border-rose-900/40 pl-6 py-2">
                                            &quot;{feedback.overall_feedback}&quot;
                                        </p>
                                    </div>

                                    {feedback.transcription && (
                                        <div className="space-y-4">
                                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Transcribed Response</h4>
                                            <SpeakingFeedback
                                                transcription={feedback.transcription}
                                                errors={feedback.annotated_errors || []}
                                            />
                                        </div>
                                    )}

                                    <div className="space-y-6">
                                        <h4 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white flex items-center gap-2">
                                            <TrendingUp className="w-5 h-5 text-emerald-500" />
                                            Actionable Insights
                                        </h4>
                                        <div className="grid gap-3">
                                            {feedback.improvements?.map((imp: string, i: number) => (
                                                <div key={i} className="flex gap-4 p-5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                    <div className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/40 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-600 font-black text-xs">
                                                        {i + 1}
                                                    </div>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 font-medium tracking-tight">
                                                        {imp}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <button onClick={resetPractice} className="flex-1 btn-primary py-5 !rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-xl shadow-blue-600/20 active:scale-95">
                                        Another Topic
                                        <ChevronRight className="w-6 h-6" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card !rounded-3xl p-16 text-center space-y-10 shadow-xl shadow-slate-200/40 border-t-8 border-t-rose-500 max-w-2xl mx-auto">
                            <div className="space-y-4">
                                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CheckCircle2 className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Recording Captured!</h3>
                                <p className="text-slate-500 font-medium">You completed the {selectedTopic.part} and recorded your response.</p>

                                <div className="bg-slate-50 dark:bg-slate-800/80 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 max-w-sm mx-auto">
                                    <audio src={audioUrl || ''} controls className="w-full" />
                                </div>
                            </div>

                            <button
                                onClick={submitForAnalysis}
                                className="w-full py-5 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xl hover:opacity-95 transition-all flex items-center justify-center gap-3 shadow-2xl active:scale-95 group"
                            >
                                <Sparkles className="w-6 h-6 text-blue-400 group-hover:rotate-12 transition-transform" />
                                Start AI Evaluation
                            </button>

                            <button onClick={resetPractice} className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-rose-500 transition-colors">
                                Discard & Retake
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                // Focused Recording Workflow
                <div className="max-w-4xl mx-auto py-10 space-y-12 animate-in fade-in zoom-in-95 duration-500">
                    <div className="text-center space-y-4">
                        <div className={`text-[10rem] font-black leading-none tracking-tighter ${timeLeft <= 10 && recordingState === 'recording' ? 'text-rose-500 animate-pulse' : 'text-slate-900 dark:text-white'}`}>
                            {formatTime(timeLeft)}
                        </div>
                        <div className="flex items-center justify-center gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest flex items-center gap-2 ${recordingState === 'preparing'
                                    ? 'bg-amber-100 text-amber-600'
                                    : 'bg-rose-100 text-rose-600 animate-pulse'
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${recordingState === 'preparing' ? 'bg-amber-500' : 'bg-rose-500'}`} />
                                {recordingState === 'preparing' ? 'Focus & Prepare' : 'Speak Loudly'}
                            </span>
                        </div>
                    </div>

                    <div className="card p-12 !rounded-[3.5rem] shadow-2xl shadow-slate-200/60 dark:shadow-none border-t-8 border-t-blue-600 bg-white dark:bg-slate-900 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                            <Mic className="w-64 h-64" />
                        </div>

                        <div className="relative space-y-10">
                            <div className="flex items-center justify-between">
                                <span className="px-4 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                    {selectedTopic.part}
                                </span>
                                {selectedTopic.questions && (
                                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                                        Question {currentQuestionIdx + 1} / {selectedTopic.questions.length}
                                    </span>
                                )}
                            </div>

                            <div className="min-h-[200px] flex items-center justify-center text-center">
                                {selectedTopic.cueCard ? (
                                    <p className="text-2xl font-bold text-slate-900 dark:text-white leading-[1.6] whitespace-pre-line text-left py-6">
                                        {selectedTopic.cueCard}
                                    </p>
                                ) : (
                                    <h2 className="text-4xl font-black text-slate-900 dark:text-white leading-tight">
                                        {selectedTopic.questions?.[currentQuestionIdx]}
                                    </h2>
                                )}
                            </div>

                            <div className="flex justify-center gap-6 pt-10">
                                {recordingState === 'preparing' ? (
                                    <button
                                        onClick={() => beginRecording(selectedTopic)}
                                        className="btn-primary py-5 px-12 !rounded-2xl font-black text-lg flex items-center gap-3 shadow-blue-600/30"
                                    >
                                        <Mic className="w-6 h-6" />
                                        Start Speaking Now
                                    </button>
                                ) : (
                                    <button
                                        onClick={finishRecording}
                                        className="py-5 px-12 rounded-2xl bg-rose-600 text-white font-black text-lg flex items-center gap-3 shadow-xl shadow-rose-600/30 hover:bg-rose-700 active:scale-95 transition-all"
                                    >
                                        <StopCircle className="w-6 h-6" />
                                        Finish Recording
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {recordingState === 'preparing' && (
                        <div className="flex items-center justify-center gap-3 text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                            <Info className="w-4 h-4" />
                            Note: Your mic will activate automatically when timer reaches zero.
                        </div>
                    )}
                </div>
            )}

            {permissionError && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm">
                    <div className="card max-w-md w-full p-10 text-center space-y-6 !rounded-3xl border-rose-100">
                        <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto">
                            <MicOff className="w-10 h-10" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900">Microphone Required</h3>
                            <p className="text-slate-500 font-medium">We need access to your microphone to analyze your speech. Please enable it in browser settings.</p>
                        </div>
                        <button onClick={() => setPermissionError(false)} className="btn-primary w-full">Got it</button>
                    </div>
                </div>
            )}
        </div>
    );
}

