import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Download, Paperclip, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useFiles } from '@/hooks/useFiles';
import { toErrorMessage } from '@/lib/errors';
import { formatFileSize, MAX_FILE_BYTES } from '@/lib/files/format';
import { formatNoteTime } from '@/lib/notes/time';
export function FilesView() {
    const { files, ready, error, upload, remove, download } = useFiles();
    const inputRef = useRef(null);
    const [dragging, setDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [pendingDelete, setPendingDelete] = useState(null);
    const [deleting, setDeleting] = useState(false);
    async function uploadList(list) {
        const batch = Array.from(list);
        if (batch.length === 0)
            return;
        setUploading(true);
        try {
            for (const file of batch) {
                if (file.size > MAX_FILE_BYTES) {
                    toast.error(`${file.name} is larger than 25MB.`);
                    continue;
                }
                await upload(file);
            }
        }
        catch (uploadError) {
            toast.error(toErrorMessage(uploadError, 'Could not upload that file.'));
        }
        finally {
            setUploading(false);
            if (inputRef.current)
                inputRef.current.value = '';
        }
    }
    function onDrop(event) {
        event.preventDefault();
        setDragging(false);
        void uploadList(event.dataTransfer.files);
    }
    return (_jsxs("div", { className: "h-full overflow-y-auto", children: [_jsxs("div", { className: "mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8", children: [_jsxs("div", { className: "flex flex-wrap items-end justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h2", { className: "font-serif text-3xl", children: "Files" }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Upload once, then link the file from any note. Deleting a file removes it completely." })] }), _jsx("input", { ref: inputRef, type: "file", multiple: true, className: "sr-only", onChange: (event) => {
                                    if (event.target.files)
                                        void uploadList(event.target.files);
                                } }), _jsxs(Button, { type: "button", disabled: uploading, onClick: () => inputRef.current?.click(), children: [_jsx(Upload, {}), uploading ? 'Uploading…' : 'Upload'] })] }), _jsx("div", { onDragOver: (event) => {
                            event.preventDefault();
                            setDragging(true);
                        }, onDragLeave: () => setDragging(false), onDrop: onDrop, className: `rounded-xl border border-dashed px-4 py-8 text-center text-sm ${dragging ? 'border-primary bg-secondary' : 'border-border text-muted-foreground'}`, children: "Drop files here. 25MB each." }), error ? _jsx("p", { className: "text-sm text-destructive", children: error }) : null, !ready && !error ? _jsx("p", { className: "text-sm text-muted-foreground", children: "Loading files\u2026" }) : null, ready && files.length === 0 ? (_jsxs("div", { className: "flex flex-col items-center gap-2 py-10 text-center text-muted-foreground", children: [_jsx(Paperclip, { className: "size-5" }), _jsx("p", { className: "text-sm", children: "No files yet." })] })) : null, _jsx("ul", { className: "divide-y divide-border", children: files.map((file) => (_jsxs("li", { className: "flex items-center gap-3 py-3", children: [_jsx(Paperclip, { className: "size-4 shrink-0 text-muted-foreground" }), _jsxs("div", { className: "min-w-0 flex-1", children: [_jsx("p", { className: "truncate text-sm", children: file.name }), _jsxs("p", { className: "text-xs text-muted-foreground", children: [formatFileSize(file.size_bytes), " \u00B7 ", formatNoteTime(file.created_at)] })] }), _jsx(Button, { type: "button", variant: "ghost", size: "icon", "aria-label": `Download ${file.name}`, onClick: () => {
                                        void download(file.id).catch((downloadError) => {
                                            toast.error(toErrorMessage(downloadError, 'Could not open that file.'));
                                        });
                                    }, children: _jsx(Download, {}) }), _jsx(Button, { type: "button", variant: "ghost", size: "icon", "aria-label": `Delete ${file.name}`, onClick: () => setPendingDelete(file), children: _jsx(Trash2, {}) })] }, file.id))) })] }), _jsx(ConfirmDialog, { open: pendingDelete !== null, onOpenChange: (open) => {
                    if (!open && !deleting)
                        setPendingDelete(null);
                }, title: "Delete this file?", description: pendingDelete
                    ? `“${pendingDelete.name}” will be deleted completely. Notes that link it will lose the file, and this cannot be undone.`
                    : '', confirmLabel: deleting ? 'Deleting…' : 'Delete file', destructive: true, pending: deleting, onConfirm: () => {
                    if (!pendingDelete)
                        return;
                    setDeleting(true);
                    void remove(pendingDelete.id)
                        .then(() => {
                        setPendingDelete(null);
                    })
                        .catch((deleteError) => {
                        toast.error(toErrorMessage(deleteError, 'Could not delete that file.'));
                    })
                        .finally(() => setDeleting(false));
                } })] }));
}
