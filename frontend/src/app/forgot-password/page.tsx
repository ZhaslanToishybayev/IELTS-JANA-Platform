'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Mail, Lock, ArrowLeft, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');

        try {
            const result = await api.forgotPassword(email);
            setStatus('success');
            setMessage(result.message);
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'An error occurred while processing your request.');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 selection:bg-blue-100 selection:text-blue-900">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="card !rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-10 md:p-12 shadow-2xl shadow-slate-200/60 dark:shadow-none overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <Lock className="w-32 h-32" />
                    </div>

                    <div className="relative z-10">
                        <div className="mb-10 text-center">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Lock className="w-10 h-10 text-blue-600" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Recover Access</h1>
                            <p className="text-slate-500 font-medium leading-relaxed tracking-tight">
                                Enter your registered email address and we'll send you instructions to reset your password.
                            </p>
                        </div>

                        <AnimatePresence mode="wait">
                            {status === 'success' ? (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center py-4"
                                >
                                    <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 dark:border-emerald-900/30">
                                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                                    </div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2">Check Your Inbox</h2>
                                    <p className="text-slate-500 font-medium mb-10 tracking-tight">{message}</p>
                                    <Link
                                        href="/login"
                                        className="btn-primary py-4 px-10 !rounded-2xl w-full"
                                    >
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Back to Login
                                    </Link>
                                </motion.div>
                            ) : (
                                <motion.form
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-8"
                                >
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-2 px-1">
                                            <Mail className="w-3.5 h-3.5" />
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                            placeholder="name@example.com"
                                        />
                                    </div>

                                    {status === 'error' && (
                                        <motion.div
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl"
                                        >
                                            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                                            <p className="text-rose-600 text-xs font-bold leading-tight uppercase tracking-tighter">{message}</p>
                                        </motion.div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={status === 'loading'}
                                        className="btn-primary w-full py-5 !rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-blue-600/20"
                                    >
                                        {status === 'loading' ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                Processing...
                                            </div>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                Send Reset Link
                                                <Sparkles className="w-4 h-4" />
                                            </span>
                                        )}
                                    </button>

                                    <div className="text-center pt-2">
                                        <Link
                                            href="/login"
                                            className="text-slate-400 hover:text-blue-600 transition-colors text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 group"
                                        >
                                            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
                                            Remembered Password? Log In
                                        </Link>
                                    </div>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                <div className="mt-12 text-center opacity-40">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">IELTS JANA Premium Education</p>
                </div>
            </motion.div>
        </div>
    );
}

