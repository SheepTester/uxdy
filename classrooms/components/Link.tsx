/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { JSX, ComponentChildren, Ref } from 'preact'
import { useContext } from 'preact/hooks'
import { OnView, View } from '../View.ts'

export type LinkProps = {
  view: View | null
  class?: string
  style?: JSX.CSSProperties | string
  ref?: Ref<HTMLAnchorElement>
  children?: ComponentChildren
}
export function Link ({
  view,
  class: className = '',
  children,
  ref
}: LinkProps) {
  const onView = useContext(OnView)
  return (
    <a
      href={view ? '?' : undefined}
      class={className}
      ref={ref}
      onClick={e => {
        e.preventDefault()
        if (view) {
          onView(view)
        }
      }}
    >
      {children}
    </a>
  )
}
