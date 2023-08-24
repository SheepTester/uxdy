/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useRef } from 'preact/hooks'

export type SearchResultProps = {
  name?: string
  code?: string
  primary: 'name' | 'code'
  match?: {
    start: number
    end: number
  }
  selected: boolean
  onSelect: () => void
}
export function SearchResult ({
  name,
  code,
  primary: primaryField,
  match,
  selected,
  onSelect
}: SearchResultProps) {
  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    if (selected) {
      ref.current?.scrollIntoView({ block: 'nearest' })
    }
  }, [selected])

  const nameFirst = primaryField === 'name'
  const primary = nameFirst ? name : code
  const secondary = nameFirst ? code : name

  return (
    <button
      class={`result ${selected ? 'result-selected' : ''}`}
      onClick={onSelect}
      ref={ref}
    >
      {primary !== undefined && (
        <p
          class={`result-primary ${nameFirst ? 'result-name' : 'result-code'}`}
        >
          {match ? (
            <>
              {primary.slice(0, match.start)}
              <span class='result-match'>
                {primary.slice(match.start, match.end)}
              </span>
              {primary.slice(match.end)}
            </>
          ) : (
            primary
          )}
        </p>
      )}
      {secondary !== undefined && (
        <p
          class={`result-secondary ${
            nameFirst ? 'result-code' : 'result-name'
          }`}
        >
          {secondary}
        </p>
      )}
    </button>
  )
}
