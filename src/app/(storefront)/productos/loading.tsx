import { ProductCardSkeleton } from "@/core/ui/commerce";
import { Skeleton } from "@/core/ui/skeleton";

/** Estado de carga del listado — se muestra mientras se consulta la base. */
export default function ProductsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-24" />
        </div>
        <Skeleton className="h-9 w-48" />
      </div>
      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
