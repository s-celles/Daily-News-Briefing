# Daily News Briefing for Obsidian

> [!IMPORTANT]
> Daily-News-Briefing has been featured by [Perplexity Cookbook](https://docs.perplexity.ai/cookbook/showcase/daily-news-briefing)!

**Get AI-powered daily news summaries about topics you care about, delivered automatically to your vault.**

## 🚀 Quick Start (5 minutes setup)

1. **Install the plugin** from Obsidian Community Plugins
2. **Choose your AI provider** (we recommend Perplexity for beginners)
3. **Get your API key** (see detailed guides below)
4. **Configure your topics** (e.g., "Technology", "World News")
5. **Set your schedule** and you're done!

---

## ✨ Key Features

- 🤖 **AI-Powered Summaries** - Smart news analysis using Google Gemini or Perplexity Sonar
- 📅 **Auto-Generated Daily Briefings** - Wake up to fresh news in your vault
- 🎯 **Custom Topics** - Track exactly what interests you
- 🌍 **Multi-Language Support** - News in English, French, German, Spanish, Italian
- 📱 **One-Click Access** - Sidebar button for instant news generation
- 📊 **Beautiful Formatting** - Clean, readable summaries with sources
- ⚡ **Two API Options** - Simple Perplexity setup or advanced Google configuration

---

## 🔧 Installation

### Step 1: Install Plugin
1. Open Obsidian Settings (`Ctrl/Cmd + ,`)
2. Navigate to **Community Plugins** → Turn off **Safe Mode**
3. Click **Browse** → Search for **"Daily News Briefing"**
4. Click **Install** → **Enable**

### Step 2: Choose Your AI Provider

You have two options. **We recommend Perplexity for beginners:**

| Provider | Pros | Cons | Best For |
|----------|------|------|----------|
| **Perplexity Sonar** ⭐ | • Only 1 API key needed<br>• Simple setup<br>• Great results | • Paid service only | Beginners, simple setup |
| **Google APIs** | • Free tier available<br>• More customization<br>• Advanced filtering | • 3 API keys required<br>• Complex setup | Power users, free option |

---

## 🔑 API Setup Guides

### Option A: Perplexity Sonar (Recommended for Beginners)

**Why choose Perplexity?** Simple setup with just one API key, excellent results out of the box.

1. **Get your API key:** Visit [Perplexity API](https://perplexity.ai/)

2. **Configure in plugin:**
   - Open plugin settings
   - Choose **"Sonar by Perplexity"** as API Provider
   - Paste your API key in **"Sonar API key"** field

### Option B: Google APIs (Free Option)

**Why choose Google?** Free tier available, more advanced customization options.

You'll need 3 different keys:

#### 1. Google Custom Search API Key (FREE)
Get your Google Custom Search API Key at [Google Cloud Console](https://console.cloud.google.com/)

#### 2. Google Search Engine ID (FREE)
Create your Search Engine and copy the **Search Engine ID** at [Google Programmable Search Engine](https://programmablesearchengine.google.com/controlpanel/all)

#### 3. Gemini API Key (FREE)
Get your Gemini API Key at [Google AI Studio](https://aistudio.google.com/apikey)

**Configure in plugin:**
- Choose **"Google (Search + Gemini)"** as API Provider
- Enter all three keys in respective fields

---

## ⚙️ Basic Configuration

### Essential Settings

1. **Topics** (comma-separated):
   ```
   Technology, World News, Science, Business
   ```

2. **Schedule Time** (24-hour format):
   ```
   08:00
   ```

3. **Language** (ISO code):
   ```
   en (English), fr (French), de (German), es (Spanish), it (Italian)
   ```

4. **Archive Folder**:
   ```
   News Archive
   ```

### That's it! You're ready to go! 🎉

---

## 📱 How to Use

### Automatic Mode (Recommended)
- Plugin generates news daily at your scheduled time
- Find your briefings in the **Archive Folder**

### Manual Generation
- **Command Palette**: `Ctrl/Cmd + P` → "Generate news now"
- **Sidebar Button**: Click the 📰 icon in the left sidebar

### Quick Access
The sidebar button is smart:
- If today's news exists → **Opens it**
- If today's news doesn't exist → **Creates it**

---

## 📖 Example Output

Your daily news will look like this:

```markdown
# Daily News - 2024-12-08

*Generated at 09:15:42*

---

## Table of Contents
- [Technology](#technology)

---

## Technology

### Key Developments
- **OpenAI Releases GPT-5 with Enhanced Reasoning**: OpenAI announced GPT-5 today with significant improvements in mathematical reasoning and code generation, achieving 95% accuracy on complex problem-solving tasks. [Source](https://openai.com/blog/gpt-5-release)
- **Apple's Vision Pro 2 Enters Mass Production**: Apple supplier Foxconn confirmed that Vision Pro 2 manufacturing began this week, with expected release in Q2 2024 featuring improved battery life and reduced weight. [Source](https://www.apple.com/newsroom)

### Analysis & Context
The AI landscape continues to evolve rapidly with OpenAI's latest release positioning them ahead of competitors. Apple's Vision Pro 2 production suggests confidence in the spatial computing market despite mixed reviews of the original device.
```

---

## 🎨 Customization Options

### Output Formats
- **Detailed** - Full summaries with analysis (default)
- **Concise** - Brief bullet points

### Google Advanced Settings
- **AI-Generated Search Queries** - Smarter search results
- **Quality Filtering** - Filter out low-quality sources
- **Custom Domains** - Prefer specific news sources

### Both Providers
- **Custom AI Prompts** - Write your own summarization instructions
- **Analysis & Context** - Toggle detailed analysis sections

---

## 🚨 Troubleshooting

### ❌ "No news generated"
**Check these in order:**
1. API keys are correctly entered (no extra spaces)
2. Topics are configured (comma-separated)
3. Internet connection is working
4. Try manual generation first

### ❌ "API Error" messages
**For Perplexity:**
- Verify API key
- Check account has sufficient credits

**For Google:**
- All 3 API keys must be valid
- Check API quotas/billing

### ❌ Poor quality summaries
- Try different topics (be more specific)
- For Google: Enable **"Use AI for search queries"**
- For Google: Increase **"News items per topic"**

### ❌ Plugin not working after update
1. Reload Obsidian (`Ctrl/Cmd + R`)
2. Disable and re-enable the plugin
3. Check for plugin updates

---

## 💡 Pro Tips for Best Results

### Topic Selection
✅ **Good topics:**
- "Artificial Intelligence"
- "Climate Change"
- "Space Exploration"
- "Cryptocurrency"

❌ **Avoid vague topics:**
- "News"
- "Updates" 
- "Important stuff"

### Scheduling
- Set generation time when you typically start your day
- Avoid peak internet usage hours for faster processing

### Language Settings
- News content will be in your selected language
- Sources may still be in English but summaries are translated

---

## 🆘 Need Help?

1. 📖 [Check GitHub Issues](https://github.com/Ghost04718/Daily-News-Briefing/issues)
2. 💬 Search existing discussions
3. 🐛 Create new issue with:
   - Your settings (hide API keys!)
   - Error messages
   - Steps to reproduce

---

## ❤️ Support the Project

If this plugin saves you time and keeps you informed:

[![Buy Me a Coffee](https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png)](https://www.buymeacoffee.com/adamchen)

---

## 🤝 Contributing

We welcome:
- 🐛 Bug reports and fixes
- ✨ Feature suggestions
- 🌍 New language translations
- 📚 Documentation improvements

**Contributors:**
- [@s-celles](https://github.com/s-celles): Multi-language support and major refactoring

---

## 📄 License

MIT License - Use freely, modify as needed!

---

## 📋 Changelog

### v1.7.3
- Add OpenAI models support

### Previous Versions
<details>
<summary>Click to view changelog history</summary>

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