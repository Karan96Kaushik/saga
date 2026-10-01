import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as DialogPrimitive from '@radix-ui/react-dialog';
export function Sheet({ open, onOpenChange, children, }) {
    return (_jsx(DialogPrimitive.Root, { open: open, onOpenChange: onOpenChange, children: _jsxs(DialogPrimitive.Portal, { children: [_jsx(DialogPrimitive.Overlay, { className: "fixed inset-0 z-50 bg-black/45 md:hidden" }), _jsx(DialogPrimitive.Content, { className: "fixed inset-y-0 left-0 z-50 flex w-[min(100%,18rem)] flex-col bg-sidebar text-sidebar-foreground shadow-xl focus:outline-none md:hidden", children: children })] }) }));
}
