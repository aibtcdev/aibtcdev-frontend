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
    <div className="flex items-center justify-center">
      {/* Sign In Section */}
      <div className="w-full">
        <SignIn redirectUrl={redirectUrl} />
      </div>
    </div>
  );
}
