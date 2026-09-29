import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { functionsConfigured } from '@/lib/amplify/client';
import { purgeTrash } from '@/lib/amplify/notes-functions';
import { mediaPathsFromContent } from '@/lib/notes/media';
import { toErrorMessage } from '@/lib/errors';
import { removeNoteMedia } from '@/lib/supabase/noteMedia';
import {
  createNotebook as insertNotebook,
  deleteNotebook as removeNotebook,
  listNotebooks,
  renameNotebook as renameNotebookRow,
} from '@/lib/supabase/notebooks';
import {
  createNote as insertNote,
  deleteNotes,
  getNote,
  listNotes,
  listTrashedDocuments,
  updateNote,
} from '@/lib/supabase/notes';
import { checkpointNote } from '@/lib/supabase/noteVersions';
import {
  createTag,
  deleteTag as removeTag,
  listNoteTags,
  listTags,
  replaceNoteTags,
} from '@/lib/supabase/tags';
import type { Json, NotebookRow, NoteSummary, NoteTagRow, TagRow } from '@/lib/supabase/types';
import { useAuth } from '@/hooks/useAuth';

type NotesContextValue = {
  loading: boolean;
  error: string | null;
  notebooks: NotebookRow[];
  notes: NoteSummary[];
  tags: TagRow[];
  noteTags: NoteTagRow[];
  refresh: () => Promise<void>;
  createNotebook: (name: string) => Promise<NotebookRow>;
  renameNotebook: (id: string, name: string) => Promise<void>;
  deleteNotebook: (id: string) => Promise<void>;
  createNote: (notebookId: string | null) => Promise<NoteSummary>;
  saveNote: (id: string, input: { title: string; content: Json; plainText: string }) => Promise<void>;
  moveNote: (id: string, notebookId: string | null) => Promise<void>;
  setPinned: (id: string, pinned: boolean) => Promise<void>;
  trashNote: (id: string) => Promise<void>;
  restoreNote: (id: string) => Promise<void>;
  deleteNoteForever: (id: string) => Promise<void>;
  emptyTrash: () => Promise<number>;
  setTagsForNote: (noteId: string, names: string[]) => Promise<void>;
  deleteTag: (id: string) => Promise<void>;
  checkpoint: (noteId: string) => Promise<void>;
};

const NotesContext = createContext<NotesContextValue | null>(null);

function normalizeTagName(name: string): string {
  return name.trim().replace(/\s+/g, ' ');
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notebooks, setNotebooks] = useState<NotebookRow[]>([]);
  const [notes, setNotes] = useState<NoteSummary[]>([]);
  const [tags, setTags] = useState<TagRow[]>([]);
  const [noteTags, setNoteTags] = useState<NoteTagRow[]>([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    const [nextNotebooks, nextNotes, nextTags, nextNoteTags] = await Promise.all([
      listNotebooks(),
      listNotes(),
      listTags(),
      listNoteTags(),
    ]);
    setNotebooks(nextNotebooks);
    setNotes(nextNotes);
    setTags(nextTags);
    setNoteTags(nextNoteTags);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setNotebooks([]);
      setNotes([]);
      setTags([]);
      setNoteTags([]);
      setError(null);
      setLoading(false);
      return;
    }

    let active = true;
    setLoading(true);
    void (async () => {
      try {
        let nextNotebooks = await listNotebooks();
        if (nextNotebooks.length === 0) {
          const inbox = await insertNotebook(user.id, 'Inbox');
          nextNotebooks = [inbox];
        }
        const [nextNotes, nextTags, nextNoteTags] = await Promise.all([
          listNotes(),
          listTags(),
          listNoteTags(),
        ]);
        if (!active) return;
        setNotebooks(nextNotebooks);
        setNotes(nextNotes);
        setTags(nextTags);
        setNoteTags(nextNoteTags);
        setError(null);
      } catch (loadError) {
        if (!active) return;
        setError(toErrorMessage(loadError, 'Could not load notes.'));
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [user]);

  const value = useMemo<NotesContextValue>(() => {
    return {
      loading,
      error,
      notebooks,
      notes,
      tags,
      noteTags,
      refresh,
      async createNotebook(name) {
        if (!user) throw new Error('Sign in required.');
        const notebook = await insertNotebook(user.id, name);
        setNotebooks((current) => [...current, notebook]);
        return notebook;
      },
      async renameNotebook(id, name) {
        const notebook = await renameNotebookRow(id, name);
        setNotebooks((current) => current.map((item) => (item.id === id ? notebook : item)));
      },
      async deleteNotebook(id) {
        await removeNotebook(id);
        setNotebooks((current) => current.filter((item) => item.id !== id));
        setNotes((current) =>
          current.map((note) => (note.notebook_id === id ? { ...note, notebook_id: null } : note)),
        );
      },
      async createNote(notebookId) {
        if (!user) throw new Error('Sign in required.');
        let target = notebookId;
        if (!target) {
          const inbox = notebooks[0];
          if (!inbox) {
            const created = await insertNotebook(user.id, 'Inbox');
            setNotebooks((current) => [...current, created]);
            target = created.id;
          } else {
            target = inbox.id;
          }
        }
        const note = await insertNote({ userId: user.id, notebookId: target });
        setNotes((current) => [note, ...current]);
        return note;
      },
      async saveNote(id, input) {
        const updated = await updateNote(id, {
          title: input.title,
          content: input.content,
          plainText: input.plainText,
        });
        setNotes((current) => current.map((note) => (note.id === id ? updated : note)));
      },
      async moveNote(id, notebookId) {
        const updated = await updateNote(id, { notebookId });
        setNotes((current) => current.map((note) => (note.id === id ? updated : note)));
      },
      async setPinned(id, pinned) {
        const updated = await updateNote(id, { isPinned: pinned });
        setNotes((current) => current.map((note) => (note.id === id ? updated : note)));
      },
      async trashNote(id) {
        const updated = await updateNote(id, { trashedAt: new Date().toISOString() });
        setNotes((current) => current.map((note) => (note.id === id ? updated : note)));
      },
      async restoreNote(id) {
        const updated = await updateNote(id, { trashedAt: null });
        setNotes((current) => current.map((note) => (note.id === id ? updated : note)));
      },
      async deleteNoteForever(id) {
        const note = await getNote(id);
        await deleteNotes([id]);
        setNotes((current) => current.filter((item) => item.id !== id));
        setNoteTags((current) => current.filter((item) => item.note_id !== id));
        try {
          await removeNoteMedia(mediaPathsFromContent(note.content));
        } catch {
          // The note row is already gone. Leftover images can be removed later.
        }
      },
      async emptyTrash() {
        const trashed = await listTrashedDocuments();
        const ids = trashed.map((note) => note.id);
        const paths = trashed.flatMap((note) => mediaPathsFromContent(note.content));
        if (functionsConfigured()) {
          const result = await purgeTrash();
          setNotes((current) => current.filter((note) => note.trashed_at === null));
          setNoteTags((current) => current.filter((item) => !ids.includes(item.note_id)));
          return result.deleted;
        }
        await deleteNotes(ids);
        setNotes((current) => current.filter((note) => note.trashed_at === null));
        setNoteTags((current) => current.filter((item) => !ids.includes(item.note_id)));
        try {
          await removeNoteMedia(paths);
        } catch {
          // Rows are deleted. Storage cleanup is best-effort when the function URL is absent.
        }
        return ids.length;
      },
      async setTagsForNote(noteId, names) {
        if (!user) throw new Error('Sign in required.');
        const wanted = [...new Set(names.map(normalizeTagName).filter(Boolean))];
        const resolved: TagRow[] = [];
        let tagList = tags;
        for (const name of wanted) {
          const existing = tagList.find((tag) => tag.name.toLowerCase() === name.toLowerCase());
          if (existing) {
            resolved.push(existing);
            continue;
          }
          const created = await createTag(user.id, name);
          tagList = [...tagList, created];
          resolved.push(created);
        }
        await replaceNoteTags(
          user.id,
          noteId,
          resolved.map((tag) => tag.id),
        );
        setTags(tagList);
        setNoteTags((current) => [
          ...current.filter((row) => row.note_id !== noteId),
          ...resolved.map((tag) => ({ note_id: noteId, tag_id: tag.id, user_id: user.id })),
        ]);
      },
      async deleteTag(id) {
        await removeTag(id);
        setTags((current) => current.filter((tag) => tag.id !== id));
        setNoteTags((current) => current.filter((row) => row.tag_id !== id));
      },
      async checkpoint(noteId) {
        await checkpointNote(noteId);
      },
    };
  }, [error, loading, noteTags, notebooks, notes, refresh, tags, user]);

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes() {
  const value = useContext(NotesContext);
  if (!value) throw new Error('useNotes must be used within NotesProvider');
  return value;
}
