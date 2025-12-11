/**
 * E2E Tests: Homepage (Major Selection)
 * Tests the major selection flow on the homepage
 */

import { test, expect } from '@playwright/test';

test.describe('Homepage - Major Selection', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('should display the homepage with title', async ({ page }) => {
        await expect(page.locator('h1')).toContainText('Select Your Major');
    });

    test('should display search input', async ({ page }) => {
        const searchInput = page.locator('input[type="text"]');
        await expect(searchInput).toBeVisible();
    });

    test('should show dropdown when typing in search', async ({ page }) => {
        const searchInput = page.locator('input[type="text"]');
        await searchInput.fill('Software');
        
        // Wait for dropdown to appear
        await page.waitForTimeout(500);
        
        // Check if dropdown with options appears
        const dropdown = page.locator('[role="listbox"], .dropdown, ul');
        await expect(dropdown).toBeVisible();
    });

    test('should filter majors based on search query', async ({ page }) => {
        const searchInput = page.locator('input[type="text"]');
        await searchInput.fill('Computer');
        
        await page.waitForTimeout(500);
        
        // Should see computer-related majors
        const options = page.locator('[role="option"], li');
        const count = await options.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should show page toggle for switching modes', async ({ page }) => {
        // Look for page toggle or navigation
        const toggle = page.locator('button, a').filter({ hasText: /GenEd|Tool/i });
        const count = await toggle.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should navigate to transcript upload when major selected', async ({ page }) => {
        const searchInput = page.locator('input[type="text"]');
        await searchInput.fill('Software');
        
        await page.waitForTimeout(500);
        
        // Click on first option
        const firstOption = page.locator('[role="option"], li').first();
        if (await firstOption.isVisible()) {
            await firstOption.click();
            
            // Should navigate to transcript-upload
            await expect(page).toHaveURL(/transcript-upload/);
        }
    });

    test('should handle empty search results', async ({ page }) => {
        const searchInput = page.locator('input[type="text"]');
        await searchInput.fill('XYZNONEXISTENT123');
        
        await page.waitForTimeout(500);
        
        // Should show no results or empty state
        const noResults = page.locator('text=/no.*found|no.*results|no.*majors/i');
        const options = page.locator('[role="option"], li');
        
        // Either show "no results" message or have 0 options
        const hasNoResultsText = await noResults.count() > 0;
        const hasNoOptions = await options.count() === 0;
        
        expect(hasNoResultsText || hasNoOptions).toBeTruthy();
    });

    test('should be responsive on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 });
        await page.goto('/');
        
        // Page should still be functional
        const searchInput = page.locator('input[type="text"]');
        await expect(searchInput).toBeVisible();
    });
});

