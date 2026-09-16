# Magnitude Model Profiler

Interactive playground inspired by [Magnitude](https://github.com/magnitudedev/magnitude) and this bookmark:

https://x.com/akshay_pachaar/status/2095906342154424750

Pick a hardware profile, see local-model configs ranked across **Speed**, **Accuracy**, **Intelligence**, and **Memory**, then optionally pair a pick with an agent harness (Pi, OpenCode, Claude Code, Codex, and others).

This is a simulated demo. It does **not** run a local LLM or the Magnitude CLI. Hardware presets and rankings are mocked so you can try the idea in the browser.

## Run locally

```bash
npm install && npm run dev
```

Then open the URL Vite prints (usually http://localhost:5173).

```bash
npm run build    # typecheck + production build
npm run preview  # serve the built app
```

## What you can do

1. Choose a machine preset (MacBook Air M2 16GB, MacBook Pro M4 Max, gaming PC + RTX, cloud A100).
2. Nudge RAM / GPU a little and watch fit + tok/s estimates update.
3. Drag Fastest ↔ Smartest to re-rank the catalog.
4. Select a model and a harness to see a mock config snippet.

No Cloudflare preview is wired for this app; running locally is enough.
