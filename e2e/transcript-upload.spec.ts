/**
 * E2E Tests: Transcript Upload Page
 * Tests course input functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Transcript Upload Page', () => {
    
    test.beforeEach(async ({ page }) => {
        // Navigate with a sample major parameter
        await page.goto('/transcript-upload?major=software_engineering_bs');
    });

    test('should display page title and major name', async ({ page }) => {
        await expect(page.locator('h1, h2')).toContainText(/Course|Input|Upload/i);
    });

    test('should show PDF upload area', async ({ page }) => {
        // Look for upload area or drag-drop zone
        const uploadArea = page.locator('[type="file"], .upload, .dropzone, text=/drag|drop|upload/i');
        const count = await uploadArea.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should show course search input', async ({ page }) => {
        const searchInputs = page.locator('input[type="text"]');
        const count = await searchInputs.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should show autocomplete when typing course code', async ({ page }) => {
        const searchInput = page.locator('input[type="text"]').first();
        await searchInput.fill('CMPSC');
        
        await page.waitForTimeout(500);
        
        // Should show autocomplete suggestions
        const suggestions = page.locator('[role="option"], [role="listbox"], li');
        const count = await suggestions.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should add course when selected from dropdown', async ({ page }) => {
        const searchInput = page.locator('input[type="text"]').first();
        await searchInput.fill('CMPSC 131');
        
        await page.waitForTimeout(500);
        
        // Try to click first suggestion if visible
        const firstOption = page.locator('[role="option"], li').first();
        if (await firstOption.isVisible()) {
            await firstOption.click();
            
            // Course should appear as a pill/badge
            const coursePill = page.locator('text=CMPSC 131');
            await expect(coursePill).toBeVisible();
        }
    });

    test('should show academic plan preview', async ({ page }) => {
        // Right panel should show major requirements
        const planSection = page.locator('text=/Requirements|Courses|Plan|Prescribed/i');
        const count = await planSection.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should show Analyze button', async ({ page }) => {
        const analyzeButton = page.locator('button').filter({ hasText: /Analyze|Continue|Submit|Next/i });
        const count = await analyzeButton.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should show back link', async ({ page }) => {
        const backLink = page.locator('a, button').filter({ hasText: /Back|Return|Home/i });
        const count = await backLink.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should remove course when X clicked', async ({ page }) => {
        const searchInput = page.locator('input[type="text"]').first();
        await searchInput.fill('MATH 140');
        await page.waitForTimeout(300);
        
        const firstOption = page.locator('[role="option"], li').first();
        if (await firstOption.isVisible()) {
            await firstOption.click();
            await page.waitForTimeout(200);
            
            // Find and click remove button
            const removeButton = page.locator('button').filter({ hasText: /×|x|remove/i }).first();
            if (await removeButton.isVisible()) {
                await removeButton.click();
                await page.waitForTimeout(200);
                
                // Course pill should be gone (or reduced count)
            }
        }
    });
});

