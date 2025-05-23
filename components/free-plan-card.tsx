"use client";

import { Button } from "@/components/ui/button";
import { Subscription } from "@updatedev/js";
import { createUpdateClient } from "@/utils/update/client";
import { useState } from "react";
import { Loader2, Check, BadgeCheck, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/styles";

interface FreePlanCardProps {
  isCurrentPlan: boolean;
  currentSubscription?: Subscription | null;
}

export default function FreePlanCard({
  isCurrentPlan,
  currentSubscription,
}: FreePlanCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  async function handleCancelSubscription() {
    if (!currentSubscription) return;
    
    try {
      setIsLoading(true);
      const client = createUpdateClient();
      await client.billing.updateSubscription(currentSubscription.id, {
        cancel_at_period_end: true,
      });
      
      // Force a full page reload instead of just refreshing the router
      // This ensures all components update their state immediately
      window.location.reload();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      setIsLoading(false);
    }
    // No need for finally block as we're reloading the page
  }

  // Default features for free plan
  const features = [
    "Basic account access",
    "Public content access",
    "Community support",
    "Limited storage (500MB)",
    "Standard features"
  ];

  const isPendingCancellation = currentSubscription?.cancel_at_period_end;

  return (
    <div 
      className={cn(
        "relative rounded-lg overflow-hidden transition-all duration-200 bg-card flex flex-col h-full",
        isCurrentPlan 
          ? "border border-primary/50 shadow-md dark:shadow-primary/10" 
          : "border border-border hover:border-primary/50 hover:shadow-sm"
      )}
    >
      {/* Highlight strip for current plan */}
      {isCurrentPlan && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
      )}

      {/* Plan Header */}
      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold">Free</h3>
          {isCurrentPlan && (
            <Badge variant="default" className="ml-2">
              Current Plan
            </Badge>
          )}
        </div>
        
        <div className="flex items-baseline gap-1.5 mb-4">
          <span className="text-3xl font-bold">$0</span>
          <span className="text-muted-foreground text-sm">
            /forever
          </span>
        </div>
        
        <p className="text-sm text-muted-foreground mb-6">Get started with basic features at no cost</p>
        
        {/* Features List */}
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <Check size={16} className="mr-2 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Plan Actions */}
      <div className="p-6 pt-4 border-t border-border bg-muted/30 mt-auto">
        {isCurrentPlan ? (
          <div className="flex items-center text-green-600 dark:text-green-400 justify-center text-sm mt-2">
            <BadgeCheck size={16} className="mr-1" /> Current Plan
          </div>
        ) : isPendingCancellation ? (
          <div className="flex items-center justify-center text-amber-600 dark:text-amber-400 text-sm p-2.5 bg-amber-50 dark:bg-amber-950/30 rounded-md">
            <span>You&apos;ll be switched to this plan at the end of your billing period</span>
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={handleCancelSubscription}
            disabled={isLoading || !currentSubscription}
            variant="outline"
          >
            {isLoading ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <CreditCard size={16} className="mr-2" />
            )}
            Downgrade to Free
          </Button>
        )}
      </div>
    </div>
  );
} 