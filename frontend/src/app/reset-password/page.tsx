'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '@/lib/api';
import Link from 'next/link';
import { Key, ShieldCheck, Lock, CheckCircle2, AlertCircle, ArrowRight, Sparkles } from 'lucide-react';

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const urlToken = searchParams.get('token');
        if (urlToken) {
            setToken(urlToken);
        } else {
            setStatus('error');
            setMessage('Password reset token not found or expired.');
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setStatus('error');
            setMessage('Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            setStatus('error');
            setMessage('Password must be at least 8 characters long.');
            return;
        }

        setStatus('loading');

        try {
            const result = await api.resetPassword(token!, password);
            setStatus('success');
            setMessage(result.message);
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'Failed to update password.');
        }
    };

    const requirements = [
        { label: 'Minimum 8 characters', met: password.length >= 8 },
        { label: 'Uppercase letter', met: /[A-Z]/.test(password) },
        { label: 'Lowercase letter', met: /[a-z]/.test(password) },
        { label: 'Numerical digit', met: /\d/.test(password) },
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 selection:bg-blue-100 selection:text-blue-900">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="card !rounded-[3rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-10 md:p-12 shadow-2xl shadow-slate-200/60 dark:shadow-none overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-5">
                        <ShieldCheck className="w-32 h-32" />
                    </div>

                    <div className="relative z-10">
                        <div className="mb-10 text-center">
                            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Key className="w-10 h-10 text-blue-600" />
                            </div>
                            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Create New Password</h1>
                            <p className="text-slate-500 font-medium leading-relaxed tracking-tight">
                                Choose a strong, secure password for your IELTS JANA account.
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
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white mb-2 tracking-tight">Access Restored</h2>
                                    <p className="text-slate-500 font-medium mb-10 tracking-tight">{message}</p>
                                    <button
                                        onClick={() => router.push('/login')}
                                        className="btn-primary py-4 px-10 !rounded-2xl w-full flex items-center justify-center gap-2"
                                    >
                                        Log In Now
                                        <ArrowRight className="w-4 h-4" />
                                    </button>
                                </motion.div>
                            ) : !token ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="text-center py-4"
                                >
                                    <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-rose-100 dark:border-rose-900/30">
                                        <AlertCircle className="w-8 h-8 text-rose-600" />
                                    </div>
                                    <p className="text-rose-600 font-bold mb-10 tracking-tight leading-relaxed">{message}</p>
                                    <Link
                                        href="/forgot-password"
                                        className="text-blue-600 hover:text-blue-700 font-black uppercase tracking-widest text-[10px]"
                                    >
                                        Request a new link
                                    </Link>
                                </motion.div>
                            ) : (
                                <motion.form
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    onSubmit={handleSubmit}
                                    className="space-y-6"
                                >
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-2 px-1">
                                            <Lock className="w-3.5 h-3.5" />
                                            New Password
                                        </label>
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            minLength={8}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 flex items-center gap-2 px-1">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            Confirm Password
                                        </label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl text-slate-900 dark:text-white font-bold focus:border-blue-600 focus:ring-4 focus:ring-blue-600/5 outline-none transition-all placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                            placeholder="••••••••"
                                        />
                                    </div>

                                    {/* Password requirements */}
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl space-y-3 border border-slate-100 dark:border-slate-800/50">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Security Score</span>
                                        <div className="space-y-2">
                                            {requirements.map((req, idx) => (
                                                <div key={idx} className="flex items-center gap-3">
                                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center ${req.met ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                                                        {req.met && <CheckCircle2 className="w-3 h-3" />}
                                                    </div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-tight ${req.met ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                                                        {req.label}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
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
                                                Saving...
                                            </div>
                                        ) : (
                                            <span className="flex items-center justify-center gap-2">
                                                Update Password
                                                <Sparkles className="w-4 h-4" />
                                            </span>
                                        )}
                                    </button>
                                </motion.form>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

