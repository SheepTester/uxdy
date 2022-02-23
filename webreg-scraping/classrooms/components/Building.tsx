/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import {
  useCallback,
  useEffect,
  useRef
} from 'https://esm.sh/preact@10.6.6/hooks'
import {
  colleges,
  locations,
  maxLat,
  minLong,
  PADDING,
  X_SCALE,
  Y_SCALE
} from '../building-locations.ts'
import { Building } from '../from-file.ts'
import { Now, used } from '../now.ts'

type BuildingProps = {
  now: Now
  building: Building
  onSelect: (building: Building) => void
  scrollWrapper: Element
}

export function Building ({
  now,
  building,
  onSelect,
  scrollWrapper
}: BuildingProps) {
  if (!locations[building.name]) {
    return <p>No location data for {building.name}</p>
  }
  const [latitude, longitude] = locations[building.name]
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

  return (
    <button
      class={`building college-${college}`}
      style={{
        top: `${(maxLat - latitude) * Y_SCALE + PADDING}px`,
        left: `${(longitude - minLong) * X_SCALE + PADDING}px`
      }}
      ref={ref}
      onClick={() => onSelect(building)}
    >
      {building.name}
      <span class='room-count'>
        <span class='in-use'>
          {
            Object.values(building.rooms).filter(meetings =>
              meetings.some(used(now))
            ).length
          }
        </span>
        /{Object.values(building.rooms).length}
      </span>
    </button>
  )
}
