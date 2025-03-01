# Daily News Briefing for Obsidian

Get AI-powered daily news summaries directly in your Obsidian vault. Stay informed about your topics of interest with smart, automated news collection and summarization.

## Features

- 🤖 AI-powered news summarization using Google's Gemini
- 📅 Automated daily news collection
- 🎯 Customizable topics and news sources
- 🔍 Smart content filtering and relevance scoring
- 📊 Detailed or concise summary formats
- 🎨 Beautiful, theme-aware formatting
- ⚡ API usage optimization
- 🏷️ Keyword highlighting
- 📂 Organized news archive

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
   - Customize topic-specific search phrases

3. **Schedule**: 
   - Set your preferred time for daily news generation
   - Choose your archive folder location

### Advanced Settings

- **Content Quality**:
  - Set minimum relevance scores
  - Configure preferred/excluded domains
  - Customize content filtering rules

- **Output Format**:
  - Choose between detailed or concise summaries
  - Enable/disable keyword highlighting
  - Customize metadata inclusion

- **API Usage**:
  - Enable API call conservation
  - Set daily API call limits
  - Configure retry settings

## Usage

### Automatic Mode

1. Configure your settings
2. The plugin will automatically generate news at your scheduled time
3. Find your daily news in the specified archive folder

### Manual Generation

1. Use the command palette (Ctrl/Cmd + P)
2. Search for "Generate News Now"
3. Click to generate news immediately

### Reading Your News

- News is organized by topics
- Each topic includes:
  - Key developments
  - Source links
  - AI-generated analysis
  - Relevant quotes and data
  - Highlighted keywords (if enabled)

## Example Output

```markdown
# Daily News - 2024-02-25

## Technology

**AI Breakthrough**: Researchers at MIT demonstrated a new quantum processor achieving significant improvements in processing speed. [Nature](https://nature.com/article)

**Key Points**:
- 128-qubit system demonstrated
- 24x performance increase
- Applications in molecular simulation

## World News

**Climate Agreement**: EU announces new carbon reduction targets, affecting industrial sectors. [Reuters](https://reuters.com/article)

**Analysis**: This development signals a significant shift in European climate policy...
```

## Tips for Best Results

1. **Topic Selection**:
   - Use specific topics rather than broad categories
   - Include relevant keywords for better targeting

2. **API Conservation**:
   - Enable API call conservation for optimal usage
   - Adjust news per topic based on your needs

3. **Content Quality**:
   - Add reliable sources to preferred domains
   - Adjust relevance scores as needed

## Troubleshooting

### Common Issues

1. **No News Generated**:
   - Check API keys
   - Verify scheduled time format
   - Ensure topics are properly configured

2. **Poor Quality Content**:
   - Increase relevance score
   - Add more specific search phrases
   - Review excluded domains

3. **API Limits**:
   - Enable API conservation
   - Reduce topics or news per topic
   - Adjust schedule frequency

## Support

If you encounter issues or have suggestions:

1. Check the [GitHub Issues](https://github.com/adamchen/obsidian-daily-news/issues)
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

### 1.0.0
- Initial release
- Core news fetching and summarization
- Basic configuration options
