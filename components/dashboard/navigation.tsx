"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { signOutAction } from "@/app/actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  HelpCircle,
  Settings,
  Github,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Slash,
  LogOut,
  Check,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { APP_CONFIG } from "@/utils/config";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createSupabaseClient } from "@/utils/supabase/client";
import { createUpdateClient } from "@/utils/update/client";
import { cn } from "@/utils/styles";

export function Navigation() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [email, setEmail] = useState<string | null>(null);
  const [planName, setPlanName] = useState<string | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get current path states for active navigation
  const isDashboardPath = pathname === "/protected";
  const isCsvUploadPath = pathname === "/protected/csv-upload";
  const isCatGeneratorPath = pathname === "/protected/paid-content";
  const isSubscriptionsPath = pathname === "/protected/subscription";
  const isPricingPath = pathname === "/protected/pricing";
  const isApiKeysPath = pathname === "/protected/api-keys";

  // Fetch user email and subscription info
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
            console.error("Subscription error:", subscriptionError);
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

  // If there's an error, show error state
  if (error) {
    return (
      <nav className="sticky top-0 z-50 flex w-full flex-col border-b border-border bg-card px-6">
        <div className="mx-auto flex w-full max-w-screen-xl items-center justify-center py-3">
          <Alert variant="destructive" className="w-full max-w-md">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error} - <Button variant="link" className="p-0 h-auto" onClick={() => window.location.reload()}>Try refreshing</Button>
            </AlertDescription>
          </Alert>
        </div>
      </nav>
    );
  }

  return (
    <nav className="sticky top-0 z-50 flex w-full flex-col border-b border-border bg-card px-6">
      {/* Top section with logo, user info, and actions */}
      <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between py-3">
        <div className="flex h-10 items-center gap-2">
          <Link href="/protected" className="flex h-10 items-center gap-1">
            <span className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <span className="w-4 h-4 bg-white dark:bg-background rounded-sm"></span>
            </span>
          </Link>
          <Slash className="h-6 w-6 -rotate-12 stroke-[1.5px] text-primary/10" />
          
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="gap-2 px-2 data-[state=open]:bg-primary/5"
              >
                <div className="flex items-center gap-2">
                  <span className="h-8 w-8 rounded-full bg-gradient-to-br from-lime-400 from-10% via-cyan-300 to-blue-500" />
                  <p className="text-sm font-medium text-primary/80">
                    {email?.split('@')[0] || "User"}
                  </p>
                  {planName && (
                    <span className="flex h-5 items-center rounded-full bg-primary/10 px-2 text-xs font-medium text-primary/80">
                      {planName}
                    </span>
                  )}
                </div>
                <span className="flex flex-col items-center justify-center">
                  <ChevronUp className="relative top-[3px] h-[14px] w-[14px] stroke-[1.5px] text-primary/60" />
                  <ChevronDown className="relative bottom-[3px] h-[14px] w-[14px] stroke-[1.5px] text-primary/60" />
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              sideOffset={8}
              className="min-w-56 bg-card p-2"
            >
              <DropdownMenuLabel className="flex items-center text-xs font-normal text-primary/60">
                Personal Account
              </DropdownMenuLabel>
              <DropdownMenuItem className="h-10 w-full cursor-pointer justify-between rounded-md bg-secondary px-2">
                <div className="flex items-center gap-2">
                  <span className="h-6 w-6 rounded-full bg-gradient-to-br from-lime-400 from-10% via-cyan-300 to-blue-500" />
                  <p className="text-sm font-medium text-primary/80">
                    {email?.split('@')[0] || "User"}
                  </p>
                </div>
                <Check className="h-[18px] w-[18px] stroke-[1.5px] text-primary/60" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex h-10 items-center gap-3">
          {/* Documentation Link */}
          <a
            href={APP_CONFIG.externalLinks.docs}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              `${buttonVariants({ variant: "outline", size: "sm" })} group hidden h-8 gap-2 rounded-full bg-transparent px-2 pr-2.5 md:flex`,
            )}
          >
            <HelpCircle className="h-4 w-4 text-primary" />
            <span className="text-sm text-primary/60 transition group-hover:text-primary group-focus:text-primary">
              Documentation
            </span>
          </a>

          {/* Discord Link */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" asChild>
            <a href={APP_CONFIG.externalLinks.discord} target="_blank" rel="noopener noreferrer">
              <MessageSquare size={16} />
            </a>
          </Button>
          
          {/* GitHub Link */}
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground" asChild>
            <a href={APP_CONFIG.externalLinks.github} target="_blank" rel="noopener noreferrer">
              <Github size={16} />
            </a>
          </Button>

          {/* User Dropdown */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 rounded-full">
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <span className="min-h-8 min-w-8 rounded-full bg-gradient-to-br from-lime-400 from-10% via-cyan-300 to-blue-500" />
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              sideOffset={8}
              className="fixed -right-4 min-w-56 bg-card p-2"
            >
              {isLoading ? (
                <div className="py-2 px-3 flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin text-muted-foreground" />
                  <span className="text-sm">Loading user data...</span>
                </div>
              ) : (
                <>
                  <DropdownMenuItem className="group flex-col items-start focus:bg-transparent">
                    <p className="text-sm font-medium text-primary/80 group-hover:text-primary group-focus:text-primary">
                      {email?.split('@')[0] || "User"}
                    </p>
                    <p className="text-sm text-primary/60">{email}</p>
                    {planName && (
                      <span className="text-xs text-muted-foreground mt-1">
                        Plan: {planName}
                        {subscriptionStatus === "cancelling" && " (Cancelling)"}
                      </span>
                    )}
                  </DropdownMenuItem>

                  <DropdownMenuItem className="group h-9 w-full cursor-pointer justify-between rounded-md px-2" asChild>
                    <Link href="/protected/settings">
                      <span className="text-sm text-primary/60 group-hover:text-primary group-focus:text-primary">
                        Settings
                      </span>
                      <Settings className="h-[18px] w-[18px] stroke-[1.5px] text-primary/60 group-hover:text-primary group-focus:text-primary" />
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className={cn(
                      "group flex h-9 justify-between rounded-md px-2 cursor-pointer",
                    )}
                    onClick={(e) => {
                      e.preventDefault();
                      setTheme(theme === "dark" ? "light" : "dark");
                    }}
                  >
                    <span className="text-sm text-primary/60 group-hover:text-primary group-focus:text-primary">
                      Theme
                    </span>
                    <div className="flex h-5 w-5 items-center justify-center">
                      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </div>
                  </DropdownMenuItem>

                  <DropdownMenuSeparator className="mx-0 my-2" />

                  <DropdownMenuItem className="group h-9 w-full cursor-pointer justify-between rounded-md px-2" asChild>
                    <form action={signOutAction} className="w-full">
                      <Button variant="ghost" className="w-full justify-between p-0 h-auto font-normal text-sm">
                        <span className="text-sm text-primary/60 group-hover:text-primary group-focus:text-primary">
                          Log Out
                        </span>
                        <LogOut className="h-[18px] w-[18px] stroke-[1.5px] text-primary/60 group-hover:text-primary group-focus:text-primary" />
                      </Button>
                    </form>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Navigation tabs */}
      <div className="mx-auto w-full max-w-screen-xl">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide">
          <div
            className={cn(
              "flex h-12 items-center border-b-2 flex-shrink-0",
              isDashboardPath ? "border-primary" : "border-transparent",
            )}
          >
            <Link
              href="/protected"
              className={cn(
                `${buttonVariants({ variant: "ghost", size: "sm" })} text-primary/80 whitespace-nowrap`,
              )}
            >
              Dashboard
            </Link>
          </div>
          
          <div
            className={cn(
              "flex h-12 items-center border-b-2 flex-shrink-0",
              isCsvUploadPath ? "border-primary" : "border-transparent",
            )}
          >
            <Link
              href="/protected/csv-upload"
              className={cn(
                `${buttonVariants({ variant: "ghost", size: "sm" })} text-primary/80 whitespace-nowrap`,
              )}
            >
              CSV Upload
            </Link>
          </div>
          
          <div
            className={cn(
              "flex h-12 items-center border-b-2 flex-shrink-0",
              isCatGeneratorPath ? "border-primary" : "border-transparent",
            )}
          >
            <Link
              href="/protected/paid-content"
              className={cn(
                `${buttonVariants({ variant: "ghost", size: "sm" })} text-primary/80 whitespace-nowrap`,
              )}
            >
              Cat Generator
            </Link>
          </div>
          
          <div
            className={cn(
              "flex h-12 items-center border-b-2 flex-shrink-0",
              isSubscriptionsPath ? "border-primary" : "border-transparent",
            )}
          >
            <Link
              href="/protected/subscription"
              className={cn(
                `${buttonVariants({ variant: "ghost", size: "sm" })} text-primary/80 whitespace-nowrap`,
              )}
            >
              Subscriptions
            </Link>
          </div>
          
          <div
            className={cn(
              "flex h-12 items-center border-b-2 flex-shrink-0",
              isPricingPath ? "border-primary" : "border-transparent",
            )}
          >
            <Link
              href="/protected/pricing"
              className={cn(
                `${buttonVariants({ variant: "ghost", size: "sm" })} text-primary/80 whitespace-nowrap`,
              )}
            >
              Pricing
            </Link>
          </div>
          
          <div
            className={cn(
              "flex h-12 items-center border-b-2 flex-shrink-0",
              isApiKeysPath ? "border-primary" : "border-transparent",
            )}
          >
            <Link
              href="/protected/api-keys"
              className={cn(
                `${buttonVariants({ variant: "ghost", size: "sm" })} text-primary/80 whitespace-nowrap`,
              )}
            >
              API Keys
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 