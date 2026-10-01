import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import { EditorBoundary } from '@/components/notes/EditorBoundary';
import { noteSchema } from '@/components/notes/noteSchema';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useNotes } from '@/hooks/useNotes';
import { toErrorMessage } from '@/lib/errors';
import { blocksToPlainText } from '@/lib/notes/plainText';
import { snippet } from '@/lib/notes/selectNotes';
import { formatExactTime } from '@/lib/notes/time';
import { listNoteVersions } from '@/lib/supabase/noteVersions';
import { cn } from '@/lib/utils';
export function VersionHistoryDialog({ noteId, open, readOnly, onOpenChange, onBeforeRestore, onRestored, }) {
    const { saveNote } = useNotes();
    const [versions, setVersions] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [confirming, setConfirming] = useState(false);
    const [error, setError] = useState(null);
    const selected = versions.find((version) => version.id === selectedId) ?? null;
    useEffect(() => {
        if (!open)
            return;
        let active = true;
        setLoading(true);
        setError(null);
        void listNoteVersions(noteId)
            .then((rows) => {
            if (!active)
                return;
            setVersions(rows);
            setSelectedId(rows[0]?.id ?? null);
        })
            .catch((loadError) => {
            if (active)
                setError(toErrorMessage(loadError, 'Could not load versions.'));
        })
            .finally(() => {
            if (active)
                setLoading(false);
        });
        return () => {
            active = false;
        };
    }, [noteId, open]);
    async function restore() {
        if (!selected)
            return;
        await onBeforeRestore();
        await saveNote(selected.note_id, {
            title: selected.title || 'Untitled',
            content: selected.content,
            plainText: blocksToPlainText(selected.content),
        });
        setConfirming(false);
        onOpenChange(false);
        onRestored();
        toast.success(`Restored version ${selected.version_number}`);
    }
    return (_jsxs(_Fragment, { children: [_jsx(Dialog, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogContent, { className: "flex max-h-[min(40rem,calc(100dvh-2rem))] w-[min(100%-2rem,56rem)] flex-col overflow-hidden p-0", children: [_jsxs(DialogHeader, { className: "border-b border-border px-6 py-4", children: [_jsx(DialogTitle, { children: "Versions" }), _jsx(DialogDescription, { children: "Saga keeps the previous document about once a minute while you edit. \u2318S or Ctrl+S saves a version now." })] }), loading ? _jsx("p", { className: "px-6 py-8 text-sm text-muted-foreground", children: "Loading versions\u2026" }) : null, error ? _jsx("p", { className: "px-6 py-8 text-sm text-destructive", children: error }) : null, !loading && !error && versions.length === 0 ? (_jsx("p", { className: "px-6 py-8 text-sm text-muted-foreground", children: "No earlier versions yet. Keep writing, or press \u2318S to save one." })) : null, !loading && versions.length > 0 ? (_jsxs("div", { className: "grid min-h-0 flex-1 md:grid-cols-[16rem_minmax(0,1fr)]", children: [_jsx("div", { className: "max-h-80 overflow-y-auto border-b border-border md:max-h-none md:border-b-0 md:border-r", children: versions.map((version) => (_jsxs("button", { type: "button", onClick: () => setSelectedId(version.id), className: cn('block w-full px-4 py-3 text-left', version.id === selectedId ? 'bg-secondary' : 'hover:bg-accent'), children: [_jsxs("span", { className: "block text-sm font-medium", children: ["Version ", version.version_number] }), _jsx("span", { className: "mt-0.5 block text-xs text-muted-foreground", children: formatExactTime(version.created_at) }), _jsx("span", { className: "mt-1 line-clamp-2 block text-xs text-muted-foreground", children: snippet(blocksToPlainText(version.content)) || version.title || 'Empty note' })] }, version.id))) }), _jsxs("div", { className: "flex min-h-0 flex-col", children: [_jsxs("div", { className: "flex items-center justify-between gap-3 border-b border-border px-4 py-2", children: [_jsx("p", { className: "truncate font-serif text-lg", children: selected?.title || 'Untitled' }), _jsx(Button, { type: "button", size: "sm", disabled: !selected || readOnly, onClick: () => setConfirming(true), children: "Restore" })] }), _jsx("div", { className: "min-h-0 flex-1 overflow-y-auto px-4 py-3", children: selected ? (_jsx(EditorBoundary, { resetKey: selected.id, children: _jsx(VersionPreview, { content: selected.content }, selected.id) })) : null })] })] })) : null] }) }), _jsx(ConfirmDialog, { open: confirming, onOpenChange: setConfirming, title: selected ? `Restore version ${selected.version_number}?` : 'Restore version?', description: "The note as it is now is kept in the history, then replaced with this version.", confirmLabel: "Restore version", onConfirm: () => {
                    void restore().catch((restoreError) => {
                        toast.error(toErrorMessage(restoreError, 'Could not restore that version.'));
                    });
                } })] }));
}
function VersionPreview({ content }) {
    const initialContent = Array.isArray(content) && content.length > 0 ? content : undefined;
    const editor = useCreateBlockNote({ schema: noteSchema, initialContent }, []);
    return (_jsx("div", { className: "saga-editor", children: _jsx(BlockNoteView, { editor: editor, editable: false }) }));
}
