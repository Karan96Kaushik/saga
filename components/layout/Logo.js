import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '@/lib/utils';
export function Logo({ className, compact = false }) {
    return (_jsxs("span", { className: cn('inline-flex items-center gap-2.5 text-sidebar-foreground', className), children: [_jsx(Mark, { className: "size-8" }), compact ? null : _jsx("span", { className: "font-serif text-[1.65rem] leading-none tracking-tight", children: "Saga" })] }));
}
export function Mark(props) {
    return (_jsxs("svg", { viewBox: "0 0 32 32", fill: "none", "aria-hidden": "true", ...props, children: [_jsx("rect", { width: "32", height: "32", rx: "8", fill: "currentColor", fillOpacity: "0.12" }), _jsx("path", { d: "M9 7.5h9.2L23 12.2V24.5H9V7.5Z", stroke: "currentColor", strokeWidth: "1.6" }), _jsx("path", { d: "M18.2 7.8V12H22.6", stroke: "currentColor", strokeWidth: "1.6" }), _jsx("path", { d: "M12.2 16.2h6.2M12.2 19.6h4.4", stroke: "#c6a36a", strokeWidth: "1.6", strokeLinecap: "round" })] }));
}
