# Reboil Parcel example

This is a small browser React app using the local Reboil package.

From the repository root:

```sh
npm run build --workspace @reboil/store
npm install
npm run dev --workspace reboil-parcel-app
```

Open the local Parcel URL, click the actions, and watch the browser console for Reboil’s development logs. The counter, action label, and theme are independent path subscriptions; writes use `setStore` from `@reboil/store/react`.
