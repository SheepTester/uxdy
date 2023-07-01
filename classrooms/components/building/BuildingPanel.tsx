/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useState } from 'preact/hooks'
import { buildings } from '../../lib/buildings.ts'
import { Building } from '../../lib/coursesFromFile.ts'
import { Now } from '../../lib/now.ts'
import { AbbrevHeading } from '../AbbrevHeading.tsx'
import { BackIcon } from '../BackIcon.tsx'
import { CloseIcon } from '../CloseIcon.tsx'
import { RoomList } from './RoomList.tsx'
import { Schedule } from './Schedule.tsx'

type BuildingPanelContentProps = {
  now?: Now | null
  building: Building
  onClose: () => void
}
function BuildingPanelContent ({
  now,
  building,
  onClose
}: BuildingPanelContentProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [lastRoom, setLastRoom] = useState('')

  // Keep last room number visible when animating back to room list
  useEffect(() => {
    if (selected) {
      setLastRoom(selected)
    }
  }, [selected])

  return (
    <>
      <div
        class={`building-name ${
          selected ? 'schedule-view' : 'list-view'
        } college-${buildings[building.code].college}`}
      >
        <img class='building-image' src='https://i.imgur.com/PiC2Cb8.jpeg' />
        <button
          class='back'
          onClick={() => setSelected(null)}
          disabled={!selected}
        >
          <BackIcon />
        </button>
        <AbbrevHeading
          heading='h2'
          abbrev={
            <span>
              {building.code}{' '}
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
    </>
  )
}

export type BuildingPanelProps = {
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
  return (
    <div
      class={`building-panel ${visible ? '' : 'building-panel-invisible'} ${
        rightPanelOpen ? 'right-panel-open' : ''
      }`}
    >
      <BuildingPanelContent
        now={now}
        building={building}
        onClose={onClose}
        // Force new elements (disable transition) when building changes
        key={building}
      />
    </div>
  )
}
