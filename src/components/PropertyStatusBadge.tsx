import { STATUS_TONE, statusLabel } from "@/lib/status";

export function PropertyStatusBadge({ status, className = "" }: { status: string; className?: string }) {
  const tone = STATUS_TONE[status] ?? "bg-muted text-foreground";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${tone} ${className}`}>
      {statusLabel(status)}
    </span>
  );
}
