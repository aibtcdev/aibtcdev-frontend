"use client";

import { useAuth } from "@/hooks/useAuth";
import { useXStatus } from "@/hooks/useXStatus";
import { User } from "lucide-react";
import { getStacksAddress } from "@/lib/address";

const DisplayUserProfile = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isProfileLoading } = useXStatus();

  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading || !isAuthenticated) {
    return null;
  }

  // If user has a username, display it (username only, no badge)
  if (profile?.username) {
    return (
      <div className="flex items-center gap-2 justify-center">
        <span className="font-inter font-bold tracking-tight text-sm">
          @{profile.username}
        </span>
        <div className="w-6 h-6 rounded-full border border-white flex items-center justify-center">
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  // If no username, show truncated Stacks address
  const stacksAddress = getStacksAddress();
  if (stacksAddress) {
    return (
      <div className="flex items-center gap-2 justify-center">
        <span className="font-inter font-bold tracking-tight text-sm">
          {`${stacksAddress.slice(0, 5)}...${stacksAddress.slice(-5)}`}
        </span>
        <div className="w-6 h-6 rounded-full border border-white flex items-center justify-center">
          <User className="w-3.5 h-3.5" />
        </div>
      </div>
    );
  }

  return null;
};

export default DisplayUserProfile;
