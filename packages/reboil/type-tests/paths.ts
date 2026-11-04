import { createStore } from '../src'

if (false) {
  const app = {
    user: { name: 'Ada', active: true },
    todos: [{ title: 'Ship Reboil', completed: false }],
  }

  const { store, useStore } = createStore(app, { id: `types-${Math.random()}` })

  const name: string = store.get('user.name')
  const completed: import('../src/types').PathValue<typeof app, 'todos.0.completed'> = false
  const completedPath: Parameters<typeof useStore>[0] = 'todos.0.completed'
  store.set('user.name', 'Grace')
  store.set('user.name', (previous) => `${previous}!`)
  store.set('todos.0.completed', true)

  void name
  void completed
  void completedPath

  // @ts-expect-error invalid path
  store.get('user.missing')
  // @ts-expect-error invalid hook path
  const invalidHookPath: Parameters<typeof useStore>[0] = 'todos.0.missing'
  // @ts-expect-error invalid value
  store.set('user.active', 'yes')
  void invalidHookPath
}

