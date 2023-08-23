/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

export type SearchResultProps = {
  name?: string
  code?: string
  primary: 'name' | 'code'
}
export function SearchResult ({
  name,
  code,
  primary: primaryField
}: SearchResultProps) {
  const nameFirst = primaryField === 'name'
  const primary = nameFirst ? name : code
  const secondary = nameFirst ? code : name
  return (
    <li class='result'>
      {primary !== undefined && (
        <p
          class={`result-primary ${nameFirst ? 'result-name' : 'result-code'}`}
        >
          {primary}
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
    </li>
  )
}
