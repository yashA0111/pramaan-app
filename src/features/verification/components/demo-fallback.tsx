import { FlaskConical, QrCode } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

import { DEMO_SCENARIO_LIST, PRIMARY_DEMO_REFERENCE } from "../demo-registry";
import { formatCredentialUri } from "../qr";

interface DemoFallbackProps {
  onUseReference: (reference: string) => void;
  disabled?: boolean;
  className?: string;
}

/**
 * Clearly labelled demonstration path. It never pretends a camera scan
 * happened: sessions created here are flagged `demo` end to end.
 */
export function DemoFallback({ onUseReference, disabled = false, className }: DemoFallbackProps) {
  const [open, setOpen] = useState(false);

  return (
    <section
      aria-label="Demonstration fallback"
      className={cn(
        "rounded-lg border border-dashed border-warning/45 bg-warning-soft/40 p-4",
        className,
      )}
    >
      <p className="flex items-center gap-2 text-label uppercase text-warning-soft-foreground">
        <FlaskConical className="size-3.5" aria-hidden="true" />
        Demonstration path
      </p>
      <p className="mt-2 text-body-sm text-foreground-muted">
        If the camera cannot be used here, continue with a synthetic credential reference. This is
        not a real capture and every result stays marked as a demonstration.
      </p>

      <div className="mt-3.5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onUseReference(PRIMARY_DEMO_REFERENCE)}
          className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-surface-strong px-4 text-body-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          Use demo credential
        </button>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          className="inline-flex min-h-11 items-center rounded-md px-3 text-body-sm font-medium text-foreground-muted underline decoration-border-strong underline-offset-4 hover:text-foreground"
        >
          {open ? "Hide scenarios" : "Choose a scenario"}
        </button>
      </div>

      {open && (
        <ul className="mt-3 divide-y divide-warning/25 border-t border-warning/25">
          {DEMO_SCENARIO_LIST.map((scenario) => (
            <li key={scenario.reference}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onUseReference(scenario.reference)}
                className="flex w-full min-h-11 flex-col items-start gap-0.5 py-2.5 text-left disabled:opacity-50"
              >
                <span className="font-display text-credential tracking-wide text-foreground">
                  {scenario.reference}
                </span>
                <span className="text-metadata text-foreground-muted">{scenario.label}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/**
 * Renders a scannable demo QR so the real decoder can be exercised on a
 * second device. Generated in the browser only.
 */
export function DemoQrCode({ reference = PRIMARY_DEMO_REFERENCE, className }: { reference?: string; className?: string }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const uri = formatCredentialUri(reference);

  useEffect(() => {
    let cancelled = false;
    void import("qrcode").then(async (mod) => {
      const toDataURL = (mod as unknown as { default?: typeof mod }).default ?? mod;
      const url = await toDataURL.toDataURL(uri, { margin: 1, width: 320, errorCorrectionLevel: "M" });
      if (!cancelled) setDataUrl(url);
    });
    return () => {
      cancelled = true;
    };
  }, [uri]);

  return (
    <figure className={cn("rounded-lg border border-border bg-surface-strong p-4", className)}>
      <figcaption className="flex items-center gap-2 text-label uppercase text-foreground-subtle">
        <QrCode className="size-3.5" aria-hidden="true" />
        Test QR · synthetic reference
      </figcaption>
      <div className="mt-3 flex items-center gap-4">
        <div className="flex size-28 shrink-0 items-center justify-center rounded-md border border-border bg-background-elevated">
          {dataUrl ? (
            <img src={dataUrl} alt={`QR code encoding ${uri}`} className="size-24" />
          ) : (
            <span className="text-metadata text-foreground-subtle">…</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-body-sm text-foreground-muted">
            Open this page on a second screen and scan it with the phone running Pramaan to exercise
            the real decoder.
          </p>
          <p className="mt-1.5 truncate font-display text-credential tracking-wide text-foreground">{uri}</p>
        </div>
      </div>
    </figure>
  );
}
