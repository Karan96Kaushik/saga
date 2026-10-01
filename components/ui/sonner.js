import { jsx as _jsx } from "react/jsx-runtime";
import { Toaster as Sonner } from 'sonner';
import { useTheme } from 'next-themes';
export function Toaster(props) {
    const { resolvedTheme } = useTheme();
    return (_jsx(Sonner, { theme: resolvedTheme === 'dark' ? 'dark' : 'light', toastOptions: {
            className: 'font-sans',
        }, ...props }));
}
