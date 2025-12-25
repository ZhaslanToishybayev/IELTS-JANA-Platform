'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { ReactNode, useEffect } from 'react';
import { useSoundEffects } from '@/hooks/useSoundEffects';
import {
    Zap,
    Trophy,
    Flame,
    Star,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Lock,
    ArrowRight
} from 'lucide-react';

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

    return (
        <div className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center">
            {/* Orchestrates effects */}
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
                    initial={{ opacity: 0, y: 0, scale: 0.8 }}
                    animate={{ opacity: 1, y: -60, scale: 1 }}
                    exit={{ opacity: 0, y: -100 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
                >
                    <div className="bg-blue-600 text-white font-bold text-xl px-6 py-2.5 rounded-full shadow-xl shadow-blue-500/20 border border-blue-400/30 flex items-center gap-2">
                        <Zap className="w-5 h-5 fill-current" />
                        <span>+{amount} XP</span>
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
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm"
                    onClick={onComplete}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.9, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-10 rounded-2xl shadow-2xl text-center max-w-sm w-full"
                    >
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Star className="w-10 h-10 text-blue-600 fill-blue-600" />
                        </div>
                        <h2 className="text-slate-900 dark:text-white text-3xl font-extrabold mb-2">Level Up!</h2>
                        <div className="text-slate-500 dark:text-slate-400 text-lg mb-8">
                            You&apos;ve reached <span className="text-blue-600 font-bold">Level {level}</span>
                        </div>
                        <button
                            onClick={onComplete}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
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
            className="flex items-center gap-2 bg-orange-50 border border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30 text-orange-600 dark:text-orange-400 px-4 py-2 rounded-lg"
            animate={animate ? { scale: [1, 1.05, 1] } : {}}
            transition={{ duration: 0.3 }}
        >
            <Flame className={`w-5 h-5 ${animate ? 'animate-bounce' : ''} fill-current`} />
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

export function ProgressRing({ progress, size = 120, strokeWidth = 8, children }: ProgressRingProps) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
            <svg className="transform -rotate-90" width={size} height={size}>
                <circle
                    className="text-slate-100 dark:text-slate-800"
                    strokeWidth={strokeWidth}
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <motion.circle
                    className="text-blue-600"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                    initial={{ strokeDashoffset: circumference }}
                    animate={{ strokeDashoffset }}
                    transition={{ duration: 1.2, ease: 'easeInOut' }}
                    style={{
                        strokeDasharray: circumference,
                    }}
                />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center whitespace-nowrap">
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
    const colorClass = isUnlocked ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-700';

    return (
        <div className={`card p-5 ${!isUnlocked ? 'opacity-60 bg-slate-50' : ''}`}>
            <div className="flex justify-between items-center mb-3">
                <span className="font-semibold text-slate-700 dark:text-slate-200">{skillName}</span>
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                    {Math.round(mastery * 100)}%
                </span>
            </div>
            <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <motion.div
                    className={`h-full ${colorClass} rounded-full`}
                    initial={{ width: 0 }}
                    animate={{ width: `${mastery * 100}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                />
            </div>
            {!isUnlocked && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-wider">
                    <Lock className="w-3 h-3" />
                    Locked
                </div>
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
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className={`fixed bottom-0 left-0 right-0 p-8 z-[100] ${isCorrect ? 'bg-green-50 dark:bg-green-950/40' : 'bg-red-50 dark:bg-red-950/40'
                        } border-t ${isCorrect ? 'border-green-200 dark:border-green-900/50' : 'border-red-200 dark:border-red-900/50'}`}
                >
                    <div className="max-w-2xl mx-auto flex flex-col md:flex-row items-center gap-6">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0 ${isCorrect ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'
                            }`}>
                            {isCorrect ? (
                                <CheckCircle2 className="w-10 h-10 text-green-600" />
                            ) : (
                                <XCircle className="w-10 h-10 text-red-600" />
                            )}
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            <h3 className={`text-2xl font-extrabold mb-1 ${isCorrect ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'}`}>
                                {isCorrect ? 'Excellent Work!' : 'Not Quite Right'}
                            </h3>

                            {!isCorrect && correctAnswer && (
                                <div className="text-red-700 dark:text-red-400 font-medium mb-2">
                                    Correct answer: <span className="font-bold underlineDecoration-red-300 underline-offset-4 decoration-2">{correctAnswer}</span>
                                </div>
                            )}

                            {explanation && (
                                <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed max-w-xl">
                                    {explanation}
                                </p>
                            )}
                        </div>

                        <button
                            onClick={onContinue}
                            className={`px-10 py-4 rounded-xl font-extrabold text-white transition-all shadow-lg active:scale-95 flex items-center gap-2 ${isCorrect
                                    ? 'bg-green-600 hover:bg-green-700 shadow-green-600/20'
                                    : 'bg-red-600 hover:bg-red-700 shadow-red-600/20'
                                }`}
                        >
                            Continue
                            <ArrowRight className="w-5 h-5" />
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
        if (b >= 8) return 'bg-green-600 shadow-green-600/20';
        if (b >= 7) return 'bg-blue-600 shadow-blue-600/20';
        if (b >= 6) return 'bg-indigo-600 shadow-indigo-600/20';
        if (b >= 5) return 'bg-orange-600 shadow-orange-600/20';
        return 'bg-slate-700 shadow-slate-700/20';
    };

    return (
        <div
            className={`${getBandColor(band)} text-white rounded-xl shadow-lg border border-white/10 ${size === 'lg' ? 'p-8' : 'p-4'
                } text-center relative overflow-hidden`}
        >
            <div className={`font-bold uppercase tracking-widest ${size === 'lg' ? 'text-xs mb-4 opacity-80' : 'text-[10px] mb-1 opacity-60'}`}>
                Estimated Band Score
            </div>
            <div className={`font-black ${size === 'lg' ? 'text-7xl' : 'text-4xl'}`}>
                {band.toFixed(1)}
            </div>
            {/* Subtle background icon */}
            <TrendingUp className="absolute -bottom-4 -right-4 w-24 h-24 opacity-10 pointer-events-none" />
        </div>
    );
}

