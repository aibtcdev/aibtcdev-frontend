"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  checkSessionToken,
  initiateAuthentication,
  promptSignMessage,
  logout,
} from "@/helpers/authHelpers";

export default function AuthFlow() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      try {
        const authResult = await checkSessionToken();
        if (authResult) {
          setIsAuthenticated(true);
          console.log("STX Address:", authResult.stxAddress);
          console.log("Session Token:", authResult.sessionToken);
        }
      } catch (err) {
        console.error("Session verification error:", err);
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const handleAuthenticate = () => {
    initiateAuthentication((address) => {
      promptSignMessage(
        address,
        () => {
          setIsAuthenticated(true);
          setError(null);
          console.log("Authentication successful.");
        },
        (errorMessage) => {
          setError(errorMessage);
        }
      );
    });
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    console.log("Logged out successfully");
  };

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
            <Button onClick={handleAuthenticate} className="w-full">
              Connect Wallet and Authenticate
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-green-600">
                Authenticated Successfully! ..session and is stored in
                localstorage
              </p>
              <Button
                onClick={handleLogout}
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
