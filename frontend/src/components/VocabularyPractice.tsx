'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import {
    RotateCcw,
    Check,
    Sparkles,
    BookOpen,
    Info,
    Quote,
    ChevronRight,
    Trophy,
    ArrowRight
} from 'lucide-react';
import Link from 'next/link';

interface Flashcard {
    id: number;
    word: string;
    definition: string;
    context: string;
    next_review: string;
}

interface VocabularyPracticeProps {
    initialCards: Flashcard[];
}

export default function VocabularyPractice({ initialCards }: VocabularyPracticeProps) {
    const { token } = useAuth();
    const [cards, setCards] = useState<Flashcard[]>(initialCards);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [sessionComplete, setSessionComplete] = useState(false);

    const currentCard = cards[currentIndex];

    const handleFlip = () => {
        setIsFlipped(!isFlipped);
    };

    const handleRate = async (quality: number) => {
        if (!token || !currentCard) return;

        try {
            await api.reviewFlashcard(token, currentCard.id, quality);

            if (currentIndex < cards.length - 1) {
                setIsFlipped(false);
                setTimeout(() => setCurrentIndex(prev => prev + 1), 200);
            } else {
                setSessionComplete(true);
            }
        } catch (err) {
            console.error("Failed to submit review", err);
        }
    };

    if (sessionComplete) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-16 text-center !rounded-[3rem] bg-slate-900 text-white shadow-2xl shadow-blue-900/10 border-none relative overflow-hidden"
            >
                <div className="absolute top-0 left-0 p-10 opacity-10">
                    <Trophy className="w-40 h-40" />
                </div>

                <div className="relative z-10 space-y-8">
                    <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                        <Sparkles className="w-12 h-12 text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-4xl font-black mb-2 tracking-tight">Review Complete!</h2>
                        <p className="text-blue-100/60 font-medium text-lg">You've successfully mastered your vocabulary goal for today.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                        <Link
                            href="/dashboard"
                            className="btn-primary !bg-white !text-slate-900 hover:!bg-blue-50 py-4 px-10 !rounded-2xl w-full sm:w-auto"
                        >
                            Return Home
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 font-black text-white/70 hover:text-white transition-colors uppercase tracking-widest text-xs px-6"
                        >
                            <RotateCcw className="w-4 h-4" />
                            Another Session
                        </button>
                    </div>
                </div>
            </motion.div>
        );
    }

    if (!currentCard) return null;

    return (
        <div className="max-w-2xl mx-auto">
            {/* Progress Header */}
            <div className="flex items-center justify-between mb-8 px-4">
                <div className="flex items-center gap-3">
                    <div className="h-2 w-48 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full bg-blue-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
                        />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        {currentIndex + 1} / {cards.length}
                    </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-full">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">SRS Active</span>
                </div>
            </div>

            <div className="relative h-[28rem] w-full perspective-1000 group cursor-pointer" onClick={handleFlip}>
                <motion.div
                    className="w-full h-full relative preserve-3d"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {/* Front: The Word */}
                    <div className="absolute w-full h-full backface-hidden card !rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center p-12 shadow-2xl shadow-slate-200/50 dark:shadow-none overflow-hidden hover:border-blue-200/50 transition-colors">
                        <div className="absolute top-0 left-0 p-8 opacity-5">
                            <BookOpen className="w-32 h-32" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
                            <Sparkles className="w-3 h-3 text-blue-600" />
                            Memorize Target
                        </span>
                        <h2 className="text-6xl font-black text-slate-900 dark:text-white text-center leading-tight tracking-tighter">{currentCard.word}</h2>

                        <div className="mt-12 flex items-center gap-2 text-blue-600 font-black uppercase tracking-widest text-[10px]">
                            Tap to reveal definition
                            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>

                    {/* Back: Definition & Context */}
                    <div
                        className="absolute w-full h-full backface-hidden card !rounded-[3rem] bg-slate-900 text-white border-none flex flex-col p-12 shadow-2xl overflow-hidden"
                        style={{ transform: 'rotateY(180deg)' }}
                    >
                        <div className="absolute bottom-0 right-0 p-8 opacity-10">
                            <Info className="w-40 h-40" />
                        </div>

                        <div className="relative z-10 flex-1 flex flex-col justify-center">
                            <span className="text-[10px] font-black text-blue-400 tracking-[0.3em] uppercase mb-4 flex items-center gap-2">
                                <Info className="w-3 h-3" />
                                Definition
                            </span>
                            <p className="text-3xl font-black text-white leading-tight mb-10">{currentCard.definition}</p>

                            {currentCard.context && (
                                <div className="bg-white/5 border border-white/5 p-8 rounded-[2rem] relative mt-auto group">
                                    <Quote className="absolute top-6 left-6 w-8 h-8 text-white/5 -translate-x-2 -translate-y-2" />
                                    <span className="text-[10px] font-black text-slate-500 uppercase block mb-3 tracking-widest">In Context</span>
                                    <p className="text-sm text-slate-300 font-medium leading-relaxed italic relative z-10">
                                        "{currentCard.context}"
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Controls */}
            <AnimatePresence>
                {isFlipped && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4"
                    >
                        <button onClick={(e) => { e.stopPropagation(); handleRate(0); }} className="flex flex-col items-center gap-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-900/20 group transition-all">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Again</span>
                            <span className="font-black text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">Bad</span>
                            <span className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-tighter">&lt; 1m</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleRate(3); }} className="flex flex-col items-center gap-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 group transition-all">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Hard</span>
                            <span className="font-black text-slate-900 dark:text-white group-hover:text-amber-600 transition-colors">Struggled</span>
                            <span className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-tighter">2d</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleRate(4); }} className="flex flex-col items-center gap-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 group transition-all">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Good</span>
                            <span className="font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">Remembered</span>
                            <span className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-tighter">4d</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleRate(5); }} className="flex flex-col items-center gap-1 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 group transition-all">
                            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Easy</span>
                            <span className="font-black text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">Instinct</span>
                            <span className="text-[8px] font-black text-slate-300 uppercase mt-1 tracking-tighter">7d</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {!isFlipped && (
                <div className="mt-10 flex items-center justify-center gap-3 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">
                    <div className="w-8 h-px bg-slate-100 dark:bg-slate-800" />
                    Interact with the card
                    <div className="w-8 h-px bg-slate-100 dark:bg-slate-800" />
                </div>
            )}
        </div>
    );
}

