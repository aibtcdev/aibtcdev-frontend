"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Edit3, Send, Sparkles } from "lucide-react";

interface ProposalSubmissionProps {
  daoId: string;
}

export function ProposalSubmission({ daoId }: ProposalSubmissionProps) {
  const [proposalText, setProposalText] = useState("");

  const handleSubmit = () => {
    // Implement submission logic here
    console.log("Submitting for DAO:", daoId);
    console.log("Proposal:", proposalText);
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-foreground">
          <Edit3 className="w-5 h-5 text-primary" />
          <span>Create Proposal</span>
        </CardTitle>
        <CardDescription>
          Submit a new governance proposal to the DAO community
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Textarea
          placeholder="Describe your proposal in detail. What changes do you want to make? What are the benefits? Include any relevant context or rationale..."
          value={proposalText}
          onChange={(e) => setProposalText(e.target.value)}
          className="min-h-32 bg-background text-foreground placeholder:text-muted-foreground border-border focus:border-primary focus:ring-primary"
        />
        <div className="flex space-x-3">
          <Button variant="outline" className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4" />
            <span>Generate Message</span>
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground flex items-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>Submit Proposal</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
