# Template Guide

## Overview
The Daily News Briefing plugin now supports customizable templates! You can choose from preset templates or create your own custom format.

## Template Types

### 1. Default Template
The original format with timestamp, table of contents, and topics.

**Output Example:**
```markdown
*Generated at 10:30:00 AM*

---

## Table of Contents

- [Technology](#technology)
- [World News](#world-news)

---

## Technology

[News content here]

---

## World News

[News content here]
```

### 2. Minimal Template
Compact format - just the date and topics without table of contents.

**Output Example:**
```markdown
# Daily News - 2026-02-03

## Technology

[News content here]

## World News

[News content here]
```

### 3. Detailed Template
Enhanced format with extra metadata and separators.

**Output Example:**
```markdown
# Daily News Briefing
**Date:** 2026-02-03
**Generated:** Generated at 10:30:00 AM

---

## Table of Contents

- [Technology](#technology)
- [World News](#world-news)

---

## Technology

[News content here]

---

## World News

[News content here]
```

### 4. Custom Template
Define your own template using placeholders.

## Available Placeholders

| Placeholder | Description | Example Output |
|------------|-------------|----------------|
| `{{METADATA}}` | YAML frontmatter (if enabled) | `---\ndate: "2026-02-03"\n---\n` |
| `{{TIMESTAMP}}` | Generation time | `Generated at 10:30:00 AM` |
| `{{DATE}}` | Current date | `2026-02-03` |
| `{{TABLE_OF_CONTENTS}}` | Auto-generated TOC | `## Table of Contents\n- [Topic](#topic)` |
| `{{TOPICS}}` | All topic sections | Full topic content with headers |
| `{{PROCESSING_STATUS}}` | Error summary (if any) | Shows errors if processing failed |
| `{{LANGUAGE}}` | Current language code | `en` |

## Creating Custom Templates

### Example 1: Simple Daily Note
```markdown
# 📰 {{DATE}}
> {{TIMESTAMP}}

{{TOPICS}}
```

### Example 2: Detailed with Metadata
```markdown
{{METADATA}}
# Daily News Briefing
**Generated:** {{TIMESTAMP}}
**Language:** {{LANGUAGE}}

---

{{TABLE_OF_CONTENTS}}

{{TOPICS}}

---

## Notes
{{PROCESSING_STATUS}}
```

### Example 3: Minimal with Callout
```markdown
> [!info] Daily News - {{DATE}}
> {{TIMESTAMP}}

{{TOPICS}}
```

## How to Use

1. **Open Settings**: Go to Settings → Daily News Briefing
2. **Find Template Configuration**: Scroll to the "Template Configuration" section
3. **Select Template Type**: Choose from dropdown:
   - Default
   - Minimal
   - Detailed
   - Custom
4. **For Custom Templates**:
   - Enter your template in the text area
   - Use placeholders from the list above
   - Click "Validate" to check for errors
5. **Generate News**: The next generated news will use your selected template

## Tips

- Start with a preset template and switch to custom if you need more control
- Always include `{{TOPICS}}` placeholder - it contains your actual news content
- Use `{{METADATA}}` at the start if you want YAML frontmatter
- Template validation will warn you about unknown placeholders
- Empty placeholders (like `{{PROCESSING_STATUS}}` when there are no errors) are automatically cleaned up

## Troubleshooting

**Template not applying?**
- Make sure you saved the settings
- Try regenerating the news manually

**Validation errors?**
- Check for typos in placeholder names (must be UPPERCASE)
- Ensure placeholders are wrapped in double curly braces: `{{PLACEHOLDER}}`
- Unknown placeholders will be listed in the error message

**Missing content?**
- Verify you included the `{{TOPICS}}` placeholder
- Check that metadata is enabled in settings if using `{{METADATA}}`
