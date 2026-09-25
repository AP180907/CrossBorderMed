import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-bg-warm">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-12 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-display text-xl">CrossBorderMed</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Informational compliance guidance from the available regulatory dataset.
            Documents support the traveller; they do not override destination law.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          <Link to="/check" className="hover:text-ink">
            Compliance check
          </Link>
          <Link to="/vault" className="hover:text-ink">
            Document vault
          </Link>
          <Link to="/emergency" className="hover:text-ink">
            Emergency finder
          </Link>
          <Link to="/history" className="hover:text-ink">
            Travel history
          </Link>
        </div>
      </div>
    </footer>
  );
}
