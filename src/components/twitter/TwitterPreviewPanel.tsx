"use client";

import { useState, useEffect } from "react";
import { ExternalLink, AlertCircle } from "lucide-react";
import { Loader } from "@/components/reusables/Loader";
import {
  fetchTwitterEmbed,
  isTwitterOEmbedError,
  type TwitterOEmbedResponse,
} from "@/services/twitter.service";

interface TwitterPreviewPanelProps {
  twitterUrl: string;
  isValidTwitterUrl: boolean;
}

export function TwitterPreviewPanel({
  twitterUrl,
  isValidTwitterUrl,
}: TwitterPreviewPanelProps) {
  const [twitterEmbedData, setTwitterEmbedData] =
    useState<TwitterOEmbedResponse | null>(null);
  const [isLoadingEmbed, setIsLoadingEmbed] = useState(false);
  const [embedError, setEmbedError] = useState<string | null>(null);

  // Fetch Twitter embed when URL is valid
  useEffect(() => {
    const fetchEmbed = async () => {
      if (!twitterUrl || !isValidTwitterUrl) {
        setTwitterEmbedData(null);
        setEmbedError(null);
        return;
      }

      setIsLoadingEmbed(true);
      setEmbedError(null);

      try {
        const result = await fetchTwitterEmbed(twitterUrl);

        if (isTwitterOEmbedError(result)) {
          setEmbedError(result.error);
          setTwitterEmbedData(null);
        } else {
          setTwitterEmbedData(result);
          setEmbedError(null);
        }
      } catch (error) {
        setEmbedError(
          error instanceof Error ? error.message : "Failed to load preview"
        );
        setTwitterEmbedData(null);
      } finally {
        setIsLoadingEmbed(false);
      }
    };

    // Debounce the fetch to avoid too many requests
    const timeoutId = setTimeout(fetchEmbed, 500);
    return () => clearTimeout(timeoutId);
  }, [twitterUrl, isValidTwitterUrl]);

  if (!twitterUrl) {
    return (
      <div className="rounded-sm bg-muted/10 border border-white/10 p-6 flex flex-col items-center justify-center h-full">
        <div className="text-center space-y-3 max-w-md">
          <div className="w-12 h-12 rounded-sm bg-primary/10 flex items-center justify-center mx-auto">
            <ExternalLink className="w-6 h-6 text-primary/50" />
          </div>
          <div>
            <h3 className="text-base font-semibold mb-1">Post Preview</h3>
            <p className="text-xs text-muted-foreground">
              Enter an X.com post URL to see a preview of your contribution here
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isValidTwitterUrl) {
    return (
      <div className="rounded-sm bg-muted/10 border border-white/10 p-6 flex flex-col items-center justify-center h-full">
        <div className="text-center space-y-3 max-w-md">
          <div className="w-12 h-12 rounded-sm bg-red-900/20 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold mb-1">Invalid URL</h3>
            <p className="text-xs text-muted-foreground">
              Please enter a valid X.com post URL in the format:
              <br />
              <code className="text-xs mt-1 block">
                https://x.com/username/status/1234567890123456789
              </code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-sm bg-muted/10 border border-white/10 p-6 flex flex-col h-full">
      <div className="mb-4 flex items-center justify-between flex-shrink-0">
        <h3 className="text-lg font-semibold">Post Preview</h3>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <ExternalLink className="h-4 w-4" />
          Open Post
        </a>
      </div>

      <div className="flex-1 flex flex-col">
        {isLoadingEmbed && (
          <div className="bg-background/60 border border-white/10 rounded-sm p-6 flex items-center justify-center flex-1">
            <div className="flex flex-col items-center gap-2 text-xs text-muted-foreground">
              <Loader />
              <span>Loading preview...</span>
            </div>
          </div>
        )}

        {embedError && (
          <div className="bg-red-900/20 border border-red-800/30 rounded-sm p-4 flex items-center gap-3 flex-1">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-300" />
            <div className="text-xs text-red-300">
              <strong>Preview unavailable:</strong> {embedError}
            </div>
          </div>
        )}

        {twitterEmbedData && !isLoadingEmbed && (
          <div className="bg-background/60 border border-white/10 rounded-sm p-4 flex-1">
            <div
              className="twitter-embed-container [&_iframe]:w-full [&_iframe]:max-w-none [&_iframe]:border-0 [&_iframe]:rounded-sm"
              dangerouslySetInnerHTML={{
                __html: twitterEmbedData.html,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
