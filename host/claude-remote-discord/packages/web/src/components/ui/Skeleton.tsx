"use client";

export function Skeleton({
  className = "",
  width,
  height,
}: {
  className?: string;
  width?: string | number;
  height?: string | number;
}) {
  return (
    <div
      className={`skeleton ${className}`}
      style={{ width, height }}
    />
  );
}

export function SidebarSkeleton() {
  return (
    <div className="px-3 py-4 space-y-4">
      <Skeleton width="60%" height={12} />
      <div className="space-y-2 ml-2">
        <Skeleton width="80%" height={28} />
        <Skeleton width="70%" height={28} />
        <Skeleton width="85%" height={28} />
      </div>
      <Skeleton width="55%" height={12} className="mt-4" />
      <div className="space-y-2 ml-2">
        <Skeleton width="75%" height={28} />
        <Skeleton width="65%" height={28} />
      </div>
    </div>
  );
}

export function ChatSkeleton() {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="flex items-center gap-2 text-text-muted text-sm">
        <div className="w-4 h-4 border-2 border-text-muted border-t-primary rounded-full animate-spin" />
        Loading messages...
      </div>
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-lg p-3 space-y-2">
      <Skeleton width="80%" height={16} />
      <Skeleton width="60%" height={12} />
      <div className="flex gap-2 mt-2">
        <Skeleton width={40} height={12} />
        <Skeleton width={30} height={12} className="ml-auto" />
      </div>
    </div>
  );
}

export function SystemSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton width={16} height={16} className="rounded-full" />
              <Skeleton width={60} height={14} />
              <Skeleton width={30} height={14} className="ml-auto" />
            </div>
            <Skeleton width="100%" height={8} />
          </div>
        ))}
      </div>
      <Skeleton width="100%" height={48} />
    </div>
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="bg-surface border border-border rounded-lg p-5 space-y-4">
      <div className="flex flex-col items-center gap-2">
        <Skeleton width={48} height={48} className="rounded-full" />
        <Skeleton width={100} height={16} />
      </div>
      <Skeleton width="100%" height={12} />
      <Skeleton width="80%" height={12} className="mx-auto" />
      <div className="flex gap-2 pt-3 border-t border-border">
        <Skeleton width="33%" height={12} />
        <Skeleton width="33%" height={12} />
        <Skeleton width="33%" height={12} />
      </div>
    </div>
  );
}

export function MessageListSkeleton() {
  return (
    <div className="p-4 space-y-4" role="status" aria-label="Loading messages">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="flex gap-3">
          <Skeleton width={28} height={28} className="rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton width={80} height={12} />
            <Skeleton width={i % 2 === 0 ? "90%" : "60%"} height={14} />
            {i % 3 === 0 && <Skeleton width="40%" height={14} />}
          </div>
        </div>
      ))}
    </div>
  );
}
