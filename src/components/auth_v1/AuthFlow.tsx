"use client";

import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AuthFlow() {
  const {
    isAuthenticated,
    isLoading,
    userAddress,
    error,
    initiateAuthentication,
    logout,
  } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Flow</CardTitle>
          <CardDescription>
            Connect your wallet and authenticate
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAuthenticated ? (
            <Button onClick={initiateAuthentication} className="w-full">
              Connect Wallet and Authenticate
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-green-600">
                Authenticated Successfully
                <br />
                Address: {userAddress}
              </p>
              <Button
                onClick={logout}
                variant="destructive"
                className="w-full mt-4"
              >
                Logout
              </Button>
            </div>
          )}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
