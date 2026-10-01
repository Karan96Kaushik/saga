import { jsx as _jsx } from "react/jsx-runtime";
import * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';
export function Label({ className, ...props }) {
    return (_jsx(LabelPrimitive.Root, { className: cn('text-sm font-medium leading-none text-foreground', className), ...props }));
}
