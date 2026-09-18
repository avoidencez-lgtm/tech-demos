# Jev Ultrafast playground

Interactive demo of [Browser Use Jev Ultrafast](https://github.com/browser-use/jev-ultrafast) (MIT): a browser agent that turns the live page into an indexed action space, then lets TypeSafe Jev pick **operation + target in one request**.

Inspired by [Tony Simons’ bookmark](https://x.com/tonysimons_/status/2100656340817633313). Headline claim from the upstream repo: Zürich → London on Google Flights in **7.1s**, with median browser protocol calls **1,092 → 101**.

This playground is offline. There is no live browser automation and no API key.

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

## What to click

1. **Start demo** / **Choose next** — walk one TypeSafe decision at a time.
2. **Run automatically** — replay the mocked Zürich → London search.
3. Watch the numbered DOM table, speculative `operation` / `click_target` / `type_text_target` heads, and the small text helper on `TYPE_TEXT`.
4. Use the timeline to jump to any observation.
5. **Compare** — side-by-side protocol-call bars for a naive per-step agent (screenshots + AX tree + plan-then-locate) versus Jev (one snapshot, one request).

The counters land on the published medians: **1,092 vs 101** calls, **9.450 s vs 7.092 s**, **22 vs 17** model requests. This is a teaching mock of one task, not a live benchmark.
