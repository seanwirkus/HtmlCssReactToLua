# HTML/CSS/React to Lua

A Vite/React tool for transpiling React JSX plus HTML/CSS-style layout into Roblox Luau GUI code.

## What is inside

- React/Vite app entry points in `App.tsx`, `main.tsx`, and `index.html`.
- Babel-powered JSX parsing via `@babel/standalone`.
- A sample JSX input in `Sample JSX files/keeper-phone-v3.jsx`.
- TypeScript configuration and a previous iteration under `v0.01/`.
- Build output in `dist/`.

## Development

```bash
npm install
npm run dev
```

Build and type-check:

```bash
npm run typecheck
npm run build
```

## Status

Experimental developer tool for Roblox UI generation.
