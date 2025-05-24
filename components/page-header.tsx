import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="z-10 flex w-full flex-col border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-950">
      <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between py-12">
        <div className="flex flex-col items-start gap-2">
          <h1 className="text-3xl font-medium text-slate-900/80 dark:text-slate-100/80">{title}</h1>
          <p className="text-base font-normal text-slate-900/60 dark:text-slate-100/60">{description}</p>
        </div>
      </div>
    </header>
  );
} 