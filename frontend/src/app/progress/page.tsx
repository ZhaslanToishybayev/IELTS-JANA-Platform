'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { ProgressCharts } from '@/components/ProgressCharts';
import { BarChart3 } from 'lucide-react';

export default function ProgressPage() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="pb-24 max-w-6xl mx-auto px-4 md:px-0">
            <div className="space-y-2 py-6 mb-10">
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
                    <BarChart3 className="w-10 h-10 text-blue-600" />
                    Progress Analytics
                </h1>
                <p className="text-slate-500 font-medium tracking-tight">Track your IELTS preparation journey over time.</p>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
            >
                <ProgressCharts />
            </motion.div>
        </div>
    );
}
