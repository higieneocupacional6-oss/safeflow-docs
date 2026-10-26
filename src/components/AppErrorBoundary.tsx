import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  message: string | null;
}

/** Prevents an uncaught render/boot error from leaving a blank #root. */
export class AppErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { message: null };

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : "Erro inesperado na interface.";
    return { message };
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error("AppErrorBoundary", error, info.componentStack);
  }

  render() {
    if (!this.state.message) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-lg space-y-3 text-center">
          <h1 className="text-xl font-semibold tracking-tight">Não foi possível carregar o sistema</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">{this.state.message}</p>
          <button
            type="button"
            className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            onClick={() => window.location.assign("/")}
          >
            Recarregar
          </button>
        </div>
      </div>
    );
  }
}
