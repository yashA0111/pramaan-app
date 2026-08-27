import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, ShieldCheck, UserRound } from "lucide-react";
import { useState } from "react";

import { PramaanMark } from "@/components/pramaan-mark";
import { demoRoleLabel, loginDemo, type DemoRole } from "@/lib/demo-auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Demo login — Pramaan" },
      { name: "description", content: "Choose a synthetic Pramaan demonstration role." },
    ],
  }),
  component: LoginPage,
});

const ROLES: Array<{ role: DemoRole; description: string; icon: typeof UserRound }> = [
  { role: "citizen", description: "Scan a credential and receive a trust receipt.", icon: UserRound },
  { role: "official", description: "Open the official confirmation console.", icon: BadgeCheck },
  { role: "demo_admin", description: "Provision synthetic officials and print ID cards.", icon: ShieldCheck },
];

function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<DemoRole | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function continueAs(role: DemoRole) {
    setLoading(role);
    setError(null);
    try {
      await loginDemo(role);
      await navigate({ to: role === "demo_admin" ? "/admin/demo" : role === "official" ? "/official" : "/app" });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Demo login could not be completed.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 md:px-8 md:py-14">
      <div className="mx-auto max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2.5" aria-label="Pramaan home">
          <PramaanMark className="size-7" />
          <span className="font-display text-card-title font-semibold tracking-tight">Pramaan</span>
        </Link>

        <div className="mt-16 grid gap-12 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] md:items-start">
          <header>
            <p className="text-label uppercase tracking-widest text-accent">Demonstration access</p>
            <h1 className="mt-4 max-w-md font-display text-page-title text-foreground md:text-display">Choose your role.</h1>
            <p className="mt-4 max-w-md text-body text-foreground-muted">
              This is a development login for the synthetic showcase. It is not government authentication.
            </p>
          </header>

          <section aria-labelledby="role-heading">
            <h2 id="role-heading" className="sr-only">Continue as</h2>
            <div className="divide-y divide-border border-y border-border bg-surface">
              {ROLES.map(({ role, description, icon: Icon }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => void continueAs(role)}
                  disabled={loading !== null}
                  className="group flex min-h-24 w-full items-center gap-4 px-5 py-5 text-left transition-colors hover:bg-muted disabled:cursor-wait disabled:opacity-60 md:px-6"
                >
                  <span className="flex size-11 shrink-0 items-center justify-center border border-border-strong bg-background text-accent">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-card-title font-semibold text-foreground">{demoRoleLabel(role)}</span>
                    <span className="mt-1 block text-body-sm text-foreground-muted">{description}</span>
                  </span>
                  <ArrowRight className="size-5 shrink-0 text-foreground-subtle transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </button>
              ))}
            </div>
            {loading && <p className="mt-3 text-body-sm text-foreground-muted">Opening {demoRoleLabel(loading)} workspace...</p>}
            {error && <p role="alert" className="mt-3 border border-danger/30 bg-danger-soft px-3 py-2 text-body-sm text-danger-soft-foreground">{error}</p>}
          </section>
        </div>
      </div>
    </main>
  );
}
