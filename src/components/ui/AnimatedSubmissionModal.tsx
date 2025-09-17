"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AnimatedSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  daoName: string;
  currentStep: number;
  isError?: boolean;
  errorMessage?: string;
  isCompleted?: boolean;
}

const SUBMISSION_STEPS = [
  { id: "submitting", label: "submitting contribution for" },
  { id: "processing", label: "processing the contribution" },
  { id: "checking", label: "checking agent voting account" },
  { id: "setup", label: "setting up contribution transaction" },
  { id: "broadcasting", label: "broadcasting transaction to network" },
];

export function AnimatedSubmissionModal({
  isOpen,
  onClose,
  daoName,
  currentStep,
  isError = false,
  errorMessage,
  isCompleted = false,
}: AnimatedSubmissionModalProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  // Update current step index based on prop
  useEffect(() => {
    setCurrentStepIndex(Math.min(currentStep, SUBMISSION_STEPS.length - 1));
  }, [currentStep]);

  // Fade transition effect for step changes
  useEffect(() => {
    if (isError) return;

    const newText =
      isCompleted || currentStepIndex >= SUBMISSION_STEPS.length
        ? "contribution submitted successfully!"
        : currentStepIndex === 0
          ? `${SUBMISSION_STEPS[currentStepIndex].label} ${daoName}...`
          : `${SUBMISSION_STEPS[currentStepIndex].label}...`;

    // Fade out current text
    setIsVisible(false);

    // After fade out completes, update text and fade in
    const timeout = setTimeout(() => {
      setDisplayText(newText);
      setIsVisible(true);
    }, 200); // Match the CSS transition duration

    return () => clearTimeout(timeout);
  }, [currentStepIndex, daoName, isError, isCompleted]);

  const getStepStatus = (
    stepIndex: number
  ): "pending" | "active" | "completed" | "error" => {
    if (isError && stepIndex === currentStepIndex) return "error";
    if (stepIndex < currentStepIndex) return "completed";
    if (stepIndex === currentStepIndex) return "active";
    return "pending";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold">
            {isError ? "Submission Failed" : "Submitting Contribution"}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isError
              ? "There was an error processing your contribution"
              : "Please wait while we process your contribution to the DAO"}
          </DialogDescription>
        </DialogHeader>

        <div className="py-8">
          {isError ? (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                <AlertCircle className="w-8 h-8 text-destructive" />
              </div>
              <div className="space-y-2">
                <p className="font-medium text-destructive">Submission Error</p>
                {errorMessage && (
                  <p className="text-sm text-muted-foreground">
                    {errorMessage}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center space-y-6">
              {/* Animated Icon */}
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                {isCompleted ? (
                  <Check className="w-10 h-10 text-primary" />
                ) : (
                  <Loader2 className="w-10 h-10 text-primary animate-spin" />
                )}
              </div>

              {/* Current Step Text - Large and Centered */}
              <div className="min-h-[4rem] flex items-center justify-center px-4">
                <p
                  className={cn(
                    "text-xl font-semibold text-primary text-center leading-relaxed transition-opacity duration-200 ease-in-out",
                    isVisible ? "opacity-100" : "opacity-0"
                  )}
                >
                  {displayText}
                </p>
              </div>

              {/* Simple Progress Bar */}
              <div className="w-full max-w-xs mx-auto">
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={cn(
                      "h-2 rounded-full transition-all duration-500 ease-out",
                      isError
                        ? "bg-destructive"
                        : isCompleted
                          ? "bg-green-500"
                          : "bg-primary"
                    )}
                    style={{
                      width: isCompleted
                        ? "100%"
                        : `${((currentStepIndex + 1) / SUBMISSION_STEPS.length) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mt-2">
                  <span>Step {currentStepIndex + 1}</span>
                  <span>{SUBMISSION_STEPS.length} steps</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
