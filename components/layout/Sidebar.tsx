import { Hash, Inbox, Notebook, Paperclip, Plus, Trash2 } from 'lucide-react';
import { useRef, useState, type FormEvent } from 'react';
import { NavLink, useLocation } from 'react-router';
import { toast } from 'sonner';
import { Logo } from '@/components/layout/Logo';
import { CountStat } from '@/components/metrics/CountStat';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { useFiles } from '@/hooks/useFiles';
import { useNotes } from '@/hooks/useNotes';
import { toErrorMessage } from '@/lib/errors';
import type { NotebookRow, TagRow } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

function navClass(active: boolean) {
  return cn(
    'flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm',
    active ? 'bg-white/10 text-white' : 'text-sidebar-foreground/75 hover:bg-white/5 hover:text-sidebar-foreground',
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { user, profile } = useAuth();
  const {
    notebooks,
    notes,
    tags,
    noteTags,
    createNotebook,
    renameNotebook,
    deleteNotebook,
    deleteTag,
  } = useNotes();
  const { files } = useFiles();
  const { pathname } = useLocation();
  const skipRename = useRef(false);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState('');
  const [renaming, setRenaming] = useState<NotebookRow | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const [notebookToDelete, setNotebookToDelete] = useState<NotebookRow | null>(null);
  const [tagToDelete, setTagToDelete] = useState<TagRow | null>(null);

  const activeNotes = notes.filter((note) => note.trashed_at === null && !note.is_hidden);
  const unfiled = activeNotes.filter((note) => note.notebook_id === null).length;
  const trash = notes.filter((note) => note.trashed_at !== null && !note.is_hidden).length;
  const displayName = profile?.display_name || user?.email?.split('@')[0] || 'You';

  async function onCreateNotebook(event: FormEvent) {
    event.preventDefault();
    const name = draft.trim();
    if (!name) return;
    try {
      await createNotebook(name);
      setDraft('');
      setCreating(false);
    } catch (error) {
      toast.error(toErrorMessage(error, 'Could not create the notebook.'));
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col px-3 py-4">
      <div className="px-2">
        <Logo />
        <CountStat className="mt-5 text-sidebar-foreground" label="Notes" value={activeNotes.length} />
      </div>

      <nav className="mt-6 space-y-1" aria-label="Notes">
        <NavLink to="/" end className={({ isActive }) => navClass(isActive)} onClick={onNavigate}>
          <Inbox className="size-4" />
          All notes
        </NavLink>
        {unfiled > 0 ? (
          <NavLink to="/unfiled" className={({ isActive }) => navClass(isActive)} onClick={onNavigate}>
            <Notebook className="size-4" />
            Unfiled
            <span className="ml-auto text-xs text-sidebar-foreground/60">{unfiled}</span>
          </NavLink>
        ) : null}
        <NavLink to="/files" className={({ isActive }) => navClass(isActive)} onClick={onNavigate}>
          <Paperclip className="size-4" />
          Files
          {files.length > 0 ? <span className="ml-auto text-xs text-sidebar-foreground/60">{files.length}</span> : null}
        </NavLink>
        <NavLink to="/trash" className={({ isActive }) => navClass(isActive)} onClick={onNavigate}>
          <Trash2 className="size-4" />
          Trash
          {trash > 0 ? <span className="ml-auto text-xs text-sidebar-foreground/60">{trash}</span> : null}
        </NavLink>
      </nav>

      <div className="mt-6 flex items-center justify-between px-2.5 text-xs font-medium tracking-wide text-sidebar-foreground/55">
        Notebooks
        <button
          type="button"
          className="rounded-md p-1 hover:bg-white/10 hover:text-sidebar-foreground"
          aria-label="New notebook"
          onClick={() => {
            setCreating(true);
            setDraft('');
          }}
        >
          <Plus className="size-3.5" />
        </button>
      </div>
      <div className="mt-1 min-h-0 flex-1 space-y-0.5 overflow-y-auto pr-1">
        {notebooks.map((notebook) => {
          const count = activeNotes.filter((note) => note.notebook_id === notebook.id).length;
          const active = pathname === `/notebooks/${notebook.id}`;
          if (renaming?.id === notebook.id) {
            return (
              <form
                key={notebook.id}
                onSubmit={(event) => {
                  event.preventDefault();
                  const field = event.currentTarget.elements[0];
                  if (field instanceof HTMLInputElement) field.blur();
                }}
              >
                <input
                  autoFocus
                  value={renameDraft}
                  onChange={(event) => setRenameDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                      skipRename.current = true;
                      setRenaming(null);
                    }
                  }}
                  onBlur={() => {
                    if (skipRename.current) {
                      skipRename.current = false;
                      setRenaming(null);
                      return;
                    }
                    const name = renameDraft.trim();
                    setRenaming(null);
                    if (!name || name === notebook.name) return;
                    void renameNotebook(notebook.id, name).catch((error: unknown) => {
                      toast.error(toErrorMessage(error, 'Could not rename the notebook.'));
                    });
                  }}
                  className="w-full rounded-lg bg-white/10 px-2.5 py-1.5 text-sm text-sidebar-foreground outline-none"
                />
              </form>
            );
          }
          return (
            <div key={notebook.id} className="group flex items-center">
              <NavLink
                to={`/notebooks/${notebook.id}`}
                className={cn(navClass(active), 'min-w-0 flex-1')}
                onClick={onNavigate}
              >
                <Notebook className="size-4 shrink-0" />
                <span className="truncate">{notebook.name}</span>
                <span className="ml-auto text-xs text-sidebar-foreground/50 group-hover:hidden">{count}</span>
              </NavLink>
              <DropdownMenu>
                <DropdownMenuTrigger className="rounded-md p-1 text-sidebar-foreground/70 opacity-0 hover:bg-white/10 group-hover:opacity-100 focus:opacity-100">
                  <span className="sr-only">Notebook actions</span>
                  <span aria-hidden="true">···</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onSelect={() => {
                      setRenaming(notebook);
                      setRenameDraft(notebook.name);
                    }}
                  >
                    Rename
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => setNotebookToDelete(notebook)}>
                    Delete notebook
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        })}
        {creating ? (
          <form onSubmit={(event) => void onCreateNotebook(event)}>
            <input
              autoFocus
              value={draft}
              placeholder="Notebook name"
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => {
                if (!draft.trim()) setCreating(false);
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setCreating(false);
              }}
              className="w-full rounded-lg bg-white/10 px-2.5 py-1.5 text-sm text-sidebar-foreground outline-none placeholder:text-sidebar-foreground/40"
            />
          </form>
        ) : null}

        <div className="mt-5 px-2.5 text-xs font-medium tracking-wide text-sidebar-foreground/55">Tags</div>
        {tags.length === 0 ? (
          <p className="px-2.5 py-1.5 text-sm text-sidebar-foreground/45">Tags appear when you add them to a note.</p>
        ) : (
          tags.map((tag) => {
            const count = noteTags.filter((row) => row.tag_id === tag.id).length;
            return (
              <div key={tag.id} className="group flex items-center">
                <NavLink
                  to={`/tags/${tag.id}`}
                  className={({ isActive }) => cn(navClass(isActive), 'min-w-0 flex-1')}
                  onClick={onNavigate}
                >
                  <Hash className="size-4 shrink-0" />
                  <span className="truncate">{tag.name}</span>
                  <span className="ml-auto text-xs text-sidebar-foreground/50 group-hover:hidden">{count}</span>
                </NavLink>
                <button
                  type="button"
                  className="rounded-md p-1 text-sidebar-foreground/70 opacity-0 hover:bg-white/10 group-hover:opacity-100"
                  aria-label={`Delete tag ${tag.name}`}
                  onClick={() => setTagToDelete(tag)}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      <NavLink
        to="/settings"
        onClick={onNavigate}
        className="mt-3 truncate rounded-lg px-2.5 py-2 text-sm text-sidebar-foreground/80 hover:bg-white/5"
      >
        <span className="block truncate font-medium text-sidebar-foreground">{displayName}</span>
        <span className="block truncate text-xs text-sidebar-foreground/55">{user?.email}</span>
      </NavLink>

      <ConfirmDialog
        open={notebookToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setNotebookToDelete(null);
        }}
        title="Delete notebook?"
        description={
          notebookToDelete
            ? `"${notebookToDelete.name}" will be removed. Notes inside it stay in your library as unfiled.`
            : ''
        }
        confirmLabel="Delete notebook"
        destructive
        onConfirm={() => {
          if (!notebookToDelete) return;
          const notebook = notebookToDelete;
          setNotebookToDelete(null);
          void deleteNotebook(notebook.id).catch((error) => {
            toast.error(toErrorMessage(error, 'Could not delete the notebook.'));
          });
        }}
      />
      <ConfirmDialog
        open={tagToDelete !== null}
        onOpenChange={(open) => {
          if (!open) setTagToDelete(null);
        }}
        title="Delete tag?"
        description={tagToDelete ? `"${tagToDelete.name}" will be removed from every note.` : ''}
        confirmLabel="Delete tag"
        destructive
        onConfirm={() => {
          if (!tagToDelete) return;
          const tag = tagToDelete;
          setTagToDelete(null);
          void deleteTag(tag.id).catch((error) => {
            toast.error(toErrorMessage(error, 'Could not delete the tag.'));
          });
        }}
      />
    </div>
  );
}
