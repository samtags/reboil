import { describe, expect, it } from 'vitest'
import { Fragment } from 'react'
import { defineConfig } from '../src/config'
import { ReboilState } from '../src/next'

describe('reboil/next', () => {
  it('accepts the standard config object and renders application children', () => {
    const config = defineConfig({ stateFile: './src/state.ts' })
    const element = ReboilState({ config, children: 'content' })

    expect(element.type).toBe(Fragment)
    expect(element.props.children).toBe('content')
  })
})
