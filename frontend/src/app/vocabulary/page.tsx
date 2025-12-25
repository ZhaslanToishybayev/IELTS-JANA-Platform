'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import VocabularyPractice from '@/components/VocabularyPractice';

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
            // Reload cards to see if the new one is due (it is by default)
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
        <div className="min-h-screen bg-slate-900 text-white">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-sm border-b border-white/5">
                <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <a href="/dashboard" className="text-white/70 hover:text-white">←</a>
                        <h1 className="text-xl font-bold">🧠 Smart Vocabulary</h1>
                    </div>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-bold transition"
                    >
                        + Add Word
                    </button>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 py-12">
                {loading ? (
                    <div className="text-center py-20 text-white/50">Loading your deck...</div>
                ) : cards.length > 0 ? (
                    <VocabularyPractice initialCards={cards} />
                ) : (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-6">🎉</div>
                        <h2 className="text-2xl font-bold mb-2">No Cards Due!</h2>
                        <p className="text-white/60 mb-8">You have reviewed all your vocabulary for today.</p>
                        <button
                            onClick={() => setShowAddModal(true)}
                            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-medium transition"
                        >
                            Add New Words
                        </button>
                    </div>
                )}
            </main>

            {/* Add Word Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
                    <div className="bg-slate-800 rounded-2xl p-6 w-full max-w-md border border-white/10 shadow-2xl">
                        <h3 className="text-xl font-bold mb-4">Add Custom Word</h3>
                        <form onSubmit={handleAddWord} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Word</label>
                                <input
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                                    placeholder="e.g. Ubiquitous"
                                    value={newWord}
                                    onChange={e => setNewWord(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Definition</label>
                                <textarea
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none h-24"
                                    placeholder="Meaning of the word..."
                                    value={newDef}
                                    onChange={e => setNewDef(e.target.value)}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs uppercase tracking-wider text-white/50 mb-1">Context (Optional)</label>
                                <input
                                    className="w-full bg-black/20 border border-white/10 rounded-lg p-3 text-white focus:border-indigo-500 outline-none"
                                    placeholder="Example sentence..."
                                    value={newContext}
                                    onChange={e => setNewContext(e.target.value)}
                                />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-bold transition"
                                >
                                    Save Word
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
