import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
export function Badge({ className, ...props }) {
    return (_jsx("span", { className: cn('inline-flex items-center rounded-full border border-border bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground', className), ...props }));
}
