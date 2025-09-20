"use client";

import { DAOPage } from "@/components/aidaos/DAOPage";

export function DAOLayoutClient({ children }: { children: React.ReactNode }) {
  return <DAOPage>{children}</DAOPage>;
}
