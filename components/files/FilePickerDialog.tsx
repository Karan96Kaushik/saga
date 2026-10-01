import { Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useFiles } from '@/hooks/useFiles';
import { toErrorMessage } from '@/lib/errors';
import { formatFileSize } from '@/lib/files/format';
import { formatNoteTime } from '@/lib/notes/time';
import type { FileRow } from '@/lib/supabase/types';

export function FilePickerDialog({
  open,
  onOpenChange,
  onSelect,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (file: FileRow) => void;
}) {
  const { files, ready, error, upload } = useFiles();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const visible = files.filter((file) => file.name.toLowerCase().includes(query.trim().toLowerCase()));

  async function onUpload(list: FileList | null) {
    const file = list?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const row = await upload(file);
      onSelect(row);
      onOpenChange(false);
    } catch (uploadError) {
      toast.error(toErrorMessage(uploadError, 'Could not upload that file.'));
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setQuery('');
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[min(100%-2rem,36rem)] flex-col">
        <DialogHeader>
          <DialogTitle>Link a file</DialogTitle>
          <DialogDescription>The note stores a link. The file itself stays in your library.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search files"
            aria-label="Search files"
            className="h-9 min-w-0 flex-1 rounded-md border border-border bg-paper px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <input
            ref={inputRef}
            type="file"
            className="sr-only"
            onChange={(event) => void onUpload(event.target.files)}
          />
          <Button type="button" variant="outline" disabled={uploading} onClick={() => inputRef.current?.click()}>
            <Upload />
            {uploading ? 'Uploading…' : 'Upload'}
          </Button>
        </div>
        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {!ready && !error ? <p className="text-sm text-muted-foreground">Loading files…</p> : null}
          {ready && visible.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {files.length === 0 ? 'No files yet. Upload one to link it.' : 'No files match that search.'}
            </p>
          ) : null}
          <ul className="space-y-1">
            {visible.map((file) => (
              <li key={file.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-secondary"
                  onClick={() => {
                    onSelect(file);
                    onOpenChange(false);
                  }}
                >
                  <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatFileSize(file.size_bytes)}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{formatNoteTime(file.created_at)}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
