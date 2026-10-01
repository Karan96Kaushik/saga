import { jsx as _jsx } from "react/jsx-runtime";
import * as SeparatorPrimitive from '@radix-ui/react-separator';
import { cn } from '@/lib/utils';
export function Separator({ className, orientation = 'horizontal', decorative = true, ...props }) {
    return (_jsx(SeparatorPrimitive.Root, { decorative: decorative, orientation: orientation, className: cn('shrink-0 bg-border', orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px', className), ...props }));
}
