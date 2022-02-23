/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

type InfoPanelProps = {
  class?: string
}
export function InfoPanel ({ class: className = '' }: InfoPanelProps) {
  return (
    <div class={`info-panel ${className}`}>
      <h1 class='title'>
        UCSD classroom schedule <span class='subtitle'>for Winter 2022</span>
      </h1>
    </div>
  )
}
