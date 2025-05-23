import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Check, Star, Info } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] px-4 py-16 bg-gradient-to-b from-background to-background/80">
      <div className="w-full max-w-5xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center space-y-6 py-16">
          {/* Tech Stack Badges */}
          <div className="flex flex-wrap justify-center gap-3 mb-4">
            {["Next.js", "Stripe", "Supabase", "Update"].map((tech) => (
              <span 
                key={tech} 
                className="px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
          
          {/* Main Hero Headline */}
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
              Payment Ready Saas
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl text-muted-foreground max-w-2xl">
            Launch your SaaS product in minutes with our fully integrated stack.
            Everything you need to start accepting payments and growing your business.
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mt-8">
            <Button size="lg" className="gap-2 h-12 px-6" asChild>
              <a href="/sign-up">
                Sign up
                <ArrowRight size={18} />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 h-12 px-6" asChild>
              <a href="https://www.youtube.com/watch?v=0qrs_kQAK7U" target="_blank" rel="noopener noreferrer">
                <Play size={18} className="fill-current" />
                Watch demo
              </a>
            </Button>
          </div>
        </div>
        
        {/* Features Section */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <FeatureCard 
            title="Complete Auth Flow" 
            description="User authentication with magic links, social providers, and more."
          />
          <FeatureCard 
            title="Subscription Payments" 
            description="Accept recurring payments with Stripe integration out of the box."
          />
          <FeatureCard 
            title="Database Ready" 
            description="Powered by Supabase for reliable, scalable data storage."
          />
        </div>
        
        {/* Social Proof Section */}
        <div className="mt-24 text-center">
          <h2 className="text-xl font-medium mb-8">Trusted by developers worldwide</h2>
          <div className="flex justify-center items-center gap-12 opacity-70 flex-wrap">
            {["Company 1", "Company 2", "Company 3", "Company 4"].map((company) => (
              <span key={company} className="text-lg font-semibold">{company}</span>
            ))}
          </div>
        </div>

        {/* Testimonials Section */}
        <div className="mt-32 w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Don&apos;t just take our word for it. Here&apos;s what developers and founders are saying about our platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <TestimonialCard 
              quote="This platform saved us months of development time. We were able to launch our MVP in just two weeks!"
              author="Sarah Johnson"
              role="CTO at TechStart"
              rating={5}
            />
            <TestimonialCard 
              quote="The integration between Stripe and Supabase is seamless. I&apos;ve never seen anything this well thought out."
              author="Michael Chen"
              role="Indie Developer"
              rating={5}
            />
            <TestimonialCard 
              quote="Customer support is incredible. Any time I had an issue, the team was there to help right away."
              author="Alex Rodriguez"
              role="Founder at DataFlow"
              rating={4}
            />
            <TestimonialCard 
              quote="As a solo founder, this stack gave me everything I needed to validate my idea without hiring a team."
              author="Lisa Williams"
              role="Creator of TaskPro"
              rating={5}
            />
          </div>
        </div>

        {/* Pricing Section */}
        <div className="mt-32 w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Start for free, upgrade when you&apos;re ready. All plans include a 14-day trial.
            </p>
          </div>
          
          {/* Sample Pricing Note */}
          <div className="bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-10 flex items-center gap-3 max-w-3xl mx-auto">
            <Info size={20} className="text-blue-600 dark:text-blue-400 flex-shrink-0" />
            <div className="text-sm">
              <strong className="block text-blue-800 dark:text-blue-300 font-medium text-left">
                Sample Pricing Configuration
              </strong>
              <span className="text-blue-700 dark:text-blue-400 mt-1 text-left block">
                This is sample pricing. To configure your own plans and pricing, go to the{" "}
                <a 
                  href="https://update.dev/dashboard" 
                  className="font-medium underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Billing section in the Update dashboard
                </a>.
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <PricingCard 
              title="Starter"
              price="$0"
              description="Perfect for side projects and experiments"
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
        </div>

        {/* FAQ Section */}
        <div className="mt-32 mb-16 w-full">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions about our platform.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
            <FAQItem 
              question="What payment methods do you support?" 
              answer="Through Stripe, we support all major credit cards, ACH, and various local payment methods depending on your country."
            />
            <FAQItem 
              question="How do I get support?" 
              answer="We offer community support via Discord for all users, and priority email support for Pro and Enterprise customers."
            />
          </div>
        </div>
        
        {/* CTA Section */}
        <div className="mt-20 mb-20 w-full rounded-2xl bg-primary/10 p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
            Join thousands of developers building amazing products with our platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button size="lg" className="gap-2 h-12 px-6" asChild>
              <a href="/sign-up">
                Sign up for free
                <ArrowRight size={18} />
              </a>
            </Button>
            <Button size="lg" variant="outline" className="gap-2 h-12 px-6" asChild>
              <a href="https://www.youtube.com/watch?v=0qrs_kQAK7U" target="_blank" rel="noopener noreferrer">
                <Play size={18} className="fill-current" />
                Watch demo
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="border rounded-xl p-6 bg-card hover:shadow-md transition-shadow">
      <span className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
        <span className="w-6 h-6 bg-primary rounded-md"></span>
      </span>
      <h3 className="text-xl font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

// Testimonial Card Component
function TestimonialCard({ quote, author, role, rating }: { 
  quote: string; 
  author: string; 
  role: string;
  rating: number;
}) {
  return (
    <div className="border rounded-xl p-6 bg-card hover:shadow-md transition-shadow">
      <div className="flex mb-4">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            size={18}
            className={`${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} mr-1`}
          />
        ))}
      </div>
      <p className="italic mb-6">&quot;{quote}&quot;</p>
      <p className="font-medium">{author}</p>
      <p className="text-sm text-muted-foreground">{role}</p>
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
        <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground dark:text-primary-foreground text-sm font-medium py-1 px-4 rounded-full">
          Most Popular
        </span>
      )}
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="mb-4">
        <span className="text-3xl font-bold">{price}</span>
        <span className="text-muted-foreground ml-1">{period}</span>
      </p>
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
          <div key={index} className="flex items-center">
            <Check size={16} className="text-primary mr-3 flex-shrink-0" />
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
