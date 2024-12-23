import { Suspense } from "react";
import type { dao } from "@aibtcdev/tools";
import { DaoTreasury } from "./dao-treasury";
import { DaoActivity } from "./dao-activity";
import { LoadingTreasury, LoadingActivity } from "./loading-states";

export function DaoCard({ dao }: { dao: dao.DAOBasicInfo }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{dao.name}</h3>
        <span className="text-sm text-muted-foreground">{dao.type}</span>
      </div>

      <Suspense fallback={<LoadingTreasury />}>
        <DaoTreasury daoId={dao.id} />
      </Suspense>

      <Suspense fallback={<LoadingActivity />}>
        <DaoActivity daoId={dao.id} />
      </Suspense>
    </div>
  );
}
