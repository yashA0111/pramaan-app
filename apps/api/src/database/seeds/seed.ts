import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { config } from "../../config/env.config";
import * as schema from "../schema";

export async function runSeed(): Promise<boolean> {
  const connStr = config.directDatabaseUrl || config.databaseUrl;
  if (!connStr) {
    console.error("❌ DATABASE_URL is not set. Cannot run database seed.");
    return false;
  }

  console.log("🌱 Seeding synthetic demo registry to PostgreSQL...");
  const sql = (typeof postgres === "function" ? postgres : (postgres as any).default) as typeof postgres;
  const client = sql(connStr, { max: 1 });
  const db = drizzle(client, { schema });

  try {
    // 1. Issuers
    console.log("-> Seeding issuers...");
    await db
      .insert(schema.issuers)
      .values([
        {
          id: "iss_delhi_police",
          name: "Delhi Police Directorate of Personnel",
          issuerReference: "GOV-IN-DL-POLICE",
          issuerType: "state_police_authority",
          authority: "Government of NCT of Delhi · Ministry of Home Affairs",
          status: "active",
        },
      ])
      .onConflictDoNothing();

    // 2. Users (Citizens, Admins, Officials)
    console.log("-> Seeding users...");
    await db
      .insert(schema.users)
      .values([
        {
          id: "usr_citizen_001",
          role: "citizen",
          displayName: "Citizen Demo User",
          email: "citizen@pramaan.dev",
          status: "active",
        },
        {
          id: "usr_admin_001",
          role: "demo_admin",
          displayName: "Pramaan Demo Admin",
          email: "admin@pramaan.dev",
          status: "active",
        },
        {
          id: "usr_arjun_mehta",
          role: "official",
          displayName: "Arjun Mehta",
          email: "arjun.mehta@delhipolice.gov.in",
          status: "active",
        },
        {
          id: "usr_ravi_iyer",
          role: "official",
          displayName: "Ravi Iyer",
          email: "ravi.iyer@delhipolice.gov.in",
          status: "active",
        },
        {
          id: "usr_nikhil_barman",
          role: "official",
          displayName: "Nikhil Barman",
          email: "nikhil.barman@delhipolice.gov.in",
          status: "active",
        },
        {
          id: "usr_suresh_pillai",
          role: "official",
          displayName: "Suresh Pillai",
          email: "suresh.pillai@delhipolice.gov.in",
          status: "active",
        },
        {
          id: "usr_imran_qureshi",
          role: "official",
          displayName: "Imran Qureshi",
          email: "imran.qureshi@delhipolice.gov.in",
          status: "active",
        },
        {
          id: "usr_deepak_rana",
          role: "official",
          displayName: "Deepak Rana",
          email: "deepak.rana@delhipolice.gov.in",
          status: "active",
        },
        {
          id: "usr_aarti_nair",
          role: "official",
          displayName: "Aarti Nair",
          email: "aarti.nair@delhipolice.gov.in",
          status: "active",
        },
      ])
      .onConflictDoNothing();

    // 3. Officials
    console.log("-> Seeding officials...");
    await db
      .insert(schema.officials)
      .values([
        {
          id: "off_arjun_mehta",
          userId: "usr_arjun_mehta",
          employeeReference: "EMP-DP-48201",
          department: "District Crime Cell, Central District",
          designation: "Inspector",
          postingLocation: "District Unit III, New Delhi",
          registeredEmail: "arjun.mehta@delhipolice.gov.in",
          officialStatus: "active",
        },
        {
          id: "off_ravi_iyer",
          userId: "usr_ravi_iyer",
          employeeReference: "EMP-DP-31904",
          department: "Traffic Management Division",
          designation: "Head Constable",
          postingLocation: "District Unit VII, New Delhi",
          registeredEmail: "ravi.iyer@delhipolice.gov.in",
          officialStatus: "active",
        },
        {
          id: "off_nikhil_barman",
          userId: "usr_nikhil_barman",
          employeeReference: "EMP-DP-20419",
          department: "Special Operations Group",
          designation: "Assistant Sub-Inspector",
          postingLocation: "Transferred · posting withdrawn",
          registeredEmail: "nikhil.barman@delhipolice.gov.in",
          officialStatus: "suspended",
        },
        {
          id: "off_suresh_pillai",
          userId: "usr_suresh_pillai",
          employeeReference: "EMP-DP-55219",
          department: "Cyber Cell Investigation",
          designation: "Sub-Inspector",
          postingLocation: "District Unit I, New Delhi",
          registeredEmail: "suresh.pillai@delhipolice.gov.in",
          officialStatus: "active",
        },
        {
          id: "off_imran_qureshi",
          userId: "usr_imran_qureshi",
          employeeReference: "EMP-DP-66102",
          department: "Special Staff East District",
          designation: "Inspector",
          postingLocation: "District Unit V, New Delhi",
          registeredEmail: "imran.qureshi@delhipolice.gov.in",
          officialStatus: "active",
        },
        {
          id: "off_deepak_rana",
          userId: "usr_deepak_rana",
          employeeReference: "EMP-DP-11093",
          department: "Patrol & Beat Service",
          designation: "Constable",
          postingLocation: "District Unit II, New Delhi",
          registeredEmail: "deepak.rana@delhipolice.gov.in",
          officialStatus: "active",
        },
        {
          id: "off_aarti_nair",
          userId: "usr_aarti_nair",
          employeeReference: "EMP-DP-77341",
          department: "Women Safety & Rapid Response",
          designation: "Sub-Inspector",
          postingLocation: "District Unit IV, New Delhi",
          registeredEmail: "aarti.nair@delhipolice.gov.in",
          officialStatus: "active",
        },
      ])
      .onConflictDoNothing();

    // 4. Credentials
    console.log("-> Seeding credentials...");
    await db
      .insert(schema.credentials)
      .values([
        {
          id: "cred_prm_demo_0001",
          credentialReference: "PRM-DEMO-0001",
          subjectUserId: "usr_arjun_mehta",
          issuerId: "iss_delhi_police",
          credentialType: "law_enforcement_id",
          issuedAt: new Date("2024-01-15T00:00:00Z"),
          expiresAt: new Date("2029-01-14T23:59:59Z"),
          status: "valid",
          version: "1.0.0",
          photoUrl: "/assets/persona-arjun-mehta.jpg",
          photoAlt: "Inspector Arjun Mehta photograph",
          verificationPolicyId: "standard_government_v1",
          synthetic: true,
        },
        {
          id: "cred_prm_demo_0002",
          credentialReference: "PRM-DEMO-0002",
          subjectUserId: "usr_citizen_001",
          issuerId: "iss_delhi_police",
          credentialType: "law_enforcement_id",
          issuedAt: new Date("2023-01-01T00:00:00Z"),
          expiresAt: new Date("2028-01-01T00:00:00Z"),
          status: "invalid",
          version: "1.0.0",
          photoUrl: "/assets/persona-arjun-mehta.jpg",
          photoAlt: "Invalid signature demo credential",
          verificationPolicyId: "standard_government_v1",
          synthetic: true,
        },
        {
          id: "cred_prm_demo_0003",
          credentialReference: "PRM-DEMO-0003",
          subjectUserId: "usr_ravi_iyer",
          issuerId: "iss_delhi_police",
          credentialType: "law_enforcement_id",
          issuedAt: new Date("2019-06-04T00:00:00Z"),
          expiresAt: new Date("2024-06-03T23:59:59Z"),
          status: "expired",
          version: "1.0.0",
          photoUrl: "/assets/persona-arjun-mehta.jpg",
          photoAlt: "Head Constable Ravi Iyer photograph",
          verificationPolicyId: "standard_government_v1",
          synthetic: true,
        },
        {
          id: "cred_prm_demo_0004",
          credentialReference: "PRM-DEMO-0004",
          subjectUserId: "usr_nikhil_barman",
          issuerId: "iss_delhi_police",
          credentialType: "law_enforcement_id",
          issuedAt: new Date("2022-03-10T00:00:00Z"),
          expiresAt: new Date("2027-03-09T23:59:59Z"),
          status: "revoked",
          version: "1.0.0",
          photoUrl: "/assets/persona-arjun-mehta.jpg",
          photoAlt: "ASI Nikhil Barman photograph",
          verificationPolicyId: "standard_government_v1",
          synthetic: true,
        },
        {
          id: "cred_prm_demo_0005",
          credentialReference: "PRM-DEMO-0005",
          subjectUserId: "usr_citizen_001",
          issuerId: "iss_delhi_police",
          credentialType: "law_enforcement_id",
          issuedAt: new Date("2024-01-01T00:00:00Z"),
          expiresAt: new Date("2029-01-01T00:00:00Z"),
          status: "unknown",
          version: "1.0.0",
          photoUrl: "/assets/persona-arjun-mehta.jpg",
          photoAlt: "Unavailable registry scenario",
          verificationPolicyId: "standard_government_v1",
          synthetic: true,
        },
        {
          id: "cred_prm_demo_0006",
          credentialReference: "PRM-DEMO-0006",
          subjectUserId: "usr_suresh_pillai",
          issuerId: "iss_delhi_police",
          credentialType: "law_enforcement_id",
          issuedAt: new Date("2023-05-12T00:00:00Z"),
          expiresAt: new Date("2028-05-11T23:59:59Z"),
          status: "valid",
          version: "1.0.0",
          photoUrl: "/assets/persona-arjun-mehta.jpg",
          photoAlt: "Sub-Inspector Suresh Pillai photograph",
          verificationPolicyId: "standard_government_v1",
          synthetic: true,
        },
        {
          id: "cred_prm_demo_0007",
          credentialReference: "PRM-DEMO-0007",
          subjectUserId: "usr_imran_qureshi",
          issuerId: "iss_delhi_police",
          credentialType: "law_enforcement_id",
          issuedAt: new Date("2022-11-20T00:00:00Z"),
          expiresAt: new Date("2027-11-19T23:59:59Z"),
          status: "valid",
          version: "1.0.0",
          photoUrl: "/assets/persona-arjun-mehta.jpg",
          photoAlt: "Inspector Imran Qureshi photograph",
          verificationPolicyId: "standard_government_v1",
          synthetic: true,
        },
        {
          id: "cred_prm_demo_0008",
          credentialReference: "PRM-DEMO-0008",
          subjectUserId: "usr_deepak_rana",
          issuerId: "iss_delhi_police",
          credentialType: "law_enforcement_id",
          issuedAt: new Date("2021-08-01T00:00:00Z"),
          expiresAt: new Date("2026-07-31T23:59:59Z"),
          status: "valid",
          version: "1.0.0",
          photoUrl: "/assets/persona-arjun-mehta.jpg",
          photoAlt: "Constable Deepak Rana photograph",
          verificationPolicyId: "standard_government_v1",
          synthetic: true,
        },
        {
          id: "cred_prm_demo_0009",
          credentialReference: "PRM-DEMO-0009",
          subjectUserId: "usr_aarti_nair",
          issuerId: "iss_delhi_police",
          credentialType: "law_enforcement_id",
          issuedAt: new Date("2023-09-15T00:00:00Z"),
          expiresAt: new Date("2028-09-14T23:59:59Z"),
          status: "valid",
          version: "1.0.0",
          photoUrl: "/assets/persona-arjun-mehta.jpg",
          photoAlt: "Sub-Inspector Aarti Nair photograph",
          verificationPolicyId: "standard_government_v1",
          synthetic: true,
        },
      ])
      .onConflictDoNothing();

    // 5. Police Stations
    console.log("-> Seeding police stations...");
    await db
      .insert(schema.policeStations)
      .values([
        {
          id: "central-civic-line",
          name: "Civic Lines Police Station",
          address: "12 Shanti Marg, Civic Lines, New Delhi",
          distanceKm: 1.8,
          phone: "+91 11 2381 2200",
          hours: "Open 24 hours",
          openNow: true,
          note: "Synthetic demo location near the centre of the search area.",
          latitude: 28.6315,
          longitude: 77.2167,
        },
        {
          id: "kotwali-gate",
          name: "Kotwali Gate Police Station",
          address: "4 Dariba Road, Old Delhi, New Delhi",
          distanceKm: 3.4,
          phone: "+91 11 2327 4100",
          hours: "Open 24 hours",
          openNow: true,
          note: "Synthetic demo station with a public help desk.",
          latitude: 28.6506,
          longitude: 77.2303,
        },
        {
          id: "river-road",
          name: "River Road Police Station",
          address: "87 Yamuna Road, East District, New Delhi",
          distanceKm: 5.9,
          phone: "+91 11 2244 1900",
          hours: "Open 24 hours",
          openNow: true,
          note: "Synthetic demo station for the wider search result.",
          latitude: 28.628,
          longitude: 77.276,
        },
      ])
      .onConflictDoNothing();

    console.log("✅ Synthetic demo registry successfully seeded.");
    return true;
  } catch (error: any) {
    console.error("❌ Seeding failed:", error.message);
    return false;
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  runSeed()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
