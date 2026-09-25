import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/layout/page-shell";
import { JourneyMap, RouteStrip } from "@/components/map/journey-map";
import { Button } from "@/components/ui/button";
import { COUNTRY_LIST } from "@/data/countries";

export const Route = createFileRoute("/")({ component: Home });

const STORY = [
  {
    kicker: "01 — Medication + Health",
    title: "Know what you are carrying before you book.",
    body: "Enter every medicine. CrossBorderMed matches names against the regulatory dataset and refuses to invent missing fields.",
  },
  {
    kicker: "02 — Travel + Emergency preparation",
    title: "Cabin bag, syringes, and time-critical doses.",
    body: "Diabetes, anaphylaxis, epilepsy, and injectables change the packing list. The checklist only includes items the route actually implies.",
  },
  {
    kicker: "03 — Border + Documentation",
    title: "Permits, prescriptions, and quantity limits.",
    body: "Where the dataset lists a permit, a doctor's letter, or a day limit, those fields appear. Where it does not, you see No dataset available.",
  },
  {
    kicker: "04 — Travel prepared",
    title: "A route, a status, and a paper trail.",
    body: "Save the check, draft a medical certificate template, and keep history on this device. Documents never override destination law.",
  },
];

const JOURNEY = [
  "Traveller",
  "Citizenship",
  "Medication",
  "Destination",
  "Transit",
  "Compliance check",
  "Status",
  "Required documents",
  "Travel prepared",
];

const FEATURES = [
  { name: "Medication compliance", to: "/check", copy: "Multi-medicine check against the dataset, with status, notes, permits, and quantity limits." },
  { name: "Route intelligence", to: "/check", copy: "Origin, optional transit, and destination on one itinerary — including when transit rules apply." },
  { name: "Document vault", to: "/vault", copy: "Draft a marked template medical certificate and a local QR verification page." },
  { name: "Emergency finder", to: "/emergency", copy: "Search UI for nearby pharmacies. Live stock is not connected in this prototype." },
  { name: "Travel history", to: "/history", copy: "Previous checks stay in this browser. Reopen any result without an account." },
];

const FAQS = [
  {
    q: "Does CrossBorderMed say whether a medicine is legal?",
    a: "It reports what the available dataset contains for that medicine and country. It is not a legal determination and it does not replace destination, transit, or border authorities.",
  },
  {
    q: "What if a medicine is restricted?",
    a: "Restricted means the dataset lists extra controls — permits, pre-approval, or verification — not a guarantee of entry. Not allowed means the dataset classifies the product as prohibited on that route.",
  },
  {
    q: "Do transit countries matter?",
    a: "Yes. Some authorities apply controlled-medicine rules to passengers who only change planes. Add one transit country to include it in the check.",
  },
  {
    q: "Why do you ask for citizenship?",
    a: "Requirements can depend on whether you are entering, transiting, or returning home. Citizenship is collected because the dataset includes returning-citizen notes where they exist.",
  },
  {
    q: "What documents should I carry?",
    a: "Only those listed for the matched records: typically original packaging, a prescription, a doctor's letter, and any named permit. If a field is missing from the dataset, it is not shown.",
  },
  {
    q: "Are prescription requirements always the same?",
    a: "No. Some records require a prescription, some require a named permit, some require both. The check prints only the fields present for that medicine and country.",
  },
  {
    q: "How are quantity limits decided?",
    a: "Maximum days and quantity appear only when the dataset has a number. There is no inferred default.",
  },
  {
    q: "How does QR verification work?",
    a: "The travel certificate QR encodes a compressed snapshot of the letter — name, date of birth, last four passport digits, medicine, and physician details. Scanning it opens a verification card. It is not a government registry.",
  },
];

function Home() {
  return (
    <PageShell>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="/images/hero-desk.jpg"
            alt="Passport, medication, and a world map with a route drawn from South Asia through the Gulf to East Asia"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-bg via-bg/88 to-bg/55 md:bg-gradient-to-r md:from-bg md:via-bg/85 md:to-bg/20" />
        </div>
        <div className="relative mx-auto grid min-h-[88vh] max-w-6xl items-center px-5 py-20">
          <div className="max-w-xl">
            <p className="text-[12px] font-medium uppercase tracking-[0.22em] text-muted">
              Medication · International travel · Border compliance
            </p>
            <h1 className="mt-5 font-display text-[3.1rem] leading-[1.05] tracking-tight text-ink md:text-[4.6rem]">
              Check the medicine before you cross the border.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-soft md:text-lg">
              CrossBorderMed reads a regulatory dataset — not guesses — for eleven countries. If a field is not in the dataset, it stays blank.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/check">
                <Button size="lg">Check my medication</Button>
              </Link>
              <a href="#journey">
                <Button size="lg" variant="outline">
                  See the route
                </Button>
              </a>
            </div>
            <p className="mt-8 text-sm text-muted">
              Japan, UAE, UK, Germany, Singapore, France, Mexico, India, Italy, Turkey, USA
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface-2">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-2">
          {STORY.map((block) => (
            <article key={block.kicker} className="max-w-lg">
              <p className="text-[12px] uppercase tracking-[0.18em] text-accent">{block.kicker}</p>
              <h2 className="mt-3 font-display text-3xl leading-tight md:text-4xl">{block.title}</h2>
              <p className="mt-4 text-base leading-relaxed text-ink-soft">{block.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="journey" className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-[12px] uppercase tracking-[0.18em] text-muted">Journey map</p>
        <div className="mt-3 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <RouteStrip origin="IN" transit="AE" destination="JP" />
          <p className="max-w-sm text-sm leading-relaxed text-muted">
            Departure, a transit checkpoint, then destination compliance — one itinerary, three jurisdictions.
          </p>
        </div>
        <JourneyMap origin="IN" transit="AE" destination="JP" className="mt-8 min-h-[280px]" />
        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {[
            { t: "Departure", d: "Citizenship and origin set the starting city and returning-home notes." },
            { t: "Transit checkpoint", d: "Optional layover. UAE and Singapore records can apply even if you do not clear immigration." },
            { t: "Destination compliance", d: "Status, notes, permits, prescriptions, and quantity limits from the dataset only." },
          ].map((item) => (
            <li key={item.t}>
              <p className="font-medium">{item.t}</p>
              <p className="mt-2 text-sm leading-relaxed text-muted">{item.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-ink text-surface">
        <div className="mx-auto max-w-6xl px-5 py-20">
          <p className="text-[12px] uppercase tracking-[0.18em] text-surface/50">Product journey</p>
          <h2 className="mt-3 max-w-2xl font-display text-4xl leading-tight md:text-5xl">
            Features sit on the path, not in a grid.
          </h2>
          <ol className="mt-12 flex flex-wrap gap-x-2 gap-y-3 text-sm md:text-base">
            {JOURNEY.map((step, i) => (
              <li key={step} className="flex items-center gap-2">
                <span className="text-surface/40">{String(i + 1).padStart(2, "0")}</span>
                <span>{step}</span>
                {i < JOURNEY.length - 1 && <span className="text-accent">→</span>}
              </li>
            ))}
          </ol>
          <ul className="mt-14 divide-y divide-white/10">
            {FEATURES.map((feature) => (
              <li key={feature.name} className="grid gap-2 py-6 md:grid-cols-[240px_1fr_auto] md:items-center">
                <p className="font-medium">{feature.name}</p>
                <p className="text-sm leading-relaxed text-surface/65">{feature.copy}</p>
                <Link to={feature.to} className="text-sm text-accent-muted hover:text-surface">
                  Open
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid md:grid-cols-2">
        <div className="relative min-h-[420px]">
          <img
            src="/images/border-control.jpg"
            alt="Passport and customs stamp at a border desk"
            className="absolute inset-0 h-full w-full object-cover"
          />
        </div>
        <div className="flex flex-col justify-center bg-surface-2 px-8 py-16 md:px-14">
          <p className="text-[12px] uppercase tracking-[0.18em] text-muted">Border · Customs · Verification</p>
          <h2 className="mt-4 font-display text-4xl leading-tight">Papers help. They do not replace the law.</h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-soft">
            A prescription, a doctor's letter, and a drafted certificate support the traveller at border control. They do not override destination or transit rules in the dataset — or any rule the dataset does not contain.
          </p>
          <Link to="/vault" className="mt-8 inline-flex">
            <Button variant="ink">Open document vault</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <p className="text-[12px] uppercase tracking-[0.18em] text-muted">FAQ</p>
        <h2 className="mt-3 font-display text-4xl">Before you rely on a colour.</h2>
        <dl className="mt-10 divide-y divide-line">
          {FAQS.map((item) => (
            <details key={item.q} className="group py-5">
              <summary className="cursor-pointer list-none font-medium text-ink [&::-webkit-details-marker]:hidden">
                <span className="flex items-start justify-between gap-6">
                  {item.q}
                  <span className="text-faint transition-transform duration-150 group-open:rotate-45">+</span>
                </span>
              </summary>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink-soft">{item.a}</p>
            </details>
          ))}
        </dl>
        <aside className="mt-12 max-w-3xl border-l-2 border-amber pl-5 text-sm leading-relaxed text-ink-soft">
          CrossBorderMed provides informational compliance guidance based on its available regulatory dataset.
          Requirements may change and may vary by individual circumstances. Travellers should verify requirements
          with the relevant destination, transit and border authorities and their healthcare professional before travel.
        </aside>
      </section>

      <section className="relative overflow-hidden bg-ink text-surface">
        <img
          src="/images/world-map.jpg"
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-30"
        />
        <div className="relative mx-auto max-w-4xl px-5 py-24 text-center">
          <p className="text-[12px] uppercase tracking-[0.22em] text-surface/50">
            Medication + travel + border preparation
          </p>
          <h2 className="mt-4 font-display text-4xl leading-tight md:text-6xl">
            Start your compliance check.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-surface/70">
            Citizenship, medicines, destination, optional transit — then a dataset-backed status for every product on the ticket.
          </p>
          <div className="mt-8 flex justify-center">
            <Link to="/check">
              <Button size="lg">Start your compliance check</Button>
            </Link>
          </div>
          <p className="mt-10 text-xs tracking-wide text-surface/40">
            Covered origins and destinations: {COUNTRY_LIST.map((c) => c.short).join(" · ")}
          </p>
        </div>
      </section>
    </PageShell>
  );
}
