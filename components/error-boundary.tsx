"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Error caught by ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-6 rounded-lg border border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-900 text-red-800 dark:text-red-300">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="space-y-2">
              <h3 className="font-medium">Something went wrong</h3>
              <p className="text-sm text-red-700 dark:text-red-400">
                {this.state.error?.message || "An unexpected error occurred."}
              </p>
              <div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => window.location.reload()}
                  className="mt-2 bg-white/80 dark:bg-gray-900/80 text-red-700 dark:text-red-300 hover:bg-white dark:hover:bg-gray-900 border-red-300 dark:border-red-800"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-2" />
                  Try again
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 