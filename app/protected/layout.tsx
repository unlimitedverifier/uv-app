'use client';

import { ReactNode, Suspense } from "react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar } from "@/components/dashboard/top-bar";
import ErrorBoundary from "@/components/error-boundary";
import { Loader2 } from "lucide-react";

// Loading component for suspense fallback
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar with error boundary */}
        <ErrorBoundary>
          <Sidebar />
        </ErrorBoundary>
        
        {/* Main content area */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {/* Top bar with profile and social buttons */}
          <ErrorBoundary>
            <TopBar />
          </ErrorBoundary>
          
          {/* Main content with error boundary and suspense */}
          <main className="flex-1 overflow-y-auto p-6 container mx-auto max-w-6xl">
            <ErrorBoundary>
              <Suspense fallback={<LoadingSpinner />}>
                {children}
              </Suspense>
            </ErrorBoundary>
          </main>
        </div>
      </div>
    </div>
  );
}
