"use client";

import React, { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ExternalLink, X } from "lucide-react";
// Using console.log instead of toast for now to avoid dependency issues
// import { toast } from "sonner";
import {
  linkXAccount,
  unlinkXAccount,
  getLinkedXProfile,
  type XProfile,
} from "@/services/x-auth.service";
import { useXStatus } from "@/hooks/useXStatus";

interface XLinkingProps {
  compact?: boolean;
  showTitle?: boolean;
  onLinkingComplete?: (username: string) => void;
}

export function XLinking({
  compact = false,
  showTitle = true,
  onLinkingComplete,
}: XLinkingProps) {
  const [isLinking, setIsLinking] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [xProfile, setXProfile] = useState<XProfile | null>(null);

  const { hasUsername, needsXLink, isLoading, refreshStatus } = useXStatus();

  const handleLinkX = async () => {
    setIsLinking(true);
    try {
      const result = await linkXAccount();

      if (result.success) {
        // The redirect will happen automatically
        console.log("Redirecting to X for authentication...");
      } else {
        console.error("Failed to initiate X linking:", result.error);
      }
    } catch (error) {
      console.error("X linking error:", error);
    } finally {
      setIsLinking(false);
    }
  };

  const handleUnlinkX = async () => {
    setIsUnlinking(true);
    try {
      const result = await unlinkXAccount();

      if (result.success) {
        console.log("X account unlinked successfully");
        setXProfile(null);
        refreshStatus();
      } else {
        console.error("Failed to unlink X account:", result.error);
      }
    } catch (error) {
      console.error("X unlinking error:", error);
    } finally {
      setIsUnlinking(false);
    }
  };

  const loadXProfile = useCallback(async () => {
    if (hasUsername) {
      try {
        const profile = await getLinkedXProfile();
        setXProfile(profile);
        if (profile && onLinkingComplete) {
          onLinkingComplete(profile.username);
        }
      } catch (error) {
        console.error("Error loading X profile:", error);
      }
    }
  }, [hasUsername, onLinkingComplete]);

  // Load profile when component mounts or status changes
  React.useEffect(() => {
    loadXProfile();
  }, [hasUsername, loadXProfile]);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {needsXLink ? (
          <Button
            onClick={handleLinkX}
            disabled={isLinking || isLoading}
            size="sm"
            className="bg-black hover:bg-gray-800 text-white"
          >
            <X className="h-4 w-4 mr-2" />
            {isLinking ? "Linking..." : "Link X Account"}
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className="bg-green-100 text-green-800 border-green-200"
            >
              <CheckCircle className="h-3 w-3 mr-1" />X Linked
            </Badge>
            {xProfile && (
              <span className="text-sm text-muted-foreground">
                @{xProfile.username}
              </span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className="w-full">
      {showTitle && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <X className="h-5 w-5" />X Account Linking
          </CardTitle>
          <CardDescription>
            Link your X (formerly Twitter) account to verify your identity for
            proposal submissions.
          </CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6  border-primary"></div>
          </div>
        ) : needsXLink ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4  ">
              <div className="flex-1">
                <h4 className="font-medium ">X Account Required</h4>
                <p className="text-sm mt-1">
                  You need to link your X account to submit contributions.
                </p>
              </div>
            </div>

            <Button
              onClick={handleLinkX}
              disabled={isLinking}
              className="w-full "
            >
              <X className="h-4 w-4 mr-2" />
              {isLinking ? "Linking..." : "Link X Account"}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  X Account Linked
                </h4>
                {xProfile && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Username:</span>
                      <Badge variant="secondary">@{xProfile.username}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Display Name:</span>
                      <span className="text-sm">{xProfile.name}</span>
                    </div>
                    <a
                      href={`https://x.com/${xProfile.username}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      View Profile
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>

            <Button
              onClick={handleUnlinkX}
              disabled={isUnlinking}
              variant="outline"
              className="w-full"
            >
              {isUnlinking ? "Unlinking..." : "Unlink X Account"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
