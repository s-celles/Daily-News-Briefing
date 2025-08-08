# Daily News Briefing for Obsidian

Get AI-powered daily news summaries directly in your Obsidian vault. Stay informed about your topics of interest with smart, automated news collection and summarization.

## Features

- 🤖 AI-powered news summarization using Google's Gemini 2.0 Flash model or Perplexity's Sonar
- 📅 Automated daily news collection with intelligent scheduling
- 🎯 Customizable topics and news sources
- 🔍 Advanced multi-phase search strategy with AI generated queries
- 📊 Detailed or concise summary formats
- 🎨 Beautiful, theme-aware formatting
- ⚡ API usage optimization with request throttling
- 🏷️ Quality-based news filtering
- 📂 Organized news archive with table of contents

## Prerequisites

To use this plugin, you may choose between two API providers:

### Option 1: Google APIs (requires 3 keys)
1. A Google Custom Search API key
2. A Custom Search Engine ID
3. A Google Gemini API key

### Option 2: Perplexity API (requires 1 key)
1. A Perplexity Sonar API key

> **Note**: Perplexity is simple and easy to use, but Google is free and more customizable.

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Daily News Briefing"
4. Install the plugin
5. Enable the plugin in your list of installed plugins

## Configuration

### Essential Settings

1. **API Provider Selection**: 
   - Choose between Google APIs or Sonar API

2. **API Keys**: 
   - For Google:
     - Enter your Google Search API Key (for fetching news)
     - Enter your Search Engine ID
     - Enter your Gemini API Key (for summarization)
   - For Perplexity:
     - Enter your Sonar API key (combines search and summarization)

3. **Topics**: 
   - Add your topics of interest (e.g., "Technology", "World News")
   - Each topic will be searched and summarized separately

4. **Schedule**: 
   - Set your preferred time for daily news generation (24-hour format)
   - Choose your archive folder location

### Advanced Settings

- **Use AI for search query** (for Google API):
   - Generate queries with Gemini for Google search
   - Get more comprehensive results
   - Enable by default

- **Content Quality** (for Google API):
  - Set news items per topic (3-15)
  - Configure maximum search results (10-50)
  - Enable/disable strict quality filtering
  - Add preferred and excluded domains

- **Output Format**:
  - Choose between detailed or concise summaries
  - Enable/disable notifications

- **API Usage**:
  - Customize date range for searches
  - Set minimum content length
  - Use custom AI prompts for summarization
  - Configure domain preferences for both API providers

## Usage

### Automatic Mode

1. Configure your settings
2. The plugin will automatically generate news at your scheduled time
3. Find your daily news in the specified archive folder

### Manual Generation

1. Use the command palette (Ctrl/Cmd + P)
2. Search for "Generate news now"
3. Click to generate news immediately

### Sidebar Button

For quick access, use the newspaper icon in the sidebar to:
- Generate today's news if it doesn't exist yet
- Open today's news if it already exists

## Example Output

```markdown
# Daily News - 2025-04-12

*Generated at 09:53:35*

---

## Table of Contents

- [AI](#ai)
- [World News](#world%20news)

---

## AI

### Key Developments
- **[Apple's AI Features Face Challenges Amidst Tariff Concerns]**: According to a *New York Times* report from April 11, 2025, Apple's AI headset sales have been disappointing. Furthermore, the AI's notification summaries have misrepresented news reports. These issues are compounded by the impact of Trump's tariffs. [Source](https://www.nytimes.com/2025/04/11/technology/apple-issues-trump-tariffs.html)
- **[Ohio University Launches Artificial Intelligence Bachelor of Science Degree]**: Ohio University's Russ College of Engineering and Technology has launched a new Bachelor of Science degree program in Artificial Intelligence. [Source](https://www.ohio.edu/engineering/)

### Analysis & Context
The *New York Times* article suggests that Apple is facing challenges on multiple fronts. The combination of disappointing AI product performance and the economic pressures from tariffs paints a concerning picture for the company's innovation efforts. The launch of an AI degree program at Ohio University reflects the growing importance of AI in academia and industry, indicating a broader trend of investment in AI education and research.
```

## Tips for Best Results

1. **API Provider Selection**:
   - Google APIs provide more control over news quality and filtering
   - Sonar API offers simpler setup with just one API key
   - Choose based on your preference for simplicity vs. control

2. **Topic Selection**:
   - Use specific topics rather than broad categories
   - Topic-specific search terms are automatically added for better results

3. **Quality Settings** (for Google API):
   - Enable strict quality filtering for more reliable sources
   - Add trusted news sources to preferred domains
   - Add known low-quality sources to excluded domains

4. **API Usage Optimization**:
   - Adjust maximum search results based on your API quota
   - Set appropriate news items per topic for comprehensive coverage
   - The plugin now includes request throttling to prevent API rate limits

## Troubleshooting

### Common Issues

1. **No News Generated**:
   - Check API keys (the plugin will verify basic key formats)
   - Verify scheduled time format
   - Ensure topics are properly configured
   - Check your internet connection

2. **Poor Quality Content**:
   - Enable strict quality filtering
   - Add more specific topics
   - Review excluded domains list
   - Try using Google APIs for more filtering options

3. **API Limits or Errors**:
   - Reduce maximum search results
   - Reduce news items per topic
   - Check API key validity
   - Verify your API quota has not been exceeded

4. **Scheduled Generation Issues**:
   - The plugin now handles system sleep/wake cycles better
   - Check if news file already exists for today
   - Manually trigger generation to test configuration

## Support

If you encounter issues or have suggestions:

1. Check the [GitHub Issues](https://github.com/Ghost04718/Daily-News-Briefing/issues)
2. Review existing discussions
3. Create a new issue with detailed information

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Obsidian Community
- Google Cloud Platform and Perplexity
- Contributors and testers

## Changelog

### 1.6.2
- Users now can enable or disable "Analysis & Context" function based on their preference.

### 1.6.1
- Add improved note generation failure handling

### 1.6.0
- Enable AI filtering instead of rule-based filtering.

### 1.5.1
- Use Gemini Flash 2.0 instead of 2.5

### 1.5.0
- Optimize Google Generation
   - Search with AI generated queries (requires Gemini API) and cached for low API comsumption
   - Enhance result filtering
   - Upgrade to Gemini Flash 2.5

### 1.4.2
- Enhance Sonar prompts

### 1.4.1 
- Enhance Sonar Performance
   - Improve Sonar prompt
   - Simplify Sonar settings

### 1.4.0
- Support Sonar by Perplexity to simplify the API key settings
- Implemented API request throttling to prevent rate limits
- Enhanced documentation in README

### 1.3.1
- Rename settings to avoid confusion

### 1.3.0
- Add sidebar button to improve UX which can:
   - Create today's news summary if does not exist
   - Open today's news summary if exists

### 1.2.1
- Avoid generating duplicate daily summary
- Update README.md

### 1.2.0
- Fix the release issue
- Optimize console log and performance

### 1.1.1
- Optimize news filtering

### 1.1.0
- Simplify configuration options
- Improve summarization and layout

### 1.0.0
- Initial release
- Core news fetching and summarization
- Basic configuration options
