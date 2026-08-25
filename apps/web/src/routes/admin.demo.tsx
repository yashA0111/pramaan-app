import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  CircleDashed,
  FileImage,
  Fingerprint,
  KeyRound,
  MapPin,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Upload,
  UserRound,
  Users,
  X,
} from "lucide-react";

import { API_BASE_URL } from "@/lib/api/client";

export const Route = createFileRoute("/admin/demo")({
  head: () => ({
    meta: [
      { title: "Demo Admin — Pramaan" },
      {
        name: "description",
        content: "Manage synthetic Pramaan officials and credential assets for demonstrations.",
      },
    ],
  }),
  component: DemoAdminPage,
});

type CredentialStatus = "valid" | "invalid" | "expired" | "revoked";
type AssetType = "portrait" | "qr" | "reference_face";

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

const ADMIN_HEADERS: Record<string, string> = {
  "x-user-id": "usr_admin_001",
  "x-demo-role": "demo_admin",
  "x-user-email": "admin@pramaan.dev",
  "x-user-name": "Pramaan Demo Admin",
};

const STATUS_ORDER: CredentialStatus[] = ["valid", "invalid", "expired", "revoked"];

function DemoAdminPage() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<AssetType | null>(null);
  const [notice, setNotice] = useState<{ kind: "success" | "error"; text: string } | null>(null);
  const [formOpen, setFormOpen] = useState(true);
  const [form, setForm] = useState({
    displayName: "",
    registeredEmail: "",
    designation: "",
    department: "",
    postingLocation: "",
    credentialReference: "PRM-DEMO-0010",
    employeeReference: "",
  });

  const selected = useMemo(
    () => officials.find((official) => official.id === selectedId) ?? officials[0] ?? null,
    [officials, selectedId],
  );

  async function loadOfficials({ quiet = false }: { quiet?: boolean } = {}) {
    if (!quiet) setLoading(true);
    if (!quiet) setNotice(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/demo/officials`, {
        headers: ADMIN_HEADERS,
      });
      if (!response.ok) throw new Error(await readError(response));

      const data = (await response.json()) as Official[];
      setOfficials(data);
      setSelectedId((current) => {
        if (data.some((item) => item.id === current)) return current;
        return data[0]?.id ?? "";
      });
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not load demo officials.",
      });
    } finally {
      if (!quiet) setLoading(false);
    }
  }

  useEffect(() => {
    void loadOfficials();
  }, []);

  async function createOfficial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/demo/officials`, {
        method: "POST",
        headers: { ...ADMIN_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error(await readError(response));

      const created = (await response.json()) as Official;
      setNotice({
        kind: "success",
        text: `${created.displayName} was added with credential ${created.credential?.reference ?? "created"}.`,
      });
      setSelectedId(created.id);
      setForm({
        displayName: "",
        registeredEmail: "",
        designation: "",
        department: "",
        postingLocation: "",
        credentialReference: nextCredentialReference(form.credentialReference),
        employeeReference: "",
      });
      await loadOfficials({ quiet: true });
      setFormOpen(false);
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not create the demo official.",
      });
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(id: string, status: CredentialStatus) {
    setNotice(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/demo/officials/${id}/status`, {
        method: "PATCH",
        headers: { ...ADMIN_HEADERS, "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason: "Updated from Pramaan Demo Admin" }),
      });
      if (!response.ok) throw new Error(await readError(response));

      setNotice({ kind: "success", text: `Credential marked ${status}.` });
      await loadOfficials({ quiet: true });
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not update credential status.",
      });
    }
  }

  async function uploadAsset(id: string, assetType: AssetType, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploading(assetType);
    setNotice(null);

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

      const label = assetType === "reference_face" ? "Reference face" : capitalize(assetType);
      setNotice({ kind: "success", text: `${label} uploaded successfully.` });
      await loadOfficials({ quiet: true });
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not upload asset.",
      });
    } finally {
      setUploading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface/85 backdrop-blur">
        <div className="mx-auto max-w-[1400px] px-4 py-4 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <Link
              to="/"
              className="group inline-flex items-center gap-2 text-body-sm font-medium text-foreground-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
              Back to Pramaan
            </Link>

            <div className="flex items-center gap-2 rounded-md border border-border bg-surface-strong px-3 py-2 text-metadata text-foreground-muted">
              <ShieldCheck className="size-4 text-success" aria-hidden="true" />
              Synthetic data only
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-4 pb-16 pt-7 md:px-8 md:pt-9">
        <section className="border-b border-border pb-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-label uppercase text-accent">Pramaan · Demo Operations</p>
              <h1 className="mt-2 font-display text-hero text-foreground">Credential registry</h1>
              <p className="mt-3 max-w-2xl text-body text-foreground-muted">
                Prepare the synthetic identities and evidence assets used in the public verification demonstration.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="border border-border bg-surface-strong px-4 py-3">
                <p className="text-label uppercase text-foreground-subtle">Records</p>
                <p className="mt-1 font-display text-section-title text-foreground">{officials.length}</p>
              </div>
              <button
                type="button"
                onClick={() => void loadOfficials()}
                className="inline-flex min-h-11 items-center gap-2 border border-border bg-surface-strong px-4 text-body-sm font-medium text-foreground transition-colors hover:bg-muted"
              >
                <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
                Refresh
              </button>
            </div>
          </div>
        </section>

        {notice && (
          <div
            role="status"
            className={`mt-5 flex items-start justify-between gap-4 border px-4 py-3 text-body-sm ${
              notice.kind === "success"
                ? "border-success/25 bg-success-soft text-success-soft-foreground"
                : "border-danger/25 bg-danger-soft text-danger-soft-foreground"
            }`}
          >
            <div className="flex min-w-0 items-start gap-2.5">
              {notice.kind === "success" ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              ) : (
                <X className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              )}
              <span>{notice.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setNotice(null)}
              className="shrink-0 rounded p-0.5 opacity-70 transition-opacity hover:opacity-100"
              aria-label="Dismiss notification"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}

        <div className="mt-7 grid gap-6 xl:grid-cols-[minmax(320px,0.82fr)_minmax(520px,1.18fr)]">
          <section className="border border-border bg-surface-strong shadow-elev-1">
            <div className="flex items-center justify-between border-b border-border px-5 py-4 md:px-6">
              <div>
                <p className="text-label uppercase text-foreground-subtle">Registry</p>
                <h2 className="mt-1 font-display text-section-title text-foreground">Synthetic officials</h2>
              </div>
              <span className="font-display text-metadata text-foreground-subtle">
                {officials.length.toString().padStart(2, "0")}
              </span>
            </div>

            <div className="max-h-[680px] overflow-y-auto p-2">
              {loading && (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((item) => (
                    <div key={item} className="h-24 animate-pulse border border-border bg-surface" />
                  ))}
                </div>
              )}

              {!loading && officials.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <Users className="mx-auto size-8 text-foreground-subtle" aria-hidden="true" />
                  <h3 className="mt-4 font-display text-card-title text-foreground">Registry is empty</h3>
                  <p className="mx-auto mt-2 max-w-xs text-body-sm text-foreground-muted">
                    Create the first synthetic official to begin a verification scenario.
                  </p>
                  <button
                    type="button"
                    onClick={() => setFormOpen(true)}
                    className="mt-5 inline-flex min-h-10 items-center gap-2 border border-border bg-surface px-4 text-body-sm font-semibold text-foreground hover:bg-muted"
                  >
                    <Plus className="size-4" aria-hidden="true" />
                    Add official
                  </button>
                </div>
              )}

              {!loading && officials.length > 0 && (
                <div className="space-y-1">
                  {officials.map((official) => (
                    <button
                      key={official.id}
                      type="button"
                      onClick={() => setSelectedId(official.id)}
                      className={`group w-full border p-4 text-left transition-all ${
                        selected?.id === official.id
                          ? "border-accent bg-accent-soft/35 shadow-elev-1"
                          : "border-transparent bg-surface hover:border-border hover:bg-muted/70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={official.displayName} photoUrl={official.credential?.photoUrl} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-display text-body-sm font-semibold text-foreground">
                              {official.displayName}
                            </p>
                            {official.credential && <Status status={official.credential.status} compact />}
                          </div>
                          <p className="mt-1 truncate text-metadata text-foreground-muted">
                            {official.designation} · {official.department}
                          </p>
                          <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-foreground-subtle">
                            {official.credential?.reference ?? "NO CREDENTIAL"}
                          </p>
                        </div>
                        <ChevronRight
                          className={`size-4 shrink-0 transition-transform ${
                            selected?.id === official.id
                              ? "translate-x-0 text-accent"
                              : "text-foreground-subtle group-hover:translate-x-0.5"
                          }`}
                          aria-hidden="true"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="border border-border bg-surface-strong shadow-elev-1">
            {selected ? (
              <CredentialWorkspace
                official={selected}
                uploading={uploading}
                onStatusChange={(status) => void updateStatus(selected.id, status)}
                onUpload={(assetType, event) => void uploadAsset(selected.id, assetType, event)}
                onAddNew={() => setFormOpen(true)}
              />
            ) : (
              <EmptyWorkspace onAddNew={() => setFormOpen(true)} />
            )}
          </section>
        </div>

        <section className="mt-6 border border-border bg-background">
          <button
            type="button"
            onClick={() => setFormOpen((open) => !open)}
            className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left md:px-6"
            aria-expanded={formOpen}
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 items-center justify-center border border-accent/25 bg-accent-soft text-accent-soft-foreground">
                <Plus className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-label uppercase text-foreground-subtle">Creation</p>
                <h2 className="mt-0.5 font-display text-card-title text-foreground">Create a new synthetic credential</h2>
              </div>
            </div>
            <span className="text-metadata font-semibold text-accent">{formOpen ? "Hide" : "Open"}</span>
          </button>

          {formOpen && (
            <form onSubmit={createOfficial} className="grid gap-6 border-t border-border px-5 py-6 md:grid-cols-2 md:px-6 xl:grid-cols-3">
              <div className="xl:col-span-2">
                <p className="max-w-2xl text-body-sm text-foreground-muted">
                  This creates the User, Official, and Credential records together. Use clearly synthetic identities for demos.
                </p>
              </div>
              <div className="hidden xl:block" />

              <Field label="Display name" value={form.displayName} onChange={(value) => setForm({ ...form, displayName: value })} placeholder="Deepak Sharma" required />
              <Field label="Registered email" type="email" value={form.registeredEmail} onChange={(value) => setForm({ ...form, registeredEmail: value })} placeholder="deepak.sharma@example.com" required />
              <Field label="Designation" value={form.designation} onChange={(value) => setForm({ ...form, designation: value })} placeholder="Inspector" required />
              <Field label="Department" value={form.department} onChange={(value) => setForm({ ...form, department: value })} placeholder="Anti-Corruption Branch" required />
              <Field label="Posting location" value={form.postingLocation} onChange={(value) => setForm({ ...form, postingLocation: value })} placeholder="HQ Unit VIII, New Delhi" required />
              <Field label="Employee reference" value={form.employeeReference} onChange={(value) => setForm({ ...form, employeeReference: value })} placeholder="EMP-DEMO-99881" />
              <Field label="Credential reference" value={form.credentialReference} onChange={(value) => setForm({ ...form, credentialReference: value.toUpperCase() })} placeholder="PRM-DEMO-0010" required />

              <div className="flex items-end xl:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex min-h-12 w-full items-center justify-center gap-2 bg-accent px-5 text-body-sm font-semibold text-accent-foreground transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <KeyRound className="size-4" aria-hidden="true" />
                  {saving ? "Creating credential…" : "Create credential"}
                </button>
              </div>
            </form>
          )}
        </section>
      </main>
    </div>
  );
}

function CredentialWorkspace({
  official,
  uploading,
  onStatusChange,
  onUpload,
  onAddNew,
}: {
  official: Official;
  uploading: AssetType | null;
  onStatusChange: (status: CredentialStatus) => void;
  onUpload: (assetType: AssetType, event: ChangeEvent<HTMLInputElement>) => void;
  onAddNew: () => void;
}) {
  const credential = official.credential;

  return (
    <div>
      <div className="border-b border-border px-5 py-5 md:px-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={official.displayName} photoUrl={credential?.photoUrl} large />
            <div className="min-w-0">
              <p className="text-label uppercase text-foreground-subtle">Selected official</p>
              <h2 className="mt-1 truncate font-display text-section-title text-foreground">{official.displayName}</h2>
              <p className="mt-1 text-body-sm text-foreground-muted">
                {official.designation} · {official.department}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex min-h-10 items-center justify-center gap-2 border border-border bg-surface px-3.5 text-body-sm font-semibold text-foreground transition-colors hover:bg-muted"
          >
            <Plus className="size-4" aria-hidden="true" />
            New credential
          </button>
        </div>
      </div>

      <div className="grid border-b border-border md:grid-cols-2">
        <InfoCell label="Credential reference" value={credential?.reference ?? "—"} mono />
        <InfoCell label="Employee reference" value={official.employeeReference ?? "—"} mono />
        <InfoCell label="Posting" value={official.postingLocation} icon={<MapPin className="size-3.5" aria-hidden="true" />} />
        <InfoCell label="Registered email" value={official.registeredEmail} />
      </div>

      <div className="px-5 py-5 md:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-label uppercase text-foreground-subtle">Credential state</p>
            <p className="mt-1 text-body-sm text-foreground-muted">Change the simulated registry status used during verification.</p>
          </div>
          {credential && <Status status={credential.status} />}
        </div>

        {credential && (
          <div className="mt-4 grid gap-2 sm:grid-cols-4">
            {STATUS_ORDER.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => onStatusChange(status)}
                className={`min-h-10 border px-3 text-metadata font-semibold capitalize transition-colors ${
                  credential.status === status
                    ? statusButtonActive(status)
                    : "border-border bg-surface text-foreground-muted hover:bg-muted"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-border px-5 py-5 md:px-6">
        <div>
          <p className="text-label uppercase text-foreground-subtle">Evidence assets</p>
          <h3 className="mt-1 font-display text-card-title text-foreground">Build the demo credential</h3>
          <p className="mt-1 text-body-sm text-foreground-muted">
            Upload the image assets used by the verification flow. The QR association is validated by the backend.
          </p>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <AssetCard
            title="Portrait"
            description="Credential photograph"
            icon={<FileImage className="size-5" aria-hidden="true" />}
            loading={uploading === "portrait"}
            disabled={uploading !== null}
            onChange={(event) => onUpload("portrait", event)}
          />
          <AssetCard
            title="QR code"
            description="Credential QR image"
            icon={<QrCode className="size-5" aria-hidden="true" />}
            loading={uploading === "qr"}
            disabled={uploading !== null}
            onChange={(event) => onUpload("qr", event)}
          />
          <AssetCard
            title="Reference face"
            description="Protected biometric asset"
            icon={<Fingerprint className="size-5" aria-hidden="true" />}
            loading={uploading === "reference_face"}
            disabled={uploading !== null}
            onChange={(event) => onUpload("reference_face", event)}
            protectedAsset
          />
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <DetailCallout
            icon={<CircleDashed className="size-4" />}
            title="Synthetic by design"
            text="This registry is for demonstrations, not real government credentials."
          />
          <DetailCallout
            icon={<ShieldCheck className="size-4" />}
            title="Reference face is protected"
            text="Biometric reference assets are not exposed by the public demo asset endpoint."
          />
        </div>
      </div>
    </div>
  );
}

function EmptyWorkspace({ onAddNew }: { onAddNew: () => void }) {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center">
      <span className="flex size-14 items-center justify-center border border-border bg-surface text-foreground-muted">
        <KeyRound className="size-6" aria-hidden="true" />
      </span>
      <p className="mt-5 text-label uppercase text-foreground-subtle">Credential workspace</p>
      <h2 className="mt-2 font-display text-section-title text-foreground">Select a registry record</h2>
      <p className="mt-2 max-w-sm text-body-sm text-foreground-muted">
        Choose an official on the left to manage status and evidence assets, or create a new synthetic credential below.
      </p>
      <button
        type="button"
        onClick={onAddNew}
        className="mt-6 inline-flex min-h-11 items-center gap-2 bg-accent px-5 text-body-sm font-semibold text-accent-foreground hover:bg-accent-strong"
      >
        <Plus className="size-4" aria-hidden="true" />
        Create credential
      </button>
    </div>
  );
}

function AssetCard({
  title,
  description,
  icon,
  loading,
  disabled,
  onChange,
  protectedAsset = false,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  loading: boolean;
  disabled: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  protectedAsset?: boolean;
}) {
  return (
    <label
      className={`group relative flex min-h-36 cursor-pointer flex-col justify-between border bg-surface p-4 transition-colors ${
        disabled
          ? "cursor-not-allowed opacity-60"
          : "border-border hover:border-border-strong hover:bg-muted/45"
      }`}
    >
      <input type="file" className="sr-only" accept="image/*" disabled={disabled} onChange={onChange} />
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-10 items-center justify-center border border-border bg-surface-strong text-foreground-muted">
          {icon}
        </span>
        {protectedAsset && (
          <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-foreground-subtle">
            Protected
          </span>
        )}
      </div>
      <div>
        <p className="font-display text-body-sm font-semibold text-foreground">
          {loading ? "Uploading…" : title}
        </p>
        <p className="mt-1 text-metadata text-foreground-muted">{description}</p>
        <span className="mt-3 inline-flex items-center gap-1.5 text-metadata font-semibold text-accent">
          <Upload className="size-3.5" aria-hidden="true" />
          Choose file
        </span>
      </div>
    </label>
  );
}

function DetailCallout({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex gap-3 border border-dashed border-border-strong px-4 py-3">
      <span className="mt-0.5 shrink-0 text-foreground-subtle">{icon}</span>
      <div>
        <p className="text-body-sm font-semibold text-foreground">{title}</p>
        <p className="mt-1 text-metadata text-foreground-muted">{text}</p>
      </div>
    </div>
  );
}

function InfoCell({
  label,
  value,
  icon,
  mono = false,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="border-b border-border px-5 py-4 md:border-r md:px-6 even:border-r-0">
      <p className="text-label uppercase text-foreground-subtle">{label}</p>
      <p
        className={`mt-1.5 flex items-center gap-1.5 text-body-sm text-foreground ${
          mono ? "font-mono text-[11px] tracking-[0.06em]" : "font-medium"
        }`}
      >
        {icon}
        <span className="truncate">{value}</span>
      </p>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-label uppercase text-foreground-subtle">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="min-h-11 w-full border border-border bg-surface px-3.5 text-body-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-foreground-subtle focus:border-accent focus:ring-2 focus:ring-accent/15"
      />
    </label>
  );
}

function Avatar({ name, photoUrl, large = false }: { name: string; photoUrl?: string; large?: boolean }) {
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <span
      className={`relative flex shrink-0 items-center justify-center overflow-hidden border border-border bg-surface-muted font-display font-semibold text-foreground-muted ${
        large ? "size-14 text-body" : "size-11 text-body-sm"
      }`}
    >
      {photoUrl ? (
        <img src={photoUrl} alt="" className="size-full object-cover" />
      ) : (
        <>
          <UserRound className="absolute size-4 opacity-15" aria-hidden="true" />
          <span className="relative">{initials}</span>
        </>
      )}
    </span>
  );
}

function Status({ status, compact = false }: { status: CredentialStatus; compact?: boolean }) {
  const tone = {
    valid: "border-success/20 bg-success-soft text-success-soft-foreground",
    invalid: "border-danger/20 bg-danger-soft text-danger-soft-foreground",
    expired: "border-warning/20 bg-warning-soft text-warning-soft-foreground",
    revoked: "border-danger/20 bg-danger-soft text-danger-soft-foreground",
  }[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 border font-semibold capitalize ${
        compact ? "px-2 py-1 text-[10px]" : "px-2.5 py-1.5 text-metadata"
      } ${tone}`}
    >
      <span
        className={`size-1.5 rounded-full ${
          status === "valid" ? "bg-success" : status === "expired" ? "bg-warning" : "bg-danger"
        }`}
      />
      {status}
    </span>
  );
}

function statusButtonActive(status: CredentialStatus): string {
  return {
    valid: "border-success/30 bg-success-soft text-success-soft-foreground",
    invalid: "border-danger/30 bg-danger-soft text-danger-soft-foreground",
    expired: "border-warning/30 bg-warning-soft text-warning-soft-foreground",
    revoked: "border-danger/30 bg-danger-soft text-danger-soft-foreground",
  }[status];
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    if (Array.isArray(body?.message)) return body.message.join(" ");
    if (body?.message) return String(body.message);
  } catch {
    // Fall through to status text.
  }
  return `${response.status} ${response.statusText || "Request failed"}`;
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1).replace("_", " ");
}

function nextCredentialReference(reference: string): string {
  const match = reference.match(/^(PRM-[A-Z0-9]{2,8}-)(\d{4})$/i);
  if (!match) return "PRM-DEMO-0010";
  return `${match[1].toUpperCase()}${String(Number(match[2]) + 1).padStart(4, "0")}`;
}
