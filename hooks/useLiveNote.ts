import { useEffect, useRef } from 'react';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Json } from '@/lib/supabase/types';
import { isUuid } from '@/lib/notes/ids';
import { supabase } from '@/utils/supabase';

export type LiveDocument = {
  title: string;
  content: Json;
  updatedAt: string;
};

type Handlers = {
  onDocument: (update: LiveDocument) => void;
  onSharePing: () => void;
  onRevoked: () => void;
};

export function useLiveNote(options: {
  noteId: string | null;
  shareId: string | null;
  listenToDatabase: boolean;
  handlers: Handlers;
}) {
  const handlersRef = useRef(options.handlers);
  const shareIdRef = useRef(options.shareId);
  const channelRef = useRef<RealtimeChannel | null>(null);
  handlersRef.current = options.handlers;
  shareIdRef.current = options.shareId;

  useEffect(() => {
    const noteId = options.noteId;
    const shareId = options.shareId;
    const listenToDatabase = options.listenToDatabase && noteId !== null && isUuid(noteId);
    const listenToShare = shareId !== null && isUuid(shareId);
    if (!listenToDatabase && !listenToShare) return;

    const topic = listenToShare ? `saga-share:${shareId}` : `saga-note:${noteId}`;
    const channel = supabase.channel(topic, {
      config: { broadcast: { self: false } },
    });

    if (listenToShare && shareId) {
      channel.on('broadcast', { event: 'note' }, ({ payload }) => {
        const body = payload as { revoked?: boolean };
        if (body?.revoked) {
          handlersRef.current.onRevoked();
          return;
        }
        handlersRef.current.onSharePing();
      });
    }

    if (listenToDatabase && noteId) {
      channel.on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'notes', filter: `id=eq.${noteId}` },
        (payload) => {
          const row = payload.new as { title?: unknown; content?: unknown; updated_at?: unknown };
          if (typeof row.title !== 'string' || typeof row.updated_at !== 'string' || !isDocument(row.content)) return;
          handlersRef.current.onDocument({ title: row.title, content: row.content, updatedAt: row.updated_at });
        },
      );
    }

    channel.subscribe();
    channelRef.current = channel;
    return () => {
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [options.listenToDatabase, options.noteId, options.shareId]);

  return {
    async publish(event: { updatedAt?: string; revoked?: boolean }) {
      const channel = channelRef.current;
      if (!channel || !shareIdRef.current) return;
      await channel.send({ type: 'broadcast', event: 'note', payload: event });
    },
  };
}

function isDocument(value: unknown): value is Json {
  return Array.isArray(value);
}
