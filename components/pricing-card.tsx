"use client";

import { Button } from "@/components/ui/button";
import { ProductWithPrices, Subscription } from "@updatedev/js";
import { createUpdateClient } from "@/utils/update/client";
import { useState, useEffect } from "react";
import { Loader2, Check, Zap, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/styles";

interface PricingCardProps {
  product: ProductWithPrices;
  interval: "month" | "year" | "one-time";
}

export default function PricingCard({
  product,
  interval,
}: PricingCardProps) {
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [isFetchingSubscription, setIsFetchingSubscription] = useState(true);
  const [currentSubscription, setCurrentSubscription] = useState<Subscription | null>(null);
  const [isCurrentPlan, setIsCurrentPlan] = useState(false);
  const [isPendingCancellation, setIsPendingCancellation] = useState(false);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      setIsFetchingSubscription(true);
      setSubscriptionError(null);
      try {
        const client = createUpdateClient();
        const { data: subscriptionData, error } = await client.billing.getSubscriptions();

        if (error) {
          console.error("PricingCard: Error fetching subscriptions:", error);
          setSubscriptionError("Could not load subscription status.");
          setIsCurrentPlan(false);
          setCurrentSubscription(null);
          setIsPendingCancellation(false);
          return;
        }

        const matchingSubscription = subscriptionData?.subscriptions?.find(
          (sub) => sub.product.id === product.id && sub.status === 'active'
        );

        if (matchingSubscription) {
          setCurrentSubscription(matchingSubscription);
          setIsCurrentPlan(true);
          setIsPendingCancellation(matchingSubscription.cancel_at_period_end);
        } else {
          setCurrentSubscription(null);
          setIsCurrentPlan(false);
          setIsPendingCancellation(false);
        }
      } catch (err) {
        console.error("PricingCard: Unexpected error:", err);
        setSubscriptionError("An unexpected error occurred.");
        setIsCurrentPlan(false);
        setCurrentSubscription(null);
        setIsPendingCancellation(false);
      } finally {
        setIsFetchingSubscription(false);
      }
    };

    fetchSubscriptionData();
  }, [product.id]);

  function getCurrencySymbol(currency_id: string) {
    switch (currency_id) {
      case "usd":
        return "$";
      case "eur":
        return "€";
      case "gbp":
        return "£";
      case "cad":
        return "$";
      case "aud":
        return "$";
      default:
        return currency_id;
    }
  }

  async function handleSelectPlan(priceId: string) {
    setCheckoutLoading(true);
    const client = createUpdateClient();
    const redirectUrl = `${window.location.origin}/protected/subscription`;
    const { data, error } = await client.billing.createCheckoutSession(
      priceId,
      {
        redirect_url: redirectUrl,
      }
    );
    if (error) {
      console.error("Error creating checkout session:", error);
      setCheckoutLoading(false);
      return;
    }

    window.location.href = data.url;
  }
  
  async function handleCancelSubscription() {
    if (!currentSubscription) return;
    
    try {
      setActionLoading(true);
      const client = createUpdateClient();
      await client.billing.updateSubscription(currentSubscription.id, {
        cancel_at_period_end: true,
      });
      
      window.location.reload();
    } catch (error) {
      console.error("Error cancelling subscription:", error);
      setActionLoading(false);
    }
  }

  async function handleReactivateSubscription() {
    if (!currentSubscription) return;
    
    try {
      setActionLoading(true);
      const client = createUpdateClient();
      await client.billing.updateSubscription(currentSubscription.id, {
        cancel_at_period_end: false,
      });
      
      window.location.reload();
    } catch (error) {
      console.error("Error reactivating subscription:", error);
      setActionLoading(false);
    }
  }

  const productPrice = product.prices?.find(
    price =>
      price.interval === interval ||
      (price.type === "one-time" && interval === "one-time")
  );

  if (!productPrice) {
    return null;
  }

  const { name, description } = product;

  const currency = productPrice.currency;
  const symbol = getCurrencySymbol(currency);
  const priceString = productPrice.unit_amount
    ? `${symbol}${(productPrice.unit_amount / 100).toFixed(2)}`
    : "Custom";
    
  const getFeatures = () => {
    const defaultFeatures = [
      "User authentication",
      "Account management",
      "Email notifications"
    ];
    
    if (name.toLowerCase().includes("basic") || productPrice.unit_amount === 0) {
      return [
        ...defaultFeatures,
        "Limited storage (1GB)",
        "Community support"
      ];
    } else if (name.toLowerCase().includes("pro") || name.toLowerCase().includes("premium")) {
      return [
        ...defaultFeatures,
        "Extended storage (10GB)",
        "Priority support",
        "API access",
        "Advanced analytics",
        "Custom branding"
      ];
    } else if (name.toLowerCase().includes("team") || name.toLowerCase().includes("enterprise")) {
      return [
        ...defaultFeatures,
        "Unlimited storage",
        "24/7 priority support",
        "Advanced API access",
        "Team management",
        "Dedicated account manager",
        "SSO integration",
        "Custom reporting"
      ];
    }
    
    return [
      ...defaultFeatures,
      "Standard features",
      "Email support"
    ];
  };
  
  const features = getFeatures();

  if (isFetchingSubscription) {
     return (
      <div className="relative rounded-lg border border-border bg-card flex flex-col h-full items-center justify-center p-6 min-h-[400px]">
        <Loader2 size={24} className="animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground mt-2">Loading plan status...</p>
      </div>
    );
  }
  
  if (subscriptionError) {
    return (
      <div className="relative rounded-lg border border-destructive bg-card flex flex-col h-full items-center justify-center p-6 text-center min-h-[400px]">
        <p className="text-sm text-destructive mb-2">Error</p>
        <p className="text-xs text-muted-foreground">{subscriptionError}</p>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "relative rounded-lg overflow-hidden transition-all duration-200 bg-card flex flex-col h-full",
        "w-full sm:max-w-sm",
        isCurrentPlan 
          ? "border border-primary/50 shadow-md dark:shadow-primary/10" 
          : "border border-border hover:border-primary/50 hover:shadow-sm"
      )}
    >
      {isCurrentPlan && (
        <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />
      )}

      <div className="p-6 pb-4">
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-xl font-bold">{name}</h3>
          {isCurrentPlan && (
            <Badge variant="default" className="ml-2">
              Current Plan
            </Badge>
          )}
        </div>
        
        <div className="flex items-baseline gap-1.5 mb-4">
          <span className="text-3xl font-bold">{priceString}</span>
          {productPrice?.unit_amount && (
            <span className="text-muted-foreground text-sm">
              {interval !== "one-time" ? `/${interval}` : ""}
              {interval !== "one-time" && productPrice.interval_count !== 1 && 
                ` (${productPrice.interval_count} ${productPrice.interval}s)`}
            </span>
          )}
        </div>
        
        <p className="text-sm text-muted-foreground mb-6">{description || "Access premium features with this plan"}</p>
        
        <div className="space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <Check size={16} className="mr-2 text-green-500 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{feature}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-6 pt-4 border-t border-border bg-muted/30 mt-auto">
        {isCurrentPlan ? (
          <div className="space-y-3">
            {isPendingCancellation ? (
              <Button
                className="w-full"
                onClick={handleReactivateSubscription}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : (
                  <Zap size={16} className="mr-2" />
                )}
                Reactivate Subscription
              </Button>
            ) : (
              <Button
                className="w-full"
                onClick={handleCancelSubscription}
                variant="outline"
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <Loader2 size={16} className="mr-2 animate-spin" />
                ) : null}
                Cancel Subscription
              </Button>
            )}
            <p className="text-xs text-muted-foreground text-center">
              {currentSubscription && (
                isPendingCancellation 
                  ? `Your plan will expire on ${new Date(currentSubscription.current_period_end).toLocaleDateString()}` 
                  : `Your plan renews on ${new Date(currentSubscription.current_period_end).toLocaleDateString()}`
              )}
            </p>
          </div>
        ) : (
          <Button
            className="w-full"
            onClick={() => handleSelectPlan(productPrice.id)}
            disabled={checkoutLoading}
          >
            {checkoutLoading ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : (
              <CreditCard size={16} className="mr-2" />
            )}
            {"Choose Plan"}
          </Button>
        )}
      </div>
    </div>
  );
}
