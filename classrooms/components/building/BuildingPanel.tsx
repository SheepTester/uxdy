/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useRef, useState } from 'preact/hooks'
import { BuildingDatum, buildings } from '../../lib/buildings.ts'
import { RoomMeeting } from '../../lib/coursesToClassrooms.ts'
import { Now } from '../../lib/now.ts'
import { AbbrevHeading } from '../AbbrevHeading.tsx'
import { BackIcon } from '../BackIcon.tsx'
import { CloseIcon } from '../CloseIcon.tsx'
import { RoomList } from './RoomList.tsx'
import { Schedule } from './Schedule.tsx'

type BuildingPanelContentProps = {
  now?: Now | null
  building: BuildingDatum
  rooms: Record<string, RoomMeeting[]>
  onClose: () => void
}
function BuildingPanelContent ({
  now,
  building,
  rooms,
  onClose
}: BuildingPanelContentProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const [lastRoom, setLastRoom] = useState('')
  const [imageLoaded, setImageLoaded] = useState(true)
  const imageRef = useRef<HTMLImageElement>(null)

  // Keep last room number visible when animating back to room list
  useEffect(() => {
    if (selected) {
      setLastRoom(selected)
    }
  }, [selected])

  // Make Imgur compress the image.
  // https://thomas.vanhoutte.be/miniblog/imgur-thumbnail-trick/
  const imageUrl = buildings[building.code].images[0]?.replace(
    /\.jpeg$/,
    'l.jpeg'
  )
  useEffect(() => {
    setImageLoaded(!!imageRef.current?.complete)
  }, [imageUrl, imageRef.current])

  return (
    <>
      <div
        class={`building-name ${
          selected ? 'schedule-view' : 'list-view'
        } college-${buildings[building.code].college}`}
      >
        {buildings[building.code].images.length > 0 && (
          <img
            ref={imageRef}
            class={`building-image ${
              imageLoaded ? '' : 'building-image-loading'
            }`}
            src={imageUrl}
            onLoad={() => setImageLoaded(true)}
          />
        )}
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
          {buildings[building.code].name}
        </AbbrevHeading>
        <button class='close' onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      {selected ? (
        <Schedule now={now} meetings={rooms[selected] ?? []} />
      ) : (
        <RoomList
          now={now}
          buildingCode={building.code}
          rooms={rooms}
          onSelect={setSelected}
        />
      )}
    </>
  )
}

export type BuildingPanelProps = {
  now?: Now | null
  building: BuildingDatum
  rooms: Record<string, RoomMeeting[]>
  onClose: () => void
  visible: boolean
  rightPanelOpen: boolean
}
export function BuildingPanel ({
  now,
  building,
  rooms,
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
        rooms={rooms}
        onClose={onClose}
        // Force new elements (disable transition) when building changes
        key={building}
      />
    </div>
  )
}
