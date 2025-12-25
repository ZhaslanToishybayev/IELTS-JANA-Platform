'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import VocabularyPractice from '@/components/VocabularyPractice';
import {
    Brain,
    Plus,
    BookOpen,
    Sparkles,
    ArrowLeft,
    X,
    MessageSquare,
    Info,
    Library
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VocabularyPage() {
    const { user, token } = useAuth();
    const [cards, setCards] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form state
    const [newWord, setNewWord] = useState("");
    const [newDef, setNewDef] = useState("");
    const [newContext, setNewContext] = useState("");

    const loadCards = async () => {
        if (!token) return;
        try {
            const data = await api.getDueFlashcards(token);
            setCards(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddWord = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!token) return;

        try {
            await api.addVocabulary(token, newWord, newDef, newContext);
            setShowAddModal(false);
            setNewWord("");
            setNewDef("");
            setNewContext("");
            loadCards();
        } catch (err) {
            alert("Failed to add word.");
        }
    };

    useEffect(() => {
        loadCards();
    }, [token]);

    if (!user) return null;

    return (
        <div className="pb-24 max-w-5xl mx-auto px-4 md:px-0">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between py-6 mb-10 gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                        <Brain className="w-10 h-10 text-blue-600" />
                        Smart Vocabulary
                    </h1>
                    <p className="text-slate-500 font-medium tracking-tight">Master advanced IELTS vocabulary through active recall and spaced repetition.</p>
                </div>

                <button
                    onClick={() => setShowAddModal(true)}
                    className="btn-primary py-3 px-6 !rounded-2xl"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    Add Custom Word
                </button>
            </div>

            <main>
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 space-y-4">
                        <div className="w-12 h-12 border-4 border-slate-200 dark:border-slate-800 border-t-blue-600 rounded-full animate-spin" />
                        <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Preparing your deck...</span>
                    </div>
                ) : cards.length > 0 ? (
                    <VocabularyPractice initialCards={cards} />
                ) : (
                    <div className="card p-16 text-center !rounded-[3rem] bg-white dark:bg-slate-900 border-dashed border-2 border-slate-200 dark:border-slate-800 shadow-none">
                        <div className="w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-8">
                            <Sparkles className="w-12 h-12 text-blue-600" />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">All Caught Up!</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto mb-10 tracking-tight">
                            Your revision deck is currently empty. You have mastered all your words for today!
                        </p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="btn-primary !bg-slate-900 !text-white hover:!bg-slate-800 py-4 px-10 !rounded-2xl"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Expand Vocabulary
                        </button>
                    </div>
                )}
            </main>

            {/* Add Word Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowAddModal(false)}
                            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 w-full max-w-xl shadow-2xl relative z-10 overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                <Library className="w-32 h-32" />
                            </div>

                            <div className="flex justify-between items-start mb-8">
                                <div className="space-y-1">
                                    <h3 className="text-2xl font-black text-slate-900 dark:text-white">Add New Word</h3>
                                    <p className="text-slate-500 font-medium text-sm">Save a new word to your interactive learning deck.</p>
                                </div>
                                <button
                                    onClick={() => setShowAddModal(false)}
                                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors"
                                >
                                    <X className="w-6 h-6 text-slate-400" />
                                </button>
                            </div>

                            <form onSubmit={handleAddWord} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-2">
                                        <BookOpen className="w-3 h-3" />
                                        Target Word
                                    </label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                        placeholder="e.g. Ubiquitous"
                                        value={newWord}
                                        onChange={e => setNewWord(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-2">
                                        <Info className="w-3 h-3" />
                                        Academic Definition
                                    </label>
                                    <textarea
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none h-32 transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600 resize-none"
                                        placeholder="Enter the precise meaning..."
                                        value={newDef}
                                        onChange={e => setNewDef(e.target.value)}
                                        required
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-2">
                                        <MessageSquare className="w-3 h-3" />
                                        Contextual Example
                                    </label>
                                    <input
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 text-slate-900 dark:text-white font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                        placeholder="e.g. Smartphones are now ubiquitous in society."
                                        value={newContext}
                                        onChange={e => setNewContext(e.target.value)}
                                    />
                                </div>

                                <div className="flex gap-4 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowAddModal(false)}
                                        className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-2xl font-black text-slate-500 transition-all text-sm uppercase tracking-widest"
                                    >
                                        Dismiss
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-blue-600/20 text-sm uppercase tracking-widest"
                                    >
                                        Save Word
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

