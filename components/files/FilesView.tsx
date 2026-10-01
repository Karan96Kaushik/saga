import { Download, Paperclip, Trash2, Upload } from 'lucide-react';
import { useRef, useState, type DragEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useFiles } from '@/hooks/useFiles';
import { toErrorMessage } from '@/lib/errors';
import { formatFileSize, MAX_FILE_BYTES } from '@/lib/files/format';
import { formatNoteTime } from '@/lib/notes/time';
import type { FileRow } from '@/lib/supabase/types';

export function FilesView() {
  const { files, ready, error, upload, remove, download } = useFiles();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<FileRow | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function uploadList(list: FileList | File[]) {
    const batch = Array.from(list);
    if (batch.length === 0) return;
    setUploading(true);
    try {
      for (const file of batch) {
        if (file.size > MAX_FILE_BYTES) {
          toast.error(`${file.name} is larger than 25MB.`);
          continue;
        }
        await upload(file);
      }
    } catch (uploadError) {
      toast.error(toErrorMessage(uploadError, 'Could not upload that file.'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    void uploadList(event.dataTransfer.files);
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-3xl">Files</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Upload once, then link the file from any note. Deleting a file removes it completely.
            </p>
          </div>
          <input
            ref={inputRef}
            type="file"
            multiple
            className="sr-only"
            onChange={(event) => {
              if (event.target.files) void uploadList(event.target.files);
            }}
          />
          <Button type="button" disabled={uploading} onClick={() => inputRef.current?.click()}>
            <Upload />
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </div>

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`rounded-xl border border-dashed px-4 py-8 text-center text-sm ${
            dragging ? 'border-primary bg-secondary' : 'border-border text-muted-foreground'
          }`}
        >
          Drop files here. 25MB each.
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        {!ready && !error ? <p className="text-sm text-muted-foreground">Loading files…</p> : null}
        {ready && files.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center text-muted-foreground">
            <Paperclip className="size-5" />
            <p className="text-sm">No files yet.</p>
          </div>
        ) : null}

        <ul className="divide-y divide-border">
          {files.map((file) => (
            <li key={file.id} className="flex items-center gap-3 py-3">
              <Paperclip className="size-4 shrink-0 text-muted-foreground" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(file.size_bytes)} · {formatNoteTime(file.created_at)}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Download ${file.name}`}
                onClick={() => {
                  void download(file.id).catch((downloadError: unknown) => {
                    toast.error(toErrorMessage(downloadError, 'Could not open that file.'));
                  });
                }}
              >
                <Download />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete ${file.name}`}
                onClick={() => setPendingDelete(file)}
              >
                <Trash2 />
              </Button>
            </li>
          ))}
        </ul>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleting) setPendingDelete(null);
        }}
        title="Delete this file?"
        description={
          pendingDelete
            ? `“${pendingDelete.name}” will be deleted completely. Notes that link it will lose the file, and this cannot be undone.`
            : ''
        }
        confirmLabel={deleting ? 'Deleting…' : 'Delete file'}
        destructive
        pending={deleting}
        onConfirm={() => {
          if (!pendingDelete) return;
          setDeleting(true);
          void remove(pendingDelete.id)
            .then(() => {
              setPendingDelete(null);
            })
            .catch((deleteError: unknown) => {
              toast.error(toErrorMessage(deleteError, 'Could not delete that file.'));
            })
            .finally(() => setDeleting(false));
        }}
      />
    </div>
  );
}
