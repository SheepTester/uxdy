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
  viewToUrl,
  ViewWithTerm
} from '../View.ts'
import { useMoment } from '../moment-context.ts'

export type NavigateOptions = {
  view: ViewWithTerm
  /**
   * Determines whether the navigation should reuse prior history entries
   * instead of pushing new ones. This way, the back button can sometimes mimic
   * the browser back button behavior.
   *
   * The callback is given a list of previous views `previous`, most recent
   * first.
   *
   * Returns `null` to push to the history stack. Returns a number `index` to go
   * back `index + 1` entries (i.e. jump to the entry in `previous`).
   */
  back?: BackHandler
}

export function navigate (
  onView: ViewHandler,
  { view, back }: NavigateOptions
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
  if (window.location.href === destination.href) {
    return
  }
  const args: Parameters<History['pushState']> = [
    { previous: [window.location.href, ...previous] },
    '',
    destination
  ]
  window.history.pushState(...args)
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
  const moment = useMoment()
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
          navigate(onView, {
            view: { ...view, term: moment.isLive ? null : moment },
            back
          })
        }
      }}
    >
      {children}
    </a>
  )
}
