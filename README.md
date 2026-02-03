# Daily News Briefing for Obsidian

> [Official website](https://chenziqiadam.github.io/Daily-News-Briefing/) launches!

**Get AI-powered daily news summaries on topics you care about, delivered automatically to your vault.**

## 🚀 Quick Start

1.  **Install the plugin** from Obsidian Community Plugins.
2.  **Choose your AI provider**.
3.  **Get your API key** (see detailed guides below).
4.  **Configure your topics** (e.g., "Technology," "World News").
5.  **Set your schedule**, and you're done!

---

## ✨ Key Features

-   🤖 **AI-Powered Summaries**: Smart news analysis with AI, supporting multiple AI providers including Google, OpenAI, xAI and Perplexity.
-   📅 **Auto-Generated Daily Briefings**: Wake up to fresh news in your vault.
-   🎯 **Custom Topics**: Track exactly what interests you.
-   🌍 **Multi-Language Support**: News in English, French, German, Spanish, and Italian.
-   📱 **One-Click Access**: Sidebar button for instant news generation.
-   📊 **Beautiful Formatting**: Clean, readable summaries with sources.
-   🎨 **Customizable Templates**: Choose from presets or create your own with 25 dynamic placeholders and template file support.

---

## 🔧 Installation

### Step 1: Install Plugin

1.  Open Obsidian Settings.
2.  Navigate to **Community Plugins** → Turn off **Safe Mode**.
3.  Click **Browse** → Search for **"Daily News Briefing"**.
4.  Click **Install** → **Enable**.

### Step 2: Choose Your News Pipeline

You have four options for your news generation pipeline. **We recommend Google + Gemini because it is totally free.**

| Pipeline                   | Pros                                               | Cons                                           | Best For                            |
| -------------------------- | -------------------------------------------------- | ---------------------------------------------- | ----------------------------------- |
| **Perplexity (Agentic)**   | • Simple setup (1 key)<br>• Fast results           | • Paid service only                            | Users who want fast, real-time info |
| **GPT (Agentic)**          | • Simple setup (1 key)<br>• High-quality summaries | • Paid service only                            | Users who want top-tier AI          |
| **Grok (Agentic)**         | • Simple setup (1 key)<br>• High-quality summaries | • Paid service only                            | Users who want top-tier AI          |
| **Google Search + Gemini** | • **Free tier available**<br>• Advanced filtering  | • Complex setup (3 keys)<br>• **Free service** | Power users, free option            |
| **Google Search + GPT**    | • Mix-and-match<br>• Advanced filtering            | • Complex setup (3 keys)                       | Users who want top-tier AI          |
| **Google Search + Grok**   | • Mix-and-match<br>• Advanced filtering            | • Complex setup (3 keys)                       | Users who want top-tier AI          |

---

## 🔑 API Setup Guides

### Option A: Perplexity (Agentic Search) 

**Why?** Simple setup with one API key, providing fast, real-time news.

1.  **Get API Key:** Visit [Perplexity API](https://perplexity.ai/).
2.  **Configure in Plugin:**
    *   Choose **"Perplexity (Agentic Search)"** as your News Pipeline.
    *   Paste your key in the **"Perplexity API key"** field.

### Option B: OpenAI GPT (Agentic Search)

**Why?** Simple setup with one API key, using a state-of-the-art AI model for searching and summarizing.

1.  **Get API Key:** Visit [OpenAI API](https://platform.openai.com/api-keys).
2.  **Configure in Plugin:**
    *   Choose **"OpenAI GPT (Agentic Search)"** as your News Pipeline.
    *   Paste your key in the **"OpenAI API key"** field.

### Option C: Grok (Agentic Search)

**Why?** Simple setup with one API key, using a state-of-the-art AI model for searching and summarizing.

1.  **Get API Key:** Visit [Grok API](https://x.ai/).
2.  **Configure in Plugin:**
    *   Choose **"Grok (Agentic Search)"** as your News Pipeline.
    *   Paste your key in the **"Grok API key"** field.

### Option D: Google Search + Gemini Summarizer (Free Option)

**Why?** Access to a free tier and advanced control over search results.

You need 3 different keys:
1.  **Google Custom Search API Key (FREE):** Get from [Google Cloud Console](https://console.cloud.google.com/).
2.  **Google Search Engine ID (FREE):** Create at [Google Programmable Search Engine](https://programmablesearchengine.google.com/controlpanel/all).
3.  **Gemini API Key (FREE):** Get from [Google AI Studio](https://aistudio.google.com/apikey).

**Configure in Plugin:**
*   Choose **"Google Search + Gemini Summarizer"** as your News Pipeline.
*   Enter all three keys in their respective fields.

### Option E: Google Search + GPT Summarizer

**Why?** Combine Google's powerful search and filtering with OpenAI's summarization capabilities.

You need 3 different keys:
1.  **Google Custom Search API Key (FREE):** See Option D.
2.  **Google Search Engine ID (FREE):** See Option D.
3.  **OpenAI API Key:** Get from [OpenAI API](https://platform.openai.com/api-keys).

**Configure in Plugin:**
*   Choose **"Google Search + GPT Summarizer"** as your News Pipeline.
*   Enter all three keys in their respective fields.

### Option F: Google Search + Grok Summarizer

**Why?** Combine Google's powerful search and filtering with Grok's summarization capabilities.

You need 3 different keys:
1.  **Google Custom Search API Key (FREE):** See Option D.
2.  **Google Search Engine ID (FREE):** See Option D.
3.  **Grok API Key:** Get from [Grok API](https://x.ai/).

**Configure in Plugin:**
*   Choose **"Google Search + Grok Summarizer"** as your News Pipeline.
*   Enter all three keys in their respective fields.

---

## ⚙️ Basic Configuration

### Essential Settings

1.  **Topics** (comma-separated):
    `Technology, World News, Science, Business`
2.  **Schedule Time** (24-hour format):
    `08:00`
3.  **Language**:
    `en` (English), `fr` (French), `de` (German), `es` (Spanish), `it` (Italian), `zh` (Chinese)
4.  **Archive Folder**:
    `News Archive`

### That's it! You're ready to go! 🎉

---

## 📱 How to Use

### Automatic Mode (Recommended)

-   The plugin generates news daily at your scheduled time.
-   Find your briefings in the **Archive Folder**.

### Manual Generation

-   **Command Palette**: `Ctrl/Cmd + P` → "Generate news now".
-   **Sidebar Button**: Click the 📰 icon in the left sidebar.

### Quick Access

The sidebar button is smart:
- If today's news exists → **Opens it**.
- If today's news doesn't exist → **Creates it**.

---

## 🎨 Customization Options

### Output Formats
-   **Detailed**: Full summaries with analysis (default).
-   **Concise**: Brief bullet points.

### Template Customization
Choose how your daily news is formatted with flexible template options:

-   **Template Presets**:
    -   **Default**: Standard format with full structure
    -   **Minimal**: Compact layout with essential information only
    -   **Detailed**: Extended format with extra metadata
-   **Custom Template**: Write your own template using 25 dynamic placeholders
-   **Template Files**: Create templates as notes in your vault for easy editing

**Available Placeholders** (25 total):
-   **Basic** (8): `{{METADATA}}`, `{{TIMESTAMP}}`, `{{DATE}}`, `{{TIME}}`, `{{TABLE_OF_CONTENTS}}`, `{{TOPICS}}`, `{{PROCESSING_STATUS}}`, `{{LANGUAGE}}`
-   **Date/Time** (10): `{{YEAR}}`, `{{MONTH}}`, `{{MONTH_NAME}}`, `{{DAY}}`, `{{DAY_NAME}}`, `{{HOUR}}`, `{{MINUTE}}`, and more
-   **Metadata** (5): `{{METADATA_DATE}}`, `{{METADATA_TIME}}`, `{{METADATA_TAGS}}`, `{{METADATA_LANGUAGE}}`, `{{METADATA_PROVIDER}}`
-   **Topics** (2): `{{TOPIC_COUNT}}`, `{{TOPIC_LIST}}`

Access template settings in the plugin configuration, with built-in validation to ensure your template works correctly.

### Advanced Settings
-   **AI-Generated Search Queries** (Google): Smarter search results.
-   **Quality Filtering** (Google): Filter out low-quality sources.
-   **Custom AI Prompts**: Write your own summarization instructions.
-   **Analysis & Context**: Toggle detailed analysis sections on or off.

---

## 🚨 Troubleshooting

### "No news generated"

1.  Check that API keys are correctly entered (no extra spaces).
2.  Ensure topics are configured (comma-separated).
3.  Verify your internet connection.
4.  Try manual generation first.

### "API Error" messages

- Verify your API key and that your account has sufficient credits.

### Plugin not working after update

1.  Reload Obsidian (`Ctrl/Cmd + R`).
2.  Disable and re-enable the plugin.
3.  Check for new plugin updates.

---

## 🆘 Need Help?

1.  📖 [Check GitHub Issues](https://github.com/ChenziqiAdam/Daily-News-Briefing/issues) for existing solutions.
2.  🐛 If you find a new bug, create a new issue with your settings (hide API keys!), error messages, and steps to reproduce.

---

## ❤️ Support the Project

If this plugin saves you time and keeps you informed, consider supporting its development:

[![Buy Me a Coffee](https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png)](https://www.buymeacoffee.com/adamchen)

---

## 🤝 Contributing

We welcome bug reports, feature suggestions, new language translations, and documentation improvements.

**Contributors:**
-   [@s-celles](https://github.com/s-celles): Multi-language support and major refactoring.

---

## 📄 License

MIT License - Use freely and modify as needed!

---

## 📋 Changelog

### v1.9.0
- Support customizable template setting

### Previous Versions
<details>
<summary>Click to view changelog history</summary>

**1.8.2**
- Fix Grok agentic search

**1.8.1**
- Add Grok support

**1.8.0**
- Refactor provider architecture
    - Separated providers into `agentic-search` and `search-then-summarize` categories.
    - This improves code organization and makes it easier to add new providers in the future.
    - Add migration support.

**1.7.7**
- Fix Google issues
    - Extend api timeout limit
    - Improve news number limit for custom search

**1.7.6**
- Fix OpenAI issues
    - Update model to gpt-5-search-api
    - Fix openai base url error

**1.7.5**
- Fix issues
    - Replace gemini-2.0-flash with gemini-2.5-flash
    - Enable GPT option
    - Update settings

**1.7.4**
- Reduce token consumption for Gemini API due to Google new policy for free tier
   - Add prompt cache for query generation
   - Optimize prompt

**1.7.3**
- Add OpenAI models support

**1.7.2**
- Multi-language support (EN, FR, DE, ES, IT)
- Improved error handling
- Better metadata generation

**v1.6.2**
- Toggle Analysis & Context section on/off

**v1.6.1** 
- Better failure handling for note generation

**v1.6.0**
- AI-powered news filtering (replaces rule-based)

**v1.5.1**
- Upgraded to Gemini Flash 2.0

**v1.5.0**
- AI-generated search queries for better results
- Enhanced Google API performance
- Upgraded to Gemini Flash 2.5

**v1.4.2**
- Enhanced Sonar API prompts

**v1.4.1**
- Improved Sonar API performance
- Simplified Sonar settings

**v1.4.0**
- Added Perplexity Sonar support
- API request throttling
- Enhanced documentation

**v1.3.1**
- Clearer settings names

**v1.3.0**
- Added sidebar button for easy access
- Auto-create or open today's news

**v1.2.1**
- Prevent duplicate daily summaries
- Updated documentation

**v1.2.0**
- Performance optimizations
- Better console logging

**v1.1.1**
- Improved news filtering

**v1.1.0**
- Simplified configuration
- Better summarization and layout

**v1.0.0**
- Initial release
- Core news fetching and summarization
</details>

---

## 🎯 Road Map

- [ ] Support multiple AI providers
	- [x] OpenAI
	- [x] xAI
	- [ ] Anthropic
- [ ] Support more news sources
- [ ] Others
	- [ ] Add Gemini agentic search
	- [x] Support customizable template
