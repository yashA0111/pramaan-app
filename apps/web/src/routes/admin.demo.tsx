import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, FileImage, KeyRound, RefreshCw, ShieldCheck, Upload, UserPlus } from "lucide-react";

import { API_BASE_URL } from "@/lib/api/client";

export const Route = createFileRoute("/admin/demo")({
  head: () => ({
    meta: [
      { title: "Demo Admin — Pramaan" },
      {
        name: "description",
        content: "Create and manage synthetic Pramaan credentials for demos.",
      },
    ],
  }),
  component: DemoAdminPage,
});

type CredentialStatus = "valid" | "invalid" | "expired" | "revoked";

type Official = {
  id: string;
  userId: string;
  displayName: string;
  registeredEmail: string;
  designation: string;
  department: string;
  postingLocation: string;
  employeeReference?: string;
  officialStatus: string;
  credential?: {
    id: string;
    reference: string;
    status: CredentialStatus;
    photoUrl?: string;
    issuedAt: string;
    expiresAt: string;
  } | null;
};

const ADMIN_HEADERS = {
  "x-user-id": "usr_admin_001",
  "x-demo-role": "demo_admin",
  "x-user-email": "admin@pramaan.dev",
  "x-user-name": "Pramaan Demo Admin",
};

function DemoAdminPage() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const [uploading, setUploading] = useState<"portrait" | "qr" | "reference_face" | null>(null);

  const [form, setForm] = useState({
    displayName: "",
    registeredEmail: "",
    designation: "",
    department: "",
    postingLocation: "",
    credentialReference: "PRM-DEMO-0010",
    employeeReference: "",
  });

  async function loadOfficials() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/admin/demo/officials`, {
        headers: ADMIN_HEADERS,
      });
      if (!response.ok) throw new Error(await readError(response));
      const data = (await response.json()) as Official[];
      setOfficials(data);
      if (data.length && !selectedId) setSelectedId(data[0].id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load demo officials");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOfficials();
  }, []);

  async function createOfficial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/admin/demo/officials`, {
        method: "POST",
        headers: { ...ADMIN_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error(await readError(response));
      const created = (await response.json()) as Official;
      setMessage(`Created ${created.displayName} with ${created.credential?.reference}.`);
      setSelectedId(created.id);
      setForm((current) => ({ ...current, displayName: "", registeredEmail: "" }));
      await loadOfficials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create demo official");
    } finally {
      setCreating(false);
    }
  }

  async function updateStatus(id: string, status: CredentialStatus) {
    setMessage("");
    setError("");
    try {
      const response = await fetch(`${API_BASE_URL}/admin/demo/officials/${id}/status`, {
        method: "PATCH",
        headers: { ...ADMIN_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason: `Updated from Demo Admin UI` }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setMessage(`Credential status changed to ${status}.`);
      await loadOfficials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update credential status");
    }
  }

  async function uploadAsset(id: string, assetType: "portrait" | "qr" | "reference_face", event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(assetType);
    setMessage("");
    setError("");

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("assetType", assetType);

      const response = await fetch(`${API_BASE_URL}/admin/demo/officials/${id}/assets`, {
        method: "POST",
        headers: ADMIN_HEADERS,
        body,
      });
      if (!response.ok) throw new Error(await readError(response));
      setMessage(`${assetType.replace("_", " ")} uploaded successfully.`);
      await loadOfficials();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not upload asset");
    } finally {
      setUploading(null);
    }
  }

  const selected = officials.find((official) => official.id === selectedId) ?? null;

  return (
    <div className="min-h-screen bg-background px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-5 border-b border-border pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-label uppercase text-foreground-subtle">Pramaan · internal demo tooling</p>
            <h1 className="mt-2 font-display text-page-title text-foreground">Demo Admin</h1>
            <p className="mt-2 max-w-2xl text-body text-foreground-muted">
              Create synthetic officials and manage the credential assets used by the public verification demo.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-metadata text-foreground-muted">
            <ShieldCheck className="size-4 text-success" aria-hidden="true" />
            Demo admin session
          </div>
        </header>

        {(message || error) && (
          <div className={`mt-5 rounded-lg border px-4 py-3 text-body-sm ${error ? "border-danger/30 bg-danger-soft text-danger-soft-foreground" : "border-success/30 bg-success-soft text-success-soft-foreground"}`}>
            <div className="flex items-center gap-2">
              {error ? <span className="font-semibold">Error</span> : <CheckCircle2 className="size-4" aria-hidden="true" />}
              <span>{error || message}</span>
            </div>
          </div>
        )}

        <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          <section className="rounded-xl border border-border bg-surface-strong p-5 shadow-elev-1">
            <div className="flex items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-lg bg-accent-soft text-accent-soft-foreground">
                <UserPlus className="size-5" aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-card-title text-foreground">Create synthetic official</h2>
                <p className="text-metadata text-foreground-subtle">Creates User + Official + Credential in PostgreSQL.</p>
              </div>
            </div>

            <form onSubmit={createOfficial} className="mt-6 space-y-4">
              <Field label="Display name" value={form.displayName} onChange={(value) => setForm({ ...form, displayName: value })} placeholder="Deepak Sharma" required />
              <Field label="Registered email" type="email" value={form.registeredEmail} onChange={(value) => setForm({ ...form, registeredEmail: value })} placeholder="deepak.sharma@example.com" required />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Designation" value={form.designation} onChange={(value) => setForm({ ...form, designation: value })} placeholder="Inspector" required />
                <Field label="Department" value={form.department} onChange={(value) => setForm({ ...form, department: value })} placeholder="Anti-Corruption Branch" required />
              </div>
              <Field label="Posting location" value={form.postingLocation} onChange={(value) => setForm({ ...form, postingLocation: value })} placeholder="HQ Unit VIII, New Delhi" required />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Credential reference" value={form.credentialReference} onChange={(value) => setForm({ ...form, credentialReference: value.toUpperCase() })} placeholder="PRM-DEMO-0010" required />
                <Field label="Employee reference" value={form.employeeReference} onChange={(value) => setForm({ ...form, employeeReference: value })} placeholder="EMP-DP-99881" />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 text-body-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
              >
                <KeyRound className="size-4" aria-hidden="true" />
                {creating ? "Creating…" : "Create credential"}
              </button>
            </form>
          </section>

          <section className="rounded-xl border border-border bg-surface-strong p-5 shadow-elev-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-label uppercase text-foreground-subtle">Registry</p>
                <h2 className="mt-1 font-display text-card-title text-foreground">Demo officials</h2>
              </div>
              <button
                type="button"
                onClick={() => void loadOfficials()}
                className="inline-flex size-10 items-center justify-center rounded-md border border-border bg-surface text-foreground-muted hover:bg-muted"
                aria-label="Refresh officials"
                title="Refresh officials"
              >
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
              </button>
            </div>

            <div className="mt-5 space-y-2">
              {loading && <p className="py-6 text-center text-body-sm text-foreground-muted">Loading demo registry…</p>}
              {!loading && officials.length === 0 && <p className="rounded-lg border border-dashed border-border-strong px-4 py-8 text-center text-body-sm text-foreground-muted">No demo officials yet.</p>}
              {!loading && officials.map((official) => (
                <button
                  key={official.id}
                  type="button"
                  onClick={() => setSelectedId(official.id)}
                  className={`w-full rounded-lg border p-4 text-left transition-colors ${selectedId === official.id ? "border-accent bg-accent-soft/40" : "border-border bg-surface hover:bg-muted"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display text-body-sm font-semibold text-foreground">{official.displayName}</p>
                      <p className="mt-1 text-metadata text-foreground-muted">{official.designation} · {official.department}</p>
                    </div>
                    <Status status={official.credential?.status ?? "invalid"} />
                  </div>
                  <p className="mt-2 font-mono text-[11px] tracking-wide text-foreground-subtle">{official.credential?.reference ?? "No credential"}</p>
                </button>
              ))}
            </div>
          </section>
        </div>

        {selected && (
          <section className="mt-7 rounded-xl border border-border bg-surface-strong p-5 shadow-elev-1">
            <div className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-label uppercase text-foreground-subtle">Selected credential</p>
                <h2 className="mt-1 font-display text-section-title text-foreground">{selected.displayName}</h2>
                <p className="mt-1 text-body-sm text-foreground-muted">{selected.designation} · {selected.department} · {selected.postingLocation}</p>
                <p className="mt-2 font-mono text-xs text-foreground-subtle">{selected.credential?.reference}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["valid", "invalid", "expired", "revoked"] as CredentialStatus[]).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => void updateStatus(selected.id, status)}
                    className={`rounded-md border px-3 py-2 text-metadata font-semibold capitalize transition-colors ${selected.credential?.status === status ? "border-accent bg-accent text-accent-foreground" : "border-border bg-surface text-foreground-muted hover:bg-muted"}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <UploadCard label="Portrait" description="Credential photo" icon={<FileImage className="size-5" />} disabled={uploading !== null} loading={uploading === "portrait"} onChange={(event) => void uploadAsset(selected.id, "portrait", event)} />
              <UploadCard label="QR code" description="Credential QR image" icon={<Upload className="size-5" />} disabled={uploading !== null} loading={uploading === "qr"} onChange={(event) => void uploadAsset(selected.id, "qr", event)} />
              <UploadCard label="Reference face" description="Protected biometric asset" icon={<ShieldCheck className="size-5" />} disabled={uploading !== null} loading={uploading === "reference_face"} onChange={(event) => void uploadAsset(selected.id, "reference_face", event)} />
            </div>

            <p className="mt-5 text-metadata text-foreground-subtle">
              QR uploads are checked against the credential reference by the backend. Reference-face assets remain protected from the public asset route.
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", required = false }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-label uppercase text-foreground-subtle">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full rounded-md border border-border bg-background px-3.5 text-body-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}

function Status({ status }: { status: CredentialStatus }) {
  const tone = {
    valid: "bg-success-soft text-success-soft-foreground border-success/20",
    invalid: "bg-danger-soft text-danger-soft-foreground border-danger/20",
    expired: "bg-warning-soft text-warning-soft-foreground border-warning/20",
    revoked: "bg-danger-soft text-danger-soft-foreground border-danger/20",
  }[status];

  return <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>{status}</span>;
}

function UploadCard({ label, description, icon, disabled, loading, onChange }: { label: string; description: string; icon: React.ReactNode; disabled: boolean; loading: boolean; onChange: (event: ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <label className={`flex cursor-pointer flex-col rounded-lg border border-dashed border-border-strong bg-surface p-4 transition-colors hover:border-accent hover:bg-accent-soft/30 ${disabled ? "pointer-events-none opacity-60" : ""}`}>
      <span className="flex size-10 items-center justify-center rounded-md bg-muted text-foreground-muted">{icon}</span>
      <span className="mt-4 font-display text-body-sm font-semibold text-foreground">{label}</span>
      <span className="mt-1 text-metadata text-foreground-muted">{loading ? "Uploading…" : description}</span>
      <span className="mt-4 text-metadata font-semibold text-accent">Choose file</span>
      <input type="file" accept="image/*" className="sr-only" disabled={disabled} onChange={onChange} />
    </label>
  );
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return Array.isArray(body?.message) ? body.message.join(", ") : body?.message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}
