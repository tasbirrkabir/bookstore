import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div aria-busy="true" aria-label="লোড হচ্ছে">
      <Skeleton className="h-14 w-full rounded-lg" />
      <div className="mt-4 items-start lg:mt-6 lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-6">
        <Skeleton className="hidden h-80 rounded-lg lg:block" />
        <div className="mt-4 space-y-4 lg:mt-0">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-8 w-56 rounded-md" />
          <Skeleton className="h-72 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
