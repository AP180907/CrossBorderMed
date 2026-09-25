import { COUNTRIES, projectPoint, type CountryCode } from "@/data/countries";
import { StatusMark } from "@/components/ui/status";
import type { ComplianceStatus } from "@/data/types";
import { cn } from "@/lib/utils";

type Node = {
  code: CountryCode;
  role: "origin" | "transit" | "destination";
  status?: ComplianceStatus;
};

export function JourneyMap({
  origin,
  transit,
  destination,
  statuses,
  className,
}: {
  origin: CountryCode;
  transit?: CountryCode | null;
  destination: CountryCode;
  statuses?: Partial<Record<CountryCode, ComplianceStatus>>;
  className?: string;
}) {
  const nodes: Node[] = [
    { code: origin, role: "origin", status: statuses?.[origin] },
    ...(transit ? [{ code: transit, role: "transit" as const, status: statuses?.[transit] }] : []),
    { code: destination, role: "destination", status: statuses?.[destination] },
  ];

  const pts = nodes.map((node) => {
    const c = COUNTRIES[node.code];
    return { ...node, ...c, ...projectPoint(c.lat, c.lng) };
  });

  const path = pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  return (
    <div className={cn("relative overflow-hidden rounded-[18px] bg-bg-warm", className)}>
      <img
        src="/images/world-map.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-80"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-bg/20" />
      <svg viewBox="0 0 100 56" className="relative z-10 h-auto w-full" aria-hidden>
        <path
          d={path}
          fill="none"
          stroke="#5b4cdb"
          strokeWidth="0.45"
          className="route-dash"
          strokeLinecap="round"
        />
        {pts.map((p) => (
          <g key={`${p.role}-${p.code}`}>
            <circle cx={p.x} cy={p.y} r="1.15" fill="#5b4cdb" />
            <circle cx={p.x} cy={p.y} r="2.1" fill="none" stroke="#5b4cdb" strokeOpacity="0.35" strokeWidth="0.35" />
          </g>
        ))}
      </svg>
      <ol className="relative z-10 grid grid-cols-1 gap-4 px-5 pb-5 sm:grid-cols-3">
        {pts.map((p) => (
          <li key={`${p.role}-${p.code}`}>
            <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{p.role}</p>
            <p className="mt-1 flex items-center gap-2 font-medium">
              {p.status ? <StatusMark status={p.status} /> : null}
              {p.originLabel}
            </p>
            <p className="text-sm text-muted">{p.short}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function RouteStrip({
  origin,
  transit,
  destination,
}: {
  origin: CountryCode;
  transit?: CountryCode | null;
  destination: CountryCode;
}) {
  const parts = [
    COUNTRIES[origin].originLabel,
    transit ? COUNTRIES[transit].originLabel : null,
    COUNTRIES[destination].originLabel,
  ].filter(Boolean) as string[];

  return (
    <p className="font-display text-2xl tracking-tight md:text-4xl">
      {parts.map((part, i) => (
        <span key={part}>
          {i > 0 && <span className="mx-2 text-accent">→</span>}
          {part}
        </span>
      ))}
    </p>
  );
}
