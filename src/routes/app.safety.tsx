import { createFileRoute } from "@tanstack/react-router";
import { FilePlus2, MapPin, MessageSquareWarning, Siren, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export const Route = createFileRoute("/app/safety")({
  head: () => ({
    meta: [
      { title: "Safety tools — Pramaan" },
      {
        name: "description",
        content: "SOS assistance, nearest police stations, scam detection, and incident reporting.",
      },
      { property: "og:title", content: "Safety tools — Pramaan" },
      {
        property: "og:description",
        content: "SOS assistance, nearest police stations, scam detection, and incident reporting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SafetyHub,
});

interface SafetyTool {
  icon: LucideIcon;
  name: string;
  description: string;
  danger?: boolean;
}

const TOOLS: SafetyTool[] = [
  {
    icon: Siren,
    name: "SOS — Emergency assistance",
    description: "Share your location with emergency contacts. Press-and-hold to activate.",
    danger: true,
  },
  {
    icon: MapPin,
    name: "Nearest police station",
    description: "Locate the closest station, with distance, contact, and directions.",
  },
  {
    icon: MessageSquareWarning,
    name: "Scam detection",
    description: "Paste a suspicious message and get a risk reading with the reasons behind it.",
  },
  {
    icon: FilePlus2,
    name: "Report an incident",
    description: "File a structured report — details, evidence, review, submit.",
  },
];

function SafetyHub() {
  return (
    <div className="max-w-xl">
      <header>
        <h1 className="font-display text-page-title text-foreground">Safety tools</h1>
        <p className="mt-2 text-body text-foreground-muted">
          Verification is one part of feeling safe. These tools cover the rest of the moment.
        </p>
      </header>

      <ul className="mt-7 space-y-3">
        {TOOLS.map((tool) => (
          <li
            key={tool.name}
            aria-disabled="true"
            className={cn(
              "flex items-start gap-4 rounded-lg border bg-surface-strong p-4 shadow-elev-1",
              tool.danger ? "border-danger/30" : "border-border",
            )}
          >
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-md",
                tool.danger ? "bg-danger-soft text-danger" : "bg-muted text-foreground-muted",
              )}
            >
              <tool.icon className="size-5" aria-hidden="true" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-body-sm font-semibold text-foreground">{tool.name}</span>
              <span className="mt-0.5 block text-body-sm text-foreground-muted">
                {tool.description}
              </span>
            </span>
            <span className="shrink-0 rounded-full border border-border bg-surface-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground-subtle">
              Next phase
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
