---
title: Quick start
sidebar_position: 2
---

# Quick start

Define the application state and export its inferred bindings from one module:

```ts title="store.ts"
import {createStore} from 'reboil';

const app = {
  user: {name: 'Ada'},
  settings: {compact: false},
};

export const {store, useStore} = createStore(app);
```

Import the typed hook from that module in a component:

```tsx title="Profile.tsx"
import {useStore} from '@/store';

export function Profile() {
  const name = useStore('user.name');
  return <p>{name}</p>;
}
```

The inferred type of `app` flows through the returned bindings. `useStore('user.name')` returns a `string`, and an editor suggests valid paths as you type.

There is no separate registration import, generation command, React Context, Provider, store prop, or store parameter.

## Optional configuration registration

Teams that prefer direct package imports can use the one-time initializer:

```sh
npx reboil init
```

This is setup, not recurring type generation. See the [optional config registration guide](../concepts/store-creation#optional-config-registration) for the planned flow.
