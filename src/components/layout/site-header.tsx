import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/check", label: "Check" },
  { to: "/history", label: "History" },
  { to: "/vault", label: "Vault" },
  { to: "/emergency", label: "Emergency" },
] as const;

export function SiteHeader({ inverted = false }: { inverted?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b backdrop-blur-md",
        inverted
          ? "border-white/10 bg-ink/80 text-surface"
          : "border-line/80 bg-bg/85 text-ink",
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <Link to="/" className="flex items-center gap-2.5">
          <span
            className={cn(
              "grid size-7 place-items-center rounded-[6px] border",
              inverted ? "border-accent/50 bg-accent/20" : "border-accent/30 bg-accent-muted",
            )}
            aria-hidden
          >
            <span className="block h-3 w-3 bg-accent" style={{ clipPath: "polygon(40% 0, 60% 0, 60% 40%, 100% 40%, 100% 60%, 60% 60%, 60% 100%, 40% 100%, 40% 60%, 0 60%, 0 40%, 40% 40%)" }} />
          </span>
          <span className="font-display text-[17px] tracking-tight">CrossBorderMed</span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {LINKS.map((link) => {
            const active = pathname === link.to || pathname.startsWith(`${link.to}/`);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "rounded-[8px] px-3 py-2 text-sm transition-colors duration-150",
                  active
                    ? inverted
                      ? "text-surface"
                      : "text-ink"
                    : inverted
                      ? "text-surface/60 hover:text-surface"
                      : "text-muted hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
        <Link
          to="/check"
          className={cn(
            "inline-flex h-10 items-center rounded-[10px] px-4 text-sm font-medium transition-transform duration-150 active:scale-[0.96]",
            inverted ? "bg-surface text-ink" : "bg-accent text-accent-fg",
          )}
        >
          Check<span className="hidden sm:inline"> my medication</span>
        </Link>
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-line/70 px-3 py-2 md:hidden">
        {LINKS.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className="shrink-0 rounded-full px-3 py-1.5 text-sm text-muted hover:text-ink"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
