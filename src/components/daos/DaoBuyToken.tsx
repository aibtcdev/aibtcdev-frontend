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
        className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base font-inter font-bold bg-transparent text-primary border border-primary/20 rounded-lg sm:rounded-xl hover:scale-105 hover:shadow-lg hover:shadow-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all duration-300 ease-in-out motion-reduce:transition-none backdrop-blur-sm shadow-md"
        onClick={(e) => {
          e.stopPropagation();
          handleBuyClick();
        }}
      >
        <PlusCircle className="w-4 h-4 mr-2" />
        Buy {daoName}
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
