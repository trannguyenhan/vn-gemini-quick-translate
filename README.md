# Gemini Quick Translate

A modern Chrome extension for quick and accurate text translation using Google's Gemini AI. Translate text instantly with support for 15+ languages and a beautiful, user-friendly interface.

## ✨ Features

- 🚀 **Quick Translation**: Translate text instantly using Gemini AI
- 🌍 **15+ Languages**: Support for Vietnamese, English, Chinese, Japanese, Korean, French, German, Spanish, Italian, Portuguese, Russian, Thai, Indonesian, Malay, Hindi, and more
- 🎨 **Modern UI**: Beautiful gradient design with smooth animations
- ⌨️ **Keyboard Shortcut**: Quick access with `Alt+Q` (or `Alt+Q` on Mac)
- 📋 **Text Selection**: Automatically capture selected text on the page
- ⚙️ **Customizable**: Choose your preferred Gemini model (2.5-flash, 2.5-pro, or custom)
- 🔒 **Secure**: API keys stored locally in browser storage
- 🎯 **Accurate**: High-quality translations with concise, meaning-preserving results

## 📦 Installation

### From Source

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in the top right)
4. Click "Load unpacked"
5. Select the project folder

### Requirements

- Google Chrome or Chromium-based browser
- Gemini API Key (get one from [Google AI Studio](https://makersuite.google.com/app/apikey))

## 🚀 Getting Started

### Initial Setup

1. **Get Your API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key
   - Copy the API key

2. **Configure the Extension**:
   - Click the extension icon in your browser toolbar
   - Click "Open Options" (if API key is not set)
   - Enter your Gemini API Key
   - Select your preferred Gemini model
   - Click "Save Settings"

3. **Start Translating**:
   - Select text on any webpage
   - Press `Alt+Q` or click the extension icon
   - Choose your target language
   - Click "Translate with Gemini"

## 🎯 Usage

### Method 1: Text Selection + Keyboard Shortcut
1. Select text on any webpage
2. Press `Alt+Q` (or `Alt+Q` on Mac)
3. The selected text will appear in the popup
4. Choose target language and click "Translate"

### Method 2: Manual Input
1. Click the extension icon
2. Type or paste text into the input field
3. Select target language
4. Click "Translate with Gemini" or press `Enter`

### Method 3: Enter Key
- Type text in the input field
- Press `Enter` to translate (Shift+Enter for new line)

## ⚙️ Configuration

### Options Page

Access the options page by:
- Right-clicking the extension icon → "Options"
- Clicking "Options" button in the popup settings section
- Navigating to `chrome://extensions/` → Find extension → "Options"

### Settings Available

- **API Key**: Your Gemini API key
- **Gemini Model**: Choose from:
  - `gemini-2.5-flash` (Fast, requires access)
  - `gemini-2.5-pro` (High quality, requires access)
  - Custom model name

### Target Languages

The extension supports translation to:
- Vietnamese
- English
- Chinese
- Japanese
- Korean
- French
- German
- Spanish
- Italian
- Portuguese
- Russian
- Thai
- Indonesian
- Malay
- Hindi

## ⌨️ Keyboard Shortcuts

- `Alt+Q` (Windows/Linux/Mac): Open extension popup with selected text

## 🎨 Features in Detail

### Modern UI Design
- Beautiful gradient background
- Smooth animations and transitions
- Responsive layout
- Clean, intuitive interface

### Smart Translation
- Concise, accurate translations
- Preserves complete meaning
- No unnecessary explanations
- Fast response times

### Security & Privacy
- API keys stored locally
- No data sent to third parties
- Direct communication with Gemini API
- Clear API key option available

## 🔧 Troubleshooting

### "API Key is not set" Error
- Go to Options and enter your Gemini API key
- Make sure the API key is valid and has proper permissions

### Translation Not Working
- Check your internet connection
- Verify your API key is correct
- Ensure you have access to the selected Gemini model
- Check browser console for error messages

### Model Access Issues
- Some models (2.5-flash, 2.5-pro) require special access
- Use `gemini-pro` or a custom model if you don't have access
- Check [Google AI Studio](https://makersuite.google.com/app/apikey) for model availability

### Extension Not Responding
- Reload the extension in `chrome://extensions/`
- Check if the extension is enabled
- Try clearing and re-entering your API key

## 📁 Project Structure

```
vn-gemini-quick-translate/
├── manifest.json          # Extension manifest
├── background.js          # Background service worker
├── popup.html             # Popup UI
├── popup.js               # Popup logic
├── options.html           # Options page UI
├── options.js             # Options page logic
├── icons/                 # Extension icons
│   ├── 16.png
│   ├── 48.png
│   └── 128.png
└── README.md              # This file
```

## 🔐 Privacy & Security

- All API keys are stored locally in your browser
- No data is collected or transmitted to third parties
- Direct API communication with Google's Gemini service
- You can clear your API key at any time from the popup

## 🛠️ Development

### Technologies Used
- Vanilla JavaScript (ES6+)
- Chrome Extension Manifest V3
- Google Gemini API
- Modern CSS with animations

### Browser Compatibility
- Chrome 88+
- Edge 88+
- Other Chromium-based browsers

## 📝 License

This project is open source and available for personal and commercial use.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📧 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review Chrome extension console for errors
3. Verify API key and model access

## 🎉 Acknowledgments

- Built with Google's Gemini AI
- Modern UI inspired by Material Design principles

---

**Made with ❤️ for quick and accurate translations**

