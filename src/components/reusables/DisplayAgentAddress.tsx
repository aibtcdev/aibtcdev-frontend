"use client";

import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { fetchAgents } from "@/services/agent.service";
import { User } from "lucide-react";

const DisplayAgentAddress = () => {
  const { userId, isLoading: isSessionLoading } = useAuth();

  const { data: agents = [] } = useQuery({
    queryKey: ["agents"],
    queryFn: fetchAgents,
  });
  const userAgent = agents[0] || null;
  const userAgentAddress = userAgent?.account_contract || null;

  if (isSessionLoading || !userId) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 justify-center">
      <div className="flex items-center gap-1.5">
        <span className="font-inter font-bold tracking-tight text-sm break-all">
          {userAgentAddress
            ? `${userAgentAddress.slice(0, 5)}...${userAgentAddress.slice(-5)}`
            : "No agent address"}
        </span>
        <div className="w-6 h-6 rounded-full border border-white flex items-center justify-center">
          <User className="w-3.5 h-3.5 " />
        </div>
      </div>
    </div>
  );
};

export default DisplayAgentAddress;
