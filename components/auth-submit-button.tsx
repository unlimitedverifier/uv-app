"use client";

import { Button } from "@/components/ui/button";
import { useFormStatus } from "react-dom";
import { Loader2 } from "lucide-react";

export default function AuthSubmitButton({ text = "Sign in" }: { text?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button 
      type="submit" 
      disabled={pending}
      className="w-full h-10 mt-2"
    >
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {text === "Sign up" ? "Creating account..." : "Signing in..."}
        </>
      ) : text}
    </Button>
  );
}
