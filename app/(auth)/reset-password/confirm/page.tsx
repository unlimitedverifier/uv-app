"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { createSupabaseClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";

export default function ResetPasswordConfirmPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Check if we have the necessary parameters
  useEffect(() => {
    // Supabase should automatically handle the token from the URL
    const errorParam = searchParams?.get("error");
    if (errorParam) {
      try {
        setError(decodeURIComponent(errorParam));
      } catch (e) {
        setError("Invalid error parameter");
        console.error("Error decoding URL parameter:", e);
      }
    }
  }, [searchParams]);

  async function handleUpdatePassword(e: React.FormEvent) {
    e.preventDefault();
    
    // Validate passwords
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const client = createSupabaseClient();
      const { error } = await client.auth.updateUser({ password });
      
      if (error) {
        console.error("Password update error:", error);
        setError(error.message);
      } else {
        setSuccess(true);
        // Redirect to dashboard after 3 seconds
        setTimeout(() => {
          router.push("/protected");
        }, 3000);
      }
    } catch (err) {
      console.error("Failed to update password:", err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col w-full max-w-md mx-auto mt-16 px-8 sm:px-0">
      {!success ? (
        <>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Reset your password</h1>
            <p className="text-sm text-muted-foreground">
              Enter your new password below.
            </p>
          </div>
          
          {error && (
            <div className="mb-6 p-3 bg-red-50 text-red-800 border border-red-200 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="h-11"
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
                className="h-11"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Password"
              )}
            </Button>
          </form>
        </>
      ) : (
        <div className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-6 w-6 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Password updated!</h1>
          <p className="text-muted-foreground mb-6">
            Your password has been successfully updated.
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            You&apos;ll be redirected to your dashboard shortly.
          </p>
          <Button 
            variant="outline" 
            className="mt-2" 
            onClick={() => router.push("/protected")}
          >
            Go to dashboard
          </Button>
        </div>
      )}
    </div>
  );
} 