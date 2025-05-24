"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { createUpdateClient } from "@/utils/update/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Cat, Loader2, AlertCircle, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image"; 
import dynamic from 'next/dynamic';
import { PageHeader } from "@/components/page-header";

// Define subscription type
type Subscription = {
  status: string;
  product: {
    name: string;
  };
};

// Premium content component (internal)
function PremiumCatGenerator() {
  const [catImage, setCatImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateCatImage = useCallback(async () => {
    let isMounted = true;
    setError(null);
    setIsGenerating(true);

    try {
      const response = await fetch(
        'https://api.thecatapi.com/v1/images/search?size=med&mime_types=jpg,png,gif'
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (isMounted) {
        setCatImage(data[0]?.url);
        setIsGenerating(false);
      }
    } catch (err) {
      console.error("Error fetching cat image:", err);
      if (isMounted) {
        setError("Failed to generate cat image. Please try again.");
        setIsGenerating(false);
      }
    }

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="z-10 flex flex-col items-center gap-6">
      {error && (
        <Alert className="bg-red-50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800" style={{ width: '400px', height: '300px' }}>
        {catImage ? (
          <Image 
            src={catImage}
            alt="A cute cat"
            fill
            sizes="400px"
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <Cat className="h-12 w-12 text-slate-900/30 dark:text-slate-100/30" />
          </div>
        )}
      </div>
      
      <Button 
        onClick={generateCatImage}
        disabled={isGenerating}
        className="bg-slate-900 text-slate-50 hover:bg-slate-900/90 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-100/90"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Cat className="mr-2 h-4 w-4" />
            Generate Cat Photo
          </>
        )}
      </Button>
    </div>
  );
}

const LazyPremiumCatGenerator = dynamic(() => Promise.resolve(PremiumCatGenerator), {
  loading: () => (
    <div className="flex flex-col items-center justify-center p-6">
      <Loader2 className="h-8 w-8 animate-spin text-slate-900 dark:text-slate-100 mb-4" />
      <p className="text-slate-900/60 dark:text-slate-100/60">Loading premium content...</p>
    </div>
  ),
  ssr: false
});

export default function PaidContentPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadUserAndSubscription = useCallback(async () => {
    let isMounted = true;
    
    try {
      const client = createUpdateClient();
      const { data: subscriptionData } = await client.billing.getSubscriptions();
      
      if (isMounted) {
        setSubscription(subscriptionData.subscriptions?.[0] || null);
      }
    } catch (err) {
      console.error("Error loading user data:", err);
      if (isMounted) {
        setError("Failed to load user data. Please try again.");
      }
    } finally {
      if (isMounted) {
        setIsLoading(false);
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  useEffect(() => {
    loadUserAndSubscription();
  }, [loadUserAndSubscription]);
  
  const isPremiumUser = useMemo(() => 
    subscription && subscription.status === "active", 
    [subscription]
  );

  if (isLoading) {
    return (
      <div className="h-full w-full -m-6">
        <PageHeader 
          title="Cat Photo Generator" 
          description="Generate adorable cat photos"
        />
        
        <div className="flex h-full w-full bg-slate-100 px-6 py-8 dark:bg-black">
          <div className="z-10 mx-auto flex h-full w-full max-w-screen-xl gap-12">
            <div className="flex w-full flex-col rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-black">
              <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-900 dark:text-slate-100 mb-4" />
                <p className="text-slate-900/60 dark:text-slate-100/60">Loading your content...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full -m-6">
      <PageHeader 
        title="Cat Photo Generator" 
        description={isPremiumUser 
          ? "Enjoy unlimited adorable cat photos with your premium subscription!" 
          : "Upgrade to premium to access our exclusive Cat Photo Generator!"
        }
      />
      
      <div className="flex h-full w-full bg-slate-100 px-6 py-8 dark:bg-black">
        <div className="z-10 mx-auto flex h-full w-full max-w-screen-xl gap-12">
          <div className="flex w-full flex-col rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-black">
            
            {/* Header Section */}
            <div className="flex w-full flex-col rounded-lg p-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
                  {isPremiumUser ? "Premium Cat Generator" : "Premium Feature"}
                </h2>
                <p className="text-sm font-normal text-slate-900/60 dark:text-slate-100/60">
                  {isPremiumUser 
                    ? "Generate unlimited adorable cat photos"
                    : "This feature requires a premium subscription"
                  }
                </p>
              </div>
            </div>
            
            {/* Divider */}
            <div className="flex w-full px-6">
              <div className="w-full border-b border-slate-200 dark:border-slate-800" />
            </div>
            
            {/* Main Content Area */}
            <div className="relative mx-auto flex w-full flex-col items-center p-6">
              <div className="relative flex w-full flex-col items-center justify-center gap-6 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 px-6 py-24 dark:border-slate-800 dark:bg-slate-900">
                
                {error && (
                  <Alert className="bg-red-50 text-red-800 border-red-200 dark:bg-red-950/20 dark:text-red-300 dark:border-red-800 mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {!isPremiumUser ? (
                  <div className="z-10 flex max-w-[460px] flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-900/20 bg-white hover:border-slate-900/40 dark:border-slate-100/20 dark:bg-slate-950 dark:hover:border-slate-100/40">
                      <Zap className="h-8 w-8 stroke-[1.5px] text-slate-900/60 dark:text-slate-100/60" />
                    </div>
                    
                    <div className="flex flex-col items-center gap-2">
                      <p className="text-base font-medium text-slate-900 dark:text-slate-100">
                        Premium Feature
                      </p>
                      <p className="text-center text-base font-normal text-slate-900/60 dark:text-slate-100/60">
                        This feature is only available for premium subscribers. Upgrade your plan to access unlimited cat photos!
                      </p>
                      <span className="select-none items-center rounded-full bg-amber-500/5 px-3 py-1 text-xs font-medium tracking-tight text-amber-700 ring-1 ring-inset ring-amber-600/20 backdrop-blur-md dark:bg-amber-900/40 dark:text-amber-100 flex">
                        🔒 Premium Required
                      </span>
                    </div>
                    
                    <Button asChild className="bg-slate-900 text-slate-50 hover:bg-slate-900/90 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-100/90">
                      <Link href="/protected/pricing" className="flex items-center gap-2">
                        <Zap className="h-4 w-4" />
                        Upgrade to Premium
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <Suspense fallback={
                    <div className="flex justify-center p-12">
                      <Loader2 className="h-8 w-8 animate-spin" />
                    </div>
                  }>
                    <LazyPremiumCatGenerator />
                  </Suspense>
                )}
                
                {/* Background Grid Pattern */}
                <div 
                  className="absolute h-full w-full opacity-40"
                  style={{
                    backgroundImage: `
                      linear-gradient(to right, rgba(148, 163, 184, 0.3) 1px, transparent 1px),
                      linear-gradient(to bottom, rgba(148, 163, 184, 0.3) 1px, transparent 1px)
                    `,
                    backgroundSize: '24px 24px'
                  }}
                />
                
                {/* Bottom Gradient Overlay */}
                <div className="absolute bottom-0 h-full w-full bg-gradient-to-t from-white to-transparent dark:from-slate-900" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
