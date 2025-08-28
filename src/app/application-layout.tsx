"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Boxes,
  Menu,
  X,
  Vote,
  ChevronDown,
  LogOut,
  User,
  Bot,
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
import { NetworkIndicator } from "@/components/reusables/NetworkIndicator";
import AuthButton from "@/components/home/AuthButton";
import { AuthModal } from "@/components/auth/AuthModal";
import { Footer } from "@/components/reusables/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { ThemeToggle } from "@/components/reusables/ThemeToggle";
import DisplayAgentAddress from "@/components/reusables/DisplayAgentAddress";
import AssetTracker from "@/components/reusables/AssetTracker";

interface ApplicationLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { id: "daos", name: "DAOs", href: "/daos", icon: Boxes },
  // {
  //   id: "proposals",
  //   name: "Contributions",
  //   href: "/proposals",
  //   icon: FileText,
  // },
  { id: "votes", name: "Voting", href: "/votes", icon: Vote },
  // {
  //   id: "playground",
  //   name: "Playground",
  //   href: "/evaluation",
  //   icon: FlaskConical,
  // },
];

export default function ApplicationLayout({
  children,
}: ApplicationLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [leftPanelOpen, setLeftPanelOpen] = React.useState(false);
  const [isDesktopMenuOpen, setDesktopMenuOpen] = React.useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Use existing auth infrastructure
  const { isAuthenticated, signOut } = useAuth();
  const { showAuthModal, closeAuthModal, openAuthModal } = useProtectedRoute();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Handle navigation to protected routes
  const handleNavigation = async (href: string, e: React.MouseEvent) => {
    // Only intercept navigation to protected pages (account and votes)
    if (
      href === "/account" ||
      href.startsWith("/account?") ||
      href === "/votes" ||
      href === "/evaluation" ||
      href === "/deposit"
    ) {
      e.preventDefault();

      if (!isAuthenticated) {
        // Show auth modal if not authenticated
        openAuthModal();
      } else {
        // Navigate to the page if authenticated
        router.push(href);
      }
    } else {
      router.push(href);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-background/95">
      {/* Mobile Header */}
      <div className="md:hidden h-14 px-4 flex items-center justify-between bg-card/30 backdrop-blur-xl border-b border-border/20 shadow-lg relative z-30">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLeftPanelOpen(!leftPanelOpen)}
          className="text-muted-foreground hover:text-foreground hover:bg-primary/10 hover:scale-105 rounded-xl h-10 w-10 p-0 transition-all duration-300 ease-in-out flex-shrink-0"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Mobile Logo - Centered */}
        <div className="flex-1 flex justify-center">
          <Link href="/daos" className="flex items-center gap-2">
            <Image
              src="/logos/aibtcdev-avatar-1000px.png"
              alt="AIBTCDEV"
              width={28}
              height={28}
              className="flex-shrink-0 shadow-lg shadow-primary/20"
            />
            <Image
              src="/logos/aibtcdev-primary-logo-black-wide-1000px.png"
              alt="AIBTCDEV"
              width={80}
              height={20}
              className="h-4 w-auto flex-shrink-0 block dark:hidden"
            />
            <Image
              src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
              alt="AIBTCDEV"
              width={80}
              height={20}
              className="h-4 w-auto flex-shrink-0 hidden dark:block"
            />
          </Link>
        </div>

        {/* Mobile User Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isAuthenticated ? (
            <DropdownMenu
              open={isMobileMenuOpen}
              onOpenChange={setMobileMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-primary bg-transparent rounded-lg"
                >
                  {/* <DisplayBtc /> */}
                  <DisplayAgentAddress />
                  <ChevronDown className="h-3 w-3 text-primary/70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-56 p-2 bg-background/80 backdrop-blur-lg border border-border/20 rounded-xl shadow-2xl"
              >
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={(e) => {
                    handleNavigation("/account?s", e);
                    setMobileMenuOpen(false);
                  }}
                  className="group flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground rounded-lg hover:bg-primary/10 focus:bg-primary/10 focus:text-primary transition-colors duration-200 ease-in-out cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  <span className="group-hover:text-white">Wallet</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <div className="px-3 py-2 border-y border-border/20">
                  <div className="text-xs font-medium text-muted-foreground">
                    Network Status
                  </div>
                  <div className="mt-1">
                    <NetworkIndicator />
                  </div>
                </div>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="group flex items-center gap-3 px-3 py-2 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors duration-200 ease-in-out cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="group-hover:text-white">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <AuthButton />
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Desktop Header - Hidden on mobile */}
      <div className="hidden md:grid grid-cols-3 h-16 items-center px-4 lg:px-6 bg-card/20 backdrop-blur-2xl border-b border-border/20 shadow-lg relative overflow-hidden">
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
                  width={28}
                  height={28}
                  className="lg:w-8 lg:h-8 shadow-lg shadow-primary/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/40"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <Image
                src="/logos/aibtcdev-primary-logo-black-wide-1000px.png"
                alt="AIBTCDEV"
                width={90}
                height={20}
                className="h-5 w-auto transition-all duration-300 group-hover:brightness-110 block dark:hidden"
              />
              <Image
                src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
                alt="AIBTCDEV"
                width={90}
                height={20}
                className="h-5 w-auto transition-all duration-300 group-hover:brightness-110 hidden dark:block"
              />
            </div>
          </Link>
        </div>

        {/* Center Section - Navigation  */}
        <nav className="flex justify-center relative z-10">
          <div className="inline-flex items-center gap-3">
            {navigation.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={(e) => handleNavigation(item.href, e)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-md transition-all duration-300 ease-in-out relative group whitespace-nowrap",
                    "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50",
                    isActive
                      ? "text-primary-foreground bg-primary shadow-lg hover:shadow-xl hover:shadow-primary/20"
                      : "text-primary hover:bg-primary/10 hover:shadow-md"
                  )}
                >
                  <div
                    className={cn(
                      "relative transition-all duration-300",
                      isActive ? "drop-shadow-sm" : "group-hover:scale-110"
                    )}
                  >
                    <item.icon className="h-4 w-4 relative z-10" />
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
                      "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300",
                      "bg-gradient-to-r from-primary/5 to-secondary/5"
                    )}
                  />
                </Link>
              );
            })}
          </div>
        </nav>

        {/* Right Section - BTC Balance Dropdown & Auth Button */}
        <div className="flex items-center gap-2 relative z-10 justify-end">
          {/* BTC Balance Dropdown (Only shown when user is authenticated) */}
          {isAuthenticated ? (
            <DropdownMenu
              open={isDesktopMenuOpen}
              onOpenChange={setDesktopMenuOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-3 py-2 text-sm font-inter font-bold bg-transparent hover:bg-primary rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 ease-in-out motion-reduce:transition-none backdrop-blur-sm shadow-md"
                  aria-label="Bitcoin balance dropdown menu"
                >
                  {/* <DisplayBtc /> */}
                  <DisplayAgentAddress />
                  <ChevronDown className="h-3 w-3 transition-transform duration-200 ease-in-out" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-64 p-2 bg-background/80 backdrop-blur-lg border border-border/20 rounded-xl shadow-2xl"
              >
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={(e) => {
                    handleNavigation("/account?tab=wallets", e);
                    setDesktopMenuOpen(false);
                  }}
                  className="group flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground rounded-lg hover:bg-primary/10 focus:bg-primary/10 focus:text-primary transition-colors duration-200 ease-in-out cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  <span className="group-hover:text-white">Wallets</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    handleNavigation("/account?tab=agent-settings", e);
                    setDesktopMenuOpen(false);
                  }}
                  className="group flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground rounded-lg hover:bg-primary/10 focus:bg-primary/10 focus:text-primary transition-colors duration-200 ease-in-out cursor-pointer"
                >
                  <Bot className="h-4 w-4" />
                  <span className="group-hover:text-white">Agent Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <div className="px-3 py-2 border-y border-border/20">
                  <div className="text-xs font-medium text-muted-foreground">
                    Network Status
                  </div>
                  <div className="mt-1">
                    <NetworkIndicator />
                  </div>
                </div>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={() => {
                    handleSignOut();
                    setDesktopMenuOpen(false);
                  }}
                  className="group flex items-center gap-3 px-3 py-2 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors duration-200 ease-in-out cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="group-hover:text-white">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="transition-transform duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none">
              <AuthButton />
            </div>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Asset Tracker Banner - Only shown when user is authenticated */}
      {isAuthenticated && <AssetTracker />}

      {/* Main Content */}
      <div className="flex-1 flex min-w-0 max-h-[calc(100vh-3.5rem)] md:max-h-[calc(100vh-4rem)] overflow-hidden">
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

            {/* Sidebar Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/20 relative z-10">
              <div className="flex items-center gap-3">
                <Image
                  src="/logos/aibtcdev-avatar-1000px.png"
                  alt="AIBTC"
                  width={24}
                  height={24}
                  className="shadow-lg shadow-primary/20"
                />
                <span className="text-lg font-bold text-foreground">Menu</span>
              </div>
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
            <nav className="flex-1 px-4 py-6 relative z-10 overflow-y-auto">
              <div className="space-y-3">
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
                        "group flex items-center gap-4 px-4 py-4 text-base font-semibold rounded-xl transition-all duration-300 ease-in-out relative overflow-hidden hover:scale-[1.02]",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-xl scale-[1.02] hover:shadow-2xl"
                          : "text-primary hover:bg-primary/10 hover:shadow-lg"
                      )}
                    >
                      <div
                        className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 relative z-10 flex-shrink-0",
                          isActive
                            ? "bg-primary-foreground/20 shadow-lg"
                            : "bg-muted/30 group-hover:bg-primary/20 group-hover:scale-110"
                        )}
                      >
                        <item.icon
                          className={cn(
                            "h-6 w-6 transition-all duration-300",
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
                        <div className="absolute right-4 w-3 h-3 bg-primary-foreground rounded-full shadow-lg animate-pulse" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </nav>
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
        onClose={closeAuthModal}
        redirectUrl={
          pathname === "/votes"
            ? "/votes"
            : pathname === "/evaluation"
              ? "/evaluation"
              : "/account"
        }
      />
    </div>
  );
}
