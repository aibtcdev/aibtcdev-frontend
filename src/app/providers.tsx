"use client";

import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import ApplicationLayout from "./application-layout";
import { usePathname } from "next/navigation";
import { NextStepProvider, NextStep } from "nextstepjs";
import CustomCard from "@/components/reusables/CustomCard";
import { tourSteps } from "@/components/reusables/steps";
const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const content =
    pathname === "/" ? (
      children
    ) : (
      <ApplicationLayout>{children}</ApplicationLayout>
    );

  return (
    <ThemeProvider
      defaultTheme="dark"
      attribute="class"
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        <NextStepProvider>
          <NextStep steps={tourSteps} cardComponent={CustomCard}>
            {content}
          </NextStep>
        </NextStepProvider>
        <Toaster />
        {/* Add React Query Devtools here */}
        {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
