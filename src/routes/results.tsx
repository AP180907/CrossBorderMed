import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { JourneyMap, RouteStrip } from "@/components/map/journey-map";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status";
import { COUNTRIES, COUNTRY_CODES, type CountryCode } from "@/data/countries";
import type { ConditionId } from "@/data/conditions";
import type { ComplianceStatus } from "@/data/types";
import { buildChecklist, preparationNotes } from "@/lib/checklist";
import {
  boardingCountry,
  lookupMedicineCountry,
  worstStatus,
  type CheckResult,
  type CountryLookup,
} from "@/lib/compliance";
import { useCheckStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/results")({ component: ResultsPage });

function Field({ label, value }: { label: string; value: ReactNode }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{label}</p>
      <div className="mt-1 text-sm leading-relaxed text-ink-soft">{value}</div>
    </div>
  );
}

function CountryBlock({ lookup }: { lookup: CountryLookup }) {
  return (
    <article className="border-t border-line pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted">{lookup.role}</p>
          <h3 className="mt-1 font-medium">{lookup.countryName}</h3>
        </div>
        <StatusBadge status={lookup.status} />
      </div>
      {lookup.status === "unknown" ? (
        <p className="mt-3 text-sm text-muted">No dataset available</p>
      ) : (
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Notes" value={lookup.notes} />
          <Field
            label="Permit requirement"
            value={
              lookup.permitRequired == null
                ? null
                : lookup.permitRequired
                  ? lookup.permitName
                    ? `Required — ${lookup.permitName}`
                    : "Required"
                  : "Not listed as required"
            }
          />
          <Field
            label="Prescription / document requirement"
            value={
              lookup.prescriptionRequired == null && !lookup.documents
                ? null
                : (
                    <>
                      {lookup.prescriptionRequired == null
                        ? null
                        : lookup.prescriptionRequired
                          ? "Prescription required"
                          : "Prescription not listed as required"}
                      {lookup.documents && lookup.documents.length > 0 && (
                        <ul className="mt-2 list-disc pl-4">
                          {lookup.documents.map((d) => (
                            <li key={d}>{d}</li>
                          ))}
                        </ul>
                      )}
                    </>
                  )
            }
          />
          <Field label="Maximum quantity" value={lookup.maxQuantity} />
          <Field
            label="Maximum days"
            value={lookup.maxDays != null ? `${lookup.maxDays} days` : null}
          />
        </div>
      )}
    </article>
  );
}

function ResultsPage() {
  const nav = useNavigate();
  const store = useCheckStore();
  const [done, setDone] = useState<Record<string, boolean>>({});

  const result = store.lastResult;
  const conditions = store.conditions;
  const syringes = store.syringes;

  useEffect(() => {
    if (result) return;
    try {
      const raw = sessionStorage.getItem("cbm.lastResult");
      const metaRaw = sessionStorage.getItem("cbm.lastMeta");
      if (!raw) {
        void nav({ to: "/check" });
        return;
      }
      const parsed = JSON.parse(raw) as CheckResult;
      const meta = metaRaw
        ? (JSON.parse(metaRaw) as { conditions?: ConditionId[]; syringes?: boolean })
        : {};
      store.hydrateFromResult(parsed, meta);
    } catch {
      void nav({ to: "/check" });
    }
  }, [nav, result, store]);

  const checklist = useMemo(
    () => (result ? buildChecklist(result, conditions, syringes) : []),
    [result, conditions, syringes],
  );
  const prep = useMemo(
    () => preparationNotes(conditions, syringes),
    [conditions, syringes],
  );

  const transitOptions = useMemo(() => {
    if (!result) return [];
    const boarding = boardingCountry(result.input);
    return COUNTRY_CODES.filter(
      (code) => code !== result.input.destination && code !== boarding,
    ).map((code) => {
      const statuses = result.medicines.map(
        (row) => lookupMedicineCountry(row.matched, code, "transit").status,
      );
      return { code, overall: worstStatus(statuses) };
    });
  }, [result]);

  if (!result) {
    return (
      <PageShell>
        <p className="px-5 py-20 text-muted">Loading result…</p>
      </PageShell>
    );
  }

  const originCode = boardingCountry(result.input);

  const destStatuses: Partial<Record<CountryCode, ComplianceStatus>> = {
    [result.input.destination]: result.medicines
      .map((m) => m.destination.status)
      .reduce<ComplianceStatus>((acc, status) => (worstStatus([acc, status])), "unknown"),
  };
  if (result.input.transit) {
    const tStatus = result.medicines
      .map((m) => m.transit?.status)
      .filter(Boolean) as ComplianceStatus[];
    destStatuses[result.input.transit] = tStatus.includes("not_allowed")
      ? "not_allowed"
      : tStatus.includes("restricted")
        ? "restricted"
        : tStatus.includes("allowed")
          ? "allowed"
          : "unknown";
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl px-5 py-12 md:py-16">
        <p className="text-[12px] uppercase tracking-[0.18em] text-muted">Compliance result</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <RouteStrip
            origin={originCode}
            transit={result.input.transit}
            destination={result.input.destination}
          />
          <StatusBadge status={result.overall} />
        </div>
        <p className="mt-3 text-sm text-muted">
          Saved to travel history on this device. Dataset: {result.dataset.title}.
        </p>

        <JourneyMap
          className="mt-8 min-h-[240px]"
          origin={originCode}
          transit={result.input.transit}
          destination={result.input.destination}
          statuses={destStatuses}
        />

        <section className="mt-10">
          <h2 className="font-display text-3xl">Route intelligence</h2>
          <ul className="mt-6 grid gap-6 md:grid-cols-3">
            <li>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Origin</p>
              <p className="mt-1 font-medium">{COUNTRIES[result.origin.country].originLabel}</p>
              <p className="text-sm text-muted">{COUNTRIES[result.origin.country].name}</p>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{result.origin.notes}</p>
            </li>
            <li>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Transit</p>
              {result.input.transit ? (
                <>
                  <p className="mt-1 font-medium">{COUNTRIES[result.input.transit].originLabel}</p>
                  <p className="text-sm text-muted">{COUNTRIES[result.input.transit].name}</p>
                </>
              ) : (
                <p className="mt-1 text-sm text-muted">No transit</p>
              )}
            </li>
            <li>
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Destination</p>
              <p className="mt-1 font-medium">{COUNTRIES[result.input.destination].originLabel}</p>
              <p className="text-sm text-muted">{COUNTRIES[result.input.destination].name}</p>
            </li>
          </ul>
        </section>

        <section className="mt-14 space-y-10">
          <h2 className="font-display text-3xl">Medicines</h2>
          {result.medicines.map((row) => (
            <article key={row.query} className="border-t border-line pt-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-display text-2xl">{row.query}</h3>
                  <p className="mt-1 text-sm text-muted">
                    {row.matched
                      ? `Matched dataset entry: ${row.matched.name} (${row.matched.generic})`
                      : "No dataset available — this name did not match a catalogue entry"}
                  </p>
                </div>
                <StatusBadge status={row.overall} />
              </div>
              <div className="mt-6 space-y-8">
                <CountryBlock lookup={row.destination} />
                {row.transit && <CountryBlock lookup={row.transit} />}
              </div>
            </article>
          ))}
        </section>

        <section className="mt-14">
          <h2 className="font-display text-3xl">Alternative transit comparison</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Other countries on the dataset list, as possible transits to{" "}
            {COUNTRIES[result.input.destination].name}. Airline, travel time, and cost are not present in
            the dataset.
          </p>
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-[0.14em] text-muted">
                <tr className="border-b border-line">
                  <th className="py-3 font-medium">Transit country</th>
                  <th className="py-3 font-medium">Compliance status</th>
                  <th className="py-3 font-medium">Airline</th>
                  <th className="py-3 font-medium">Travel time</th>
                  <th className="py-3 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody>
                {transitOptions.map((row) => (
                    <tr
                      key={row.code}
                      className={cn(
                        "border-b border-line",
                        row.code === result.input.transit && "bg-accent-muted/40",
                      )}
                    >
                      <td className="py-3">
                        {COUNTRIES[row.code].name}
                        {row.code === result.input.transit ? " (on ticket)" : ""}
                      </td>
                      <td className="py-3">
                        <StatusBadge status={row.overall} />
                      </td>
                      <td className="py-3 text-muted" colSpan={3}>
                        Travel data is unavailable in this prototype
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-muted">
            Status for each transit country is taken from the same dataset used for the ticketed route.
            Airline, time, and cost columns have no source in the dataset.
          </p>
        </section>

        <section className="mt-14">
          <h2 className="font-display text-3xl">Before you fly</h2>
          {checklist.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No checklist items were implied by this selection.</p>
          ) : (
            <ul className="mt-6 space-y-3">
              {checklist.map((item) => (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-start gap-3">
                    <input
                      type="checkbox"
                      checked={!!done[item.id]}
                      onChange={() => setDone((s) => ({ ...s, [item.id]: !s[item.id] }))}
                      className="mt-1 size-4 accent-accent"
                    />
                    <span className={cn(done[item.id] && "text-muted line-through")}>
                      <span className="block font-medium">{item.label}</span>
                      <span className="mt-0.5 block text-sm text-muted">{item.why}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
          {prep.length > 0 && (
            <div className="mt-8">
              <p className="text-[11px] uppercase tracking-[0.16em] text-muted">Preparation notes</p>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed text-ink-soft">
                {prep.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Link to="/vault">
            <Button>Draft travel certificate</Button>
          </Link>
          <Link to="/history">
            <Button variant="outline">Travel history</Button>
          </Link>
          <Link to="/check">
            <Button variant="ghost">New check</Button>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
