import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export const categoryLabels: Record<string, string> = {
    'TF_NG': 'True/False/Not Given',
    'HEADINGS': 'Matching Headings',
    'SUMMARY': 'Summary Completion',
    'MATCHING_INFO': 'Matching Information',
    'SENTENCE_COMP': 'Sentence Completion',
    'MCQ': 'Multiple Choice',
    'FILL_BLANK': 'Fill in the Blank',
    'LISTENING_MCQ': 'Listening - Multiple Choice',
    'LISTENING_FORM': 'Listening - Form Completion',
    'LISTENING_MAP': 'Listening - Map Labeling',
    'LISTENING_NOTES': 'Listening - Note Taking',
    'LISTENING_MATCHING': 'Listening - Matching',
    'LISTENING_SENTENCE': 'Listening - Sentence Completion',
    'READING_TF_NG': 'Reading - True/False/Not Given',
    'READING_HEADINGS': 'Reading - Headings',
    'READING_MATCHING': 'Reading - Matching Information',
    'READING_SENTENCE': 'Reading - Sentence Completion',
    'READING_SUMMARY': 'Reading - Summary Completion',
};

export const categoryColors: Record<string, string> = {
    'TF_NG': 'blue',
    'HEADINGS': 'purple',
    'SUMMARY': 'green',
    'MATCHING_INFO': 'amber',
    'SENTENCE_COMP': 'rose',
    'MCQ': 'cyan',
    'FILL_BLANK': 'indigo',
    'LISTENING_MCQ': 'blue',
    'LISTENING_FORM': 'green',
    'LISTENING_MAP': 'amber',
    'LISTENING_NOTES': 'purple',
    'LISTENING_MATCHING': 'rose',
    'LISTENING_SENTENCE': 'cyan',
    'READING_TF_NG': 'blue',
    'READING_HEADINGS': 'purple',
    'READING_MATCHING': 'amber',
    'READING_SENTENCE': 'rose',
    'READING_SUMMARY': 'green',
};
