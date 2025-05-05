# Daily News Briefing for Obsidian

Get AI-powered daily news summaries directly in your Obsidian vault. Stay informed about your topics of interest with smart, automated news collection and summarization.

## Features

- 🤖 AI-powered news summarization using Google's Gemini 2.0 Flash model or Perplexity's Sonar
- 📅 Automated daily news collection
- 🎯 Customizable topics and news sources
- 🔍 Advanced multi-phase search strategy with quality scoring
- 📊 Detailed or concise summary formats
- 🎨 Beautiful, theme-aware formatting
- ⚡ API usage optimization
- 🏷️ Quality-based news filtering
- 📂 Organized news archive with table of contents

## Prerequisites

To use this plugin, you may choose between:

1. A Google Custom Search API key
2. A Custom Search Engine ID
3. A Google Gemini API key

OR

1. A Perplexity API key

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Daily News Briefing"
4. Install the plugin
5. Enable the plugin in your list of installed plugins

## Configuration

### Essential Settings

1. **API Keys**: 
   1. Google:
      - Enter your Google API Key
      - Enter your Search Engine ID
      - Enter your Gemini API Key
   2. Perplexity:
      - Perplexity API key

2. **Topics**: 
   - Add your topics of interest (e.g., "Technology", "World News")
   - Each topic will be searched and summarized separately

3. **Schedule**: 
   - Set your preferred time for daily news generation (24-hour format)
   - Choose your archive folder location

### Advanced Settings

- **Content Quality**:
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

## Usage

### Automatic Mode

1. Configure your settings
2. The plugin will automatically generate news at your scheduled time
3. Find your daily news in the specified archive folder

### Manual Generation

1. Use the command palette (Ctrl/Cmd + P)
2. Search for "Generate news now"
3. Click to generate news immediately

### Reading Your News

- News is organized by topics with a table of contents
- Each topic includes:
  - Key developments with concrete facts and statistics
  - Source links in markdown format
  - AI-generated analysis (in detailed mode)
  - Notable quotes and data points
  - Quality-filtered content from reliable sources

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
The *New York Times* article suggests that Apple is facing challenges on multiple fronts. The combination of disappointing AI product performance and the economic pressures from tariffs paints a concerning picture for the company's innovation efforts. The launch of an AI degree program at Ohio University reflects the growing importance of AI in academia and industry, indicating a broader trend of investment in AI education and research. The Alabama Public Radio segment and the Nature article, while relevant to the broader news landscape, did not contain specific, substantive details about AI developments.

---

## World News

### Key Developments
- **[European Countries Pledge Billions in Military Support for Ukraine]**: European countries have pledged billions in military support for Ukraine. A US envoy met with Putin. [Source](https://apnews.com/world-news)
- **[Israelis Mark Passover Amid Gaza Captive Crisis]**: Israelis are observing Passover while hoping for the release of captives held in Gaza. [Source](https://apnews.com/world-news)
- **[UN Reports Israeli Military Actions Undermining Syrian Political Transition]**: On April 10, 2025, the United Nations reported that recent military actions by Israel are undermining Syria's political transition and the chances of a new security pact between the two countries. [Source](https://www.un.org/en/)
- **[NASA Focuses on World Science and Inspiring Students]**: NASA is focusing on world science and inspiring students across the United States to pursue scientific fields. [Source](https://nasa.gov/news/recently-published/)
- **[Rare Ancient DNA Discovery]**: Nature.com reports on the discovery of rare ancient DNA. [Source](https://www.nature.com/news)

### Analysis & Context
The news items highlight ongoing geopolitical tensions, particularly the situation in Ukraine and the Israeli-Syrian conflict. The significant military support pledged to Ukraine underscores the continued international focus on the conflict. The UN report regarding Israeli actions and the Syrian political transition suggests a complex and potentially destabilizing situation in the region. The Passover observance in Israel, coupled with the ongoing hostage situation in Gaza, underscores the humanitarian dimension of the Israeli-Palestinian conflict. The science news from Nature.com and NASA's focus on inspiring students indicate continued advancements and outreach efforts in the scientific community.
```

## Tips for Best Results

1. **Topic Selection**:
   - Use specific topics rather than broad categories
   - Topic-specific search terms are automatically added for better results

2. **Quality Settings**:
   - Enable strict quality filtering for more reliable sources
   - Add trusted news sources to preferred domains
   - Add known low-quality sources to excluded domains

3. **API Usage**:
   - Adjust maximum search results based on your API quota
   - Set appropriate news items per topic for comprehensive coverage

## Troubleshooting

### Common Issues

1. **No News Generated**:
   - Check API keys
   - Verify scheduled time format
   - Ensure topics are properly configured

2. **Poor Quality Content**:
   - Enable strict quality filtering
   - Add more specific topics
   - Review excluded domains list

3. **API Limits**:
   - Reduce maximum search results
   - Reduce news items per topic
   - Adjust date range settings
  
4. **News Generated Failure**
   - Check whether there is an existing news file
   - Check internet connection
   - Check API keys

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
- Google Cloud Platform
- Contributors and testers

## Changelog

### 1.4.0
- Support Sonar by Perplexity to simplify the API key settings

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
- Optimize news flitering

### 1.1.0
- Simplify configuration options
- Improve summarization and layout

### 1.0.0
- Initial release
- Core news fetching and summarization
- Basic configuration options
