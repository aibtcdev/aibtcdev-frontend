"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TokenPurchaseModal } from "@/components/daos/TokenPurchaseModal";

interface DAOBuyTokenProps {
  daoId: string;
  daoName: string;
}

export function DAOBuyToken({ daoId, daoName }: DAOBuyTokenProps) {
  const [presetAmount, setPresetAmount] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleQuickBuy = (amount: string) => {
    setPresetAmount(amount);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <Button
        variant="primary"
        onClick={(e) => {
          e.stopPropagation();
          handleQuickBuy("20000");
        }}
      >
        Buy {daoName}
      </Button>

      <TokenPurchaseModal
        daoId={daoId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        presetAmount={presetAmount}
      />
    </div>
  );
}
