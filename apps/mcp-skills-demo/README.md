# Skills over MCP

Interactive playground for the MCP skills extension: connect a server, discover its catalog, inspect skill metadata, then load `SKILL.md` only when needed.

Inspired by [Daniel San’s note](https://x.com/dani_avila7/status/2099325795822956575) on [SEP-2640](https://github.com/modelcontextprotocol/modelcontextprotocol/blob/main/seps/2640-skills-extension.md) (`io.modelcontextprotocol/skills`).

## Run locally

From this folder:

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

```bash
npm run build    # production bundle in dist/
npm run preview  # serve the built files
```

No live MCP server is required. Four mocked skills (`git-workflow`, `pr-review`, `incident-response`, `expense-policy`) sit behind a fake JSON-RPC client so the flow is playable offline.

## What to click

1. **Connect MCP server** — `initialize` advertises the skills extension.
2. **Discover available skills** — `resources/read` on `skill://index.json`.
3. Click a skill — metadata only (`name`, `description`, `mimeType`, `_meta`).
4. **Load SKILL.md** — `resources/read` pulls the markdown into context.

The context meter stays small after discovery and grows only when a body is loaded. Expand a protocol-log row to see the mocked request and response.
