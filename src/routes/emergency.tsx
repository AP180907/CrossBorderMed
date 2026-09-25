import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageShell } from "@/components/layout/page-shell";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { COUNTRY_LIST } from "@/data/countries";
import { MEDICINES } from "@/data/dataset";
import { matchMedicine } from "@/lib/compliance";

export const Route = createFileRoute("/emergency")({ component: EmergencyPage });

function EmergencyPage() {
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const match = useMemo(() => (submitted ? matchMedicine(query) : null), [submitted, query]);

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl px-5 py-12 md:py-16">
        <p className="text-[12px] uppercase tracking-[0.18em] text-muted">Emergency finder</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl">Find a medicine nearby.</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-soft">
          Search the interface. Live pharmacy, distance, and stock data are not connected in this prototype.
          Results are not fabricated.
        </p>

        <form
          className="mt-10 space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
        >
          <div>
            <Label htmlFor="med">Medicine</Label>
            <Input
              id="med"
              list="med-list"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSubmitted(false);
              }}
              placeholder="Search a medicine"
            />
            <datalist id="med-list">
              {MEDICINES.map((m) => (
                <option key={m.id} value={m.name} />
              ))}
            </datalist>
          </div>
          <div>
            <Label htmlFor="where">Country (optional)</Label>
            <Select id="where" value={country} onChange={(e) => setCountry(e.target.value)}>
              <option value="">Any of the 11 countries</option>
              {COUNTRY_LIST.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit">Search</Button>
        </form>

        {submitted && (
          <div className="mt-10 border-t border-line pt-8">
            <p className="text-sm font-medium">
              {match ? `Catalogue match: ${match.name} (${match.generic})` : "No catalogue match for that name."}
            </p>
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="text-[11px] uppercase tracking-[0.14em] text-muted">
                  <tr className="border-b border-line">
                    <th className="py-3 font-medium">Pharmacy</th>
                    <th className="py-3 font-medium">Address</th>
                    <th className="py-3 font-medium">Distance</th>
                    <th className="py-3 font-medium">Stock</th>
                    <th className="py-3 font-medium">Prescription</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-line">
                    <td className="py-4" colSpan={5}>
                      Live pharmacy and stock data is not connected. No locations, distances, or availability
                      are shown.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-muted">
              Use a local emergency number or the destination’s official pharmacy locator if you need medicine
              now. CrossBorderMed does not list invented shops.
            </p>
          </div>
        )}
      </div>
    </PageShell>
  );
}
