import React from 'react';

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className="h-full w-full -m-6">
      <div className={`flex h-full w-full bg-slate-100 px-6 py-8 dark:bg-black ${className}`}>
        <div className="z-10 mx-auto flex h-full w-full max-w-screen-xl gap-12">
          <div className="flex w-full flex-col rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-black">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
} 