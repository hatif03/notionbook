# Prototyper 🎨

> A powerful Chrome extension for visual prototyping - overlay and edit UI components on any website with AI-powered generation.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## ✨ Features

- **🎯 Drag & Drop Components** - Add buttons, cards, modals, forms, and more
- **🎨 Real-time Styling** - Adjust colors, sizes, fonts, spacing instantly
- **🤖 AI Generation** - Describe what you want, let AI create components
- **📸 PNG Export** - Capture your mockups as high-quality images
- **💾 Save & Load** - Persist your prototypes across sessions
- **🎭 Blank Canvas** - Start fresh with a clean prototyping page
- **🌙 Modern UI** - Beautiful Shadcn-inspired dark theme

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ installed
- Chromium based browser
- Anthropic API key (for AI features)

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/raihankhan-rk/prototyper.git
cd prototyper
```

#### 2. Set Up the Backend Server

```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:

```env
ANTHROPIC_API_KEY=your_api_key_here
PORT=3001
```

Start the server:

```bash
npm run dev
```

The server will run on `http://localhost:3001`

#### 3. Port Forwarding (for Local Development/Usage)

You'll need to forward port 3001 since browsers don't let websites make API request to local endpoints via http:

**VS Code / Cursor:**
1. Open the **Ports** panel (View → Command Palette → "Ports: Focus on Ports View")
2. Click **"Forward a Port"**
3. Enter `3001`
4. Set visibility to **Public** (right-click port → Port Visibility → Public)
5. Copy the forwarded URL (e.g., `https://your-workspace-3001.preview.app.github.dev`)
6. Use this URL in the extension settings

**GitHub Codespaces:**
- Ports are automatically forwarded
- Click the **Ports** tab to see forwarded URLs
- Make port 3001 **Public** for external access

**Other IDEs:**
- Check your IDE's documentation for port forwarding
- Ensure port 3001 is accessible externally

#### 4. Load the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select the `extension` folder from this project
5. The Prototyper extension should now appear in your extensions

#### 5. Configure the Extension

1. Click the Prototyper extension icon
2. Enter your backend API URL:
   - Your forwarded URL (e.g., `https://your-workspace-3001.preview.app.github.dev`)
3. Click **"Open Toolbar"**

## 📖 Usage

### Basic Workflow

1. **Open any website** you want to prototype on
2. **Click the extension icon** and open the toolbar
3. **Add components** from the component library
4. **Drag and resize** components to position them
5. **Style components** using the style panel
6. **Generate with AI** by describing what you need
7. **Export as PNG** when ready to share

### Using the Blank Canvas

1. Open the toolbar
2. Scroll to **"Blank Canvas"** section
3. Choose background color and size
4. Click **"📄 Open in New Tab"**
5. Start prototyping on a clean slate!

### Keyboard Shortcuts

- **Delete/Backspace** - Delete selected component
- **Click component** - Select and edit
- **Drag edges** - Resize component

## 🛠️ Development

### Project Structure

```
prototyper/
├── extension/          # Chrome extension files
│   ├── manifest.json   # Extension manifest
│   ├── content.js      # Main extension logic
│   ├── content.css     # Styling
│   ├── popup.html      # Extension popup UI
│   ├── popup.js        # Popup logic
│   ├── canvas.html     # Blank canvas page
│   └── icons/          # Extension icons
├── server/             # Backend API
│   ├── index.ts        # Express server + AI integration
│   ├── package.json    # Dependencies
│   └── .env           # Environment variables (create from .env.example)
└── README.md
```

### Tech Stack

**Extension:**
- Vanilla JavaScript
- CSS3 with modern design patterns
- Chrome Extension Manifest V3
- html2canvas for PNG export

**Backend:**
- Node.js + TypeScript
- Express.js
- Anthropic Claude API
- CORS enabled

### Local Development Tips

1. **Hot Reload Extension**: After making changes to extension files, go to `chrome://extensions/` and click the refresh icon on the Prototyper card

2. **Server Auto-Reload**: The server uses `tsx watch` for automatic reloading on file changes

3. **Debugging**:
   - Extension: Right-click extension icon → Inspect popup OR inspect the page and check console
   - Server: Check terminal output where server is running

### Environment Variables

Create a `.env` file in the `server` directory:

| Variable | Description | Default |
|----------|-------------|---------|
| `ANTHROPIC_API_KEY` | Your Anthropic API key | Required |
| `PORT` | Server port | 3001 |

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute

- 🐛 **Report bugs** - Open an issue with details and reproduction steps
- 💡 **Suggest features** - Share your ideas in the issues section
- 📝 **Improve docs** - Help make documentation clearer
- 🔧 **Submit PRs** - Fix bugs or add new features

### Contribution Guidelines

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Make your changes** and test thoroughly
4. **Commit with clear messages** (`git commit -m 'Add amazing feature'`)
5. **Push to your fork** (`git push origin feature/amazing-feature`)
6. **Open a Pull Request** with a clear description

### Code Style

- Use consistent indentation (2 spaces)
- Add comments for complex logic
- Test your changes in Chrome before submitting
- Attach screenshots and Loom videos in your PR showcasing your changes
- Ensure the server runs without errors


## 🐛 Troubleshooting

### Extension Issues

**Extension context invalidated:**
- Reload the extension in `chrome://extensions/`
- Refresh the webpage

**Components not styling correctly:**
- Check browser console for errors
- Ensure you're clicking "Apply" or using controls properly

**AI generation not working:**
- Verify server is running (`http://localhost:3001/health` should return OK)
- Check API URL in extension popup
- Ensure `.env` has valid `ANTHROPIC_API_KEY`
- Check server terminal for error messages

### Server Issues

**Port already in use:**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9
```

**Module not found:**
```bash
cd server
rm -rf node_modules package-lock.json
npm install
```

**API authentication error:**
- Double-check your `ANTHROPIC_API_KEY` in `.env`
- Ensure no extra spaces or quotes around the key
- Get a valid key from https://console.anthropic.com/

### Port Forwarding Issues

**Remote development not working:**
- Ensure port 3001 is forwarded AND public
- Use HTTPS URL (not HTTP) for forwarded ports
- Check firewall settings in your cloud IDE

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Anthropic Claude](https://www.anthropic.com/) for AI generation
- UI inspired by [Shadcn](https://ui.shadcn.com/)
- Icons from emoji set

## 📞 Support

- 🐛 **Bug reports**: [Open an issue](https://github.com/raihankhan-rk/prototyper/issues)
- 💬 **Questions**: [Start a discussion](https://github.com/raihankhan-rk/prototyper/discussions)
- 📧 **Email**: hello@raihankhan.dev

## 🗺️ Roadmap

- [ ] Component library expansion
- [ ] Collaboration features (Live Share)
- [ ] Export to Figma/Sketch
- [ ] React/Vue component code generation
- [ ] Component templates marketplace
- [ ] Multi-page mockups

---

Star ⭐ this repo if you find it helpful!

