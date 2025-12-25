'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    Headphones,
    PenTool,
    Mic2,
    Trophy,
    Settings,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Sparkles,
    X
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';

const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Reading', href: '/practice', icon: BookOpen },
    { name: 'Listening', href: '/listening', icon: Headphones },
    { name: 'Writing', href: '/writing', icon: PenTool },
    { name: 'Speaking', href: '/speaking', icon: Mic2 },
    { name: 'Achievements', href: '/achievements', icon: Trophy },
];

interface SidebarProps {
    onMobileClose?: () => void;
}

export function Sidebar({ onMobileClose }: SidebarProps) {
    const pathname = usePathname();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { logout } = useAuth();

    return (
        <aside
            className={`fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 z-[70] flex flex-col ${isCollapsed ? 'w-20' : 'w-64'
                } md:h-screen w-full md:w-auto`}
        >
            {/* Brand */}
            <div className="p-6 md:p-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-600/20">
                        <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    {!isCollapsed && (
                        <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            JANA
                        </span>
                    )}
                </div>
                {onMobileClose && (
                    <button
                        onClick={onMobileClose}
                        className="md:hidden p-2 text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                )}
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-2 mt-4">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => onMobileClose?.()}
                            className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''} ${isCollapsed ? 'justify-center' : ''}`}
                        >
                            <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                            {!isCollapsed && <span className="font-bold">{item.name}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 md:p-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="sidebar-link w-full hidden md:flex transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                    {isCollapsed ? <ChevronRight className="w-5 h-5" /> : (
                        <>
                            <ChevronLeft className="w-5 h-5" />
                            <span className="font-bold">Collapse Menu</span>
                        </>
                    )}
                </button>
                <button
                    onClick={logout}
                    className="sidebar-link w-full text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 hover:text-rose-600 transition-all font-bold"
                >
                    <LogOut className="w-5 h-5 flex-shrink-0" />
                    {!isCollapsed && <span>Sign Out</span>}
                </button>
            </div>
        </aside>
    );
}

