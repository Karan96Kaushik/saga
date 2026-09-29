import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = {
  children: ReactNode;
  resetKey: string;
};

type State = {
  failed: boolean;
};

export class EditorBoundary extends Component<Props, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  componentDidUpdate(previous: Props) {
    if (previous.resetKey !== this.props.resetKey && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      return (
        <div className="mx-auto max-w-3xl px-6 py-16 text-sm text-muted-foreground">
          This document could not be opened. The saved note is still in the database.
        </div>
      );
    }
    return this.props.children;
  }
}
