'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface WritingError {
    original_text: string;
    correction: string;
    type: string;
    explanation: string;
}

interface EssayFeedbackProps {
    essayText: string;
    errors: WritingError[];
}

export function EssayFeedback({ essayText, errors }: EssayFeedbackProps) {
    const [hoveredError, setHoveredError] = React.useState<WritingError | null>(null);

    // Simple parser: Replace occurrences of error text with highlighted spans.
    // Note: This is a basic implementation. Re-occurrences might be tricky, 
    // but for MVP it works if errors are unique enough strings.
    // A robust solution uses indices, but LLM indices can be hallucinated/off.
    // Text matching is safer if the LLM quotes accurately.

    // We will split the text by errors to render parts.
    // However, overlapping errors (rare in simple feedback) break this.
    // Let's use a simpler "replace" strategy for display, or just interactive highlights.

    // Better strategy:
    // 1. Iterate through errors and find their position in text. 
    // 2. Sort errors by position.
    // 3. Slice text into chunks (normal, error, normal, error...).

    const getSegments = () => {
        let segments: { text: string; error?: WritingError }[] = [];
        let currentIndex = 0;

        // Find positions of all errors
        const errorPositions = errors
            .map(err => {
                const index = essayText.indexOf(err.original_text);
                return { ...err, index };
            })
            .filter(err => err.index !== -1)
            .sort((a, b) => a.index - b.index);

        // Remove duplicates or overlaps (simple greedy)
        const uniqueErrors: typeof errorPositions = [];
        let lastEnd = 0;

        errorPositions.forEach(err => {
            if (err.index >= lastEnd) {
                uniqueErrors.push(err);
                lastEnd = err.index + err.original_text.length;
            }
        });

        // Build segments
        let lastPos = 0;
        uniqueErrors.forEach(err => {
            // Text before error
            if (err.index > lastPos) {
                segments.push({ text: essayText.slice(lastPos, err.index) });
            }
            // Error itself
            segments.push({ text: essayText.slice(err.index, err.index + err.original_text.length), error: err });
            lastPos = err.index + err.original_text.length;
        });

        // Remaining text
        if (lastPos < essayText.length) {
            segments.push({ text: essayText.slice(lastPos) });
        }

        // If no errors matched (fallback), just show full text
        if (segments.length === 0 && essayText.length > 0) {
            return [{ text: essayText }];
        }

        return segments;
    };

    const segments = getSegments();

    return (
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 relative">
            <h3 className="text-xl font-bold text-white mb-4">📝 Detailed Correction</h3>

            <div className="prose prose-invert max-w-none text-lg leading-relaxed whitespace-pre-wrap font-serif">
                {segments.map((segment, idx) => (
                    <React.Fragment key={idx}>
                        {segment.error ? (
                            <span
                                className={`relative cursor-pointer border-b-2 transition-colors duration-200 ${segment.error.type === 'Grammar' ? 'border-red-400 text-red-100 hover:bg-red-500/20' :
                                        segment.error.type === 'Vocabulary' ? 'border-yellow-400 text-yellow-100 hover:bg-yellow-500/20' :
                                            segment.error.type === 'Spelling' ? 'border-purple-400 text-purple-100 hover:bg-purple-500/20' :
                                                'border-blue-400 text-blue-100 hover:bg-blue-500/20' // Coherence or other
                                    }`}
                                onMouseEnter={() => setHoveredError(segment.error || null)}
                                onMouseLeave={() => setHoveredError(null)}
                            >
                                {segment.text}
                                {/* Inline indicator */}
                                {/* <span className="absolute -top-2 -right-2 w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> */}
                            </span>
                        ) : (
                            <span className="text-white/80">{segment.text}</span>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Floating Tooltip */}
            <AnimatePresence>
                {hoveredError && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-4 right-4 max-w-sm w-full bg-white text-gray-900 p-4 rounded-xl shadow-2xl z-50 border-l-4 border-red-500"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${hoveredError.type === 'Grammar' ? 'bg-red-100 text-red-800' :
                                    hoveredError.type === 'Vocabulary' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-blue-100 text-blue-800'
                                }`}>
                                {hoveredError.type}
                            </span>
                        </div>
                        <div className="font-bold text-red-600 mb-1 line-through text-sm">
                            {hoveredError.original_text}
                        </div>
                        <div className="font-bold text-green-600 text-lg mb-2 flex items-center gap-2">
                            ➜ {hoveredError.correction}
                        </div>
                        <p className="text-sm text-gray-600 leading-snug">
                            {hoveredError.explanation}
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="mt-6 flex gap-4 text-sm text-white/50 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                    <span>Grammar</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                    <span>Vocabulary</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                    <span>Spelling</span>
                </div>
            </div>
        </div>
    );
}
