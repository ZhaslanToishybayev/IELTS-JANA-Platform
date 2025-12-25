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
            setMessage('Токен не найден в URL');
        }
    }, [searchParams]);

    const verifyEmail = async (token: string) => {
        try {
            const result = await api.verifyEmail(token);
            setStatus('success');
            setMessage(result.message);
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'Ошибка верификации');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gray-800/50 backdrop-blur-sm rounded-2xl p-8 max-w-md w-full text-center"
            >
                {status === 'loading' && (
                    <>
                        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500 mx-auto mb-4"></div>
                        <h1 className="text-2xl font-bold text-white mb-2">Проверяем...</h1>
                        <p className="text-gray-400">Подтверждаем ваш email адрес</p>
                    </>
                )}

                {status === 'success' && (
                    <>
                        <div className="text-6xl mb-4">✅</div>
                        <h1 className="text-2xl font-bold text-white mb-2">Email подтверждён!</h1>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white font-semibold hover:opacity-90 transition-opacity"
                        >
                            Войти в аккаунт
                        </button>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="text-6xl mb-4">❌</div>
                        <h1 className="text-2xl font-bold text-white mb-2">Ошибка</h1>
                        <p className="text-red-400 mb-6">{message}</p>
                        <button
                            onClick={() => router.push('/login')}
                            className="px-6 py-3 bg-gray-700 rounded-xl text-white font-semibold hover:bg-gray-600 transition-colors"
                        >
                            Вернуться на главную
                        </button>
                    </>
                )}
            </motion.div>
        </div>
    );
}
