import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFiles } from '@/hooks/useFiles';
import { toErrorMessage } from '@/lib/errors';
import { formatFileSize } from '@/lib/files/format';
import { formatNoteTime } from '@/lib/notes/time';
export function FilePickerDialog({ open, onOpenChange, onSelect, }) {
    const { files, ready, error, upload } = useFiles();
    const inputRef = useRef(null);
    const [query, setQuery] = useState('');
    const [uploading, setUploading] = useState(false);
    const visible = files.filter((file) => file.name.toLowerCase().includes(query.trim().toLowerCase()));
    async function onUpload(list) {
        const file = list?.[0];
        if (!file)
            return;
        setUploading(true);
        try {
            const row = await upload(file);
            onSelect(row);
            onOpenChange(false);
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
    return (_jsx(Dialog, { open: open, onOpenChange: (next) => {
            if (!next)
                setQuery('');
            onOpenChange(next);
        }, children: _jsxs(DialogContent, { className: "flex max-h-[min(100%-2rem,36rem)] flex-col", children: [_jsxs(DialogHeader, { children: [_jsx(DialogTitle, { children: "Link a file" }), _jsx(DialogDescription, { children: "The note stores a link. The file itself stays in your library." })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { value: query, onChange: (event) => setQuery(event.target.value), placeholder: "Search files", "aria-label": "Search files", className: "h-9 min-w-0 flex-1 rounded-md border border-border bg-paper px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" }), _jsx("input", { ref: inputRef, type: "file", className: "sr-only", onChange: (event) => void onUpload(event.target.files) }), _jsxs(Button, { type: "button", variant: "outline", disabled: uploading, onClick: () => inputRef.current?.click(), children: [_jsx(Upload, {}), uploading ? 'Uploading…' : 'Upload'] })] }), _jsxs("div", { className: "mt-3 min-h-0 flex-1 overflow-y-auto", children: [error ? _jsx("p", { className: "text-sm text-destructive", children: error }) : null, !ready && !error ? _jsx("p", { className: "text-sm text-muted-foreground", children: "Loading files\u2026" }) : null, ready && visible.length === 0 ? (_jsx("p", { className: "text-sm text-muted-foreground", children: files.length === 0 ? 'No files yet. Upload one to link it.' : 'No files match that search.' })) : null, _jsx("ul", { className: "space-y-1", children: visible.map((file) => (_jsx("li", { children: _jsxs("button", { type: "button", className: "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-secondary", onClick: () => {
                                        onSelect(file);
                                        onOpenChange(false);
                                    }, children: [_jsx("span", { className: "min-w-0 flex-1 truncate text-sm", children: file.name }), _jsx("span", { className: "shrink-0 text-xs text-muted-foreground", children: formatFileSize(file.size_bytes) }), _jsx("span", { className: "shrink-0 text-xs text-muted-foreground", children: formatNoteTime(file.created_at) })] }) }, file.id))) })] })] }) }));
}
