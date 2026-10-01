import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { BlockNoteSchema } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import { Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { useFiles } from '@/hooks/useFiles';
import { toErrorMessage } from '@/lib/errors';
import { formatFileSize } from '@/lib/files/format';
import { noteBlockSpecs } from '@/lib/notes/schema';
const storedFile = createReactBlockSpec({
    type: 'storedFile',
    propSchema: {
        fileId: { default: '' },
        name: { default: '' },
    },
    content: 'none',
}, {
    render: ({ block }) => _jsx(StoredFileChip, { fileId: block.props.fileId, name: block.props.name }),
    toExternalHTML: ({ block }) => {
        const name = block.props.name || 'File';
        if (!block.props.fileId)
            return _jsx("span", { children: name });
        return _jsx("a", { href: `saga-file:${block.props.fileId}`, children: name });
    },
});
export const noteSchema = BlockNoteSchema.create({
    blockSpecs: {
        ...noteBlockSpecs,
        storedFile: storedFile(),
    },
});
function StoredFileChip({ fileId, name }) {
    const { files, ready, download } = useFiles();
    const row = files.find((file) => file.id === fileId);
    const missing = ready && Boolean(fileId) && !row;
    const label = row?.name || name || 'File';
    if (missing) {
        return (_jsxs("span", { className: "my-1 inline-flex max-w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground", children: [_jsx(Paperclip, { className: "size-4 shrink-0" }), _jsxs("span", { className: "truncate", children: [label, " was deleted"] })] }));
    }
    return (_jsxs("button", { type: "button", className: "my-1 inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-left text-sm text-foreground hover:bg-secondary", onMouseDown: (event) => event.stopPropagation(), onClick: (event) => {
            event.preventDefault();
            event.stopPropagation();
            if (!fileId)
                return;
            void download(fileId).catch((error) => {
                toast.error(toErrorMessage(error, 'Could not open that file.'));
            });
        }, children: [_jsx(Paperclip, { className: "size-4 shrink-0" }), _jsx("span", { className: "truncate", children: label }), row ? _jsx("span", { className: "shrink-0 text-xs text-muted-foreground", children: formatFileSize(row.size_bytes) }) : null] }));
}
