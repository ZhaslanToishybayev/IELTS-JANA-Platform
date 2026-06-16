'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  Sparkles,
  Target,
} from 'lucide-react';

const flowSteps = [
  {
    title: 'Reading Diagnostic',
    text: 'Start with 10 IELTS-style Reading questions to build your first skill profile.',
    icon: ClipboardList,
  },
  {
    title: 'Daily Plan',
    text: 'Get a focused study path based on your weakest Reading question types.',
    icon: Target,
  },
  {
    title: 'Mistake Review',
    text: 'Turn wrong answers into a clear review queue with explanations and next actions.',
    icon: CheckCircle2,
  },
];

export default function Home() {
  const demoLoginEnabled = process.env.NEXT_PUBLIC_ENABLE_DEMO_LOGIN === 'true';

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white">
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#f8fafc_0%,#e0f2fe_45%,#ecfeff_100%)] dark:bg-[linear-gradient(135deg,#020617_0%,#0f172a_55%,#082f49_100%)]" />
        <div className="relative max-w-7xl mx-auto px-6 py-8 md:py-10">
          <header className="flex items-center justify-between gap-4 mb-16">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xl font-black tracking-tight">IELTS JANA</div>
                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">Reading prep</div>
              </div>
            </div>
            <Link href="/login" className="hidden sm:inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-black text-slate-700 dark:text-slate-200 hover:bg-white/70 dark:hover:bg-white/10 transition">
              Log in
            </Link>
          </header>

          <div className="grid lg:grid-cols-[1fr_0.9fr] gap-10 lg:gap-16 items-center pb-8">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-3xl"
            >
              <div className="inline-flex items-center gap-2 rounded-full bg-white/80 dark:bg-white/10 border border-white dark:border-white/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-700 dark:text-blue-200 mb-6">
                <BookOpen className="w-4 h-4" />
                AI-powered IELTS Reading preparation
              </div>
              <h1 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.95] text-slate-950 dark:text-white">
                Master IELTS Reading with a personal AI study path.
              </h1>
              <p className="mt-6 text-lg md:text-xl font-medium leading-relaxed text-slate-600 dark:text-slate-300 max-w-2xl">
                Take a short diagnostic, find your weak question types, and follow a daily plan built around your mistakes.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link href="/login" className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-4 text-sm font-black text-white shadow-xl shadow-blue-600/20 hover:bg-blue-700 transition">
                  Start free diagnostic
                  <ArrowRight className="w-4 h-4" />
                </Link>
                {demoLoginEnabled && (
                  <Link href="/login?demo=1" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/90 dark:bg-white/10 border border-slate-200 dark:border-white/10 px-6 py-4 text-sm font-black text-slate-800 dark:text-white hover:bg-white dark:hover:bg-white/15 transition">
                    Try demo account
                    <Sparkles className="w-4 h-4" />
                  </Link>
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.1 }}
              className="relative"
            >
              <div className="rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl shadow-slate-300/40 dark:shadow-black/30 p-5 md:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <div className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">Today</div>
                    <div className="text-2xl font-black mt-1">Reading Plan</div>
                  </div>
                  <div className="rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-200 px-4 py-3 text-sm font-black">+50 XP</div>
                </div>
                <div className="space-y-3">
                  {[
                    ['Diagnostic complete', '7/10 correct'],
                    ['Weak focus', 'Matching Information'],
                    ['Next action', 'Review 4 mistakes'],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-100 dark:border-slate-800 p-4 flex items-center justify-between gap-4">
                      <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{label}</span>
                      <span className="text-sm font-black text-slate-900 dark:text-white text-right">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-5 rounded-2xl bg-slate-950 text-white p-5">
                  <div className="flex items-center gap-2 text-blue-200 text-xs font-black uppercase tracking-widest mb-3">
                    <BarChart3 className="w-4 h-4" />
                    Skill profile
                  </div>
                  <div className="space-y-3">
                    {[
                      ['Headings', '68%'],
                      ['Summary', '54%'],
                      ['Matching Info', '41%'],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <div className="flex justify-between text-xs font-bold mb-1.5">
                          <span>{label}</span>
                          <span>{value}</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full bg-blue-400" style={{ width: value }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-3 gap-4">
          {flowSteps.map((step) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6">
                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 flex items-center justify-center mb-5">
                  <Icon className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black">{step.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-400 font-medium">{step.text}</p>
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}
