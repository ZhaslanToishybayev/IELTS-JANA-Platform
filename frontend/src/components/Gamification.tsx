'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';

interface GamificationProps {
    xpGained?: number | null;
    levelUp?: { level: number } | null;
    streak?: { count: number } | null;
}

export default function Gamification({ xpGained, levelUp, streak }: GamificationProps) {
    const { playLevelUp } = useSoundEffects();

    useEffect(() => {
        if (levelUp) {
            playLevelUp();
        }
    }, [levelUp, playLevelUp]);

    // This component is primarily for orchestrating effects and sounds.
    // It might render other animation components based on props.
    return (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            {/* Render other gamification animations here based on props */}
            {/* For example, if you had an XPGainAnimation component: */}
            {/* {xpGained && <XPGainAnimation amount={xpGained} show={!!xpGained} />} */}
            {/* {levelUp && <LevelUpAnimation level={levelUp.level} show={!!levelUp} onComplete={() => {}} />} */}
        </div>
    );
}

interface XPGainProps {
    amount: number;
    show: boolean;
}

export function XPGainAnimation({ amount, show }: XPGainProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 0, scale: 0.5 }}
                    animate={{ opacity: 1, y: -50, scale: 1 }}
                    exit={{ opacity: 0, y: -100 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                >
                    <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-2xl px-6 py-3 rounded-full shadow-lg">
                        +{amount} XP ⚡
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

interface LevelUpProps {
    level: number;
    show: boolean;
    onComplete: () => void;
}

export function LevelUpAnimation({ level, show, onComplete }: LevelUpProps) {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
                    onClick={onComplete}
                >
                    <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, rotate: 180 }}
                        transition={{ type: 'spring', duration: 0.8 }}
                        className="bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 p-8 rounded-3xl shadow-2xl text-center"
                    >
                        <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1 }}
                            className="text-6xl mb-4"
                        >
                            🎉
                        </motion.div>
                        <h2 className="text-white text-3xl font-bold mb-2">Level Up!</h2>
                        <div className="text-white/90 text-xl">You reached Level {level}</div>
                        <button
                            onClick={onComplete}
                            className="mt-6 bg-white text-purple-600 font-semibold px-6 py-2 rounded-full hover:bg-purple-100 transition"
                        >
                            Continue
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

interface StreakDisplayProps {
    streak: number;
    animate?: boolean;
}

export function StreakDisplay({ streak, animate = false }: StreakDisplayProps) {
    return (
        <motion.div
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2 rounded-full"
            animate={animate ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.3 }}
        >
            <motion.span
                animate={animate ? { rotate: [0, -10, 10, 0] } : {}}
                transition={{ duration: 0.5 }}
                className="text-xl"
            >
                🔥
            </motion.span>
            <span className="font-bold">{streak} day streak</span>
        </motion.div>
    );
}

interface ProgressRingProps {
    progress: number; // 0-100
    size?: number;
    strokeWidth?: number;
    children?: ReactNode;
}

export function ProgressRing({ progress, size = 120, strokeWidth = 10, children }: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    className="text-gray-200"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <motion.circle
                    className="text-purple-500"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    style={{
                        strokeDasharray: circumference,
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
                {children}
            </div>
        </div>
    );
}

interface MasteryBarProps {
    skillName: string;
    mastery: number; // 0-1
    category: string;
    isUnlocked: boolean;
}

export function MasteryBar({ skillName, mastery, category, isUnlocked }: MasteryBarProps) {
    const categoryColors: Record<string, string> = {
        'TF_NG': 'from-blue-500 to-cyan-400',
        'HEADINGS': 'from-purple-500 to-pink-400',
        'SUMMARY': 'from-green-500 to-emerald-400',
    };

    const gradientClass = categoryColors[category] || 'from-gray-500 to-gray-400';

    return (
        <div className={`p-4 rounded-xl bg-white/10 backdrop-blur ${!isUnlocked ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-white">{skillName}</span>
                <span className="text-white/80 text-sm">{Math.round(mastery * 100)}%</span>
            </div>
            <div className="h-3 bg-gray-200/20 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full bg-gradient-to-r ${gradientClass} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${mastery * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                />
            </div>
            {!isUnlocked && (
                <span className="text-xs text-white/60 mt-1 block">🔒 Locked</span>
            )}
        </div>
    );
}

interface CorrectIncorrectFeedbackProps {
    isCorrect: boolean;
    show: boolean;
    explanation?: string;
    correctAnswer?: string;
    onContinue: () => void;
}

export function CorrectIncorrectFeedback({
    isCorrect,
    show,
    explanation,
    correctAnswer,
    onContinue,
}: CorrectIncorrectFeedbackProps) {
    const { playSuccess, playError } = useSoundEffects();

    useEffect(() => {
        if (show) {
            if (isCorrect) playSuccess();
            else playError();
        }
    }, [show, isCorrect, playSuccess, playError]);

    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    initial={{ opacity: 0, y: 50 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 50 }}
                    className={`fixed bottom-0 left-0 right-0 p-6 ${isCorrect ? 'bg-green-500' : 'bg-red-500'
                        } text-white`}
                >
                    <div className="max-w-lg mx-auto">
                        <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">{isCorrect ? '✅' : '❌'}</span>
                            <span className="text-xl font-bold">
                                {isCorrect ? 'Correct!' : 'Not quite...'}
                            </span>
                        </div>
                        {!isCorrect && correctAnswer && (
                            <p className="mb-2">
                                <span className="font-semibold">Correct answer:</span> {correctAnswer}
                            </p>
                        )}
                        {explanation && !isCorrect && (
                            <p className="text-white/90 text-sm mb-4">{explanation}</p>
                        )}
                        <button
                            onClick={onContinue}
                            className={`w-full py-3 rounded-xl font-bold ${isCorrect
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'bg-red-600 hover:bg-red-700'
                                } transition`}
                        >
                            Continue
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}

interface BandScoreDisplayProps {
    band: number;
    size?: 'sm' | 'lg';
}

export function BandScoreDisplay({ band, size = 'lg' }: BandScoreDisplayProps) {
    const getBandColor = (b: number) => {
        if (b >= 8) return 'from-green-400 to-emerald-500';
        if (b >= 7) return 'from-blue-400 to-cyan-500';
        if (b >= 6) return 'from-purple-400 to-pink-500';
        if (b >= 5) return 'from-yellow-400 to-orange-500';
        return 'from-red-400 to-pink-500';
    };

    return (
        <div
            className={`bg-gradient-to-br ${getBandColor(band)} rounded-2xl ${size === 'lg' ? 'p-6' : 'p-4'
                } text-center text-white`}
        >
            <div className={size === 'lg' ? 'text-sm' : 'text-xs'}>Estimated Band</div>
            <div className={`font-bold ${size === 'lg' ? 'text-5xl' : 'text-3xl'}`}>
                {band.toFixed(1)}
            </div>
        </div>
    );
}
