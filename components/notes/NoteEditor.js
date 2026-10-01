import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { en } from '@blocknote/core/locales';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/shadcn/style.css';
import { Download, History, MoreHorizontal, Paperclip, Pin, PinOff, RotateCcw, Trash2, } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FilePickerDialog } from '@/components/files/FilePickerDialog';
import { EditorBoundary } from '@/components/notes/EditorBoundary';
import { noteSchema } from '@/components/notes/noteSchema';
import { VersionHistoryDialog } from '@/components/notes/VersionHistoryDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, } from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useNotes } from '@/hooks/useNotes';
import { toErrorMessage } from '@/lib/errors';
import { downloadTextFile, markdownDocument, markdownFilename } from '@/lib/notes/markdown';
import { blocksToPlainText } from '@/lib/notes/plainText';
import { formatExactTime } from '@/lib/notes/time';
import { uploadNoteImage } from '@/lib/supabase/noteMedia';
import { getNote } from '@/lib/supabase/notes';
function asInitialContent(content) {
    if (!Array.isArray(content) || content.length === 0)
        return undefined;
    return content;
}
export function NoteEditor({ noteId, readOnly, onBack, onLeft, onReplaced, }) {
    const [note, setNote] = useState(null);
    const [error, setError] = useState(null);
    useEffect(() => {
        let active = true;
        setNote(null);
        setError(null);
        void getNote(noteId)
            .then((row) => {
            if (active)
                setNote(row);
        })
            .catch((loadError) => {
            if (active)
                setError(toErrorMessage(loadError, 'Could not open this note.'));
        });
        return () => {
            active = false;
        };
    }, [noteId]);
    if (error) {
        return _jsx("div", { className: "grid h-full place-items-center px-6 text-sm text-muted-foreground", children: error });
    }
    if (!note) {
        return (_jsxs("div", { className: "mx-auto w-full max-w-3xl px-6 py-10", children: [_jsx("div", { className: "h-10 w-2/3 animate-pulse rounded-md bg-secondary" }), _jsx("div", { className: "mt-8 h-4 w-full animate-pulse rounded bg-secondary" }), _jsx("div", { className: "mt-3 h-4 w-5/6 animate-pulse rounded bg-secondary" })] }));
    }
    return (_jsx(EditorBoundary, { resetKey: note.id + note.updated_at, children: _jsx(NoteSurface, { note: note, readOnly: readOnly, onBack: onBack, onLeft: onLeft, onReplaced: onReplaced }) }));
}
function NoteSurface({ note, readOnly, onBack, onLeft, onReplaced, }) {
    const { user } = useAuth();
    const { notebooks, tags, noteTags, saveNote, moveNote, setPinned, setTagsForNote, trashNote, restoreNote, deleteNoteForever, checkpoint, } = useNotes();
    const { resolvedTheme } = useTheme();
    const [title, setTitle] = useState(note.title || 'Untitled');
    const [pinned, setPinnedState] = useState(note.is_pinned);
    const [notebookId, setNotebookId] = useState(note.notebook_id);
    const [status, setStatus] = useState('idle');
    const [historyOpen, setHistoryOpen] = useState(false);
    const [confirmTrash, setConfirmTrash] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [tagDraft, setTagDraft] = useState('');
    const [filePickerOpen, setFilePickerOpen] = useState(false);
    const titleRef = useRef(title);
    const lastSaved = useRef(JSON.stringify(note.content));
    const lastTitle = useRef(note.title || 'Untitled');
    const timer = useRef(null);
    const dirty = useRef(false);
    const ignoreUnmount = useRef(false);
    const saveRef = useRef(saveNote);
    titleRef.current = title;
    saveRef.current = saveNote;
    const editor = useCreateBlockNote({
        schema: noteSchema,
        initialContent: asInitialContent(note.content),
        dictionary: {
            ...en,
            placeholders: {
                ...en.placeholders,
                default: 'Write, or type / for images and tables',
            },
        },
        uploadFile: async (file) => {
            if (!user)
                throw new Error('Sign in required.');
            return uploadNoteImage(user.id, note.id, file);
        },
    }, []);
    async function persist(content, nextTitle) {
        const serialized = JSON.stringify(content);
        const normalizedTitle = nextTitle.trim() || 'Untitled';
        if (serialized === lastSaved.current && normalizedTitle === lastTitle.current)
            return;
        setStatus('saving');
        try {
            await saveRef.current(note.id, {
                title: normalizedTitle,
                content,
                plainText: blocksToPlainText(content),
            });
            lastSaved.current = serialized;
            lastTitle.current = normalizedTitle;
            setStatus('saved');
        }
        catch (error) {
            setStatus('error');
            toast.error(toErrorMessage(error, 'Could not save this note.'));
            throw error;
        }
    }
    function currentDocument() {
        return editor.document;
    }
    function scheduleSave() {
        if (readOnly)
            return;
        dirty.current = true;
        if (timer.current)
            window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
            void persist(currentDocument(), titleRef.current).catch(() => undefined);
        }, 900);
    }
    function linkStoredFile(file) {
        const block = {
            type: 'storedFile',
            props: { fileId: file.id, name: file.name },
        };
        const blocks = editor.document;
        let reference = blocks[blocks.length - 1];
        try {
            reference = editor.getTextCursorPosition().block;
        }
        catch {
            // The editor may not have a cursor yet. Append after the last block.
        }
        if (!reference)
            return;
        editor.insertBlocks([block], reference, 'after');
        scheduleSave();
    }
    async function flush() {
        if (timer.current)
            window.clearTimeout(timer.current);
        if (readOnly)
            return;
        await persist(currentDocument(), titleRef.current);
    }
    useEffect(() => {
        return () => {
            if (timer.current)
                window.clearTimeout(timer.current);
            if (readOnly || ignoreUnmount.current || !dirty.current)
                return;
            const content = editor.document;
            const serialized = JSON.stringify(content);
            const normalizedTitle = titleRef.current.trim() || 'Untitled';
            if (serialized === lastSaved.current && normalizedTitle === lastTitle.current)
                return;
            void saveRef.current(note.id, {
                title: normalizedTitle,
                content,
                plainText: blocksToPlainText(content),
            });
        };
        // Flush the latest document when leaving this note. saveRef stays current.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [note.id, readOnly]);
    useEffect(() => {
        function onKey(event) {
            if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's')
                return;
            event.preventDefault();
            if (readOnly)
                return;
            void flush()
                .then(() => checkpoint(note.id))
                .then(() => toast.success('Version saved'))
                .catch((error) => toast.error(toErrorMessage(error, 'Could not save a version.')));
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [checkpoint, note.id, readOnly]);
    const tagNames = noteTags
        .filter((row) => row.note_id === note.id)
        .map((row) => tags.find((tag) => tag.id === row.tag_id)?.name)
        .filter((name) => Boolean(name));
    async function exportMarkdown() {
        const body = await editor.blocksToMarkdownLossy();
        const markdown = markdownDocument(title, body);
        return markdown;
    }
    const notebookName = notebooks.find((notebook) => notebook.id === notebookId)?.name ?? 'Unfiled';
    const statusLabel = status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : status === 'error' ? 'Not saved' : null;
    return (_jsxs("div", { className: "flex h-full min-h-0 flex-col bg-paper", children: [_jsxs("div", { className: "flex flex-wrap items-center gap-1 border-b border-border px-3 py-2", children: [onBack ? (_jsx(Button, { type: "button", variant: "ghost", size: "sm", className: "md:hidden", onClick: onBack, children: "Notes" })) : null, _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { className: "rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent", children: notebookName }), _jsxs(DropdownMenuContent, { children: [_jsx(DropdownMenuItem, { disabled: readOnly, onSelect: () => {
                                            const previous = notebookId;
                                            setNotebookId(null);
                                            void moveNote(note.id, null).catch((error) => {
                                                setNotebookId(previous);
                                                toast.error(toErrorMessage(error, 'Could not move the note.'));
                                            });
                                        }, children: "Unfiled" }), notebooks.map((notebook) => (_jsx(DropdownMenuItem, { disabled: readOnly, onSelect: () => {
                                            const previous = notebookId;
                                            setNotebookId(notebook.id);
                                            void moveNote(note.id, notebook.id).catch((error) => {
                                                setNotebookId(previous);
                                                toast.error(toErrorMessage(error, 'Could not move the note.'));
                                            });
                                        }, children: notebook.name }, notebook.id)))] })] }), _jsxs("span", { className: "text-xs text-muted-foreground", children: [formatExactTime(note.updated_at), statusLabel ? ` · ${statusLabel}` : ''] }), _jsxs("div", { className: "ml-auto flex items-center gap-1", children: [_jsx(Button, { type: "button", variant: "ghost", size: "icon", "aria-label": pinned ? 'Unpin note' : 'Pin note', disabled: readOnly, onClick: () => {
                                    const next = !pinned;
                                    setPinnedState(next);
                                    void setPinned(note.id, next).catch((error) => {
                                        setPinnedState(!next);
                                        toast.error(toErrorMessage(error, 'Could not update the pin.'));
                                    });
                                }, children: pinned ? _jsx(PinOff, {}) : _jsx(Pin, {}) }), _jsx(Button, { type: "button", variant: "ghost", size: "icon", "aria-label": "Version history", onClick: () => setHistoryOpen(true), children: _jsx(History, {}) }), _jsxs(DropdownMenu, { children: [_jsx(DropdownMenuTrigger, { className: "inline-flex size-9 items-center justify-center rounded-md hover:bg-accent", "aria-label": "Note actions", children: _jsx(MoreHorizontal, { className: "size-4" }) }), _jsxs(DropdownMenuContent, { align: "end", children: [_jsxs(DropdownMenuItem, { onSelect: () => {
                                                    void exportMarkdown()
                                                        .then((markdown) => {
                                                        downloadTextFile(markdownFilename(title), markdown);
                                                    })
                                                        .catch((error) => toast.error(toErrorMessage(error, 'Could not export Markdown.')));
                                                }, children: [_jsx(Download, {}), "Download Markdown"] }), _jsx(DropdownMenuItem, { onSelect: () => {
                                                    void exportMarkdown()
                                                        .then((markdown) => navigator.clipboard.writeText(markdown))
                                                        .then(() => toast.success('Markdown copied'))
                                                        .catch((error) => toast.error(toErrorMessage(error, 'Could not copy Markdown.')));
                                                }, children: "Copy Markdown" }), _jsx(DropdownMenuSeparator, {}), readOnly ? (_jsxs(DropdownMenuItem, { onSelect: () => {
                                                    void restoreNote(note.id).then(onLeft);
                                                }, children: [_jsx(RotateCcw, {}), "Restore from trash"] })) : (_jsxs(DropdownMenuItem, { onSelect: () => setConfirmTrash(true), children: [_jsx(Trash2, {}), "Move to trash"] })), _jsx(DropdownMenuItem, { onSelect: () => setConfirmDelete(true), children: "Delete forever" })] })] })] })] }), readOnly ? (_jsx("p", { className: "bg-secondary px-4 py-2 text-sm text-muted-foreground", children: "This note is in the trash. Restore it to edit." })) : null, _jsx("div", { className: "min-h-0 flex-1 overflow-y-auto", children: _jsxs("div", { className: "mx-auto w-full max-w-3xl px-6 py-8", children: [_jsx("input", { value: title, disabled: readOnly, "aria-label": "Note title", onChange: (event) => {
                                setTitle(event.target.value);
                                scheduleSave();
                            }, className: "w-full bg-transparent font-serif text-4xl text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-80", placeholder: "Untitled" }), _jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-1.5", children: [tagNames.map((name) => (_jsxs("button", { type: "button", disabled: readOnly, className: "rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground disabled:opacity-70", onClick: () => {
                                        void setTagsForNote(note.id, tagNames.filter((tag) => tag !== name)).catch((error) => toast.error(toErrorMessage(error, 'Could not update tags.')));
                                    }, children: [name, readOnly ? '' : ' ×'] }, name))), readOnly ? null : (_jsxs(_Fragment, { children: [_jsx("input", { value: tagDraft, onChange: (event) => setTagDraft(event.target.value), onKeyDown: (event) => {
                                                if (event.key !== 'Enter' && event.key !== ',')
                                                    return;
                                                event.preventDefault();
                                                const name = tagDraft.trim();
                                                if (!name)
                                                    return;
                                                setTagDraft('');
                                                void setTagsForNote(note.id, [...tagNames, name]).catch((error) => toast.error(toErrorMessage(error, 'Could not add the tag.')));
                                            }, placeholder: "Add a tag", className: "h-7 min-w-24 bg-transparent text-xs outline-none placeholder:text-muted-foreground" }), _jsxs(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => setFilePickerOpen(true), children: [_jsx(Paperclip, {}), "Link file"] })] }))] }), _jsx("p", { className: "mt-3 text-xs text-muted-foreground", children: "Markdown export is a copy. Saga keeps this document, including image sizes and tables." }), _jsx("div", { className: "saga-editor mt-4", children: _jsx(BlockNoteView, { editor: editor, editable: !readOnly, theme: resolvedTheme === 'dark' ? 'dark' : 'light', onChange: () => scheduleSave() }) })] }) }), _jsx(VersionHistoryDialog, { noteId: note.id, open: historyOpen, readOnly: readOnly, onOpenChange: setHistoryOpen, onBeforeRestore: flush, onRestored: () => {
                    ignoreUnmount.current = true;
                    onReplaced();
                } }), _jsx(ConfirmDialog, { open: confirmTrash, onOpenChange: setConfirmTrash, title: "Move this note to the trash?", description: "You can restore it later. Versions stay with the note.", confirmLabel: "Move to trash", destructive: true, onConfirm: () => {
                    setConfirmTrash(false);
                    void trashNote(note.id).then(onLeft);
                } }), _jsx(ConfirmDialog, { open: confirmDelete, onOpenChange: setConfirmDelete, title: "Delete this note forever?", description: "The document, its versions, and its images will be removed.", confirmLabel: "Delete forever", destructive: true, onConfirm: () => {
                    setConfirmDelete(false);
                    void deleteNoteForever(note.id).then(onLeft);
                } }), _jsx(FilePickerDialog, { open: filePickerOpen, onOpenChange: setFilePickerOpen, onSelect: linkStoredFile })] }));
}
