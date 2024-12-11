"use client";

import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function ConnectPage() {
  const { connectWallet } = useAuth();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get("redirect") || "/chat";
  const hasInitiatedConnection = useRef(false);

  useEffect(() => {
    const initiateConnection = async () => {
      if (hasInitiatedConnection.current) return;
      hasInitiatedConnection.current = true;

      try {
        console.log("Starting connection process");
        console.log("Redirect path:", redirectPath);

        const result = await connectWallet();

        console.log("Connection result:", result);

        if (result.success) {
          console.log("Attempting to redirect to:", redirectPath);
          window.location.href = redirectPath;
        } else {
          console.log("Connection failed, redirecting to home");
          window.location.href = "/";
        }
      } catch (error) {
        console.error("Error in connection process:", error);
        window.location.href = "/";
      }
    };

    initiateConnection();
  }, [connectWallet, redirectPath]);

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center">
        <p>Redirecting to {redirectPath}...</p>
      </div>
    </div>
  );
}
