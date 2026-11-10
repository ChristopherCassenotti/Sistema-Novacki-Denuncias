import { Skeleton } from './Skeleton';

export function TableSkeleton({ rows = 6, columns = 5 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-hidden" role="status" aria-label="Carregando tabela">
      <div className="hidden border-b border-slate-100 bg-slate-50 px-5 py-3 sm:grid" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
        {Array.from({ length: columns }).map((_, index) => <Skeleton key={index} className="h-3 w-20" />)}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="grid gap-3 px-5 py-4 sm:items-center" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
            {Array.from({ length: columns }).map((__, column) => (
              <Skeleton key={column} className={column === 0 ? 'h-5 w-full max-w-40' : 'h-4 w-full max-w-28'} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
