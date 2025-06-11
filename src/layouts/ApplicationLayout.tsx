"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Users,
  Boxes,
  Menu,
  X,
  FileText,
  Vote,
  Bitcoin,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import Image from "next/image";
import { supabase } from "@/utils/supabase/client";
import { NetworkIndicator } from "@/components/reusables/NetworkIndicator";
import AuthButton from "@/components/home/AuthButton";
import { AuthModal } from "@/components/auth/AuthModal";
import { Footer } from "@/components/reusables/Footer";
import DisplayBtc from "@/components/reusables/DisplayBtc";

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
      {/* Mobile Header - Only Menu, Logo, and BTC Balance */}
      <div className="md:hidden h-16 px-4 flex items-center justify-between bg-card/30 backdrop-blur-xl border-b border-border/20 shadow-lg">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:scale-105 rounded-xl h-10 w-10 p-0 transition-all duration-300 ease-in-out"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile Logo */}
        <Link href="/daos" className="flex items-center gap-2">
          <Image
            src="/logos/aibtcdev-avatar-1000px.png"
            alt="AIBTCDEV"
            width={28}
            height={28}
            className="rounded-lg"
          />
          <Image
            src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
            alt="AIBTCDEV"
            width={80}
            height={160}
            className="h-4 w-auto"
          />
        </Link>

        {/* Mobile BTC Balance Only */}
        <div className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg border border-primary/20">
          <div className="relative">
            <Bitcoin className="h-4 w-4 text-primary animate-pulse" />
            <div className="absolute inset-0 bg-primary/30 rounded-full scale-150 blur-sm animate-pulse" />
          </div>
          <div className="text-sm font-bold text-primary">
            <DisplayBtc />
          </div>
        </div>
      </div>

      {/* Desktop Header */}
      <div className="hidden md:grid grid-cols-3 h-16 lg:h-20 items-center px-4 lg:px-6 xl:px-8 bg-card/20 backdrop-blur-2xl border-b border-border/20 shadow-lg relative overflow-hidden">
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

        {/* Left Section - Logo */}
        <div className="flex items-center gap-2 lg:gap-3 relative z-10 justify-start">
          <Link href="/daos" className="flex items-center gap-2 lg:gap-3 group">
            <div className="flex items-center gap-2 lg:gap-3 transition-all duration-300 ease-in-out group-hover:scale-105">
              <div className="relative">
                <Image
                  src="/logos/aibtcdev-avatar-1000px.png"
                  alt="AIBTCDEV"
                  width={32}
                  height={32}
                  className="lg:w-9 lg:h-9 rounded-xl shadow-md transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/20"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <Image
                src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
                alt="AIBTCDEV"
                width={100}
                height={200}
                className="h-5 lg:h-6 w-auto transition-all duration-300 group-hover:brightness-110"
              />
            </div>
          </Link>
        </div>

        {/* Center Section - Navigation  */}
        <nav className="flex justify-center relative z-10">
          <div className="inline-flex items-center gap-1 lg:gap-2">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavigation(item.href, e)}
                  className={cn(
                    "flex items-center gap-2 lg:gap-3 px-3 lg:px-4 xl:px-5 py-2 lg:py-3 text-xs lg:text-sm font-semibold rounded-xl lg:rounded-2xl transition-all duration-300 ease-in-out relative group whitespace-nowrap",
                    "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50",
                    isActive
                      ? "text-primary-foreground bg-primary shadow-lg hover:shadow-xl hover:shadow-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/30 hover:shadow-md"
                  )}
                >
                  <div
                    className={cn(
                      "relative transition-all duration-300",
                      isActive ? "drop-shadow-sm" : "group-hover:scale-110"
                    )}
                  >
                    <item.icon className="h-4 w-4 lg:h-5 lg:w-5 relative z-10" />
                    {isActive && (
                      <div className="absolute inset-0 bg-primary-foreground/20 rounded-full scale-150 blur-sm" />
                    )}
                  </div>

                  <span
                    className={cn(
                      "font-medium tracking-wide transition-all duration-300 hidden sm:inline",
                      isActive
                        ? "text-primary-foreground"
                        : "group-hover:tracking-wider"
                    )}
                  >
                    {item.name}
                  </span>

                  {/* Active indicator */}
                  {isActive && (
                    <>
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-primary-foreground rounded-full shadow-sm" />
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-8 h-0.5 bg-primary-foreground/20 rounded-full blur-sm" />
                    </>
                  )}

                  {/* Hover glow effect */}
                  <div
                    className={cn(
                      "absolute inset-0 rounded-xl lg:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                      "bg-gradient-to-r from-primary/5 to-secondary/5"
                    )}
                  />
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Right Section - BTC Balance Dropdown & Auth Button */}
        <div className="flex items-center gap-2 lg:gap-4 relative z-10 justify-end">
          {/* BTC Balance Dropdown (Only shown when user is authenticated) */}
          {hasUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-3 bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-primary/20 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 text-primary font-bold"
                >
                  <div className="relative">
                    <Bitcoin className="h-4 w-4 lg:h-5 lg:w-5 text-primary animate-pulse" />
                    <div className="absolute inset-0 bg-primary/30 rounded-full scale-150 blur-md animate-pulse" />
                  </div>
                  <div className="text-sm lg:text-base font-bold text-primary">
                    <DisplayBtc />
                  </div>
                  <ChevronDown className="h-3 w-3 lg:h-4 lg:w-4 text-primary/70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-56 lg:w-64">
                <div className="px-3 py-2 border-b border-border/20">
                  <div className="text-xs lg:text-sm font-medium text-muted-foreground">
                    Network Status
                  </div>
                  <div className="mt-1">
                    <NetworkIndicator />
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Show BTC Balance (non-clickable) and Auth Button when not authenticated
            <>
              <div className="flex items-center gap-2 px-3 lg:px-4 py-2 lg:py-3 bg-gradient-to-r from-primary/20 to-secondary/20 backdrop-blur-sm rounded-xl lg:rounded-2xl border border-primary/20 shadow-lg">
                <div className="flex items-center gap-1 lg:gap-2">
                  <div className="relative">
                    <Bitcoin className="h-4 w-4 lg:h-5 lg:w-5 text-primary animate-pulse" />
                    <div className="absolute inset-0 bg-primary/30 rounded-full scale-150 blur-md animate-pulse" />
                  </div>
                  <div className="text-sm lg:text-base font-bold text-primary">
                    <DisplayBtc />
                  </div>
                </div>
              </div>
              <div className="transition-transform duration-300 hover:scale-105">
                <AuthButton />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-w-0 max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-4rem)] lg:max-h-[calc(100vh-5rem)] overflow-hidden">
        {/* Mobile Sidebar */}
        <aside
          className={cn(
            "md:hidden fixed inset-y-0 left-0 z-50",
            "w-80 bg-card/95 backdrop-blur-2xl border-r border-border/30 shadow-2xl",
            "transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
            leftPanelOpen ? "translate-x-0 shadow-3xl" : "-translate-x-full"
          )}
        >
          <div className="flex flex-col h-full relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

            {/* Close Button */}
            <div className="flex justify-end p-4 relative z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setLeftPanelOpen(false)}
                className="text-muted-foreground h-10 w-10 hover:bg-primary/10 hover:text-primary hover:scale-110 rounded-xl transition-all duration-300"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 pb-4 relative z-10">
              <div className="space-y-2">
                {navigation.map((item) => {
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
                        "group flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ease-in-out relative overflow-hidden hover:scale-105",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xl scale-105 hover:shadow-2xl"
                          : "text-muted-foreground hover:bg-background/60 hover:text-foreground hover:shadow-lg"
                      )}
                    >
                      <div
                        className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300 relative z-10",
                          isActive
                            ? "bg-primary-foreground/20 shadow-lg"
                            : "bg-muted/30 group-hover:bg-primary/20 group-hover:scale-110"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-5 w-5 transition-all duration-300",
                            isActive
                              ? "text-primary-foreground"
                              : "text-muted-foreground group-hover:text-primary"
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
                        <div className="absolute right-3 w-2 h-2 bg-primary-foreground rounded-full shadow-lg animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>

            {/* Mobile Footer with User Actions */}
            <div className="p-4 border-t border-border/20 bg-card/30 backdrop-blur-xl relative z-10">
              <div className="space-y-3">
                {/* Network Status */}
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-muted-foreground">
                    Network Status
                  </div>
                  <div className="text-xs">
                    <NetworkIndicator />
                  </div>
                </div>

                {/* User Actions */}
                {hasUser ? (
                  <div className="space-y-2">
                    <Button
                      onClick={() => {
                        handleSignOut();
                        setLeftPanelOpen(false);
                      }}
                      variant="ghost"
                      className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl py-3"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </Button>
                  </div>
                ) : (
                  <div className="w-full">
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
