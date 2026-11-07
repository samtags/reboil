# Production package projects

These standalone projects verify `@reboil/store@1.1.0` from the npm registry against one current supported setup for each web integration:

- `vanilla`: Vite 8 with TypeScript
- `react`: Vite 8 with React 19 and TypeScript
- `next`: Next.js 16 App Router with React 19 and TypeScript

Each project exposes the same persisted counter and can be checked independently:

```sh
npm install
npm run typecheck
npm run build
```

Run `npm run dev` to verify that the counter persists across a browser reload. `npm run reboil:init` should report that the existing Reboil setup is already initialized without changing files.
