import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowRight, ScanLine } from "lucide-react";

import { MarketingFooter, MarketingHeader } from "@/components/layout/marketing-chrome";
import { CredentialReveal } from "@/components/showcase/credential-reveal";
import { EvidenceToTrustHero } from "@/components/showcase/evidence-to-trust-hero";
import { VerificationProgress } from "@/components/product/verification-progress";
import { Skeleton } from "@/components/ui/skeleton";
import { verificationQueries } from "@/features/verification/mock-service";
import { DEMO_PROGRESS } from "@/features/verification/mock-service";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pramaan — Evidence becomes trust" },
      {
        name: "description",
        content:
          "Verify a government official's credential in seconds: scan the QR, compare the identity, request official confirmation, and keep the trust receipt.",
      },
      { property: "og:title", content: "Pramaan — Evidence becomes trust" },
      {
        property: "og:description",
        content:
          "Identity verification and public safety: credential scanning, identity matching, official confirmation, trust receipts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

/** Certainty is layered, never collapsed into one green tick. */
const CERTAINTY_LEVELS = [
  {
    index: "I",
    title: "Credential valid",
    body: "The document resolves in the registry, the issuer is recognised, and it has not expired or been revoked.",
    tone: "text-success",
  },
  {
    index: "II",
    title: "Identity matched",
    body: "The person standing in front of you is compared against the photograph bound to that credential.",
    tone: "text-success",
  },
  {
    index: "III",
    title: "Officially confirmed",
    body: "The issuing office affirms, live, that this officer is on duty and this interaction is theirs.",
    tone: "text-accent",
  },
] as const;

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <main>
        {/* Hero — Evidence → Verification → Trust */}
        <section className="mx-auto w-full max-w-6xl px-4 pb-16 pt-12 md:px-8 md:pb-24 md:pt-20">
          <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:gap-16">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1.5 text-label uppercase text-foreground-muted">
                <span className="size-1.5 rounded-full bg-accent" aria-hidden="true" />
                Identity verification · demo build
              </p>
              <h1 className="mt-6 font-display text-hero text-foreground md:text-display">
                Evidence becomes trust.
              </h1>
              <p className="mt-5 max-w-md text-body text-foreground-muted">
                Pramaan verifies a government official's credential in seconds — scan, compare,
                confirm — and hands you a trust receipt. Built for the moments when trust is not a
                formality.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/login"
                  className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-5 py-2.5 text-body-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong"
                >
                  <ScanLine className="size-4" aria-hidden="true" />
                  Verify an official
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface px-5 py-2.5 text-body-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                  How verification works
                  <ArrowDown className="size-4" aria-hidden="true" />
                </a>
              </div>

              <dl className="mt-12 grid max-w-md grid-cols-2 gap-4 sm:grid-cols-3 border-t border-border pt-6">
                <HeroStat term="Pipeline stages" detail="8 ordered" />
                <HeroStat term="Certainty levels" detail="3 distinct" />
                <HeroStat term="Real data used" detail="None" />
              </dl>
            </div>

            <EvidenceToTrustHero className="min-w-0" />
          </div>
        </section>

        {/* Pipeline — editorial two-column */}
        <section id="how-it-works" className="border-y border-border bg-surface-muted/50">
          <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:gap-16">
            <div className="lg:sticky lg:top-24 lg:self-start">
              <p className="text-label uppercase text-accent">How verification works</p>
              <h2 className="mt-3 max-w-md font-display text-section-title text-foreground md:text-page-title">
                Eight steps. No shortcuts.
              </h2>
              <p className="mt-4 max-w-md text-body text-foreground-muted">
                A scan is not a verification. Pramaan walks an ordered pipeline — from raw QR
                payload to sealed receipt — and every step reports its own state. No step claims
                success before it happens.
              </p>
              <p className="mt-4 max-w-md text-body-sm text-foreground-subtle">
                If a check fails, the pipeline stops there and says so. The interface never promotes
                a partial result to a verified one.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-surface-strong p-5 shadow-elev-1 md:p-7">
              <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                <p className="text-label uppercase text-foreground-subtle">Live pipeline</p>
                <span className="font-display text-[11px] tracking-[0.14em] text-foreground-subtle">
                  SES_9F42KDL1
                </span>
              </div>
              <VerificationProgress steps={DEMO_PROGRESS.steps} className="mt-5" />
            </div>
          </div>
        </section>

        {/* Three kinds of sure — ruled triptych, not cards */}
        <section className="mx-auto w-full max-w-6xl px-4 py-16 md:px-8 md:py-24">
          <p className="text-label uppercase text-accent">Certainty is layered</p>
          <h2 className="mt-3 max-w-xl font-display text-section-title text-foreground md:text-page-title">
            Three kinds of sure, never collapsed into one.
          </h2>

          <div className="mt-10 grid divide-y divide-border border-t border-border md:grid-cols-3 md:divide-x md:divide-y-0">
            {CERTAINTY_LEVELS.map((level) => (
              <div key={level.index} className="py-6 md:px-6 md:py-7 md:first:pl-0 md:last:pr-0">
                <p className={`font-display text-[13px] tracking-[0.2em] ${level.tone}`}>
                  {level.index}
                </p>
                <h3 className="mt-3 font-display text-card-title text-foreground">{level.title}</h3>
                <p className="mt-2 text-body-sm text-foreground-muted">{level.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The result is a document */}
        <section className="border-t border-border bg-surface-muted/50">
          <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 md:px-8 md:py-24 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:gap-16">
            <ShowcaseCredential />
            <div className="min-w-0">
              <p className="text-label uppercase text-accent">The result</p>
              <h2 className="mt-3 max-w-md font-display text-section-title text-foreground md:text-page-title">
                A document, not a toast.
              </h2>
              <p className="mt-4 max-w-md text-body text-foreground-muted">
                The outcome of a verification is an artifact you can read, keep and produce later:
                who was verified, by whose authority, under which credential, and exactly how far
                the certainty went.
              </p>
              <p className="mt-4 max-w-md text-body-sm text-foreground-subtle">
                Every field is rendered from the verification response. The interface never invents
                authenticity of its own.
              </p>
              <Link
                to="/login"
                className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-md border border-border bg-surface-strong px-5 py-2.5 text-body-sm font-semibold text-foreground transition-colors hover:bg-muted"
              >
                Open the demo app
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </div>
  );
}

function HeroStat({ term, detail }: { term: string; detail: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-label uppercase text-foreground-subtle">{term}</dt>
      <dd className="mt-1 font-display text-body-sm font-semibold text-foreground">{detail}</dd>
    </div>
  );
}

function ShowcaseCredential() {
  const credential = useQuery(verificationQueries.demoCredential());

  if (credential.isPending) {
    return (
      <div className="space-y-3" aria-label="Loading demo credential">
        <Skeleton className="h-5 w-40" />
        <div className="flex gap-4">
          <Skeleton className="aspect-[5/6] w-20 rounded-md" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-2/3" />
          </div>
        </div>
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  if (credential.isError) {
    return (
      <p className="text-body-sm text-foreground-muted">The demo credential could not be loaded.</p>
    );
  }

  return <CredentialReveal credential={credential.data} status="verified" className="min-w-0" />;
}
