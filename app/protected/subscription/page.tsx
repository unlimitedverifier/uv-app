import SubscriptionActions from "@/components/subscription-actions";
import { Card } from "@/components/ui/card";
import { cn } from "@/utils/styles";
import { createUpdateClient } from "@/utils/update/server";
import { InfoIcon, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function Page() {    
  const client = await createUpdateClient();
  const { data, error } = await client.billing.getSubscriptions();

  if (error) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col">
          <h1 className="text-2xl font-medium">Subscriptions</h1>
          <p className="text-muted-foreground mt-2">
            Set up your subscription plans to enable premium features
          </p>
        </div>
        
        <Card className="p-6 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800">
          <div className="flex items-start gap-4">
            <InfoIcon className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800 dark:text-amber-400 mb-2">
                Set up billing first
              </h3>
              <p className="text-amber-700 dark:text-amber-300 mb-4">
                There was an error loading your subscriptions because you need to complete the following steps in the Update dashboard:
              </p>
              
              <div className="space-y-4">
                <div className="pl-5 border-l-2 border-amber-200 dark:border-amber-700">
                  <h4 className="font-medium text-amber-800 dark:text-amber-400">1. Connect Stripe</h4>
                  <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                    Go to your Update project settings and connect your Stripe account to handle payments securely.
                  </p>
                </div>
                
                <div className="pl-5 border-l-2 border-amber-200 dark:border-amber-700">
                  <h4 className="font-medium text-amber-800 dark:text-amber-400">2. Create an entitlement</h4>
                  <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                    Add an entitlement like &quot;pro&quot; that will be used to control access to premium features in your app.
                  </p>
                </div>
                
                <div className="pl-5 border-l-2 border-amber-200 dark:border-amber-700">
                  <h4 className="font-medium text-amber-800 dark:text-amber-400">3. Create a product</h4>
                  <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                    Create a product in your Update dashboard and connect it to the entitlement you created.
                  </p>
                </div>
                
                <div className="pl-5 border-l-2 border-amber-200 dark:border-amber-700">
                  <h4 className="font-medium text-amber-800 dark:text-amber-400">4. Add pricing</h4>
                  <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                    Configure your pricing tiers for the product to define what users will pay.
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <Button asChild>
                  <a href="https://update.dev/dashboard" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                    Go to Update Dashboard
                    <ExternalLink size={16} />
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </Card>
        
        <div className="text-sm text-muted-foreground">
          <p>
            Need more help? Check out the{" "}
            <a 
              href="https://update.dev/docs" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2"
            >
              Update Documentation
            </a>
            {" "}for detailed setup instructions.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-medium">Subscriptions</h1>
          <p className="text-muted-foreground mt-2">
            Manage your subscription plans
          </p>
        </div>
      </div>
      <div className="space-y-6">
        {data.subscriptions.map((subscription, index) => (
          <Card key={index}>
            <h2 className="font-medium">{subscription.product.name}</h2>
            <div className="grid gap-2 mt-2 text-sm">
              <div className="grid grid-cols-[150px_1fr]">
                <div className="text-muted-foreground">Plan description</div>
                <div>{subscription.product.description}</div>
              </div>
              <div className="grid grid-cols-[150px_1fr]">
                <div className="text-muted-foreground">Price</div>
                <div>
                  ${(subscription.price.unit_amount / 100).toFixed(2)} per{" "}
                  {subscription.price.interval}
                </div>
              </div>
              <div className="grid grid-cols-[150px_1fr]">
                <div className="text-muted-foreground">Status</div>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-2 h-2 rounded-full bg-green-500",
                      (subscription.status === "past_due" ||
                        subscription.cancel_at_period_end) &&
                        "bg-yellow-500",
                      subscription.status === "inactive" && "bg-red-500"
                    )}
                  ></div>
                  {subscription.status === "active" &&
                    !subscription.cancel_at_period_end &&
                    "Active"}
                  {subscription.status === "active" &&
                    subscription.cancel_at_period_end &&
                    "Cancelling at period end"}
                  {subscription.status === "past_due" && "Past due"}
                  {subscription.status === "inactive" && "Inactive"}
                </div>
              </div>
              <SubscriptionActions subscription={subscription} />
            </div>
          </Card>
        ))}
      </div>
      <div>
        <h3 className="text-lg font-medium">Raw Data</h3>
        <div className="mt-2 border p-4 rounded-lg">
          <pre>{JSON.stringify(data.subscriptions, null, 2)}</pre>
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 rounded-lg">
        <div className="flex items-start gap-3">
          <InfoIcon size={20} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-medium text-blue-800 dark:text-blue-300">Developer Resources</h4>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              Learn how to <a 
                href="https://update.dev/docs/reference/javascript/get-user-subscriptions" 
                className="font-medium underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                retrieve and manage user subscriptions with the Update API
              </a> in your own applications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
