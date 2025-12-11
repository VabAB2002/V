/**
 * Utility functions for course data handling
 */

export function truncateDescription(text: string, sentences: number = 3): string {
    if (!text) return '';

    // Match sentences ending with . ! or ?
    const sentenceRegex = /[^.!?]+[.!?]+/g;
    const matches = text.match(sentenceRegex);

    if (!matches || matches.length <= sentences) {
        return text;
    }

    return matches.slice(0, sentences).join(' ').trim() + '...';
}

export function formatCredits(credits: number | { min: number; max: number }): string {
    if (typeof credits === 'number') {
        return `${credits} credit${credits !== 1 ? 's' : ''}`;
    }
    return `${credits.min}-${credits.max} credits`;
}

// Extracts course codes from prerequisite structure
export function formatPrerequisites(prereqs: any): string {
    if (!prereqs || prereqs.type === 'none') {
        return 'None';
    }

    const extractCodes = (obj: any): string[] => {
        const codes: string[] = [];

        if (typeof obj === 'string') {
            // Direct course code
            codes.push(obj);
        } else if (obj.course) {
            codes.push(obj.course);
        } else if (obj.courses && Array.isArray(obj.courses)) {
            codes.push(...obj.courses);
        } else if (obj.options && Array.isArray(obj.options)) {
            codes.push(...obj.options);
        } else if (obj.children && Array.isArray(obj.children)) {
            obj.children.forEach((child: any) => {
                codes.push(...extractCodes(child));
            });
        }

        return codes;
    };

    const codes = extractCodes(prereqs);
    return codes.length > 0 ? codes.join(', ') : 'None';
}

export interface ParsedRequirement {
    label?: string;
    description?: string;
    type: string;
    courses?: string[];
    children?: ParsedRequirement[];
}

export function parseRequirements(requirements: any): ParsedRequirement[] {
    if (!requirements) return [];

    const parsed: ParsedRequirement[] = [];

    const parseNode = (node: any): ParsedRequirement | null => {
        if (!node) return null;

        const result: ParsedRequirement = {
            label: node.label,
            description: node.description,
            type: node.type || 'UNKNOWN',
        };

        // Handle different node types
        if (node.type === 'FIXED') {
            result.courses = [node.course];
        } else if (node.type === 'FIXED_LIST') {
            result.courses = node.courses || [];
        } else if (node.type === 'OR') {
            result.courses = node.options || [];
        } else if (node.type === 'PICK_FROM_LIST') {
            result.courses = node.valid_courses || [];
        } else if (node.type === 'AND' && node.children) {
            result.children = node.children
                .map((child: any) => parseNode(child))
                .filter((c: any) => c !== null);
        }

        return result;
    };

    if (Array.isArray(requirements)) {
        requirements.forEach(req => {
            const parsed_req = parseNode(req);
            if (parsed_req) parsed.push(parsed_req);
        });
    } else if (requirements.children) {
        requirements.children.forEach((child: any) => {
            const parsed_child = parseNode(child);
            if (parsed_child) parsed.push(parsed_child);
        });
    } else {
        const parsed_req = parseNode(requirements);
        if (parsed_req) parsed.push(parsed_req);
    }

    return parsed;
}
