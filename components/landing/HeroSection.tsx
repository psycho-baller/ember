import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useEmailSignup } from "@/hooks/use-email-signup";
import { motion } from "framer-motion";

const HeroSection = () => {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const { signUpWithEmail, isLoading, waitlistEmail } = useEmailSignup();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitted(true);
    await signUpWithEmail(email);
    setIsSubmitted(false);
  };

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-display font-bold mb-6">
            Hey there,{" "}
            <span className="bg-linear-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              I'm Orbit
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Your friendly AI superconnector at the University of Calgary. I help you find exactly who you're looking for through a single warm intro.
          </p>
        </div>

        {!waitlistEmail ? (
          <motion.div
            className="glass-card p-6 rounded-3xl max-w-md mx-auto mb-8"
            animate={isSubmitted ? { scale: 0.98, opacity: 0.8 } : { scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
          >
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="flex items-center bg-background/50 backdrop-blur-sm rounded-full border border-border/50 p-1">
                <Input
                  type="email"
                  placeholder="your@university.edu"
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
                  {isLoading ? "Sending..." : "Join"}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                Enter your University email to get started. We'll send you a magic link to sign in.
              </p>
            </form>
          </motion.div>
        ) : (
          <motion.div 
            className="glass-card p-6 rounded-3xl max-w-md mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">🎉 You're on the waitlist!</h3>
              <p className="text-sm text-muted-foreground">We'll notify you at {waitlistEmail} when we expand to your university.</p>
            </div>
          </motion.div>
        )}

        {/* <div className="animate-pulse-glow">
          <p className="text-lg text-muted-foreground">
            ✨ Launching at University of Calgary this Fall
          </p>
        </div> */}
      </div>
    </section>
  );
};

export default HeroSection;