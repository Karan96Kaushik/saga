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
import type { Json, NoteVersionRow } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

export function VersionHistoryDialog({
  noteId,
  open,
  readOnly,
  onOpenChange,
  onBeforeRestore,
  onRestored,
}: {
  noteId: string;
  open: boolean;
  readOnly: boolean;
  onOpenChange: (open: boolean) => void;
  onBeforeRestore: () => Promise<void>;
  onRestored: () => void;
}) {
  const { saveNote } = useNotes();
  const [versions, setVersions] = useState<NoteVersionRow[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = versions.find((version) => version.id === selectedId) ?? null;

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    setError(null);
    void listNoteVersions(noteId)
      .then((rows) => {
        if (!active) return;
        setVersions(rows);
        setSelectedId(rows[0]?.id ?? null);
      })
      .catch((loadError: unknown) => {
        if (active) setError(toErrorMessage(loadError, 'Could not load versions.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [noteId, open]);

  async function restore() {
    if (!selected) return;
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

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(40rem,calc(100dvh-2rem))] w-[min(100%-2rem,56rem)] flex-col overflow-hidden p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>Versions</DialogTitle>
          <DialogDescription>
            Saga keeps the previous document about once a minute while you edit. ⌘S or Ctrl+S saves a version now.
          </DialogDescription>
        </DialogHeader>
        {loading ? <p className="px-6 py-8 text-sm text-muted-foreground">Loading versions…</p> : null}
        {error ? <p className="px-6 py-8 text-sm text-destructive">{error}</p> : null}
        {!loading && !error && versions.length === 0 ? (
          <p className="px-6 py-8 text-sm text-muted-foreground">
            No earlier versions yet. Keep writing, or press ⌘S to save one.
          </p>
        ) : null}
        {!loading && versions.length > 0 ? (
          <div className="grid min-h-0 flex-1 md:grid-cols-[16rem_minmax(0,1fr)]">
            <div className="max-h-80 overflow-y-auto border-b border-border md:max-h-none md:border-b-0 md:border-r">
              {versions.map((version) => (
                <button
                  key={version.id}
                  type="button"
                  onClick={() => setSelectedId(version.id)}
                  className={cn(
                    'block w-full px-4 py-3 text-left',
                    version.id === selectedId ? 'bg-secondary' : 'hover:bg-accent',
                  )}
                >
                  <span className="block text-sm font-medium">Version {version.version_number}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {formatExactTime(version.created_at)}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
                    {snippet(blocksToPlainText(version.content)) || version.title || 'Empty note'}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex min-h-0 flex-col">
              <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-2">
                <p className="truncate font-serif text-lg">{selected?.title || 'Untitled'}</p>
                <Button
                  type="button"
                  size="sm"
                  disabled={!selected || readOnly}
                  onClick={() => setConfirming(true)}
                >
                  Restore
                </Button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
                {selected ? (
                  <EditorBoundary resetKey={selected.id}>
                    <VersionPreview key={selected.id} content={selected.content} />
                  </EditorBoundary>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
    <ConfirmDialog
      open={confirming}
      onOpenChange={setConfirming}
      title={selected ? `Restore version ${selected.version_number}?` : 'Restore version?'}
      description="The note as it is now is kept in the history, then replaced with this version."
      confirmLabel="Restore version"
      onConfirm={() => {
        void restore().catch((restoreError: unknown) => {
          toast.error(toErrorMessage(restoreError, 'Could not restore that version.'));
        });
      }}
    />
    </>
  );
}

function VersionPreview({ content }: { content: Json }) {
  const initialContent = Array.isArray(content) && content.length > 0 ? (content as never) : undefined;
  const editor = useCreateBlockNote({ schema: noteSchema, initialContent }, []);
  return (
    <div className="saga-editor">
      <BlockNoteView editor={editor} editable={false} />
    </div>
  );
}
