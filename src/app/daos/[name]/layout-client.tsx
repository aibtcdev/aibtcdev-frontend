"use client";

import { DAOPage } from "@/components/daos/DAOPage";

export function DAOLayoutClient({ children }: { children: React.ReactNode }) {
  return <DAOPage>{children}</DAOPage>;
}
