"use client";

import { useAuth } from "@/hooks/useAuth";
import { User } from "lucide-react";
import { getStacksAddress } from "@/lib/address";

const DisplayAgentAddress = () => {
  const { userId, isLoading: isSessionLoading } = useAuth();

  const stacksAddress = userId ? getStacksAddress() : null;

  if (isSessionLoading || !userId) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 justify-center">
      <div className="flex items-center gap-1.5">
        <span className="font-inter font-bold tracking-tight text-sm break-all">
          {`${stacksAddress?.slice(0, 5)}...${stacksAddress?.slice(-5)}`}
        </span>
        <div className="w-6 h-6 rounded-full border border-white flex items-center justify-center">
          <User className="w-3.5 h-3.5 " />
        </div>
      </div>
    </div>
  );
};

export default DisplayAgentAddress;
