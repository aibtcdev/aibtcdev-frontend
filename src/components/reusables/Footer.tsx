import * as React from "react";
import {
  DiscordLogoIcon,
  GitHubLogoIcon,
  GlobeIcon,
} from "@radix-ui/react-icons";
import { BsTwitterX } from "react-icons/bs";
import { Disclaimer } from "@/components/reusables/Disclaimer";
import { Button } from "@/components/ui/button";
import { NavigationMenuLink } from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

export function Footer() {
  return (
    <footer className="relative overflow-hidden">
      <div className="relative z-10 container flex flex-col justify-center items-center max-w-screen-xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        {/* Social Media Links with Enhanced Styling */}
        <div className="flex items-center gap-3">
          {socialLinks.map((link, index) => (
            <Button
              key={link.name}
              variant="ghost"
              size="icon"
              asChild
              className="h-12 w-12 rounded-2xl text-muted-foreground hover:text-foreground hover:bg-card/40 hover:scale-110 hover:shadow-lg transition-all duration-300 ease-in-out group backdrop-blur-sm border border-border/20 hover:border-border/40"
              style={{
                animationDelay: `${index * 0.1}s`,
              }}
            >
              <a
                href={link.href}
                rel="noopener noreferrer"
                target="_blank"
                className="relative"
              >
                <link.icon className="h-6 w-6 transition-all duration-300 group-hover:scale-110" />
                <span className="sr-only">{link.name}</span>

                {/* Subtle hover glow effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />
              </a>
            </Button>
          ))}
        </div>

        {/* Enhanced Disclaimer Container */}
        <div className="w-full max-w-4xl">
          <div className="p-6 rounded-2xl border border-border/20 hover:shadow-lg transition-all duration-300 hover:scale-[1.01]">
            <Disclaimer />
          </div>
        </div>

        {/* Footer Bottom with Enhanced Typography */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground/80">
            <span>© {new Date().getFullYear()} AIBTC</span>
            <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />
            <span>AI DAOs on Bitcoin</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Social media links configuration for cleaner code
const socialLinks = [
  {
    name: "GitHub",
    href: "https://github.com/aibtcdev",
    icon: GitHubLogoIcon,
  },
  {
    name: "Discord",
    href: "https://discord.gg/Z59Z3FNbEX",
    icon: DiscordLogoIcon,
  },
  {
    name: "Twitter",
    href: "https://x.com/aibtcdev",
    icon: BsTwitterX,
  },
  {
    name: "Website",
    href: "https://aibtc.dev",
    icon: GlobeIcon,
  },
];

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-2xl p-4 leading-none no-underline outline-none",
            "transition-all duration-300 ease-in-out hover:bg-card/30 hover:text-foreground hover:scale-105",
            "focus:bg-card/30 focus:text-foreground backdrop-blur-sm border border-border/20 hover:border-border/40"
          )}
          {...props}
        >
          <div className="text-sm font-semibold leading-none tracking-wide">
            {title}
          </div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground transition-colors duration-300">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
