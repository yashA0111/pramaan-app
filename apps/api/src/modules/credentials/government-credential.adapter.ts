import { Injectable, Logger } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DatabaseService } from "../../database/database.service";
import * as schema from "../../database/schema";
import {
  CredentialOutcome,
  CredentialSummary,
  ResolvedCredentialResult,
} from "./credential.types";
import { GovernmentCredentialPort } from "./government-credential.port";

@Injectable()
export class GovernmentCredentialAdapter implements GovernmentCredentialPort {
  private readonly logger = new Logger(GovernmentCredentialAdapter.name);

  // Deterministic seed fallback when DB is offline
  private readonly syntheticFallback: Record<string, ResolvedCredentialResult> = {
    "PRM-DEMO-0001": {
      outcome: "valid",
      credential: {
        credentialId: "PRM-DEMO-0001",
        fullName: "Arjun Mehta",
        designation: "Inspector",
        department: "District Crime Cell, Central District",
        posting: "District Unit III, New Delhi",
        photoUrl: "/assets/persona-arjun-mehta.jpg",
        photoAlt: "Inspector Arjun Mehta photograph",
        issuedOn: "2024-01-15",
        validUntil: "2029-01-14",
        issuer: {
          name: "Delhi Police Directorate of Personnel",
          authority: "Government of NCT of Delhi · Ministry of Home Affairs",
          registry: "demo",
        },
        registryStatus: "active",
        synthetic: true,
      },
    },
    "PRM-DEMO-0002": {
      outcome: "invalid",
      credential: null,
    },
    "PRM-DEMO-0003": {
      outcome: "expired",
      credential: {
        credentialId: "PRM-DEMO-0003",
        fullName: "Ravi Iyer",
        designation: "Head Constable",
        department: "Traffic Management Division",
        posting: "District Unit VII, New Delhi",
        photoUrl: "/assets/persona-arjun-mehta.jpg",
        photoAlt: "Head Constable Ravi Iyer photograph",
        issuedOn: "2019-06-04",
        validUntil: "2024-06-03",
        issuer: {
          name: "Delhi Police Directorate of Personnel",
          authority: "Government of NCT of Delhi · Ministry of Home Affairs",
          registry: "demo",
        },
        registryStatus: "expired",
        synthetic: true,
      },
    },
    "PRM-DEMO-0004": {
      outcome: "revoked",
      credential: {
        credentialId: "PRM-DEMO-0004",
        fullName: "Nikhil Barman",
        designation: "Assistant Sub-Inspector",
        department: "Special Operations Group",
        posting: "Transferred · posting withdrawn",
        photoUrl: "/assets/persona-arjun-mehta.jpg",
        photoAlt: "ASI Nikhil Barman photograph",
        issuedOn: "2022-03-10",
        validUntil: "2027-03-09",
        issuer: {
          name: "Delhi Police Directorate of Personnel",
          authority: "Government of NCT of Delhi · Ministry of Home Affairs",
          registry: "demo",
        },
        registryStatus: "revoked",
        synthetic: true,
      },
    },
    "PRM-DEMO-0005": {
      outcome: "unavailable",
      credential: null,
      serviceFailure: true,
    },
    "PRM-DEMO-0006": {
      outcome: "valid",
      credential: {
        credentialId: "PRM-DEMO-0006",
        fullName: "Suresh Pillai",
        designation: "Sub-Inspector",
        department: "Cyber Cell Investigation",
        posting: "District Unit I, New Delhi",
        photoUrl: "/assets/persona-arjun-mehta.jpg",
        photoAlt: "Sub-Inspector Suresh Pillai photograph",
        issuedOn: "2023-05-12",
        validUntil: "2028-05-11",
        issuer: {
          name: "Delhi Police Directorate of Personnel",
          authority: "Government of NCT of Delhi · Ministry of Home Affairs",
          registry: "demo",
        },
        registryStatus: "active",
        synthetic: true,
      },
    },
    "PRM-DEMO-0007": {
      outcome: "valid",
      credential: {
        credentialId: "PRM-DEMO-0007",
        fullName: "Imran Qureshi",
        designation: "Inspector",
        department: "Special Staff East District",
        posting: "District Unit V, New Delhi",
        photoUrl: "/assets/persona-arjun-mehta.jpg",
        photoAlt: "Inspector Imran Qureshi photograph",
        issuedOn: "2022-11-20",
        validUntil: "2027-11-19",
        issuer: {
          name: "Delhi Police Directorate of Personnel",
          authority: "Government of NCT of Delhi · Ministry of Home Affairs",
          registry: "demo",
        },
        registryStatus: "active",
        synthetic: true,
      },
    },
    "PRM-DEMO-0008": {
      outcome: "valid",
      credential: {
        credentialId: "PRM-DEMO-0008",
        fullName: "Deepak Rana",
        designation: "Constable",
        department: "Patrol & Beat Service",
        posting: "District Unit II, New Delhi",
        photoUrl: "/assets/persona-arjun-mehta.jpg",
        photoAlt: "Constable Deepak Rana photograph",
        issuedOn: "2021-08-01",
        validUntil: "2026-07-31",
        issuer: {
          name: "Delhi Police Directorate of Personnel",
          authority: "Government of NCT of Delhi · Ministry of Home Affairs",
          registry: "demo",
        },
        registryStatus: "active",
        synthetic: true,
      },
    },
    "PRM-DEMO-0009": {
      outcome: "valid",
      credential: {
        credentialId: "PRM-DEMO-0009",
        fullName: "Aarti Nair",
        designation: "Sub-Inspector",
        department: "Women Safety & Rapid Response",
        posting: "District Unit IV, New Delhi",
        photoUrl: "/assets/persona-arjun-mehta.jpg",
        photoAlt: "Sub-Inspector Aarti Nair photograph",
        issuedOn: "2023-09-15",
        validUntil: "2028-09-14",
        issuer: {
          name: "Delhi Police Directorate of Personnel",
          authority: "Government of NCT of Delhi · Ministry of Home Affairs",
          registry: "demo",
        },
        registryStatus: "active",
        synthetic: true,
      },
    },
  };

  constructor(private readonly dbService: DatabaseService) {}

  async resolveCredential(reference: string): Promise<ResolvedCredentialResult> {
    const cleanRef = reference.trim().toUpperCase();

    // Check special PRM-DEMO-0005 service failure
    if (cleanRef === "PRM-DEMO-0005") {
      return {
        outcome: "unavailable",
        credential: null,
        serviceFailure: true,
      };
    }

    if (this.dbService.db && this.dbService.isConnected) {
      try {
        const rows = await this.dbService.db
          .select({
            credential: schema.credentials,
            subject: schema.users,
            official: schema.officials,
            issuer: schema.issuers,
          })
          .from(schema.credentials)
          .innerJoin(schema.users, eq(schema.credentials.subjectUserId, schema.users.id))
          .leftJoin(schema.officials, eq(schema.users.id, schema.officials.userId))
          .innerJoin(schema.issuers, eq(schema.credentials.issuerId, schema.issuers.id))
          .where(eq(schema.credentials.credentialReference, cleanRef))
          .limit(1);

        if (rows.length > 0) {
          const row = rows[0];
          const cred = row.credential;
          const user = row.subject;
          const off = row.official;
          const issuer = row.issuer;

          let outcome: CredentialOutcome = "valid";
          if (cred.status === "invalid") outcome = "invalid";
          else if (cred.status === "expired" || new Date(cred.expiresAt).getTime() < Date.now())
            outcome = "expired";
          else if (cred.status === "revoked" || cred.status === "suspended" || off?.officialStatus === "suspended" || cred.status === "archived")
            outcome = "revoked";
          else if (cred.status === "unknown") outcome = "unavailable";

          const summary: CredentialSummary | null =
            outcome === "invalid" || outcome === "unavailable"
              ? null
              : {
                  credentialId: cred.credentialReference,
                  fullName: user.displayName,
                  designation: off?.designation || "Government Official",
                  department: off?.department || "Department of Public Safety",
                  posting: off?.postingLocation || "District Headquarters, New Delhi",
                  photoUrl: cred.photoUrl,
                  photoAlt: cred.photoAlt,
                  issuedOn: new Date(cred.issuedAt).toISOString().split("T")[0],
                  validUntil: new Date(cred.expiresAt).toISOString().split("T")[0],
                  issuer: {
                    name: issuer.name,
                    authority: issuer.authority,
                    registry: "demo",
                  },
                  registryStatus:
                    cred.status === "suspended" || off?.officialStatus === "suspended"
                      ? "suspended"
                      : outcome === "valid"
                        ? "active"
                        : outcome === "expired"
                          ? "expired"
                          : outcome === "revoked"
                            ? "revoked"
                            : "unknown",
                  synthetic: true,
                };

          return { outcome, credential: summary };
        }
      } catch (err: any) {
        this.logger.warn(`DB resolution failed for ${cleanRef}, trying fallback: ${err.message}`);
      }
    }

    // Fallback to synthetic in-memory catalog
    const fallback = this.syntheticFallback[cleanRef];
    if (fallback) return fallback;

    return {
      outcome: "unavailable",
      credential: null,
    };
  }

  addSyntheticCredential(reference: string, outcome: CredentialOutcome, credential: CredentialSummary | null) {
    this.syntheticFallback[reference.trim().toUpperCase()] = { outcome, credential };
  }

  removeSyntheticCredential(reference: string) {
    delete this.syntheticFallback[reference.trim().toUpperCase()];
  }
}
