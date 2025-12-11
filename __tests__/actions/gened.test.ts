/**
 * Integration Tests: GenEd Server Actions
 * Tests GenEd requirements and recommendations
 */

import { getGenEdRequirements } from '../../app/actions/getGenEdRequirements';

describe('getGenEdRequirements', () => {
    
    it('should return GenEd requirements', async () => {
        const requirements = await getGenEdRequirements();
        
        expect(requirements).toBeDefined();
        expect(requirements).toHaveProperty('total_credits');
        expect(requirements).toHaveProperty('sections');
    });

    it('should have correct total credits (45)', async () => {
        const requirements = await getGenEdRequirements();
        
        expect(requirements.total_credits).toBe(45);
    });

    it('should have multiple sections', async () => {
        const requirements = await getGenEdRequirements();
        
        expect(Array.isArray(requirements.sections)).toBe(true);
        expect(requirements.sections.length).toBeGreaterThan(0);
    });

    it('should have sections with correct structure', async () => {
        const requirements = await getGenEdRequirements();
        
        for (const section of requirements.sections) {
            expect(section).toHaveProperty('label');
            expect(section).toHaveProperty('total_credits');
            expect(section).toHaveProperty('categories');
            expect(typeof section.label).toBe('string');
            expect(typeof section.total_credits).toBe('number');
            expect(Array.isArray(section.categories)).toBe(true);
        }
    });

    it('should have categories with correct structure', async () => {
        const requirements = await getGenEdRequirements();
        
        for (const section of requirements.sections) {
            for (const category of section.categories) {
                expect(category).toHaveProperty('label');
                expect(category).toHaveProperty('credits_needed');
                expect(category).toHaveProperty('attribute');
                expect(typeof category.label).toBe('string');
                expect(typeof category.credits_needed).toBe('number');
                expect(typeof category.attribute).toBe('string');
            }
        }
    });

    it('should include Foundations section', async () => {
        const requirements = await getGenEdRequirements();
        
        const foundationsSection = requirements.sections.find(s => s.label === 'Foundations');
        expect(foundationsSection).toBeDefined();
        expect(foundationsSection!.total_credits).toBe(15);
    });

    it('should include Knowledge Domains section', async () => {
        const requirements = await getGenEdRequirements();
        
        const knowledgeSection = requirements.sections.find(s => s.label === 'Knowledge Domains');
        expect(knowledgeSection).toBeDefined();
        expect(knowledgeSection!.categories.length).toBeGreaterThanOrEqual(5);
    });

    it('should have required GenEd attributes', async () => {
        const requirements = await getGenEdRequirements();
        
        const allAttributes: string[] = [];
        for (const section of requirements.sections) {
            for (const category of section.categories) {
                allAttributes.push(category.attribute);
            }
        }
        
        // Check for key GenEd attributes
        expect(allAttributes).toContain('GWS');
        expect(allAttributes).toContain('GQ');
        expect(allAttributes).toContain('GN');
        expect(allAttributes).toContain('GA');
        expect(allAttributes).toContain('GH');
        expect(allAttributes).toContain('GS');
        expect(allAttributes).toContain('GHW');
    });
});

