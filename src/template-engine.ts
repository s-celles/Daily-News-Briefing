import type { TemplateData } from './types';
import { TEMPLATE_PRESETS } from './template-presets';

export class TemplateEngine {
    /**
     * Render a template with provided data
     */
    static renderTemplate(templateType: 'default' | 'minimal' | 'detailed' | 'custom', customTemplate: string, data: TemplateData): string {
        // Get the template based on type
        let template: string;

        if (templateType === 'custom') {
            template = customTemplate || TEMPLATE_PRESETS.default;
        } else {
            template = TEMPLATE_PRESETS[templateType];
        }

        // Replace all placeholders with actual data
        let result = template;

        // Replace each placeholder
        result = result.replace(/\{\{METADATA\}\}/g, data.metadata);
        result = result.replace(/\{\{TIMESTAMP\}\}/g, data.timestamp);
        result = result.replace(/\{\{DATE\}\}/g, data.date);
        result = result.replace(/\{\{TABLE_OF_CONTENTS\}\}/g, data.tableOfContents);
        result = result.replace(/\{\{TOPICS\}\}/g, data.topics);
        result = result.replace(/\{\{PROCESSING_STATUS\}\}/g, data.processingStatus);
        result = result.replace(/\{\{LANGUAGE\}\}/g, data.language);

        // Clean up any empty sections (e.g., empty metadata or processing status)
        result = this.cleanupEmptyLines(result);

        return result;
    }

    /**
     * Validate a template to ensure it has required placeholders
     */
    static validateTemplate(template: string): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        // Check if template is not empty
        if (!template || template.trim().length === 0) {
            errors.push('Template cannot be empty');
            return { valid: false, errors };
        }

        // Warn if {{TOPICS}} is missing (most critical placeholder)
        if (!template.includes('{{TOPICS}}')) {
            errors.push('Template should include {{TOPICS}} placeholder to display news content');
        }

        // Check for unknown placeholders
        const validPlaceholders = [
            '{{METADATA}}',
            '{{TIMESTAMP}}',
            '{{DATE}}',
            '{{TABLE_OF_CONTENTS}}',
            '{{TOPICS}}',
            '{{PROCESSING_STATUS}}',
            '{{LANGUAGE}}'
        ];

        const placeholderRegex = /\{\{([A-Z_]+)\}\}/g;
        const matches = template.match(placeholderRegex);

        if (matches) {
            for (const match of matches) {
                if (!validPlaceholders.includes(match)) {
                    errors.push(`Unknown placeholder: ${match}`);
                }
            }
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Extract placeholders from a template
     */
    static parsePlaceholders(template: string): string[] {
        const placeholderRegex = /\{\{([A-Z_]+)\}\}/g;
        const matches = template.match(placeholderRegex);
        if (!matches) return [];

        // Deduplicate matches
        const uniqueMatches: string[] = [];
        for (const match of matches) {
            if (!uniqueMatches.includes(match)) {
                uniqueMatches.push(match);
            }
        }
        return uniqueMatches;
    }

    /**
     * Get the default template
     */
    static getDefaultTemplate(): string {
        return TEMPLATE_PRESETS.default;
    }

    /**
     * Clean up empty lines and excessive whitespace
     */
    private static cleanupEmptyLines(content: string): string {
        // Remove lines that only contain whitespace
        let cleaned = content.replace(/^\s*[\r\n]/gm, '\n');

        // Remove more than 2 consecutive newlines
        cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

        // Trim leading and trailing whitespace
        cleaned = cleaned.trim();

        return cleaned;
    }

    /**
     * Get available placeholders info
     */
    static getPlaceholderInfo(): { placeholder: string; description: string }[] {
        return [
            { placeholder: '{{METADATA}}', description: 'YAML frontmatter (if enabled in settings)' },
            { placeholder: '{{TIMESTAMP}}', description: 'Generation time (e.g., "Generated at 10:30:00 AM")' },
            { placeholder: '{{DATE}}', description: 'Current date (YYYY-MM-DD format)' },
            { placeholder: '{{TABLE_OF_CONTENTS}}', description: 'Auto-generated table of contents' },
            { placeholder: '{{TOPICS}}', description: 'All topic sections combined' },
            { placeholder: '{{PROCESSING_STATUS}}', description: 'Error summary (shown only if errors occurred)' },
            { placeholder: '{{LANGUAGE}}', description: 'Current language code (e.g., "en")' }
        ];
    }
}
