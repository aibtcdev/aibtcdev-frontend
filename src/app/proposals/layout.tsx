import { Metadata, Viewport } from "next";
import React from "react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Proposals",
  description: "View all DAO proposals across all organizations in one place.",
};

export default function ProposalsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="w-full min-h-screen">
      <div className="flex-1 w-full">{children}</div>
    </main>
  );
}
