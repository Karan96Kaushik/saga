import { en } from '@blocknote/core/locales';
import { useCreateBlockNote } from '@blocknote/react';
import { BlockNoteView } from '@blocknote/shadcn';
import '@blocknote/core/fonts/inter.css';
import '@blocknote/shadcn/style.css';
import { Paperclip } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { toast } from 'sonner';
import { FilePickerDialog } from '@/components/files/FilePickerDialog';
import { EditorBoundary } from '@/components/notes/EditorBoundary';
import { noteSchema } from '@/components/notes/noteSchema';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useLiveNote } from '@/hooks/useLiveNote';
import { toErrorMessage } from '@/lib/errors';
import { isUuid } from '@/lib/notes/ids';
import { canonicalJson, isOwnEditor, shouldApplyRemote } from '@/lib/notes/liveNote';
import { blocksToPlainText } from '@/lib/notes/plainText';
import { uploadNoteImage } from '@/lib/supabase/noteMedia';
import { getSharedNote, saveSharedNote } from '@/lib/supabase/shares';
import type { FileRow, Json, SharedNote } from '@/lib/supabase/types';

function asInitialContent(content: Json) {
  if (!Array.isArray(content) || content.length === 0) return undefined;
  return content as never;
}

export function SharedNoteView() {
  const { shareId = '' } = useParams();
  const { user } = useAuth();
  const [note, setNote] = useState<SharedNote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const valid = isUuid(shareId);

  useEffect(() => {
    if (!valid) return;
    let active = true;
    setNote(null);
    setError(null);
    void getSharedNote(shareId)
      .then((row) => {
        if (!active) return;
        if (!row) setError('This link is not active.');
        else setNote(row);
      })
      .catch((loadError: unknown) => {
        if (active) setError(toErrorMessage(loadError, 'Could not open this note.'));
      });
    return () => {
      active = false;
    };
  }, [shareId, valid]);

  if (!valid) {
    return <SharedShell shareId={null} canEdit={false} message="This link is not active." />;
  }
  if (error) return <SharedShell shareId={shareId} canEdit={false} message={error} />;
  if (!note) return <SharedShell shareId={shareId} canEdit={false} message="Opening note…" />;

  return (
    <SharedShell shareId={shareId} canEdit={Boolean(user)}>
      <EditorBoundary resetKey={note.note_id + note.updated_at}>
        <SharedSurface shareId={shareId} note={note} canEdit={Boolean(user)} />
      </EditorBoundary>
    </SharedShell>
  );
}

function SharedShell({
  shareId,
  canEdit,
  message,
  children,
}: {
  shareId: string | null;
  canEdit: boolean;
  message?: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex h-dvh flex-col bg-background text-foreground">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <Link to="/" className="text-foreground">
          <Logo className="text-foreground" />
        </Link>
        <div className="ml-auto text-sm">
          {canEdit ? (
            <span className="text-muted-foreground">Editing</span>
          ) : shareId ? (
            <Link className="text-primary underline-offset-4 hover:underline" to="/login" state={{ from: `/s/${shareId}` }}>
              Sign in to edit
            </Link>
          ) : null}
        </div>
      </header>
      {message ? (
        <div className="grid flex-1 place-items-center px-6 text-sm text-muted-foreground">{message}</div>
      ) : (
        children
      )}
    </div>
  );
}

function SharedSurface({ shareId, note, canEdit }: { shareId: string; note: SharedNote; canEdit: boolean }) {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [title, setTitle] = useState(note.title || 'Untitled');
  const [filePickerOpen, setFilePickerOpen] = useState(false);
  const [revoked, setRevoked] = useState(false);
  const titleRef = useRef(title);
  const userRef = useRef(user);
  const lastSaved = useRef(JSON.stringify(note.content));
  const lastTitle = useRef(note.title || 'Untitled');
  const dirty = useRef(false);
  const editorId = useRef(crypto.randomUUID());
  const timer = useRef<number | null>(null);
  titleRef.current = title;
  userRef.current = user;

  const editor = useCreateBlockNote(
    {
      schema: noteSchema,
      initialContent: asInitialContent(note.content),
      dictionary: {
        ...en,
        placeholders: { ...en.placeholders, default: 'Write, or type / for images and tables' },
      },
      uploadFile: async (file: File) => {
        const current = userRef.current;
        if (!current) throw new Error('Sign in required.');
        return uploadNoteImage(current.id, note.note_id, file);
      },
    },
    [],
  );

  function applyRemote(nextTitle: string, content: Json, remoteEditorId?: string | null) {
    if (isOwnEditor(remoteEditorId, editorId.current)) return;
    const remoteContent = JSON.stringify(content);
    const remoteTitle = nextTitle.trim() || 'Untitled';
    if (
      !shouldApplyRemote({
        readOnly: !canEdit,
        dirty: dirty.current,
        localTitle: titleRef.current.trim() || 'Untitled',
        localContent: JSON.stringify(editor.document),
        remoteTitle,
        remoteContent,
      })
    ) {
      return;
    }
    if (Array.isArray(content) && content.length > 0) {
      editor.replaceBlocks(editor.document, content as never);
    }
    setTitle(remoteTitle);
    titleRef.current = remoteTitle;
    lastSaved.current = remoteContent;
    lastTitle.current = remoteTitle;
    dirty.current = false;
  }

  async function refresh() {
    const row = await getSharedNote(shareId);
    if (!row) {
      setRevoked(true);
      return;
    }
    applyRemote(row.title, row.content, row.editor_id);
  }

  const { publish } = useLiveNote({
    noteId: note.note_id,
    shareId,
    listenToDatabase: note.is_owner,
    handlers: {
      onDocument: (update) => applyRemote(update.title, update.content, update.editorId),
      onSharePing: () => {
        void refresh().catch(() => undefined);
      },
      onRevoked: () => setRevoked(true),
    },
  });

  async function persist(content: Json, nextTitle: string) {
    const serialized = JSON.stringify(content);
    const normalizedTitle = nextTitle.trim() || 'Untitled';
    if (serialized === lastSaved.current && normalizedTitle === lastTitle.current) return;
    const updatedAt = await saveSharedNote({
      shareId,
      title: normalizedTitle,
      content,
      plainText: blocksToPlainText(content),
      editorId: editorId.current,
    });
    lastSaved.current = serialized;
    lastTitle.current = normalizedTitle;
    const liveTitle = titleRef.current.trim() || 'Untitled';
    const liveContent = JSON.stringify(editor.document);
    dirty.current = canonicalJson(liveContent) !== canonicalJson(serialized) || liveTitle !== normalizedTitle;
    void publish({ updatedAt });
  }

  function scheduleSave() {
    if (!canEdit) return;
    dirty.current = true;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      void persist(editor.document as unknown as Json, titleRef.current).catch((error: unknown) => {
        toast.error(toErrorMessage(error, 'Could not save this note.'));
      });
    }, 900);
  }

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

  function linkStoredFile(file: FileRow) {
    const block = { type: 'storedFile' as const, props: { fileId: file.id, name: file.name } };
    const blocks = editor.document;
    let reference = blocks[blocks.length - 1];
    try {
      reference = editor.getTextCursorPosition().block;
    } catch {
      // The editor may not have a cursor yet.
    }
    if (!reference) return;
    editor.insertBlocks([block], reference, 'after');
    scheduleSave();
  }

  if (revoked) {
    return <p className="px-6 py-16 text-center text-sm text-muted-foreground">This link is not active.</p>;
  }

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto w-full max-w-3xl px-6 py-8">
        {!canEdit ? (
          <p className="mb-6 text-sm text-muted-foreground">You can read this note. Sign in to edit it with the other people who have the link.</p>
        ) : null}
        <input
          value={title}
          disabled={!canEdit}
          aria-label="Note title"
          onChange={(event) => {
            setTitle(event.target.value);
            scheduleSave();
          }}
          className="w-full bg-transparent font-serif text-4xl text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-80"
          placeholder="Untitled"
        />
        {canEdit ? (
          <div className="mt-4">
            <Button type="button" variant="ghost" size="sm" onClick={() => setFilePickerOpen(true)}>
              <Paperclip />
              Link file
            </Button>
          </div>
        ) : null}
        <div className="saga-editor mt-4">
          <BlockNoteView
            editor={editor}
            editable={canEdit}
            theme={resolvedTheme === 'dark' ? 'dark' : 'light'}
            onChange={() => scheduleSave()}
          />
        </div>
      </div>
      <FilePickerDialog open={filePickerOpen} onOpenChange={setFilePickerOpen} onSelect={linkStoredFile} />
    </div>
  );
}
