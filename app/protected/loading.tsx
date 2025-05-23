import { Loader2 } from "lucide-react";

export default function ProtectedLoading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <h3 className="text-lg font-medium">Loading...</h3>
        <p className="text-sm text-muted-foreground max-w-md text-center">
          We&apos;re preparing your dashboard. This should only take a moment.
        </p>
      </div>
    </div>
  );
} 