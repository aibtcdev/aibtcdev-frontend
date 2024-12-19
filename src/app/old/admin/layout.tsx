import React from "react";
import { Metadata } from "next";
import { Footer } from "@/components/reusables/Footer";

export const metadata: Metadata = {
  title: "Admin",
};

export default function CrewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <div>
        {children}
        <Footer />
      </div>
    </>
  );
}
