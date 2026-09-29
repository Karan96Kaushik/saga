import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { z } from 'zod';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toErrorMessage } from '@/lib/errors';
import { authCallback } from '@/utils/supabase';

const emailSchema = z.object({
  email: z.string().email('Enter a valid email.'),
});

const passwordSchema = z.object({
  password: z.string().min(8, 'Use at least 8 characters.'),
});

type EmailValues = z.infer<typeof emailSchema>;
type PasswordValues = z.infer<typeof passwordSchema>;

export function ResetPasswordView() {
  const { session, loading, sendPasswordReset, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(authCallback.errorDescription);
  const canChoosePassword = Boolean(session) && (authCallback.isRecovery || authCallback.type === 'recovery');

  const emailForm = useForm<EmailValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });
  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: '' },
  });

  return (
    <div className="grid min-h-dvh place-items-center bg-background px-6 py-12">
      <div className="w-full max-w-sm">
        <Logo className="mb-8 text-foreground" />
        <h1 className="font-serif text-4xl">Reset password</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {canChoosePassword ? 'Choose a new password for this account.' : 'We will email you a reset link.'}
        </p>
        {formError ? <p className="mt-4 text-sm text-destructive">{formError}</p> : null}
        {message ? <p className="mt-4 text-sm">{message}</p> : null}

        {loading ? (
          <p className="mt-8 text-sm text-muted-foreground">Checking the reset link…</p>
        ) : canChoosePassword ? (
          <form
            className="mt-8 space-y-4"
            onSubmit={passwordForm.handleSubmit(async (values) => {
              setFormError(null);
              try {
                await updatePassword(values.password);
                navigate('/', { replace: true });
              } catch (error) {
                setFormError(toErrorMessage(error, 'Could not update the password.'));
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
            <Button type="submit" className="w-full" disabled={passwordForm.formState.isSubmitting}>
              Save password
            </Button>
          </form>
        ) : (
          <form
            className="mt-8 space-y-4"
            onSubmit={emailForm.handleSubmit(async (values) => {
              setFormError(null);
              setMessage(null);
              try {
                await sendPasswordReset(values.email);
                setMessage('If that account exists, a reset link is on its way.');
              } catch (error) {
                setFormError(toErrorMessage(error, 'Could not send the reset email.'));
              }
            })}
          >
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" autoComplete="email" {...emailForm.register('email')} />
              {emailForm.formState.errors.email ? (
                <p className="text-xs text-destructive">{emailForm.formState.errors.email.message}</p>
              ) : null}
            </div>
            <Button type="submit" className="w-full" disabled={emailForm.formState.isSubmitting}>
              Send reset link
            </Button>
          </form>
        )}

        <Link to="/login" className="mt-6 inline-block text-sm text-muted-foreground underline-offset-4 hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
