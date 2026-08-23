'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

interface User {
    id: number;
    email: string;
    username: string;
    xp: number;
    level: number;
    current_streak: number;
    longest_streak: number;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    signup: (email: string, username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    updateUser: (updates: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const restoreSession = async () => {
            // 1) Try cookie-based auth (no token needed — cookie is sent via credentials: 'include')
            try {
                const userData = await api.getMe('');
                if (cancelled) return;
                setUser(userData);
                // Cookie auth succeeded — recover the JWT from localStorage so React Query hooks work
                const storedToken = localStorage.getItem('jana_token');
                if (storedToken) setToken(storedToken);
                return;
            } catch {
                // Cookie auth failed, fall through to localStorage
            }

            // 2) Try localStorage token
            const storedToken = localStorage.getItem('jana_token');
            if (storedToken) {
                try {
                    const userData = await api.getMe(storedToken);
                    if (cancelled) return;
                    setUser(userData);
                    setToken(storedToken);
                } catch {
                    localStorage.removeItem('jana_token');
                }
            }
        };

        restoreSession().finally(() => {
            if (!cancelled) setLoading(false);
        });

        return () => { cancelled = true; };
    }, []);

    const login = async (email: string, password: string) => {
        const result = await api.login(email, password);
        const newToken = result.access_token;
        localStorage.setItem('jana_token', newToken);
        setToken(newToken);

        const userData = await api.getMe(newToken);
        setUser(userData);
    };

    const signup = async (email: string, username: string, password: string) => {
        await api.signup(email, username, password);
        // Auto-login after signup
        await login(email, password);
    };

    const logout = async () => {
        try {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/auth/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch {
            // Ignore logout errors
        }
        localStorage.removeItem('jana_token');
        setToken(null);
        setUser(null);
    };

    const updateUser = (updates: Partial<User>) => {
        if (user) {
            setUser({ ...user, ...updates });
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, loading, login, signup, logout, updateUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
