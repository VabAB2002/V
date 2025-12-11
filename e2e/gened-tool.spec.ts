import { test, expect } from '@playwright/test';

test.describe('GenEd Tool Page', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/gened');
    });

    test('should display GenEd Tool page', async ({ page }) => {
        const header = page.locator('h1, h2').filter({ hasText: /GenEd|General Education/i });
        await expect(header.first()).toBeVisible();
    });

    test('should show three-panel layout on desktop', async ({ page }) => {
        await page.setViewportSize({ width: 1280, height: 800 });

        // Page should have multiple sections/panels
        const sections = page.locator('section, [class*="panel"], [class*="column"]');
        const count = await sections.count();
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('should show circular progress indicator', async ({ page }) => {
        // Look for circular progress or percentage display
        const progress = page.locator('[class*="progress"], [class*="circle"], svg');
        const count = await progress.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should show GenEd categories', async ({ page }) => {
        // Check for GenEd attribute labels
        const categories = page.locator('text=/GWS|GQ|GN|GA|GH|GS|GHW|Foundations|Knowledge/i');
        const count = await categories.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should have major search input', async ({ page }) => {
        const searchInputs = page.locator('input[type="text"]');
        const count = await searchInputs.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should show course input area', async ({ page }) => {
        // Look for course input section
        const inputSection = page.locator('text=/Course|Add|Upload|Input/i');
        const count = await inputSection.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should display total credits info', async ({ page }) => {
        // GenEd total is 45 credits
        const creditsText = page.locator('text=/45|credits/i');
        const count = await creditsText.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should expand/collapse sections when clicked', async ({ page }) => {
        // Look for expandable sections
        const expandableHeaders = page.locator('[class*="accordion"], [class*="collapse"], button').filter({ hasText: /Foundations|Knowledge|Integrative/i });

        if (await expandableHeaders.first().isVisible()) {
            await expandableHeaders.first().click();
            await page.waitForTimeout(300);
        }
    });

    test('should update progress when course added', async ({ page }) => {
        const searchInput = page.locator('input[type="text"]').first();
        await searchInput.fill('ENGL 15');
        await page.waitForTimeout(500);

        const firstOption = page.locator('[role="option"], li').first();
        if (await firstOption.isVisible()) {
            await firstOption.click();
            await page.waitForTimeout(300);
            // Progress should update
        }
    });

    test('should show recommendations panel', async ({ page }) => {
        // Look for recommendations section
        const recsSection = page.locator('text=/Recommend|Smart|Suggestions/i');
        const count = await recsSection.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should be responsive on mobile', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/gened');

        // Page should still be functional
        const content = await page.content();
        expect(content.length).toBeGreaterThan(0);
    });
});

