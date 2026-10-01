import { jsx as _jsx } from "react/jsx-runtime";
import * as DropdownMenuPrimitive from '@radix-ui/react-dropdown-menu';
import { cn } from '@/lib/utils';
export const DropdownMenu = DropdownMenuPrimitive.Root;
export const DropdownMenuTrigger = DropdownMenuPrimitive.Trigger;
export function DropdownMenuContent({ className, sideOffset = 6, ...props }) {
    return (_jsx(DropdownMenuPrimitive.Portal, { children: _jsx(DropdownMenuPrimitive.Content, { sideOffset: sideOffset, className: cn('z-50 min-w-44 rounded-lg border border-border bg-paper p-1 text-sm shadow-lg', className), ...props }) }));
}
export function DropdownMenuItem({ className, ...props }) {
    return (_jsx(DropdownMenuPrimitive.Item, { className: cn('flex cursor-pointer select-none items-center gap-2 rounded-md px-2 py-1.5 outline-none focus:bg-accent data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className), ...props }));
}
export function DropdownMenuSeparator({ className, ...props }) {
    return _jsx(DropdownMenuPrimitive.Separator, { className: cn('-mx-1 my-1 h-px bg-border', className), ...props });
}
export function DropdownMenuLabel({ className, ...props }) {
    return (_jsx(DropdownMenuPrimitive.Label, { className: cn('px-2 py-1.5 text-xs font-medium text-muted-foreground', className), ...props }));
}
