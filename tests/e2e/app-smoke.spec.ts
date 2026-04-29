import { expect, test, type Page } from "@playwright/test";

async function login(page: Page, identifier: string, password: string, expectedPath: string) {
  await page.goto("/");
  const authCard = page.locator(".ay-sidebar-auth-card").first();
  await expect(authCard).toBeVisible();
  await authCard.getByLabel("Email address").fill(identifier);
  await authCard.getByLabel("Password").fill(password);
  await authCard.locator(".ay-sidebar-primary-button").click();
  await page.waitForURL(`**${expectedPath}`);
}

test("home page loads and shows workspace routing", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Available Workspaces")).toBeVisible();
  await expect(page.getByText("Choose a role")).toBeVisible();
  await expect(page.getByRole("button", { name: /Sign in with Google/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /Admin dashboard/i })).toBeVisible();
});

test("patient page requires login, then loads with neutral greeting", async ({ page }) => {
  await page.goto("/patient/PT-1001");
  await page.waitForURL("**/?auth=required*");
  const authCard = page.locator(".ay-sidebar-auth-card").first();
  await authCard.getByLabel("Email address").fill("maya.rivera@example.com");
  await authCard.getByLabel("Password").fill("Patient123!");
  await authCard.locator(".ay-sidebar-primary-button").click();
  await page.waitForURL("**/patient/PT-1001");
  await expect(page.getByText(/^Hello,/)).toBeVisible();
  await expect(page.getByText("Patient Care Journey")).toBeVisible();
});

test("developer board requires auth while feedback stays public", async ({ page }) => {
  await page.goto("/developer");
  await page.waitForURL("**/?auth=required*");
  const authCard = page.locator(".ay-sidebar-auth-card").first();
  await authCard.getByLabel("Email address").fill("neeraj.gupta@arogyayatra.health");
  await authCard.getByLabel("Password").fill("Developer123!");
  await authCard.locator(".ay-sidebar-primary-button").click();
  await page.waitForURL("**/developer");
  await expect(page.getByText(/Multi-Agent Overview|AI Multi-Agent Console/i)).toBeVisible();

  await page.goto("/feedback");
  await expect(page.getByRole("heading", { name: "Capture feedback and shape safer AI features" })).toBeVisible();
});

test("chat api requires login and then responds with the agentic envelope", async ({ page }) => {
  await login(page, "anita.patel@arogyayatra.health", "Admin123!", "/admin");

  const payload = await page.evaluate(async () => {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: "PT-1001",
        question: "What should I review first?"
      })
    });

    return {
      ok: response.ok,
      status: response.status,
      body: await response.json()
    };
  });

  expect(payload.ok).toBeTruthy();
  const body = payload.body as Record<string, unknown>;
  expect(body.mode).toBe("agentic_coordinator_v1");
  expect(Array.isArray(body.traceEvents)).toBeTruthy();
  expect(Array.isArray(body.decisionBoundaries)).toBeTruthy();
});
