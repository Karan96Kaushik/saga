import { BlockNoteSchema } from '@blocknote/core';
import { createReactBlockSpec } from '@blocknote/react';
import { Paperclip } from 'lucide-react';
import { toast } from 'sonner';
import { useFiles } from '@/hooks/useFiles';
import { toErrorMessage } from '@/lib/errors';
import { formatFileSize } from '@/lib/files/format';
import { noteBlockSpecs } from '@/lib/notes/schema';

const storedFile = createReactBlockSpec(
  {
    type: 'storedFile',
    propSchema: {
      fileId: { default: '' },
      name: { default: '' },
    },
    content: 'none',
  },
  {
    render: ({ block }) => <StoredFileChip fileId={block.props.fileId} name={block.props.name} />,
    toExternalHTML: ({ block }) => {
      const name = block.props.name || 'File';
      if (!block.props.fileId) return <span>{name}</span>;
      return <a href={`saga-file:${block.props.fileId}`}>{name}</a>;
    },
  },
);

export const noteSchema = BlockNoteSchema.create({
  blockSpecs: {
    ...noteBlockSpecs,
    storedFile: storedFile(),
  },
});

function StoredFileChip({ fileId, name }: { fileId: string; name: string }) {
  const { files, ready, download } = useFiles();
  const row = files.find((file) => file.id === fileId);
  const missing = ready && Boolean(fileId) && !row;
  const label = row?.name || name || 'File';

  if (missing) {
    return (
      <span className="my-1 inline-flex max-w-full items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
        <Paperclip className="size-4 shrink-0" />
        <span className="truncate">{label} was deleted</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      className="my-1 inline-flex max-w-full items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-2 text-left text-sm text-foreground hover:bg-secondary"
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!fileId) return;
        void download(fileId).catch((error: unknown) => {
          toast.error(toErrorMessage(error, 'Could not open that file.'));
        });
      }}
    >
      <Paperclip className="size-4 shrink-0" />
      <span className="truncate">{label}</span>
      {row ? <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(row.size_bytes)}</span> : null}
    </button>
  );
}
