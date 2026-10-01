import { jsx as _jsx } from "react/jsx-runtime";
import { functionsConfigured } from '@/lib/amplify/client';
export function FunctionsBanner() {
    if (functionsConfigured())
        return null;
    return (_jsx("p", { className: "border-b border-border bg-secondary/70 px-4 py-1.5 text-center text-xs text-muted-foreground", children: "Function URLs are not set, so emptying the trash runs in this browser. Deploy the Amplify sandbox to move that work to the API." }));
}
