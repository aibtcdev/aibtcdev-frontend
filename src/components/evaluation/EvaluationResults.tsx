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

interface EvaluationCategory {
  category: string;
  score: number;
  weight: number;
  reasoning: string[];
}

interface EvaluationResult {
  proposal_id: string;
  categories: EvaluationCategory[];
  final_score: number;
  decision: boolean;
  explanation: string;
  flags: string[];
  summary: string;
  token_usage: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    model_name: string;
  };
  images_processed: number;
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
      <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4">
        <div className="flex items-center justify-center space-x-3">
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-primary border-t-transparent" />
          <div className="text-center">
            <h3 className="text-base font-semibold text-foreground mb-1">
              Evaluating Proposal
            </h3>
            <p className="text-xs text-muted-foreground">
              AI is analyzing the proposal across multiple dimensions...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-muted/20 border border-muted/30 rounded-xl p-6 text-center">
        <Brain className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="text-base font-semibold text-foreground mb-2">
          Ready for Evaluation
        </h3>
        <p className="text-muted-foreground text-xs">
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

  const getCategoryIcon = (category: string) => {
    const lowerCategory = category.toLowerCase();
    if (lowerCategory.includes("core") || lowerCategory.includes("context"))
      return Brain;
    if (
      lowerCategory.includes("financial") ||
      lowerCategory.includes("finance")
    )
      return DollarSign;
    if (
      lowerCategory.includes("historical") ||
      lowerCategory.includes("history")
    )
      return History;
    if (lowerCategory.includes("social") || lowerCategory.includes("community"))
      return Users;
    return FileText; // Default icon
  };

  return (
    <div className="space-y-3">
      {/* Overall Result Header */}
      <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {result.decision ? (
              <CheckCircle2 className="h-6 w-6 text-green-500" />
            ) : (
              <XCircle className="h-6 w-6 text-red-500" />
            )}
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {result.decision ? "Approved" : "Rejected"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Final Score: {result.final_score}/100
              </p>
            </div>
          </div>
          <div className="text-right">
            <div
              className={`text-2xl font-bold ${getScoreColor(result.final_score)}`}
            >
              {result.final_score}
            </div>
            <div className="text-xs text-muted-foreground">
              {result.token_usage?.model_name || "N/A"}
            </div>
          </div>
        </div>

        {/* Overall Assessment */}
        <div className="bg-background/50 rounded-lg p-3">
          <h3 className="font-semibold text-foreground mb-2 flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4" />
            Overall Assessment
          </h3>
          <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
            {result.explanation}
          </p>
        </div>
      </div>

      {/* Flags & Recommendations */}
      {result.flags &&
        Array.isArray(result.flags) &&
        result.flags.length > 0 && (
          <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4">
            <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              Flags & Recommendations
            </h3>
            <div className="space-y-2">
              {result.flags.map((flag, index) => (
                <div
                  key={index}
                  className="flex items-start gap-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg"
                >
                  <Info className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                  <span className="text-xs text-foreground">{flag}</span>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* Summary */}
      <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4">
        <h3 className="text-base font-semibold text-foreground mb-2 flex items-center gap-2">
          <Info className="h-4 w-4" />
          Executive Summary
        </h3>
        <div className="bg-background/50 rounded-lg p-3">
          <p className="text-xs text-foreground leading-relaxed">
            {result.summary}
          </p>
        </div>
      </div>

      {/* Detailed Category Scores */}
      <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4">
        <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <BarChart3 className="h-4 w-4" />
          Detailed Analysis by Category
        </h3>

        <div className="space-y-3">
          {Array.isArray(result.categories) &&
            result.categories.map((category, index) => {
              const ScoreIcon = getScoreIcon(category.score);
              const CategoryIcon = getCategoryIcon(category.category);

              return (
                <div
                  key={index}
                  className="border border-border/20 rounded-lg p-3"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <CategoryIcon className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground text-sm">
                        {category.category}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({(category.weight * 100).toFixed(0)}%)
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ScoreIcon
                        className={`h-4 w-4 ${getScoreColor(category.score)}`}
                      />
                      <span
                        className={`font-bold text-sm ${getScoreColor(category.score)}`}
                      >
                        {category.score}/100
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-muted/30 rounded-full h-1.5 mb-2">
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        category.score >= 80
                          ? "bg-green-500"
                          : category.score >= 60
                            ? "bg-yellow-500"
                            : "bg-red-500"
                      }`}
                      style={{ width: `${category.score}%` }}
                    />
                  </div>

                  {/* Category Reasoning */}
                  <div className="space-y-1">
                    {Array.isArray(category.reasoning) &&
                      category.reasoning.map((reason, reasonIndex) => (
                        <div
                          key={reasonIndex}
                          className="bg-background/30 rounded p-2"
                        >
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {reason}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Metadata */}
      <div className="bg-card/40 backdrop-blur-sm border border-border/30 rounded-xl p-4">
        <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4" />
          Evaluation Metadata
        </h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-2">
            <FileText className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Images:</span>
            <span className="text-foreground font-medium">
              {result.images_processed}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Total Tokens:</span>
            <span className="text-foreground font-medium">
              {result.token_usage?.total_tokens?.toLocaleString() || "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Brain className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Input:</span>
            <span className="text-foreground font-medium">
              {result.token_usage?.input_tokens?.toLocaleString() || "N/A"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span className="text-muted-foreground">Output:</span>
            <span className="text-foreground font-medium">
              {result.token_usage?.output_tokens?.toLocaleString() || "N/A"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
