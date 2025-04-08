/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'preact/hooks'
import { JSX } from 'preact'

/**
 * Fades in when the image loads.
 *
 * TIP: Set `key` to the same value as `src` so the image re-fades in when `src`
 * changes.
 */
export function Image ({
  class: className = '',
  ...props
}: JSX.HTMLAttributes<HTMLImageElement>) {
  const [imageLoaded, setImageLoaded] = useState(false)

  return (
    <img
      {...props}
      class={`${className} image ${imageLoaded ? '' : 'image-loading'}`}
      onLoad={() => setImageLoaded(true)}
    />
  )
}
