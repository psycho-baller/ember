const MissionSection = () => {
  return (
    <section id="mission" className="relative py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground">
              University is about{" "}
              <span className="bg-linear-to-r from-primary to-accent-custom bg-clip-text text-transparent">
                finding your people
              </span>
            </h2>
            <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
              <p>
                Whether you&apos;re looking for <strong className="text-foreground">friends, study buddies, mentors, collaborators, or even a life partner</strong>—I&apos;ve got you covered.
              </p>
              <p>
                I get to know you through our chat, create your profile, and find perfect matches on campus. When I find someone great, I&apos;ll share your profiles with each other (only if you both approve!) and set up a group chat.
              </p>
              <p className="text-primary font-medium">
                It&apos;s that simple. One warm intro, endless possibilities.
              </p>
            </div>
          </div>

          <div className="relative">
            <div className="glass-card p-8 rounded-3xl transform rotate-3 hover:rotate-0 transition-transform duration-500">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-linear-to-r from-primary to-primary-glow"></div>
                  <div>
                    <div className="h-3 bg-muted rounded w-24"></div>
                    <div className="h-2 bg-muted/60 rounded w-16 mt-1"></div>
                  </div>
                </div>
                <div className="bg-background/90 border border-primary/20 p-4 rounded-2xl">
                  <p className="text-sm text-foreground font-medium">
                    &quot;I&apos;m looking for someone to start a tech startup with...&quot;
                  </p>
                </div>
                <div className="bg-background/90 border border-accent-custom/20 p-4 rounded-2xl">
                  <p className="text-sm text-foreground font-medium">
                    &quot;I&apos;ve found 3 people in Software Engineering who are also interested in AI and have startup experience!&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MissionSection;