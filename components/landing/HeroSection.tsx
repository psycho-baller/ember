import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import WhatsAppButton from "../WhatsAppButton";

const HeroSection = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
    };

    checkAuth();
  }, []);

  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
      <div className="relative z-10 text-center max-w-7xl mx-auto">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl md:text-7xl 2xl:text-8xl font-display font-bold mb-1 sm:mb-2 md:mb-4">
          I&apos;m Ember, your AI{" "}
            <span className="bg-linear-to-r from-primary to-accent-custom bg-clip-text text-transparent">
              university superconnector
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            {/* I bring you exactly who you&apos;re looking for at the */}
            {/* I go wherever you go to find you someone */}
            Let&apos;s chat and I&apos;ll connect you with exactly who you&apos;re looking for. Whether it&apos;s friends, clubs, group project buddies, or even a life partner, I got you covered.
          </p>
        </div>

        {isLoggedIn ? (
          <Button
            onClick={() => router.push('/profile')}
            size="lg"
            className="rounded-full px-8 py-6 text-base font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            Go to Profile
          </Button>
        ) : (
          <motion.div
            className="glass-card p-6 rounded-3xl max-w-md mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-center space-y-4">
              <h3 className="text-lg font-medium mb-2">🎉 Ready to connect?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Just send me a message on WhatsApp and I&apos;ll help you find exactly who you&apos;re looking for on campus!
              </p>
              <div className="flex justify-center flex-col">
                <WhatsAppButton
                  phoneNumber={process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER!}
                  message="Hi Ember! I'd like to connect with people on campus."
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                No signup required - just start chatting!
              </p>
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