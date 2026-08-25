import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, MapPin, Phone, RefreshCw } from "lucide-react";
import { useState } from "react";

import { StateView } from "@/components/product/state-view";
import { Skeleton } from "@/components/ui/skeleton";
import { getNearbyPoliceStations, requestLocation } from "@/features/safety/safety-service";
import type { LocationResult, StationSearchOutcome } from "@/features/safety/types";

export const Route = createFileRoute("/app/safety/police")({ component: PolicePage });

function PolicePage() {
  const [location, setLocation] = useState<LocationResult | null>(null);
  const [outcome, setOutcome] = useState<StationSearchOutcome>("found");
  const [requesting, setRequesting] = useState(false);
  const stations = useQuery({
    queryKey: ["safety", "stations", outcome],
    queryFn: () => getNearbyPoliceStations({ outcome }),
    enabled: location?.state === "available",
    retry: false,
  });

  async function locate(state: "available" | "denied" | "unavailable" = "available") {
    setRequesting(true);
    try {
      setLocation(await requestLocation({ state }));
    } finally {
      setRequesting(false);
    }
  }

  if (!location) {
    return (
      <div className="mx-auto max-w-xl">
        <header><p className="text-label uppercase text-foreground-subtle">Nearby police</p><h1 className="mt-2 font-display text-page-title text-foreground">Find a station near you</h1><p className="mt-2 text-body text-foreground-muted">This demo uses a synthetic location and station directory. It does not access police operational systems.</p></header>
        <section className="mt-8 rounded-lg border border-border bg-surface-strong p-5 shadow-elev-1"><MapPin className="size-6 text-info" aria-hidden="true" /><h2 className="mt-4 font-display text-section-title text-foreground">Location permission</h2><p className="mt-2 text-body-sm text-foreground-muted">Allow a location check to sort the synthetic stations by distance. You can cancel or try again at any time.</p><button type="button" onClick={() => void locate()} disabled={requesting} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-body-sm font-semibold text-accent-foreground hover:bg-accent-strong disabled:opacity-50">{requesting ? "Requesting location..." : "Allow demo location"}</button><div className="mt-5 flex flex-wrap gap-3 border-t border-border pt-4"><button type="button" onClick={() => void locate("denied")} disabled={requesting} className="text-body-sm text-foreground-muted underline underline-offset-4">Try denied</button><button type="button" onClick={() => void locate("unavailable")} disabled={requesting} className="text-body-sm text-foreground-muted underline underline-offset-4">Try unavailable</button></div></section>
      </div>
    );
  }

  if (location.state !== "available") {
    return <StateView className="mx-auto max-w-xl" icon={MapPin} title={location.state === "denied" ? "Location permission denied" : "Location unavailable"} body={location.detail} action={<button type="button" onClick={() => { setLocation(null); setOutcome("found"); }} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-surface-strong px-4 text-body-sm font-medium text-foreground hover:bg-muted"><RefreshCw className="size-4" aria-hidden="true" /> Try again</button>} />;
  }

  return (
    <div className="max-w-4xl">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-label uppercase text-foreground-subtle">Nearby police</p><h1 className="mt-2 font-display text-page-title text-foreground">Stations near this demo location</h1><p className="mt-2 text-body text-foreground-muted">{location.detail}</p></div><button type="button" onClick={() => setLocation(null)} className="inline-flex min-h-11 items-center gap-2 rounded-md border border-border-strong bg-surface-strong px-4 text-body-sm font-medium text-foreground hover:bg-muted"><MapPin className="size-4" aria-hidden="true" /> Change location</button></header>
      <div className="mt-6 flex flex-wrap gap-2" aria-label="Demo station outcomes"><span className="mr-1 self-center text-metadata text-foreground-subtle">Demo data:</span>{(["found", "empty", "failure"] as const).map((option) => <button key={option} type="button" onClick={() => setOutcome(option)} className={`min-h-10 rounded-md border px-3 text-body-sm ${outcome === option ? "border-accent bg-accent-soft text-accent-soft-foreground" : "border-border bg-surface-strong text-foreground-muted hover:bg-muted"}`}>{option === "found" ? "Stations found" : option === "empty" ? "No stations" : "Service failure"}</button>)}</div>
      {stations.isPending && <div className="mt-6 space-y-3" aria-label="Loading stations"><Skeleton className="h-32 w-full rounded-lg" /><Skeleton className="h-32 w-full rounded-lg" /></div>}
      {stations.isError && <StateView className="mt-6" icon={RefreshCw} title="Station directory unavailable" body="The synthetic directory could not be reached. Try the demo request again." action={<button type="button" onClick={() => void stations.refetch()} className="inline-flex min-h-11 items-center rounded-md border border-border-strong px-4 text-body-sm font-medium hover:bg-muted">Retry</button>} />}
      {stations.data?.length === 0 && <StateView className="mt-6" icon={MapPin} title="No stations found" body="No synthetic stations were returned for this demo location. This does not mean there are no real stations nearby." />}
      {stations.data && stations.data.length > 0 && <ul className="mt-6 grid gap-3 md:grid-cols-2">{stations.data.map((station, index) => <li key={station.id} className={`border bg-surface-strong p-4 shadow-elev-1 ${index === 0 ? "border-accent/45 md:col-span-2 md:p-5" : "border-border"}`}><div className="flex items-start justify-between gap-4"><div><p className="text-label uppercase text-foreground-subtle">{index === 0 ? "Closest station" : "Synthetic station"}</p><h2 className="mt-1 font-display text-card-title text-foreground">{station.name}</h2></div><p className="shrink-0 font-display text-section-title text-accent">{station.distanceKm.toFixed(1)} <span className="text-body-sm font-sans text-foreground-muted">km</span></p></div><p className="mt-3 text-body-sm text-foreground-muted">{station.address}</p><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3"><span className="text-metadata text-foreground-subtle">{station.hours}</span><Link to="/app/safety/police/$id" params={{ id: station.id }} className="inline-flex min-h-10 items-center gap-2 text-body-sm font-semibold text-foreground hover:text-accent">View station <ArrowRight className="size-4" aria-hidden="true" /></Link></div></li>)}</ul>}
    </div>
  );
}
