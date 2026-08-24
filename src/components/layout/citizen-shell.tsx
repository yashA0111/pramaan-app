import { Link, Outlet } from "@tanstack/react-router";
import { History, House, LifeBuoy, ScanLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { PramaanMark } from "@/components/pramaan-mark";
import { cn } from "@/lib/utils";

const NAV_ITEMS: { to: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { to: "/app", label: "Home", icon: House, exact: true },
  { to: "/app/verify", label: "Verify", icon: ScanLine },
  { to: "/app/safety", label: "Safety", icon: LifeBuoy },
  { to: "/app/activity", label: "Activity", icon: History },
];

/**
 * Citizen application shell. Mobile-first: top brand bar + thumb-reachable
 * bottom navigation. Desktop: composed left rail — same hierarchy, wider
 * canvas. Exactly one <main> per page lives here.
 */
export function CitizenShell() {
  return (
    <div className="min-h-screen bg-background md:grid md:grid-cols-[248px_minmax(0,1fr)]">
      {/* Desktop side rail */}
      <aside className="sticky top-0 hidden h-screen flex-col border-r border-border bg-surface px-4 py-6 md:flex">
        <Link to="/" className="flex items-center gap-2.5 px-2" aria-label="Pramaan home">
          <PramaanMark className="size-7" />
          <span className="font-display text-card-title font-semibold tracking-tight">Pramaan</span>
        </Link>

        <nav aria-label="Primary" className="mt-8 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact ?? false }}
              className="flex min-h-11 items-center gap-3 rounded-md px-3 text-body-sm font-medium text-foreground-muted transition-colors hover:bg-muted hover:text-foreground"
              activeProps={{ className: "bg-muted text-foreground" }}
            >
              <item.icon className="size-4.5 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>

        <p className="mt-auto rounded-md border border-dashed border-border-strong px-3 py-2.5 text-metadata text-foreground-subtle">
          Demo build — synthetic identities only. No real police or government systems are
          contacted.
        </p>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur md:hidden">
        <Link to="/" className="flex items-center gap-2" aria-label="Pramaan home">
          <PramaanMark className="size-6" />
          <span className="font-display text-body-sm font-semibold tracking-tight">Pramaan</span>
        </Link>
        <span className="rounded-full border border-border bg-surface-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground-muted">
          Demo
        </span>
      </header>

      <main className="mx-auto w-full max-w-2xl px-4 pb-28 pt-6 md:max-w-4xl md:px-10 md:pb-16 md:pt-10 lg:max-w-5xl">
        <Outlet />
      </main>

      {/* Mobile bottom navigation — thumb zone */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-strong/95 backdrop-blur md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.exact ?? false }}
              aria-label={item.label}
              className="relative flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-medium text-foreground-subtle transition-colors"
              activeProps={{ className: "text-accent" }}
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    className="size-5"
                    strokeWidth={isActive ? 2.25 : 1.75}
                    aria-hidden="true"
                  />
                  {item.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-0 h-0.5 w-8 rounded-full transition-colors",
                      isActive ? "bg-accent" : "bg-transparent",
                    )}
                  />
                </>
              )}
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
