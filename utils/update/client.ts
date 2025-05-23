import { createSupabaseClient } from "@/utils/supabase/client";
import { createClient } from "@updatedev/js";

export function createUpdateClient() {
  return createClient(process.env.NEXT_PUBLIC_UPDATE_PUBLISHABLE_KEY!, {
    getSessionToken: async () => {
      console.log("[UpdateClient] Attempting to get Supabase session...");
      const supabase = createSupabaseClient();
      const { data } = await supabase.auth.getSession();
      console.log("[UpdateClient] Supabase getSession data:", data);
      if (data.session == null) {
        console.log("[UpdateClient] No active Supabase session found.");
        return;
      }
      console.log("[UpdateClient] Active Supabase session found, returning token.");
      return data.session.access_token;
    },
    environment: process.env.NODE_ENV === "production" ? "live" : "test",
  });
}
