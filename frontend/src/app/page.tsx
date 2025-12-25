'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { Sparkles } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (user) {
        router.push('/dashboard');
      } else {
        router.push('/login');
      }
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center p-6 pb-24 selection:bg-blue-100 selection:text-blue-900">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-8"
        >
          <div className="relative inline-block">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                opacity: [0.3, 0.5, 0.3]
              }}
              transition={{ repeat: Infinity, duration: 4 }}
              className="absolute -inset-4 bg-blue-500/10 dark:bg-blue-400/5 blur-3xl rounded-full"
            />
            <div className="relative w-24 h-24 bg-white dark:bg-slate-800 rounded-[2.5rem] shadow-2xl shadow-slate-200/60 dark:shadow-none flex items-center justify-center mx-auto border border-slate-100 dark:border-slate-800">
              <Sparkles className="w-10 h-10 text-blue-600" />
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
              JANA
            </h1>
            <p className="text-[10px] uppercase font-black tracking-[0.4em] text-slate-400">
              IELTS Premium Education
            </p>
          </div>

          <div className="pt-8">
            <div className="flex items-center justify-center gap-1.5">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 1, 0.3]
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    delay: i * 0.2
                  }}
                  className="w-1.5 h-1.5 bg-blue-600 rounded-full"
                />
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-12 left-0 right-0 text-center opacity-30">
        <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-500">
          Precision Training for Modern Success
        </p>
      </div>
    </div>
  );
}

