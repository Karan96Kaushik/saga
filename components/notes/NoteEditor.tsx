import { en } from '@blocknote/core/locales';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/shadcn/style.css';
import {
  Download,
  EyeOff,
  History,
  MoreHorizontal,
  Paperclip,
  Pin,
  PinOff,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { FilePickerDialog } from '@/components/files/FilePickerDialog';
import { EditorBoundary } from '@/components/notes/EditorBoundary';
import { noteSchema } from '@/components/notes/noteSchema';
import { VersionHistoryDialog } from '@/components/notes/VersionHistoryDialog';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useNotes } from '@/hooks/useNotes';
import { toErrorMessage } from '@/lib/errors';
import { downloadTextFile, markdownDocument, markdownFilename } from '@/lib/notes/markdown';
import { blocksToPlainText } from '@/lib/notes/plainText';
import { formatExactTime } from '@/lib/notes/time';
import { uploadNoteImage } from '@/lib/supabase/noteMedia';
import { getNote } from '@/lib/supabase/notes';
import type { FileRow, Json, NoteRow } from '@/lib/supabase/types';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function asInitialContent(content: Json) {
  if (!Array.isArray(content) || content.length === 0) return undefined;
  return content as never;
}

export function NoteEditor({
  noteId,
  readOnly,
  onBack,
  onLeft,
  onReplaced,
}: {
  noteId: string;
  readOnly: boolean;
  onBack?: () => void;
  onLeft: () => void;
  onReplaced: () => void;
}) {
  const [note, setNote] = useState<NoteRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setNote(null);
    setError(null);
    void getNote(noteId)
      .then((row) => {
        if (active) setNote(row);
      })
      .catch((loadError: unknown) => {
        if (active) setError(toErrorMessage(loadError, 'Could not open this note.'));
      });
    return () => {
      active = false;
    };
  }, [noteId]);

  if (error) {
    return <div className="grid h-full place-items-center px-6 text-sm text-muted-foreground">{error}</div>;
  }
  if (!note) {
    return (
      <div className="mx-auto w-full max-w-3xl px-6 py-10">
        <div className="h-10 w-2/3 animate-pulse rounded-md bg-secondary" />
        <div className="mt-8 h-4 w-full animate-pulse rounded bg-secondary" />
        <div className="mt-3 h-4 w-5/6 animate-pulse rounded bg-secondary" />
      </div>
    );
  }

  return (
    <EditorBoundary resetKey={note.id + note.updated_at}>
      <NoteSurface note={note} readOnly={readOnly} onBack={onBack} onLeft={onLeft} onReplaced={onReplaced} />
    </EditorBoundary>
  );
}

function NoteSurface({
  note,
  readOnly,
  onBack,
  onLeft,
  onReplaced,
}: {
  note: NoteRow;
  readOnly: boolean;
  onBack?: () => void;
  onLeft: () => void;
  onReplaced: () => void;
}) {
  const { user } = useAuth();
  const {
    notebooks,
    tags,
    noteTags,
    saveNote,
    moveNote,
    setPinned,
    setHidden,
    setTagsForNote,
    trashNote,
    restoreNote,
    deleteNoteForever,
    checkpoint,
  } = useNotes();
  const { resolvedTheme } = useTheme();
  const [title, setTitle] = useState(note.title || 'Untitled');
  const [pinned, setPinnedState] = useState(note.is_pinned);
  const [notebookId, setNotebookId] = useState(note.notebook_id);
  const [status, setStatus] = useState<SaveStatus>('idle');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [confirmTrash, setConfirmTrash] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [tagDraft, setTagDraft] = useState('');
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const titleRef = useRef(title);
  const lastSaved = useRef(JSON.stringify(note.content));
  const lastTitle = useRef(note.title || 'Untitled');
  const timer = useRef<number | null>(null);
  const dirty = useRef(false);
  const ignoreUnmount = useRef(false);
  const saveRef = useRef(saveNote);
  titleRef.current = title;
  saveRef.current = saveNote;

  const editor = useCreateBlockNote(
    {
      schema: noteSchema,
      initialContent: asInitialContent(note.content),
      dictionary: {
        ...en,
        placeholders: {
          ...en.placeholders,
          default: 'Write, or type / for images and tables',
        },
      },
      uploadFile: async (file: File) => {
        if (!user) throw new Error('Sign in required.');
        return uploadNoteImage(user.id, note.id, file);
      },
    },
    [],
  );

  async function persist(content: Json, nextTitle: string) {
    const serialized = JSON.stringify(content);
    const normalizedTitle = nextTitle.trim() || 'Untitled';
    if (serialized === lastSaved.current && normalizedTitle === lastTitle.current) return;
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
    } catch (error) {
      setStatus('error');
      toast.error(toErrorMessage(error, 'Could not save this note.'));
      throw error;
    }
  }

  function currentDocument(): Json {
    return editor.document as unknown as Json;
  }

  function scheduleSave() {
    if (readOnly) return;
    dirty.current = true;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void persist(currentDocument(), titleRef.current).catch(() => undefined);
    }, 900);
  }

  function linkStoredFile(file: FileRow) {
    const block = {
      type: 'storedFile' as const,
      props: { fileId: file.id, name: file.name },
    };
    const blocks = editor.document;
    let reference = blocks[blocks.length - 1];
    try {
      reference = editor.getTextCursorPosition().block;
    } catch {
      // The editor may not have a cursor yet. Append after the last block.
    }
    if (!reference) return;
    editor.insertBlocks([block], reference, 'after');
    scheduleSave();
  }

  async function flush() {
    if (timer.current) window.clearTimeout(timer.current);
    if (readOnly) return;
    await persist(currentDocument(), titleRef.current);
  }

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      if (readOnly || ignoreUnmount.current || !dirty.current) return;
      const content = editor.document as unknown as Json;
      const serialized = JSON.stringify(content);
      const normalizedTitle = titleRef.current.trim() || 'Untitled';
      if (serialized === lastSaved.current && normalizedTitle === lastTitle.current) return;
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
    function onKey(event: KeyboardEvent) {
      if (!(event.metaKey || event.ctrlKey) || event.key.toLowerCase() !== 's') return;
      event.preventDefault();
      if (readOnly) return;
      void flush()
        .then(() => checkpoint(note.id))
        .then(() => toast.success('Version saved'))
        .catch((error: unknown) => toast.error(toErrorMessage(error, 'Could not save a version.')));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [checkpoint, note.id, readOnly]);

  const tagNames = noteTags
    .filter((row) => row.note_id === note.id)
    .map((row) => tags.find((tag) => tag.id === row.tag_id)?.name)
    .filter((name): name is string => Boolean(name));

  async function exportMarkdown() {
    const body = await editor.blocksToMarkdownLossy();
    const markdown = markdownDocument(title, body);
    return markdown;
  }

  const notebookName = notebooks.find((notebook) => notebook.id === notebookId)?.name ?? 'Unfiled';
  const statusLabel =
    status === 'saving' ? 'Saving…' : status === 'saved' ? 'Saved' : status === 'error' ? 'Not saved' : null;

  return (
    <div className="flex h-full min-h-0 flex-col bg-paper">
      <div className="flex flex-wrap items-center gap-1 border-b border-border px-3 py-2">
        {onBack ? (
          <Button type="button" variant="ghost" size="sm" className="md:hidden" onClick={onBack}>
            Notes
          </Button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger className="rounded-md px-2 py-1 text-sm text-muted-foreground hover:bg-accent">
            {notebookName}
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem
              disabled={readOnly}
              onSelect={() => {
                const previous = notebookId;
                setNotebookId(null);
                void moveNote(note.id, null).catch((error: unknown) => {
                  setNotebookId(previous);
                  toast.error(toErrorMessage(error, 'Could not move the note.'));
                });
              }}
            >
              Unfiled
            </DropdownMenuItem>
            {notebooks.map((notebook) => (
              <DropdownMenuItem
                key={notebook.id}
                disabled={readOnly}
                onSelect={() => {
                  const previous = notebookId;
                  setNotebookId(notebook.id);
                  void moveNote(note.id, notebook.id).catch((error: unknown) => {
                    setNotebookId(previous);
                    toast.error(toErrorMessage(error, 'Could not move the note.'));
                  });
                }}
              >
                {notebook.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        <span className="text-xs text-muted-foreground">
          {formatExactTime(note.updated_at)}
          {statusLabel ? ` · ${statusLabel}` : ''}
        </span>
        <div className="ml-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={pinned ? 'Unpin note' : 'Pin note'}
            disabled={readOnly}
            onClick={() => {
              const next = !pinned;
              setPinnedState(next);
              void setPinned(note.id, next).catch((error: unknown) => {
                setPinnedState(!next);
                toast.error(toErrorMessage(error, 'Could not update the pin.'));
              });
            }}
          >
            {pinned ? <PinOff /> : <Pin />}
          </Button>
          <Button type="button" variant="ghost" size="icon" aria-label="Version history" onClick={() => setHistoryOpen(true)}>
            <History />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex size-9 items-center justify-center rounded-md hover:bg-accent" aria-label="Note actions">
              <MoreHorizontal className="size-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onSelect={() => {
                  void exportMarkdown()
                    .then((markdown) => {
                      downloadTextFile(markdownFilename(title), markdown);
                    })
                    .catch((error: unknown) => toast.error(toErrorMessage(error, 'Could not export Markdown.')));
                }}
              >
                <Download />
                Download Markdown
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => {
                  void exportMarkdown()
                    .then((markdown) => navigator.clipboard.writeText(markdown))
                    .then(() => toast.success('Markdown copied'))
                    .catch((error: unknown) => toast.error(toErrorMessage(error, 'Could not copy Markdown.')));
                }}
              >
                Copy Markdown
              </DropdownMenuItem>
              {readOnly ? null : (
                <DropdownMenuItem
                  onSelect={() => {
                    void setHidden(note.id, !note.is_hidden)
                      .then(onLeft)
                      .catch((error: unknown) => toast.error(toErrorMessage(error, 'Could not update that note.')));
                  }}
                >
                  <EyeOff />
                  {note.is_hidden ? 'Show in all notes' : 'Hide note'}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {readOnly ? (
                <DropdownMenuItem
                  onSelect={() => {
                    void restoreNote(note.id).then(onLeft);
                  }}
                >
                  <RotateCcw />
                  Restore from trash
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onSelect={() => setConfirmTrash(true)}>
                  <Trash2 />
                  Move to trash
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => setConfirmDelete(true)}>Delete forever</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {readOnly ? (
        <p className="bg-secondary px-4 py-2 text-sm text-muted-foreground">
          This note is in the trash. Restore it to edit.
        </p>
      ) : null}

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-3xl px-6 py-8">
          <input
            value={title}
            disabled={readOnly}
            aria-label="Note title"
            onChange={(event) => {
              setTitle(event.target.value);
              scheduleSave();
            }}
            className="w-full bg-transparent font-serif text-4xl text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-80"
            placeholder="Untitled"
          />
          <div className="mt-4 flex flex-wrap items-center gap-1.5">
            {tagNames.map((name) => (
              <button
                key={name}
                type="button"
                disabled={readOnly}
                className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground disabled:opacity-70"
                onClick={() => {
                  void setTagsForNote(
                    note.id,
                    tagNames.filter((tag) => tag !== name),
                  ).catch((error: unknown) => toast.error(toErrorMessage(error, 'Could not update tags.')));
                }}
              >
                {name}
                {readOnly ? '' : ' ×'}
              </button>
            ))}
            {readOnly ? null : (
              <>
                <input
                  value={tagDraft}
                  onChange={(event) => setTagDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ',') return;
                    event.preventDefault();
                    const name = tagDraft.trim();
                    if (!name) return;
                    setTagDraft('');
                    void setTagsForNote(note.id, [...tagNames, name]).catch((error: unknown) =>
                      toast.error(toErrorMessage(error, 'Could not add the tag.')),
                    );
                  }}
                  placeholder="Add a tag"
                  className="h-7 min-w-24 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => setFilePickerOpen(true)}>
                  <Paperclip />
                  Link file
                </Button>
              </>
            )}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            Markdown export is a copy. Saga keeps this document, including image sizes and tables.
          </p>
          <div className="saga-editor mt-4">
            <BlockNoteView
              editor={editor}
              editable={!readOnly}
              theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
              onChange={() => scheduleSave()}
            />
          </div>
        </div>
      </div>

      <VersionHistoryDialog
        noteId={note.id}
        open={historyOpen}
        readOnly={readOnly}
        onOpenChange={setHistoryOpen}
        onBeforeRestore={flush}
        onRestored={() => {
          ignoreUnmount.current = true;
          onReplaced();
        }}
      />
      <ConfirmDialog
        open={confirmTrash}
        onOpenChange={setConfirmTrash}
        title="Move this note to the trash?"
        description="You can restore it later. Versions stay with the note."
        confirmLabel="Move to trash"
        destructive
        onConfirm={() => {
          setConfirmTrash(false);
          void trashNote(note.id).then(onLeft);
        }}
      />
      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete this note forever?"
        description="The document, its versions, and its images will be removed."
        confirmLabel="Delete forever"
        destructive
        onConfirm={() => {
          setConfirmDelete(false);
          void deleteNoteForever(note.id).then(onLeft);
        }}
      />
      <FilePickerDialog open={filePickerOpen} onOpenChange={setFilePickerOpen} onSelect={linkStoredFile} />
    </div>
  );
}
