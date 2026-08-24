import { createFileRoute } from "@tanstack/react-router";

import { CitizenShell } from "@/components/layout/citizen-shell";

export const Route = createFileRoute("/app")({
  component: CitizenShell,
});
