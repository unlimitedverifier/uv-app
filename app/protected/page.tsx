import { createSupabaseClient } from "@/utils/supabase/server";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, ExternalLink, User, Shield, Activity, TrendingUp, Database, Globe } from "lucide-react";
import { FileUploadCard } from "@/components/file-upload-card";

type Props = {
  searchParams: Promise<{ message?: string }>;
};

export default async function ProtectedPage({ searchParams }: Props) {
  const client = await createSupabaseClient();
  const {
    data: { user },
  } = await client.auth.getUser();

  const resolvedParams = await searchParams;

  if (!user) {
    return (
      <div>There was an error loading your account. Please try again.</div>
    );
  }

  return (
    <div className="h-full w-full -m-6">
      {/* Header */}
      <header className="z-10 flex w-full flex-col border-b border-slate-200 bg-white px-6 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto flex w-full max-w-screen-xl items-center justify-between py-12">
          <div className="flex flex-col items-start gap-2">
            <h1 className="text-3xl font-medium text-slate-900/80 dark:text-slate-100/80">Dashboard</h1>
            <p className="text-base font-normal text-slate-900/60 dark:text-slate-100/60">Welcome to your dashboard overview</p>
          </div>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex w-full bg-slate-100 px-6 py-8 dark:bg-black min-h-screen">
        <div className="z-10 mx-auto flex w-full max-w-screen-xl gap-12">
          <div className="flex w-full flex-col space-y-8">
            
            {/* File Upload Card - Client Component */}
            <FileUploadCard />

            {/* Welcome Back Card */}
            <div className="flex w-full flex-col rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-black">
              
              {/* Header Section */}
              <div className="flex w-full flex-col p-6">
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
                    Welcome back
                  </h2>
                  <p className="text-sm font-normal text-slate-900/60 dark:text-slate-100/60">
                    Here&apos;s an overview of your account and activity
                  </p>
                </div>
              </div>
              
              {/* Success Message */}
              {resolvedParams.message && (
                <div className="px-6 pb-4">
                  <Alert className="bg-green-50 text-green-800 border-green-200 dark:bg-green-950/20 dark:text-green-300 dark:border-green-800/50">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription>{resolvedParams.message}</AlertDescription>
                  </Alert>
                </div>
              )}
              
              {/* Divider */}
              <div className="flex w-full px-6">
                <div className="w-full border-b border-slate-200 dark:border-slate-800" />
              </div>
              
              {/* Main Content Area */}
              <div className="p-6 space-y-6">
                
                {/* Account Information Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* User Information Card */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-slate-800">
                        <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                        User Information
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Email</span>
                        <span className="text-sm text-slate-900 dark:text-slate-100 truncate ml-4">{user?.email}</span>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">User ID</span>
                        <span className="text-xs font-mono text-slate-900 dark:text-slate-100 truncate max-w-[120px]">
                          {user?.id}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Last Sign In</span>
                        <span className="text-sm text-slate-900 dark:text-slate-100">
                          {user.last_sign_in_at
                            ? new Date(user.last_sign_in_at).toLocaleDateString()
                            : "Never"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Authentication Status Card */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-6">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-slate-800">
                        <Shield className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                        Authentication Status
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Status</span>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                          <span className="text-sm text-slate-900 dark:text-slate-100">Authenticated</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center py-3 border-b border-slate-200 dark:border-slate-800">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Providers</span>
                        <span className="text-sm text-slate-900 dark:text-slate-100 truncate ml-4">
                          {user.identities
                            ?.map((identity) => identity.provider)
                            .join(", ") || "Email"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-3">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Session</span>
                        <span className="text-sm text-slate-900 dark:text-slate-100">Active</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions Section */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-slate-800">
                      <TrendingUp className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                        Quick Actions
                      </h3>
                      <p className="text-sm text-slate-900/60 dark:text-slate-100/60">
                        Common tasks and features to get you started
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      {
                        title: "Cat Generator",
                        description: "Generate cat photos",
                        href: "/protected/paid-content",
                        icon: "🐱"
                      },
                      {
                        title: "Subscriptions", 
                        description: "Manage your plans",
                        href: "/protected/subscription",
                        icon: "💳"
                      },
                      {
                        title: "Pricing",
                        description: "View pricing options",
                        href: "/protected/pricing", 
                        icon: "⚡"
                      },
                      {
                        title: "Help & Docs",
                        description: "Get support",
                        href: "https://update.dev/docs",
                        icon: "📚"
                      }
                    ].map((action) => (
                      <a
                        key={action.title}
                        href={action.href}
                        target={action.href.startsWith('http') ? '_blank' : undefined}
                        rel={action.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                        className="group flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 min-w-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="text-xl flex-shrink-0">{action.icon}</div>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {action.title}
                            </span>
                            {action.href.startsWith('http') && (
                              <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                          {action.description}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>

                {/* Developer Resources Section */}
                <div className="rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900 p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-slate-800">
                      <Globe className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-medium text-slate-900 dark:text-slate-100">
                        Developer Resources
                      </h3>
                      <p className="text-sm text-slate-900/60 dark:text-slate-100/60">
                        Explore these resources to learn more about Update and get help
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      {
                        title: "Documentation",
                        description: "Complete API reference and guides for developers",
                        href: "https://update.dev/docs/reference/javascript",
                        icon: Database
                      },
                      {
                        title: "AI Prompts", 
                        description: "Pre-built prompts for AI assistants and automation",
                        href: "https://update.dev/docs/prompts/intro",
                        icon: Activity
                      },
                      {
                        title: "Demo Video",
                        description: "Watch a complete walkthrough of Update features",
                        href: "https://www.youtube.com/watch?v=0qrs_kQAK7U",
                        icon: TrendingUp
                      },
                      {
                        title: "Discord Community",
                        description: "Get help and connect with other developers",
                        href: "https://discord.com/invite/Guege5tXFK", 
                        icon: User
                      },
                      {
                        title: "GitHub Repository",
                        description: "Browse the source code and contribute to the project",
                        href: "https://github.com/updatedotdev/js",
                        icon: Globe
                      },
                      {
                        title: "Follow on X",
                        description: "Stay up to date with the latest news and updates",
                        href: "https://x.com/updatedotdev",
                        icon: Activity
                      }
                    ].map((resource) => (
                      <a
                        key={resource.title}
                        href={resource.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 transition-all hover:border-slate-300 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800 dark:hover:border-slate-600 min-w-0"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 flex-shrink-0">
                            <resource.icon className="h-3 w-3 text-slate-600 dark:text-slate-400" />
                          </div>
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {resource.title}
                            </span>
                            <ExternalLink className="h-3 w-3 text-slate-500 group-hover:text-slate-700 dark:text-slate-400 dark:group-hover:text-slate-300 flex-shrink-0" />
                          </div>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-tight">
                          {resource.description}
                        </p>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
