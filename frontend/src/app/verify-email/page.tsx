'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';

export default function VerifyEmailPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            verifyEmail(token);
        } else {
            setStatus('error');
            setMessage('Token not found in URL');
        }
    }, [searchParams]);

    const verifyEmail = async (token: string) => {
        try {
            const result = await api.verifyEmail(token);
            setStatus('success');
            setMessage(result.message);
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'Verification failed');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white dark:bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center shadow-xl"
            >
                {status === 'loading' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Verifying...</h1>
                        <p className="text-slate-500 dark:text-slate-400">Confirming your email address</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Email Verified!</h1>
                        <p className="text-slate-500 dark:text-slate-400 mb-6">{message}</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            Log in to your account
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Error</h1>
                        <p className="text-red-500 dark:text-red-400 mb-6">{message}</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-white font-semibold rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                        >
                            Back to Login
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}
