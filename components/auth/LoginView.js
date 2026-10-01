import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { zodResolver } from '@hookform/resolvers/zod';
import { cloneElement, isValidElement, useId, useState } from 'react';
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
export function LoginView() {
    const { configured, loading, session, signIn, signUp } = useAuth();
    const location = useLocation();
    const from = location.state?.from ?? '/';
    const [mode, setMode] = useState('sign-in');
    const [formError, setFormError] = useState(authCallback.errorDescription);
    const [confirmEmail, setConfirmEmail] = useState(false);
    const signInForm = useForm({
        resolver: zodResolver(signInSchema),
        defaultValues: { email: '', password: '' },
    });
    const signUpForm = useForm({
        resolver: zodResolver(signUpSchema),
        defaultValues: { email: '', password: '', displayName: '' },
    });
    if (!loading && session)
        return _jsx(Navigate, { to: from, replace: true });
    return (_jsxs("div", { className: "grid min-h-dvh lg:grid-cols-[minmax(0,1.1fr)_minmax(22rem,0.9fr)]", children: [_jsxs("section", { className: "hidden flex-col justify-between bg-sidebar px-12 py-10 text-sidebar-foreground lg:flex", children: [_jsx(Logo, {}), _jsxs("div", { className: "max-w-md", children: [_jsx("p", { className: "font-serif text-5xl leading-tight", children: "Write it down. Keep every version." }), _jsx("p", { className: "mt-5 text-lg text-sidebar-foreground/75", children: "Saga stores the note itself \u2014 images, tables, and the size you gave them \u2014 and keeps earlier drafts in your database." })] }), _jsx("p", { className: "text-sm text-sidebar-foreground/50", children: "A quiet desk for long notes." })] }), _jsx("section", { className: "flex flex-col justify-center bg-paper px-6 py-12 sm:px-12", children: _jsxs("div", { className: "mx-auto w-full max-w-sm", children: [_jsx("div", { className: "mb-8 lg:hidden", children: _jsx(Logo, { className: "text-foreground" }) }), _jsx("h1", { className: "font-serif text-4xl", children: mode === 'sign-in' ? 'Welcome back' : 'Open a notebook' }), _jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: mode === 'sign-in' ? 'Sign in to your notes.' : 'Create an account with your email.' }), !configured ? (_jsxs("p", { className: "mt-6 rounded-lg border border-border bg-secondary px-3 py-3 text-sm text-muted-foreground", children: ["Set ", _jsx("code", { children: "VITE_SUPABASE_URL_SAGA" }), " and ", _jsx("code", { children: "VITE_SUPABASE_PUBLISHABLE_KEY_SAGA" }), ", then run", ' ', _jsx("code", { children: "supabase/schema.sql" }), " in the Supabase SQL editor."] })) : null, formError ? _jsx("p", { className: "mt-4 text-sm text-destructive", children: formError }) : null, confirmEmail ? (_jsx("p", { className: "mt-4 text-sm text-foreground", children: "Check your email to confirm the account, then sign in." })) : null, mode === 'sign-in' ? (_jsxs("form", { className: "mt-8 space-y-4", onSubmit: signInForm.handleSubmit(async (values) => {
                                setFormError(null);
                                try {
                                    await signIn(values.email, values.password);
                                }
                                catch (error) {
                                    setFormError(toErrorMessage(error, 'Could not sign in.'));
                                }
                            }), children: [_jsx(Field, { label: "Email", error: signInForm.formState.errors.email?.message, children: _jsx(Input, { type: "email", autoComplete: "email", disabled: !configured, ...signInForm.register('email') }) }), _jsx(Field, { label: "Password", error: signInForm.formState.errors.password?.message, children: _jsx(Input, { type: "password", autoComplete: "current-password", disabled: !configured, ...signInForm.register('password') }) }), _jsx(Button, { type: "submit", className: "w-full", disabled: !configured || signInForm.formState.isSubmitting, children: "Sign in" })] })) : (_jsxs("form", { className: "mt-8 space-y-4", onSubmit: signUpForm.handleSubmit(async (values) => {
                                setFormError(null);
                                setConfirmEmail(false);
                                try {
                                    const result = await signUp(values.email, values.password, values.displayName);
                                    if (result === 'confirm-email')
                                        setConfirmEmail(true);
                                }
                                catch (error) {
                                    setFormError(toErrorMessage(error, 'Could not create the account.'));
                                }
                            }), children: [_jsx(Field, { label: "Name", error: signUpForm.formState.errors.displayName?.message, children: _jsx(Input, { autoComplete: "name", disabled: !configured, ...signUpForm.register('displayName') }) }), _jsx(Field, { label: "Email", error: signUpForm.formState.errors.email?.message, children: _jsx(Input, { type: "email", autoComplete: "email", disabled: !configured, ...signUpForm.register('email') }) }), _jsx(Field, { label: "Password", error: signUpForm.formState.errors.password?.message, children: _jsx(Input, { type: "password", autoComplete: "new-password", disabled: !configured, ...signUpForm.register('password') }) }), _jsx(Button, { type: "submit", className: "w-full", disabled: !configured || signUpForm.formState.isSubmitting, children: "Create account" })] })), _jsxs("div", { className: "mt-6 flex items-center justify-between text-sm", children: [_jsx("button", { type: "button", className: "text-foreground underline-offset-4 hover:underline", onClick: () => {
                                        setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in');
                                        setFormError(null);
                                        setConfirmEmail(false);
                                    }, children: mode === 'sign-in' ? 'Need an account?' : 'Already have an account?' }), _jsx(Link, { to: "/reset-password", className: "text-muted-foreground underline-offset-4 hover:underline", children: "Forgot password" })] })] }) })] }));
}
function Field({ label, error, children, }) {
    const id = useId();
    const control = isValidElement(children) ? cloneElement(children, { id }) : children;
    return (_jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: id, children: label }), control, error ? _jsx("p", { className: "text-xs text-destructive", children: error }) : null] }));
}
