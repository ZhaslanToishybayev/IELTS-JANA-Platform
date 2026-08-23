import { cn } from '@/lib/utils';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const sizeStyles = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-[3px]',
    lg: 'w-14 h-14 border-4',
};

export function Spinner({ size = 'md', className }: SpinnerProps) {
    return (
        <div
            className={cn(
                'border-blue-600 border-t-transparent rounded-full animate-spin',
                sizeStyles[size],
                className
            )}
        />
    );
}

export function PageLoader({ message = 'Loading...' }: { message?: string }) {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <Spinner size="lg" />
            {message && (
                <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">{message}</p>
            )}
        </div>
    );
}
