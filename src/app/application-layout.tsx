"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Menu, X, ChevronDown, LogOut, User, Settings } from "lucide-react";
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
// import { useXStatus } from "@/hooks/useXStatus";
// import { ThemeToggle } from "@/components/reusables/ThemeToggle";
import DisplayUserProfile from "@/components/reusables/DisplayUserProfile";
import {
  NotificationProvider,
  // NotificationBell, // Commented out per requirements
} from "@/components/notifications";
import { DepositNotificationBanner } from "@/components/notifications/DepositNotificationBanner";

interface ApplicationLayoutProps {
  children: React.ReactNode;
}

// Navigation items moved to dropdown menu

export default function ApplicationLayout({
  children,
}: ApplicationLayoutProps) {
  const router = useRouter();
  const [leftPanelOpen, setLeftPanelOpen] = React.useState(false);
  const [isDesktopMenuOpen, setDesktopMenuOpen] = React.useState(false);
  const [isMobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  // Use existing auth infrastructure
  const { isAuthenticated, signOut } = useAuth();
  const { showAuthModal, closeAuthModal, openAuthModal } = useProtectedRoute();

  // Import useXStatus to check if user needs X linking
  // const { needsXLink } = useXStatus();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Handle X linking
  // const handleXLinkClick = async () => {
  //   if (needsXLink) {
  //     const { linkXAccount } = await import("@/services/x-auth.service");
  //     await linkXAccount();
  //   }
  // };

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
    <NotificationProvider>
      <div className="flex flex-col h-screen bg-gradient-to-br from-background via-background to-background/95">
        {/* Mobile Header */}
        <div className="md:hidden h-16 px-4 flex items-center justify-between bg-card/30 backdrop-blur-xl shadow-lg relative z-30">
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
            <Link href="/aidaos" className="flex items-center gap-2">
              {/* Avatar logo - commented out per requirements */}
              {/* <Image
                src="/logos/aibtcdev-avatar-1000px.png"
                alt="AIBTCDEV"
                width={28}
                height={28}
                className="flex-shrink-0 shadow-lg shadow-primary/20"
              /> */}
              <div className="flex flex-col items-center">
                <Image
                  src="/logos/aibtcdev-primary-logo-black-wide-1000px.png"
                  alt="AIBTCDEV"
                  width={100}
                  height={24}
                  className="h-6 w-auto flex-shrink-0 block dark:hidden"
                />
                <Image
                  src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
                  alt="AIBTCDEV"
                  width={100}
                  height={24}
                  className="h-6 w-auto flex-shrink-0 hidden dark:block"
                />
                <span className="text-[10px] text-muted-foreground mt-0.5 whitespace-nowrap">
                  The Bitcoin Coordination Network
                </span>
              </div>
            </Link>
          </div>

          {/* Mobile User Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Notification Bell - commented out per requirements */}
            {/* {isAuthenticated && (
              <div className="mr-2">
                <NotificationBell />
              </div>
            )} */}
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
                    {/* Mobile: Show only icon */}
                    <div className="w-6 h-6 rounded-full border border-white flex items-center justify-center">
                      <User className="w-3.5 h-3.5" />
                    </div>
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
                      handleNavigation("/account?tab=wallets", e);
                      setMobileMenuOpen(false);
                    }}
                    className="group flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground rounded-lg hover:bg-primary/10 focus:bg-primary/10 focus:text-primary transition-colors duration-200 ease-in-out cursor-pointer"
                  >
                    <User className="h-4 w-4" />
                    <span className="group-hover:text-white">Wallets</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />
                  <div className="px-3 py-2">
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
            {/* <ThemeToggle /> */}
          </div>
        </div>

        {/* Desktop Header - Hidden on mobile */}
        <div className="hidden md:grid grid-cols-3 h-24 items-center px-8 lg:px-16 bg-card/20 backdrop-blur-2xl shadow-lg relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-secondary/5 pointer-events-none" />

          {/* Left Section - Logo */}
          <div className="flex items-center gap-2 lg:gap-3 relative z-10 justify-start">
            <Link
              href="/aidaos"
              className="flex items-center gap-2 lg:gap-3 group"
            >
              <div className="flex items-center gap-2 lg:gap-3 transition-all duration-300 ease-in-out group-hover:scale-105">
                {/* Avatar logo - commented out per requirements */}
                {/* <div className="relative">
                  <Image
                    src="/logos/aibtcdev-avatar-1000px.png"
                    alt="AIBTCDEV"
                    width={28}
                    height={28}
                    className="lg:w-8 lg:h-8 shadow-lg shadow-primary/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/40"
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div> */}
                <div className="flex flex-col gap-1">
                  <Image
                    src="/logos/aibtcdev-primary-logo-black-wide-1000px.png"
                    alt="AIBTCDEV"
                    width={120}
                    height={28}
                    className="h-7 w-auto transition-all duration-300 group-hover:brightness-110 block dark:hidden"
                  />
                  <Image
                    src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
                    alt="AIBTCDEV"
                    width={120}
                    height={28}
                    className="h-7 w-auto transition-all duration-300 group-hover:brightness-110 hidden dark:block"
                  />
                  <span className="text-sm text-muted-foreground">
                    The Bitcoin Coordination Network
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Center Section - Empty */}
          <div className="flex justify-center items-center gap-6 relative z-10"></div>

          {/* Right Section - Navigation Links, BTC Balance Dropdown & Auth Button */}
          <div className="flex items-center gap-6 relative z-10 justify-end">
            <Link
              href="/how-it-works"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors duration-200"
            >
              How it works
            </Link>
            <Link
              href="/aibtc-charter"
              className="text-sm font-medium text-foreground/80 hover:text-foreground transition-colors duration-200"
            >
              AIBTC Charter
            </Link>
            {/* Notification Bell - commented out per requirements */}
            {/* {isAuthenticated && (
              <div className="mr-3">
                <NotificationBell />
              </div>
            )} */}
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
                    <DisplayUserProfile />
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
                      handleNavigation("/account?tab=settings", e);
                      setDesktopMenuOpen(false);
                    }}
                    className="group flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground rounded-lg hover:bg-primary/10 focus:bg-primary/10 focus:text-primary transition-colors duration-200 ease-in-out cursor-pointer"
                  >
                    <Settings className="h-4 w-4" />
                    <span className="group-hover:text-white">Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="my-1" />

                  <NetworkIndicator />

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
            {/* <ThemeToggle /> */}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex min-w-0 max-h-[calc(100vh-4rem)] md:max-h-[calc(100vh-6rem)] overflow-hidden">
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
                  <span className="text-lg font-bold text-foreground">
                    Menu
                  </span>
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

              {/* Navigation - Empty since items moved to dropdown */}
              <nav className="flex-1 px-4 py-6 relative z-10 overflow-y-auto">
                <div className="space-y-3">
                  <div className="text-center text-muted-foreground text-sm py-8">
                    Use the dropdown menu above to navigate
                  </div>
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
          redirectUrl={"/votes"}
        />

        {/* Deposit Notification Banner - Fixed Top Right */}
        {isAuthenticated && <DepositNotificationBanner />}
      </div>
    </NotificationProvider>
  );
}
