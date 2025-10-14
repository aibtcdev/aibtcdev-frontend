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
            <div className="flex flex-col items-center gap-3 p-4 text-center">
              <h4 className="font-medium flex items-center gap-2">
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 22 22"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M20.396 11c-.018-.646-.215-1.275-.57-1.816-.354-.54-.852-.972-1.438-1.246.223-.607.27-1.264.14-1.897-.131-.634-.437-1.218-.882-1.687-.47-.445-1.053-.75-1.687-.882-.633-.13-1.29-.083-1.897.14-.273-.587-.704-1.086-1.245-1.44S11.647 1.62 11 1.604c-.646.017-1.273.213-1.813.568s-.969.854-1.24 1.44c-.608-.223-1.267-.272-1.902-.14-.635.13-1.22.436-1.69.882-.445.47-.749 1.055-.878 1.688-.13.633-.08 1.29.144 1.896-.587.274-1.087.705-1.443 1.245-.356.54-.555 1.17-.574 1.817.02.647.218 1.276.574 1.817.356.54.856.972 1.443 1.245-.224.606-.274 1.263-.144 1.896.13.634.433 1.218.877 1.688.47.443 1.054.747 1.687.878.633.132 1.29.084 1.897-.136.274.586.705 1.084 1.246 1.439.54.354 1.17.551 1.816.569.647-.016 1.276-.213 1.817-.567s.972-.854 1.245-1.44c.604.239 1.266.296 1.903.164.636-.132 1.22-.447 1.68-.907.46-.46.776-1.044.908-1.681s.075-1.299-.165-1.903c.586-.274 1.084-.705 1.439-1.246.354-.54.551-1.17.569-1.816zM9.662 14.85l-3.429-3.428 1.293-1.302 2.072 2.072 4.4-4.794 1.347 1.246z"
                    fill="#1d9bf0"
                  />
                </svg>
                Verified X Account Required
              </h4>
              <p className="text-sm">
                You'll need a verified (blue check) X account to submit your
                contribution.
              </p>
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
