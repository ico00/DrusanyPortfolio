"use client";

import { Component, type ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { ADMIN_UI } from "@/data/adminUI";

interface Props {
  children: ReactNode;
  onRetry: () => void;
}

interface State {
  hasError: boolean;
}

export default class BlockNoteErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn("BlockNote editor error (caught):", error.message);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[300px] flex-col items-center justify-center gap-4 rounded-lg border border-zinc-700 bg-zinc-800/50 p-8">
          <AlertCircle className="h-12 w-12 text-amber-500" />
          <p className="text-center text-sm text-zinc-400">
            {ADMIN_UI.editorError.message}
          </p>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false });
              this.props.onRetry();
            }}
            className={`flex items-center gap-2 ${ADMIN_UI.buttons.neutral}`}
          >
            <RefreshCw className="h-4 w-4" />
            {ADMIN_UI.editorError.retry}
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
