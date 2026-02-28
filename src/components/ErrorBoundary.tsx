import { Component, ErrorInfo, ReactNode } from "react";
import { RefreshCw, AlertTriangle } from "lucide-react";

interface Props { children: ReactNode; fallbackTitle?: string; }
interface State { hasError: boolean; error: Error | null; }

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <AlertTriangle className="w-10 h-10 text-amber-400" />
          <h2 className="text-xl font-bold text-red-400">
            {this.props.fallbackTitle || "Something went wrong"}
          </h2>
          <p className="text-slate-400 text-sm max-w-md text-center">
            {this.state.error?.message || "An unexpected error occurred"}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 text-sm"
          >
            <RefreshCw className="w-4 h-4" /> Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
