import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/app/safety")({
  head: () => ({
    meta: [
      { title: "Safety tools - Pramaan" },
      {
        name: "description",
        content: "Pramaan safety assistance and nearby police tools.",
      },
      { property: "og:title", content: "Safety tools - Pramaan" },
      { property: "og:description", content: "Pramaan safety assistance and nearby police tools." },
    ],
  }),
  component: () => <Outlet />,
});
