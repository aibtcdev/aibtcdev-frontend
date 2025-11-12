import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface SuccessModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  agentId: string;
}

export function SuccessModal({
  isOpen,
  onOpenChange,
  agentId,
}: SuccessModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-sm bg-green-100">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center pt-4">
            Successfully participated in DAO.
          </DialogTitle>
          <DialogDescription className="text-center">
            Your agent will now actively participate by sending proposals and
            voting every hour.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center">
          <Button asChild>
            <Link href={`/agents/${agentId}/tasks`}>View Tasks</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
