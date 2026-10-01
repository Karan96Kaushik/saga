import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
export function SettingsView() {
    const { user, profile, updateDisplayName, updatePassword, signOut } = useAuth();
    const nameForm = useForm({
        resolver: zodResolver(nameSchema),
        values: { displayName: profile?.display_name ?? '' },
    });
    const passwordForm = useForm({
        resolver: zodResolver(passwordSchema),
        defaultValues: { password: '' },
    });
    return (_jsx("div", { className: "h-full overflow-y-auto", children: _jsxs("div", { className: "mx-auto flex max-w-lg flex-col gap-10 px-6 py-10", children: [_jsxs("section", { children: [_jsx("h2", { className: "font-serif text-2xl", children: "Account" }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: user?.email }), _jsxs("form", { className: "mt-5 space-y-3", onSubmit: nameForm.handleSubmit(async (values) => {
                                try {
                                    await updateDisplayName(values.displayName);
                                    toast.success('Name saved');
                                }
                                catch (error) {
                                    toast.error(toErrorMessage(error, 'Could not save your name.'));
                                }
                            }), children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: "displayName", children: "Display name" }), _jsx(Input, { id: "displayName", ...nameForm.register('displayName') }), nameForm.formState.errors.displayName ? (_jsx("p", { className: "text-xs text-destructive", children: nameForm.formState.errors.displayName.message })) : null] }), _jsx(Button, { type: "submit", disabled: nameForm.formState.isSubmitting, children: "Save name" })] })] }), _jsxs("section", { children: [_jsx("h2", { className: "font-serif text-2xl", children: "Password" }), _jsxs("form", { className: "mt-5 space-y-3", onSubmit: passwordForm.handleSubmit(async (values) => {
                                try {
                                    await updatePassword(values.password);
                                    passwordForm.reset();
                                    toast.success('Password updated');
                                }
                                catch (error) {
                                    toast.error(toErrorMessage(error, 'Could not update the password.'));
                                }
                            }), children: [_jsxs("div", { className: "space-y-1.5", children: [_jsx(Label, { htmlFor: "password", children: "New password" }), _jsx(Input, { id: "password", type: "password", autoComplete: "new-password", ...passwordForm.register('password') }), passwordForm.formState.errors.password ? (_jsx("p", { className: "text-xs text-destructive", children: passwordForm.formState.errors.password.message })) : null] }), _jsx(Button, { type: "submit", variant: "secondary", disabled: passwordForm.formState.isSubmitting, children: "Update password" })] })] }), _jsxs("section", { className: "flex items-center justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "font-serif text-2xl", children: "Appearance" }), _jsx("p", { className: "mt-1 text-sm text-muted-foreground", children: "Light paper, or a darker desk." })] }), _jsx(ThemeToggle, {})] }), _jsx("section", { children: _jsx(Button, { type: "button", variant: "outline", onClick: () => {
                            void signOut().catch((error) => {
                                toast.error(toErrorMessage(error, 'Could not sign out.'));
                            });
                        }, children: "Sign out" }) })] }) }));
}
