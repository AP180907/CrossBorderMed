import type { ComplianceStatus } from "@/data/types";
import { STATUS_LABEL } from "@/lib/compliance";
import { cn } from "@/lib/utils";

const TONE: Record<ComplianceStatus, { dot: string; wrap: string }> = {
  allowed: { dot: "bg-teal", wrap: "bg-teal-muted text-teal" },
  restricted: { dot: "bg-amber", wrap: "bg-amber-muted text-amber" },
  not_allowed: { dot: "bg-danger", wrap: "bg-danger-muted text-danger" },
  unknown: { dot: "bg-unknown", wrap: "bg-unknown-muted text-unknown" },
};

export function StatusBadge({
  status,
  className,
}: {
  status: ComplianceStatus;
  className?: string;
}) {
  const tone = TONE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-medium tracking-wide",
        tone.wrap,
        className,
      )}
    >
      <span className={cn("status-dot", tone.dot)} />
      {STATUS_LABEL[status]}
    </span>
  );
}

export function StatusMark({ status }: { status: ComplianceStatus }) {
  return <span className={cn("status-dot", TONE[status].dot)} aria-hidden />;
}
