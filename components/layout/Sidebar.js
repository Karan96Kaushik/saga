import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Hash, Inbox, Notebook, Paperclip, Plus, Trash2 } from 'lucide-react';
import { useRef, useState } from 'react';
import { NavLink, useLocation } from 'react-router';
import { toast } from 'sonner';
import { Logo } from '@/components/layout/Logo';
import { CountStat } from '@/components/metrics/CountStat';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useFiles } from '@/hooks/useFiles';
import { useNotes } from '@/hooks/useNotes';
import { toErrorMessage } from '@/lib/errors';
import { cn } from '@/lib/utils';
function navClass(active) {
    return cn('flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm', active ? 'bg-white/10 text-white' : 'text-sidebar-foreground/75 hover:bg-white/5 hover:text-sidebar-foreground');
}
export function SidebarNav({ onNavigate }) {
    const { user, profile } = useAuth();
    const { notebooks, notes, tags, noteTags, createNotebook, renameNotebook, deleteNotebook, deleteTag, } = useNotes();
    const { files } = useFiles();
    const { pathname } = useLocation();
    const skipRename = useRef(false);
    const [creating, setCreating] = useState(false);
    const [draft, setDraft] = useState('');
    const [renaming, setRenaming] = useState(null);
    const [renameDraft, setRenameDraft] = useState('');
    const [notebookToDelete, setNotebookToDelete] = useState(null);
    const [tagToDelete, setTagToDelete] = useState(null);
    const activeNotes = notes.filter((note) => note.trashed_at === null);
    const unfiled = activeNotes.filter((note) => note.notebook_id === null).length;
    const trash = notes.filter((note) => note.trashed_at !== null).length;
    const displayName = profile?.display_name || user?.email?.split('@')[0] || 'You';
    async function onCreateNotebook(event) {
        event.preventDefault();
        const name = draft.trim();
        if (!name)
            return;
        try {
            await createNotebook(name);
            setDraft('');
            setCreating(false);
        }
        catch (error) {
            toast.error(toErrorMessage(error, 'Could not create the notebook.'));
        }
    }
    return (_jsxs("div", { className: "flex h-full min-h-0 w-full flex-col px-3 py-4", children: [_jsxs("div", { className: "px-2", children: [_jsx(Logo, {}), _jsx(CountStat, { className: "mt-5 text-sidebar-foreground", label: "Notes", value: activeNotes.length })] }), _jsxs("nav", { className: "mt-6 space-y-1", "aria-label": "Notes", children: [_jsxs(NavLink, { to: "/", end: true, className: ({ isActive }) => navClass(isActive), onClick: onNavigate, children: [_jsx(Inbox, { className: "size-4" }), "All notes"] }), unfiled > 0 ? (_jsxs(NavLink, { to: "/unfiled", className: ({ isActive }) => navClass(isActive), onClick: onNavigate, children: [_jsx(Notebook, { className: "size-4" }), "Unfiled", _jsx("span", { className: "ml-auto text-xs text-sidebar-foreground/60", children: unfiled })] })) : null, _jsxs(NavLink, { to: "/files", className: ({ isActive }) => navClass(isActive), onClick: onNavigate, children: [_jsx(Paperclip, { className: "size-4" }), "Files", files.length > 0 ? _jsx("span", { className: "ml-auto text-xs text-sidebar-foreground/60", children: files.length }) : null] }), _jsxs(NavLink, { to: "/trash", className: ({ isActive }) => navClass(isActive), onClick: onNavigate, children: [_jsx(Trash2, { className: "size-4" }), "Trash", trash > 0 ? _jsx("span", { className: "ml-auto text-xs text-sidebar-foreground/60", children: trash }) : null] })] }), _jsxs("div", { className: "mt-6 flex items-center justify-between px-2.5 text-xs font-medium tracking-wide text-sidebar-foreground/55", children: ["Notebooks", _jsx("button", { type: "button", className: "rounded-md p-1 hover:bg-white/10 hover:text-sidebar-foreground", "aria-label": "New notebook", onClick: () => {
                            setCreating(true);
                            setDraft('');
                        }, children: _jsx(Plus, { className: "size-3.5" }) })] }), _jsxs("div", { className: "mt-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1", children: [notebooks.map((notebook) => {
                        const count = activeNotes.filter((note) => note.notebook_id === notebook.id).length;
                        const active = pathname === `/notebooks/${notebook.id}`;
                        if (renaming?.id === notebook.id) {
                            return (_jsx("form", { onSubmit: (event) => {
                                    event.preventDefault();
                                    const field = event.currentTarget.elements[0];
                                    if (field instanceof HTMLInputElement)
                                        field.blur();
                                }, children: _jsx("input", { autoFocus: true, value: renameDraft, onChange: (event) => setRenameDraft(event.target.value), onKeyDown: (event) => {
                                        if (event.key === 'Escape') {
                                            skipRename.current = true;
                                            setRenaming(null);
                                        }
                                    }, onBlur: () => {
                                        if (skipRename.current) {
                                            skipRename.current = false;
                                            setRenaming(null);
                                            return;
                                        }
                                        const name = renameDraft.trim();
                                        setRenaming(null);
                                        if (!name || name === notebook.name)
                                            return;
                                        void renameNotebook(notebook.id, name).catch((error) => {
                                            toast.error(toErrorMessage(error, 'Could not rename the notebook.'));
                                        });
                                    }, className: "w-full rounded-lg bg-white/10 px-2.5 py-1.5 text-sm text-sidebar-foreground outline-none" }) }, notebook.id));
                        }
                        return (_jsxs("div", { className: "group flex items-center", children: [_jsxs(NavLink, { to: `/notebooks/${notebook.id}`, className: cn(navClass(active), 'min-w-0 flex-1'), onClick: onNavigate, children: [_jsx(Notebook, { className: "size-4 shrink-0" }), _jsx("span", { className: "truncate", children: notebook.name }), _jsx("span", { className: "ml-auto text-xs text-sidebar-foreground/50 group-hover:hidden", children: count })] }), _jsxs(DropdownMenu, { children: [_jsxs(DropdownMenuTrigger, { className: "rounded-md p-1 text-sidebar-foreground/70 opacity-0 hover:bg-white/10 group-hover:opacity-100 focus:opacity-100", children: [_jsx("span", { className: "sr-only", children: "Notebook actions" }), _jsx("span", { "aria-hidden": "true", children: "\u00B7\u00B7\u00B7" })] }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsx(DropdownMenuItem, { onSelect: () => {
                                                        setRenaming(notebook);
                                                        setRenameDraft(notebook.name);
                                                    }, children: "Rename" }), _jsx(DropdownMenuItem, { onSelect: () => setNotebookToDelete(notebook), children: "Delete notebook" })] })] })] }, notebook.id));
                    }), creating ? (_jsx("form", { onSubmit: (event) => void onCreateNotebook(event), children: _jsx("input", { autoFocus: true, value: draft, placeholder: "Notebook name", onChange: (event) => setDraft(event.target.value), onBlur: () => {
                                if (!draft.trim())
                                    setCreating(false);
                            }, onKeyDown: (event) => {
                                if (event.key === 'Escape')
                                    setCreating(false);
                            }, className: "w-full rounded-lg bg-white/10 px-2.5 py-1.5 text-sm text-sidebar-foreground outline-none placeholder:text-sidebar-foreground/40" }) })) : null, _jsx("div", { className: "mt-5 px-2.5 text-xs font-medium tracking-wide text-sidebar-foreground/55", children: "Tags" }), tags.length === 0 ? (_jsx("p", { className: "px-2.5 py-1.5 text-sm text-sidebar-foreground/45", children: "Tags appear when you add them to a note." })) : (tags.map((tag) => {
                        const count = noteTags.filter((row) => row.tag_id === tag.id).length;
                        return (_jsxs("div", { className: "group flex items-center", children: [_jsxs(NavLink, { to: `/tags/${tag.id}`, className: ({ isActive }) => cn(navClass(isActive), 'min-w-0 flex-1'), onClick: onNavigate, children: [_jsx(Hash, { className: "size-4 shrink-0" }), _jsx("span", { className: "truncate", children: tag.name }), _jsx("span", { className: "ml-auto text-xs text-sidebar-foreground/50 group-hover:hidden", children: count })] }), _jsx("button", { type: "button", className: "rounded-md p-1 text-sidebar-foreground/70 opacity-0 hover:bg-white/10 group-hover:opacity-100", "aria-label": `Delete tag ${tag.name}`, onClick: () => setTagToDelete(tag), children: _jsx(Trash2, { className: "size-3.5" }) })] }, tag.id));
                    }))] }), _jsxs(NavLink, { to: "/settings", onClick: onNavigate, className: "mt-3 truncate rounded-lg px-2.5 py-2 text-sm text-sidebar-foreground/80 hover:bg-white/5", children: [_jsx("span", { className: "block truncate font-medium text-sidebar-foreground", children: displayName }), _jsx("span", { className: "block truncate text-xs text-sidebar-foreground/55", children: user?.email })] }), _jsx(ConfirmDialog, { open: notebookToDelete !== null, onOpenChange: (open) => {
                    if (!open)
                        setNotebookToDelete(null);
                }, title: "Delete notebook?", description: notebookToDelete
                    ? `"${notebookToDelete.name}" will be removed. Notes inside it stay in your library as unfiled.`
                    : '', confirmLabel: "Delete notebook", destructive: true, onConfirm: () => {
                    if (!notebookToDelete)
                        return;
                    const notebook = notebookToDelete;
                    setNotebookToDelete(null);
                    void deleteNotebook(notebook.id).catch((error) => {
                        toast.error(toErrorMessage(error, 'Could not delete the notebook.'));
                    });
                } }), _jsx(ConfirmDialog, { open: tagToDelete !== null, onOpenChange: (open) => {
                    if (!open)
                        setTagToDelete(null);
                }, title: "Delete tag?", description: tagToDelete ? `"${tagToDelete.name}" will be removed from every note.` : '', confirmLabel: "Delete tag", destructive: true, onConfirm: () => {
                    if (!tagToDelete)
                        return;
                    const tag = tagToDelete;
                    setTagToDelete(null);
                    void deleteTag(tag.id).catch((error) => {
                        toast.error(toErrorMessage(error, 'Could not delete the tag.'));
                    });
                } })] }));
}
