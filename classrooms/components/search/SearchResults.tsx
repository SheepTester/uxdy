/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

export type SearchResultsProps = {
  query: string
}
export function SearchResults ({ query }: SearchResultsProps) {
  return (
    <ul>
      <li>{query}</li>
    </ul>
  )
}
