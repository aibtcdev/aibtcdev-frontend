"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/new/useAuth";
import { useProfiles } from "@/hooks/new/useProfiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
  const router = useRouter();
  const { isAuthenticated, userAddress } = useAuth();
  const {
    getUserProfile,
    createUserProfile,
    error: profileError,
  } = useProfiles();

  const [userProfile, setUserProfile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkAndCreateProfile = useCallback(async () => {
    if (!isAuthenticated || !userAddress) {
      setIsLoading(false);
      return;
    }

    try {
      let profile = await getUserProfile(userAddress);

      if (!profile) {
        profile = await createUserProfile({
          stx_address: userAddress,
          user_role: "normal" as const,
        });
      }

      setUserProfile(profile);
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userAddress, getUserProfile, createUserProfile]);

  useEffect(() => {
    checkAndCreateProfile();
  }, [checkAndCreateProfile]);

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent>
          <p className="text-center">Loading profile...</p>
        </CardContent>
      </Card>
    );
  }

  if (!isAuthenticated) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Required</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Please connect your wallet to view your profile.</p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Go to Connect
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (error || profileError) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">
            {error || profileError?.toString() || "An unknown error occurred"}
          </p>
          <Button onClick={() => router.push("/")} className="mt-4">
            Back to Connect
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>User Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className=" p-4 rounded-md overflow-auto max-h-96">
          <pre className="text-sm">{JSON.stringify(userProfile, null, 2)}</pre>
        </div>
        <Button onClick={() => router.push("/chat")} className="mt-4">
          Go to Chat
        </Button>
      </CardContent>
    </Card>
  );
}
