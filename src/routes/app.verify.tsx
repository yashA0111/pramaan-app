import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/verify")({
  head: () => ({
    meta: [
      { title: "Verify an official — Pramaan" },
      {
        name: "description",
        content: "Scan a government credential QR code and walk the verification pipeline.",
      },
      { property: "og:title", content: "Verify an official — Pramaan" },
      {
        property: "og:description",
        content: "Scan a government credential QR code and walk the verification pipeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <Outlet />,
});
