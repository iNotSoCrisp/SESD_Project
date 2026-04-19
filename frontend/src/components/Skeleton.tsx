interface SkeletonProps {
  width?: string
  height?: string
  className?: string
}

export function Skeleton({ width = '100%', height = '16px', className = '' }: SkeletonProps) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height }}
    />
  )
}

export function SkeletonStockCard() {
  return (
    <div className="card-surface p-4 flex flex-col gap-3">
      <div className="flex justify-between">
        <Skeleton width="50px" height="15px" />
        <Skeleton width="60px" height="10px" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton width="80px" height="22px" />
        <Skeleton width="60px" height="20px" className="rounded" />
      </div>
      <Skeleton width="100px" height="12px" />
      <Skeleton width="100%" height="4px" className="mt-1 rounded-full" />
      <div className="flex justify-between">
        <Skeleton width="40px" height="10px" />
        <Skeleton width="40px" height="10px" />
      </div>
    </div>
  )
}

export function SkeletonMoverRow() {
  return (
    <div className="flex items-center gap-3 py-4 border-b border-[#1A1E2E]">
      <Skeleton width="16px" height="12px" />
      <div className="w-1 h-8 skeleton rounded" />
      <div className="flex flex-col gap-1.5 flex-1">
        <Skeleton width="50px" height="14px" />
        <Skeleton width="100px" height="11px" />
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Skeleton width="60px" height="13px" />
        <Skeleton width="50px" height="18px" className="rounded" />
      </div>
    </div>
  )
}
