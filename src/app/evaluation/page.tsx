"use client";

export const runtime = "edge";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllProposals } from "@/services/dao.service";
import { fetchDefaultPrompts, evaluateProposal } from "@/services/tool.service";
import type { DefaultPrompts, EvaluationResult } from "@/services/tool.service";
import { supabase } from "@/services/supabase";
import { Loader } from "@/components/reusables/Loader";
import { AlertCircle } from "lucide-react";

// Import components
import ProposalSelector from "@/components/evaluation/ProposalSelector";
import ProposalDisplay from "@/components/evaluation/ProposalDisplay";
import PromptEditor from "@/components/evaluation/PromptEditor";
import EvaluationResults from "@/components/evaluation/EvaluationResults";

// Types
interface AuthSession {
  access_token?: string;
  user?: {
    id: string;
    email?: string;
  };
}

export default function ProposalEvaluationPage() {
  // State management
  const [selectedProposalId, setSelectedProposalId] = useState<string>("");
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [evaluationResult, setEvaluationResult] =
    useState<EvaluationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Fetch all proposals using React Query
  const {
    data: proposals = [],
    isLoading: proposalsLoading,
    error: proposalsError,
  } = useQuery({
    queryKey: ["allProposals"],
    queryFn: () => fetchAllProposals(),
    staleTime: 60000, // Cache for 1 minute
  });

  // Fetch default prompts
  const {
    data: defaultPrompts,
    isLoading: promptsLoading,
    error: promptsError,
  } = useQuery({
    queryKey: ["defaultPrompts"],
    queryFn: () => fetchDefaultPrompts(authSession?.access_token!),
    enabled: !!authSession?.access_token,
    staleTime: 300000, // Cache for 5 minutes
  });

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

  // Get selected proposal
  const selectedProposal =
    proposals.find((proposal) => proposal.id === selectedProposalId) || null;

  // Handle evaluation submission
  const handleEvaluationSubmit = async (
    systemPrompt: string,
    userPrompt: string
  ) => {
    if (!selectedProposal || !authSession?.access_token) {
      setSubmitError("Missing required data for evaluation");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    setEvaluationResult(null);

    try {
      const result = await evaluateProposal(authSession.access_token, {
        proposal_id: selectedProposal.id,
        dao_id: selectedProposal.dao_id,
        custom_system_prompt: systemPrompt,
        custom_user_prompt: userPrompt,
        config: {
          model_name: "gpt-4.1",
          temperature: 0.1,
          approval_threshold: 75,
        },
      });

      setEvaluationResult(result);
    } catch (error) {
      console.error("Evaluation error:", error);
      setSubmitError(
        error instanceof Error ? error.message : "Failed to evaluate proposal"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading states
  if (authLoading || proposalsLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
        <Loader />
      </div>
    );
  }

  // Error states
  if (proposalsError) {
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
        <div className="text-center p-6 bg-destructive/10 border border-destructive/20 rounded-xl max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-foreground">
            Error Loading Proposals
          </h2>
          <p className="text-muted-foreground">
            Failed to load proposals. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  if (!authSession) {
    return (
      <div className="flex justify-center items-center min-h-[400px] w-full">
        <div className="text-center p-6 bg-warning/10 border border-warning/20 rounded-xl max-w-md">
          <AlertCircle className="h-12 w-12 text-warning mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2 text-foreground">
            Authentication Required
          </h2>
          <p className="text-muted-foreground">
            Please log in to evaluate proposals.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground mb-3">
            Proposal Evaluation
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Select a proposal, customize evaluation prompts, and get
            comprehensive AI analysis across multiple dimensions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Selection and Prompts */}
          <div className="space-y-6">
            <ProposalSelector
              proposals={proposals}
              selectedProposalId={selectedProposalId}
              onProposalSelect={setSelectedProposalId}
              disabled={isSubmitting}
            />

            <ProposalDisplay
              proposal={selectedProposal}
              selectedProposalId={selectedProposalId}
            />

            <PromptEditor
              defaultPrompts={defaultPrompts}
              promptsLoading={promptsLoading}
              promptsError={promptsError}
              onSubmit={handleEvaluationSubmit}
              isSubmitting={isSubmitting}
              submitError={submitError}
              canSubmit={!!selectedProposal && !!authSession?.access_token}
            />
          </div>

          {/* Right Column - Results */}
          <div className="space-y-6">
            <EvaluationResults
              result={evaluationResult}
              isSubmitting={isSubmitting}
              proposal={selectedProposal}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
