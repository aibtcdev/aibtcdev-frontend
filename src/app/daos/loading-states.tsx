import { Skeleton } from "@/components/ui/skeleton";

export function LoadingDaoCard() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center justify-between mb-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-20" />
      </div>
      <LoadingTreasury />
      <LoadingActivity />
    </div>
  );
}

export function LoadingTreasury() {
  return (
    <div className="mt-4">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-8 w-32 mb-2" />
      <Skeleton className="h-4 w-28" />
    </div>
  );
}

export function LoadingActivity() {
  return (
    <div className="mt-4">
      <Skeleton className="h-4 w-24 mb-2" />
      <Skeleton className="h-4 w-40 mb-2" />
      <Skeleton className="h-4 w-32" />
    </div>
  );
}
