import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status";
import { COUNTRIES } from "@/data/countries";
import { clearHistory, loadHistory, type HistoryRecord } from "@/lib/history";
import { boardingCountry } from "@/lib/compliance";
import { useCheckStore } from "@/lib/store";

export const Route = createFileRoute("/history")({ component: HistoryPage });

function HistoryPage() {
  const nav = useNavigate();
  const hydrate = useCheckStore((s) => s.hydrateFromResult);
  const [rows, setRows] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    setRows(loadHistory());
  }, []);

  function openRecord(row: HistoryRecord) {
    hydrate(row.snapshot, { conditions: row.conditions, syringes: row.syringes });
    sessionStorage.setItem("cbm.lastResult", JSON.stringify(row.snapshot));
    sessionStorage.setItem(
      "cbm.lastMeta",
      JSON.stringify({ conditions: row.conditions, syringes: row.syringes }),
    );
    void nav({ to: "/results" });
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl px-5 py-12 md:py-16">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[12px] uppercase tracking-[0.18em] text-muted">Travel history</p>
            <h1 className="mt-2 font-display text-4xl">Previous checks</h1>
            <p className="mt-2 text-sm text-muted">Stored in this browser. No account required.</p>
          </div>
          {rows.length > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                clearHistory();
                setRows([]);
              }}
            >
              Clear
            </Button>
          )}
        </div>

        {rows.length === 0 ? (
          <p className="mt-12 text-sm text-muted">No checks saved yet.</p>
        ) : (
          <ul className="mt-10 divide-y divide-line">
            {rows.map((row) => {
              const origin = boardingCountry(
                row.snapshot?.input ?? { citizenship: row.citizenship, source: row.source },
              );
              return (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-4 py-5">
                <div>
                  <p className="text-sm text-muted">
                    {new Date(row.date).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <p className="mt-1 font-medium">
                    {COUNTRIES[origin].originLabel}
                    {row.transit ? ` → ${COUNTRIES[row.transit].originLabel}` : ""}
                    {" → "}
                    {COUNTRIES[row.destination].originLabel}
                  </p>
                  <p className="mt-1 text-sm text-ink-soft">{row.medicines.join(", ")}</p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={row.result} />
                  <Button variant="outline" size="sm" onClick={() => openRecord(row)}>
                    Reopen
                  </Button>
                </div>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </PageShell>
  );
}
