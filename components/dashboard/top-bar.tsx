"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/app/actions";
import { 
  User, 
  Menu, 
  Github, 
  MessageSquare,
  Bell,
  Loader2,
  AlertCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createSupabaseClient } from "@/utils/supabase/client";
import { useEffect, useState } from "react";
import { APP_CONFIG } from "@/utils/config";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createUpdateClient } from "@/utils/update/client";

export function TopBar() {
  const [email, setEmail] = useState<string | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [planName, setPlanName] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user email and subscription info on the client side
  useEffect(() => {
    const getUserData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const supabaseClient = createSupabaseClient();
        const updateClient = createUpdateClient();
        const { data, error: userError } = await supabaseClient.auth.getUser();
        
        if (userError) {
          throw new Error(userError.message);
        }
        
        setEmail(data.user?.email || null);
        
        // Get subscription data
        try {
          const { data: subscriptionData, error: subscriptionError } = await updateClient.billing.getSubscriptions();
          
          if (subscriptionError) {
            console.error("\n\n\n\nSubscription error:", subscriptionError);
            // Don't throw here - we can still show the user info without subscription data
          }
          
          if (subscriptionData?.subscriptions && subscriptionData.subscriptions.length > 0) {
            const subscription = subscriptionData.subscriptions[0];
            setPlanName(subscription.product.name);
            
            if (subscription.cancel_at_period_end) {
              setSubscriptionStatus("cancelling");
            } else if (subscription.status === "active") {
              setSubscriptionStatus("active");
            } else {
              setSubscriptionStatus(subscription.status);
            }
          }
        } catch (subscriptionError) {
          console.error("Error loading subscription data:", subscriptionError);
          // Continue execution - just log the error
        }
      } catch (err) {
        console.error("Error loading user data:", err);
        setError(err instanceof Error ? err.message : "Failed to load user data");
      } finally {
        setIsLoading(false);
      }
    };
    
    getUserData();
  }, []);

  // If there's an error fetching critical user data, show an error alert
  if (error) {
    return (
      <header className="h-16 border-b border-border bg-card flex items-center px-6">
        <Alert variant="destructive" className="w-full">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error} - <Button variant="link" className="p-0 h-auto" onClick={() => window.location.reload()}>Try refreshing</Button>
          </AlertDescription>
        </Alert>
      </header>
    );
  }

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
      {/* Left side - mobile menu and title */}
      <div className="flex items-center">
        <button 
          className="md:hidden mr-4 text-muted-foreground hover:text-foreground"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <Menu size={20} />
        </button>
        
        <h1 className="text-lg font-semibold md:hidden">SampleApp</h1>
      </div>
      
      {/* Right side actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
          <Bell size={18} />
        </Button>

        {/* Discord */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" asChild>
          <a href={APP_CONFIG.externalLinks.discord} target="_blank" rel="noopener noreferrer">
            <MessageSquare size={18} />
          </a>
        </Button>
        
        {/* GitHub */}
        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" asChild>
          <a href={APP_CONFIG.externalLinks.github} target="_blank" rel="noopener noreferrer">
            <Github size={18} />
          </a>
        </Button>
        
        {/* User dropdown with loading state */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              {isLoading ? <Loader2 size={18} className="animate-spin" /> : <User size={18} />}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {isLoading ? (
              <div className="py-2 px-3 flex items-center gap-2">
                <Loader2 size={16} className="animate-spin text-muted-foreground" />
                <span className="text-sm">Loading user data...</span>
              </div>
            ) : (
              <>
                <DropdownMenuLabel className="flex flex-col">
                  <span>{email || "User"}</span>
                  {planName && (
                    <span className="text-xs text-muted-foreground mt-1">
                      Plan: {planName}
                      {subscriptionStatus === "cancelling" && " (Cancelling)"}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/protected/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/protected/subscription">
                    Subscriptions
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/protected/help">Help</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={signOutAction} className="w-full">
                    <Button variant="ghost" className="w-full justify-start p-0 h-auto font-normal text-sm">
                      Sign out
                    </Button>
                  </form>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
} 