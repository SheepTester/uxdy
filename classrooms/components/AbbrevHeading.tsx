/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { ComponentChildren } from 'preact'

export type AbbrevHeadingProps = {
  heading: 'h1' | 'h2' | 'h3' | 'span'
  abbrev?: ComponentChildren
  children?: ComponentChildren
  class?: string
}
export function AbbrevHeading ({
  heading: Heading,
  abbrev,
  children,
  class: className = ''
}: AbbrevHeadingProps) {
  return (
    <Heading class={`abbrev-heading ${className}`}>
      <span class='abbrev'>{abbrev}</span>
      <span class='colon'>: </span>
      <span class='long'>{children}</span>
    </Heading>
  )
}
