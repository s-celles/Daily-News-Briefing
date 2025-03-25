# Daily News Briefing for Obsidian

Get AI-powered daily news summaries directly in your Obsidian vault. Stay informed about your topics of interest with smart, automated news collection and summarization.

## Features

- 🤖 AI-powered news summarization using Google's Gemini 2.0 Flash model
- 📅 Automated daily news collection
- 🎯 Customizable topics and news sources
- 🔍 Advanced multi-phase search strategy with quality scoring
- 📊 Detailed or concise summary formats
- 🎨 Beautiful, theme-aware formatting
- ⚡ API usage optimization
- 🏷️ Quality-based news filtering
- 📂 Organized news archive with table of contents

## Prerequisites

To use this plugin, you'll need:

1. A Google Custom Search API key
2. A Custom Search Engine ID
3. A Google Gemini API key

## Installation

1. Open Obsidian Settings
2. Go to Community Plugins and disable Safe Mode
3. Click Browse and search for "Daily News Briefing"
4. Install the plugin
5. Enable the plugin in your list of installed plugins

## Configuration

### Essential Settings

1. **API Keys**: 
   - Enter your Google API Key
   - Enter your Search Engine ID
   - Enter your Gemini API Key

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
# Daily News - 2024-02-25

## Table of Contents
- [Technology](#technology)
- [World News](#world%20news)

## Technology

### Key Developments
- **AI Breakthrough**: Researchers at MIT demonstrated a new quantum processor achieving 24x processing speed improvements with their 128-qubit system. [Nature](https://nature.com/article)
- **Intel Expands Production**: Intel announced a 15% increase in chip production capacity with a $20 billion investment in Arizona facilities, creating 3,000 jobs by 2025. [Reuters](https://reuters.com/article)

### Analysis & Context
The quantum computing advancements represent a significant step toward practical quantum advantage in molecular simulation applications. This comes as competition intensifies between IBM, Google, and newer startups in the quantum space.

### Notable Data Points or Quotes
• "This benchmark represents a critical threshold for quantum utility in real-world applications" — Dr. Sarah Chen, Lead Researcher
• 128-qubit system demonstrated stable operations for 300 microseconds, a 4x improvement over previous systems

## World News

**Climate Agreement**: EU announces new carbon reduction targets of 55% by 2030, affecting industrial sectors including steel, cement, and energy production. [Reuters](https://reuters.com/article)
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
   - Check internet connection (VPN is required for Gemini)
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

### 1.1.0
- Simplify configuration options
- Improve summarization and layout

### 1.0.0
- Initial release
- Core news fetching and summarization
- Basic configuration options
