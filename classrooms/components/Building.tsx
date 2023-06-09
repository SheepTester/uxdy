/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useCallback } from 'preact/hooks'
import {
  colleges,
  latLongToPixel,
  locations,
  northeast,
  southwest,
  PADDING
} from '../building-locations.ts'
import { Building } from '../from-file.ts'
import { Now, used } from '../now.ts'

type BuildingProps = {
  now?: Now | null
  building: Building
  onSelect: (building: Building) => void
  scrollWrapper: Element
  selected: boolean
}

export function Building ({
  now,
  building,
  onSelect,
  scrollWrapper,
  selected
}: BuildingProps) {
  if (!locations[building.name]) {
    console.warn('No location data for', building)
    return <p>No location data for {building.name}</p>
  }
  const college = colleges[building.name]

  const ref = useCallback((button: HTMLButtonElement | null) => {
    if (building.name === 'CENTR' && button) {
      window.requestAnimationFrame(() => {
        const { left, top, width, height } = button.getBoundingClientRect()
        scrollWrapper.scrollBy(
          left + (-window.innerWidth + width) / 2,
          top + (-window.innerHeight + height) / 2
        )
      })
    }
  }, [])

  const { x, y } = latLongToPixel(locations[building.name])

  return (
    <button
      class={`building college-${college} ${selected ? 'selected' : ''}`}
      style={{
        left: `${x - southwest.x + PADDING}px`,
        top: `${y - northeast.y + PADDING}px`
      }}
      ref={ref}
      onClick={() => onSelect(building)}
    >
      {building.name}
      <span class='room-count'>
        {now && (
          <>
            <span class='in-use'>
              {
                Object.values(building.rooms).filter(meetings =>
                  meetings.some(used(now))
                ).length
              }
            </span>
            /
          </>
        )}
        {Object.values(building.rooms).length}
      </span>
    </button>
  )
}
