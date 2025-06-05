import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { ValidationDetailsView } from "@/components/validation-details-view";

interface Params {
  userId: string;
  listId: string;
}

export default async function ValidationDetailsPage({
  params
}: {
  params: Promise<Params>
}) {
  // Get the authenticated user
  const client = await createSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  // Redirect to sign in if not authenticated
  if (!user) {
    redirect("/sign-in");
  }

  const { userId, listId } = await params;

  // Verify the user can access this list (basic security check)
  if (user.id !== userId) {
    redirect("/protected");
  }

  return (
    <div className="min-h-screen bg-background">
      <ValidationDetailsView userId={userId} listId={listId} />
    </div>
  );
} 