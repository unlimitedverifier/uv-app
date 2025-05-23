"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import { User } from "@supabase/supabase-js";

interface HeaderProps {
  user: User | null;
}

export default function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  
  // Don't render header on protected routes
  if (pathname?.startsWith("/protected")) {
    return null;
  }

  return (
    <header className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between py-4 px-4 md:px-6 max-w-7xl mx-auto">
        {/* Left side: Logo and Pricing */}
        <div className="flex items-center gap-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <span className="w-3 h-3 bg-white dark:bg-background rounded-sm"></span>
            </span>
            <span className="font-bold text-xl text-foreground">SampleApp</span>
          </Link>
          
          {/* Pricing Link */}
          <Link href="/pricing" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center pt-0.5">
            Pricing
          </Link>
        </div>
        
        {/* Right side: Navigation */}
        <nav className="flex items-center gap-4">
          {user == null ? (
            <Button size="sm" className="bg-primary hover:bg-primary/90" asChild>
              <Link href="/sign-in">Sign in</Link>
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="text-muted-foreground hover:text-foreground" asChild>
              <Link href="/protected">Dashboard</Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
