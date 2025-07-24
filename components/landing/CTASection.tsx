import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const CTASection = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.endsWith("@ucalgary.ca")) {
      toast({
        title: "Invalid Email",
        description: "Please use your @ucalgary.ca email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setIsSubmitted(true);
    
    try {
      // TODO: Connect to Supabase
      toast({
        title: "Welcome to Orbit! 🚀",
        description: "You're on the waitlist. We'll send you an email soon!",
      });
      setEmail("");
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsSubmitted(false);
    }
  };

  return (
    <section className="relative py-24 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="glass-card p-12 rounded-3xl">
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">
            Ready to find your{" "}
            <span className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent">
              perfect people
            </span>
            ?
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Be the first to find your people on campus. Sign up with your @ucalgary.ca email.
          </p>
          
          <motion.form 
            onSubmit={handleSubmit} 
            className="max-w-lg mx-auto"
            animate={isSubmitted ? { scale: 0.98, opacity: 0.8 } : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center bg-background/50 backdrop-blur-sm rounded-full border border-border/50 p-1 max-w-md mx-auto">
              <Input
                type="email"
                placeholder="your@ucalgary.ca"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 border-0 bg-transparent text-sm px-4 py-2 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                required
              />
              <Button
                type="submit"
                disabled={isLoading}
                size="sm"
                className="rounded-full px-6 py-2 text-sm font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isLoading ? "..." : "Join"}
              </Button>
            </div>
          </motion.form>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Free to join
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              UCalgary students only
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
              Launching Fall 2024
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;