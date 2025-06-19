"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Boxes,
  Menu,
  X,
  FileText,
  Vote,
  ChevronDown,
  LogOut,
  User,
  Wallet,
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
import DisplayBtc from "@/components/reusables/DisplayBtc";
import { useAuth } from "@/hooks/useAuth";
import { useProtectedRoute } from "@/hooks/useProtectedRoute";
import { ThemeToggle } from "@/components/reusables/ThemeToggle";

interface ApplicationLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { id: "daos", name: "DAOs", href: "/daos", icon: Boxes },
  { id: "proposals", name: "Proposals", href: "/proposals", icon: FileText },
  { id: "votes", name: "Voting", href: "/votes", icon: Vote },
];

export default function ApplicationLayout({
  children,
}: ApplicationLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [leftPanelOpen, setLeftPanelOpen] = React.useState(false);

  // Use existing auth infrastructure
  const { isAuthenticated, signOut } = useAuth();
  const { showAuthModal, closeAuthModal, openAuthModal } = useProtectedRoute();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    window.location.reload();
  };

  // Handle navigation to protected routes
  const handleNavigation = async (href: string, e: React.MouseEvent) => {
    // Only intercept navigation to protected pages (account and votes)
    if (href === "/account" || href === "/votes") {
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
      <div className="md:hidden h-16 px-4 flex items-center justify-between bg-card/30 backdrop-blur-xl border-b border-border/20 shadow-lg relative z-30">
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
              className="rounded-lg flex-shrink-0 shadow-lg shadow-primary/20"
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-1 px-2 py-1 text-xs font-bold text-primary bg-transparent rounded-lg"
                >
                  <DisplayBtc />
                  <ChevronDown className="h-3 w-3 text-primary/70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-40 p-2 bg-background border border-border/20 rounded-xl shadow-lg"
              >
                <div className="px-3 py-2 border-b border-border/20">
                  <div className="text-xs font-medium text-muted-foreground">
                    Network Status
                  </div>
                  <div className="mt-1">
                    <NetworkIndicator />
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-destructive rounded-lg"
                >
                  <LogOut className="h-4 w-4" />
                  Sign out
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
                  className="lg:w-9 lg:h-9 rounded-xl shadow-lg shadow-primary/20 transition-all duration-300 group-hover:shadow-xl group-hover:shadow-primary/40"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-primary/20 to-secondary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
              <Image
                src="/logos/aibtcdev-primary-logo-black-wide-1000px.png"
                alt="AIBTCDEV"
                width={100}
                height={200}
                className="h-5 lg:h-6 w-auto transition-all duration-300 group-hover:brightness-110 block dark:hidden"
              />
              <Image
                src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
                alt="AIBTCDEV"
                width={100}
                height={200}
                className="h-5 lg:h-6 w-auto transition-all duration-300 group-hover:brightness-110 hidden dark:block"
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
                      : "text-primary hover:bg-primary/10 hover:shadow-md"
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
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-inter font-bold bg-transparent text-primary border border-primary/20 rounded-lg sm:rounded-xl hover:scale-105 hover:shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 ease-in-out motion-reduce:transition-none backdrop-blur-sm shadow-md"
                  aria-label="Bitcoin balance dropdown menu"
                >
                  <DisplayBtc />
                  <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-primary/70 transition-transform duration-200 ease-in-out group-data-[state=open]:rotate-180" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="center"
                className="w-64 p-2 bg-background/80 backdrop-blur-lg border border-border/20 rounded-xl shadow-2xl"
              >
                <div className="px-3 py-2 border-b border-border/20">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Total Agent Balance
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    <DisplayBtc />
                  </div>
                </div>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={(e) => handleNavigation("/account", e)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground rounded-lg hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-colors duration-200 ease-in-out cursor-pointer"
                >
                  <User className="h-4 w-4" />
                  <span>Account Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => handleNavigation("/deposit", e)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground rounded-lg hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary transition-colors duration-200 ease-in-out cursor-pointer"
                >
                  <Wallet className="h-4 w-4" />
                  <span>Deposit</span>
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
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-destructive rounded-lg hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive transition-colors duration-200 ease-in-out cursor-pointer"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // Show BTC Balance (non-clickable) and Auth Button when not authenticated
            <>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0 px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base font-inter font-bold bg-transparent text-primary border border-primary/20 rounded-lg sm:rounded-xl shadow-md backdrop-blur-sm">
                  <div className="text-sm sm:text-base font-inter font-bold text-primary tracking-tight">
                    <DisplayBtc />
                  </div>
                </div>
              </div>
              <div className="transition-transform duration-300 ease-in-out hover:scale-105 motion-reduce:transition-none">
                <AuthButton />
              </div>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex min-w-0 max-h-[calc(100vh-4rem)] overflow-hidden">
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
                  alt="AIBTCDEV"
                  width={24}
                  height={24}
                  className="rounded-lg shadow-lg shadow-primary/20"
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
        redirectUrl={pathname === "/votes" ? "/votes" : "/account"}
      />
    </div>
  );
}
