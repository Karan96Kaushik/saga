import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
export function CountStat({ label, value, className, }) {
    return (_jsxs("div", { className: cn('min-w-0', className), children: [_jsx("div", { className: "font-serif text-2xl leading-none", children: value }), _jsx("div", { className: "mt-1 text-xs tracking-wide text-sidebar-foreground/70", children: label })] }));
}
