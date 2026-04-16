"use client"

import { Skeleton } from "@/components/ui/skeleton"

export function TabSkeleton() {
  return (
    <div className="space-y-4 py-4">
      <div className="flex gap-4">
        <Skeleton className="h-24 flex-1 rounded-xl" />
        <Skeleton className="h-24 flex-1 rounded-xl" />
        <Skeleton className="h-24 flex-1 rounded-xl" />
        <Skeleton className="h-24 flex-1 rounded-xl hidden sm:block" />
      </div>
      <Skeleton className="h-10 w-full rounded-lg" />
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    </div>
  )
}
