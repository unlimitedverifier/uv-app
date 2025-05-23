"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  CreditCard, 
  HelpCircle,
  Zap,
  Cat,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { APP_CONFIG } from "@/utils/config";
import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", href: "/protected", icon: LayoutDashboard },
  { name: "Cat Photo Generator", href: "/protected/paid-content", icon: Cat },
  { name: "Subscriptions", href: "/protected/subscription", icon: CreditCard },
  { name: "Pricing", href: "/protected/pricing", icon: Zap },
  { name: "Help", href: APP_CONFIG.externalLinks.docs, icon: HelpCircle },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { theme, setTheme } = useTheme();
  
  // Simulate checking permissions or loading data
  // In a real app, this might fetch navigation items based on user permissions
  useEffect(() => {
    const loadNavItems = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Simulate API call or data loading
        await new Promise(resolve => setTimeout(resolve, 300));
        // If there was an error, you would throw it here
        
        // Success - just finish loading
      } catch (err) {
        console.error("Error loading sidebar data:", err);
        setError(err instanceof Error ? err.message : "Failed to load navigation");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadNavItems();
  }, []);

  if (error) {
    return (
      <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col p-4">
        <div className="p-6 border-border mb-4">
          <Link href="/protected" className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="w-3 h-3 bg-white dark:bg-background rounded-sm"></span>
            </span>
            <span className="font-bold text-xl text-foreground">SampleApp</span>
          </Link>
        </div>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error} - <Button variant="link" className="p-0 h-auto" onClick={() => window.location.reload()}>Try again</Button>
          </AlertDescription>
        </Alert>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r border-border bg-card hidden md:flex flex-col">
      {/* Logo */}
      <div className="p-6 border-border">
        <Link href="/protected" className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
            <span className="w-3 h-3 bg-white dark:bg-background rounded-sm"></span>
          </span>
          <span className="font-bold text-xl text-foreground">SampleApp</span>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 p-4">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    }`}
                    target={item.name === "Help" ? "_blank" : undefined}
                    rel={item.name === "Help" ? "noopener noreferrer" : undefined}
                  >
                    <item.icon size={18} className={isActive ? "text-primary" : ""} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
      
      {/* Theme Toggle - Added to the bottom */}
      <div className="mt-auto p-4">
         <Button 
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          className="text-muted-foreground hover:text-foreground"
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </aside>
  );
} 