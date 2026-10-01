import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { toErrorMessage } from '@/lib/errors';
import { deleteLibraryFile, getFile, listFiles, openLibraryFile, uploadLibraryFile } from '@/lib/supabase/files';
import type { FileRow } from '@/lib/supabase/types';
import { useAuth } from '@/hooks/useAuth';

type FilesContextValue = {
  files: FileRow[];
  ready: boolean;
  error: string | null;
  upload: (file: File) => Promise<FileRow>;
  remove: (id: string) => Promise<void>;
  download: (id: string) => Promise<void>;
};

const FilesContext = createContext<FilesContextValue | null>(null);

export function FilesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [files, setFiles] = useState<FileRow[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setFiles([]);
      setReady(false);
      setError(null);
      return;
    }
    let active = true;
    setReady(false);
    void listFiles()
      .then((rows) => {
        if (!active) return;
        setFiles(rows);
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        setError(toErrorMessage(loadError, 'Could not load files.'));
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, [user]);

  const upload = useCallback(
    async (file: File) => {
      if (!user) throw new Error('Sign in required.');
      const row = await uploadLibraryFile(user.id, file);
      setFiles((current) => [row, ...current.filter((item) => item.id !== row.id)]);
      return row;
    },
    [user],
  );

  const remove = useCallback(async (id: string) => {
    await deleteLibraryFile(id);
    setFiles((current) => current.filter((file) => file.id !== id));
  }, []);

  const download = useCallback(
    async (id: string) => {
      const known = files.find((file) => file.id === id) ?? (await getFile(id));
      if (!known) throw new Error('That file has been deleted.');
      await openLibraryFile(known);
    },
    [files],
  );

  const value = useMemo<FilesContextValue>(
    () => ({ files, ready, error, upload, remove, download }),
    [download, error, files, ready, remove, upload],
  );

  return <FilesContext.Provider value={value}>{children}</FilesContext.Provider>;
}

export function useFiles() {
  const value = useContext(FilesContext);
  if (!value) throw new Error('useFiles must be used within FilesProvider');
  return value;
}
