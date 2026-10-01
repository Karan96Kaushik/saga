import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Menu, Plus, Search, Settings, StickyNote, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate, useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { FunctionsBanner } from '@/components/layout/FunctionsBanner';
import { SidebarNav } from '@/components/layout/Sidebar';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { useNotes } from '@/hooks/useNotes';
import { toErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
export function AppShell() {
    const [navOpen, setNavOpen] = useState(false);
    const [params, setParams] = useSearchParams();
    const { notebookId } = useParams();
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { createNote } = useNotes();
    const query = params.get('q') ?? '';
    const onSettings = pathname === '/settings';
    const onFiles = pathname === '/files';
    const quietHeader = onSettings || onFiles;
    async function onCreate() {
        try {
            const note = await createNote(notebookId ?? null);
            const path = notebookId ? `/notebooks/${notebookId}` : '/';
            navigate(`${path}?note=${note.id}`);
        }
        catch (error) {
            toast.error(toErrorMessage(error, 'Could not create the note.'));
        }
    }
    return (_jsxs("div", { className: "flex h-dvh overflow-hidden bg-background text-foreground", children: [_jsx("aside", { className: "hidden w-60 shrink-0 bg-sidebar text-sidebar-foreground md:flex", children: _jsx(SidebarNav, {}) }), _jsxs("div", { className: "flex min-w-0 flex-1 flex-col pb-16 md:pb-0", children: [_jsx(FunctionsBanner, {}), _jsxs("header", { className: "flex h-14 shrink-0 items-center gap-2 border-b border-border px-3", children: [_jsx(Button, { type: "button", variant: "ghost", size: "icon", className: "md:hidden", "aria-label": "Open navigation", onClick: () => setNavOpen(true), children: _jsx(Menu, {}) }), quietHeader ? (_jsx("h1", { className: "font-serif text-xl", children: onFiles ? 'Files' : 'Settings' })) : (_jsxs("label", { className: "relative min-w-0 flex-1", children: [_jsx("span", { className: "sr-only", children: "Search notes" }), _jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" }), _jsx("input", { value: query, onChange: (event) => {
                                            const value = event.target.value;
                                            setParams((current) => {
                                                const next = new URLSearchParams(current);
                                                if (value)
                                                    next.set('q', value);
                                                else
                                                    next.delete('q');
                                                return next;
                                            }, { replace: true });
                                        }, placeholder: "Search notes", className: "h-9 w-full rounded-full border border-border bg-paper pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" })] })), _jsxs("div", { className: "ml-auto flex items-center gap-1", children: [quietHeader ? null : (_jsxs(Button, { type: "button", size: "sm", onClick: () => void onCreate(), children: [_jsx(Plus, {}), "New note"] })), _jsx(ThemeToggle, {})] })] }), _jsx("main", { className: "min-h-0 flex-1", children: _jsx(Outlet, {}) })] }), _jsxs("nav", { className: "fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-border bg-paper md:hidden", children: [_jsx(MobileLink, { to: "/", label: "Notes", icon: _jsx(StickyNote, { className: "size-4" }) }), _jsxs("button", { type: "button", className: "flex flex-col items-center gap-1 py-2 text-[11px] text-muted-foreground", onClick: () => setNavOpen(true), children: [_jsx(Menu, { className: "size-4" }), "Library"] }), _jsx(MobileLink, { to: "/trash", label: "Trash", icon: _jsx(Trash2, { className: "size-4" }) }), _jsx(MobileLink, { to: "/settings", label: "Settings", icon: _jsx(Settings, { className: "size-4" }) })] }), _jsx(Sheet, { open: navOpen, onOpenChange: setNavOpen, children: _jsx(SidebarNav, { onNavigate: () => setNavOpen(false) }) })] }));
}
function MobileLink({ to, label, icon }) {
    return (_jsxs(NavLink, { to: to, end: to === '/', className: ({ isActive }) => cn('flex flex-col items-center gap-1 py-2 text-[11px]', isActive ? 'text-foreground' : 'text-muted-foreground'), children: [icon, label] }));
}
