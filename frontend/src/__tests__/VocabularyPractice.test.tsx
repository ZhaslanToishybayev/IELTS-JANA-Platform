import { describe, it, expect, vi } from 'vitest';
import { render, screen } from './test-utils';

vi.mock('@/lib/api', () => ({
    api: {
        getDueFlashcards: vi.fn().mockResolvedValue([]),
        reviewFlashcard: vi.fn(),
        getMe: vi.fn().mockRejectedValue(new Error('Not authenticated')),
    },
}));

import VocabularyPractice from '@/components/VocabularyPractice';

const mockCards = [
    { id: 1, word: 'ubiquitous', definition: 'present everywhere', context: 'Smartphones are ubiquitous in modern life.', next_review: '2026-08-25T00:00:00' },
    { id: 2, word: 'ephemeral', definition: 'lasting a very short time', context: 'The beauty of cherry blossoms is ephemeral.', next_review: '2026-08-25T00:00:00' },
];

describe('VocabularyPractice', () => {
    it('renders first card word', () => {
        render(<VocabularyPractice initialCards={mockCards} />);
        expect(screen.getByText('ubiquitous')).toBeInTheDocument();
    });

    it('shows flip prompt text', () => {
        render(<VocabularyPractice initialCards={mockCards} />);
        expect(screen.getByText('Tap to reveal definition')).toBeInTheDocument();
    });

    it('shows empty state when no cards', () => {
        const { container } = render(<VocabularyPractice initialCards={[]} />);
        // Component returns null for empty cards
        expect(container.innerHTML).toBe('');
    });
});
