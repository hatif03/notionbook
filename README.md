# Notionbook

> AI-powered research & prototyping – save tabs to Notion, search your workspace, capture screenshots, and prototype with AI. Built for the [Notion AI Challenge](https://www.mlh.com/challenges/019c7180-8a35-606f-2272-93da237b16a2).

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)

## Features

### Notion Integration (via MCP)
- **Save Tabs to Notion** – Turn open browser tabs into Notion tasks with AI-generated titles
- **Search Notion** – Search across Notion, Slack, Jira, Google Drive (with Notion AI)
- **Capture to Notion** – Save page metadata and links to Notion
- **Quick Capture** – Select text and save to Notion with one click
- **Export Prototype to Notion** – Save mockups directly to Notion

### Prototyping
- **Drag & Drop Components** – Add buttons, cards, modals, forms, and more
- **AI Generation** – Describe what you want, let AI create components
- **PNG Export** – Capture mockups as images
- **Blank Canvas** – Start fresh on a clean page

### Multi-Model AI
- **Claude** (Anthropic)
- **Gemini** (Google)
- **Groq** (Llama, Mixtral)

## Quick Start

### Prerequisites

- Node.js 18+
- Chromium-based browser
- At least one AI API key (Claude, Gemini, or Groq) – entered in the extension (BYOK)

### 1. Clone & Install

```bash
git clone https://github.com/raihankhan-rk/prototyper.git
cd prototyper
cd server
npm install
```

### 2. Configure Environment

Create `server/.env` (optional – no AI keys needed; see BYOK below):

```env
PORT=3001
```

### 3. Start Server

```bash
cd server
npm run dev
```

### 4. Load Extension

1. Open `chrome://extensions/`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select the `extension` folder

### 5. Connect & Add API Keys (BYOK)

1. Click the Notionbook icon
2. Enter your API URL (e.g. `http://localhost:3001` or your forwarded URL)
3. Add your AI API keys (Claude, Gemini, or Groq) – keys stay in your browser, never on our servers
4. Click **Save API Keys**, then **Connect to Notion** – complete OAuth in the new tab
5. Choose your AI model and start saving tabs

## Notion AI Challenge Submission

Notionbook uses **Notion MCP** (Model Context Protocol) to integrate with Notion. It demonstrates:

- **Notion MCP** – OAuth 2.0 + PKCE, `notion-search`, `notion-create-pages`
- **Connected sources** – Search across Slack, Jira, Google Drive (with Notion AI plan)
- **AI + browser context** – Claude/Gemini/Groq generate task titles, summaries, tags
- **Market research workflow** – Tabs → tasks, quick capture, research summaries

### Demo Flow

1. Open 10+ research tabs (competitors, docs, pricing pages)
2. Click **Save Tabs to Notion** – AI creates task titles, saves to Notion
3. Select text on any page → **Save to Notion** appears
4. Use **Search Notion** to find related content across workspace
5. **Capture Page to Notion** – save page metadata and link

## Project Structure

```
notionbook/
├── extension/           # Chrome extension
│   ├── manifest.json
│   ├── content.js       # Toolbar, quick capture, capture handler
│   ├── popup.html/js    # Connect, save tabs, search
│   └── ...
├── server/
│   ├── index.ts         # Express + routes
│   ├── mcp/             # Notion MCP client, OAuth, tokens
│   ├── ai/              # Claude, Gemini, Groq provider
│   └── routes/          # Auth, API
└── README.md
```

## BYOK (Bring Your Own Key)

Notionbook uses a BYOK model: **API keys are stored only in your browser** and sent per-request to the server. The server never persists or logs them.

1. Open the extension popup → **API Keys (BYOK)** section
2. Enter your Claude, Gemini, or Groq key (at least one)
3. Click **Save API Keys**
4. Keys are stored in `chrome.storage.local` and included in AI requests

## Environment Variables

| Variable | Purpose |
|---------|---------|
| `NOTION_OAUTH_CLIENT_ID` | Optional – uses dynamic registration if not set |
| `NOTION_OAUTH_CLIENT_SECRET` | Optional |
| `PORT` | Server port (default: 3001) |

## Troubleshooting

- **Not connected to Notion** – Click Connect to Notion and complete OAuth
- **CORS / API URL** – Use forwarded HTTPS URL when not on localhost
- **AI errors** – Add your API key in the extension (Settings → API Keys) and ensure the selected model matches

## License

MIT
