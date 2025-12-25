
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface SpeakingError {
    original_text: string;
    correction: string;
    type: string;
    explanation: string;
}

interface SpeakingFeedbackProps {
    transcription: string;
    errors: SpeakingError[];
}

export const SpeakingFeedback: React.FC<SpeakingFeedbackProps> = ({ transcription, errors }) => {
    const [hoveredError, setHoveredError] = useState<SpeakingError | null>(null);

    // Simple segmentation logic (exact string match)
    // In a real app with repeated words, we need index-based matching from backend
    // but for MVP exact match first occurrence is "good enough" usually
    const getSegments = () => {
        let segments: { text: string; error?: SpeakingError }[] = [];
        let currentIndex = 0;

        // Sort errors by position if we had positions. 
        // We will just find them in text for now.
        // This is a naive implementation: it highlights only the first occurrence of the error phrase
        // Better implementation requires backend to return offsets.

        // Let's assume errors are sparse and unique enough for now.
        // We construct a list of "ranges" to highlight.

        const ranges: { start: number; end: number; error: SpeakingError }[] = [];

        errors.forEach(err => {
            const idx = transcription.indexOf(err.original_text);
            if (idx !== -1) {
                ranges.push({ start: idx, end: idx + err.original_text.length, error: err });
            }
        });

        ranges.sort((a, b) => a.start - b.start);

        // Join segments
        let lastEnd = 0;
        ranges.forEach(range => {
            if (range.start > lastEnd) {
                segments.push({ text: transcription.slice(lastEnd, range.start) });
            }
            segments.push({ text: transcription.slice(range.start, range.end), error: range.error });
            lastEnd = range.end;
        });

        if (lastEnd < transcription.length) {
            segments.push({ text: transcription.slice(lastEnd) });
        }

        // If no errors found (or failed match), return full text
        if (segments.length === 0) segments = [{ text: transcription }];

        return segments;
    };

    const segments = getSegments();

    return (
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 relative">
            <h3 className="text-xl font-bold text-white mb-4">🎤 Transcription & Analysis</h3>

            <div className="prose prose-invert max-w-none text-lg leading-relaxed whitespace-pre-wrap font-serif">
                {segments.map((segment, idx) => (
                    <React.Fragment key={idx}>
                        {segment.error ? (
                            <span
                                className={`relative cursor-pointer border-b-2 transition-colors duration-200 ${segment.error.type === 'Grammar' ? 'border-red-400 text-red-100 hover:bg-red-500/20' :
                                        segment.error.type === 'Pronunciation' ? 'border-cyan-400 text-cyan-100 hover:bg-cyan-500/20' :
                                            segment.error.type === 'Vocabulary' ? 'border-yellow-400 text-yellow-100 hover:bg-yellow-500/20' :
                                                'border-blue-400 text-blue-100 hover:bg-blue-500/20'
                                    }`}
                                onMouseEnter={() => setHoveredError(segment.error || null)}
                                onMouseLeave={() => setHoveredError(null)}
                            >
                                {segment.text}
                            </span>
                        ) : (
                            <span className="text-white/80">{segment.text}</span>
                        )}
                    </React.Fragment>
                ))}
            </div>

            {/* Tooltip */}
            <AnimatePresence>
                {hoveredError && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute bottom-4 right-4 max-w-sm w-full bg-white text-gray-900 p-4 rounded-xl shadow-2xl z-50 border-l-4 border-cyan-500"
                    >
                        <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded ${hoveredError.type === 'Pronunciation' ? 'bg-cyan-100 text-cyan-800' :
                                    'bg-red-100 text-red-800'
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
        </div>
    );
};
