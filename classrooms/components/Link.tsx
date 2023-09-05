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
  elemRef?: Ref<HTMLAnchorElement>
  children?: ComponentChildren
}
export function Link ({
  view,
  class: className = '',
  children,
  elemRef
}: LinkProps) {
  const onView = useContext(OnView)
  return (
    <a
      href={view ? '?' : undefined}
      class={`internal-link ${className}`}
      ref={elemRef}
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
