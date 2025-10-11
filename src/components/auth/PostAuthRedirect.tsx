"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Client component that handles post-authentication redirects
 * Checks localStorage for a stored redirect path after OAuth completion
 */
export function PostAuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const postAuthRedirect = localStorage.getItem("post_auth_redirect");

    if (postAuthRedirect) {
      console.log("🔗 Post-auth redirect found:", postAuthRedirect);
      localStorage.removeItem("post_auth_redirect");
      router.replace(postAuthRedirect);
    }
  }, [router]);

  return null;
}
