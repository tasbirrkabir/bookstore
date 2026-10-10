import { Skeleton } from "@/components/ui/skeleton";

export default function ProductLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <Skeleton className="mt-6 h-5 w-64" />
      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] lg:gap-14">
        {/* Cover skeleton */}
        <div>
          <div className="mx-auto w-full max-w-sm lg:max-w-md">
            <Skeleton className="aspect-[2/3] w-full rounded-md" />
          </div>
          <Skeleton className="mx-auto mt-4 h-6 w-40" />
        </div>
        {/* Detail + purchase skeleton */}
        <div>
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="mt-3 h-5 w-2/5" />
          <Skeleton className="mt-4 h-4 w-1/2" />
          <div className="mt-6 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-3/5" />
          </div>
          <div className="mt-8 rounded-lg border border-hairline bg-card p-5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-3 h-14 w-full rounded-md" />
            <Skeleton className="mt-2 h-14 w-full rounded-md" />
            <Skeleton className="mt-5 h-9 w-32" />
            <Skeleton className="mt-4 h-12 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}
