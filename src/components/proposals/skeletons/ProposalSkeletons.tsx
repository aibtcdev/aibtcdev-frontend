"use client";

import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Base Skeleton Section Container
interface SkeletonSectionProps {
  children: React.ReactNode;
  className?: string;
}

function SkeletonSection({ children, className }: SkeletonSectionProps) {
  return <Card className={cn("overflow-hidden", className)}>{children}</Card>;
}

// Skeleton Header for Sections
function SkeletonSectionHeader() {
  return (
    <CardHeader className="pb-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-sm" />
        <div className="flex-1">
          <Skeleton className="h-5 w-32 mb-2" />
          <Skeleton className="h-3 w-48" />
        </div>
      </div>
    </CardHeader>
  );
}

// Voting Progress Chart Skeleton
export function VotingProgressSkeleton() {
  return (
    <SkeletonSection className="bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-sm border-border/50 shadow-lg">
      <SkeletonSectionHeader />
      <CardContent className="space-y-6">
        {/* Participation Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
          <Skeleton className="h-3 w-full rounded-sm" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-3 w-12" />
          </div>
        </div>

        {/* Vote Results */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-full rounded-sm" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-8 w-full rounded-sm" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex justify-center">
          <Skeleton className="h-8 w-24 rounded-sm" />
        </div>
      </CardContent>
    </SkeletonSection>
  );
}

// Vote Details Table Skeleton
export function VoteDetailsSkeleton() {
  return (
    <SkeletonSection>
      <SkeletonSectionHeader />
      <CardContent className="px-0">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4 p-4 border-b border-border/50">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-9 w-20" />
        </div>

        {/* Table Header */}
        <div className="flex bg-muted/50 border-b border-border/50 px-4 py-3">
          <Skeleton className="h-4 w-20 mr-4" />
          <Skeleton className="h-4 w-16 mr-4" />
          <Skeleton className="h-4 w-20 mr-4" />
          <Skeleton className="h-4 w-16 mr-4" />
          <Skeleton className="h-4 w-32 mr-4" />
          <Skeleton className="h-4 w-12" />
        </div>

        {/* Table Rows */}
        <div className="space-y-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center px-4 py-3 border-b border-border/50"
            >
              <Skeleton className="h-4 w-20 mr-4" />
              <Skeleton className="h-4 w-16 mr-4" />
              <Skeleton className="h-4 w-20 mr-4" />
              <Skeleton className="h-4 w-16 mr-4" />
              <Skeleton className="h-4 w-32 mr-4" />
              <Skeleton className="h-4 w-12" />
            </div>
          ))}
        </div>
      </CardContent>
    </SkeletonSection>
  );
}

// Vetos Section Skeleton
export function VetosSkeleton() {
  return (
    <SkeletonSection>
      <SkeletonSectionHeader />
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between p-3 rounded-sm bg-background/50"
          >
            <div className="flex items-center gap-3 flex-1">
              <Skeleton className="w-6 h-6 rounded-sm" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-sm" />
          </div>
        ))}
      </CardContent>
    </SkeletonSection>
  );
}

// Blockchain Details Skeleton
export function BlockchainDetailsSkeleton() {
  return (
    <SkeletonSection>
      <SkeletonSectionHeader />
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Block Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-16" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-20 mb-1" />
                  <Skeleton className="h-6 w-32" />
                </div>
              ))}
            </div>
          </div>

          {/* Contract Details */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          </div>

          {/* Transaction Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </SkeletonSection>
  );
}

// Message Section Skeleton
export function MessageSkeleton() {
  return (
    <SkeletonSection className="bg-gradient-to-br from-card/80 via-card/60 to-card/40 backdrop-blur-sm border-border/50 shadow-lg">
      <SkeletonSectionHeader />
      <CardContent className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />

        {/* Reference Link */}
        <div className="mt-4 p-3 bg-background/50 rounded-sm border border-border/50">
          <Skeleton className="h-4 w-48" />
        </div>
      </CardContent>
    </SkeletonSection>
  );
}

// Proposal Sidebar Skeleton
export function ProposalSidebarSkeleton() {
  return (
    <div className="lg:sticky lg:top-20 space-y-4">
      {/* Status Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <Skeleton className="h-5 w-16" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-8 w-20 rounded-sm" />
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-border/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-8 h-8 rounded-sm" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-3 w-16 mb-1" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Primary Actions */}
      <div className="space-y-2 pt-2">
        <Skeleton className="h-12 w-full rounded-sm" />
        <Skeleton className="h-10 w-full rounded-sm" />
      </div>

      {/* Quick Info */}
      <Card className="border-muted/20 bg-muted/5">
        <CardContent className="p-4">
          <Skeleton className="h-3 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}

// Proposal List Card Skeleton
export function ProposalCardSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-6 w-16 rounded-sm" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />

        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>

        <div className="flex gap-2">
          <Skeleton className="h-6 w-16 rounded-sm" />
          <Skeleton className="h-6 w-20 rounded-sm" />
        </div>
      </CardContent>
    </Card>
  );
}

// Export all skeletons
export const ProposalSkeletons = {
  VotingProgress: VotingProgressSkeleton,
  VoteDetails: VoteDetailsSkeleton,
  Vetos: VetosSkeleton,
  BlockchainDetails: BlockchainDetailsSkeleton,
  Message: MessageSkeleton,
  Sidebar: ProposalSidebarSkeleton,
  Card: ProposalCardSkeleton,
};
