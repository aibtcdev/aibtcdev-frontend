"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/services/supabase";
import { Loader } from "@/components/reusables/Loader";
import { AlertCircle } from "lucide-react";

// Types
interface AuthSession {
  access_token?: string;
  user?: {
    id: string;
    email?: string;
  };
}

interface TopPost {
  post_url: string;
  score: number;
  reason: string;
  recommended_payout: string;
}

interface NetworkSchoolEvaluation {
  username: string;
  total_posts_analyzed: number;
  top_posts: TopPost[];
  usage_input_tokens: number;
  usage_output_tokens: number;
  usage_est_cost: string;
  raw_response: string;
  citations: string[];
  search_queries: string[];
  raw_openrouter_response: any;
}

export default function TestPostPage() {
  const [username, setUsername] = useState<string>("");
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [evaluationResult, setEvaluationResult] =
    useState<NetworkSchoolEvaluation | null>(null);
  const [showAllCitations, setShowAllCitations] = useState(false);

  // Get authentication session on component mount
  useEffect(() => {
    const getSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Auth error:", error);
        } else {
          setAuthSession(session);
        }
      } catch (error) {
        console.error("Failed to get session:", error);
      } finally {
        setAuthLoading(false);
      }
    };

    getSession();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuthSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle evaluation submission
  const handleEvaluationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !authSession?.access_token) {
      setSubmitError("Username and authentication required");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setEvaluationResult(null);

    try {
      // Remove @ symbol if present
      const cleanUsername = username.replace("@", "");

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/tools/evaluation/network-school/${cleanUsername}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authSession.access_token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Server error: ${response.status}`);
      }

      const result = await response.json();
      setEvaluationResult(result);
    } catch (error) {
      console.error("Evaluation error:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Failed to evaluate posts"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
        <Loader />
      </div>
    );
  }

  // Authentication required
  if (!authSession) {
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
        <div className="text-center p-6 bg-warning/10 border border-warning/20 rounded-sm max-w-md">
          <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-foreground">
            Authentication Required
          </h2>
          <p className="text-muted-foreground">
            Please log in to test Network School post evaluation.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl rounded-sm border border-border/30 p-6">
          <h1 className="text-2xl font-bold text-foreground mb-2">
            Network School Post Evaluation Test
          </h1>
          <p className="text-muted-foreground">
            Test the Network School evaluation endpoint by entering a Twitter/X
            username
          </p>
        </div>

        {/* Input Form */}
        <div className="bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl rounded-sm border border-border/30 p-6">
          <form onSubmit={handleEvaluationSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-medium text-foreground mb-2"
              >
                Twitter/X Username
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username (with or without @)"
                disabled={isSubmitting}
                className="w-full px-4 py-2 bg-background border border-border rounded-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <button
              type="submit"
              disabled={!username.trim() || isSubmitting}
              className="w-full inline-flex justify-center items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-sm hover:bg-primary/90 focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-sm h-4 w-4 border-2 border-white border-t-transparent" />
                  Evaluating...
                </>
              ) : (
                <>Evaluate Posts</>
              )}
            </button>
          </form>
        </div>

        {/* Error Display */}
        {submitError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-sm p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-destructive mb-1">
                Evaluation Failed
              </h3>
              <p className="text-sm text-destructive/80">{submitError}</p>
            </div>
          </div>
        )}

        {/* Evaluation Results */}
        {evaluationResult && (
          <>
            {/* Top Posts and Citations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Left Side - Top Posts */}
              <div className="bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl rounded-sm border border-border/30 p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-4 sm:mb-6">
                  Top Evaluated Posts
                </h2>

                <div className="space-y-3 sm:space-y-4">
                  {evaluationResult.top_posts.map((post, index) => (
                    <div key={index} className="group">
                      <div className="flex items-start gap-2 sm:gap-3 mb-2">
                        <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-sm bg-primary/10 flex items-center justify-center">
                          <span className="text-sm sm:text-base font-bold text-primary">
                            #{index + 1}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-lg sm:text-xl font-bold text-foreground">
                              {post.score}
                            </span>
                            <span className="text-xs sm:text-sm text-muted-foreground">
                              /100
                            </span>
                            <span className="ml-auto text-xs sm:text-sm font-semibold text-primary">
                              {post.recommended_payout}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-2">
                            {post.reason}
                          </p>
                          <a
                            href={post.post_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs sm:text-sm text-primary hover:text-primary/80 transition-colors"
                          >
                            View Post
                            <svg
                              className="w-3 h-3 sm:w-4 sm:h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                              />
                            </svg>
                          </a>
                        </div>
                      </div>
                      {index < evaluationResult.top_posts.length - 1 && (
                        <div className="h-px bg-border/50 mt-3 sm:mt-4" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Side - Citations */}
              <div className="bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl rounded-sm border border-border/30 p-6 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-foreground">
                    Citations
                  </h2>
                  <span className="text-sm text-muted-foreground">
                    {evaluationResult.citations.length} total
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 mb-4">
                  <div className="flex flex-wrap gap-2">
                    {evaluationResult.citations
                      .slice(0, 20)
                      .map((citation, index) => {
                        const postId = citation.split("/").pop();
                        return (
                          <a
                            key={index}
                            href={citation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-sm text-xs font-medium transition-colors border border-primary/20"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            {postId?.substring(0, 8)}...
                          </a>
                        );
                      })}
                  </div>
                </div>

                {evaluationResult.citations.length > 20 && (
                  <button
                    onClick={() => setShowAllCitations(true)}
                    className="w-full mt-auto px-4 py-2 bg-background hover:bg-muted border border-border rounded-sm text-sm font-medium text-foreground transition-colors"
                  >
                    View All {evaluationResult.citations.length} Citations
                  </button>
                )}
              </div>
            </div>

            {/* Bottom - Usage Metrics */}
            <div className="bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl rounded-sm border border-border/30 p-6">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Usage & Metrics
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Username
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    @{evaluationResult.username}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Posts Analyzed
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {evaluationResult.total_posts_analyzed}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Top Posts
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {evaluationResult.top_posts.length}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Input Tokens
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {evaluationResult.usage_input_tokens.toLocaleString()}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Output Tokens
                  </p>
                  <p className="text-lg font-semibold text-foreground">
                    {evaluationResult.usage_output_tokens.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Citations Modal */}
            {showAllCitations && (
              <div
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                onClick={() => setShowAllCitations(false)}
              >
                <div
                  className="bg-card border border-border rounded-sm max-w-4xl w-full max-h-[80vh] overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6 border-b border-border flex items-center justify-between">
                    <h3 className="text-xl font-bold text-foreground">
                      All Citations
                    </h3>
                    <button
                      onClick={() => setShowAllCitations(false)}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  <div className="p-6 overflow-y-auto max-h-[calc(80vh-5rem)]">
                    <div className="flex flex-wrap gap-2">
                      {evaluationResult.citations.map((citation, index) => {
                        const postId = citation.split("/").pop();
                        return (
                          <a
                            key={index}
                            href={citation}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-sm text-xs font-medium transition-colors border border-primary/20"
                          >
                            <svg
                              className="w-3 h-3"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                            </svg>
                            {postId}
                          </a>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
