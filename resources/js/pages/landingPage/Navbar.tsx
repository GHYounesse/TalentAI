import { useTheme } from '@/hooks/useTheme';
import { SharedData } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { Menu, Moon, Sun, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Navbar() {
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const { dark, toggleTheme } = useTheme();
    const { auth } = usePage<SharedData>().props;

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 40);
        window.addEventListener('scroll', onScroll);
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Close menu on resize to desktop
    useEffect(() => {
        const onResize = () => {
            if (window.innerWidth >= 768) setMenuOpen(false);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const links = ['Fonctionnalités', 'Solution', 'Tarifs', 'Ressources'];

    return (
        <nav
            className={`fixed top-0 right-0 left-0 z-50 transition-all duration-500 ${
                scrolled ? 'bg-background/80 border-border border-b backdrop-blur-xl' : 'bg-transparent'
            }`}
        >
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between sm:h-20">
                    {/* Logo */}
                    <a href="#" className="flex shrink-0 items-center gap-3">
                        <span className="text-foreground text-lg font-bold tracking-tight sm:text-xl" style={{ fontFamily: "'Syne', sans-serif" }}>
                            Recrute<span className="text-primary">AI</span>
                        </span>
                    </a>

                    {/* Desktop Links */}
                    <div className="hidden items-center gap-6 md:flex lg:gap-8">
                        {links.map((l) => (
                            <a key={l} href="#" className="hover:text-foreground text-sm font-medium text-slate-400 transition-colors duration-200">
                                {l}
                            </a>
                        ))}
                    </div>

                    <div className="hidden items-center gap-2 md:flex lg:gap-3">
                        <button
                            onClick={toggleTheme}
                            className="bg-card border-border text-foreground hover:bg-accent flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-300 lg:h-10 lg:w-10"
                            aria-label="Toggle theme"
                        >
                            {dark ? <Sun size={16} /> : <Moon size={16} />}
                        </button>

                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="bg-primary text-primary-foreground rounded-xl px-4 py-2 text-sm font-medium transition hover:opacity-90 lg:px-5"
                            >
                                Dashboard
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="border-border text-foreground hover:bg-accent rounded-xl border px-3 py-2 text-sm transition lg:px-4"
                                >
                                    Connexion
                                </Link>

                                <Link
                                    href={route('register')}
                                    className="bg-primary text-primary-foreground rounded-xl px-3 py-2 text-sm transition hover:opacity-90 lg:px-4"
                                >
                                    Inscription
                                </Link>
                            </>
                        )}
                    </div>

                    {/* Burger */}
                    <button
                        onClick={() => setMenuOpen(!menuOpen)}
                        className="text-foreground hover:text-primary -mr-1 flex h-10 w-10 items-center justify-center rounded-xl transition-colors md:hidden"
                        aria-label="Toggle menu"
                        aria-expanded={menuOpen}
                    >
                        {menuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

                {/* Mobile Menu */}
                <div
                    className={`overflow-hidden transition-all duration-300 md:hidden ${
                        menuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                >
                    <div className="border-border bg-card mb-3 rounded-2xl border p-3 shadow-xl backdrop-blur-xl">
                        <div className="flex flex-col gap-1">
                            {links.map((link) => (
                                <a
                                    key={link}
                                    href="#"
                                    onClick={() => setMenuOpen(false)}
                                    className="text-muted-foreground hover:text-foreground hover:bg-accent rounded-xl px-4 py-3 text-sm transition-all"
                                >
                                    {link}
                                </a>
                            ))}
                        </div>

                        <div className="border-border mt-2 flex flex-col gap-2 border-t pt-3">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-muted-foreground text-xs">Thème</span>
                                <button
                                    onClick={toggleTheme}
                                    className="bg-background border-border text-foreground flex h-8 w-8 items-center justify-center rounded-lg border"
                                    aria-label="Toggle theme"
                                >
                                    {dark ? <Sun size={14} /> : <Moon size={14} />}
                                </button>
                            </div>

                            {auth.user ? (
                                <Link
                                    href={route('dashboard')}
                                    className="bg-primary text-primary-foreground w-full rounded-xl px-4 py-3 text-center text-sm font-medium"
                                    onClick={() => setMenuOpen(false)}
                                >
                                    Dashboard
                                </Link>
                            ) : (
                                <div className="grid grid-cols-2 gap-2">
                                    <Link
                                        href={route('login')}
                                        className="border-border hover:bg-accent rounded-xl border px-4 py-2.5 text-center text-sm transition"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Connexion
                                    </Link>

                                    <Link
                                        href={route('register')}
                                        className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-center text-sm transition hover:opacity-90"
                                        onClick={() => setMenuOpen(false)}
                                    >
                                        Inscription
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}
