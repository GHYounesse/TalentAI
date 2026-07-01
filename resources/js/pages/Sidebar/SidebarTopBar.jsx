import Select from '@/components/Select';
import { useTheme } from '@/hooks/useTheme';
import { router, usePage } from '@inertiajs/react';
import { Menu, Moon, Search, Sun } from 'lucide-react';

export default function SidebarTopBar({ setMobileOpen }) {
    const { dark, toggleTheme } = useTheme();
    const { locale } = usePage().props;

    const setLang = (lang) => {
        router.post(route('locale.switch'), { locale: lang }, { preserveState: false });
    };

    return (
        <div className="border-sidebar-border bg-sidebar border-b px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
                {/* Mobile menu toggle */}
                <button
                    onClick={() => setMobileOpen(true)}
                    className="border-ds-border text-ds-text2 hover:bg-ds-surface hover:text-ds-text cursor-pointer rounded-lg border p-2 transition md:hidden"
                    aria-label="Open sidebar"
                >
                    <Menu size={16} />
                </button>

                {/* Search */}
                <div className="border-ds-border bg-ds-bg3 focus-within:border-ds-accent flex max-w-[560px] flex-1 items-center gap-2 rounded-lg border px-3 py-2 transition-colors">
                    <Search size={14} className="text-ds-text3 shrink-0" />
                    <input
                        type="text"
                        placeholder="Rechercher..."
                        className="text-ds-text placeholder:text-ds-text3 w-full bg-transparent text-[13px] outline-none"
                    />
                </div>

                {/* Right actions */}
                <div className="ml-auto flex items-center gap-2">
                    {/* Theme toggle */}
                    <button
                        onClick={toggleTheme}
                        className="border-ds-border text-ds-text2 hover:bg-ds-surface hover:text-ds-text cursor-pointer rounded-lg border p-2 transition"
                        aria-label="Toggle theme"
                    >
                        {dark ? <Sun size={15} /> : <Moon size={15} />}
                    </button>

                    {/* Locale selector */}
                    <Select
                        value={locale ?? 'fr'}
                        onChange={setLang}
                        placeholder="FR"
                        options={[
                            { value: 'fr', label: 'FR' },
                            { value: 'en', label: 'EN' },
                        ]}
                    />
                </div>
            </div>
        </div>
    );
}
