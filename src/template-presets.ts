/**
 * Template presets for daily news generation
 *
 * Available placeholders:
 * - {{METADATA}} - YAML frontmatter (if enabled)
 * - {{TIMESTAMP}} - Generation time
 * - {{DATE}} - Current date
 * - {{TABLE_OF_CONTENTS}} - Auto-generated table of contents
 * - {{TOPICS}} - All topic sections combined
 * - {{PROCESSING_STATUS}} - Error summary (if any errors occurred)
 */

export const TEMPLATE_PRESETS = {
    default: `{{METADATA}}*{{TIMESTAMP}}*

---

## Table of Contents

{{TABLE_OF_CONTENTS}}

{{TOPICS}}
{{PROCESSING_STATUS}}`,

    minimal: `{{METADATA}}# Daily News - {{DATE}}

{{TOPICS}}`,

    detailed: `{{METADATA}}# Daily News Briefing
**Date:** {{DATE}}
**Generated:** {{TIMESTAMP}}

---

## Table of Contents

{{TABLE_OF_CONTENTS}}

---

{{TOPICS}}

---

{{PROCESSING_STATUS}}`,

    custom: '' // User-defined template
};

export const TEMPLATE_DESCRIPTIONS = {
    default: 'Original format with timestamp, TOC, and topics',
    minimal: 'Compact format - just topics without TOC',
    detailed: 'Detailed format with extra metadata and separators',
    custom: 'Your own custom template'
};

export const TEMPLATE_EXAMPLE = `Example custom template:

# My Daily News - {{DATE}}
*{{TIMESTAMP}}*

{{TOPICS}}

---
Notes: {{PROCESSING_STATUS}}

Available placeholders:
- {{METADATA}} - YAML frontmatter
- {{TIMESTAMP}} - Generation time
- {{DATE}} - Current date
- {{TABLE_OF_CONTENTS}} - Auto-generated TOC
- {{TOPICS}} - All topic sections
- {{PROCESSING_STATUS}} - Error summary`;
