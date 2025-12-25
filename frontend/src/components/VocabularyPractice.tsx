'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

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
            <div className="text-center py-12">
                <div className="text-6xl mb-4">🧠</div>
                <h2 className="text-3xl font-bold text-white mb-2">Review Complete!</h2>
                <p className="text-white/60">You've reviewed all due cards for now.</p>
                <div className="mt-8">
                    <a href="/dashboard" className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition font-bold text-white">Back to Dashboard</a>
                </div>
            </div>
        );
    }

    if (!currentCard) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-white mb-2">No cards due</h2>
                <p className="text-white/60">Check back later or add new words!</p>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto">
            <div className="mb-4 text-center text-white/50 text-sm">
                Card {currentIndex + 1} of {cards.length}
            </div>

            <div className="relative h-96 w-full cursor-pointer perspective-1000" onClick={handleFlip}>
                <motion.div
                    className="w-full h-full relative preserve-3d transition-all duration-500"
                    animate={{ rotateY: isFlipped ? 180 : 0 }}
                    transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {/* Front */}
                    <div className="absolute w-full h-full backface-hidden bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex flex-col items-center justify-center p-8 shadow-xl">
                        <span className="text-xs font-bold text-rose-400 tracking-widest uppercase mb-4">Word</span>
                        <h2 className="text-4xl font-bold text-white text-center">{currentCard.word}</h2>
                        <p className="text-white/40 text-sm mt-8">Click to flip</p>
                    </div>

                    {/* Back */}
                    <div
                        className="absolute w-full h-full backface-hidden bg-gradient-to-br from-indigo-900 to-purple-900 border border-white/20 rounded-2xl flex flex-col items-center justify-center p-8 shadow-xl"
                        style={{ transform: 'rotateY(180deg)' }}
                    >
                        <span className="text-xs font-bold text-indigo-300 tracking-widest uppercase mb-2">Definition</span>
                        <p className="text-xl text-white text-center font-medium mb-6">{currentCard.definition}</p>

                        {currentCard.context && (
                            <div className="bg-black/20 p-4 rounded-lg w-full">
                                <span className="text-[10px] text-white/40 uppercase block mb-1">Context</span>
                                <p className="text-sm text-white/80 italic">"{currentCard.context}"</p>
                            </div>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Controls */}
            <div className={`mt-8 grid grid-cols-4 gap-3 transition-opacity duration-300 ${isFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                <button onClick={(e) => { e.stopPropagation(); handleRate(0); }} className="py-3 rounded-xl bg-red-500/20 text-red-300 font-bold hover:bg-red-500/30 transition text-sm">
                    Again
                    <div className="text-[10px] font-normal opacity-70">&lt; 1m</div>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleRate(3); }} className="py-3 rounded-xl bg-orange-500/20 text-orange-300 font-bold hover:bg-orange-500/30 transition text-sm">
                    Hard
                    <div className="text-[10px] font-normal opacity-70">2d</div>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleRate(4); }} className="py-3 rounded-xl bg-blue-500/20 text-blue-300 font-bold hover:bg-blue-500/30 transition text-sm">
                    Good
                    <div className="text-[10px] font-normal opacity-70">4d</div>
                </button>
                <button onClick={(e) => { e.stopPropagation(); handleRate(5); }} className="py-3 rounded-xl bg-green-500/20 text-green-300 font-bold hover:bg-green-500/30 transition text-sm">
                    Easy
                    <div className="text-[10px] font-normal opacity-70">7d</div>
                </button>
            </div>

            {!isFlipped && (
                <div className="mt-8 text-center text-white/30 text-sm">
                    Tap card to reveal definition
                </div>
            )}
        </div>
    );
}
