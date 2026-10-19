const { test, expect } = require("@playwright/test");

test("InnerMe preview streams and safely formats a local mock response", async ({ browser }) => {
  test.setTimeout(90000);

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ["clipboard-read", "clipboard-write"]
  });
  const page = await context.newPage();
  const pageErrors = [];
  const supabaseRequests = [];

  page.on("pageerror", error => {
    pageErrors.push(error.message);
    console.log("BROWSER_PAGE_ERROR", error.message);
  });
  page.on("console", message => {
    if (message.type() === "error" || message.text().includes("InnerMe test preview")) {
      console.log("BROWSER_CONSOLE", message.type(), message.text());
    }
  });
  page.on("framenavigated", frame => {
    if (frame === page.mainFrame()) console.log("BROWSER_NAVIGATION", frame.url());
  });
  page.on("request", request => {
    if (request.url().includes(".supabase.co/")) {
      supabaseRequests.push({
        method: request.method(),
        url: request.url()
      });
    }
  });

  // All backend/network access is blocked in this test. The site's preview guard
  // supplies the assistant SSE fixture entirely within the browser.
  await page.route(url => {
    try { return new URL(url).hostname.endsWith(".supabase.co"); }
    catch (_) { return false; }
  }, route => route.abort());

  try {
    await page.goto(
      "http://127.0.0.1:4173/innerme-chat-ui-preview/admin/",
      { waitUntil: "domcontentloaded" }
    );

    await expect(page.getByRole("button", {
      name: /open ui-only chat simulation/i
    })).toBeVisible();

    await page.getByRole("button", {
      name: /open ui-only chat simulation/i
    }).click();

    await expect(page).toHaveURL(/\/admin-dashboard\/\?view=swayphics-ai/);
    await page.waitForTimeout(800);
    console.log("SIMULATION_DEBUG", JSON.stringify(await page.evaluate(() => ({
      url: location.href,
      accessTokenPresent: Boolean(sessionStorage.getItem("swayphics_admin_access_token")),
      accessTokenPayload: (() => {
        try {
          const token = sessionStorage.getItem("swayphics_admin_access_token") || "";
          return token.split(".").length > 1
            ? JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")))
            : null;
        } catch (_) { return "unreadable"; }
      })(),
      previewFlag: window.__SWAYPHICS_INNERME_TEST_PREVIEW__,
      mockStreamCount: window.__SWAYPHICS_PREVIEW_MOCK_STREAMS__,
      bodyText: document.body.innerText.slice(0, 700)
    })), null, 2));
    await expect(page.locator("#innerme-test-preview-banner")).toBeVisible();
    await expect(page.locator("#sway-ai-input")).toBeVisible({ timeout: 8000 });

    await page.locator("#sway-ai-input").fill("Show the preview response");
    await page.locator("#sway-ai-form button[type='submit']").click();

    const response = page.locator(".sway-ai-message-content").last();
    await expect(response).toContainText("Preview-only streamed response", { timeout: 15000 });
    await expect(response).toContainText("no AI model or provider was contacted");
    await expect(response.locator("strong")).toContainText("Bold text");
    await expect(response.locator("em")).toContainText("italic text");
    await expect(response.locator("code")).toContainText("stream_response");
    await expect(response.locator("pre code")).toContainText("const previewMode = true;");
    await expect(response.locator("table")).toContainText("Provider call");
    await expect(response.getByRole("link", { name: "Safe external link" })).toHaveAttribute("href", "https://example.com");

    // The fixture intentionally contains an executable-looking script string.
    // It must remain inert text; formatting is expected to escape untrusted HTML.
    await expect(page.locator("#innerme-preview-injected")).toHaveCount(0);
    expect(await page.evaluate(() => window.__INNERME_PREVIEW_INJECTED__)).toBeUndefined();
    expect(await page.evaluate(() => window.__SWAYPHICS_PREVIEW_MOCK_STREAMS__)).toBe(1);

    // Copy action should be present and operable for the final assistant message.
    const copy = page.locator(".sway-ai-copy").last();
    await expect(copy).toBeVisible();
    await copy.click();
    await expect(copy).toContainText(/copied|copy/i);

    // Exercise the real theme toggle provided by the tested frontend.
    const theme = page.locator("#admin-theme-toggle");
    await expect(theme).toBeVisible();
    await theme.click();
    await expect(page.locator("body")).toHaveClass(/sway-dark-mode/);
    await theme.click();
    await expect(page.locator("body")).not.toHaveClass(/sway-dark-mode/);

    // Narrow mobile viewport: composer stays visible and the page has no
    // viewport-level horizontal overflow.
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(page.locator("#sway-ai-input")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(overflow).toBe(false);

    // Request routing blocks all Supabase traffic; in particular, the mock
    // chat response must not reach a provider endpoint.
    expect(
      supabaseRequests.some(request =>
        request.method === "POST" &&
        request.url.includes("/functions/v1/swayphics-ai")
      )
    ).toBe(false);
    expect(pageErrors).toEqual([]);
  } finally {
    await context.close();
  }
});
