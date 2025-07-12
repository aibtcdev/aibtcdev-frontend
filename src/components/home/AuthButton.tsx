"use client";
import dynamic from "next/dynamic";

const SignIn = dynamic(() => import("../auth/StacksAuth"), {
  ssr: false,
});

interface AuthButtonProps {
  redirectUrl?: string;
}

export default function AuthButton({ redirectUrl }: AuthButtonProps) {
  return (
    <div className="flex items-center justify-center px-2 py-1 sm:px-4 sm:py-2 text-sm sm:text-base">
      {/* Sign In Section */}
      <div className="w-auto">
        <SignIn redirectUrl={redirectUrl} />
      </div>
    </div>
  );
}
