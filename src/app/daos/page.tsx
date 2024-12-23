import { Suspense } from "react";
import { Heading } from "@/components/catalyst/heading";
// import CreateDaoDialog from "@/components/daos/create-dao-dialog";
import DaoList from "./daos-list";

export const revalidate = 60; // Revalidate every minute

export default async function DaosPage() {
  return (
    <div className="container mx-auto p-4">
      <div className="flex w-full flex-wrap items-end justify-between gap-4 border-zinc-950/10 pb-6 dark:border-white/10">
        <Heading>All DAOs</Heading>
        {/* <CreateDaoDialog /> */}
      </div>

      <Suspense fallback={<div>Loading DAOs...</div>}>
        <DaoList />
      </Suspense>
    </div>
  );
}
