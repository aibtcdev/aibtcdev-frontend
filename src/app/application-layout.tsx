"use client";

import * as React from "react";
import { Avatar } from "@/components/catalyst/avatar";
import {
  Dropdown,
  DropdownButton,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "@/components/catalyst/dropdown";
import {
  Navbar,
  NavbarItem,
  NavbarSection,
  NavbarSpacer,
} from "@/components/catalyst/navbar";
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from "@/components/catalyst/sidebar";
import { SidebarLayout } from "@/components/catalyst/sidebar-layout";
import {
  ArrowRightStartOnRectangleIcon,
  ChevronUpIcon,
  WrenchScrewdriverIcon,
  ChartBarIcon,
  UserGroupIcon,
  ChartPieIcon,
  ChatBubbleBottomCenterTextIcon,
  BuildingStorefrontIcon,
  DocumentTextIcon,
} from "@heroicons/react/16/solid";
import { usePathname } from "next/navigation";
import { useUserData } from "@/hooks/useUserData";
import { Wallet } from "lucide-react";
import SignOut from "@/components/auth/SignOut";
import Image from "next/image";
import { supabase } from "@/utils/supabase/client";

function AccountDropdownMenu({
  anchor,
  userData,
}: {
  anchor: "top start" | "bottom end";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  userData: any;
}) {
  return (
    <DropdownMenu className="min-w-64" anchor={anchor}>
      {userData?.role === "Admin" && (
        <DropdownItem href="/admin">
          <WrenchScrewdriverIcon />
          <DropdownLabel>Admin</DropdownLabel>
        </DropdownItem>
      )}
      <DropdownItem href="/profile">
        <Avatar initials="P" className="size-4" />
        <DropdownLabel>Profile Settings</DropdownLabel>
      </DropdownItem>
      <DropdownItem>
        <ArrowRightStartOnRectangleIcon />
        <SignOut />
      </DropdownItem>
    </DropdownMenu>
  );
}

export function ApplicationLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: userData, isLoading, refetch } = useUserData();

  // Add a listener for auth state changes
  React.useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          // Refetch user data when signed in or token is refreshed
          await refetch();
        }
      }
    );

    // Cleanup subscription
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [refetch]);

  const displayAddress = React.useMemo(() => {
    if (!userData?.stxAddress) return "";
    return `${userData.stxAddress.slice(0, 5)}...${userData.stxAddress.slice(
      -5
    )}`;
  }, [userData?.stxAddress]);

  const displayAgentAddress = React.useMemo(() => {
    if (!userData?.agentAddress) return "No agents assigned";
    return `${userData.agentAddress.slice(
      0,
      5
    )}...${userData.agentAddress.slice(-5)}`;
  }, [userData?.agentAddress]);

  const displayRole = React.useMemo(() => {
    if (
      !userData?.role ||
      userData.role === "" ||
      userData.role.toLowerCase() === "normal"
    ) {
      return "Normal User";
    }
    return userData.role;
  }, [userData?.role]);

  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                <Avatar src="/logos/aibtcdev-avatar-250px.png" square />
              </DropdownButton>
              <AccountDropdownMenu userData={userData} anchor="bottom end" />
            </Dropdown>
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <Avatar src="/logos/aibtcdev-avatar-250px.png" />
                <SidebarLabel>
                  <Image
                    src="/logos/aibtcdev-primary-logo-white-wide-1000px.png"
                    alt=""
                    width={400}
                    height={20}
                  />
                </SidebarLabel>
              </DropdownButton>
            </Dropdown>
          </SidebarHeader>

          <SidebarBody>
            <SidebarSection>
              <SidebarItem href="/chat" current={pathname === "/chat"}>
                <ChatBubbleBottomCenterTextIcon />
                <SidebarLabel>Chat</SidebarLabel>
              </SidebarItem>
              <SidebarItem
                href="/crews"
                current={pathname.startsWith("/crews")}
              >
                <UserGroupIcon />
                <SidebarLabel>Crews</SidebarLabel>
              </SidebarItem>
              <SidebarItem
                href="/marketplace"
                current={pathname.startsWith("/marketplace")}
              >
                <BuildingStorefrontIcon />
                <SidebarLabel>Marketplace</SidebarLabel>
              </SidebarItem>
              <SidebarItem
                href="/leaderboard"
                current={pathname.startsWith("/leaderboard")}
              >
                <ChartBarIcon />
                <SidebarLabel>Leaderboard</SidebarLabel>
              </SidebarItem>
              <SidebarItem
                href="/stats"
                current={pathname.startsWith("/stats")}
              >
                <ChartPieIcon />
                <SidebarLabel>Stats</SidebarLabel>
              </SidebarItem>
            </SidebarSection>

            <SidebarSpacer />

            <SidebarSection>
              <SidebarItem href="/terms" current={pathname === "/terms"}>
                <DocumentTextIcon />
                <SidebarLabel>Terms of Service</SidebarLabel>
              </SidebarItem>
              {userData && !isLoading && (
                <SidebarItem>
                  <Wallet />
                  <SidebarLabel className="flex flex-col">
                    {isLoading ? "Loading..." : displayAgentAddress}
                    {userData?.agentAddress && (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {userData.agentBalance !== null
                          ? `${userData.agentBalance.toFixed(5)} STX`
                          : "Loading balance..."}
                      </span>
                    )}
                  </SidebarLabel>
                </SidebarItem>
              )}
            </SidebarSection>
          </SidebarBody>

          {userData && !isLoading && (
            <SidebarFooter className="p-4">
              <Dropdown>
                <DropdownButton as={SidebarItem}>
                  <span className="flex min-w-0 items-center gap-3">
                    <Avatar initials="P" className="size-10" square alt="" />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-zinc-950 dark:text-white">
                        {displayAddress}
                      </span>
                      <span className="block truncate text-xs font-normal text-zinc-500 dark:text-zinc-400">
                        {displayRole}
                      </span>
                    </span>
                  </span>
                  <ChevronUpIcon />
                </DropdownButton>
                <AccountDropdownMenu userData={userData} anchor="top start" />
              </Dropdown>
            </SidebarFooter>
          )}
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  );
}
