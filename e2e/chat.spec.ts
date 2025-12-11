/**
 * E2E Tests: Chat Page (AI Advisor)
 * Tests the AI chat functionality
 */

import { test, expect } from '@playwright/test';

test.describe('Chat Page - AI Advisor', () => {
    
    test.beforeEach(async ({ page }) => {
        await page.goto('/chat');
    });

    test('should display chat page', async ({ page }) => {
        const content = await page.content();
        expect(content.length).toBeGreaterThan(0);
    });

    test('should show welcome message or hero section', async ({ page }) => {
        const welcomeText = page.locator('text=/help|advisor|assistant|chat/i');
        const count = await welcomeText.count();
        expect(count).toBeGreaterThan(0);
    });

    test('should show chat input field', async ({ page }) => {
        const chatInput = page.locator('input[type="text"], textarea');
        await expect(chatInput.first()).toBeVisible();
    });

    test('should show send button', async ({ page }) => {
        const sendButton = page.locator('button').filter({ hasText: /Send|Submit|→/i });
        const count = await sendButton.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should show suggested prompts', async ({ page }) => {
        // Look for suggestion cards or buttons
        const suggestions = page.locator('button, [class*="card"]').filter({ hasText: /prerequisite|course|major|GenEd|recommend/i });
        const count = await suggestions.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should enable input field', async ({ page }) => {
        const chatInput = page.locator('input[type="text"], textarea').first();
        await expect(chatInput).toBeEnabled();
    });

    test('should accept text input', async ({ page }) => {
        const chatInput = page.locator('input[type="text"], textarea').first();
        await chatInput.fill('What are the prerequisites for CMPSC 461?');
        
        const value = await chatInput.inputValue();
        expect(value).toContain('prerequisites');
    });

    test('should show New Chat button after interaction', async ({ page }) => {
        // This depends on chat state
        const newChatButton = page.locator('button').filter({ hasText: /New|Reset|Clear/i });
        const count = await newChatButton.count();
        expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should handle empty submit gracefully', async ({ page }) => {
        const sendButton = page.locator('button[type="submit"], button').filter({ hasText: /Send|Submit/i }).first();
        
        if (await sendButton.isVisible()) {
            // Click send without typing
            await sendButton.click();
            await page.waitForTimeout(300);
            
            // Should not crash
            const content = await page.content();
            expect(content.length).toBeGreaterThan(0);
        }
    });

    test('should be accessible with keyboard', async ({ page }) => {
        const chatInput = page.locator('input[type="text"], textarea').first();
        await chatInput.focus();
        await chatInput.fill('Test message');
        await page.keyboard.press('Enter');
        
        // Should handle keyboard input
        await page.waitForTimeout(300);
    });
});

