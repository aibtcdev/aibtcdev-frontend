"use client";

import { useAuth } from "@/hooks/useAuth";
import { useXStatus } from "@/hooks/useXStatus";
import { User } from "lucide-react";
import { XLinking } from "@/components/auth/XLinking";

const DisplayUserProfile = () => {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const { profile, isLoading: isProfileLoading } = useXStatus();

  const isLoading = isAuthLoading || isProfileLoading;

  if (isLoading || !isAuthenticated) {
    return null;
  }

  // If user has a username, display it
  if (profile?.username) {
    return (
      <div className="flex items-center gap-2 justify-center">
        <div className="flex items-center gap-1.5">
          <span className="font-inter font-bold tracking-tight text-sm">
            @{profile.username}
          </span>
          <div className="w-6 h-6 rounded-sm border border-white flex items-center justify-center">
            <User className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    );
  }

  // If no username, show compact X linking button
  return (
    <div className="flex items-center gap-2">
      <XLinking compact={true} showTitle={false} />
    </div>
  );
};

export default DisplayUserProfile;
