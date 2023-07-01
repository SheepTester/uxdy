/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useState } from 'preact/hooks'
import { colleges } from '../../lib/building-locations.ts'
import { Building } from '../../lib/coursesFromFile.ts'
import { Now } from '../../lib/now.ts'
import { AbbrevHeading } from '../AbbrevHeading.tsx'
import { BackIcon } from '../BackIcon.tsx'
import { CloseIcon } from '../CloseIcon.tsx'
import { RoomList } from './RoomList.tsx'
import { Schedule } from './Schedule.tsx'

type BuildingPanelProps = {
  now?: Now | null
  building: Building
  onClose: () => void
  visible: boolean
  rightPanelOpen: boolean
}
export function BuildingPanel ({
  now,
  building,
  onClose,
  visible,
  rightPanelOpen
}: BuildingPanelProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [lastRoom, setLastRoom] = useState('')

  // Keep last room number visible when animating back to room list
  useEffect(() => {
    if (selected) {
      setLastRoom(selected)
    }
  }, [selected])

  return (
    <div
      class={`room-list ${visible ? '' : 'room-list-invisible'} ${
        rightPanelOpen ? 'right-panel-open' : ''
      }`}
    >
      <div class={`building-name ${selected ? 'schedule-view' : 'list-view'}`}>
        <button
          class='back'
          onClick={() => setSelected(null)}
          disabled={!selected}
        >
          <BackIcon />
        </button>
        <div class={`building-gradient college-${colleges[building.name]}`} />
        <img class='building-image' src='https://i.imgur.com/PiC2Cb8.jpeg' />
        <AbbrevHeading
          heading='h2'
          abbrev={
            <span>
              {building.name}{' '}
              <span class='room-number'>{selected || lastRoom}</span>
            </span>
          }
        >
          Center Hall
        </AbbrevHeading>
        <button class='close' onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      {selected ? (
        <Schedule now={now} meetings={building.rooms[selected]} />
      ) : (
        <RoomList now={now} building={building} onSelect={setSelected} />
      )}
    </div>
  )
}
