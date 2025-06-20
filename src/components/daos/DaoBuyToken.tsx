"use client";

import type React from "react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TokenPurchaseModal } from "@/components/daos/TokenPurchaseModal";
import { PlusCircle } from "lucide-react";

interface DAOBuyTokenProps {
  daoId: string;
  daoName: string;
}

export function DAOBuyToken({ daoId, daoName }: DAOBuyTokenProps) {
  const [presetAmount, setPresetAmount] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleBuyClick = () => {
    setPresetAmount("");
    setIsModalOpen(true);
  };

  return (
    <>
      <Button
        variant="ghost"
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/20 bg-transparent px-4 py-2 text-sm font-bold text-primary shadow-md backdrop-blur-sm transition-all duration-300 ease-in-out hover:scale-105 hover:shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 motion-reduce:transition-none sm:px-4 sm:py-3 sm:text-base"
        onClick={(e) => {
          e.stopPropagation();
          handleBuyClick();
        }}
      >
        <PlusCircle className="h-4 w-4" />
        <span>Buy {daoName}</span>
      </Button>

      <TokenPurchaseModal
        daoId={daoId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        presetAmount={presetAmount}
      />
    </>
  );
}
