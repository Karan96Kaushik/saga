import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Pin } from 'lucide-react';
import { snippet } from '@/lib/notes/selectNotes';
import { formatNoteTime } from '@/lib/notes/time';
import { cn } from '@/lib/utils';
export function NoteCard({ note, notebookName, selected, onSelect, }) {
    const preview = snippet(note.plain_text);
    return (_jsxs("button", { type: "button", onClick: onSelect, "aria-current": selected ? 'true' : undefined, className: cn('w-full rounded-xl px-3 py-2.5 text-left transition-colors', selected ? 'bg-paper shadow-sm ring-1 ring-border' : 'hover:bg-black/5 dark:hover:bg-white/5'), children: [_jsxs("span", { className: "flex items-start justify-between gap-3", children: [_jsx("span", { className: cn('truncate font-medium', note.title ? '' : 'italic text-muted-foreground'), children: note.title || 'Untitled' }), note.is_pinned ? _jsx(Pin, { className: "mt-1 size-3.5 shrink-0 text-gold", "aria-label": "Pinned" }) : null] }), preview ? _jsx("span", { className: "mt-1 line-clamp-2 block text-sm text-muted-foreground", children: preview }) : null, _jsxs("span", { className: "mt-2 block text-xs text-muted-foreground", children: [formatNoteTime(note.updated_at), notebookName ? ` · ${notebookName}` : ''] })] }));
}
