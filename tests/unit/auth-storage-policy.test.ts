import { afterEach, describe, expect, it, vi } from "vitest";
import { createPendingGooglePatientAccess, createPublicPendingAccessRequest, listPendingAccessRequests } from "@/lib/auth/pending-access";
import { canUseLocalFileAuthStorage, isDatabaseBackedAuthRequired } from "@/lib/server/prisma";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("auth storage policy", () => {
  it("disables the local auth store in production-style deployments", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "");

    expect(isDatabaseBackedAuthRequired()).toBe(true);
    expect(canUseLocalFileAuthStorage()).toBe(false);
  });

  it("fails request-access creation closed when production has no database", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("DATABASE_URL", "");

    await expect(
      createPublicPendingAccessRequest({
        displayName: "Asha Rao",
        email: "asha.rao@example.com",
        provider: "manual",
        requestDetails: "Needs onboarding"
      })
    ).resolves.toEqual({ kind: "database_unavailable" });

    await expect(
      createPendingGooglePatientAccess({
        displayName: "Asha Rao",
        email: "asha.rao@example.com",
        googleSubject: "google-subject-1"
      })
    ).resolves.toBeNull();

    await expect(listPendingAccessRequests()).resolves.toEqual([]);
  });
});