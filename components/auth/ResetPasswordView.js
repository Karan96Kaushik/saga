import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export function ResetPasswordView() {
    const { session, loading, sendPasswordReset, updatePassword } = useAuth();
    const navigate = useNavigate();
    const [message, setMessage] = useState(null);
    const [formError, setFormError] = useState(authCallback.errorDescription);
    const canChoosePassword = Boolean(session) && (authCallback.isRecovery || authCallback.type === 'recovery');
    const emailForm = useForm({
        resolver: zodResolver(emailSchema),
        defaultValues: { email: '' },
    });
    const passwordForm = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: { password: '' },
    });
    return (_jsx("div", { className: "grid min-h-dvh place-items-center bg-background px-6 py-12", children: _jsxs("div", { className: "w-full max-w-sm", children: [_jsx(Logo, { className: "mb-8 text-foreground" }), _jsx("h1", { className: "font-serif text-4xl", children: "Reset password" }), _jsx("p", { className: "mt-2 text-sm text-muted-foreground", children: canChoosePassword ? 'Choose a new password for this account.' : 'We will email you a reset link.' }), formError ? _jsx("p", { className: "mt-4 text-sm text-destructive", children: formError }) : null, message ? _jsx("p", { className: "mt-4 text-sm", children: message }) : null, loading ? (_jsx("p", { className: "mt-8 text-sm text-muted-foreground", children: "Checking the reset link\u2026" })) : canChoosePassword ? (_jsxs("form", { className: "mt-8 space-y-4", onSubmit: passwordForm.handleSubmit(async (values) => {
                        setFormError(null);
                        try {
                            await updatePassword(values.password);
                            navigate('/', { replace: true });
                        }
                        catch (error) {
                            setFormError(toErrorMessage(error, 'Could not update the password.'));
                        }
                    }), children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: "password", children: "New password" }), _jsx(Input, { id: "password", type: "password", autoComplete: "new-password", ...passwordForm.register('password') }), passwordForm.formState.errors.password ? (_jsx("p", { className: "text-xs text-destructive", children: passwordForm.formState.errors.password.message })) : null] }), _jsx(Button, { type: "submit", className: "w-full", disabled: passwordForm.formState.isSubmitting, children: "Save password" })] })) : (_jsxs("form", { className: "mt-8 space-y-4", onSubmit: emailForm.handleSubmit(async (values) => {
                        setFormError(null);
                        setMessage(null);
                        try {
                            await sendPasswordReset(values.email);
                            setMessage('If that account exists, a reset link is on its way.');
                        }
                        catch (error) {
                            setFormError(toErrorMessage(error, 'Could not send the reset email.'));
                        }
                    }), children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: "email", children: "Email" }), _jsx(Input, { id: "email", type: "email", autoComplete: "email", ...emailForm.register('email') }), emailForm.formState.errors.email ? (_jsx("p", { className: "text-xs text-destructive", children: emailForm.formState.errors.email.message })) : null] }), _jsx(Button, { type: "submit", className: "w-full", disabled: emailForm.formState.isSubmitting, children: "Send reset link" })] })), _jsx(Link, { to: "/login", className: "mt-6 inline-block text-sm text-muted-foreground underline-offset-4 hover:underline", children: "Back to sign in" })] }) }));
}
