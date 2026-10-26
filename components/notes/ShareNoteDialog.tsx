import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { toErrorMessage } from '@/lib/errors';
import { createNoteShare, revokeNoteShare } from '@/lib/supabase/shares';

export function ShareNoteDialog({
  noteId,
  shareId,
  open,
  onOpenChange,
  onShareId,
  onBeforeRevoke,
}: {
  noteId: string;
  shareId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShareId: (shareId: string | null) => void;
  onBeforeRevoke: () => Promise<void>;
}) {
  const { user } = useAuth();
  const [pending, setPending] = useState(false);
  const link = shareId ? `${window.location.origin}/s/${shareId}` : '';

  async function onCreate() {
    if (!user) return;
    setPending(true);
    try {
      const id = await createNoteShare(user.id, noteId);
      onShareId(id);
    } catch (error) {
      toast.error(toErrorMessage(error, 'Could not create a share link.'));
    } finally {
      setPending(false);
    }
  }

  async function onRevoke() {
    setPending(true);
    try {
      await onBeforeRevoke();
      await revokeNoteShare(noteId);
      onShareId(null);
    } catch (error) {
      toast.error(toErrorMessage(error, 'Could not stop sharing.'));
    } finally {
      setPending(false);
    }
  }

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(link);
      toast.success('Link copied');
    } catch (error) {
      toast.error(toErrorMessage(error, 'Could not copy the link.'));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share note</DialogTitle>
          <DialogDescription>
            Anyone with the link can read this note. Signed-in people can edit, and open copies stay in sync.
          </DialogDescription>
        </DialogHeader>
        {shareId ? (
          <div className="space-y-3">
            <input
              readOnly
              value={link}
              aria-label="Share link"
              className="h-9 w-full rounded-md border border-border bg-paper px-3 text-sm"
              onFocus={(event) => event.currentTarget.select()}
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" disabled={pending} onClick={() => void onRevoke()}>
                Stop sharing
              </Button>
              <Button type="button" disabled={pending} onClick={() => void onCopy()}>
                Copy link
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex justify-end">
            <Button type="button" disabled={pending || !user} onClick={() => void onCreate()}>
              {pending ? 'Creating…' : 'Create link'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
