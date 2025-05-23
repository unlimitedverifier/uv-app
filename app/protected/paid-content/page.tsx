"use client";

import { useState, useEffect, useCallback, useMemo, Suspense } from "react";
import { createUpdateClient } from "@/utils/update/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Cat, Loader2, AlertCircle, Zap } from "lucide-react";
import Link from "next/link";
import Image from "next/image"; 
import dynamic from 'next/dynamic';

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

  // Memoize the generateCatImage function to prevent unnecessary re-renders
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
    <div className="flex flex-col items-center">
      {error && (
        <Alert variant="destructive" className="mb-6 w-full max-w-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card className="w-full max-w-lg overflow-hidden">
        <CardContent className="p-0 aspect-video relative flex items-center justify-center bg-muted">
          {catImage ? (
            <Image 
              src={catImage}
              alt="A cute cat"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          ) : (
            <Cat className="h-12 w-12 text-muted-foreground/50" aria-label="Cat placeholder icon" />
          )}
        </CardContent>
      </Card>
      
      <Button 
        onClick={generateCatImage}
        disabled={isGenerating}
        size="lg"
        className="mt-6"
        aria-label="Generate new cat image"
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

// Lazy load the PremiumCatGenerator to reduce initial bundle size
const LazyPremiumCatGenerator = dynamic(() => Promise.resolve(PremiumCatGenerator), {
  loading: () => (
    <div className="flex flex-col items-center justify-center p-6">
      <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
      <p>Loading premium content...</p>
    </div>
  ),
  ssr: false // Disable SSR for this component as it's client-interactive
});

export default function PaidContentPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Memoize the loadUserAndSubscription function
  const loadUserAndSubscription = useCallback(async () => {
    let isMounted = true;
    
    try {
      // Get client
      const client = createUpdateClient();
      
      // Get subscription
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
  
  // Memoize the premium user status
  const isPremiumUser = useMemo(() => 
    subscription && subscription.status === "active", 
    [subscription]
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12" aria-live="polite">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p>Loading your content...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Premium Cat Generator</h1>
        <p className="text-muted-foreground">
          {isPremiumUser 
            ? "Enjoy unlimited adorable cat photos with your premium subscription!" 
            : "Upgrade to premium to access our exclusive Cat Photo Generator!"}
        </p>
      </div>

      {error && (
        <Alert variant="destructive" aria-live="assertive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!isPremiumUser ? (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg p-6 flex flex-col items-center text-center">
          <div className="bg-blue-100 dark:bg-blue-900/50 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Zap className="h-8 w-8 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Premium Feature</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            This feature is only available for premium subscribers. Upgrade your plan to access unlimited cat photos!
          </p>
          <Button asChild>
            <Link href="/protected/pricing" aria-label="Upgrade to premium plan">
              <Zap className="mr-2 h-4 w-4" />
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
    </div>
  );
}
