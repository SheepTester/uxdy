/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useCallback } from 'preact/hooks'
import { buildings } from '../lib/buildings.ts'
import { Building } from '../lib/coursesFromFile.ts'
import {
  latLongToPixel,
  southwest,
  PADDING,
  northeast
} from '../lib/locations.ts'
import { Now, used } from '../lib/now.ts'

type BuildingButtonProps = {
  now?: Now | null
  building: Building
  onSelect: (building: string) => void
  scrollWrapper: Element
  selected: boolean
}

export function BuildingButton ({
  now,
  building,
  onSelect,
  scrollWrapper,
  selected
}: BuildingButtonProps) {
  if (!buildings[building.code]) {
    console.warn('No location data for', building)
    return <p>No location data for {building.code}</p>
  }
  const college = buildings[building.code].college

  const ref = useCallback((button: HTMLButtonElement | null) => {
    if (building.code === 'CENTR' && button) {
      window.requestAnimationFrame(() => {
        const { left, top, width, height } = button.getBoundingClientRect()
        scrollWrapper.scrollBy(
          left + (-window.innerWidth + width) / 2,
          top + (-window.innerHeight + height) / 2
        )
      })
    }
  }, [])

  const { x, y } = latLongToPixel(buildings[building.code].location)

  return (
    <button
      class={`building college-${college} ${selected ? 'selected' : ''}`}
      style={{
        left: `${x - southwest.x + PADDING}px`,
        top: `${y - northeast.y + PADDING}px`
      }}
      ref={ref}
      onClick={() => onSelect(building.code)}
    >
      {building.code}
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
