import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
export function Input({ className, type = 'text', ...props }) {
    return (_jsx("input", { type: type, className: cn('flex h-10 w-full rounded-md border border-border bg-paper px-3 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', className), ...props }));
}
