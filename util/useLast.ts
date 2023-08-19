import { useRef } from 'preact/hooks'

/**
 * Stores and returns the last non-nullish value of `value`. This is mostly
 * useful for elements that have a exit transition. For example, if you have a
 * message that slides away when set to `null`, then you'll still want to render
 * the previous message while it's transitioning out.
 */
export function useLast<T> (init: T, value: T | null | undefined): T {
  const ref = useRef(init)
  if (value !== null && value !== undefined) {
    ref.current = value
  }
  return ref.current
}
