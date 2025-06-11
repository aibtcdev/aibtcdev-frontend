"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Users, Boxes, Menu, X, FileText, Vote, Bitcoin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { supabase } from "@/utils/supabase/client";
import { NetworkIndicator } from "@/components/reusables/NetworkIndicator";
import AuthButton from "@/components/home/AuthButton";
import { AuthModal } from "@/components/auth/AuthModal";
import { Footer } from "@/components/reusables/Footer";
import { useBitcoinBlockHeight } from "@/hooks/useBitcoinBlockHeight";

interface ApplicationLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { id: "daos", name: "DAOs", href: "/daos", icon: Boxes },
  { id: "proposals", name: "Proposals", href: "/proposals", icon: FileText },
  { id: "votes", name: "Voting", href: "/votes", icon: Vote },
  { id: "profile", name: "Agent", href: "/profile", icon: Users },
];

export default function ApplicationLayout({
  children,
}: ApplicationLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [leftPanelOpen, setLeftPanelOpen] = React.useState(false);
  const [hasUser, setHasUser] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const { blockHeight } = useBitcoinBlockHeight();

  React.useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setHasUser(!!user);

      // If we're on a protected page and not authenticated, show the modal
      if ((pathname === "/profile" || pathname === "/votes") && !user) {
        setShowAuthModal(true);
      } else if ((pathname === "/profile" || pathname === "/votes") && user) {
        // If we're on a protected page and authenticated, make sure modal is closed
        setShowAuthModal(false);
      }
    };

    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const isAuthenticated = !!session?.user;
      setHasUser(isAuthenticated);

      // Close the auth modal when user becomes authenticated
      if (isAuthenticated) {
        setShowAuthModal(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/");
    window.location.reload();
  };

  // Handle navigation to protected routes
  const handleNavigation = async (href: string, e: React.MouseEvent) => {
    // Only intercept navigation to protected pages (profile and votes)
    if (href === "/profile" || href === "/votes") {
      e.preventDefault();

      // Check if user is authenticated
      const { data } = await supabase.auth.getUser();

      if (!data.user) {
        // Show auth modal if not authenticated
        setShowAuthModal(true);
      } else {
        // Navigate to the page if authenticated
        router.push(href);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-background/95">
      {/* Mobile Header */}
      <div className="md:hidden h-20 px-6 flex items-center justify-between bg-card/30 backdrop-blur-xl border-b border-border/20 shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:scale-105 rounded-2xl h-12 w-12 p-0 transition-all duration-300 ease-in-out hover:shadow-lg"
        >
          <Menu className="h-6 w-6" />
        </Button>
        <Link
          href="/daos"
          className="flex items-center gap-4 flex-1 justify-center"
        >
          <div className="flex items-center gap-3 transition-transform duration-300 ease-in-out hover:scale-105">
            <Image
              src="/logos/aibtcdev-avatar-1000px.png"
              alt="AIBTCDEV"
              width={32}
              height={32}
              className="flex-shrink-0 rounded-xl shadow-sm"
            />
            <Image
              src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
              alt="AIBTCDEV"
              width={120}
              height={240}
              className="h-6 w-auto"
            />
          </div>
        </Link>
        <div className="w-12"></div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:flex h-20 items-center px-8 bg-card/20 backdrop-blur-2xl border-b border-border/20 shadow-lg relative overflow-hidden">
        {/* Subtle gradient overlay for futuristic feel */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

        <div className="w-1/4 relative z-10">
          <Link href="/daos" className="flex items-center gap-3 group">
            <div className="flex items-center gap-3 transition-all duration-300 ease-in-out group-hover:scale-105 group-hover:drop-shadow-lg">
              <div className="relative">
                <Image
                  src="/logos/aibtcdev-avatar-1000px.png"
                  alt="AIBTCDEV"
                  width={36}
                  height={36}
                  className="rounded-xl shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/20"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <Image
                src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
                alt="AIBTCDEV"
                width={150}
                height={300}
                className="h-7 w-auto transition-all duration-300 group-hover:brightness-110"
              />
            </div>
          </Link>
        </div>

        {/* Desktop Navigation - Enhanced with Futuristic Styling */}
        <nav className="flex-1 flex justify-center relative z-10">
          <div className="inline-flex items-center gap-2">
            {navigation.map((item, index) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavigation(item.href, e)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-4 text-sm font-semibold rounded-2xl transition-all duration-300 ease-in-out relative group",
                    "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50",
                    isActive
                      ? "text-primary-foreground bg-primary shadow-lg hover:shadow-xl hover:shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/30 hover:shadow-md hover:backdrop-blur-sm"
                  )}
                  style={{
                    animationDelay: `${index * 0.1}s`,
                  }}
                >
                  {/* Icon with enhanced styling */}
                  <div
                    className={cn(
                      "relative transition-all duration-300",
                      isActive ? "drop-shadow-sm" : "group-hover:scale-110"
                    )}
                  >
                    <item.icon className="h-5 w-5 relative z-10" />
                    {isActive && (
                      <div className="absolute inset-0 bg-primary-foreground/20 rounded-full scale-150 blur-sm" />
                    )}
                  </div>

                  {/* Text with better typography */}
                  <span
                    className={cn(
                      "font-medium tracking-wide transition-all duration-300",
                      isActive
                        ? "text-primary-foreground"
                        : "group-hover:tracking-wider"
                    )}
                  >
                    {item.name}
                  </span>

                  {/* Active indicator with glow effect */}
                  {isActive && (
                    <>
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-primary-foreground rounded-full shadow-sm" />
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-12 h-1 bg-primary-foreground/20 rounded-full blur-sm" />
                    </>
                  )}

                  {/* Subtle hover glow effect */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                      "bg-gradient-to-r from-primary/5 to-secondary/5"
                    )}
                  />
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="w-1/4 flex justify-end items-center gap-6 relative z-10">
          <div className="text-muted-foreground flex items-center">
            <Bitcoin className="text-primary" />
            {blockHeight}
          </div>
          <div className="transition-all duration-300 hover:scale-105 flex flex-col items-end text-xs md:text-sm">
            <NetworkIndicator />
          </div>
          {hasUser ? (
            <Button
              onClick={handleSignOut}
              variant="ghost"
              className="text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-card/30 hover:scale-105 transition-all duration-300 ease-in-out rounded-2xl px-4 py-3 backdrop-blur-sm"
            >
              Sign out
            </Button>
          ) : (
            <div className="transition-transform duration-300 hover:scale-105">
              <AuthButton />
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-w-0 max-h-[calc(100vh-5rem)] overflow-hidden">
        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "md:hidden fixed inset-y-0 left-0 z-50",
            "w-80 bg-card/95 backdrop-blur-2xl border-r border-border/30 shadow-2xl",
            "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
            leftPanelOpen ? "translate-x-0 shadow-3xl" : "-translate-x-full"
          )}
        >
          {/* Mobile Sidebar Content */}
          <div className="flex flex-col h-full relative overflow-hidden">
            {/* Gradient overlay for mobile sidebar */}
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

            {/* Close Button */}
            <div className="flex justify-end p-6 relative z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftPanelOpen(false)}
                className="text-muted-foreground h-12 w-12 hover:bg-primary/10 hover:text-primary hover:scale-110 hover:shadow-lg rounded-2xl transition-all duration-300 ease-in-out"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-6 pb-6 relative z-10">
              <div className="space-y-3">
                {navigation.map((item, index) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.id}
                      href={item.href}
                      onClick={(e) => {
                        handleNavigation(item.href, e);
                        setLeftPanelOpen(false);
                      }}
                      className={cn(
                        "group flex items-center gap-4 px-6 py-4 text-base font-semibold rounded-2xl transition-all duration-300 ease-in-out relative overflow-hidden hover:scale-105",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xl scale-105 hover:shadow-2xl hover:shadow-primary/30"
                          : "text-muted-foreground hover:bg-background/60 hover:text-foreground hover:shadow-lg"
                      )}
                      style={{
                        animationDelay: `${index * 0.1}s`,
                      }}
                    >
                      {/* Background glow effect */}
                      <div
                        className={cn(
                          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                          isActive
                            ? "bg-primary/20"
                            : "bg-gradient-to-r from-primary/10 to-secondary/10"
                        )}
                      />

                      <div
                        className={cn(
                          "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 relative z-10",
                          isActive
                            ? "bg-primary-foreground/20 shadow-lg"
                            : "bg-muted/30 group-hover:bg-primary/20 group-hover:scale-110"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-6 w-6 transition-all duration-300",
                            isActive
                              ? "text-primary-foreground drop-shadow-sm"
                              : "text-muted-foreground group-hover:text-primary group-hover:scale-110"
                          )}
                        />
                      </div>

                      <span
                        className={cn(
                          "font-semibold tracking-wide transition-all duration-300 relative z-10",
                          isActive
                            ? "text-primary-foreground"
                            : "group-hover:tracking-wider"
                        )}
                      >
                        {item.name}
                      </span>

                      {isActive && (
                        <div className="absolute right-4 w-3 h-3 bg-primary-foreground rounded-full shadow-lg animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Mobile Sidebar Footer */}
            <div className="p-6 border-t border-border/20 bg-card/30 backdrop-blur-xl relative z-10">
              <div className="space-y-4">
                <div className="transition-transform duration-300 hover:scale-105">
                  <div className="flex items-start text-xs">
                    <NetworkIndicator />
                  </div>
                </div>
                {hasUser ? (
                  <Button
                    onClick={() => {
                      handleSignOut();
                      setLeftPanelOpen(false);
                    }}
                    variant="ghost"
                    className="w-full justify-center text-sm font-semibold text-muted-foreground hover:bg-card/30 hover:text-foreground hover:scale-105 transition-all duration-300 ease-in-out rounded-2xl py-3"
                  >
                    Sign out
                  </Button>
                ) : (
                  <div className="w-full transition-transform duration-300 hover:scale-105">
                    <AuthButton />
                  </div>
                )}
              </div>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-w-0 bg-background">
          <ScrollArea className="h-full w-full">
            <div className="min-h-full flex flex-col">
              <div className="flex-1">{children}</div>
              <Footer />
            </div>
          </ScrollArea>
        </main>

        {/* Mobile Overlay */}
        {leftPanelOpen && (
          <div
            className="md:hidden fixed inset-0 bg-background/60 backdrop-blur-md z-40 transition-all duration-300 ease-in-out"
            onClick={() => setLeftPanelOpen(false)}
          />
        )}
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        redirectUrl={pathname === "/votes" ? "/votes" : "/profile"}
      />
    </div>
  );
}
