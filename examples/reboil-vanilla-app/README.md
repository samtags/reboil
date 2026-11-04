# Reboil vanilla JavaScript example

This example uses Reboil from a plain JavaScript Parcel app. It demonstrates synchronous writes and a path-level subscription without React.

From the repository root:

```sh
npm install
npm run dev --workspace reboil-vanilla-app
```

The app uses `store.subscribe('count', (value, lastValue) => {})` to update the DOM whenever the count changes. The returned unsubscribe function is also shown in `src/main.js`.

The code panel below the interaction can switch between JavaScript and TypeScript examples and copy the active snippet to the clipboard.

## Typography

The example keeps the provided brand typography local in `src/assets/fonts`:

- Headings and titles: `Maragsa Display 400.otf` → `Maragsa Display`
- Subheadings and navigation: `LibreFranklin-VariableFont_wght.ttf` → `Libre Franklin`
- Body copy: `Helvena-Regular.woff2` → `Helvena`
