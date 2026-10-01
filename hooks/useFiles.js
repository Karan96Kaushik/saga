import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, } from 'react';
import { toErrorMessage } from '@/lib/errors';
import { deleteLibraryFile, getFile, listFiles, openLibraryFile, uploadLibraryFile } from '@/lib/supabase/files';
import { useAuth } from '@/hooks/useAuth';
const FilesContext = createContext(null);
export function FilesProvider({ children }) {
    const { user } = useAuth();
    const [files, setFiles] = useState([]);
    const [ready, setReady] = useState(false);
    const [error, setError] = useState(null);
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
            if (!active)
                return;
            setFiles(rows);
            setError(null);
        })
            .catch((loadError) => {
            if (!active)
                return;
            setError(toErrorMessage(loadError, 'Could not load files.'));
        })
            .finally(() => {
            if (active)
                setReady(true);
        });
        return () => {
            active = false;
        };
    }, [user]);
    const upload = useCallback(async (file) => {
        if (!user)
            throw new Error('Sign in required.');
        const row = await uploadLibraryFile(user.id, file);
        setFiles((current) => [row, ...current.filter((item) => item.id !== row.id)]);
        return row;
    }, [user]);
    const remove = useCallback(async (id) => {
        await deleteLibraryFile(id);
        setFiles((current) => current.filter((file) => file.id !== id));
    }, []);
    const download = useCallback(async (id) => {
        const known = files.find((file) => file.id === id) ?? (await getFile(id));
        if (!known)
            throw new Error('That file has been deleted.');
        await openLibraryFile(known);
    }, [files]);
    const value = useMemo(() => ({ files, ready, error, upload, remove, download }), [download, error, files, ready, remove, upload]);
    return _jsx(FilesContext.Provider, { value: value, children: children });
}
export function useFiles() {
    const value = useContext(FilesContext);
    if (!value)
        throw new Error('useFiles must be used within FilesProvider');
    return value;
}
