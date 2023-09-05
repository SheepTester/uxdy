/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useCallback } from 'preact/hooks'
import { Time } from '../../util/Time.ts'
import { BuildingDatum } from '../lib/buildings.ts'
import { RoomMeeting } from '../lib/coursesToClassrooms.ts'
import {
  latLongToPixel,
  southwest,
  PADDING,
  northeast
} from '../lib/locations.ts'
import { used } from '../lib/now.ts'
import { Link } from './Link.tsx'

type BuildingButtonProps = {
  weekday: number
  time: Time
  building: BuildingDatum
  rooms: RoomMeeting[][]
  selected: boolean
  scrollTarget: { init: boolean } | null
  visible: boolean
}

export function BuildingButton ({
  weekday,
  time,
  building,
  rooms,
  selected,
  scrollTarget,
  visible
}: BuildingButtonProps) {
  const college = building.college

  const ref = useCallback(
    (button: HTMLAnchorElement | null) => {
      if (scrollTarget && button) {
        window.requestAnimationFrame(() => {
          const windowWidth = window.innerWidth
          const windowHeight = window.innerHeight
          const panelHeight = scrollTarget.init
            ? 0
            : windowHeight * (windowWidth <= 690 ? 0.7 : 0.6)
          const { left, top, width, height } = button.getBoundingClientRect()
          button.closest('.buildings')?.scrollBy({
            left: left + (-windowWidth + width) / 2,
            top: top + (-(windowHeight - panelHeight) + height) / 2,
            behavior: scrollTarget.init ? 'auto' : 'smooth'
          })
        })
      }
    },
    [scrollTarget]
  )

  const { x, y } = latLongToPixel(building.location)

  return (
    <Link
      view={{ type: 'building', building: building.code }}
      class={`building-btn college-${college} ${selected ? 'selected' : ''} ${
        visible ? '' : 'building-btn-hidden'
      }`}
      style={{
        left: `${x - southwest.x + PADDING.horizontal}px`,
        top: `${y - northeast.y + PADDING.top}px`
      }}
      elemRef={ref}
    >
      {building.code}
      <span class='room-count'>
        <span class='in-use'>
          {rooms.filter(meetings => meetings.some(used(weekday, time))).length}
        </span>
        /{rooms.length}
      </span>
    </Link>
  )
}
