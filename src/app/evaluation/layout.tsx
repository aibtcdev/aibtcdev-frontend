import { Metadata, Viewport } from "next";
import React from "react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Evaluation",
  description: "Evaluate proposals for Bitcoin-backed DAOs.",
};

export default function EvaluationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <main className="w-full min-h-screen">{children}</main>;
}
