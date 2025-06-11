import { Metadata, Viewport } from "next";
import React from "react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Votes",
  description: "View all votes across all organizations in one place.",
};

export default function VotesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
