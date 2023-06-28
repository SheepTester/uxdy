/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { RefObject } from 'preact'
import { useEffect, useRef, useState } from 'preact/hooks'

export type UseRectValue<E> = {
  width: number
  height: number
  ref: RefObject<E>
}

export function useRect<E extends Element> (
  borderBox = false
): UseRectValue<E> {
  const ref = useRef<E>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)

  useEffect(() => {
    if (!ref.current) {
      return
    }
    const observer = new ResizeObserver(([entry]) => {
      const size = borderBox ? entry.borderBoxSize : entry.contentBoxSize
      setWidth(size[0].inlineSize)
      setHeight(size[0].blockSize)
    })
    observer.observe(ref.current)
    return () => {
      observer.disconnect()
    }
  }, [ref.current])

  return { ref, width, height }
}
