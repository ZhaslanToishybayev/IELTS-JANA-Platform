import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from './test-utils';
import { LoginForm } from '@/components/LoginForm';

const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: mockPush }),
}));

describe('LoginForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders sign in form by default', () => {
        render(<LoginForm />);
        expect(screen.getByText('Welcome back')).toBeInTheDocument();
        expect(screen.getByText('Sign In')).toBeInTheDocument();
        expect(screen.getByText('Sign Up')).toBeInTheDocument();
    });

    it('switches to sign up form', () => {
        render(<LoginForm />);
        fireEvent.click(screen.getByText('Sign Up'));
        expect(screen.getByText('Create an account')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('johndoe')).toBeInTheDocument();
    });

    it('renders email and password fields', () => {
        render(<LoginForm />);
        expect(screen.getByPlaceholderText('name@example.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    });

    it('does not show demo login when disabled', () => {
        render(<LoginForm />);
        expect(screen.queryByText('Try demo account')).not.toBeInTheDocument();
    });
});
