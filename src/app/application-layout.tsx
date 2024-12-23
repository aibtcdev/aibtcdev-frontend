"use client";

import * as React from "react";
import { useEffect, useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Wallet } from "lucide-react";
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
import { useAuth } from "@/hooks/new/useAuth";
import { useProfiles } from "@/hooks/new/useProfiles";

interface AccountDropdownMenuProps {
  role: string | null;
  anchor: "top start" | "bottom end";
}

interface ApplicationState {
  role: string | null;
  agentBalance: number | null;
  agentAddress: string | null;
}

interface SignOutProps {
  className?: string;
}

const SignOut: React.FC<SignOutProps> = ({ className }) => {
  const { logout } = useAuth();
  const router = useRouter();

  const signOut = () => {
    logout();
    router.push("/");
  };
  return (
    <DropdownLabel onClick={signOut} className={className}>
      Sign Out
    </DropdownLabel>
  );
};

const AccountDropdownMenu: React.FC<AccountDropdownMenuProps> = ({
  role,
  anchor,
}) => {
  return (
    <DropdownMenu className="min-w-64" anchor={anchor}>
      {role === "Admin" && (
        <DropdownItem href="/admin">
          <WrenchScrewdriverIcon className="h-5 w-5" />
          <DropdownLabel>Admin</DropdownLabel>
        </DropdownItem>
      )}
      <DropdownItem href="/profile">
        <Avatar initials="P" className="size-4" />
        <DropdownLabel>Profile Settings</DropdownLabel>
      </DropdownItem>
      <DropdownItem>
        <ArrowRightStartOnRectangleIcon className="h-5 w-5" />
        <SignOut />
      </DropdownItem>
    </DropdownMenu>
  );
};

interface ApplicationLayoutProps {
  children: React.ReactNode;
}

export const ApplicationLayout: React.FC<ApplicationLayoutProps> = ({
  children,
}) => {
  const pathname = usePathname();
  const { getUserRole } = useProfiles();
  const { isAuthenticated, isLoading, userAddress } = useAuth();

  const [profile, setProfile] = useState<ApplicationState>({
    role: null,
    agentBalance: null,
    agentAddress: null,
  });

  const fetchUserData = useCallback(async () => {
    if (userAddress && isAuthenticated) {
      try {
        const userRole = await getUserRole(userAddress);
        setProfile((prev) => ({ ...prev, role: userRole }));
        // TODO: Fetch agent balance and address here
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    }
  }, [userAddress, isAuthenticated, getUserRole]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const displayAddress = useMemo(() => {
    if (!userAddress) return "";
    return `${userAddress.slice(0, 5)}...${userAddress.slice(-5)}`;
  }, [userAddress]);

  const displayAgentAddress = useMemo(() => {
    if (!profile.agentAddress) return "No agents assigned";
    return `${profile.agentAddress.slice(0, 5)}...${profile.agentAddress.slice(
      -5
    )}`;
  }, [profile.agentAddress]);

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
              <AccountDropdownMenu role={profile.role} anchor="bottom end" />
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
                    alt="Logo"
                    width={400}
                    height={20}
                    priority
                  />
                </SidebarLabel>
              </DropdownButton>
            </Dropdown>
          </SidebarHeader>

          <SidebarBody>
            <SidebarSection>
              <SidebarItem href="/chat" current={pathname === "/chat"}>
                <ChatBubbleBottomCenterTextIcon className="h-5 w-5" />
                <SidebarLabel>Chat</SidebarLabel>
              </SidebarItem>
              <SidebarItem
                href="/crews"
                current={pathname.startsWith("/crews")}
              >
                <UserGroupIcon className="h-5 w-5" />
                <SidebarLabel>Crews</SidebarLabel>
              </SidebarItem>
              <SidebarItem
                href="/marketplace"
                current={pathname.startsWith("/marketplace")}
              >
                <BuildingStorefrontIcon className="h-5 w-5" />
                <SidebarLabel>Marketplace</SidebarLabel>
              </SidebarItem>
              <SidebarItem
                href="/leaderboard"
                current={pathname.startsWith("/leaderboard")}
              >
                <ChartBarIcon className="h-5 w-5" />
                <SidebarLabel>Leaderboard</SidebarLabel>
              </SidebarItem>
              <SidebarItem
                href="/stats"
                current={pathname.startsWith("/stats")}
              >
                <ChartPieIcon className="h-5 w-5" />
                <SidebarLabel>Stats</SidebarLabel>
              </SidebarItem>
            </SidebarSection>

            <SidebarSpacer />

            <SidebarSection>
              <SidebarItem href="/terms" current={pathname === "/terms"}>
                <DocumentTextIcon className="h-5 w-5" />
                <SidebarLabel>Terms of Service</SidebarLabel>
              </SidebarItem>
              <SidebarItem>
                <Wallet className="h-5 w-5" />
                <SidebarLabel className="flex flex-col">
                  {isLoading ? "Loading..." : displayAgentAddress}
                  {profile.agentAddress && (
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      {profile.agentBalance !== null
                        ? `${profile.agentBalance.toFixed(5)} STX`
                        : "Loading balance..."}
                    </span>
                  )}
                </SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>

          <SidebarFooter className="p-4">
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar initials="P" className="size-10" square alt="" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-zinc-950 dark:text-white">
                      {isLoading
                        ? "Loading..."
                        : displayAddress || "Not Connected"}
                    </span>
                    <span className="block truncate text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      {isLoading ? "Loading..." : profile.role || "Normal User"}
                    </span>
                  </span>
                </span>
                <ChevronUpIcon className="h-5 w-5" />
              </DropdownButton>
              <AccountDropdownMenu role={profile.role} anchor="top start" />
            </Dropdown>
          </SidebarFooter>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  );
};
