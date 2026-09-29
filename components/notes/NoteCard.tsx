import { Pin } from 'lucide-react';
import { snippet } from '@/lib/notes/selectNotes';
import { formatNoteTime } from '@/lib/notes/time';
import type { NoteSummary } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

export function NoteCard({
  note,
  notebookName,
  selected,
  onSelect,
}: {
  note: NoteSummary;
  notebookName?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const preview = snippet(note.plain_text);
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? 'true' : undefined}
      className={cn(
        'w-full rounded-xl px-3 py-2.5 text-left transition-colors',
        selected ? 'bg-paper shadow-sm ring-1 ring-border' : 'hover:bg-black/5 dark:hover:bg-white/5',
      )}
    >
      <span className="flex items-start justify-between gap-3">
        <span className={cn('truncate font-medium', note.title ? '' : 'italic text-muted-foreground')}>
          {note.title || 'Untitled'}
        </span>
        {note.is_pinned ? <Pin className="mt-1 size-3.5 shrink-0 text-gold" aria-label="Pinned" /> : null}
      </span>
      {preview ? <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{preview}</span> : null}
      <span className="mt-2 block text-xs text-muted-foreground">
        {formatNoteTime(note.updated_at)}
        {notebookName ? ` · ${notebookName}` : ''}
      </span>
    </button>
  );
}
