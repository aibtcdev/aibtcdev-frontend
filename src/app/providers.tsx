"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { ApplicationLayout } from "./application-layout";
import { usePathname } from "next/navigation";

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  // const pathname = usePathname();

  // const content =
  //   pathname === "/" ? (
  //     children
  //   ) : (
  //     <ApplicationLayout>{children}</ApplicationLayout>
  //   );

  return (
    <ThemeProvider
      defaultTheme="dark"
      attribute="class"
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <ApplicationLayout>{children}</ApplicationLayout>
        <Toaster />
      </QueryClientProvider>
    </ThemeProvider>
  );
}
