/** @jsxImportSource https://esm.sh/preact@10.6.6 */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useRef } from 'https://esm.sh/preact@10.6.6/hooks'
import {
  colleges,
  locations,
  maxLat,
  minLong,
  SCALE
} from '../building-locations.ts'
import { Building } from '../from-file.ts'

type BuildingProps = {
  building: Building
  onSelect: (building: Building) => void
}

export function Building ({ building, onSelect }: BuildingProps) {
  if (!locations[building.name]) {
    return <p>No location data for {building.name}</p>
  }
  const [latitude, longitude] = locations[building.name]
  const college = colleges[building.name]

  const ref = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const current = ref.current
    if (building.name === 'CENTR' && current) {
      window.requestAnimationFrame(() => {
        const { left, top, width, height } = current.getBoundingClientRect()
        window.scrollBy(
          left + (-window.innerWidth + width) / 2,
          top + (-window.innerHeight + height) / 2
        )
      })
    }
  }, [ref.current])

  return (
    <button
      class={`building college-${college}`}
      style={{
        top: `${(maxLat - latitude) * SCALE}px`,
        left: `${(longitude - minLong) * SCALE}px`
      }}
      ref={ref}
      onClick={() => onSelect(building)}
    >
      {building.name}
    </button>
  )
}
