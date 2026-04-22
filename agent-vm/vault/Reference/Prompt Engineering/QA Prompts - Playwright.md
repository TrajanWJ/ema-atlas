---
tags: [prompt-engineering, qa, playwright, testing, automation]
summary: "Extracted prompts and patterns for Playwright test automation. See also [[QA Prompt Library]] for the full collection."
source: https://github.com/qa-prompt-library/qa-prompt-library
category: QA Testing Prompts - Playwright
type: reference
status: active
confidence: 0.80
confidence_updated: 2026-03-18
updated: 2026-03-14
created: 2026-03-14
title: "QA Prompts - Playwright"
---

# QA Prompts - Playwright

Extracted prompts and patterns for Playwright test automation. See also [[QA Prompt Library]] for the full collection.

## Playwright Expert Agent Persona

```
You are an expert Playwright automation engineer specializing in modern web testing with advanced features like auto-waiting, network interception, and multi-browser support. You excel at creating fast, reliable, and maintainable test automation.

Core Competencies:
- Playwright API: Deep knowledge for Node.js, Python, Java, and .NET
- Modern Web Testing: SPA frameworks (React, Vue, Angular)
- Browser Contexts: Multi-tab, multi-window, isolated context management
- Network Control: Request/response interception, mocking, modification
- Visual Testing: Screenshot comparison and visual regression
- Mobile Emulation: Device emulation and responsive testing

Key Principles:
- Speed: Leverage parallel execution
- Reliability: Auto-waiting eliminates flakiness
- Debugging: Use trace viewer and inspector tools
- Isolation: Browser contexts ensure test independence
- Modern: Embrace TypeScript and async/await patterns
- Comprehensive: Combine UI, API, and visual testing
```

## Page Object Model with Fixtures

```typescript
// fixtures/basePage.ts
import { test as base, Page } from '@playwright/test';

export class BasePage {
  constructor(public page: Page) {}

  async navigateTo(url: string) {
    await this.page.goto(url);
  }

  async clickElement(selector: string) {
    await this.page.locator(selector).click();
  }
}

export class LoginPage extends BasePage {
  readonly usernameInput = this.page.getByLabel('Username');
  readonly passwordInput = this.page.getByLabel('Password');
  readonly loginButton = this.page.getByRole('button', { name: 'Login' });

  async login(username: string, password: string) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}

// Fixture setup
type MyFixtures = {
  loginPage: LoginPage;
};

export const test = base.extend<MyFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
});
```

## API Mocking and Network Interception

```typescript
import { test, expect } from '@playwright/test';

test('mock API response', async ({ page }) => {
  await page.route('**/api/users', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' }
      ])
    });
  });

  await page.goto('/users');
  await expect(page.getByText('John Doe')).toBeVisible();
});

test('wait for API response', async ({ page }) => {
  const responsePromise = page.waitForResponse(
    response => response.url().includes('/api/data') && response.status() === 200
  );

  await page.getByRole('button', { name: 'Load Data' }).click();
  const response = await responsePromise;
  const data = await response.json();

  expect(data).toHaveProperty('items');
});
```

## Visual Regression Testing

```typescript
import { test, expect } from '@playwright/test';

test('visual regression test', async ({ page }) => {
  await page.goto('/dashboard');

  // Full page screenshot comparison
  await expect(page).toHaveScreenshot('dashboard.png', {
    maxDiffPixels: 100
  });

  // Element screenshot comparison
  const chart = page.locator('.chart-container');
  await expect(chart).toHaveScreenshot('chart.png');
});
```

## Parallel Testing with Contexts

```typescript
import { test } from '@playwright/test';

test('parallel user sessions', async ({ browser }) => {
  const userContext1 = await browser.newContext();
  const userContext2 = await browser.newContext();

  const page1 = await userContext1.newPage();
  const page2 = await userContext2.newPage();

  await Promise.all([
    page1.goto('/app'),
    page2.goto('/app')
  ]);

  await userContext1.close();
  await userContext2.close();
});
```

## Configuration Best Practices

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['junit', { outputFile: 'results.xml' }],
    ['json', { outputFile: 'results.json' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'Mobile Chrome', use: { ...devices['Pixel 5'] } },
  ],
});
```

## Prompt Templates for Playwright Tests

### Basic Interaction Test Generation
```
Generate a Playwright test for [FEATURE_NAME] that:
- Uses accessibility-friendly locators (role, label, placeholder)
- Implements auto-waiting (no manual waits)
- Follows AAA pattern (Arrange, Act, Assert)
- Uses web-first assertions
- Includes proper error handling

Application URL: [URL]
Test scenario: [DESCRIPTION]
```

### Authentication and Storage State
```
Generate a Playwright authentication setup that:
- Uses storageState to save/restore auth
- Implements global setup for login
- Supports multiple user roles: [ROLES]
- Avoids re-login on every test

Auth mechanism: [SESSION/JWT/OAUTH]
Login URL: [URL]
```

### Selector Strategy
```
Review these Playwright selectors and suggest improvements:
[SELECTORS]

Priority order for selectors:
1. getByRole() - accessibility roles
2. getByLabel() - form labels
3. getByPlaceholder() - placeholder text
4. getByText() - visible text
5. getByTestId() - data-testid attributes
6. page.locator() - CSS/XPath (last resort)
```

### CI/CD Integration
```
Generate a GitHub Actions workflow for Playwright tests:
- Install dependencies and Playwright browsers
- Run tests in parallel with sharding
- Upload test artifacts (traces, screenshots, videos)
- Generate HTML report
- Fail the build on test failures

Node version: [VERSION]
Number of shards: [COUNT]
```

## Problem-Solving Approach
1. Leverage Playwright's auto-waiting (avoid manual waits)
2. Use accessibility-friendly locators first
3. Implement proper test isolation with contexts
4. Utilize trace viewer for debugging failures
5. Consider API testing for setup/teardown
6. Use visual testing for UI validation

## Related Notes
- [[QA Prompt Library]]
- [[QA Prompts - Security Testing]]
- **Coding Agent System Prompts**
- [[README]]
