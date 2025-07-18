import type { Metadata, Viewport } from "next";
import type React from "react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Account",
  description: "View your account.",
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="">
      <div className="md:pt-10 pt-2">
        {/* Account for sticky header */}
        {children}
      </div>
    </div>
  );
}
