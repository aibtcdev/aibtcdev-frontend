"use client";

import type React from "react";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { queryClient } from "@/lib/react-query";
import ApplicationLayout from "./application-layout";

/**
 * Providers component
 * - Centralized provider setup for the application
 * - Includes React Query provider with optimized configuration
 * - Includes theme provider for dark/light mode
 */
export function Providers({ children }: { children: React.ReactNode }) {
  // Use state to ensure the QueryClient is only created once on the client
  const [client] = useState(() => queryClient);

  return (
    <QueryClientProvider client={client}>
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        enableSystem
        disableTransitionOnChange
      >
        <ApplicationLayout>{children}</ApplicationLayout>
      </ThemeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}

export default Providers;
