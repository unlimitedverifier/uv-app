import { Button } from "@/components/ui/button";
import { Check, Info } from "lucide-react";

export default async function PricingPage() {

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-16 bg-gradient-to-b from-background to-background/80">
      <div className="w-full max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Start for free, upgrade when you&apos;re ready. All plans include a 14-day trial.
          </p>
        </div>
        
        {/* Sample Pricing Note */}
        <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-10 flex items-start gap-3">
          <Info size={20} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm text-blue-800 dark:text-blue-300 font-medium">
              Sample Pricing Configuration
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-400 mt-1">
              This is sample pricing. To configure your own plans and pricing, go to the{" "}
              <a 
                href="https://update.dev/dashboard" 
                className="font-medium underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                Billing section in the Update dashboard
              </a>.
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PricingCard 
            title="Starter"
            price="$0"
            description="Perfect for side projects and experimentss"
            features={[
              "Up to 100 users",
              "Basic authentication",
              "Community support",
              "1GB database storage"
            ]}
            buttonText="Get Started"
            highlighted={false}
          />
          <PricingCard 
            title="Pro"
            price="$29"
            period="/month"
            description="For growing businesses and teams"
            features={[
              "Unlimited users",
              "Social auth providers",
              "Priority support",
              "10GB database storage",
              "Custom domains",
              "Stripe payment integration"
            ]}
            buttonText="Start Free Trial"
            highlighted={true}
          />
          <PricingCard 
            title="Enterprise"
            price="Custom"
            description="For large-scale applications"
            features={[
              "Unlimited everything",
              "SSO authentication",
              "Dedicated support",
              "SLA guarantees",
              "Custom integrations",
              "On-premise options"
            ]}
            buttonText="Contact Sales"
            highlighted={false}
          />
        </div>
        
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 text-left max-w-4xl mx-auto">
            <FAQItem 
              question="How long does it take to set up?" 
              answer="Most users are up and running in less than 15 minutes. Our starter template includes all the necessary configuration for Stripe, Supabase, and Next.js."
            />
            <FAQItem 
              question="Can I use my own database?" 
              answer="Yes, while we provide Supabase integration out of the box, you can customize the platform to work with any database of your choice."
            />
            <FAQItem 
              question="Do you offer refunds?" 
              answer="We offer a 30-day money-back guarantee. If you&apos;re not satisfied with our product, just reach out to our support team."
            />
            <FAQItem 
              question="Is there a free tier?" 
              answer="Yes, our Starter plan is free forever with generous limits. You can upgrade to a paid plan as your needs grow."
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Pricing Card Component
function PricingCard({ 
  title, 
  price, 
  period = "", 
  description, 
  features, 
  buttonText,
  highlighted
}: { 
  title: string; 
  price: string;
  period?: string;
  description: string;
  features: string[];
  buttonText: string;
  highlighted: boolean;
}) {
  return (
    <div className={`border rounded-xl p-8 ${highlighted ? "border-primary ring-2 ring-primary/20 shadow-lg" : ""} bg-card relative`}>
      {highlighted && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground dark:text-primary-foreground text-sm font-medium py-1 px-4 rounded-full">
          Most Popular
        </div>
      )}
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <div className="flex items-end mb-4">
        <span className="text-3xl font-bold">{price}</span>
        <span className="text-muted-foreground ml-1">{period}</span>
      </div>
      <p className="text-muted-foreground mb-6">{description}</p>
      <Button 
        variant={highlighted ? "default" : "outline"} 
        className="w-full mb-6"
        asChild
      >
        <a href="/sign-in">
          {buttonText}
        </a>
      </Button>
      <div className="space-y-3">
        {features.map((feature, index) => (
          <div key={index} className="flex items-start">
            <Check size={16} className="text-primary mr-3 mt-1 flex-shrink-0" />
            <span>{feature}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// FAQ Item Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <div className="border-b border-border pb-4">
      <h4 className="text-lg font-medium mb-2">{question}</h4>
      <p className="text-muted-foreground">{answer}</p>
    </div>
  );
} 