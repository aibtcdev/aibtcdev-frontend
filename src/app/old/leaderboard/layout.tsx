import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "LeaderBoard",
};

export default function LeaderBoardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
