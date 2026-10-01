import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '@/lib/utils';
export function TooltipProvider({ children }) {
    return _jsx(TooltipPrimitive.Provider, { delayDuration: 300, children: children });
}
export function Tooltip({ children, label }) {
    return (_jsxs(TooltipPrimitive.Root, { children: [_jsx(TooltipPrimitive.Trigger, { asChild: true, children: children }), _jsx(TooltipPrimitive.Portal, { children: _jsx(TooltipPrimitive.Content, { sideOffset: 6, className: cn('z-50 rounded-md bg-foreground px-2 py-1 text-xs text-background shadow-md'), children: label }) })] }));
}
