import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Marketplace",
};

export default function Marketplace({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
