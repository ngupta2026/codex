import { describe, expect, it } from "vitest";
import { canAccessPatient, resolvePatientIdForSession, roleHomePath, type AuthenticatedSession } from "@/lib/auth/repository";

function makeSession(overrides: Partial<AuthenticatedSession>): AuthenticatedSession {
  return {
    sessionId: "session-1",
    userId: "AUTH-PT-1001",
    role: "patient",
    displayName: "Maya Rivera",
    linkedEntityId: "PT-1001",
    authenticated: true,
    issuedAt: "2026-04-26T10:00:00.000Z",
    scope: {
      kind: "patient_self",
      summary: "Own patient record",
      entityIds: ["PT-1001"]
    },
    email: "maya.rivera@example.com",
    username: "maya.rivera",
    phone: "+1 (555) 401-3001",
    lastLoginAt: "2026-04-26T09:00:00.000Z",
    entityIds: ["PT-1001"],
    ...overrides
  };
}

describe("phase 2 authorization helpers", () => {
  it("keeps patients scoped to their own record", () => {
    const session = makeSession({});
    expect(canAccessPatient(session, "PT-1001")).toBe(true);
    expect(canAccessPatient(session, "PT-1002")).toBe(false);
    expect(resolvePatientIdForSession(session, "PT-1002")).toBe("PT-1001");
    expect(roleHomePath(session)).toBe("/patient/PT-1001");
  });

  it("lets nurses access assigned patients only", () => {
    const session = makeSession({
      role: "nurse",
      linkedEntityId: "NU-201",
      entityIds: ["PT-1001", "PT-1003"],
      scope: {
        kind: "nurse_assignments",
        summary: "Assigned patient panel",
        entityIds: ["PT-1001", "PT-1003"]
      }
    });

    expect(canAccessPatient(session, "PT-1001")).toBe(true);
    expect(canAccessPatient(session, "PT-1002")).toBe(false);
    expect(resolvePatientIdForSession(session, "PT-1002")).toBe("PT-1001");
    expect(roleHomePath(session)).toBe("/nurse");
  });
});
