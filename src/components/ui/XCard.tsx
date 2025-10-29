"use client";

import React, { useState, useEffect } from "react";
import { ExternalLink, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchTwitterEmbed,
  isTwitterOEmbedError,
  type TwitterOEmbedResponse,
} from "@/services/twitter.service";

interface XCardProps {
  url: string;
  className?: string;
  showFullUrl?: boolean;
}

// Helper function to extract X username and tweet ID from URL
function parseXUrl(url: string) {
  const xRegex = /(?:twitter\.com|x\.com)\/([^\/]+)\/status\/(\d+)/i;
  const match = url.match(xRegex);

  if (match) {
    return {
      username: match[1],
      tweetId: match[2],
      isValid: true,
    };
  }

  return {
    username: null,
    tweetId: null,
    isValid: false,
  };
}

// Helper function to clean Twitter/X URL
function cleanTwitterUrl(url: string): string {
  if (!url.trim()) return "";

  try {
    const urlObj = new URL(url.trim());

    // Check if it's a valid X.com or twitter.com domain
    if (!urlObj.hostname.match(/^(x.com|twitter.com)$/)) {
      return "";
    }

    // Extract the pathname and validate the structure
    const pathMatch = urlObj.pathname.match(
      /^\/([a-zA-Z0-9_]+)\/status\/(\d+)$/
    );
    if (!pathMatch) {
      return "";
    }

    const [, username, statusId] = pathMatch;

    // Return the cleaned URL (always use x.com as the canonical domain)
    return `https://x.com/${username}/status/${statusId}`;
  } catch {
    // If URL parsing fails, return empty string
    return "";
  }
}

export function XCard({ url, className, showFullUrl = false }: XCardProps) {
  const { username, tweetId, isValid } = parseXUrl(url);
  const [twitterEmbedData, setTwitterEmbedData] =
    useState<TwitterOEmbedResponse | null>(null);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(false);
  const [embedError, setEmbedError] = useState<string | null>(null);

  // Fetch Twitter embed data
  useEffect(() => {
    const fetchEmbed = async () => {
      if (!isValid) {
        setTwitterEmbedData(null);
        setEmbedError(null);
        return;
      }

      setIsLoadingEmbed(true);
      setEmbedError(null);

      try {
        const cleanedUrl = cleanTwitterUrl(url);
        if (!cleanedUrl) {
          setEmbedError("Invalid X URL");
          return;
        }

        const result = await fetchTwitterEmbed(cleanedUrl);

        if (isTwitterOEmbedError(result)) {
          setEmbedError(result.error);
          setTwitterEmbedData(null);
        } else {
          setTwitterEmbedData(result);
          setEmbedError(null);
        }
      } catch (error) {
        setEmbedError(
          error instanceof Error ? error.message : "Failed to load X post"
        );
        setTwitterEmbedData(null);
      } finally {
        setIsLoadingEmbed(false);
      }
    };

    // Debounce the fetch to avoid too many requests
    const timeoutId = setTimeout(fetchEmbed, 300);
    return () => clearTimeout(timeoutId);
  }, [url, isValid]);

  if (!isValid) {
    // Fallback for non-X URLs
    return (
      <div
        className={cn(
          " rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors cursor-pointer",
          className
        )}
        onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
      >
        <div className="flex items-center gap-2">
          <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm text-primary hover:text-primary/80 break-all">
            {showFullUrl ? url : "External Link"}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-muted/30 rounded-lg transition-colors cursor-pointer group overflow-hidden",
        className
      )}
      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
    >
      {/* Loading State */}
      {isLoadingEmbed && (
        <div className="p-4 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Loading X post...</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {embedError && !isLoadingEmbed && (
        <div className="p-4">
          <div className="flex items-center gap-2 text-destructive mb-2">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm font-medium">Failed to load X post</span>
          </div>
          <div className="text-xs text-muted-foreground mb-3">{embedError}</div>
          <div className="flex items-center gap-2 text-primary">
            <ExternalLink className="h-3 w-3" />
            <span className="text-xs">Click to view on X</span>
          </div>
        </div>
      )}

      {/* Success State - Show Post Info */}
      {twitterEmbedData && !isLoadingEmbed && (
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-gray-600 dark:text-gray-300 font-bold text-sm">
                𝕏
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-bold">
                  {twitterEmbedData.author_name || `@${username}`}
                </span>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                @{username}
              </span>
            </div>
          </div>

          {/* Display tweet HTML without images */}
          <div
            className="twitter-embed-container mb-3 [&_p]:text-sm [&_p]:mb-2 [&_a]:text-primary [&_a]:hover:underline [&_img]:hidden [&_video]:hidden [&_.twitter-player]:hidden"
            dangerouslySetInnerHTML={{
              __html: twitterEmbedData.html,
            }}
          />

          <div className="flex items-center justify-between text-xs text-muted-foreground/70 border-t pt-2">
            <span className="font-mono">ID: {tweetId}</span>
            <span className="text-primary text-sm group-hover:underline">
              View on X →
            </span>
          </div>
        </div>
      )}

      {/* Fallback State - No embed data yet */}
      {!twitterEmbedData && !isLoadingEmbed && !embedError && (
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-sm">𝕏</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground truncate">
                  @{username}
                </span>
                <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-xs text-muted-foreground">Post on X</div>
            </div>
          </div>

          <div className="text-sm text-muted-foreground mb-2">
            Click to view post on X
          </div>

          <div className="text-xs text-muted-foreground/70 font-mono">
            ID: {tweetId}
          </div>
        </div>
      )}
    </div>
  );
}

export default XCard;
