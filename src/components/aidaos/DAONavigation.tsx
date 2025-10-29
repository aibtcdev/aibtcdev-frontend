"use client";

import type React from "react";
import Link from "next/link";
import { Activity, Info, Blocks, Users } from "lucide-react";

interface DAONavigationProps {
  daoName: string;
  currentPath: string;
}

export function DAONavigation({ daoName, currentPath }: DAONavigationProps) {
  // Determine which tab is active
  const isProposals = currentPath === `/aidaos/${daoName}`;
  const isExtensions = currentPath === `/aidaos/${daoName}/extensions`;
  const isHolders = currentPath === `/aidaos/${daoName}/holders`;
  const isMission = currentPath === `/aidaos/${daoName}/mission`;

  const navItems = [
    {
      href: `/aidaos/${daoName}`,
      label: "Proposals",
      icon: Activity,
      isActive: isProposals,
    },
    {
      href: `/aidaos/${daoName}/mission`,
      label: "Mission",
      icon: Info,
      isActive: isMission,
    },
    {
      href: `/aidaos/${daoName}/extensions`,
      label: "Extensions",
      icon: Blocks,
      isActive: isExtensions,
    },
    {
      href: `/aidaos/${daoName}/holders`,
      label: "Holders",
      icon: Users,
      isActive: isHolders,
    },
  ];

  return (
    <div className="bg-muted/30 border-t border-border/50 px-10 py-6">
      <div className="flex flex-wrap gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl transition-all duration-300 ${
                  item.isActive
                    ? "bg-primary text-primary-foreground font-semibold shadow-lg scale-105"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50 hover:scale-105"
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
