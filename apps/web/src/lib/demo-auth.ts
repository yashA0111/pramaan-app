import { apiRequest } from "@/lib/api/client";

export type DemoRole = "citizen" | "official" | "demo_admin";

export type DemoUser = {
  id: string;
  role: DemoRole;
  displayName: string;
  email: string;
  status: string;
};

const STORAGE_KEY = "pramaan.demo.session";

const DEMO_USERS: Record<DemoRole, DemoUser> = {
  citizen: {
    id: "usr_citizen_001",
    role: "citizen",
    displayName: "Citizen Demo User",
    email: "citizen@pramaan.dev",
    status: "active",
  },
  official: {
    id: "usr_arjun_mehta",
    role: "official",
    displayName: "Inspector Arjun Mehta",
    email: "arjun.mehta@delhipolice.gov.in",
    status: "active",
  },
  demo_admin: {
    id: "usr_admin_001",
    role: "demo_admin",
    displayName: "Pramaan Demo Admin",
    email: "admin@pramaan.dev",
    status: "active",
  },
};

export async function loginDemo(role: DemoRole): Promise<DemoUser> {
  const user = await apiRequest<DemoUser>(
    "/auth/login-demo",
    {
      method: "POST",
      body: JSON.stringify({ role }),
    },
    () => DEMO_USERS[role],
    { latencyMs: 180 },
  );

  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
  return user;
}

export function getDemoSession(): DemoUser | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value ? (JSON.parse(value) as DemoUser) : null;
  } catch {
    return null;
  }
}

export function clearDemoSession(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(STORAGE_KEY);
}

export function demoAuthHeaders(): Record<string, string> {
  const user = getDemoSession();
  if (!user) return {};
  const adminKey = import.meta.env["VITE_DEMO_ADMIN_API_KEY"];
  return {
    "x-user-id": user.id,
    "x-demo-role": user.role,
    "x-user-email": user.email,
    "x-user-name": user.displayName,
    ...(user.role === "demo_admin" && adminKey ? { "x-demo-admin-key": adminKey } : {}),
  };
}

export function demoRoleLabel(role: DemoRole): string {
  return role === "demo_admin" ? "Demo Admin" : role.charAt(0).toUpperCase() + role.slice(1);
}
