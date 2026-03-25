# NotionBook — PM Prototyper + Notion MCP

> Chrome extension for **product managers**: overlay UI mockups on any site with AI, pull **PRD context** from Notion, gather **GitHub / Slack–indexed context** via Notion search (when those integrations are connected in your workspace), and **push structured prototype captures** to Notion through a **server-side Notion MCP** client ([Notion MCP client guide](https://developers.notion.com/guides/mcp/build-mcp-client)).

Built for workflows like the [MLH Notion AI Challenge](https://www.mlh.com/challenges/019c7180-8a35-606f-2272-93da237b16a2): **Notion is the hub**; this repo adds **OAuth + PKCE** to `https://mcp.notion.com` and uses MCP tools (`notion-search`, `notion-fetch`, `notion-create-pages`) from Node.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Version](https://img.shields.io/badge/version-1.2.0-green.svg)

## Features

- **Visual prototyping** — Drag-and-drop library, styling, layers, blank canvas, PNG export (same core as the original Prototyper).
- **AI components (BYOK)** — **Anthropic (Claude)**, **Groq**, or **Google Gemini**; choose provider and paste your API key in the extension popup. Keys stay in the browser; the server only uses them for the request (optional server-side env fallbacks for headless use).
- **Notion MCP (server)** — OAuth 2.0 + PKCE, dynamic client registration, Streamable HTTP with SSE fallback.
- **Notion tab (extension)** — Connect Notion (opens `/auth/notion`), **Pull PRD context for AI**, **Pull dev context** (semantic search over workspace + connected sources), **Push capture to Notion** (PRD-shaped page + optional screenshot as page cover via ephemeral URL).
- **PM presets** — User story, acceptance criteria, roadmap row, decision log blocks in the component library.
- **Optional API key** — Set `EXTENSION_API_KEY` on the server and the same value in the extension popup for `/api/*` routes.

## Architecture

- **Extension** — Talks only to **your** Express server (`apiUrl` + optional `X-API-Key`). Never holds Notion tokens.
- **Server** — Stores OAuth tokens under `server/.data/` (gitignored). Calls Notion MCP with `Authorization: Bearer <access_token>` and refreshes tokens (including rotated refresh tokens).

## Quick start

### Prerequisites

- Node.js 18+
- Chromium browser
- An API key for at least one LLM provider (stored in the extension for BYOK, or in `.env` on the server)
- Notion workspace where you can complete OAuth for MCP

### 1. Server

```bash
cd server
npm install
cp .env.example .env
```

Edit `server/.env`:

| Variable | Purpose |
|----------|---------|
| `ANTHROPIC_API_KEY` | Optional server-side Claude key (if not using BYOK) |
| `GROQ_API_KEY` | Optional Groq key |
| `GEMINI_API_KEY` (or `GOOGLE_AI_API_KEY`) | Optional Gemini key |
| `PORT` | Default `3001` |
| `BASE_URL` | Public URL of this server (used for **cover image** links in Notion). Use the same host you use in the browser (e.g. forwarded `https://…`). |
| `NOTION_OAUTH_REDIRECT_URI` | Must be exactly `http://localhost:3001/auth/notion/callback` locally, or `https://<your-host>/auth/notion/callback` in production. |
| `EXTENSION_API_KEY` | Optional; if set, required on extension requests as `X-API-Key`. |

```bash
npm run dev
```

### 2. Port forwarding (remote / HTTPS)

If the extension loads pages on `https://` but your API is local, forward **3001** as **Public** and set **both** the extension **Backend API URL** and **`BASE_URL`** in `.env` to that HTTPS origin so Notion can fetch cover images.

### 3. Load the extension

1. `chrome://extensions/` → Developer mode → **Load unpacked** → select the `extension` folder.
2. Open the popup: set **Backend API URL**, **AI provider**, and **LLM API key** (BYOK), plus **Extension API key** if you enabled it on the server.
3. On a tab, **Open Toolbar** → **Notion** tab → **Connect Notion** → finish OAuth in the new tab → **Refresh status**.

### 4. Demo flow (PM)

1. **Pull PRD context for AI** — Uses `notion-search` + `notion-fetch` from your query (feature title).
2. **Pull dev context** — Uses `notion-search` over the workspace; includes **GitHub / Slack** hits when those are [connected to Notion](https://www.notion.so/help/guides/category/integrations) in your workspace.
3. **Generate** (AI tab) — Optionally includes PRD + dev context in the prompt.
4. **Push capture to Notion** — Creates a page via `notion-create-pages` with problem, metrics, URL, notes, optional **Engineering / Slack highlights**, and optional **screenshot cover**.

## API (server)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/health` | — | Health check |
| GET | `/api/exports/:token` | — | Ephemeral PNG (cover); short TTL |
| GET | `/auth/notion` | — | Start OAuth |
| GET | `/auth/notion/callback` | — | OAuth redirect |
| GET | `/api/notion/status` | Optional key | `{ connected, workspaceHint? }` |
| POST | `/api/notion/disconnect` | Optional key | Clears stored tokens |
| POST | `/api/notion/push-prototype` | Optional key | MCP create page |
| POST | `/api/notion/context-for-prompt` | Optional key | MCP search + fetch snippet |
| POST | `/api/notion/dev-context` | Optional key | MCP search summary + links |
| POST | `/api/generate-component` | Optional key | UI generation via Anthropic, Groq, or Gemini (`llmProvider`, `llmApiKey`, optional `llmModel` in JSON body) |

## Security notes

- **BYOK:** LLM keys in the extension are sent to **your** server over HTTPS (or localhost) on each generate request; they are **not** written to disk on the server. Use a server you trust, or run locally.
- Treat `server/.data/notion-tokens.json` as **secret**; do not commit it.
- Prefer **HTTPS** in production; set `NOTION_OAUTH_REDIRECT_URI` to match.
- Notion access tokens expire (~1h); the server refreshes and **persists new refresh tokens** when rotated.

## Development

- **Server hot reload:** `npm run dev` (tsx watch).
- **Extension reload:** Refresh the extension on `chrome://extensions/` after edits.
- **Production build:** `cd server && npm run build && npm run serve` (runs `node dist/index.js`).

## Project structure

```
notionbook/
├── extension/       # Chrome MV3 extension (content script, popup)
├── server/          # Express + Anthropic + Notion OAuth + MCP client
│   ├── .data/       # OAuth token store (created at runtime, gitignored)
│   └── tsconfig.json
└── README.md
```

## Troubleshooting

- **Notion: not connected** — Complete **Connect Notion** from the toolbar; ensure `NOTION_OAUTH_REDIRECT_URI` matches the URL you opened.
- **401 / Unauthorized** — Set `EXTENSION_API_KEY` in `.env` and the same value in the popup, or remove the env var for local dev.
- **Cover image missing in Notion** — `BASE_URL` must be reachable from the internet (use a public forwarded URL, not `http://localhost` from Notion’s servers).
- **Empty GitHub/Slack in dev context** — Connect those integrations in **Notion workspace settings** so semantic search can see them.

## License

MIT — see [LICENSE](LICENSE).

## Acknowledgments

- [Anthropic Claude](https://www.anthropic.com/), [Notion MCP](https://developers.notion.com/guides/mcp/build-mcp-client), [Model Context Protocol SDK](https://github.com/modelcontextprotocol/typescript-sdk).
- Original visual prototyper foundation: [Prototyper](https://github.com/raihankhan-rk/prototyper).
