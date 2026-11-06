'use client'

import { createElement, Fragment, type ReactNode } from 'react'
import type { ReboilConfig } from './config'

export interface ReboilStateProps {
  config: ReboilConfig
  children: ReactNode
}

export function ReboilState({ children }: ReboilStateProps) {
  return createElement(Fragment, null, children)
}
