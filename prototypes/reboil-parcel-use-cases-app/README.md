# Reboil use-cases lab

An interactive browser lab for Reboil's core state behaviors, with matching Cypress coverage.

From the repository root:

```sh
npm install
npm run dev --workspace reboil-parcel-use-cases-app
```

Open `http://127.0.0.1:4173` to use the controls manually.

Run the automated checks with:

```sh
npm run test:e2e --workspace reboil-parcel-use-cases-app
```

The persistence case uses browser `localStorage`. Cypress clears it before each case and then reloads during the exclusion assertion.
