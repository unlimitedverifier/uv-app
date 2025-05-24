import SubscriptionActions from "@/components/subscription-actions";
import { createUpdateClient } from "@/utils/update/server";
import { CreditCard, ExternalLink, AlertTriangle, CheckCircle2, Clock, XCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";

export default async function Page() {    
  const client = await createUpdateClient();
  const { data, error } = await client.billing.getSubscriptions();

  if (error) {
    return (
      <div className="h-full w-full -m-6">
        <PageHeader 
          title="Subscriptions" 
          description="Set up your subscription plans to enable premium features"
        />
        
        <div className="flex h-full w-full bg-slate-100 px-6 py-8 dark:bg-black">
          <div className="z-10 mx-auto flex h-full w-full max-w-screen-xl gap-12">
            <div className="flex w-full flex-col rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-black">
              
              {/* Header Section */}
              <div className="flex w-full flex-col rounded-lg p-6">
                <div className="flex flex-col gap-2">
                  <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
                    Setup Required
                  </h2>
                  <p className="text-sm font-normal text-slate-900/60 dark:text-slate-100/60">
                    Complete these steps to enable subscription features
                  </p>
                </div>
              </div>
              
              {/* Divider */}
              <div className="flex w-full px-6">
                <div className="w-full border-b border-slate-200 dark:border-slate-800" />
              </div>
              
              {/* Setup Steps */}
              <div className="relative mx-auto flex w-full flex-col items-center p-6">
                <div className="relative flex w-full flex-col gap-6 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 px-6 py-8 dark:border-slate-800 dark:bg-slate-900">
                  
                  <div className="z-10 flex flex-col gap-6">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-50 dark:border-amber-400/20 dark:bg-amber-900/20">
                        <AlertTriangle className="h-6 w-6 stroke-[1.5px] text-amber-600 dark:text-amber-400" />
                      </div>
                      <div>
                        <h3 className="text-base font-medium text-slate-900 dark:text-slate-100">
                          Set up billing first
                        </h3>
                        <p className="text-sm text-slate-900/60 dark:text-slate-100/60">
                          Complete these steps in the Update dashboard
                        </p>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {[
                        {
                          step: "1",
                          title: "Connect Stripe",
                          description: "Go to your Update project settings and connect your Stripe account to handle payments securely."
                        },
                        {
                          step: "2", 
                          title: "Create an entitlement",
                          description: "Add an entitlement like \"pro\" that will be used to control access to premium features in your app."
                        },
                        {
                          step: "3",
                          title: "Create a product", 
                          description: "Create a product in your Update dashboard and connect it to the entitlement you created."
                        },
                        {
                          step: "4",
                          title: "Add pricing",
                          description: "Configure your pricing tiers for the product to define what users will pay."
                        }
                      ].map((item) => (
                        <div key={item.step} className="flex gap-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-sm font-medium text-slate-900 dark:bg-slate-700 dark:text-slate-100">
                            {item.step}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-slate-900 dark:text-slate-100">{item.title}</h4>
                            <p className="text-sm text-slate-900/60 dark:text-slate-100/60 mt-1">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex justify-center">
                      <Button asChild className="bg-slate-900 text-slate-50 hover:bg-slate-900/90 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-100/90">
                        <a href="https://update.dev/dashboard" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                          Go to Update Dashboard
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                  
                  {/* Background Grid Pattern */}
                  <div 
                    className="absolute h-full w-full opacity-30"
                    style={{
                      backgroundImage: `
                        linear-gradient(to right, rgba(148, 163, 184, 0.3) 1px, transparent 1px),
                        linear-gradient(to bottom, rgba(148, 163, 184, 0.3) 1px, transparent 1px)
                      `,
                      backgroundSize: '24px 24px'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full -m-6">
      <PageHeader 
        title="Subscriptions" 
        description="Manage your subscription plans"
      />
      
      <div className="flex h-full w-full bg-slate-100 px-6 py-8 dark:bg-black">
        <div className="z-10 mx-auto flex h-full w-full max-w-screen-xl gap-12">
          <div className="flex w-full flex-col rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-black">
            
            {/* Header Section */}
            <div className="flex w-full flex-col rounded-lg p-6">
              <div className="flex flex-col gap-2">
                <h2 className="text-xl font-medium text-slate-900 dark:text-slate-100">
                  Active Subscriptions
                </h2>
                <p className="text-sm font-normal text-slate-900/60 dark:text-slate-100/60">
                  Overview of your current subscription plans
                </p>
              </div>
            </div>
            
            {/* Divider */}
            <div className="flex w-full px-6">
              <div className="w-full border-b border-slate-200 dark:border-slate-800" />
            </div>
            
            {/* Subscriptions Content */}
            <div className="relative mx-auto flex w-full flex-col p-6 space-y-6">
              {data.subscriptions.map((subscription, index) => {
                const getStatusIcon = () => {
                  if (subscription.status === "active" && !subscription.cancel_at_period_end) {
                    return <CheckCircle2 className="h-5 w-5 text-green-500" />;
                  } else if (subscription.status === "active" && subscription.cancel_at_period_end) {
                    return <Clock className="h-5 w-5 text-yellow-500" />;
                  } else if (subscription.status === "past_due") {
                    return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
                  } else {
                    return <XCircle className="h-5 w-5 text-red-500" />;
                  }
                };

                const getStatusText = () => {
                  if (subscription.status === "active" && !subscription.cancel_at_period_end) {
                    return "Active";
                  } else if (subscription.status === "active" && subscription.cancel_at_period_end) {
                    return "Cancelling at period end";
                  } else if (subscription.status === "past_due") {
                    return "Past due";
                  } else {
                    return "Inactive";
                  }
                };

                return (
                  <div key={index} className="relative flex flex-col gap-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-900/20 bg-white dark:border-slate-100/20 dark:bg-slate-950">
                        <CreditCard className="h-5 w-5 stroke-[1.5px] text-slate-900/60 dark:text-slate-100/60" />
                      </div>
                      <h3 className="text-base font-medium text-slate-900 dark:text-slate-100">
                        {subscription.product.name}
                      </h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-900/60 dark:text-slate-100/60">Description</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{subscription.product.description}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-900/60 dark:text-slate-100/60">Price</span>
                        <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                          ${(subscription.price.unit_amount / 100).toFixed(2)} per {subscription.price.interval}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-900/60 dark:text-slate-100/60">Status</span>
                        <div className="flex items-center gap-2">
                          {getStatusIcon()}
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {getStatusText()}
                          </span>
                        </div>
                      </div>
                      <SubscriptionActions subscription={subscription} />
                    </div>
                  </div>
                );
              })}
              
              {/* Raw Data Section */}
              <div className="relative flex flex-col gap-4 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 p-6 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-base font-medium text-slate-900 dark:text-slate-100">
                  Raw Data
                </h3>
                <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
                  <pre className="text-xs text-slate-900 dark:text-slate-100 overflow-x-auto">
                    {JSON.stringify(data.subscriptions, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
