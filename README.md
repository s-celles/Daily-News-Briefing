# Daily News Briefing for Obsidian

**Get AI-powered daily news summaries on topics you care about, delivered automatically to your vault.**

## 🚀 Quick Start (5-minute setup)

1.  **Install the plugin** from Obsidian Community Plugins.
2.  **Choose your AI provider** (we recommend Perplexity for beginners).
3.  **Get your API key** (see detailed guides below).
4.  **Configure your topics** (e.g., "Technology," "World News").
5.  **Set your schedule**, and you're done!

---

## ✨ Key Features

-   🤖 **AI-Powered Summaries**: Smart news analysis using Google Gemini, Perplexity Sonar, or GPT-5-Search-API.
-   📅 **Auto-Generated Daily Briefings**: Wake up to fresh news in your vault.
-   🎯 **Custom Topics**: Track exactly what interests you.
-   🌍 **Multi-Language Support**: News in English, French, German, Spanish, and Italian.
-   📱 **One-Click Access**: Sidebar button for instant news generation.
-   📊 **Beautiful Formatting**: Clean, readable summaries with sources.
-   ⚡ **Three API Options**: Simple setups for Perplexity and GPT-5-Search-API, or advanced configuration for Google.

---

## 🔧 Installation

### Step 1: Install Plugin

1.  Open Obsidian Settings (`Ctrl/Cmd + ,`).
2.  Navigate to **Community Plugins** → Turn off **Safe Mode**.
3.  Click **Browse** → Search for **"Daily News Briefing"**.
4.  Click **Install** → **Enable**.

### Step 2: Choose Your AI Provider

You have three options. **We recommend Perplexity for beginners:**

| Provider | Pros | Cons | Best For |
| --- | --- | --- | --- |
| **Perplexity Sonar** ⭐ | • Only 1 API key needed<br>• Simple setup<br>• Great results | • Paid service only | Beginners, simple setup |
| **GPT-5-Search-API** | • Only 1 API key needed<br>• Simple setup<br>• High-quality summaries | • Paid service only | Users who want top-tier AI |
| **Google APIs** | • Free tier available<br>• More customization<br>• Advanced filtering | • 3 API keys required<br>• Complex setup | Power users, free option |

---

## 🔑 API Setup Guides

### Option A: Perplexity Sonar (Recommended)

**Why choose Perplexity?** Simple setup with just one API key, excellent results out of the box.

1.  **Get your API key:** Visit [Perplexity API](https://perplexity.ai/).
2.  **Configure in plugin:**
    *   Open plugin settings.
    *   Choose **"Sonar by Perplexity"** as API Provider.
    *   Paste your API key in the **"Sonar API key"** field.

### Option B: GPT-5-Search-API

**Why choose GPT-5-Search-API?** Simple setup with one API key, and state-of-the-art summarization.

1.  **Get your API key:** Visit [OpenAI API](https://platform.openai.com/api-keys).
2.  **Configure in plugin:**
    *   Open plugin settings.
    *   Choose **"GPT-5-Search-API by OpenAI"** as API Provider.
    *   Paste your API key in the **"OpenAI API key"** field.

### Option C: Google APIs (Free Option)

**Why choose Google?** A free tier is available, with more advanced customization options.

You'll need 3 different keys:

1.  **Google Custom Search API Key (FREE)**: Get it at [Google Cloud Console](https://console.cloud.google.com/).
2.  **Google Search Engine ID (FREE)**: Create a Search Engine and copy the **Search Engine ID** at [Google Programmable Search Engine](https://programmablesearchengine.google.com/controlpanel/all).
3.  **Gemini API Key (FREE)**: Get it at [Google AI Studio](https://aistudio.google.com/apikey).

**Configure in plugin:**
- Choose **"Google (Search + Gemini)"** as API Provider.
- Enter all three keys in their respective fields.

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

-   **For Perplexity/GPT-5-Search-API**: Verify your API key and that your account has sufficient credits.
-   **For Google**: Ensure all 3 API keys are valid and check your API quotas/billing.

### Plugin not working after update

1.  Reload Obsidian (`Ctrl/Cmd + R`).
2.  Disable and re-enable the plugin.
3.  Check for new plugin updates.

---

## 💡 Pro Tips for Best Results

-   **Topics**: Be specific (e.g., "Artificial Intelligence," "Climate Change"). Avoid vague terms like "News."
-   **Scheduling**: Set the generation time for when you typically start your day.
-   **Language**: News content will be in your selected language, though sources may still be in English. Summaries are translated.

---

## 🆘 Need Help?

1.  📖 [Check GitHub Issues](https://github.com/Ghost04718/Daily-News-Briefing/issues) for existing solutions.
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

### v1.7.6
- Fix OpenAI issues
    - Update model to gpt-5-search-api
    - Fix openai base url error

### Previous Versions
<details>
<summary>Click to view changelog history</summary>

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

## 🎯 What's Next?

**Stay tuned!** ⭐ Star the repo to get notified of updates.
