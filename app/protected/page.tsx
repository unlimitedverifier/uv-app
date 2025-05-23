import { createSupabaseClient } from "@/utils/supabase/server";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

type Props = {
  searchParams: { message?: string } | Promise<{ message?: string }>;
};

export default async function ProtectedPage({ searchParams }: Props) {
  const client = await createSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  // Resolve searchParams if it's a Promise
  const resolvedParams = searchParams instanceof Promise ? await searchParams : searchParams;

  if (!user) {
    return (
      <div>There was an error loading your account. Please try again.</div>
    );
  }

  return (
    <div className="space-y-8">
      {resolvedParams.message && (
        <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription>{resolvedParams.message}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">
          Here&apos;s an overview of your account and activity.
        </p>
      </div>

      {/* User Account Section */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold">Your Account</h2>
        
        <div className="border rounded-lg p-6 space-y-4 bg-card">
          <h3 className="font-medium">User Information</h3>
          <div className="grid gap-2 text-sm">
            <div className="grid grid-cols-[120px_1fr]">
              <div className="text-muted-foreground">Email</div>
              <div>{user?.email}</div>
            </div>
            <div className="grid grid-cols-[120px_1fr]">
              <div className="text-muted-foreground">User ID</div>
              <div className="font-mono text-xs truncate">{user?.id}</div>
            </div>
            <div className="grid grid-cols-[120px_1fr]">
              <div className="text-muted-foreground">Last Sign In</div>
              <div>
                {user.last_sign_in_at
                  ? new Date(user.last_sign_in_at).toLocaleString()
                  : "Never"}
              </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 space-y-4 bg-card">
          <h3 className="font-medium">Authentication Status</h3>
          <div className="grid gap-2 text-sm">
            <div className="grid grid-cols-[120px_1fr]">
              <div className="text-muted-foreground">Status</div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                Authenticated
              </div>
            </div>
            <div className="grid grid-cols-[120px_1fr]">
              <div className="text-muted-foreground">Providers</div>
              <div>
                {user.identities
                  ?.map((identity) => identity.provider)
                  .join(", ") || "Email"}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Resources Section */}
      <div className="bg-slate-50 dark:bg-slate-900/20 rounded-xl p-8">
        <h2 className="text-xl font-semibold">Resources</h2>
        <p className="text-muted-foreground text-sm mb-6">
          Explore these resources to learn more about Update and get help with your integration.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <a 
            href="https://update.dev/docs/reference/javascript" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 group"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M6 2h12a4 4 0 0 1 4 4v12a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V6a4 4 0 0 1 4-4z" stroke="currentColor" className="text-blue-600 dark:text-blue-400" strokeWidth="2" />
                <path d="M10 8h4" stroke="currentColor" className="text-blue-600 dark:text-blue-400" strokeWidth="2" strokeLinecap="round" />
                <path d="M9 12h6" stroke="currentColor" className="text-blue-600 dark:text-blue-400" strokeWidth="2" strokeLinecap="round" />
                <path d="M10 16h4" stroke="currentColor" className="text-blue-600 dark:text-blue-400" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="font-medium group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">Documentation</div>
              <div className="text-sm text-muted-foreground">Complete API reference and guides</div>
            </div>
          </a>
          
          <a 
            href="https://update.dev/docs/prompts/intro" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 group"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16v-4M12 8h.01" stroke="currentColor" className="text-purple-600 dark:text-purple-400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z" stroke="currentColor" className="text-purple-600 dark:text-purple-400" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <div className="font-medium group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">AI Prompts</div>
              <div className="text-sm text-muted-foreground">Pre-built prompts for AI assistants</div>
            </div>
          </a>
          
          <a 
            href="https://www.youtube.com/watch?v=0qrs_kQAK7U" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 group"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-red-100 dark:bg-red-900/30 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="4" width="20" height="16" rx="5" stroke="currentColor" className="text-red-600 dark:text-red-400" strokeWidth="2"/>
                <path d="M10 15V9L15 12L10 15Z" fill="currentColor" className="text-red-600 dark:text-red-400"/>
              </svg>
            </div>
            <div>
              <div className="font-medium group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">Demo Video</div>
              <div className="text-sm text-muted-foreground">Watch a walkthrough of Update</div>
            </div>
          </a>
          
          <a 
            href="https://discord.com/invite/Guege5tXFK" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 group"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4C14.85 4.26 14.68 4.59 14.56 4.87C12.98 4.64 11.41 4.64 9.83 4.87C9.71 4.59 9.53 4.26 9.38 4C7.87 4.26 6.43 4.71 5.1 5.33C2.87 8.61 2.23 11.79 2.54 14.92C4.3 16.21 5.98 17 7.64 17.5C8.03 16.97 8.37 16.41 8.67 15.82C8.05 15.6 7.46 15.32 6.91 15C7.05 14.9 7.19 14.79 7.32 14.68C9.96 15.86 12.94 15.86 15.55 14.68C15.69 14.79 15.83 14.9 15.97 15C15.42 15.32 14.82 15.6 14.21 15.82C14.51 16.41 14.85 16.97 15.24 17.5C16.9 17 18.59 16.21 20.34 14.92C20.71 11.29 19.68 8.14 17.4 5.33H19.27ZM8.5 13C7.56 13 6.8 12.15 6.8 11.11C6.8 10.08 7.53 9.23 8.5 9.23C9.46 9.23 10.2 10.08 10.18 11.11C10.19 12.15 9.46 13 8.5 13ZM15.39 13C14.44 13 13.69 12.15 13.69 11.11C13.69 10.08 14.41 9.23 15.39 9.23C16.36 9.23 17.1 10.08 17.08 11.11C17.08 12.15 16.36 13 15.39 13Z" fill="currentColor" className="text-indigo-600 dark:text-indigo-400"/>
              </svg>
            </div>
            <div>
              <div className="font-medium group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">Discord Community</div>
              <div className="text-sm text-muted-foreground">Get help and connect with other developers</div>
            </div>
          </a>
          
          <a 
            href="https://github.com/updatedotdev/js" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-4 group"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-gray-800/60 rounded-lg">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.164 6.839 9.49.5.092.682-.217.682-.48 0-.238-.008-.866-.013-1.7-2.782.603-3.369-1.338-3.369-1.338-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.646.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.03-2.682-.103-.253-.447-1.27.097-2.646 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.376.202 2.394.1 2.646.64.699 1.026 1.591 1.026 2.682 0 3.841-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.16 22 16.416 22 12c0-5.523-4.477-10-10-10z" fill="currentColor" className="text-gray-700 dark:text-gray-300" />
              </svg>
            </div>
            <div>
              <div className="font-medium group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">GitHub Repository</div>
              <div className="text-sm text-muted-foreground">Browse the source code and contribute</div>
            </div>
          </a>

          <a 
            href="https://x.com/updatedotdev" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="flex items-center gap-4 group"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-black rounded-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" className="text-white">
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
              </svg>
            </div>
            <div>
              <div className="font-medium group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">Follow on X (Twitter)</div>
              <div className="text-sm text-muted-foreground">Stay up to date with the latest news and updates</div>
            </div>
          </a>
        </div>
      </div>
    </div>
  );
}
