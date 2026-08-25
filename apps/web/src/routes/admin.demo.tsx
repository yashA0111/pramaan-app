import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  FileImage,
  Fingerprint,
  MapPin,
  Plus,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Upload,
  UserPlus,
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
        content: "Manage synthetic Pramaan officials, credential QR codes, portraits, and biometric reference faces.",
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

type Asset = {
  id: string;
  assetType: AssetType;
  storagePath: string;
  mimeType: string;
  fileSize: number;
  isVerified: boolean;
  encodedReference?: string | null;
  createdAt: string;
};

type OfficialDetails = Official & { assets?: Asset[] };

type FileSelection = {
  file: File;
  previewUrl: string;
};

const ADMIN_HEADERS: Record<string, string> = {
  "x-user-id": "usr_admin_001",
  "x-demo-role": "demo_admin",
  "x-user-email": "admin@pramaan.dev",
  "x-user-name": "Pramaan Demo Admin",
};

function DemoAdminPage() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedDetails, setSelectedDetails] = useState<OfficialDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
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

  const [portrait, setPortrait] = useState<FileSelection | null>(null);
  const [qr, setQr] = useState<FileSelection | null>(null);
  const [referenceFace, setReferenceFace] = useState<FileSelection | null>(null);

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

  async function loadSelectedDetails(id: string) {
    setDetailsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/demo/officials/${id}`, {
        headers: ADMIN_HEADERS,
      });
      if (!response.ok) throw new Error(await readError(response));
      setSelectedDetails((await response.json()) as OfficialDetails);
    } catch (error) {
      setSelectedDetails(null);
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not load credential assets.",
      });
    } finally {
      setDetailsLoading(false);
    }
  }

  useEffect(() => {
    void loadOfficials();
  }, []);

  useEffect(() => {
    if (selectedId) void loadSelectedDetails(selectedId);
    else setSelectedDetails(null);
  }, [selectedId]);

  useEffect(() => {
    return () => {
      [portrait?.previewUrl, qr?.previewUrl, referenceFace?.previewUrl].forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [portrait?.previewUrl, qr?.previewUrl, referenceFace?.previewUrl]);

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
      const files: Array<[AssetType, FileSelection | null]> = [
        ["portrait", portrait],
        ["qr", qr],
        ["reference_face", referenceFace],
      ];

      const failures: string[] = [];
      for (const [assetType, selection] of files) {
        if (!selection) continue;
        try {
          await uploadAssetFile(created.id, assetType, selection.file);
        } catch (error) {
          failures.push(`${labelForAsset(assetType)}: ${error instanceof Error ? error.message : "upload failed"}`);
        }
      }

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
      clearSelection("portrait");
      clearSelection("qr");
      clearSelection("reference_face");
      await loadOfficials({ quiet: true });
      await loadSelectedDetails(created.id);
      setFormOpen(false);

      setNotice({
        kind: failures.length ? "error" : "success",
        text: failures.length
          ? `${created.displayName} was created, but some evidence uploads failed: ${failures.join("; ")}`
          : `${created.displayName} was created with ${files.filter(([, file]) => file).length} evidence asset${files.filter(([, file]) => file).length === 1 ? "" : "s"}.`,
      });
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
      await loadSelectedDetails(id);
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
      await uploadAssetFile(id, assetType, file);
      setNotice({ kind: "success", text: `${labelForAsset(assetType)} uploaded successfully.` });
      await loadOfficials({ quiet: true });
      await loadSelectedDetails(id);
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Could not upload asset.",
      });
    } finally {
      setUploading(null);
    }
  }

  async function uploadAssetFile(id: string, assetType: AssetType, file: File) {
    const body = new FormData();
    body.append("file", file);
    body.append("assetType", assetType);

    const response = await fetch(`${API_BASE_URL}/admin/demo/officials/${id}/assets`, {
      method: "POST",
      headers: ADMIN_HEADERS,
      body,
    });
    if (!response.ok) throw new Error(await readError(response));
  }

  function selectFile(assetType: AssetType, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const selection = { file, previewUrl: URL.createObjectURL(file) };
    if (assetType === "portrait") {
      if (portrait) URL.revokeObjectURL(portrait.previewUrl);
      setPortrait(selection);
    } else if (assetType === "qr") {
      if (qr) URL.revokeObjectURL(qr.previewUrl);
      setQr(selection);
    } else {
      if (referenceFace) URL.revokeObjectURL(referenceFace.previewUrl);
      setReferenceFace(selection);
    }
  }

  function clearSelection(assetType: AssetType) {
    if (assetType === "portrait") {
      if (portrait) URL.revokeObjectURL(portrait.previewUrl);
      setPortrait(null);
    } else if (assetType === "qr") {
      if (qr) URL.revokeObjectURL(qr.previewUrl);
      setQr(null);
    } else {
      if (referenceFace) URL.revokeObjectURL(referenceFace.previewUrl);
      setReferenceFace(null);
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
                Prepare the synthetic identity, credential QR, portrait, and biometric reference used in the verification demonstration.
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
            <button type="button" onClick={() => setNotice(null)} className="shrink-0 rounded p-0.5 opacity-70 hover:opacity-100" aria-label="Dismiss notification">
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
              <span className="font-display text-metadata text-foreground-subtle">{officials.length.toString().padStart(2, "0")}</span>
            </div>

            <div className="max-h-[680px] overflow-y-auto p-2">
              {loading && (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map((item) => <div key={item} className="h-24 animate-pulse border border-border bg-surface" />)}
                </div>
              )}

              {!loading && officials.length === 0 && (
                <div className="px-6 py-16 text-center">
                  <Users className="mx-auto size-8 text-foreground-subtle" aria-hidden="true" />
                  <h3 className="mt-4 font-display text-card-title text-foreground">Registry is empty</h3>
                  <p className="mx-auto mt-2 max-w-xs text-body-sm text-foreground-muted">Create the first synthetic official to begin a verification scenario.</p>
                  <button type="button" onClick={() => setFormOpen(true)} className="mt-5 inline-flex min-h-10 items-center gap-2 border border-border bg-surface px-4 text-body-sm font-semibold text-foreground hover:bg-muted">
                    <Plus className="size-4" aria-hidden="true" /> Add official
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
                        selected?.id === official.id ? "border-accent bg-accent-soft/35 shadow-elev-1" : "border-transparent bg-surface hover:border-border hover:bg-muted/70"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={official.displayName} photoUrl={official.credential?.photoUrl} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="truncate font-display text-body-sm font-semibold text-foreground">{official.displayName}</p>
                            {official.credential && <Status status={official.credential.status} />}
                          </div>
                          <p className="mt-1 truncate text-metadata text-foreground-muted">{official.designation} · {official.department}</p>
                          <p className="mt-1 font-mono text-[10px] tracking-[0.08em] text-foreground-subtle">{official.credential?.reference ?? "NO CREDENTIAL"}</p>
                        </div>
                        <ChevronRight className={`size-4 shrink-0 ${selected?.id === official.id ? "text-accent" : "text-foreground-subtle group-hover:translate-x-0.5"}`} aria-hidden="true" />
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
                details={selectedDetails}
                detailsLoading={detailsLoading}
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
              <span className="flex size-9 items-center justify-center border border-accent/25 bg-accent-soft text-accent-soft-foreground"><Plus className="size-4" aria-hidden="true" /></span>
              <div>
                <p className="text-label uppercase text-foreground-subtle">Creation</p>
                <h2 className="mt-0.5 font-display text-card-title text-foreground">Create a complete demo credential</h2>
              </div>
            </div>
            <ChevronRight className={`size-4 text-foreground-subtle transition-transform ${formOpen ? "rotate-90" : ""}`} aria-hidden="true" />
          </button>

          {formOpen && (
            <form onSubmit={createOfficial} className="border-t border-border px-5 py-6 md:px-6 md:py-7">
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,0.9fr)]">
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Display name" value={form.displayName} onChange={(value) => setForm({ ...form, displayName: value })} placeholder="Deepak Sharma" required />
                    <Field label="Registered email" type="email" value={form.registeredEmail} onChange={(value) => setForm({ ...form, registeredEmail: value })} placeholder="deepak.sharma@example.com" required />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Designation" value={form.designation} onChange={(value) => setForm({ ...form, designation: value })} placeholder="Inspector" required />
                    <Field label="Department" value={form.department} onChange={(value) => setForm({ ...form, department: value })} placeholder="Traffic Management Division" required />
                  </div>
                  <Field label="Posting location" value={form.postingLocation} onChange={(value) => setForm({ ...form, postingLocation: value })} placeholder="District Unit VII, New Delhi" required />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Credential reference" value={form.credentialReference} onChange={(value) => setForm({ ...form, credentialReference: value.toUpperCase() })} placeholder="PRM-DEMO-0010" required />
                    <Field label="Employee reference" value={form.employeeReference} onChange={(value) => setForm({ ...form, employeeReference: value })} placeholder="EMP-DP-99881" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-label uppercase text-foreground-subtle">Evidence assets</p>
                      <h3 className="mt-1 font-display text-card-title text-foreground">Add everything now</h3>
                    </div>
                    <span className="font-mono text-[10px] text-foreground-subtle">OPTIONAL</span>
                  </div>
                  <p className="mt-2 text-body-sm text-foreground-muted">The credential is created first, then the selected files are attached automatically.</p>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <CreateAssetPicker icon={<FileImage className="size-5" />} label="Portrait" description="Visible credential photo" selection={portrait} onSelect={(event) => selectFile("portrait", event)} onClear={() => clearSelection("portrait")} />
                    <CreateAssetPicker icon={<QrCode className="size-5" />} label="QR code" description="Pramaan verification QR" selection={qr} onSelect={(event) => selectFile("qr", event)} onClear={() => clearSelection("qr")} />
                    <CreateAssetPicker icon={<Fingerprint className="size-5" />} label="Reference face" description="Biometric comparison reference" selection={referenceFace} onSelect={(event) => selectFile("reference_face", event)} onClear={() => clearSelection("reference_face")} />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="max-w-2xl text-metadata text-foreground-subtle">Reference-face files are protected biometric assets. They are stored for the identity verification adapter and are not served by the public asset route.</p>
                <button type="submit" disabled={saving} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-accent px-5 text-body-sm font-semibold text-accent-foreground hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60">
                  <UserPlus className="size-4" aria-hidden="true" />
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
  details,
  detailsLoading,
  uploading,
  onStatusChange,
  onUpload,
  onAddNew,
}: {
  official: Official;
  details: OfficialDetails | null;
  detailsLoading: boolean;
  uploading: AssetType | null;
  onStatusChange: (status: CredentialStatus) => void;
  onUpload: (assetType: AssetType, event: ChangeEvent<HTMLInputElement>) => void;
  onAddNew: () => void;
}) {
  const credential = official.credential;
  const portraitAsset = details?.assets?.find((asset) => asset.assetType === "portrait");
  const qrAsset = details?.assets?.find((asset) => asset.assetType === "qr");
  const referenceAsset = details?.assets?.find((asset) => asset.assetType === "reference_face");

  return (
    <div>
      <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-5 md:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={official.displayName} photoUrl={credential?.photoUrl} large />
          <div className="min-w-0">
            <p className="text-label uppercase text-foreground-subtle">Selected official</p>
            <h2 className="mt-1 truncate font-display text-section-title text-foreground">{official.displayName}</h2>
            <p className="mt-1 truncate text-body-sm text-foreground-muted">{official.designation} · {official.department}</p>
          </div>
        </div>
        <button type="button" onClick={onAddNew} className="inline-flex min-h-10 items-center gap-2 border border-border bg-surface px-3.5 text-body-sm font-semibold text-foreground hover:bg-muted">
          <Plus className="size-4" aria-hidden="true" /> New credential
        </button>
      </div>

      {credential ? (
        <>
          <div className="grid sm:grid-cols-2">
            <InfoCell label="Credential reference" value={credential.reference} mono />
            <InfoCell label="Employee reference" value={official.employeeReference ?? "—"} mono />
            <InfoCell label="Posting" value={official.postingLocation} icon={<MapPin className="size-4" />} />
            <InfoCell label="Registered email" value={official.registeredEmail} />
          </div>

          <div className="border-t border-border p-5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-label uppercase text-foreground-subtle">Credential state</p>
                <p className="mt-1 text-body-sm text-foreground-muted">Change the simulated registry status used during verification.</p>
              </div>
              <Status status={credential.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["valid", "invalid", "expired", "revoked"] as CredentialStatus[]).map((status) => (
                <button key={status} type="button" onClick={() => onStatusChange(status)} className={`min-h-10 border px-3 text-metadata font-semibold capitalize transition-colors ${credential.status === status ? "border-accent bg-accent-soft text-accent-soft-foreground" : "border-border bg-surface text-foreground-muted hover:bg-muted"}`}>
                  {status}
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-border p-5 md:p-6">
            <div>
              <p className="text-label uppercase text-foreground-subtle">Evidence assets</p>
              <h3 className="mt-1 font-display text-card-title text-foreground">Credential evidence</h3>
              <p className="mt-1 text-body-sm text-foreground-muted">Portrait and QR are visible evidence. Reference face is the protected biometric input.</p>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-3">
              <ExistingAsset
                title="Portrait"
                icon={<FileImage className="size-5" />}
                asset={portraitAsset}
                imageUrl={portraitAsset ? publicAssetUrl(portraitAsset.storagePath) : credential.photoUrl}
                onUpload={(event) => onUpload("portrait", event)}
                uploading={uploading === "portrait"}
              />
              <ExistingAsset
                title="QR code"
                icon={<QrCode className="size-5" />}
                asset={qrAsset}
                imageUrl={qrAsset ? publicAssetUrl(qrAsset.storagePath) : null}
                onUpload={(event) => onUpload("qr", event)}
                uploading={uploading === "qr"}
                contain
              />
              <ProtectedAsset
                title="Reference face"
                icon={<Fingerprint className="size-5" />}
                asset={referenceAsset}
                onUpload={(event) => onUpload("reference_face", event)}
                uploading={uploading === "reference_face"}
              />
            </div>

            {detailsLoading && <p className="mt-4 text-metadata text-foreground-subtle">Refreshing evidence assets…</p>}
          </div>
        </>
      ) : (
        <EmptyCredentialBody />
      )}
    </div>
  );
}

function ExistingAsset({
  title,
  icon,
  asset,
  imageUrl,
  onUpload,
  uploading,
  contain = false,
}: {
  title: string;
  icon: ReactNode;
  asset?: Asset;
  imageUrl?: string | null;
  onUpload: (event: ChangeEvent<HTMLInputElement>) => void;
  uploading: boolean;
  contain?: boolean;
}) {
  return (
    <label className="group block cursor-pointer border border-border bg-surface p-3 transition-colors hover:border-border-strong">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-body-sm font-semibold text-foreground">{icon}{title}</span>
        <Upload className="size-4 text-foreground-subtle group-hover:text-accent" aria-hidden="true" />
      </div>
      <div className="mt-3 aspect-[4/3] overflow-hidden border border-border bg-background">
        {imageUrl ? (
          <img src={imageUrl} alt={`${title} evidence`} className={`h-full w-full ${contain ? "object-contain p-4" : "object-cover"}`} onError={(event) => { event.currentTarget.style.display = "none"; }} />
        ) : (
          <div className="flex h-full items-center justify-center text-foreground-subtle">{icon}</div>
        )}
      </div>
      <p className="mt-2 text-metadata text-foreground-muted">{uploading ? "Uploading…" : asset ? "Stored in demo evidence registry" : "No asset uploaded yet · choose a file"}</p>
      <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={onUpload} />
    </label>
  );
}

function ProtectedAsset({ title, icon, asset, onUpload, uploading }: { title: string; icon: ReactNode; asset?: Asset; onUpload: (event: ChangeEvent<HTMLInputElement>) => void; uploading: boolean }) {
  return (
    <label className="group block cursor-pointer border border-border bg-surface p-3 transition-colors hover:border-border-strong">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-body-sm font-semibold text-foreground">{icon}{title}</span>
        <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-foreground-subtle">Protected</span>
      </div>
      <div className="mt-3 flex aspect-[4/3] items-center justify-center border border-dashed border-border-strong bg-background">
        <div className="text-center">
          <Fingerprint className="mx-auto size-9 text-foreground-subtle" aria-hidden="true" />
          <p className="mt-2 text-metadata text-foreground-muted">Biometric reference stored privately</p>
        </div>
      </div>
      <p className="mt-2 text-metadata text-foreground-muted">{uploading ? "Uploading…" : asset ? "Reference face is attached" : "No reference face uploaded yet"}</p>
      <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={onUpload} />
    </label>
  );
}

function EmptyWorkspace({ onAddNew }: { onAddNew: () => void }) {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center">
      <Users className="size-10 text-foreground-subtle" aria-hidden="true" />
      <h2 className="mt-4 font-display text-section-title text-foreground">No credential selected</h2>
      <p className="mt-2 max-w-sm text-body-sm text-foreground-muted">Create a synthetic credential and attach its evidence assets to begin a verification scenario.</p>
      <button type="button" onClick={onAddNew} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-body-sm font-semibold text-accent-foreground hover:bg-accent-strong">
        <Plus className="size-4" aria-hidden="true" /> Create credential
      </button>
    </div>
  );
}

function EmptyCredentialBody() {
  return (
    <div className="flex min-h-[420px] items-center justify-center px-6 text-center">
      <div>
        <ShieldCheck className="mx-auto size-9 text-foreground-subtle" aria-hidden="true" />
        <h3 className="mt-4 font-display text-card-title text-foreground">Credential record unavailable</h3>
        <p className="mt-2 max-w-sm text-body-sm text-foreground-muted">Refresh the registry to reload this official's credential.</p>
      </div>
    </div>
  );
}

function CreateAssetPicker({ icon, label, description, selection, onSelect, onClear }: { icon: ReactNode; label: string; description: string; selection: FileSelection | null; onSelect: (event: ChangeEvent<HTMLInputElement>) => void; onClear: () => void }) {
  return (
    <label className="group relative block cursor-pointer overflow-hidden border border-dashed border-border-strong bg-surface p-3 transition-colors hover:border-accent hover:bg-accent-soft/20">
      {selection ? (
        <div className="aspect-[4/3] overflow-hidden border border-border bg-background">
          <img src={selection.previewUrl} alt={`${label} preview`} className={`h-full w-full ${label === "QR code" ? "object-contain p-4" : "object-cover"}`} />
        </div>
      ) : (
        <div className="flex aspect-[4/3] items-center justify-center border border-border bg-background text-foreground-subtle">{icon}</div>
      )}
      <div className="mt-3 flex items-start gap-2">
        <span className="min-w-0 flex-1">
          <span className="block text-body-sm font-semibold text-foreground">{label}</span>
          <span className="mt-0.5 block text-metadata text-foreground-muted">{selection ? selection.file.name : description}</span>
        </span>
        {selection && (
          <button type="button" onClick={(event) => { event.preventDefault(); event.stopPropagation(); onClear(); }} className="rounded p-1 text-foreground-subtle hover:bg-muted hover:text-foreground" aria-label={`Remove ${label}`}> <X className="size-4" aria-hidden="true" /> </button>
        )}
      </div>
      <span className="mt-3 inline-flex items-center gap-1.5 text-metadata font-semibold text-accent"><Upload className="size-3.5" aria-hidden="true" />{selection ? "Replace file" : "Choose file"}</span>
      <input type="file" accept="image/*" className="sr-only" onChange={onSelect} />
    </label>
  );
}

function Avatar({ name, photoUrl, large = false }: { name: string; photoUrl?: string | null; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const initials = initialsFor(name);

  return (
    <div className={`${large ? "size-16" : "size-12"} relative shrink-0 overflow-hidden border border-border bg-surface-muted`}>
      {photoUrl && !failed ? (
        <img src={photoUrl} alt={`${name} portrait`} className="h-full w-full object-cover" onError={() => setFailed(true)} />
      ) : (
        <div className="flex h-full w-full items-center justify-center font-display font-semibold text-foreground-muted">{initials}</div>
      )}
    </div>
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

function InfoCell({ label, value, mono = false, icon }: { label: string; value: string; mono?: boolean; icon?: ReactNode }) {
  return (
    <div className="border-b border-r border-border px-5 py-4 last:border-r-0 sm:px-6">
      <p className="text-label uppercase text-foreground-subtle">{label}</p>
      <p className={`mt-1 flex items-center gap-1.5 text-foreground ${mono ? "font-display text-credential tracking-wide" : "text-body-sm"}`}>{icon}{value}</p>
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
        className="min-h-11 w-full rounded-md border border-border bg-surface px-3.5 text-body-sm text-foreground placeholder:text-foreground-subtle focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}

function labelForAsset(assetType: AssetType) {
  if (assetType === "reference_face") return "Reference face";
  if (assetType === "qr") return "QR code";
  return "Portrait";
}

function publicAssetUrl(storagePath: string) {
  const segments = storagePath.split("/");
  if (segments.length === 3 && segments[0] === "officials") {
    return `${API_BASE_URL}/demo/assets/files/${encodeURIComponent(segments[1])}/${encodeURIComponent(segments[2])}`;
  }
  return null;
}

function nextCredentialReference(current: string) {
  const match = current.match(/^(PRM-[A-Z0-9]+-)(\d{4})$/i);
  if (!match) return "PRM-DEMO-0010";
  return `${match[1].toUpperCase()}${String(Number(match[2]) + 1).padStart(4, "0")}`;
}

function initialsFor(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}

async function readError(response: Response): Promise<string> {
  try {
    const body = await response.json();
    return Array.isArray(body?.message) ? body.message.join(", ") : body?.message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}
