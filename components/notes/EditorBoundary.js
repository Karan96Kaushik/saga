import { jsx as _jsx } from "react/jsx-runtime";
import { Component } from 'react';
export class EditorBoundary extends Component {
    state = { failed: false };
    static getDerivedStateFromError() {
        return { failed: true };
    }
    componentDidCatch(error, info) {
        console.error(error, info.componentStack);
    }
    componentDidUpdate(previous) {
        if (previous.resetKey !== this.props.resetKey && this.state.failed) {
            this.setState({ failed: false });
        }
    }
    render() {
        if (this.state.failed) {
            return (_jsx("div", { className: "mx-auto max-w-3xl px-6 py-16 text-sm text-muted-foreground", children: "This document could not be opened. The saved note is still in the database." }));
        }
        return this.props.children;
    }
}
