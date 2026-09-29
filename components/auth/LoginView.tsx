import { zodResolver } from '@hookform/resolvers/zod';
import { cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation } from 'react-router';
import { z } from 'zod';
import { Logo } from '@/components/layout/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toErrorMessage } from '@/lib/errors';
import { authCallback } from '@/utils/supabase';

const signInSchema = z.object({
  email: z.string().email('Enter a valid email.'),
  password: z.string().min(8, 'Use at least 8 characters.'),
});

const signUpSchema = signInSchema.extend({
  displayName: z.string().max(80, 'Keep the name under 80 characters.'),
});

type SignInValues = z.infer<typeof signInSchema>;
type SignUpValues = z.infer<typeof signUpSchema>;

export function LoginView() {
  const { configured, loading, session, signIn, signUp } = useAuth();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/';
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [formError, setFormError] = useState<string | null>(authCallback.errorDescription);
  const [confirmEmail, setConfirmEmail] = useState(false);

  const signInForm = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: '', password: '' },
  });
  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { email: '', password: '', displayName: '' },
  });

  if (!loading && session) return <Navigate to={from} replace />;

  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]">
      <section className="hidden flex-col justify-between bg-sidebar px-12 py-10 text-sidebar-foreground lg:flex">
        <Logo />
        <div className="max-w-md">
          <p className="font-serif text-5xl leading-tight">Write it down. Keep every version.</p>
          <p className="mt-5 text-lg text-sidebar-foreground/75">
            Saga stores the note itself — images, tables, and the size you gave them — and keeps earlier drafts in
            your database.
          </p>
        </div>
        <p className="text-sm text-sidebar-foreground/50">A quiet desk for long notes.</p>
      </section>
      <section className="flex flex-col justify-center bg-paper px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Logo className="text-foreground" />
          </div>
          <h1 className="font-serif text-4xl">{mode === 'sign-in' ? 'Welcome back' : 'Open a notebook'}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === 'sign-in' ? 'Sign in to your notes.' : 'Create an account with your email.'}
          </p>

          {!configured ? (
            <p className="mt-6 rounded-lg border border-border bg-secondary px-3 py-3 text-sm text-muted-foreground">
              Set <code>VITE_SUPABASE_URL_SAGA</code> and <code>VITE_SUPABASE_PUBLISHABLE_KEY_SAGA</code>, then run{' '}
              <code>supabase/schema.sql</code> in the Supabase SQL editor.
            </p>
          ) : null}

          {formError ? <p className="mt-4 text-sm text-destructive">{formError}</p> : null}
          {confirmEmail ? (
            <p className="mt-4 text-sm text-foreground">Check your email to confirm the account, then sign in.</p>
          ) : null}

          {mode === 'sign-in' ? (
            <form
              className="mt-8 space-y-4"
              onSubmit={signInForm.handleSubmit(async (values) => {
                setFormError(null);
                try {
                  await signIn(values.email, values.password);
                } catch (error) {
                  setFormError(toErrorMessage(error, 'Could not sign in.'));
                }
              })}
            >
              <Field label="Email" error={signInForm.formState.errors.email?.message}>
                <Input type="email" autoComplete="email" disabled={!configured} {...signInForm.register('email')} />
              </Field>
              <Field label="Password" error={signInForm.formState.errors.password?.message}>
                <Input
                  type="password"
                  autoComplete="current-password"
                  disabled={!configured}
                  {...signInForm.register('password')}
                />
              </Field>
              <Button type="submit" className="w-full" disabled={!configured || signInForm.formState.isSubmitting}>
                Sign in
              </Button>
            </form>
          ) : (
            <form
              className="mt-8 space-y-4"
              onSubmit={signUpForm.handleSubmit(async (values) => {
                setFormError(null);
                setConfirmEmail(false);
                try {
                  const result = await signUp(values.email, values.password, values.displayName);
                  if (result === 'confirm-email') setConfirmEmail(true);
                } catch (error) {
                  setFormError(toErrorMessage(error, 'Could not create the account.'));
                }
              })}
            >
              <Field label="Name" error={signUpForm.formState.errors.displayName?.message}>
                <Input autoComplete="name" disabled={!configured} {...signUpForm.register('displayName')} />
              </Field>
              <Field label="Email" error={signUpForm.formState.errors.email?.message}>
                <Input type="email" autoComplete="email" disabled={!configured} {...signUpForm.register('email')} />
              </Field>
              <Field label="Password" error={signUpForm.formState.errors.password?.message}>
                <Input
                  type="password"
                  autoComplete="new-password"
                  disabled={!configured}
                  {...signUpForm.register('password')}
                />
              </Field>
              <Button type="submit" className="w-full" disabled={!configured || signUpForm.formState.isSubmitting}>
                Create account
              </Button>
            </form>
          )}

          <div className="mt-6 flex items-center justify-between text-sm">
            <button
              type="button"
              className="text-foreground underline-offset-4 hover:underline"
              onClick={() => {
                setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
                setFormError(null);
                setConfirmEmail(false);
              }}
            >
              {mode === 'sign-in' ? 'Need an account?' : 'Already have an account?'}
            </button>
            <Link to="/reset-password" className="text-muted-foreground underline-offset-4 hover:underline">
              Forgot password
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  const id = useId();
  const control =
    isValidElement(children) ? cloneElement(children as ReactElement<{ id?: string }>, { id }) : children;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {control}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
