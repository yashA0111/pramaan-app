import { ChangeEvent, FormEvent, ReactNode, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Archive,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  FileImage,
  Fingerprint,
  Info,
  MapPin,
  Plus,
  QrCode,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import QRCode from "qrcode";

import { API_BASE_URL } from "@/lib/api/client";
import { demoAuthHeaders } from "@/lib/demo-auth";
import { formatPermanentCredentialUri } from "@/features/verification/qr";

export const Route = createFileRoute("/admin/demo")({
  head: () => ({
    meta: [
      { title: "Demo Admin — Pramaan" },
      {
        name: "description",
        content: "Manage synthetic Pramaan officials, server-generated QR presentations, and biometric reference faces.",
      },
    ],
  }),
  component: DemoAdminPage,
});

type CredentialStatus = "valid" | "invalid" | "expired" | "revoked" | "suspended" | "archived";
type AssetType = "portrait" | "reference_face";

type QrPresentationSummary = {
  id: string;
  credentialId: string;
  credentialReference: string;
  officialId: string;
  status: "active" | "expired" | "invalidated" | "revoked";
  expiresAt: string;
  invalidatedAt?: string | null;
  invalidatedReason?: string | null;
  createdAt: string;
  qrUri?: string;
  qrDataUrl?: string;
};

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
  /** Stable permanent credential QR for physical ID card */
  permanentQr?: { uri: string; qrDataUrl: string } | null;
  activePresentation?: QrPresentationSummary | null;
};

type Asset = {
  id: string;
  assetType: "portrait" | "qr" | "reference_face";
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

const adminHeaders = () => demoAuthHeaders();

function DemoAdminPage() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [selectedDetails, setSelectedDetails] = useState<OfficialDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<AssetType | null>(null);
  const [qrActionLoading, setQrActionLoading] = useState(false);
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
    initialQrTtlMinutes: 15,
  });

  const [portrait, setPortrait] = useState<FileSelection | null>(null);
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
        headers: adminHeaders(),
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
        headers: adminHeaders(),
      });
      if (!response.ok) throw new Error(await readError(response));
      const details = (await response.json()) as OfficialDetails;
      setSelectedDetails(details);
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
      [portrait?.previewUrl, referenceFace?.previewUrl].forEach((url) => {
        if (url) URL.revokeObjectURL(url);
      });
    };
  }, [portrait?.previewUrl, referenceFace?.previewUrl]);

  async function createOfficial(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const response = await fetch(`${API_BASE_URL}/admin/demo/officials`, {
        method: "POST",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) throw new Error(await readError(response));

      const created = (await response.json()) as Official;
      const files: Array<[AssetType, FileSelection | null]> = [
        ["portrait", portrait],
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
        initialQrTtlMinutes: 15,
      });
      clearSelection("portrait");
      clearSelection("reference_face");
      await loadOfficials({ quiet: true });
      await loadSelectedDetails(created.id);
      setFormOpen(false);

      setNotice({
        kind: failures.length ? "error" : "success",
        text: failures.length
          ? `${created.displayName} was created, but some evidence uploads failed: ${failures.join("; ")}`
          : `${created.displayName} was created with an active server-generated QR presentation.`,
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
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status, reason: `Status changed to ${status} from Pramaan Demo Admin` }),
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

  async function handleRegenerateQr(id: string) {
    setQrActionLoading(true);
    setNotice(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/demo/officials/${id}/qr/regenerate`, {
        method: "POST",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ ttlMinutes: 15 }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setNotice({ kind: "success", text: "New temporary QR presentation generated. Previous presentation invalidated." });
      await loadOfficials({ quiet: true });
      await loadSelectedDetails(id);
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Failed to regenerate QR presentation.",
      });
    } finally {
      setQrActionLoading(false);
    }
  }

  async function handleExpireQr(id: string) {
    setQrActionLoading(true);
    setNotice(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/demo/officials/${id}/qr/expire`, {
        method: "POST",
        headers: { ...adminHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Manually expired by demo operator" }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setNotice({ kind: "success", text: "Active QR presentation expired now." });
      await loadOfficials({ quiet: true });
      await loadSelectedDetails(id);
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Failed to expire QR presentation.",
      });
    } finally {
      setQrActionLoading(false);
    }
  }

  async function handleArchiveOfficial(id: string) {
    if (!confirm("Are you sure you want to archive this official? They will be removed from the active demo registry, but historical verification records and receipts will be preserved.")) {
      return;
    }

    setNotice(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/demo/officials/${id}`, {
        method: "DELETE",
        headers: adminHeaders(),
      });
      if (!response.ok) throw new Error(await readError(response));
      setNotice({ kind: "success", text: "Official archived from active registry. History preserved." });
      await loadOfficials();
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Failed to archive official.",
      });
    }
  }

  async function handlePurgeOfficial(id: string) {
    if (
      !confirm(
        "⚠️ PERMANENT DATABASE DELETION:\n\n" +
        "Are you sure you want to completely remove this official, their credentials, reference biometric face, and presentations from the database?\n\n" +
        "This frees up the Credential Reference and Email so you can recreate this profile again with no database conflict."
      )
    ) {
      return;
    }

    setNotice(null);
    try {
      const response = await fetch(`${API_BASE_URL}/admin/demo/officials/${id}/purge`, {
        method: "DELETE",
        headers: adminHeaders(),
      });
      if (!response.ok) throw new Error(await readError(response));
      setNotice({
        kind: "success",
        text: "Official completely deleted from database. Reference and email are now free to reuse.",
      });
      setSelectedId("");
      await loadOfficials();
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : "Failed to permanently delete official.",
      });
    }
  }

  async function uploadAssetFile(officialId: string, assetType: AssetType, file: File) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("assetType", assetType);

    const response = await fetch(`${API_BASE_URL}/admin/demo/officials/${officialId}/assets`, {
      method: "POST",
      headers: adminHeaders(),
      body: formData,
    });
    if (!response.ok) throw new Error(await readError(response));
  }

  async function handleExistingUpload(assetType: AssetType, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !selected) return;

    setUploading(assetType);
    setNotice(null);
    try {
      await uploadAssetFile(selected.id, assetType, file);
      setNotice({ kind: "success", text: `${labelForAsset(assetType)} uploaded successfully.` });
      await loadOfficials({ quiet: true });
      await loadSelectedDetails(selected.id);
    } catch (error) {
      setNotice({
        kind: "error",
        text: error instanceof Error ? error.message : `Could not upload ${labelForAsset(assetType)}.`,
      });
    } finally {
      setUploading(null);
      event.target.value = "";
    }
  }

  function selectFile(assetType: AssetType, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const selection: FileSelection = {
      file,
      previewUrl: URL.createObjectURL(file),
    };

    if (assetType === "portrait") {
      if (portrait?.previewUrl) URL.revokeObjectURL(portrait.previewUrl);
      setPortrait(selection);
    } else {
      if (referenceFace?.previewUrl) URL.revokeObjectURL(referenceFace.previewUrl);
      setReferenceFace(selection);
    }
  }

  function clearSelection(assetType: AssetType) {
    if (assetType === "portrait") {
      if (portrait?.previewUrl) URL.revokeObjectURL(portrait.previewUrl);
      setPortrait(null);
    } else {
      if (referenceFace?.previewUrl) URL.revokeObjectURL(referenceFace.previewUrl);
      setReferenceFace(null);
    }
  }

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-background text-foreground">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              to="/app/verify"
              className="inline-flex size-9 shrink-0 items-center justify-center border border-border bg-surface text-foreground-muted hover:bg-muted hover:text-foreground"
              aria-label="Back to verification"
            >
              <ArrowLeft className="size-4" aria-hidden="true" />
            </Link>
            <div className="min-w-0">
              <p className="text-label uppercase tracking-widest text-foreground-subtle">Pramaan Operations</p>
              <h1 className="font-display text-section-title font-semibold text-foreground">Demo Admin & Credentials</h1>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={() => loadOfficials()}
              disabled={loading}
              className="inline-flex min-h-10 items-center gap-2 border border-border bg-surface px-3.5 text-body-sm font-semibold text-foreground hover:bg-muted"
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
              Refresh
            </button>
            <button
              type="button"
              onClick={() => setFormOpen((open) => !open)}
              className="inline-flex min-h-10 items-center gap-2 bg-accent px-4 text-body-sm font-semibold text-accent-foreground hover:bg-accent-strong"
            >
              <UserPlus className="size-4" aria-hidden="true" />
              {formOpen ? "Close form" : "Create official"}
            </button>
          </div>
        </div>
      </header>

      {notice && (
        <div className={`border-b px-4 py-3 text-body-sm sm:px-6 lg:px-8 ${notice.kind === "success" ? "border-success/30 bg-success-soft text-success-soft-foreground" : "border-danger/30 bg-danger-soft text-danger-soft-foreground"}`}>
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 overflow-hidden">
            <p className="flex min-w-0 items-center gap-2">
              <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
              <span className="min-w-0 truncate">{notice.text}</span>
            </p>
            <button type="button" onClick={() => setNotice(null)} className="shrink-0 p-1 hover:opacity-75" aria-label="Dismiss notice">
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      )}

      <main className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-6 p-4 sm:p-6 lg:grid-cols-12 lg:p-8">
        <section className="min-w-0 w-full lg:col-span-4">
          <div className="border border-border bg-surface">
            <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
              <div className="flex items-center gap-2">
                <Users className="size-4 text-foreground-muted" aria-hidden="true" />
                <h2 className="font-display text-card-title text-foreground">Synthetic Officials</h2>
              </div>
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-metadata font-medium text-foreground-subtle">
                {officials.length} registered
              </span>
            </div>

            <div className="divide-y divide-border">
              {officials.map((official) => {
                const isSelected = official.id === (selected?.id ?? "");
                const status = (official.credential?.status ?? "invalid") as CredentialStatus;

                return (
                  <button
                    key={official.id}
                    type="button"
                    onClick={() => setSelectedId(official.id)}
                    className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors sm:px-5 ${isSelected ? "bg-muted/70" : "hover:bg-muted/40"}`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar name={official.displayName} photoUrl={official.credential?.photoUrl ?? null} />
                      <div className="min-w-0">
                        <p className="truncate text-body-sm font-semibold text-foreground">{official.displayName}</p>
                        <p className="truncate text-metadata text-foreground-muted">{official.designation} · {official.department}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-foreground-subtle">{official.credential?.reference ?? "No credential"}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Status status={status} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        <section className="min-w-0 w-full lg:col-span-8">
          {formOpen && (
            <div className="mb-6 border border-border bg-surface p-5 md:p-6">
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2">
                  <UserPlus className="size-5 text-accent" aria-hidden="true" />
                  <h2 className="font-display text-card-title text-foreground">Create Synthetic Official</h2>
                </div>
                <button type="button" onClick={() => setFormOpen(false)} className="text-foreground-subtle hover:text-foreground">
                  <X className="size-5" aria-hidden="true" />
                </button>
              </div>

              <form onSubmit={createOfficial} className="mt-5 space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Full Name" value={form.displayName} onChange={(v) => setForm((f) => ({ ...f, displayName: v }))} placeholder="e.g. Inspector Deepak Sharma" required />
                  <Field label="Registered Email" value={form.registeredEmail} onChange={(v) => setForm((f) => ({ ...f, registeredEmail: v }))} placeholder="deepak.sharma@delhipolice.gov.in" type="email" required />
                  <Field label="Designation" value={form.designation} onChange={(v) => setForm((f) => ({ ...f, designation: v }))} placeholder="Inspector" required />
                  <Field label="Department" value={form.department} onChange={(v) => setForm((f) => ({ ...f, department: v }))} placeholder="Anti-Corruption Branch" required />
                  <Field label="Posting Location" value={form.postingLocation} onChange={(v) => setForm((f) => ({ ...f, postingLocation: v }))} placeholder="HQ Unit VIII, New Delhi" required />
                  <Field label="Credential Reference" value={form.credentialReference} onChange={(v) => setForm((f) => ({ ...f, credentialReference: v }))} placeholder="PRM-DEMO-0010" required />
                </div>

                <div className="border-t border-border pt-4">
                  <p className="text-label uppercase text-foreground-subtle">Initial Biometric & Evidence Assets</p>
                  <p className="mt-1 text-metadata text-foreground-muted">QR code will be generated automatically by the server.</p>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <CreateAssetPicker icon={<FileImage className="size-5" />} label="Portrait Photo" description="Official ID card portrait" selection={portrait} onSelect={(e) => selectFile("portrait", e)} onClear={() => clearSelection("portrait")} />
                    <CreateAssetPicker icon={<Fingerprint className="size-5" />} label="Reference Face (Protected)" description="Enrolled biometric template input" selection={referenceFace} onSelect={(e) => selectFile("reference_face", e)} onClear={() => clearSelection("reference_face")} />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setFormOpen(false)} className="min-h-10 border border-border bg-surface px-4 text-body-sm font-semibold text-foreground hover:bg-muted">
                    Cancel
                  </button>
                  <button type="submit" disabled={saving} className="min-h-10 bg-accent px-5 text-body-sm font-semibold text-accent-foreground hover:bg-accent-strong disabled:opacity-50">
                    {saving ? "Creating…" : "Save and Generate QR"}
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="border border-border bg-surface">
            {selected ? (
              <CredentialWorkspace
                official={selected}
                details={selectedDetails}
                detailsLoading={detailsLoading}
                uploading={uploading}
                qrActionLoading={qrActionLoading}
                onStatusChange={(status) => updateStatus(selected.id, status)}
                onRegenerateQr={() => handleRegenerateQr(selected.id)}
                onExpireQr={() => handleExpireQr(selected.id)}
                onArchive={() => handleArchiveOfficial(selected.id)}
                onPurge={() => handlePurgeOfficial(selected.id)}
                onUpload={handleExistingUpload}
                onAddNew={() => setFormOpen(true)}
              />
            ) : (
              <EmptyWorkspace onAddNew={() => setFormOpen(true)} />
            )}
          </div>
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
  qrActionLoading,
  onStatusChange,
  onRegenerateQr,
  onExpireQr,
  onArchive,
  onPurge,
  onUpload,
  onAddNew,
}: {
  official: Official;
  details: OfficialDetails | null;
  detailsLoading: boolean;
  uploading: AssetType | null;
  qrActionLoading: boolean;
  onStatusChange: (status: CredentialStatus) => void;
  onRegenerateQr: () => void;
  onExpireQr: () => void;
  onArchive: () => void;
  onPurge: () => void;
  onUpload: (assetType: AssetType, event: ChangeEvent<HTMLInputElement>) => void;
  onAddNew: () => void;
}) {
  const credential = official.credential;
  const portraitAsset = details?.assets?.find((asset) => asset.assetType === "portrait");
  const referenceAsset = details?.assets?.find((asset) => asset.assetType === "reference_face");
  const activePres = details?.activePresentation || official.activePresentation;
  const permanentQrData = (details as any)?.permanentQr || official.permanentQr;

  // --- Permanent Credential QR state ---
  const permanentUri = credential?.reference ? formatPermanentCredentialUri(credential.reference) : null;
  const [permanentQrUrl, setPermanentQrUrl] = useState<string | null>(
    permanentQrData?.qrDataUrl ?? null,
  );

  useEffect(() => {
    if (permanentQrData?.qrDataUrl) {
      setPermanentQrUrl(permanentQrData.qrDataUrl);
      return;
    }
    if (!permanentUri) return;
    let active = true;
    QRCode.toDataURL(permanentUri, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 360,
      color: { dark: "#0F172A", light: "#FFFFFF" },
    })
      .then((url) => { if (active) setPermanentQrUrl(url); })
      .catch(() => {});
    return () => { active = false; };
  }, [permanentUri, permanentQrData]);

  // --- Ephemeral Presentation QR state ---
  const [ephemeralQrUrl, setEphemeralQrUrl] = useState<string | null>(
    activePres?.qrDataUrl ?? null,
  );

  useEffect(() => {
    if (activePres?.qrDataUrl) {
      setEphemeralQrUrl(activePres.qrDataUrl);
      return;
    }
    if (!activePres?.qrUri) {
      setEphemeralQrUrl(null);
      return;
    }
    let active = true;
    QRCode.toDataURL(activePres.qrUri, {
      errorCorrectionLevel: "H",
      margin: 2,
      width: 360,
      color: { dark: "#0F172A", light: "#FFFFFF" },
    })
      .then((url) => { if (active) setEphemeralQrUrl(url); })
      .catch(() => {});
    return () => { active = false; };
  }, [activePres]);

  const copyPermanentUri = () => {
    if (permanentUri) {
      navigator.clipboard.writeText(permanentUri);
      alert("Permanent credential QR URI copied to clipboard!");
    }
  };

  const copyEphemeralUri = () => {
    if (activePres?.qrUri) {
      navigator.clipboard.writeText(activePres.qrUri);
      alert("Ephemeral presentation URI copied to clipboard!");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-5 md:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Avatar name={official.displayName} photoUrl={credential?.photoUrl ?? null} large />
          <div className="min-w-0">
            <p className="text-label uppercase text-foreground-subtle">Selected official</p>
            <h2 className="mt-1 truncate font-display text-section-title text-foreground">{official.displayName}</h2>
            <p className="mt-1 truncate text-body-sm text-foreground-muted">{official.designation} · {official.department}</p>
          </div>
        </div>
        <button type="button" onClick={onAddNew} className="inline-flex shrink-0 min-h-10 items-center gap-2 border border-border bg-surface px-3.5 text-body-sm font-semibold text-foreground hover:bg-muted">
          <Plus className="size-4" aria-hidden="true" /> New credential
        </button>
      </div>

      {credential ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2">
            <InfoCell label="Credential reference" value={credential.reference} mono />
            <InfoCell label="Employee reference" value={official.employeeReference ?? "—"} mono />
            <InfoCell label="Posting" value={official.postingLocation} icon={<MapPin className="size-4" />} />
            <InfoCell label="Registered email" value={official.registeredEmail} />
          </div>

          {/* ── Panel A: Permanent Credential QR ── */}
          <div className="border-t border-border p-5 md:p-6" style={{ background: "hsl(var(--surface-muted) / 0.2)" }}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-label uppercase tracking-wider text-foreground-subtle font-semibold flex items-center gap-1.5">
                  <QrCode className="size-4" /> Permanent Credential QR
                </p>
                <h3 className="mt-1 font-display text-card-title text-foreground">Physical ID Card QR</h3>
                <p className="mt-1 text-body-sm text-foreground-muted">
                  Print this QR on the official's physical ID card. It encodes only the credential reference
                  — no expiry, no secret. The backend controls verification access.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success-soft px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-success-soft-foreground">
                <Info className="size-3" /> Permanent · No Expiry
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-6 md:grid md:grid-cols-12 md:items-center">
              <div className="flex flex-col items-center md:col-span-5">
                <div className="inline-block rounded-xl border border-border bg-white p-4 shadow-sm">
                  {permanentQrUrl ? (
                    <img src={permanentQrUrl} alt={`Permanent credential QR for ${credential?.reference}`} className="size-44 object-contain sm:size-56" />
                  ) : (
                    <div className="flex size-44 items-center justify-center bg-muted text-foreground-subtle sm:size-56">
                      <QrCode className="size-16 animate-pulse" />
                    </div>
                  )}
                </div>
                <p className="mt-2 max-w-full break-all text-center font-mono text-[11px] text-foreground-subtle">
                  {permanentUri}
                </p>
              </div>

              <div className="space-y-3 md:col-span-7">
                <div className="space-y-2 rounded-lg border border-border bg-surface p-4 text-body-sm">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-metadata">
                    <span className="uppercase text-foreground-subtle">Credential Ref</span>
                    <span className="break-all font-mono font-medium text-foreground">{credential?.reference}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-metadata">
                    <span className="uppercase text-foreground-subtle">QR Scheme</span>
                    <span className="font-medium text-foreground">pramaan://credential/</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-metadata">
                    <span className="uppercase text-foreground-subtle">Expiry</span>
                    <span className="font-medium text-foreground">Never — controlled by backend</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-metadata">
                    <span className="uppercase text-foreground-subtle">Contains Secret</span>
                    <span className="font-medium text-foreground">No — reference only</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={copyPermanentUri}
                    className="inline-flex min-h-10 items-center gap-2 border border-border bg-surface px-3 text-body-sm font-medium text-foreground hover:bg-muted"
                  >
                    <Copy className="size-4" /> Copy URI
                  </button>
                  <Link
                    to="/demo/id-card/$officialId"
                    params={{ officialId: official.id }}
                    className="inline-flex min-h-10 items-center gap-2 bg-primary px-3.5 text-body-sm font-semibold text-primary-foreground hover:bg-primary/90"
                  >
                    <CreditCard className="size-4" /> Open ID Card
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* ── Panel B: Ephemeral Verification Presentation ── */}
          <div className="border-t border-border p-5 md:p-6 bg-surface-muted/30">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-label uppercase tracking-wider text-accent font-semibold flex items-center gap-1.5">
                  <QrCode className="size-4" /> Active Verification Presentation
                </p>
                <h3 className="mt-1 font-display text-card-title text-foreground">Ephemeral Session Token</h3>
                <p className="mt-1 text-body-sm text-foreground-muted">
                  Short-lived, server-managed verification token. Regeneratable by admin. Does not affect the permanent ID card QR.
                </p>
              </div>

              {activePres && (
                <span className={`px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded-full border ${activePres.status === "active" ? "bg-success-soft text-success-soft-foreground border-success/30" : "bg-danger-soft text-danger-soft-foreground border-danger/30"}`}>
                  Presentation {activePres.status}
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-6 md:grid md:grid-cols-12 md:items-center">
              <div className="flex flex-col items-center md:col-span-5">
                <div className="inline-block rounded-xl border border-border bg-white p-4 shadow-sm">
                  {ephemeralQrUrl ? (
                    <img src={ephemeralQrUrl} alt="Active Ephemeral Verification Presentation" className="size-44 object-contain sm:size-56" />
                  ) : (
                    <div className="flex size-44 items-center justify-center bg-muted text-foreground-subtle sm:size-56">
                      <QrCode className="size-16 opacity-40" />
                    </div>
                  )}
                </div>
                <p className="mt-2 max-w-full break-all text-center font-mono text-[11px] text-foreground-subtle">
                  {activePres?.qrUri ?? "No active presentation"}
                </p>
              </div>

              <div className="space-y-3 md:col-span-7">
                <div className="space-y-2 rounded-lg border border-border bg-surface p-4 text-body-sm">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-metadata">
                    <span className="uppercase text-foreground-subtle">Presentation ID</span>
                    <span className="max-w-full break-all font-mono font-medium text-foreground">{activePres?.id || "—"}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-metadata">
                    <span className="uppercase text-foreground-subtle">Security Type</span>
                    <span className="font-medium text-foreground">Opaque Token (SHA-256 Hashed)</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 text-metadata">
                    <span className="uppercase text-foreground-subtle">Expires At</span>
                    <span className="font-mono text-foreground">{activePres?.expiresAt ? new Date(activePres.expiresAt).toLocaleTimeString() : "15 mins TTL"}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onRegenerateQr}
                    disabled={qrActionLoading}
                    className="inline-flex min-h-10 items-center gap-2 bg-accent px-4 text-body-sm font-semibold text-accent-foreground hover:bg-accent-strong disabled:opacity-50"
                  >
                    <RefreshCw className={`size-4 ${qrActionLoading ? "animate-spin" : ""}`} />
                    Regenerate Presentation
                  </button>
                  <button
                    type="button"
                    onClick={onExpireQr}
                    disabled={qrActionLoading || activePres?.status !== "active"}
                    className="inline-flex min-h-10 items-center gap-2 border border-danger/40 bg-danger-soft px-3.5 text-body-sm font-semibold text-danger-soft-foreground hover:bg-danger-soft/80 disabled:opacity-50"
                  >
                    <Clock className="size-4" />
                    Expire Now
                  </button>
                  {activePres?.qrUri && (
                    <button
                      type="button"
                      onClick={copyEphemeralUri}
                      className="inline-flex min-h-10 items-center gap-2 border border-border bg-surface px-3 text-body-sm font-medium text-foreground hover:bg-muted"
                    >
                      <Copy className="size-4" /> Copy URI
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Credential Status Control */}
          <div className="border-t border-border p-5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-label uppercase text-foreground-subtle">Credential state</p>
                <p className="mt-1 text-body-sm text-foreground-muted">Update authoritative registry status. Suspending or revoking invalidates active QR presentations.</p>
              </div>
              <Status status={credential.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {(["valid", "suspended", "revoked", "expired"] as CredentialStatus[]).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => onStatusChange(status)}
                  className={`min-h-10 border px-3 text-metadata font-semibold capitalize transition-colors ${
                    credential.status === status
                      ? "border-accent bg-accent-soft text-accent-soft-foreground"
                      : "border-border bg-surface text-foreground-muted hover:bg-muted"
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Evidence Assets */}
          <div className="border-t border-border p-5 md:p-6">
            <div>
              <p className="text-label uppercase text-foreground-subtle">Biometric & Identity Assets</p>
              <h3 className="mt-1 font-display text-card-title text-foreground">Enrolled Identity Media</h3>
              <p className="mt-1 text-body-sm text-foreground-muted">Portrait is public evidence. Reference face is protected for 1:1 ONNX biometric comparison.</p>
            </div>

            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2">
              <ExistingAsset
                title="Portrait Photograph"
                icon={<FileImage className="size-5" />}
                {...(portraitAsset ? { asset: portraitAsset } : {})}
                imageUrl={portraitAsset ? publicAssetUrl(portraitAsset.storagePath) : credential.photoUrl ?? null}
                onUpload={(event) => onUpload("portrait", event)}
                uploading={uploading === "portrait"}
              />
              <ProtectedAsset
                title="Enrolled Reference Face"
                icon={<Fingerprint className="size-5" />}
                {...(referenceAsset ? { asset: referenceAsset } : {})}
                onUpload={(event) => onUpload("reference_face", event)}
                uploading={uploading === "reference_face"}
              />
            </div>

            {detailsLoading && <p className="mt-4 text-metadata text-foreground-subtle">Refreshing assets…</p>}
          </div>

          {/* Danger Zone: Archival & Permanent Deletion */}
          <div className="border-t border-border p-5 md:p-6 bg-danger-soft/10 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border/60 pb-4">
              <div className="max-w-xl">
                <h4 className="text-body-sm font-semibold text-danger flex items-center gap-1.5">
                  <ShieldAlert className="size-4" /> Non-Destructive Archival
                </h4>
                <p className="mt-1 text-metadata text-foreground-muted">
                  Deactivate official from the active demo registry while preserving historical logs and trust receipts.
                </p>
              </div>
              <button
                type="button"
                onClick={onArchive}
                className="inline-flex min-h-10 items-center gap-2 border border-danger/40 bg-surface px-4 text-body-sm font-semibold text-danger hover:bg-danger-soft/30 transition-colors"
              >
                <Archive className="size-4" /> Archive Official
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="max-w-xl">
                <h4 className="text-body-sm font-semibold text-danger flex items-center gap-1.5">
                  <Trash2 className="size-4" /> Permanent Delete from DB
                </h4>
                <p className="mt-1 text-metadata text-foreground-muted">
                  Completely removes this official, credentials, reference biometric face, and presentations from the database and storage. Frees up the Credential Reference and Email so you can recreate this profile without unique constraint conflicts.
                </p>
              </div>
              <button
                type="button"
                onClick={onPurge}
                className="inline-flex min-h-10 items-center gap-2 rounded-md bg-danger px-4 text-body-sm font-semibold text-danger-foreground hover:bg-danger/90 transition-colors"
              >
                <Trash2 className="size-4" /> Delete from DB
              </button>
            </div>
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
      <p className="mt-2 text-metadata text-foreground-muted">{uploading ? "Uploading…" : asset ? "Reference face enrolled" : "No reference face enrolled yet"}</p>
      <input type="file" accept="image/*" className="sr-only" disabled={uploading} onChange={onUpload} />
    </label>
  );
}

function EmptyWorkspace({ onAddNew }: { onAddNew: () => void }) {
  return (
    <div className="flex min-h-[520px] flex-col items-center justify-center px-6 text-center">
      <Users className="size-10 text-foreground-subtle" aria-hidden="true" />
      <h2 className="mt-4 font-display text-section-title text-foreground">No credential selected</h2>
      <p className="mt-2 max-w-sm text-body-sm text-foreground-muted">Create a synthetic credential to generate an ephemeral QR presentation.</p>
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
          <img src={selection.previewUrl} alt={`${label} preview`} className="h-full w-full object-cover" />
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
    suspended: "bg-warning-soft text-warning-soft-foreground border-warning/20",
    archived: "bg-surface-muted text-foreground-subtle border-border",
  }[status] || "bg-surface-muted text-foreground-subtle border-border";

  return <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${tone}`}>{status}</span>;
}

function InfoCell({ label, value, mono = false, icon }: { label: string; value: string; mono?: boolean; icon?: ReactNode }) {
  return (
    <div className="border-b border-r border-border px-5 py-4 last:border-r-0 sm:px-6">
      <p className="text-label uppercase text-foreground-subtle">{label}</p>
      <p className={`mt-1 flex items-center gap-1.5 text-foreground ${mono ? "break-all font-display text-credential tracking-wide" : "text-body-sm"}`}>{icon}{value}</p>
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
  return "Portrait";
}

function publicAssetUrl(storagePath: string) {
  const segments = storagePath.split("/");
  const officialId = segments[1];
  const filename = segments[2];
  if (segments.length === 3 && segments[0] === "officials" && officialId && filename) {
    return `${API_BASE_URL}/demo/assets/files/${encodeURIComponent(officialId)}/${encodeURIComponent(filename)}`;
  }
  return null;
}

function nextCredentialReference(current: string) {
  const match = current.match(/^(PRM-[A-Z0-9]+-)(\d{4})$/i);
  const prefix = match?.[1];
  const number = match?.[2];
  if (!prefix || !number) return "PRM-DEMO-0010";
  return `${prefix.toUpperCase()}${String(Number(number) + 1).padStart(4, "0")}`;
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
