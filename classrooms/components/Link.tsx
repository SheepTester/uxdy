/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { JSX, ComponentChildren, Ref } from 'preact'
import { useContext } from 'preact/hooks'
import { OnView, View, viewFromUrl, viewToUrl } from '../View.ts'

/**
 * Only look back two entries. This allows for exiting `/building/room` with the
 * close button. But if, say, the history is quirked up and the default view is
 * much further back in history, then this won't jump all the way back (which
 * might be confusing).
 */
const MAX_BACK = 2

export function navigate (view: View, back = false): void {
  const destination = viewToUrl(view)
  const previous = Array.isArray(window.history.state?.previous)
    ? window.history.state?.previous
    : []
  if (back) {
    for (let i = 0; i < MAX_BACK; i++) {
      if (viewToUrl(viewFromUrl(previous[i])) === destination) {
        window.history.go(-(i + 1))
        return
      }
    }
  }
  window.history.pushState(
    {
      previous: [window.location.href, ...previous]
    },
    '',
    destination
  )
}

export type LinkProps = {
  view: View | null
  back?: boolean
  class?: string
  style?: JSX.CSSProperties | string
  elemRef?: Ref<HTMLAnchorElement>
  children?: ComponentChildren
}
export function Link ({
  view,
  back,
  class: className = '',
  style,
  children,
  elemRef
}: LinkProps) {
  const onView = useContext(OnView)
  return (
    <a
      href={view ? '?' : undefined}
      class={`internal-link ${className}`}
      style={style}
      ref={elemRef}
      onClick={e => {
        e.preventDefault()
        if (view) {
          onView(view)
          navigate(view, back)
        }
      }}
    >
      {children}
    </a>
  )
}
