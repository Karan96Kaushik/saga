import type { NoteSummary, NoteTagRow } from '@/lib/supabase/types';

export type NoteFilter =
  | { kind: 'all' }
  | { kind: 'trash' }
  | { kind: 'unfiled' }
  | { kind: 'notebook'; notebookId: string }
  | { kind: 'tag'; tagId: string };

function byRecency(a: NoteSummary, b: NoteSummary): number {
  if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
  if (a.updated_at === b.updated_at) return a.title.localeCompare(b.title);
  return a.updated_at < b.updated_at ? 1 : -1;
}

export function selectNotes(
  notes: NoteSummary[],
  noteTags: NoteTagRow[],
  filter: NoteFilter,
  query: string,
): NoteSummary[] {
  const needle = query.trim().toLowerCase();
  const taggedIds =
    filter.kind === 'tag'
      ? new Set(noteTags.filter((row) => row.tag_id === filter.tagId).map((row) => row.note_id))
      : null;

  return notes
    .filter((note) => {
      const inTrash = note.trashed_at !== null;
      if (filter.kind === 'trash') {
        if (!inTrash) return false;
      } else if (inTrash) {
        return false;
      }

      if (filter.kind === 'notebook' && note.notebook_id !== filter.notebookId) return false;
      if (filter.kind === 'unfiled' && note.notebook_id !== null) return false;
      if (taggedIds && !taggedIds.has(note.id)) return false;
      if (!needle) return true;
      return `${note.title}\n${note.plain_text}`.toLowerCase().includes(needle);
    })
    .sort(byRecency);
}

export function snippet(plainText: string, length = 140): string {
  const compact = plainText.replace(/\s+/g, ' ').trim();
  if (compact.length <= length) return compact;
  return `${compact.slice(0, length).trimEnd()}…`;
}
