"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/new/useAuth";
import { useProfiles } from "@/hooks/new/useProfiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ConnectWallet() {
  const {
    isAuthenticated,
    isLoading,
    userAddress,
    error: authError,
    initiateAuthentication,
    logout,
  } = useAuth();
  const {
    getUserProfile,
    createUserProfile,
    loading: profileLoading,
    error: profileError,
  } = useProfiles();
  const [profileChecked, setProfileChecked] = useState(false);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAndCreateProfile = async () => {
      if (isAuthenticated && userAddress && !profileChecked) {
        try {
          let profile = await getUserProfile(userAddress);
          console.log("Fetched profile:", profile);

          if (!profile) {
            console.log("Creating new profile for address:", userAddress);
            const newProfileData = {
              stx_address: userAddress,
              user_role: "normal" as const,
            };
            console.log("New profile data:", newProfileData);

            profile = await createUserProfile(newProfileData);
            console.log("Created profile:", profile);
          }

          setUserProfile(profile);
        } catch (error) {
          console.error("Error checking/creating profile:", error);
          setError(error instanceof Error ? error.message : String(error));
        } finally {
          setProfileChecked(true);
        }
      }
    };

    checkAndCreateProfile();
  }, [
    isAuthenticated,
    userAddress,
    profileChecked,
    getUserProfile,
    createUserProfile,
  ]);

  const handleConnect = async () => {
    setProfileChecked(false);
    setUserProfile(null);
    setError(null);
    initiateAuthentication();
  };

  if (isLoading || profileLoading) {
    return <Button disabled>Loading...</Button>;
  }

  if (error || authError || profileError) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500">
            {error ||
              authError?.toString() ||
              profileError?.toString() ||
              "An unknown error occurred"}
          </p>
          <Button onClick={handleConnect} className="mt-4">
            connect wallet
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isAuthenticated && userAddress && userProfile) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>User Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className=" p-4 rounded-md overflow-auto max-h-96">
            {JSON.stringify(userProfile, null, 2)}
          </pre>
          <Button onClick={logout} className="mt-4">
            Disconnect
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Button onClick={handleConnect}>Connect Wallet</Button>
    </div>
  );
}
