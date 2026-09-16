# tech-demos

Morning tech demos built from X bookmarks.

Each approved pick lands in `apps/<slug>/` as a small interactive demo. Pull requests get Cloudflare preview deploys so you can try the tech yourself.

## Layout

```
apps/
  magnitude-model-profiler/   # Magnitude-inspired local model ranking playground
  <slug>/                     # one demo per folder
```

## Workflow

1. Tech Demos bot scans X bookmarks
2. You Approve a pick
3. A Cursor cloud agent implements the demo under `apps/<slug>/`
4. Preview link arrives with screenshots / video

## Cloudflare

Connect this repo to Cloudflare Pages (or Workers) so each PR gets a preview URL. Point the build at the demo app path for that PR, or use a root aggregator that lists `apps/*`.
