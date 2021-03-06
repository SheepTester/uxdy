/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

type InfoPanelProps = {
  quarter: string
  onQuarter: (quarter: string) => void
  class?: string
}
export function InfoPanel ({
  quarter,
  onQuarter,
  class: className = ''
}: InfoPanelProps) {
  return (
    <div class={`info-panel ${className}`}>
      <h1 class='title'>
        UCSD classroom schedules{' '}
        <span class='subtitle'>
          for{' '}
          <select
            class='quarter'
            value={quarter}
            onChange={e => onQuarter(e.currentTarget.value)}
          >
            <option value='wi22'>Winter 2022</option>
            <option value='sp22'>Spring 2022</option>
            <option value='s122'>Summer I 2022</option>
            <option value='s222'>Summer II 2022</option>
            <option value='s322'>Special 2022</option>
            <option value='fa22'>Fall 2022</option>
          </select>
        </span>
      </h1>
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
