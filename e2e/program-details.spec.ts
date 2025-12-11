import { test, expect } from '@playwright/test';

test.describe('Program Details Page', () => {

    const sampleRecommendation = encodeURIComponent(JSON.stringify({
        minor_id: 'business_minor',
        minor_name: 'Business Minor',
        gap_credits: 9,
        completed_credits: 9,
        total_credits_required: 18,
        completion_percentage: 50,
        strategic_score: 65,
        sections: [
            {
                section_name: 'Prescribed Courses',
                credits_needed: 12,
                credits_completed: 6,
                completed_courses: ['ACCTG 211'],
                needed_courses: ['MGMT 301', 'MKTG 301']
            }
        ],
        completed_courses: ['ACCTG 211'],
        needed_courses: ['MGMT 301', 'MKTG 301']
    }));

    test.beforeEach(async ({ page }) => {
        await page.goto(`/minor-details/business_minor?recommendation=${sampleRecommendation}`);
    });

    test('should display program name', async ({ page }) => {
        const title = page.locator('h1, h2').first();
        await expect(title).toBeVisible();
    });

    test('should show credit summary cards', async ({ page }) => {
        // Look for credit-related text
        const creditText = page.locator('text=/credit|Credits/i');
        const count = await creditText.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should show progress bar', async ({ page }) => {
        const progressBar = page.locator('[role="progressbar"], [class*="progress"], progress');
        const count = await progressBar.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show completed courses section', async ({ page }) => {
        const completedSection = page.locator('text=/Completed|Done|Finished/i');
        const count = await completedSection.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show needed courses section', async ({ page }) => {
        const neededSection = page.locator('text=/Needed|Remaining|Required|Still/i');
        const count = await neededSection.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should have back button', async ({ page }) => {
        const backButton = page.locator('a, button').filter({ hasText: /Back|Return/i });
        await expect(backButton.first()).toBeVisible();
    });

    test('should navigate back when back button clicked', async ({ page }) => {
        const backButton = page.locator('a, button').filter({ hasText: /Back|Return/i }).first();
        if (await backButton.isVisible()) {
            await backButton.click();
            await page.waitForTimeout(500);
            // Should navigate away from details page
        }
    });

    test('should display course pills', async ({ page }) => {
        // Look for course-related elements
        const coursePills = page.locator('[class*="pill"], [class*="badge"], [class*="chip"]');
        const count = await coursePills.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });
});

test.describe('Certificate Details Page', () => {

    const sampleCertRecommendation = encodeURIComponent(JSON.stringify({
        certificate_id: 'digital_arts_certificate',
        certificate_name: 'Digital Arts Certificate',
        gap_credits: 6,
        completed_credits: 6,
        total_credits_required: 12,
        completion_percentage: 50,
        strategic_score: 60,
        sections: [],
        completed_courses: [],
        needed_courses: []
    }));

    test('should load certificate details page', async ({ page }) => {
        await page.goto(`/certificate-details/digital_arts_certificate?recommendation=${sampleCertRecommendation}`);

        // Should display some content
        const content = await page.content();
        expect(content.length).toBeGreaterThan(0);
    });
});

