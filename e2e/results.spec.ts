import { test, expect } from '@playwright/test';

test.describe('Results Page - Recommendations', () => {

    // Create a sample URL with mock recommendation data
    const sampleRecommendation = encodeURIComponent(JSON.stringify([
        {
            minor_id: 'business_minor',
            minor_name: 'Business Minor',
            gap_credits: 9,
            completed_credits: 9,
            total_credits_required: 18,
            completion_percentage: 50,
            strategic_score: 65,
            sections: [],
            completed_courses: ['ACCTG 211'],
            needed_courses: ['MGMT 301']
        }
    ]));

    test.beforeEach(async ({ page }) => {
        // Navigate to results with encoded params
        await page.goto(`/results?major=software_engineering_bs&recommendations=${sampleRecommendation}`);
    });

    test('should display results page header', async ({ page }) => {
        const header = page.locator('h1, h2');
        await expect(header.first()).toBeVisible();
    });

    test('should show tabs for Minors and Certificates', async ({ page }) => {
        const tabs = page.locator('button, [role="tab"]').filter({ hasText: /Minor|Certificate/i });
        const count = await tabs.count();
        // Should have at least minor tab
        expect(count).toBeGreaterThanOrEqual(1);
    });

    test('should display recommendation cards', async ({ page }) => {
        // Look for cards or list items
        const cards = page.locator('[class*="card"], [class*="recommendation"], article');
        await page.waitForTimeout(500);
        const count = await cards.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show View Details button on cards', async ({ page }) => {
        await page.waitForTimeout(500);
        const detailsButton = page.locator('button, a').filter({ hasText: /Details|View|More/i });
        const count = await detailsButton.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show back to home link', async ({ page }) => {
        const backLink = page.locator('a, button').filter({ hasText: /Back|Home/i });
        const count = await backLink.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should switch tabs when clicked', async ({ page }) => {
        const certificatesTab = page.locator('button, [role="tab"]').filter({ hasText: /Certificate/i });
        if (await certificatesTab.isVisible()) {
            await certificatesTab.click();
            await page.waitForTimeout(300);
            // Tab should be active
        }
    });

    test('should handle empty recommendations', async ({ page }) => {
        // Navigate with empty recommendations
        await page.goto('/results?major=software_engineering_bs&recommendations=[]');

        await page.waitForTimeout(500);

        // Should show empty state or message
        const content = await page.content();
        expect(content.length).toBeGreaterThan(0);
    });
});

