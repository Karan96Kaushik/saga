import { Analytics } from '@vercel/analytics/react';
import { ThemeProvider } from 'next-themes';
import { Navigate, Route, Routes } from 'react-router';
import { LoginView } from '@/components/auth/LoginView';
import { RequireAuth } from '@/components/auth/RequireAuth';
import { ResetPasswordView } from '@/components/auth/ResetPasswordView';
import { SignedInOnly } from '@/components/auth/SignedInOnly';
import { FilesView } from '@/components/files/FilesView';
import { AppShell } from '@/components/layout/AppShell';
import { NotesView } from '@/components/notes/NotesView';
import { SettingsView } from '@/components/settings/SettingsView';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AuthProvider } from '@/hooks/useAuth';
import { FilesProvider } from '@/hooks/useFiles';
import { NotesProvider } from '@/hooks/useNotes';

export function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false} storageKey="saga-theme">
      <TooltipProvider>
        <AuthProvider>
          <FilesProvider>
            <NotesProvider>
              <Routes>
                <Route path="/login" element={<LoginView />} />
                <Route path="/reset-password" element={<ResetPasswordView />} />
                <Route element={<RequireAuth />}>
                  <Route element={<AppShell />}>
                    <Route index element={<NotesView />} />
                    <Route path="notebooks/:notebookId" element={<NotesView />} />
                    <Route path="tags/:tagId" element={<NotesView />} />
                    <Route path="unfiled" element={<NotesView />} />
                    <Route path="trash" element={<NotesView />} />
                    <Route path="files" element={<FilesView />} />
                    <Route element={<SignedInOnly />}>
                      <Route path="settings" element={<SettingsView />} />
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Route>
              </Routes>
              <Toaster position="bottom-center" />
              {import.meta.env.PROD ? <Analytics /> : null}
            </NotesProvider>
          </FilesProvider>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  );
}
