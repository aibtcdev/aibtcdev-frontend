import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface EvaluationData {
  flags: string[];
  summary: string;
  decision: boolean;
  categories: Array<{
    score: number;
    weight: number;
    category: string;
    reasoning: string[];
  }>;
  explanation: string;
  final_score: number;
  token_usage?: string;
  images_processed?: number;
}

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: string | object | null;
  proposalTitle?: string;
}

export function EvaluationModal({
  isOpen,
  onClose,
  evaluation,
  proposalTitle,
}: EvaluationModalProps) {
  const parseEvaluation = (
    evaluation: string | object
  ): EvaluationData | null => {
    try {
      // If it's already an object, return it directly
      if (typeof evaluation === "object") {
        return evaluation as EvaluationData;
      }
      // If it's a string, try to parse it as JSON
      if (
        typeof evaluation === "string" &&
        evaluation.trim().startsWith("{") &&
        evaluation.trim().endsWith("}")
      ) {
        return JSON.parse(evaluation);
      }
      return null;
    } catch {
      // Silently return null for non-JSON strings
      return null;
    }
  };

  const evaluationData = evaluation ? parseEvaluation(evaluation) : null;

  if (!evaluationData) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Evaluation Details</DialogTitle>
          </DialogHeader>
          <div className="p-4 text-center text-muted-foreground">
            {evaluation ? "Invalid evaluation data" : "No evaluation available"}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return "default";
    if (score >= 60) return "secondary";
    return "destructive";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {evaluationData.decision ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <XCircle className="h-5 w-5 text-red-600" />
            )}
            Evaluation Details
            {proposalTitle && (
              <span className="text-sm font-normal text-muted-foreground">
                - {proposalTitle}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-120px)]">
          <div className="space-y-6 p-1">
            {/* Summary Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Summary</h3>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={getScoreBadgeVariant(evaluationData.final_score)}
                    className="text-sm"
                  >
                    Score: {evaluationData.final_score}/100
                  </Badge>
                  <Badge
                    variant={
                      evaluationData.decision ? "default" : "destructive"
                    }
                  >
                    {evaluationData.decision ? "Approved" : "Rejected"}
                  </Badge>
                </div>
              </div>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm leading-relaxed">
                  {evaluationData.summary}
                </p>
              </div>
            </div>

            {/* Flags Section */}
            {evaluationData.flags && evaluationData.flags.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  Flags
                </h3>
                <div className="space-y-2">
                  {evaluationData.flags.map((flag, index) => (
                    <div
                      key={index}
                      className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3"
                    >
                      <p className="text-sm text-yellow-800 dark:text-yellow-200">
                        {flag}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Categories Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Evaluation Categories</h3>
              <div className="grid gap-4">
                {evaluationData.categories.map((category, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">{category.category}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">
                          Weight: {(category.weight * 100).toFixed(1)}%
                        </span>
                        <Badge variant={getScoreBadgeVariant(category.score)}>
                          {category.score}/100
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {category.reasoning.map((reason, reasonIndex) => (
                        <div
                          key={reasonIndex}
                          className="bg-muted/20 rounded p-3"
                        >
                          <p className="text-sm leading-relaxed">{reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Detailed Explanation */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Detailed Explanation</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {evaluationData.explanation}
                </p>
              </div>
            </div>

            {/* Metadata */}
            {(evaluationData.images_processed ||
              evaluationData.token_usage) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold">Processing Metadata</h3>
                  <div className="flex gap-4 text-sm text-muted-foreground">
                    {evaluationData.images_processed && (
                      <span>
                        Images Processed: {evaluationData.images_processed}
                      </span>
                    )}
                    {evaluationData.token_usage &&
                      Object.keys(evaluationData.token_usage).length > 0 && (
                        <span>Token Usage: Available</span>
                      )}
                  </div>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
