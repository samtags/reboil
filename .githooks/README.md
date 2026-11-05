# Git hooks

This repository's hooks live here so they can be versioned with the project.

Enable them for a checkout with:

```sh
git config core.hooksPath .githooks
```

The `pre-commit` hook runs the Cypress E2E suite. A failing suite returns a non-zero exit code, so Git cancels the commit.
