import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toErrorMessage } from '@/lib/errors';

const nameSchema = z.object({
  displayName: z.string().trim().min(1, 'Enter a name.').max(80, 'Keep the name under 80 characters.'),
});

const passwordSchema = z.object({
  password: z.string().min(8, 'Use at least 8 characters.'),
});

type NameValues = z.infer<typeof nameSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export function SettingsView() {
  const { user, profile, updateDisplayName, updatePassword, signOut } = useAuth();
  const nameForm = useForm<NameValues>({
    resolver: zodResolver(nameSchema),
    values: { displayName: profile?.display_name ?? '' },
  });
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  });

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-lg flex-col gap-10 px-6 py-10">
        <section>
          <h2 className="font-serif text-2xl">Account</h2>
          <p className="mt-1 text-sm text-muted-foreground">{user?.email}</p>
          <form
            className="mt-5 space-y-3"
            onSubmit={nameForm.handleSubmit(async (values) => {
              try {
                await updateDisplayName(values.displayName);
                toast.success('Name saved');
              } catch (error) {
                toast.error(toErrorMessage(error, 'Could not save your name.'));
              }
            })}
          >
            <div className="space-y-1.5">
              <Label htmlFor="displayName">Display name</Label>
              <Input id="displayName" {...nameForm.register('displayName')} />
              {nameForm.formState.errors.displayName ? (
                <p className="text-xs text-destructive">{nameForm.formState.errors.displayName.message}</p>
              ) : null}
            </div>
            <Button type="submit" disabled={nameForm.formState.isSubmitting}>
              Save name
            </Button>
          </form>
        </section>

        <section>
          <h2 className="font-serif text-2xl">Password</h2>
          <form
            className="mt-5 space-y-3"
            onSubmit={passwordForm.handleSubmit(async (values) => {
              try {
                await updatePassword(values.password);
                passwordForm.reset();
                toast.success('Password updated');
              } catch (error) {
                toast.error(toErrorMessage(error, 'Could not update the password.'));
              }
            })}
          >
            <div className="space-y-1.5">
              <Label htmlFor="password">New password</Label>
              <Input id="password" type="password" autoComplete="new-password" {...passwordForm.register('password')} />
              {passwordForm.formState.errors.password ? (
                <p className="text-xs text-destructive">{passwordForm.formState.errors.password.message}</p>
              ) : null}
            </div>
            <Button type="submit" variant="secondary" disabled={passwordForm.formState.isSubmitting}>
              Update password
            </Button>
          </form>
        </section>

        <section className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-serif text-2xl">Appearance</h2>
            <p className="mt-1 text-sm text-muted-foreground">Light paper, or a darker desk.</p>
          </div>
          <ThemeToggle />
        </section>

        <section>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void signOut().catch((error) => {
                toast.error(toErrorMessage(error, 'Could not sign out.'));
              });
            }}
          >
            Sign out
          </Button>
        </section>
      </div>
    </div>
  );
}
