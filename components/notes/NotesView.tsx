import { useEffect, useRef, useState } from 'react';
import { useLocation, useParams, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { NoteCard } from '@/components/notes/NoteCard';
import { NoteEditor } from '@/components/notes/NoteEditor';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useNotes } from '@/hooks/useNotes';
import { toErrorMessage } from '@/lib/errors';
import { selectNotes, type NoteFilter } from '@/lib/notes/selectNotes';

export function NotesView() {
  const { notebookId, tagId } = useParams();
  const { pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const { loading, error, notebooks, notes, tags, noteTags, createNote, emptyTrash } = useNotes();
  const [revision, setRevision] = useState(0);
  const [confirmEmpty, setConfirmEmpty] = useState(false);
  const query = params.get('q') ?? '';
  const noteId = params.get('note');

  const filter: NoteFilter = pathname.startsWith('/trash')
    ? { kind: 'trash' }
    : pathname.startsWith('/unfiled')
      ? { kind: 'unfiled' }
      : notebookId
        ? { kind: 'notebook', notebookId }
        : tagId
          ? { kind: 'tag', tagId }
          : { kind: 'all' };

  const visible = selectNotes(notes, noteTags, filter, query);
  const selected = notes.find((note) => note.id === noteId) ?? null;
  const trashView = filter.kind === 'trash';
  const editorNote =
    selected && (trashView ? selected.trashed_at !== null : selected.trashed_at === null) ? selected : null;

  const openNewRef = useRef<() => Promise<void>>(async () => undefined);

  async function openNew() {
    const note = await createNote(filter.kind === 'notebook' ? filter.notebookId : null);
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set('note', note.id);
      next.delete('q');
      return next;
    });
  }

  openNewRef.current = openNew;

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'n') {
        event.preventDefault();
        void openNewRef.current().catch((createError: unknown) => {
          toast.error(toErrorMessage(createError, 'Could not create the note.'));
        });
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function selectNote(id: string) {
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.set('note', id);
      return next;
    });
  }

  function closeNote() {
    setParams((current) => {
      const next = new URLSearchParams(current);
      next.delete('note');
      return next;
    });
  }

  const title =
    query.trim().length > 0
      ? 'Search'
      : filter.kind === 'all'
        ? 'All notes'
        : filter.kind === 'trash'
          ? 'Trash'
          : filter.kind === 'unfiled'
            ? 'Unfiled'
            : filter.kind === 'notebook'
              ? (notebooks.find((notebook) => notebook.id === filter.notebookId)?.name ?? 'Notebook')
              : (tags.find((tag) => tag.id === filter.tagId)?.name ?? 'Tag');

  if (loading && notes.length === 0) {
    return <div className="grid h-full place-items-center text-sm text-muted-foreground">Loading notes…</div>;
  }

  if (error && notes.length === 0) {
    return <div className="grid h-full place-items-center px-6 text-center text-sm text-muted-foreground">{error}</div>;
  }

  const showList = !isMobile || !editorNote;
  const showEditor = !isMobile || Boolean(editorNote);

  return (
    <div className="flex h-full min-h-0">
      {showList ? (
        <section className="flex h-full min-w-0 flex-1 flex-col border-border md:w-[22rem] md:flex-none md:border-r">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <h1 className="font-serif text-2xl">{title}</h1>
              <p className="text-xs text-muted-foreground">
                {visible.length} {visible.length === 1 ? 'note' : 'notes'}
              </p>
            </div>
            {filter.kind === 'trash' && notes.some((note) => note.trashed_at !== null) ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setConfirmEmpty(true)}>
                Empty trash
              </Button>
            ) : null}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-4">
            {visible.length === 0 ? (
              <div className="px-3 py-10 text-sm text-muted-foreground">
                <p>{emptyCopy(filter, query)}</p>
                {filter.kind !== 'trash' && !query.trim() ? (
                  <Button type="button" className="mt-4" size="sm" onClick={() => void openNew()}>
                    New note
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-1">
                {visible.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    selected={note.id === editorNote?.id}
                    notebookName={
                      filter.kind === 'all'
                        ? notebooks.find((notebook) => notebook.id === note.notebook_id)?.name
                        : undefined
                    }
                    onSelect={() => selectNote(note.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}
      {showEditor ? (
        <section className="flex h-full min-w-0 flex-1 flex-col">
          {editorNote ? (
            <NoteEditor
              key={`${editorNote.id}:${revision}`}
              noteId={editorNote.id}
              readOnly={editorNote.trashed_at !== null}
              onBack={isMobile ? closeNote : undefined}
              onLeft={closeNote}
              onReplaced={() => setRevision((value) => value + 1)}
            />
          ) : (
            <div className="hidden h-full flex-col items-center justify-center px-8 text-center md:flex">
              <p className="font-serif text-3xl">Select a note</p>
              <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                Or start a new one. Images and tables stay in the document, and earlier drafts are kept for you.
              </p>
              <Button type="button" className="mt-6" onClick={() => void openNew()}>
                New note
              </Button>
            </div>
          )}
        </section>
      ) : null}
      <ConfirmDialog
        open={confirmEmpty}
        onOpenChange={setConfirmEmpty}
        title="Empty the trash?"
        description="Every note in the trash, including its versions and images, will be deleted."
        confirmLabel="Empty trash"
        destructive
        onConfirm={() => {
          setConfirmEmpty(false);
          void emptyTrash()
            .then((deleted) => {
              closeNote();
              toast.success(deleted === 1 ? 'Deleted 1 note' : `Deleted ${deleted} notes`);
            })
            .catch((emptyError: unknown) => {
              toast.error(toErrorMessage(emptyError, 'Could not empty the trash.'));
            });
        }}
      />
    </div>
  );
}

function emptyCopy(filter: NoteFilter, query: string): string {
  if (query.trim()) return 'No notes match that search.';
  if (filter.kind === 'trash') return 'Trash is empty.';
  if (filter.kind === 'notebook') return 'This notebook is waiting for its first note.';
  if (filter.kind === 'tag') return 'No notes use this tag yet.';
  if (filter.kind === 'unfiled') return 'Every note is in a notebook.';
  return 'Your saga starts with a single note.';
}
