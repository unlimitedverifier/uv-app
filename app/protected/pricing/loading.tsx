import { cn } from "@/utils/styles";

export default function PricingLoading() {
  return (
    <div className="flex flex-col items-center">
      {/* Header Skeleton */}
      <div className="text-center mb-8">
        <div className="h-8 w-64 bg-muted animate-pulse rounded-md mx-auto mb-3"></div>
        <div className="h-4 w-full max-w-lg mx-auto bg-muted animate-pulse rounded-md"></div>
      </div>
      
      {/* Interval Selection Skeleton */}
      <div className="flex flex-col items-center justify-center mb-10 w-full max-w-xs mx-auto">
        <div className="bg-card border border-border inline-flex rounded-lg p-1 shadow-sm w-full">
          <div className="flex-1 h-10 bg-muted animate-pulse m-1 rounded-md"></div>
          <div className="flex-1 h-10 bg-muted animate-pulse m-1 rounded-md"></div>
          <div className="flex-1 h-10 bg-muted animate-pulse m-1 rounded-md"></div>
        </div>
      </div>

      {/* Pricing Cards Skeleton */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 w-full max-w-6xl mx-auto">
        {/* Generate 3 skeleton cards */}
        {Array(3).fill(0).map((_, index) => (
          <div 
            key={index}
            className={cn(
              "relative rounded-lg overflow-hidden border border-border bg-card flex flex-col h-full"
            )}
          >
            {/* Plan Header Skeleton */}
            <div className="p-6 pb-4">
              <div className="flex justify-between items-start mb-3">
                <div className="h-6 w-24 bg-muted animate-pulse rounded-md"></div>
              </div>
              
              <div className="flex items-baseline gap-1.5 mb-4">
                <div className="h-8 w-16 bg-muted animate-pulse rounded-md"></div>
                <div className="h-4 w-12 bg-muted animate-pulse rounded-md"></div>
              </div>
              
              <div className="h-4 w-full bg-muted animate-pulse rounded-md mb-6"></div>
              
              {/* Features List Skeleton */}
              <div className="space-y-3">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-start">
                    <div className="h-4 w-4 bg-muted animate-pulse rounded-full mr-2 mt-0.5"></div>
                    <div className="h-4 w-full bg-muted animate-pulse rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Plan Actions Skeleton */}
            <div className="p-6 pt-4 border-t border-border bg-muted/30 mt-auto">
              <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Payment security note skeleton */}
      <div className="mt-12 flex items-center justify-center">
        <div className="h-4 w-64 bg-muted animate-pulse rounded-md"></div>
      </div>
    </div>
  );
}
