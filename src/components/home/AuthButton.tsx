"use client";
import dynamic from "next/dynamic";

const SignIn = dynamic(() => import("../auth/StacksAuth"), {
  ssr: false,
});

interface AuthButtonProps {
  redirectUrl?: string;
  buttonText?: string;
}

export default function AuthButton({
  redirectUrl,
  buttonText,
}: AuthButtonProps) {
  return (
    <div>
      {/* Sign In Section */}
      <div>
        <SignIn redirectUrl={redirectUrl} buttonText={buttonText} />
      </div>
    </div>
  );
}
