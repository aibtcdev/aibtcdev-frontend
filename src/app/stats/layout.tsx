import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Public Stats",
};

export default function PublicStatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
