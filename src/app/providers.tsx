"use client";

import type React from "react";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import ApplicationLayout from "./application-layout";
import { usePathname } from "next/navigation";
import { NextStepProvider, NextStep } from "nextstepjs";
import CustomCard from "@/components/reusables/CustomCard";
import { tourSteps } from "@/helpers/steps";
import { SupabaseRealtimeProvider } from "@/providers/SupabaseRealtimeProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Use useState to ensure the QueryClient persists between renders
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 30 * 60 * 1000, // 30 minutes
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

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
        <SupabaseRealtimeProvider>
          <NextStepProvider>
            <NextStep steps={tourSteps} cardComponent={CustomCard}>
              {content}
            </NextStep>
          </NextStepProvider>
        </SupabaseRealtimeProvider>
        <Toaster />
        {/* Add React Query Devtools here */}
        {process.env.NODE_ENV === "development" && <ReactQueryDevtools />}
      </QueryClientProvider>
    </ThemeProvider>
  );
}
