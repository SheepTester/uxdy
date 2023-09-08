/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { JSX, ComponentChildren, Ref } from 'preact'
import { useContext } from 'preact/hooks'
import {
  BackHandler,
  OnView,
  View,
  viewFromUrl,
  ViewHandler,
  viewToUrl
} from '../View.ts'

/**
 * Only look back two entries. This allows for exiting `/building/room` with the
 * close button. But if, say, the history is quirked up and the default view is
 * much further back in history, then this won't jump all the way back (which
 * might be confusing).
 */
const MAX_BACK = 2

export function navigate (
  onView: ViewHandler,
  view: View,
  back?: BackHandler
): void {
  const destination = viewToUrl(view)
  const previous: string[] = Array.isArray(window.history.state?.previous)
    ? window.history.state?.previous
    : []
  if (back) {
    const index = back(previous.map(url => viewFromUrl(url)))
    if (index !== null) {
      window.history.go(-(index + 1))
      return
    }
  }
  onView(view)
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
  back?: BackHandler
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
          navigate(onView, view, back)
        }
      }}
    >
      {children}
    </a>
  )
}
