# Reboil documentation

The Reboil developer and agent documentation site is built with [Docusaurus](https://docusaurus.io/) 3.10.2. Documentation content lives in Markdown under `docs/`; the landing page is a small React page under `src/pages/`.

## Installation

```bash
npm install
```

The scaffold uses npm and requires Node.js 20 or newer.

## Local Development

```bash
npm run start
```

This starts the Docusaurus development server at `http://localhost:3000` with hot reload.

## Build

```bash
npm run build
```

The build is emitted to `build/` and can be served by any static hosting provider.

Machine-readable resources are kept in `static/`: `llms.txt`, `llms-full.txt`, `docs.json`, and the downloadable Reboil skill.
