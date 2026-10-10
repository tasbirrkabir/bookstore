import { Skeleton } from "@/components/ui/skeleton";

export default function ShopLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <Skeleton className="mt-8 h-10 w-52" />
      <Skeleton className="mt-3 h-4 w-40" />
      <div className="mt-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10">
        {/* Sidebar skeleton */}
        <div className="hidden lg:block" aria-hidden>
          <div className="space-y-7">
            {[0, 1, 2, 3].map((g) => (
              <div key={g}>
                <Skeleton className="h-4 w-20" />
                <div className="mt-3 space-y-2">
                  {[0, 1, 2, 3].map((r) => (
                    <Skeleton key={r} className="h-5 w-full" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Toolbar + grid skeleton */}
        <div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-11 w-44" />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="rounded-md border border-hairline bg-card p-3">
                <Skeleton className="aspect-[2/3] w-full" />
                <Skeleton className="mt-3 h-4 w-4/5" />
                <Skeleton className="mt-2 h-3 w-1/2" />
                <Skeleton className="mt-3 h-4 w-1/3" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
