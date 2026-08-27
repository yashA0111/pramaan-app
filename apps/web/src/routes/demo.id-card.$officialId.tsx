import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Printer, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import QRCode from "qrcode";

import { PramaanMark } from "@/components/pramaan-mark";
import { formatPermanentCredentialUri } from "@/features/verification/qr";
import { apiRequest } from "@/lib/api/client";
import { demoAuthHeaders } from "@/lib/demo-auth";

export const Route = createFileRoute("/demo/id-card/$officialId")({
  head: () => ({
    meta: [{ title: "Official ID card — Pramaan" }],
  }),
  component: IdCardPage,
});

type OfficialCardData = {
  displayName: string;
  designation: string;
  department: string;
  postingLocation: string;
  officialStatus: string;
  credential: {
    reference: string;
    status: string;
    photoUrl?: string;
    expiresAt: string;
  } | null;
  permanentQr?: { uri: string; qrDataUrl: string } | null;
};

function IdCardPage() {
  const { officialId } = Route.useParams();
  const [official, setOfficial] = useState<OfficialCardData | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void apiRequest<OfficialCardData>(`/admin/demo/officials/${officialId}`, { headers: demoAuthHeaders() })
      .then((data) => {
        if (active) setOfficial(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError instanceof Error ? requestError.message : "ID card could not be loaded.");
      });
    return () => {
      active = false;
    };
  }, [officialId]);

  useEffect(() => {
    const reference = official?.credential?.reference;
    if (!reference) return;
    const uri = formatPermanentCredentialUri(reference);
    if (official.permanentQr?.qrDataUrl) {
      setQrDataUrl(official.permanentQr.qrDataUrl);
      return;
    }
    void QRCode.toDataURL(uri, { errorCorrectionLevel: "H", margin: 2, width: 480 })
      .then(setQrDataUrl)
      .catch(() => setError("The permanent QR could not be rendered."));
  }, [official]);

  if (error) {
    return <main className="flex min-h-screen items-center justify-center bg-background px-4"><p className="border border-danger/30 bg-danger-soft p-4 text-body-sm text-danger-soft-foreground">{error}</p></main>;
  }
  if (!official) {
    return <main className="flex min-h-screen items-center justify-center bg-background text-body-sm text-foreground-muted">Loading ID card...</main>;
  }
  if (!official.credential) {
    return <main className="flex min-h-screen items-center justify-center bg-background px-4"><p className="border border-border bg-surface p-4 text-body-sm text-foreground-muted">This official has no linked credential.</p></main>;
  }

  const { credential } = official;
  const permanentUri = formatPermanentCredentialUri(credential.reference);

  return (
    <main className="min-h-screen bg-[linear-gradient(135deg,hsl(var(--background)),hsl(var(--surface-muted)))] px-4 py-6 text-foreground md:py-10 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl print:max-w-none">
        {/* Nav bar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 print:hidden">
          <Link to="/admin/demo" className="inline-flex min-h-10 items-center gap-2 border border-border bg-surface px-3 text-body-sm font-semibold text-foreground hover:bg-muted">
            <ArrowLeft className="size-4" aria-hidden="true" /> Admin
          </Link>
          <button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center gap-2 bg-primary px-4 text-body-sm font-semibold text-primary-foreground hover:bg-primary/90">
            <Printer className="size-4" aria-hidden="true" /> Print ID card
          </button>
        </div>

        {/*
          Mobile: tall portrait card — photo, name/details, and QR stacked vertically.
          md+: original landscape credit-card format with aspect ratio.
          print: always uses the landscape card style.
        */}

        {/* ── Mobile portrait card (hidden on md+) ── */}
        <article className="mx-auto w-full max-w-sm overflow-hidden border border-primary/25 bg-surface shadow-elev-2 md:hidden print:hidden">
          {/* Card header */}
          <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
            <div className="flex items-center gap-2">
              <PramaanMark className="size-7" />
              <div>
                <p className="font-display text-body-sm font-semibold tracking-tight">Pramaan</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-foreground-subtle">Evidence becomes trust</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">Official</p>
              <p className="text-[9px] uppercase tracking-widest text-foreground-subtle">Synthetic demonstration</p>
            </div>
          </div>

          {/* Portrait photo */}
          <div className="aspect-[4/3] overflow-hidden bg-surface-muted">
            <img
              src={official.credential.photoUrl || "/assets/persona-arjun-mehta.jpg"}
              alt={`${official.displayName} portrait`}
              className="h-full w-full object-cover object-top"
            />
          </div>

          {/* Name & details */}
          <div className="px-4 py-4">
            <p className="text-[9px] uppercase tracking-[0.2em] text-foreground-subtle">Name</p>
            <h1 className="mt-1 font-display text-section-title font-semibold text-foreground">{official.displayName}</h1>
            <p className="mt-1.5 text-body-sm font-semibold text-primary">{official.designation}</p>
            <p className="mt-0.5 text-body-sm text-foreground-muted">{official.department}</p>
            <p className="mt-0.5 text-metadata text-foreground-subtle">{official.postingLocation}</p>
          </div>

          {/* QR + credential ref */}
          <div className="flex items-center gap-4 border-t border-border px-4 py-4">
            <div className="shrink-0 bg-white p-2.5">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt={`Permanent credential QR encoding ${permanentUri}`} className="size-24" />
              ) : (
                <div className="size-24 bg-muted" />
              )}
            </div>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.2em] text-foreground-subtle">Credential reference</p>
              <p className="mt-1 break-all font-display text-body-sm font-semibold tracking-wider text-foreground">{credential.reference}</p>
              <p className="mt-2 text-[9px] font-semibold uppercase tracking-widest text-foreground-subtle">Scan with Pramaan</p>
            </div>
          </div>

          {/* Card footer */}
          <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-[9px] text-foreground-subtle">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="size-3 text-success" aria-hidden="true" /> {credential.status}
            </span>
            <span>Valid until {new Date(credential.expiresAt).toLocaleDateString()}</span>
          </div>
        </article>

        {/* ── Desktop landscape card (hidden on mobile, always shown on print) ── */}
        <article className="mx-auto hidden aspect-[1.586/1] w-full max-w-[760px] overflow-hidden border border-primary/25 bg-surface shadow-elev-2 md:block print:!block print:shadow-none">
          <div className="flex h-full flex-col p-5 sm:p-8">
            <header className="flex items-start justify-between border-b border-border pb-4 sm:pb-5">
              <div className="flex items-center gap-2.5">
                <PramaanMark className="size-8" />
                <div>
                  <p className="font-display text-card-title font-semibold tracking-tight">Pramaan</p>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-foreground-subtle">Evidence becomes trust</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display text-body-sm font-semibold uppercase tracking-[0.16em] text-primary">Official</p>
                <p className="mt-1 text-[10px] uppercase tracking-widest text-foreground-subtle">Synthetic demonstration</p>
              </div>
            </header>

            <div className="grid min-h-0 flex-1 grid-cols-[clamp(5rem,22%,9rem)_minmax(0,1fr)_clamp(5.5rem,24%,10.5rem)] items-center gap-4 py-5 sm:gap-7 sm:py-7">
              <div className="aspect-[4/5] overflow-hidden border border-border bg-surface-muted">
                <img src={official.credential.photoUrl || "/assets/persona-arjun-mehta.jpg"} alt={`${official.displayName} portrait`} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 self-center">
                <p className="text-[10px] uppercase tracking-[0.2em] text-foreground-subtle">Name</p>
                <h1 className="mt-1 break-words font-display text-card-title font-semibold text-foreground sm:text-section-title">{official.displayName}</h1>
                <p className="mt-2 text-body-sm font-semibold text-primary">{official.designation}</p>
                <p className="mt-1 text-body-sm text-foreground-muted">{official.department}</p>
                <p className="mt-1 text-metadata text-foreground-subtle">{official.postingLocation}</p>
                <div className="mt-5 border-t border-border pt-3">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-foreground-subtle">Credential reference</p>
                  <p className="mt-1 break-all font-display text-body-sm font-semibold tracking-wider text-foreground sm:text-credential">{credential.reference}</p>
                </div>
              </div>
              <div className="justify-self-end text-center">
                <div className="bg-white p-2 sm:p-3">
                  {qrDataUrl ? (
                    <img src={qrDataUrl} alt={`Permanent credential QR encoding ${permanentUri}`} className="size-[clamp(4.5rem,18vw,9rem)]" />
                  ) : (
                    <div className="size-[clamp(4.5rem,18vw,9rem)] bg-muted" />
                  )}
                </div>
                <p className="mt-2 text-[9px] font-semibold uppercase tracking-widest text-foreground-subtle">Scan with Pramaan</p>
              </div>
            </div>

            <footer className="flex items-center justify-between border-t border-border pt-3 text-[10px] text-foreground-subtle sm:pt-4">
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-success" aria-hidden="true" /> Credential status: {credential.status}
              </span>
              <span>Valid until {new Date(credential.expiresAt).toLocaleDateString()}</span>
            </footer>
          </div>
        </article>

        <p className="mx-auto mt-4 max-w-[760px] text-center text-metadata text-foreground-subtle print:hidden">
          This card is a synthetic demonstration artifact. The QR identifies the credential; it does not itself verify the person.
        </p>
      </div>
    </main>
  );
}
