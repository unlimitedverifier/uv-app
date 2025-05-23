'use client';

import { useEffect } from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-md w-full p-8 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
              </div>
              
              <h1 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Something went wrong</h1>
              
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                We&apos;re sorry, but we&apos;ve encountered an unexpected error.
                {error.message && (
                  <span className="block mt-2 text-sm text-red-600 dark:text-red-400 font-mono p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-100 dark:border-red-800">
                    {error.message}
                  </span>
                )}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Button 
                  onClick={() => reset()} 
                  className="flex-1"
                  variant="default"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try again
                </Button>
                
                <Button
                  variant="outline"
                  className="flex-1"
                  asChild
                >
                  <Link href="/">
                    <Home className="mr-2 h-4 w-4" />
                    Back to home
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
} 