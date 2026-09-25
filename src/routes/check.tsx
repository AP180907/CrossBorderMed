import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { PrescriptionUpload } from "@/components/check/prescription-upload";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { COUNTRY_LIST, type CountryCode } from "@/data/countries";
import { HEALTH_CONDITIONS } from "@/data/conditions";
import { MEDICINES } from "@/data/dataset";
import { medicineSuggestions, runComplianceCheck } from "@/lib/compliance";
import { saveHistory } from "@/lib/history";
import { useCheckStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/check")({ component: CheckPage });

const STEPS = [
  "Citizenship",
  "Medication",
  "Destination",
  "Transit",
  "Health",
  "Review",
];

function CountryOptions({
  value,
  onChange,
  allowEmpty,
  emptyLabel,
  exclude,
}: {
  value: CountryCode | null;
  onChange: (code: CountryCode | null) => void;
  allowEmpty?: boolean;
  emptyLabel?: string;
  exclude?: CountryCode | null;
}) {
  return (
    <Select
      value={value ?? ""}
      onChange={(e) => onChange((e.target.value || null) as CountryCode | null)}
    >
      <option value="" disabled={!allowEmpty}>
        {allowEmpty ? (emptyLabel ?? "None") : "Select a country"}
      </option>
      {COUNTRY_LIST.filter((c) => c.code !== exclude).map((c) => (
        <option key={c.code} value={c.code}>
          {c.name}
        </option>
      ))}
    </Select>
  );
}

function CheckPage() {
  const nav = useNavigate();
  const store = useCheckStore();
  const [error, setError] = useState<string | null>(null);
  const [openSuggest, setOpenSuggest] = useState<string | null>(null);

  const names = store.medicines.map((m) => m.name.trim()).filter(Boolean);

  function go(next: number) {
    setError(null);
    if (store.step === 0 && next > 0 && !store.citizenship) {
      setError("Select a citizenship country.");
      return;
    }
    if (store.step === 0 && next > 0 && !store.source) {
      setError("Select a source (boarding) country.");
      return;
    }
    if (store.step === 1 && next > 1 && names.length === 0) {
      setError("Enter at least one medicine.");
      return;
    }
    if (store.step === 2 && next > 2 && !store.destination) {
      setError("Select a destination.");
      return;
    }
    store.setStep(next);
  }

  function run() {
    if (!store.citizenship || !store.source || !store.destination || names.length === 0) {
      setError("Citizenship, source, medicines, and destination are required.");
      return;
    }
    const result = runComplianceCheck({
      medicines: names,
      citizenship: store.citizenship,
      source: store.source,
      destination: store.destination,
      transit: store.transit,
    });
    store.setLastResult(result);
    saveHistory({
      id: result.id,
      date: result.createdAt,
      citizenship: result.input.citizenship,
      source: result.input.source,
      medicines: result.input.medicines,
      destination: result.input.destination,
      transit: result.input.transit,
      result: result.overall,
      conditions: store.conditions,
      syringes: store.syringes,
      snapshot: result,
    });
    sessionStorage.setItem("cbm.lastResult", JSON.stringify(result));
    sessionStorage.setItem(
      "cbm.lastMeta",
      JSON.stringify({ conditions: store.conditions, syringes: store.syringes }),
    );
    void nav({ to: "/results" });
  }

  const catalog = useMemo(() => MEDICINES.map((m) => m.name).join(", "), []);

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
        <p className="text-[12px] uppercase tracking-[0.18em] text-muted">Core compliance check</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Run the dataset against your route.</h1>
        <ol className="mt-8 flex gap-2 overflow-x-auto pb-2">
          {STEPS.map((label, i) => (
            <li key={label}>
              <button
                type="button"
                onClick={() => store.setStep(i)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-[12px] tracking-wide",
                  i === store.step ? "bg-ink text-surface" : "bg-bg-warm text-muted",
                )}
              >
                {i + 1} {label}
              </button>
            </li>
          ))}
        </ol>

        <div className="mt-10 min-h-80">
          {store.step === 0 && (
            <section>
              <h2 className="font-display text-2xl">Citizenship</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Requirements can depend on the traveller’s home country. This is not a visa check.
              </p>
              <Label className="mt-6">Country of citizenship</Label>
              <CountryOptions value={store.citizenship} onChange={(c) => c && store.setCitizenship(c)} />
              <Label className="mt-6">Source (boarding country)</Label>
              <CountryOptions value={store.source} onChange={(c) => c && store.setSource(c)} />
            </section>
          )}

          {store.step === 1 && (
            <section>
              <h2 className="font-display text-2xl">Medicines</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Enter brand or generic names. Unmatched names return No dataset available — nothing is invented.
              </p>
              <div className="mt-6 space-y-3">
                {store.medicines.map((row, index) => {
                  const suggestions = medicineSuggestions(row.name);
                  return (
                    <div key={row.key} className="relative">
                      <Label htmlFor={row.key}>Medicine {index + 1}</Label>
                      <div className="flex gap-2">
                        <Input
                          id={row.key}
                          value={row.name}
                          autoComplete="off"
                          placeholder="e.g. Insulin, Adderall, Sertraline"
                          onFocus={() => setOpenSuggest(row.key)}
                          onChange={(e) => {
                            store.updateMedicine(row.key, e.target.value);
                            setOpenSuggest(row.key);
                          }}
                        />
                        {store.medicines.length > 1 && (
                          <Button variant="ghost" onClick={() => store.removeMedicine(row.key)}>
                            Remove
                          </Button>
                        )}
                      </div>
                      {openSuggest === row.key && row.name.trim() && suggestions.length > 0 && (
                        <ul className="absolute z-20 mt-1 w-full rounded-[10px] border border-line bg-surface py-1">
                          {suggestions.map((med) => (
                            <li key={med.id}>
                              <button
                                type="button"
                                className="flex w-full px-3 py-2 text-left text-sm hover:bg-bg-warm"
                                onClick={() => {
                                  store.updateMedicine(row.key, med.name);
                                  setOpenSuggest(null);
                                }}
                              >
                                <span>{med.name}</span>
                                <span className="ml-2 text-faint">{med.generic}</span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
              <Button className="mt-4" variant="outline" onClick={store.addMedicine}>
                Add medicine
              </Button>
              <PrescriptionUpload />
              <p className="mt-6 text-xs leading-relaxed text-faint">
                Catalogue includes {catalog.split(", ").length} named products plus country class rules.
              </p>
            </section>
          )}

          {store.step === 2 && (
            <section>
              <h2 className="font-display text-2xl">Destination</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                The country you will enter as your destination. Same eleven-country list as citizenship.
              </p>
              <Label className="mt-6">Destination country</Label>
              <CountryOptions
                value={store.destination}
                onChange={(c) => c && store.setDestination(c)}
              />
            </section>
          )}

          {store.step === 3 && (
            <section>
              <h2 className="font-display text-2xl">Transit / layover</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Optional. One transit country, or none. Controlled-medicine rules can apply even if you stay airside.
              </p>
              <Label className="mt-6">Transit country</Label>
              <CountryOptions
                value={store.transit}
                onChange={store.setTransit}
                allowEmpty
                emptyLabel="No transit"
                exclude={store.destination}
              />
            </section>
          )}

          {store.step === 4 && (
            <section>
              <h2 className="font-display text-2xl">Health / emergency preparation</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                These selections customise packing recommendations and the checklist. CrossBorderMed does not diagnose you.
              </p>
              <ul className="mt-6 grid gap-2 sm:grid-cols-2">
                {HEALTH_CONDITIONS.map((item) => {
                  const on = store.conditions.includes(item.id);
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => store.toggleCondition(item.id)}
                        className={cn(
                          "flex h-full w-full flex-col items-start rounded-[12px] border px-4 py-3 text-left transition-colors duration-150",
                          on ? "border-accent bg-accent-muted" : "border-line bg-surface hover:border-line-strong",
                        )}
                      >
                        <span className="text-sm font-medium">{item.label}</span>
                        <span className="mt-1 text-xs text-muted">{item.hint}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
              <label className="mt-6 flex items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  checked={store.syringes}
                  onChange={(e) => store.setSyringes(e.target.checked)}
                  className="size-4 accent-accent"
                />
                I need to carry syringes / needles
              </label>
            </section>
          )}

          {store.step === 5 && (
            <section>
              <h2 className="font-display text-2xl">Review</h2>
              <dl className="mt-6 divide-y divide-line text-sm">
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-muted">Citizenship</dt>
                  <dd>{COUNTRY_LIST.find((c) => c.code === store.citizenship)?.name ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-muted">Source</dt>
                  <dd>{COUNTRY_LIST.find((c) => c.code === store.source)?.name ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-muted">Medicines</dt>
                  <dd className="text-right">{names.join(", ") || "—"}</dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-muted">Destination</dt>
                  <dd>{COUNTRY_LIST.find((c) => c.code === store.destination)?.name ?? "—"}</dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-muted">Transit</dt>
                  <dd>
                    {store.transit
                      ? COUNTRY_LIST.find((c) => c.code === store.transit)?.name
                      : "No transit"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4 py-3">
                  <dt className="text-muted">Preparation</dt>
                  <dd className="text-right">
                    {store.conditions.length
                      ? HEALTH_CONDITIONS.filter((c) => store.conditions.includes(c.id))
                          .map((c) => c.label)
                          .join(", ")
                      : "None selected"}
                    {store.syringes ? "; syringes" : ""}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-relaxed text-muted">
                The check will only display fields present in the dataset. Missing information appears as No dataset available.
              </p>
            </section>
          )}
        </div>

        {error && <p className="mt-4 text-sm text-danger">{error}</p>}

        <div className="mt-8 flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            disabled={store.step === 0}
            onClick={() => go(store.step - 1)}
          >
            Back
          </Button>
          {store.step < 5 ? (
            <Button onClick={() => go(store.step + 1)}>Continue</Button>
          ) : (
            <Button onClick={run}>Run check</Button>
          )}
        </div>
      </div>
    </PageShell>
  );
}
