"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import MessageDisplay from "./MessageDisplay";
import TimeStatus from "./TimeStatus";
import BlockVisual from "./BlockVisual";
import VotesTable from "./VotesTable";
import VotingProgressChart from "./VotingProgressChart";
import { useVotingStatus } from "@/hooks/useVotingStatus";
import type { Proposal, ProposalWithDAO } from "@/types";
import {
  Blocks,
  Layers,
  Hash,
  FileText,
  TrendingUp,
  Clock,
  Vote,
  Menu,
  X,
} from "lucide-react";
import { truncateString, getExplorerLink, formatAction } from "@/utils/format";
import { useQueryClient } from "@tanstack/react-query";
import { safeNumberFromBigInt, safeString } from "@/utils/proposal";

interface ProposalDetailsProps {
  proposal: Proposal | ProposalWithDAO;
  className?: string;
  tokenSymbol?: string;
}

const ProposalDetails = ({
  proposal,
  className = "",
  tokenSymbol = "",
}: ProposalDetailsProps) => {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const { isActive } = useVotingStatus(
    proposal.status,
    safeNumberFromBigInt(proposal.vote_start),
    safeNumberFromBigInt(proposal.vote_end)
  );

  const refreshVotesData = useCallback(async () => {
    if (refreshing) return;

    setRefreshing(true);
    try {
      await queryClient.invalidateQueries({
        queryKey: ["proposalVotes", proposal.id, proposal.contract_principal],
      });
      await queryClient.invalidateQueries({
        queryKey: ["proposals"],
      });
    } catch (error) {
      console.error("Failed to refresh votes data:", error);
    } finally {
      setRefreshing(false);
    }
  }, [queryClient, proposal.id, proposal.contract_principal, refreshing]);

  // Smooth scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -80; // Account for any fixed headers
      const y =
        element.getBoundingClientRect().top + window.pageYOffset + yOffset;

      window.scrollTo({
        top: y,
        behavior: "smooth",
      });

      setActiveSection(sectionId);
      setSidebarOpen(false); // Close mobile sidebar after navigation
    }
  }, []);

  // Intersection Observer for active section tracking
  useEffect(() => {
    const sections = [
      "onchain-message",
      "voting-progress",
      "vote-details",
      "blockchain-details",
    ];

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            setActiveSection(entry.target.id);
          }
        });
      },
      {
        threshold: [0.1, 0.5, 0.9],
        rootMargin: "-100px 0px -100px 0px",
      }
    );

    sections.forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, []);

  // Cleanup intervals on unmount
  useEffect(() => {
    const refreshInterval = refreshIntervalRef.current;
    const countdownInterval = countdownIntervalRef.current;

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, []);

  // Auto-refresh for active proposals
  useEffect(() => {
    if (isActive) {
      refreshVotesData();
      // Start countdown
      const countdownInterval = setInterval(() => {
        refreshVotesData();
      }, 30000); // Refresh every 30 seconds

      countdownIntervalRef.current = countdownInterval;

      return () => {
        clearInterval(countdownInterval);
      };
    } else {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    }
  }, [isActive, refreshVotesData]);

  const navigationItems = [
    { id: "onchain-message", label: "On-chain Message", icon: FileText },
    { id: "voting-progress", label: "Voting Progress", icon: TrendingUp },
    { id: "vote-details", label: "Vote Details", icon: Vote },
    { id: "blockchain-details", label: "Blockchain Details", icon: Blocks },
  ];

  return (
    <div className="relative">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 -z-50 bg-card border border-border rounded-lg p-2 shadow-lg hover:bg-accent transition-colors"
        aria-label="Toggle navigation menu"
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <nav
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] w-72 z-40 bg-card/95 backdrop-blur-sm shadow-lg
          transform transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0 lg:block
        `}
      >
        <div className="p-6 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
          <div className="mb-8 pt-12 lg:pt-0">
            <h2 className="text-lg font-semibold text-foreground mb-2">
              Navigation
            </h2>
            <p className="text-sm text-muted-foreground">
              Jump to different sections
            </p>
          </div>

          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;

              return (
                <li key={item.id}>
                  <button
                    onClick={() => scrollToSection(item.id)}
                    className={`
                      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left
                      transition-all duration-200 ease-in-out
                      hover:bg-accent hover:text-accent-foreground
                      focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                      ${
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    <Icon
                      className={`h-4 w-4 transition-colors ${isActive ? "text-primary-foreground" : ""}`}
                    />
                    <span className="font-medium">{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          {/* Proposal Info in Sidebar */}
          <div className="mt-8 pt-6 border-t border-border">
            <div className="text-xs text-muted-foreground mb-2">PROPOSAL</div>
            <div className="font-mono text-sm text-foreground">
              #{proposal.proposal_id}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Status: <span className="capitalize">{proposal.status}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div
        className={`transition-all duration-300 ease-in-out ml-0 lg:ml-72 ${className}`}
      >
        <div className="space-y-12 p-4 lg:p-8">
          {/* On-chain Message - Top Priority */}
          {proposal.content && (
            <section
              id="onchain-message"
              className="bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-sm rounded-2xl p-4 sm:p-8 md:p-12 border border-border/50 shadow-lg transition-all duration-300 hover:shadow-xl scroll-mt-24"
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center transition-transform duration-200 hover:scale-105">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-foreground tracking-tight">
                    On-chain Message
                  </h3>
                  <p className="text-muted-foreground">
                    Contribution description and details
                  </p>
                </div>
              </div>
              {(() => {
                const referenceRegex = /Reference:\s*(https?:\/\/\S+)/i;
                const match = proposal.content.match(referenceRegex);
                const referenceLink = match?.[1];
                const cleanedContent = proposal.content
                  .replace(referenceRegex, "")
                  .trim();

                return (
                  <>
                    <MessageDisplay message={cleanedContent} />
                    {referenceLink && (
                      <div className="mt-4">
                        <a
                          href={referenceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary underline hover:text-primary/80 transition-colors break-all word-break-all overflow-wrap-anywhere"
                        >
                          <span className="inline-block">Reference: </span>
                          <span className="inline-block max-w-full break-all">
                            {referenceLink}
                          </span>
                        </a>
                      </div>
                    )}
                  </>
                );
              })()}
            </section>
          )}

          {/* Hero Progress Section - Full Width */}
          <section
            id="voting-progress"
            className="bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-sm rounded-2xl p-4 sm:p-8 md:p-12 border border-border/50 shadow-lg overflow-x-auto transition-all duration-300 hover:shadow-xl scroll-mt-24"
          >
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center transition-transform duration-200 hover:scale-105">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-foreground tracking-tight">
                  Voting Progress
                </h3>
                <p className="text-muted-foreground">
                  Real-time contribution voting analytics
                </p>
              </div>
            </div>
            <VotingProgressChart
              proposal={proposal}
              tokenSymbol={tokenSymbol}
              contractPrincipal={proposal.contract_principal}
            />
          </section>

          {/* Vote Details - Full Width */}
          <section id="vote-details" className="scroll-mt-24">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center transition-transform duration-200 hover:scale-105">
                <Vote className="h-5 w-5 text-primary" />
              </div>
              <h4 className="text-xl font-semibold text-foreground">
                Vote Details
              </h4>
            </div>
            <div className="transition-all duration-300 hover:shadow-lg">
              <VotesTable proposalId={proposal.id} />
            </div>
          </section>

          {/* Blockchain Information - Compact Layout */}
          <section
            id="blockchain-details"
            className="bg-card border border-border rounded-xl p-4 sm:p-6 md:p-8 overflow-x-auto transition-all duration-300 hover:shadow-lg scroll-mt-24"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center transition-transform duration-200 hover:scale-105">
                <Blocks className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">
                Blockchain Details
              </h3>
            </div>

            {/* Compact Grid Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Block Information */}
              <div className="space-y-4 p-4 rounded-lg bg-accent/10 transition-all duration-200 hover:bg-accent/20">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Layers className="h-4 w-4" />
                  <span>Blocks</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">
                      Snapshot
                    </div>
                    <BlockVisual
                      value={safeNumberFromBigInt(proposal.created_stx)}
                      type="stacks"
                    />
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">
                      Start
                    </div>
                    <BlockVisual
                      value={safeNumberFromBigInt(proposal.vote_start)}
                      type="bitcoin"
                    />
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">
                      End
                    </div>
                    <BlockVisual
                      value={safeNumberFromBigInt(proposal.vote_end)}
                      type="bitcoin"
                    />
                  </div>
                </div>
              </div>

              {/* Contract Details */}
              <div className="space-y-4 p-4 rounded-lg bg-accent/10 transition-all duration-200 hover:bg-accent/20">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <FileText className="h-4 w-4" />
                  <span>Contract</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">
                      Principal
                    </div>
                    <div className="font-mono text-sm break-all leading-relaxed">
                      {formatAction(safeString(proposal.contract_principal))}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">
                      Action
                    </div>
                    <div className="font-mono text-sm break-all leading-relaxed">
                      {formatAction(proposal.action)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Info */}
              <div className="space-y-4 p-4 rounded-lg bg-accent/10 transition-all duration-200 hover:bg-accent/20">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Hash className="h-4 w-4" />
                  <span>Transaction</span>
                </div>
                <div className="space-y-3">
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">
                      Contribution ID
                    </div>
                    <div className="font-mono text-sm">
                      #{proposal.proposal_id}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">
                      TX Hash
                    </div>
                    <a
                      href={getExplorerLink("tx", proposal.tx_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-sm text-primary hover:text-primary/80 transition-colors"
                    >
                      {truncateString(proposal.tx_id, 6, 6)}
                    </a>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-4 p-4 rounded-lg bg-accent/10 transition-all duration-200 hover:bg-accent/20">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Clock className="h-4 w-4" />
                  <span>Timeline</span>
                </div>
                <div className="space-y-3">
                  <TimeStatus
                    createdAt={proposal.created_at}
                    status={proposal.status}
                    concludedBy={proposal.concluded_by}
                    vote_start={safeNumberFromBigInt(proposal.vote_start)}
                    vote_end={safeNumberFromBigInt(proposal.vote_end)}
                  />
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetails;
