/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

type QuarterSelectorProps = {
  quarter: string | null
  onQuarter: (quarter: string | null) => void
  class?: string
  quarters: Record<string, string>
}
export function QuarterSelector ({
  quarter,
  onQuarter,
  class: className = '',
  quarters
}: QuarterSelectorProps) {
  return (
    <div class={`quarter-selector ${className}`}>
      <select
        class='quarter'
        aria-label='Select a quarter'
        value={quarter ?? 'current'}
        onChange={e =>
          onQuarter(
            e.currentTarget.value === 'current' ? null : e.currentTarget.value
          )
        }
      >
        <option value='current'>Current quarter</option>
        {Object.entries(quarters).map(([code, name]) => (
          <option value={code} key={code}>
            {name}
          </option>
        ))}
      </select>
    </div>
  )
}
