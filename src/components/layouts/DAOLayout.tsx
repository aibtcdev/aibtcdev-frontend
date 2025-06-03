"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import { Building2, FileText } from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import { DAOHeader } from "./DAOHeader";
import { DAONavigation } from "./DAONavigation";
import { PageSection } from "./PageSection";
import { MissionContent } from "./MissionContent";
import { DAOSendProposal } from "@/components/proposals/DAOSendProposal";

interface DAOInfo {
  id: string;
  name: string;
  description?: string;
}

interface TokenInfo {
  image_url?: string;
  max_supply?: number;
}

interface MarketStats {
  price: number;
  marketCap: number;
  holderCount: number;
}

interface DAOLayoutProps {
  children: React.ReactNode;
  dao?: DAOInfo;
  token?: TokenInfo;
  marketStats: MarketStats;
  proposalCount: number;
  isLoading: boolean;
  daoName: string;
}

export function DAOLayout({
  children,
  dao,
  token,
  marketStats,
  proposalCount,
  isLoading,
  daoName,
}: DAOLayoutProps) {
  const pathname = usePathname();

  // Determine current page
  const isProposals = pathname === `/daos/${daoName}`;
  const isMission = pathname === `/daos/${daoName}/mission`;

  // Show loading state for basic DAO info
  if (isLoading || !dao) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
        <div className="flex h-screen items-center justify-center">
          <div className="flex flex-col items-center space-y-6">
            <Loader />
            <p className="text-muted-foreground">
              {!dao ? "DAO not found..." : "Loading DAO..."}
            </p>
          </div>
        </div>
      </main>
    );
  }

  // Show DAO not found state
  if (!dao) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-muted/50">
              <Building2 className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <div className="space-y-3">
              <h1 className="text-2xl font-bold text-foreground">DAO Not Found</h1>
              <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                The DAO you&apos;re looking for doesn&apos;t exist or has been removed from our platform
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-background/95">
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="space-y-12">
          {/* DAO Header Section */}
          <div>
            <DAOHeader
              dao={dao}
              token={token}
              marketStats={marketStats}
              proposalCount={proposalCount}
              isLoading={false}
            />
            <DAONavigation daoName={daoName} currentPath={pathname} />
          </div>

          {/* Main Content Section */}
          {isProposals ? (
            /* Proposals Page Layout */
            <div className="space-y-8">
              {/* Send Proposal Section */}
              <PageSection
                title="Send Proposal"
                description="Create a new governance proposal"
                icon={FileText}
              >
                <DAOSendProposal daoId={dao.id} />
              </PageSection>

              {/* Proposals Content */}
              <PageSection className="p-10">
                {children}
              </PageSection>
            </div>
          ) : isMission ? (
            /* Mission Page Layout */
            <PageSection className="p-10">
              <MissionContent description={dao.description} />
            </PageSection>
          ) : (
            /* Other Pages Layout */
            <PageSection className="p-10">
              {children}
            </PageSection>
          )}
        </div>
      </div>
    </main>
  );
} 