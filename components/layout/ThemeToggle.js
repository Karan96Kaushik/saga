import { jsx as _jsx } from "react/jsx-runtime";
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
export function ThemeToggle() {
    const { resolvedTheme, setTheme } = useTheme();
    const dark = resolvedTheme === 'dark';
    return (_jsx(Button, { type: "button", variant: "ghost", size: "icon", "aria-label": dark ? 'Use light theme' : 'Use dark theme', onClick: () => setTheme(dark ? 'light' : 'dark'), children: dark ? _jsx(Sun, {}) : _jsx(Moon, {}) }));
}
