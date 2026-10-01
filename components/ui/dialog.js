import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export function DialogContent({ className, children, ...props }) {
    return (_jsxs(DialogPrimitive.Portal, { children: [_jsx(DialogPrimitive.Overlay, { className: "fixed inset-0 z-50 bg-black/40" }), _jsxs(DialogPrimitive.Content, { className: cn('fixed left-1/2 top-1/2 z-50 w-[min(100%-2rem,42rem)] -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-paper p-6 shadow-xl focus:outline-none', className), ...props, children: [children, _jsxs(DialogPrimitive.Close, { className: "absolute right-4 top-4 rounded-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", children: [_jsx(X, { className: "size-4" }), _jsx("span", { className: "sr-only", children: "Close" })] })] })] }));
}
export function DialogHeader({ className, ...props }) {
    return _jsx("div", { className: cn('mb-4 space-y-1 pr-8', className), ...props });
}
export function DialogTitle({ className, ...props }) {
    return _jsx(DialogPrimitive.Title, { className: cn('font-serif text-xl text-foreground', className), ...props });
}
export function DialogDescription({ className, ...props }) {
    return (_jsx(DialogPrimitive.Description, { className: cn('text-sm text-muted-foreground', className), ...props }));
}
