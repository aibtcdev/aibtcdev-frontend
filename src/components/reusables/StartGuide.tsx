"use client";

import { Button } from "@/components/ui/button";
import { useNextStep } from "nextstepjs";
import { useGuide } from "@/hooks/useGuide";

export function StartGuide() {
  const { startNextStep } = useNextStep();
  const { hasCompletedGuide, loading } = useGuide();

  const handleStartMainTour = () => {
    startNextStep("mainTour");
  };

  // Don't render anything while loading
  if (loading) {
    return null;
  }

  // Don't render if guide is completed
  if (hasCompletedGuide) {
    return null;
  }

  return (
    <div className="space-y-2" id="step1">
      <Button onClick={handleStartMainTour}>Guide Me</Button>
    </div>
  );
}
