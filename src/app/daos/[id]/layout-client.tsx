"use client";

import type React from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronRight,
  Info,
  Activity,
  Users,
  Blocks,
  Loader2,
} from "lucide-react";
import { fetchDAO, fetchToken } from "@/queries/daoQueries";

interface DAO {
  id: string;
  name: string;
  mission: string;
  description: string;
  image_url: string;
  is_graduated: boolean;
  is_deployed: boolean;
  created_at: string;
  website_url?: string;
  x_url?: string;
  telegram_url?: string;
}

interface Token {
  image_url: string;
}

export function DAOLayoutClient({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const id = params.id as string;
  const pathname = usePathname();

  const { data: dao, isLoading: isLoadingDao } = useQuery<DAO>({
    queryKey: ["dao", id],
    queryFn: () => fetchDAO(id),
    staleTime: 1000000,
  });

  const { data: token, isLoading: isLoadingToken } = useQuery<Token>({
    queryKey: ["token", id],
    queryFn: () => fetchToken(id),
    staleTime: 1000000,
  });

  const isLoading = isLoadingDao || isLoadingToken;

  const isOverview = pathname === `/daos/${id}`;
  const isExtensions = pathname === `/daos/${id}/extensions`;
  const isHolders = pathname === `/daos/${id}/holders`;
  const isProposals = pathname === `/daos/${id}/proposals`;

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="container mx-auto px-4 py-4 sm:py-6 flex-grow">
        {/* Breadcrumb */}
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground mb-4">
          <Link
            href="/daos"
            className="hover:text-foreground transition-colors"
          >
            DAOs
          </Link>
          <ChevronRight className="h-4 w-4 mx-1" />
          <span className="text-foreground font-medium truncate">
            {dao?.name || "Details"}
          </span>
        </div>

        {/* DAO Header */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-6">
          {/* Token Image - Fixed size container with responsive image */}
          {token?.image_url && (
            <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0">
              <Image
                src={token.image_url || "/placeholder.svg"}
                alt={`${dao?.name} token`}
                fill
                className="rounded-2xl object-cover"
                sizes="(max-width: 640px) 96px, 128px"
                priority
              />
            </div>
          )}

          {/* DAO Info */}
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">
              {dao?.name}
            </h1>
            {dao?.mission && (
              <p className="text-base sm:text-lg text-muted-foreground">
                {dao.mission}
              </p>
            )}
          </div>
        </div>

        {/* Navigation Tabs - Mobile */}
        <div className="block sm:hidden border-b border-border overflow-x-auto mb-4">
          <div className="flex whitespace-nowrap">
            <Link href={`/daos/${id}`} className="mr-4">
              <div
                className={`flex items-center gap-1 pb-2 ${
                  isOverview
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Info className="h-4 w-4" />
                <span className="text-xs font-medium">Overview</span>
              </div>
            </Link>
            <Link href={`/daos/${id}/extensions`} className="mr-4">
              <div
                className={`flex items-center gap-1 pb-2 ${
                  isExtensions
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Blocks className="h-4 w-4" />
                <span className="text-xs font-medium">Extensions</span>
              </div>
            </Link>
            <Link href={`/daos/${id}/holders`} className="mr-4">
              <div
                className={`flex items-center gap-1 pb-2 ${
                  isHolders
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Users className="h-4 w-4" />
                <span className="text-xs font-medium">Holders</span>
              </div>
            </Link>
            <Link href={`/daos/${id}/proposals`}>
              <div
                className={`flex items-center gap-1 pb-2 ${
                  isProposals
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Activity className="h-4 w-4" />
                <span className="text-xs font-medium">Proposals</span>
              </div>
            </Link>
          </div>
        </div>

        {/* Navigation Tabs - Desktop */}
        <div className="hidden sm:flex border-b border-border mb-4">
          <Link href={`/daos/${id}`} className="mr-6">
            <div
              className={`flex items-center gap-2 pb-2 ${
                isOverview
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Info className="h-4 w-4" />
              <span className="text-sm font-medium">Overview</span>
            </div>
          </Link>
          <Link href={`/daos/${id}/extensions`} className="mr-6">
            <div
              className={`flex items-center gap-2 pb-2 ${
                isExtensions
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Blocks className="h-4 w-4" />
              <span className="text-sm font-medium">Extensions</span>
            </div>
          </Link>
          <Link href={`/daos/${id}/holders`} className="mr-6">
            <div
              className={`flex items-center gap-2 pb-2 ${
                isHolders
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" />
              <span className="text-sm font-medium">Holders</span>
            </div>
          </Link>
          <Link href={`/daos/${id}/proposals`}>
            <div
              className={`flex items-center gap-2 pb-2 ${
                isProposals
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Activity className="h-4 w-4" />
              <span className="text-sm font-medium">Proposals</span>
            </div>
          </Link>
        </div>

        {/* Content */}
        <main className="w-full">{children}</main>
      </div>
    </div>
  );
}
