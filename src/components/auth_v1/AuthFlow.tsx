"use client";
import React, { useState, useEffect } from "react";
import { showConnect, openSignatureRequestPopup } from "@stacks/connect";
import { AppConfig, UserSession } from "@stacks/auth";
import { StacksMainnet } from "@stacks/network";
import { verifyMessageSignatureRsv } from "@stacks/encryption";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });

const FRONTEND_SECRET_KEY = "c4cf807d-acb2-497c-84e8-3098957b5339";
const API_BASE_URL = "https://services.aibtc.dev/auth";

export default function AuthFlow() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkSessionToken();
  }, []);

  const checkSessionToken = async () => {
    const sessionToken = localStorage.getItem("sessionToken");
    if (sessionToken) {
      try {
        const response = await fetch(`${API_BASE_URL}/verify-session-token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: FRONTEND_SECRET_KEY,
          },
          body: JSON.stringify({ data: sessionToken }),
        });

        const data = await response.json();
        if (response.ok) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem("sessionToken");
          setError(data.error || "Session verification failed");
        }
      } catch (error) {
        console.error("Error verifying session token:", error);
        setError("Failed to verify session. Please try again.");
      }
    }
    setIsLoading(false);
  };

  const authenticate = () => {
    showConnect({
      appDetails: {
        name: "sprint.aibtc.dev",
        icon: window.location.origin + "/app-icon.png",
      },
      redirectTo: "/",
      onFinish: () => {
        const userData = userSession.loadUserData();
        promptSignMessage(userData.profile.stxAddress.mainnet);
      },
      userSession: userSession,
    });
  };

  const promptSignMessage = (stxAddress: string) => {
    const message = "Welcome to aibtcdev!";

    openSignatureRequestPopup({
      message,
      network: new StacksMainnet(),
      appDetails: {
        name: "sprint.aibtc.dev",
        icon: window.location.origin + "/app-icon.png",
      },
      stxAddress,
      onFinish: (data) =>
        verifyAndSendSignedMessage(
          message,
          data.signature,
          data.publicKey,
          stxAddress
        ),
      onCancel: () => {
        setError("Message signing was cancelled.");
      },
    });
  };

  const verifyAndSendSignedMessage = async (
    message: string,
    signature: string,
    publicKey: string,
    stxAddress: string
  ) => {
    try {
      // Optional: Verify signature locally before sending
      const isSignatureValid = verifyMessageSignatureRsv({
        message,
        signature,
        publicKey,
      });

      if (!isSignatureValid) {
        setError("Signature verification failed");
        return;
      }

      const response = await fetch(`${API_BASE_URL}/request-auth-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: FRONTEND_SECRET_KEY,
        },
        body: JSON.stringify({
          data: signature, // Send just the signature as the backend expects
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("sessionToken", data.sessionToken);
        setIsAuthenticated(true);
        setError(null);
      } else {
        console.error("Auth Error:", data);
        setError(data.error || "Authentication failed. Please try again.");
      }
    } catch (error) {
      console.error("Error getting auth token:", error);
      setError("Authentication failed. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("sessionToken");
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authentication Flow</CardTitle>
          <CardDescription>
            Connect your wallet and authenticate
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!isAuthenticated ? (
            <Button onClick={authenticate} className="w-full">
              Connect Wallet and Authenticate
            </Button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm font-medium text-green-600">
                Authenticated Successfully!
              </p>
              <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full"
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
