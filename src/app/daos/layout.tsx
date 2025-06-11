import { Metadata, Viewport } from "next";
import React from "react";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "DAOs",
  description: "Bitcoin-backed DAOs. Fully autonomous governance.",
};

export default function DAOsLayout({
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
