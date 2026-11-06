# Reboil Parcel config-registration lazy-store example

This example keeps the window visibility setting in the initial bundle and loads the counter window state from a separate JavaScript chunk only when the window is shown. The visibility path is excluded from persistence, so refreshing always closes the counter window.

From the repository root:

```sh
npm install
npm run typecheck --workspace reboil-parcel-config-lazy-app
npm run dev --workspace reboil-parcel-config-lazy-app
```

The code-splitting boundary lives in `src/state.ts`:

```ts
export const state = {
  settings: {
    showCounterWindow: false,
  },
  window: lazy(() => import('./window-state')),
}
```

`window-state.ts` default-exports `createStore({ count: 0 })`. Because `CounterWindow` is not rendered while `settings.showCounterWindow` is false, `useStore('window.count')` is not called and Parcel does not request that chunk. Clicking the top-right button renders the component beneath Suspense and starts the import.

A production build emits `window-state.[hash].js` separately from the main application bundle.
