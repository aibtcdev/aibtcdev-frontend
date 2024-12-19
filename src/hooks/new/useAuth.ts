import { useState, useEffect, useCallback, useMemo } from "react";
import { AppConfig, UserSession } from "@stacks/auth";
import { StacksMainnet } from "@stacks/network";
import { showConnect, openSignatureRequestPopup } from "@stacks/connect";
import { verifyMessageSignatureRsv } from "@stacks/encryption";

const appConfig = new AppConfig(["store_write", "publish_data"]);
const userSession = new UserSession({ appConfig });

export interface AuthResult {
  stxAddress: string;
  sessionToken: string;
}

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const verifySession = async () => {
      const storedSessionToken = localStorage.getItem("sessionToken");
      const storedStxAddress = localStorage.getItem("stxAddress");

      if (!storedSessionToken || !storedStxAddress) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_AIBTC_SERVICE_URL}/auth/verify-session-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: process.env.NEXT_PUBLIC_AIBTC_SECRET_KEY!,
            },
            body: JSON.stringify({ data: storedSessionToken }),
          }
        );

        if (response.ok) {
          setIsAuthenticated(true);
          setUserAddress(storedStxAddress);
          // Set cookies for the middleware
          document.cookie = `sessionToken=${storedSessionToken}; path=/; max-age=604800; SameSite=Strict; Secure`;
          document.cookie = `stxAddress=${storedStxAddress}; path=/; max-age=604800; SameSite=Strict; Secure`;
        } else {
          // Clear invalid session data
          localStorage.removeItem("sessionToken");
          localStorage.removeItem("stxAddress");
        }
      } catch (error) {
        console.error("Session verification error:", error);
        setAuthError(String(error));
      } finally {
        setIsLoading(false);
      }
    };

    verifySession();
  }, []);

  const verifyAndSendSignedMessage = useCallback(
    async (
      message: string,
      signature: string,
      publicKey: string,
      stxAddress: string,
      onSuccess: (result: AuthResult) => void,
      onError: (error: string) => void
    ) => {
      const isSignatureValid = verifyMessageSignatureRsv({
        message,
        signature,
        publicKey,
      });

      if (!isSignatureValid) {
        onError("Signature verification failed");
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_AIBTC_SERVICE_URL}/auth/request-auth-token`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: process.env.NEXT_PUBLIC_AIBTC_SECRET_KEY!,
            },
            body: JSON.stringify({ signature, publicKey }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem("sessionToken", data.sessionToken);
          localStorage.setItem("stxAddress", stxAddress);

          // Set cookies for the middleware
          document.cookie = `sessionToken=${data.sessionToken}; path=/; max-age=604800; SameSite=Strict; Secure`;
          document.cookie = `stxAddress=${stxAddress}; path=/; max-age=604800; SameSite=Strict; Secure`;

          const authResult = {
            stxAddress,
            sessionToken: data.sessionToken,
          };
          onSuccess(authResult);
        } else {
          onError(data.error || "Authentication failed. Please try again.");
        }
      } catch (error) {
        onError(String(error));
      }
    },
    []
  );

  const promptSignMessage = useCallback(
    (
      stxAddress: string,
      onSuccess: (result: AuthResult) => void,
      onError: (error: string) => void
    ) => {
      const message = "welcome to aibtcdev!";

      openSignatureRequestPopup({
        message,
        network: new StacksMainnet(),
        appDetails: {
          name: "sprint.aibtc.dev",
          icon: window.location.origin + "/logos/aibtcdev-avatar-1000px.png",
        },
        stxAddress,
        onFinish: (data) =>
          verifyAndSendSignedMessage(
            message,
            data.signature,
            data.publicKey,
            stxAddress,
            onSuccess,
            onError
          ),
        onCancel: () => {
          onError("Message signing was cancelled.");
        },
      });
    },
    [verifyAndSendSignedMessage]
  );

  const initiateAuthentication = useCallback(() => {
    showConnect({
      appDetails: {
        name: "sprint.aibtc.dev",
        icon: window.location.origin + "/logos/aibtcdev-avatar-1000px.png",
      },
      redirectTo: "/",
      onFinish: () => {
        const userData = userSession.loadUserData();
        const address = userData.profile.stxAddress.mainnet;
        promptSignMessage(
          address,
          (result) => {
            setIsAuthenticated(true);
            setUserAddress(result.stxAddress);
            setAuthError(null);
          },
          (errorMessage) => {
            setAuthError(errorMessage);
            setIsAuthenticated(false);
          }
        );
      },
      userSession: userSession,
    });
  }, [promptSignMessage]);

  const logout = useCallback(() => {
    localStorage.removeItem("sessionToken");
    localStorage.removeItem("stxAddress");
    // Clear cookies
    document.cookie =
      "sessionToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; Secure";
    document.cookie =
      "stxAddress=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict; Secure";
    setIsAuthenticated(false);
    setUserAddress(null);
  }, []);

  return useMemo(
    () => ({
      isAuthenticated,
      isLoading,
      userAddress,
      error: authError,
      initiateAuthentication,
      logout,
    }),
    [
      isAuthenticated,
      isLoading,
      userAddress,
      authError,
      initiateAuthentication,
      logout,
    ]
  );
};
