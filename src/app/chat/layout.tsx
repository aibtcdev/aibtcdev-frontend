import { Metadata } from "next";
import React from "react";

export const metadata: Metadata = {
  title: "Chat",
  description: "Chat with your AI agents",
};

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="flex-1 flex flex-col">{children}</div>;
}
