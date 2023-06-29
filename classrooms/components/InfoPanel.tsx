/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

type InfoPanelProps = {
  class?: string
}
export function InfoPanel ({ class: className = '' }: InfoPanelProps) {
  return (
    <div class={`info-panel ${className}`}>
      <h1 class='title'>UCSD Classroom Schedules</h1>
      <p class='instructions'>
        Select a building to view its rooms.{' '}
        <a
          href='https://github.com/SheepTester/uxdy/tree/main/webreg-scraping/classrooms'
          class='link'
        >
          Github
        </a>
      </p>
    </div>
  )
}
