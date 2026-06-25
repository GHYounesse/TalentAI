import { useI18n } from '@/hooks/useI18n';
import { Link, router, usePage } from '@inertiajs/react';
import {
    Activity,
    BarChart3,
    ChevronUp,
    Clock,
    FileText,
    Hash,
    LayoutDashboard,
    LogOut,
    Mic,
    PanelLeftClose,
    PanelLeftOpen,
    Plug,
    Search,
    Settings,
    Settings2,
    Shield,
    Trophy,
    Users,
    X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { usePermission } from '@/hooks/usePermission';

function NavBadge({ count, dot }) {
    if (dot) return <span className="bg-ds-accent ml-auto h-1.5 w-1.5 shrink-0 rounded-full" />;
    if (count)
        return <span className="bg-ds-accent ml-auto shrink-0 rounded-full px-1.5 py-px text-[10px] leading-4 font-bold text-white">{count}</span>;
    return null;
}

function UserDropdown({ user, collapsed }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    const initials = useMemo(() => {
        if (!user?.name) return 'U';
        return user.name
            .split(' ')
            .slice(0, 2)
            .map((w) => w[0])
            .join('')
            .toUpperCase();
    }, [user]);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className="border-sidebar-border relative border-t p-3">
            {open && (
                <div
                    className={`border-ds-border2 bg-ds-surface absolute overflow-hidden rounded-xl border shadow-xl ${collapsed ? 'bottom-0 left-full ml-2 w-48' : 'right-3 bottom-full left-3 mb-2'}`}
                >
                    <div className="border-ds-border border-b px-3 py-2.5">
                        <p className="text-ds-text text-[13px] font-semibold">{user?.name}</p>
                        <p className="text-ds-text3 text-[11px]">{user?.email}</p>
                    </div>
                    <Link
                        href={route('profile.edit')}
                        className="text-ds-text2 hover:bg-ds-accent/[0.06] hover:text-ds-text flex cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] transition"
                        onClick={() => setOpen(false)}
                    >
                        <Settings size={14} />
                        Paramètres
                    </Link>
                    <button
                        onClick={() => {
                            setOpen(false);
                            router.post(route('logout'));
                        }}
                        className="text-ds-red hover:bg-ds-red/[0.06] flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-[13px] transition"
                    >
                        <LogOut size={14} />
                        Déconnexion
                    </button>
                </div>
            )}
            <button
                onClick={() => setOpen((p) => !p)}
                className={`hover:bg-ds-accent/[0.06] flex w-full cursor-pointer items-center gap-2.5 rounded-lg p-1.5 transition ${collapsed ? 'justify-center' : ''}`}
            >
                <div className="from-ds-accent to-ds-accent3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white">
                    {initials}
                </div>
                {!collapsed && (
                    <>
                        <div className="min-w-0 flex-1 text-left">
                            <p className="text-ds-text truncate text-[13px] font-medium">{user?.name ?? 'Utilisateur'}</p>
                            <p className="text-ds-text3 truncate text-[11px]">{user?.email ?? 'Admin RH'}</p>
                        </div>
                        <ChevronUp size={14} className={`text-ds-text3 shrink-0 transition-transform duration-150 ${open ? '' : 'rotate-180'}`} />
                    </>
                )}
            </button>
        </div>
    );
}

export default function Sidebar({ mobileOpen, setMobileOpen }) {
    const { props } = usePage();
    const { t } = useI18n();
    const { can, hasRole } = usePermission();
    const authUser = props.auth?.user;

    const [collapsed, setCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return JSON.parse(localStorage.getItem('sidebar-collapsed') ?? 'false');
    });

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(collapsed));
    }, [collapsed]);

    const { url } = usePage();

    const isActive = (routeName) => {
        try {
            const routeUrl = route(routeName);
            const currentPath = url.split('?')[0].replace(/\/$/, '');
            const routePath = new URL(routeUrl, window.location.origin).pathname.replace(/\/$/, '');

            if (routeName === 'dashboard') {
                return currentPath === routePath;
            }

            return currentPath === routePath || currentPath.startsWith(`${routePath}/`);
        } catch {
            return false;
        }
    };

    const sections = useMemo(
        () =>
            [
                {
                    title: t('sidebar.dashboard.title'),
                    items: [
                        {
                            id: 'dashboard',
                            label: t('sidebar.dashboard.overview'),
                            icon: LayoutDashboard,
                            route: 'dashboard',
                        },
                    ],
                },
                {
                    title: t('sidebar.sourcing.title'),
                    items: [
                        can('briefs.view') && {
                            id: 'briefs',
                            label: t('sidebar.sourcing.brief'),
                            icon: FileText,
                            route: 'dashboard.briefs.index',
                        },
                        can('sourcing.view') && {
                            id: 'sourcing',
                            label: t('sidebar.sourcing.auto'),
                            icon: Search,
                            route: 'dashboard.sourcing.index',
                            dot: true,
                        },
                    ],
                },
                {
                    title: t('sidebar.candidats.title'),
                    items: [
                        can('candidates.view') && {
                            id: 'candidates',
                            label: t('sidebar.candidats.base'),
                            icon: Users,
                            route: 'dashboard.candidats.index',
                            badge: 24,
                        },
                        can('classement.view') && {
                            id: 'classement',
                            label: t('sidebar.candidats.rankings'),
                            icon: Trophy,
                            route: 'dashboard.classement',
                        },
                    ],
                },
                {
                    title: t('sidebar.interviews.cv-analysis'),
                    items: [
                        can('cv-analysis.view') && {
                            id: 'cv-analysis',
                            label: t('sidebar.interviews.cv-analysis'),
                            icon: FileText,
                            route: 'dashboard.cv-analysis.index',
                        },
                    ],
                },
                {
                    title: t('sidebar.interviews.title'),
                    items: [
                        can('interviews.view') && {
                            id: 'interviews',
                            label: t('sidebar.interviews.list'),
                            icon: Mic,
                            route: 'dashboard.interviews.index',
                            badge: 3,
                        },
                        can('reports.view') && {
                            id: 'reports',
                            label: t('sidebar.interviews.reports'),
                            icon: BarChart3,
                            route: 'dashboard.reports',
                        },
                        // can('historique.view') &&
                        {
                            id: 'historique',
                            label: t('sidebar.interviews.historique'),
                            icon: Clock,
                            route: 'dashboard.historique.index',
                        },
                    ],
                },
                {
                    title: t('sidebar.settings.title'),
                    items: [
                        can('integrations.view') && {
                            id: 'integrations',
                            label: t('sidebar.settings.integrations'),
                            icon: Plug, // import Plug from lucide-react
                            route: 'dashboard.integrations.index', // user tokens page
                        },
                    ],
                },
                {
                    title: t('sidebar.administration.title'),
                    items: [
                        (can('users.view') || hasRole('super_admin')) && {
                            id: 'users',
                            label: t('sidebar.administration.users'),
                            icon: Users,
                            route: 'dashboard.users.index',
                        },
                        (can('roles.view') || hasRole('super_admin')) && {
                            id: 'roles',
                            label: t('sidebar.administration.roles'),
                            icon: Shield,
                            route: 'dashboard.roles.index',
                        },
                        (can('activity_logs.view') || hasRole('super_admin')) && {
                            id: 'activity-logs',
                            label: t('sidebar.administration.activity_logs'),
                            icon: Activity,
                            route: 'dashboard.activity-logs.index',
                        },
                        (can('parameters.view') || hasRole('super_admin')) && {
                            id: 'parameters',
                            label: t('sidebar.administration.parameters'),
                            icon: Hash,
                            route: 'dashboard.parameters.index',
                        },
                        can('integrations.manage') && {
                            id: 'admin-integrations',
                            label: t('sidebar.administration.integrations_catalogue'),
                            icon: Settings2, // import Settings2 from lucide-react
                            route: 'dashboard.admin.integrations.index', // admin catalogue page
                        },
                    ],
                },
            ]
                .map((section) => ({
                    ...section,
                    items: section.items.filter(Boolean),
                }))
                .filter((section) => section.items.length > 0),
        [t, can, hasRole],
    );

    return (
        <>
            {mobileOpen && <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />}

            <aside
                className={`border-sidebar-border bg-sidebar fixed z-50 flex h-screen flex-col border-r transition-all duration-300 ease-in-out md:static ${collapsed ? 'md:w-[60px]' : 'md:w-[220px]'} w-[220px] ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
                aria-label="Sidebar navigation"
            >
                {/* Logo + collapse */}
                <div className="border-sidebar-border relative flex items-center justify-between border-b px-4 py-4">
                    {!collapsed && (
                        <div>
                            <h1
                                className="text-ds-text text-[22px] leading-none font-extrabold tracking-tight"
                                style={{ fontFamily: 'Syne, sans-serif' }}
                            >
                                Recrute<span className="text-ds-accent">AI</span>
                            </h1>
                            <p className="text-ds-text3 mt-1 text-[10px] font-semibold tracking-[0.8px] uppercase">Recrutement Intelligent</p>
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className={`text-ds-text3 hover:bg-ds-accent/[0.06] hover:text-ds-text hidden cursor-pointer rounded-lg p-1.5 transition md:flex ${collapsed ? 'mx-auto' : ''}`}
                        aria-label="Toggle sidebar"
                    >
                        {collapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
                    </button>
                    {mobileOpen && (
                        <button
                            onClick={() => setMobileOpen(false)}
                            className="text-ds-text3 hover:bg-ds-accent/[0.06] hover:text-ds-text absolute top-3 right-3 cursor-pointer rounded-lg p-1.5 md:hidden"
                        >
                            <X size={17} />
                        </button>
                    )}
                </div>

                {/* Nav */}
                <nav className={`custom-scroll flex-1 py-3 ${collapsed ? 'overflow-visible' : 'overflow-y-auto'}`}>
                    {sections.map((section, i) => (
                        <div key={i} className="mb-1">
                            {!collapsed && (
                                <p className="text-ds-text3 mb-1 px-5 pt-3 text-[10px] font-semibold tracking-[1.2px] uppercase">{section.title}</p>
                            )}
                            {collapsed && i !== 0 && <div className="border-sidebar-border mx-3 my-2 border-t" />}

                            {section.items.map((item) => {
                                const Icon = item.icon;
                                const active = isActive(item.route);
                                return (
                                    <Link
                                        key={item.id}
                                        href={route(item.route)}
                                        title={collapsed ? item.label : undefined}
                                        aria-label={item.label}
                                        aria-current={active ? 'page' : undefined}
                                        className={`group relative flex items-center gap-2.5 border-l-2 py-2 text-[13.5px] transition-all duration-150 ${collapsed ? 'justify-center px-0' : 'px-5'} ${
                                            active
                                                ? 'border-ds-accent bg-ds-accent/10 text-ds-text font-medium'
                                                : 'text-ds-text2 hover:border-ds-accent/40 hover:bg-ds-accent/[0.06] hover:text-ds-text border-transparent'
                                        }`}
                                    >
                                        <Icon
                                            size={17}
                                            className={`shrink-0 transition-colors ${active ? 'text-ds-accent' : 'text-ds-text3 group-hover:text-ds-accent'}`}
                                        />
                                        {!collapsed && (
                                            <>
                                                <span className="flex-1 truncate">{item.label}</span>
                                                <NavBadge count={item.badge} dot={item.dot} />
                                            </>
                                        )}
                                        {collapsed && (
                                            <span className="border-ds-border2 bg-ds-surface text-ds-text pointer-events-none absolute left-full z-50 ml-3 hidden rounded-md border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shadow-lg group-hover:block">
                                                {item.label}
                                                {item.badge ? (
                                                    <span className="bg-ds-accent ml-1.5 rounded-full px-1.5 py-px text-[10px] font-bold text-white">
                                                        {item.badge}
                                                    </span>
                                                ) : null}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* User footer */}
                <UserDropdown user={authUser} collapsed={collapsed} />
            </aside>
        </>
    );
}
