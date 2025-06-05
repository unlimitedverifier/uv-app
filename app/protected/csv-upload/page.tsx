import { CsvXlsxUpload } from "@/components/csv-xlsx-upload";
import { createSupabaseClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { PageContainer } from "@/components/page-container";
import { PageHeader } from "@/components/page-header";

export default async function CsvUploadPage() {
  // Get the authenticated user
  const client = await createSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  // Redirect to sign in if not authenticated
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <PageContainer>
      <PageHeader
        title="Email Validation System"
        description="Upload CSV or XLSX files and validate email addresses in bulk with real-time progress tracking."
      />
      
      <div className="space-y-8">
        <CsvXlsxUpload userId={user.id} />
        
        {/* Usage instructions for email validation */}
        <div className="max-w-2xl mx-auto">
          <div className="bg-muted/50 rounded-lg p-6">
            <h3 className="font-semibold mb-3">How to validate emails:</h3>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. Upload a CSV or XLSX file containing email addresses</li>
              <li>2. Select the column containing email addresses (auto-detected)</li>
              <li>3. Click &quot;Start Email Validation&quot; to begin the bulk validation process</li>
              <li>4. Monitor real-time progress with detailed statistics</li>
              <li>5. Download the validated results in CSV or JSON format when complete</li>
            </ol>
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-md">
              <p className="text-xs text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> The system processes up to 100,000 emails in chunks of 250, 
                with automatic retry logic and 30-day data retention.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
} 