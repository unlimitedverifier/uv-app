import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function Home() {
  const client = await createSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  // If user is authenticated, redirect to dashboard
  if (user) {
    redirect("/protected");
  }

  // If user is not authenticated, redirect to sign-in
  redirect("/sign-in");
}
