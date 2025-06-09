'use client';

import { ReactNode, Suspense } from "react";
import { Navigation } from "@/components/dashboard/navigation";
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
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Navigation bar with error boundary */}
        <ErrorBoundary>
          <Navigation />
        </ErrorBoundary>
        
        {/* Main content with error boundary and suspense */}
        <main className="flex-1 overflow-y-auto">
          <ErrorBoundary>
            <Suspense fallback={<LoadingSpinner />}>
              {children}
            </Suspense>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
