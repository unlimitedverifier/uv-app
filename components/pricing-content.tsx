"use client";

import { useState, useMemo, useCallback } from "react";
import { ProductWithPrices /*, Subscription */ } from "@updatedev/js"; // Commented out unused Subscription
import { Button } from "@/components/ui/button";
import PricingCard from "@/components/pricing-card";
import { cn } from "@/utils/styles";
import { CreditCard } from "lucide-react";
// import FreePlanCard from "@/components/free-plan-card";

export default function PricingContent({
  products,
  // currentProductId, // Removed prop
  // currentSubscription, // Removed prop
}: {
  products: ProductWithPrices[];
  // currentProductId: string | null; // Removed prop type
  // currentSubscription?: Subscription | null; // Removed prop type
}) {
  const [interval, setInterval] = useState<"month" | "year" | "one-time">(
    "month"
  );

  // Memoize sorted products to prevent recalculation on every render
  const sortedProducts = useMemo(() => {
    return [...products].sort((a, b) => {
      // Removed sorting logic based on currentProductId
      // Now just sorts by price for the selected interval
      
      // Find prices for the current interval
      const aPrice = a.prices?.find(
        price => price.interval === interval || 
                (price.type === "one-time" && interval === "one-time")
      );
      
      const bPrice = b.prices?.find(
        price => price.interval === interval || 
                (price.type === "one-time" && interval === "one-time")
      );
      
      // Sort by price (low to high)
      // Handle cases where price might be missing for the interval
      if (!aPrice?.unit_amount && !bPrice?.unit_amount) return 0; // Keep order if both missing
      if (!aPrice?.unit_amount) return 1; // Missing price goes last
      if (!bPrice?.unit_amount) return -1; // Missing price goes last
      return aPrice.unit_amount - bPrice.unit_amount;
    });
  }, [products, interval]); // Removed currentProductId from dependency array

  // Memoize discount calculation to prevent recalculation on every render
  const yearlyDiscount = useMemo(() => {
    // Find a product with both monthly and yearly prices
    for (const product of products) {
      const monthlyPrice = product.prices?.find(p => p.interval === "month");
      const yearlyPrice = product.prices?.find(p => p.interval === "year");
      
      if (monthlyPrice?.unit_amount && yearlyPrice?.unit_amount) {
        const monthlyTotal = monthlyPrice.unit_amount * 12;
        const yearlyTotal = yearlyPrice.unit_amount;
        const savings = monthlyTotal - yearlyTotal;
        const discountPercent = Math.round((savings / monthlyTotal) * 100);
        
        if (discountPercent > 0) {
          return discountPercent;
        }
      }
    }
    
    return null;
  }, [products]);

  // Memoize interval change handlers
  const handleMonthlyInterval = useCallback(() => setInterval("month"), []);
  const handleYearlyInterval = useCallback(() => setInterval("year"), []);
  const handleOneTimeInterval = useCallback(() => setInterval("one-time"), []);

  return (
    <div className="flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold tracking-tight mb-3">Choose Your Plan</h2>
        <p className="text-muted-foreground max-w-lg mx-auto">
          Select the plan that best fits your needs. All plans include our core features.
        </p>
      </div>
      
      {/* Interval Selection */}
      <div className="flex flex-col items-center justify-center mb-10 w-full max-w-xs mx-auto">
        <div className="bg-card border border-border inline-flex rounded-lg p-1 shadow-sm w-full">
          <Button
            variant="ghost"
            className={cn(
              "flex-1 rounded-md font-medium h-10 transition-all",
              interval === "month" 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "bg-transparent hover:bg-muted text-foreground"
            )}
            onClick={handleMonthlyInterval}
          >
            Monthly
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "flex-1 rounded-md font-medium h-10 transition-all",
              interval === "year" 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "bg-transparent hover:bg-muted text-foreground"
            )}
            onClick={handleYearlyInterval}
          >
            Yearly
            {yearlyDiscount && interval === "year" && (
              <span className="ml-1.5 text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 px-1.5 py-0.5 rounded-full font-medium">
                Save {yearlyDiscount}%
              </span>
            )}
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "flex-1 rounded-md font-medium h-10 transition-all",
              interval === "one-time" 
                ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                : "bg-transparent hover:bg-muted text-foreground"
            )}
            onClick={handleOneTimeInterval}
          >
            One-Time
          </Button>
        </div>
        
        {yearlyDiscount && interval !== "year" && (
          <p className="text-xs text-muted-foreground mt-2">
            Save {yearlyDiscount}% with yearly billing
          </p>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="flex flex-wrap justify-center gap-8 w-full max-w-6xl mx-auto">
        {/* Free Plan Card */}
        {/* <FreePlanCard 
          isCurrentPlan={currentProductId === null} 
          currentSubscription={currentSubscription}
        /> */}
        
        {sortedProducts.map(product => (
          <PricingCard
            key={product.id}
            product={product}
            interval={interval}
            // Removed isCurrentPlan and currentSubscription props
          />
        ))}
      </div>
      
      {/* Payment security note */}
      <div className="mt-12 flex items-center justify-center text-sm text-muted-foreground">
        <CreditCard size={16} className="mr-2" />
        <span>Secure payment processing powered by Stripe</span>
      </div>
    </div>
  );
}
