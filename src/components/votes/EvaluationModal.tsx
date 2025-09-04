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
            <DialogTitle>Agent Evaluation Details</DialogTitle>
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
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="flex items-center gap-2 flex-wrap text-base sm:text-lg">
            {evaluationData.decision ? (
              <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 flex-shrink-0" />
            )}
            <span className="break-words">Agent Evaluation Details</span>
            {proposalTitle && (
              <span className="text-xs sm:text-sm font-normal text-muted-foreground break-words">
                - {proposalTitle}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-140px)] overflow-x-hidden">
          <div className="space-y-4 sm:space-y-6 pr-2">
            {/* Summary Section */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <h3 className="text-base sm:text-lg font-semibold">Summary</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge
                    variant={getScoreBadgeVariant(evaluationData.final_score)}
                    className="text-xs sm:text-sm flex-shrink-0"
                  >
                    Score: {evaluationData.final_score}/100
                  </Badge>
                  <Badge
                    variant={
                      evaluationData.decision ? "default" : "destructive"
                    }
                    className="text-xs sm:text-sm flex-shrink-0"
                  >
                    {evaluationData.decision ? "Approved" : "Rejected"}
                  </Badge>
                </div>
              </div>
              <div className="rounded-lg p-3 sm:p-4 bg-muted/30">
                <p className="text-xs sm:text-sm leading-relaxed break-words overflow-wrap-anywhere">
                  {evaluationData.summary}
                </p>
              </div>
            </div>

            {/* Categories Section (Simplified, one line per category) */}
            <div className="space-y-2">
              {evaluationData.categories.map((category, index) => {
                const reasons = (category.reasoning || [])
                  .filter(Boolean)
                  .join(" ");
                return (
                  <div
                    key={index}
                    className="text-xs sm:text-sm leading-relaxed bg-muted/30 p-2 sm:p-3 rounded-md"
                  >
                    <span className="font-bold text-sm sm:text-base block sm:inline">
                      {category.category} ({category.score})
                    </span>
                    <span className="block sm:inline break-words overflow-wrap-anywhere">
                      {reasons ? `: ${reasons}` : ": —"}
                    </span>
                  </div>
                );
              })}
            </div>

            <Separator />

            {evaluationData.flags && evaluationData.flags.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-base sm:text-lg font-semibold flex items-center gap-2 flex-wrap">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                  <span>Flags</span>
                </h3>
                <div className="space-y-2">
                  {evaluationData.flags.map((flag, index) => (
                    <div
                      key={index}
                      className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-2 sm:p-3"
                    >
                      <p className="text-xs sm:text-sm text-yellow-800 dark:text-yellow-200 break-words overflow-wrap-anywhere">
                        {flag}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* Detailed Explanation */}
            {/* <div className="space-y-3">
              <h3 className="text-lg font-semibold">Detailed Explanation</h3>
              <div className="bg-muted/30 rounded-lg p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {evaluationData.explanation}
                </p>
              </div>
            </div> */}

            {/* Metadata */}
            {(evaluationData.images_processed ||
              evaluationData.token_usage) && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="text-base sm:text-lg font-semibold">
                    Processing Metadata
                  </h3>
                  <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-muted-foreground">
                    {evaluationData.images_processed && (
                      <span className="break-words">
                        Images Processed: {evaluationData.images_processed}
                      </span>
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
