import React, { Component, ErrorInfo, ReactNode } from "react";
import { useNavigate } from "react-router-dom";

interface Props {
  children: ReactNode;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class GenerationErrorBoundaryClass extends Component<
  Props & { navigate: (path: string) => void },
  State
> {
  constructor(props: Props & { navigate: (path: string) => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Generation error:", error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  handleGoHome = () => {
    this.props.navigate("/");
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-8 bg-dark-900">
          <div className="text-center space-y-6 max-w-lg">
            <div className="text-6xl">Generation Failed</div>
            <div>
              <p className="text-dark-300 mb-4">
                Something went wrong during design system generation. This could
                be due to a network issue or an unexpected error.
              </p>
              {this.state.error && (
                <details className="text-left text-xs text-dark-400 bg-dark-800 p-4 rounded mb-4">
                  <summary className="cursor-pointer">Error details</summary>
                  <pre className="mt-2 overflow-auto whitespace-pre-wrap">
                    {this.state.error.message}
                  </pre>
                </details>
              )}
            </div>
            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleGoHome}
                className="px-6 py-3 bg-dark-700 text-white rounded-lg hover:bg-dark-600 transition-colors"
              >
                Back to Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export const GenerationErrorBoundary: React.FC<Props> = (props) => {
  const navigate = useNavigate();
  return <GenerationErrorBoundaryClass {...props} navigate={navigate} />;
};
