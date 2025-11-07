"use client";

export const runtime = "edge";

import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAllProposals } from "@/services/dao.service";
import { fetchDefaultPrompts, evaluateProposal } from "@/services/tool.service";
import type { EvaluationResult } from "@/services/tool.service";
import { supabase } from "@/services/supabase";
import { Loader } from "@/components/reusables/Loader";
import { AlertCircle, RotateCcw } from "lucide-react";

// Import components
import ProposalSelector from "@/components/evaluation/ProposalSelector";
import ProposalDisplay from "@/components/evaluation/ProposalDisplay";
import EvaluationResults from "@/components/evaluation/EvaluationResults";
import ModelSelector from "@/components/evaluation/ModelSelector";
import TemperatureSlider from "@/components/evaluation/TemperatureSlider";

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
  const [selectedModel, setSelectedModel] = useState<string>("x-ai/grok-4");
  const [temperature, setTemperature] = useState<number>(0.1);
  const [systemPrompt, setSystemPrompt] = useState<string>("");
  const [userPrompt, setUserPrompt] = useState<string>("");

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
  const { data: defaultPrompts } = useQuery({
    queryKey: ["defaultPrompts"],
    queryFn: () => {
      if (!authSession?.access_token) {
        throw new Error("Access token is required");
      }
      return fetchDefaultPrompts(authSession.access_token);
    },
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

  // Load default prompts when they become available
  useEffect(() => {
    if (defaultPrompts && systemPrompt === "" && userPrompt === "") {
      setSystemPrompt(defaultPrompts.system_prompt);
      setUserPrompt(defaultPrompts.user_prompt_template);
    }
  }, [defaultPrompts, systemPrompt, userPrompt]);

  // Get selected proposal
  const selectedProposal =
    proposals.find((proposal) => proposal.id === selectedProposalId) || null;

  // Handle reset to defaults
  const handleResetToDefaults = () => {
    setSelectedProposalId("");
    setSelectedModel("x-ai/grok-4");
    setTemperature(0.1);
    setEvaluationResult(null);
    setSubmitError(null);
    if (defaultPrompts) {
      setSystemPrompt(defaultPrompts.system_prompt);
      setUserPrompt(defaultPrompts.user_prompt_template);
    }
  };

  // Handle evaluation submission
  const handleEvaluationSubmit = async () => {
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
          model_name: selectedModel,
          temperature: temperature,
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
        <div className="text-center p-6 bg-destructive/10 border border-destructive/20 rounded-sm max-w-md">
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
        <div className="text-center p-6 bg-warning/10 border border-warning/20 rounded-sm max-w-md">
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

  const isFormValid =
    systemPrompt.trim() !== "" && userPrompt.trim() !== "" && selectedProposal;

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar-style Controls */}
      <div className="sticky top-0 z-10 backdrop-blur-md">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 gap-6">
            {/* Proposal Selector */}
            <div className="flex-1 min-w-0 max-w-sm">
              <ProposalSelector
                proposals={proposals}
                selectedProposalId={selectedProposalId}
                onProposalSelect={setSelectedProposalId}
                disabled={isSubmitting}
              />
            </div>

            {/* Model Selector */}
            <div className="flex-1 min-w-0 max-w-sm">
              <ModelSelector
                value={selectedModel}
                onChange={setSelectedModel}
                disabled={isSubmitting}
              />
            </div>

            {/* Temperature Slider */}
            <div className="flex-1 min-w-0 max-w-md">
              <TemperatureSlider
                value={temperature}
                onChange={setTemperature}
                disabled={isSubmitting}
                min={0}
                max={2}
                step={0.1}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex-shrink-0 flex items-center gap-3">
              {/* Evaluate Button */}
              <button
                type="button"
                onClick={handleEvaluationSubmit}
                disabled={!isFormValid || isSubmitting}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-sm hover:bg-primary/90 focus:ring-1 focus:ring-primary focus:ring-offset-1 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                title={
                  !isFormValid
                    ? "Select a proposal and fill both prompts to evaluate"
                    : "Start AI evaluation"
                }
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-sm h-4 w-4 border-2 border-white border-t-transparent" />
                    Evaluating...
                  </>
                ) : (
                  <>Evaluate</>
                )}
              </button>

              {/* Reset Button */}
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border/50 rounded-sm hover:bg-muted/50 transition-colors duration-200"
                disabled={isSubmitting}
                title="Reset all settings to defaults"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full p-4 sm:p-6 lg:p-8">
        {/* Error Display */}
        {submitError && (
          <div className="mb-6 bg-destructive/10 border border-destructive/20 rounded-sm p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-destructive mb-1">
                Evaluation Failed
              </h3>
              <p className="text-sm text-destructive/80">{submitError}</p>
            </div>
          </div>
        )}

        {/* Selected Proposal Display */}
        {selectedProposal && (
          <div className="mb-6">
            <ProposalDisplay
              proposal={selectedProposal}
              selectedProposalId={selectedProposalId}
            />
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* System Prompt Column */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl rounded-sm border border-border/30 p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                System Prompt
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Define the AI evaluator's role and evaluation framework.
                </p>
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="You are a comprehensive DAO governance evaluator..."
                  disabled={isSubmitting}
                  className="w-full h-64 p-3 text-sm bg-background border border-border rounded-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 resize-none font-mono"
                />
                <div className="text-xs text-muted-foreground">
                  {systemPrompt.length} characters
                </div>
              </div>
            </div>
          </div>

          {/* User Prompt Column */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-gradient-to-br from-card/60 via-card/40 to-card/20 backdrop-blur-xl rounded-sm border border-border/30 p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">
                User Prompt
              </h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Define the specific evaluation instructions and data
                  structure.
                </p>
                <textarea
                  value={userPrompt}
                  onChange={(e) => setUserPrompt(e.target.value)}
                  placeholder="Please conduct a comprehensive evaluation..."
                  disabled={isSubmitting}
                  className="w-full h-64 p-3 text-sm bg-background border border-border rounded-sm focus:ring-2 focus:ring-primary focus:border-primary transition-all duration-200 resize-none font-mono"
                />
                <div className="text-xs text-muted-foreground">
                  {userPrompt.length} characters
                </div>
              </div>
            </div>
          </div>

          {/* Evaluation Results - Spans 2 Columns */}
          <div className="lg:col-span-2">
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
