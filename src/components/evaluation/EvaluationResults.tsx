import React from "react";
import {
  CheckCircle2,
  XCircle,
  BarChart3,
  TrendingUp,
  FileText,
  AlertTriangle,
  Clock,
  Brain,
  DollarSign,
  History,
  Users,
  Zap,
  Info,
} from "lucide-react";
import type { ProposalWithDAO } from "@/types";

interface EvaluationResult {
  proposal_id: string;
  approve: boolean;
  overall_score: number;
  reasoning: string;
  scores: {
    core: number;
    historical: number;
    financial: number;
    social: number;
    final: number;
  };
  flags: string[];
  summaries: {
    core_score: string;
    financial_score: string;
    historical_score: string;
    social_score: string;
  };
  token_usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
  model_name: string;
  workflow_step: string;
  images_processed: number;
  evaluation_type: string;
}

interface EvaluationResultsProps {
  result: EvaluationResult | null;
  isSubmitting: boolean;
  proposal: ProposalWithDAO | null;
}

export default function EvaluationResults({
  result,
  isSubmitting,
}: EvaluationResultsProps) {
  if (isSubmitting) {
    return (
      <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-6">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Evaluating Proposal
            </h3>
            <p className="text-sm text-muted-foreground">
              AI is analyzing the proposal across multiple dimensions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-muted/20 border border-muted/30 rounded-xl p-8 text-center">
        <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Ready for Evaluation
        </h3>
        <p className="text-muted-foreground text-sm">
          Select a proposal and customize the prompts to start the AI
          evaluation.
        </p>
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return CheckCircle2;
    if (score >= 60) return AlertTriangle;
    return XCircle;
  };

  const scoreItems = [
    {
      key: "core",
      label: "Core Analysis",
      icon: Brain,
      summary: result.summaries.core_score,
    },
    {
      key: "financial",
      label: "Financial Impact",
      icon: DollarSign,
      summary: result.summaries.financial_score,
    },
    {
      key: "historical",
      label: "Historical Context",
      icon: History,
      summary: result.summaries.historical_score,
    },
    {
      key: "social",
      label: "Social Dynamics",
      icon: Users,
      summary: result.summaries.social_score,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Overall Result Header */}
      <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {result.approve ? (
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500" />
            )}
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                {result.approve ? "Approved" : "Rejected"}
              </h2>
              <p className="text-sm text-muted-foreground">
                Overall Score: {result.overall_score}/100
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-3xl font-bold ${getScoreColor(result.overall_score)}`}
            >
              {result.overall_score}
            </div>
            <div className="text-xs text-muted-foreground">
              {result.model_name}
            </div>
          </div>
        </div>

        {/* Overall Reasoning */}
        <div className="bg-background/50 rounded-lg p-4">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Overall Assessment
          </h3>
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
            {result.reasoning}
          </p>
        </div>
      </div>

      {/* Detailed Scores */}
      <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Detailed Analysis
        </h3>

        <div className="space-y-4">
          {scoreItems.map((item) => {
            const score = result.scores[item.key as keyof typeof result.scores];
            const ScoreIcon = getScoreIcon(score);
            const ItemIcon = item.icon;

            return (
              <div
                key={item.key}
                className="border border-border/20 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <ItemIcon className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-foreground">
                      {item.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ScoreIcon className={`h-4 w-4 ${getScoreColor(score)}`} />
                    <span className={`font-bold ${getScoreColor(score)}`}>
                      {score}/100
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-muted/30 rounded-full h-2 mb-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      score >= 80
                        ? "bg-green-500"
                        : score >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>

                {/* Summary */}
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.summary}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Flags & Recommendations */}
      {result.flags && result.flags.length > 0 && (
        <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Flags & Recommendations
          </h3>
          <div className="space-y-2">
            {result.flags.map((flag, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
              >
                <Info className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span className="text-sm text-foreground">{flag}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Evaluation Metadata
        </h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Type:</span>
            <span className="text-foreground font-medium">
              {result.evaluation_type.replace(/_/g, " ").toUpperCase()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Tokens:</span>
            <span className="text-foreground font-medium">
              {result.token_usage.total_tokens.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Step:</span>
            <span className="text-foreground font-medium">
              {result.workflow_step.replace(/_/g, " ")}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Model:</span>
            <span className="text-foreground font-medium">
              {result.model_name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
