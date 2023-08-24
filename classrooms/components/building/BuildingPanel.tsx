/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'preact/hooks'
import { Time } from '../../../util/Time.ts'
import { useLast } from '../../../util/useLast.ts'
import { BuildingDatum, buildings } from '../../lib/buildings.ts'
import { RoomMeeting } from '../../lib/coursesToClassrooms.ts'
import { AbbrevHeading } from '../AbbrevHeading.tsx'
import { BackIcon } from '../icons/BackIcon.tsx'
import { CloseIcon } from '../icons/CloseIcon.tsx'
import { View } from '../search/SearchResults.tsx'
import { RoomList } from './RoomList.tsx'
import { Schedule } from './Schedule.tsx'

type BuildingPanelContentProps = {
  weekday: number
  time: Time
  building: BuildingDatum
  rooms: Record<string, RoomMeeting[]>
  onClose: () => void
  onView: (view: View) => void
}
function BuildingPanelContent ({
  weekday,
  time,
  building,
  rooms,
  onClose,
  onView
}: BuildingPanelContentProps) {
  const [selected, setSelected] = useState<string | null>(null)
  const room = useLast('', selected)
  const [imageLoaded, setImageLoaded] = useState(false)

  // Make Imgur compress the image.
  // https://thomas.vanhoutte.be/miniblog/imgur-thumbnail-trick/
  const imageUrl = buildings[building.code].images[0]?.replace(
    /\.jpeg$/,
    'l.jpeg'
  )

  return (
    <>
      <header
        class={`building-name ${
          selected ? 'schedule-view' : 'list-view'
        } college-${buildings[building.code].college}`}
      >
        {buildings[building.code].images.length > 0 && (
          <img
            class={`building-image ${
              imageLoaded ? '' : 'building-image-loading'
            }`}
            src={imageUrl}
            onLoad={() => setImageLoaded(true)}
            key={imageUrl}
          />
        )}
        <button
          class='back'
          onClick={() => {
            setSelected(null)
          }}
          disabled={!selected}
        >
          <BackIcon />
        </button>
        <AbbrevHeading
          heading='h2'
          abbrev={
            <span>
              {building.code} <span class='room-number'>{room}</span>
            </span>
          }
        >
          {buildings[building.code].name}
        </AbbrevHeading>
        <button class='close' onClick={onClose}>
          <CloseIcon />
        </button>
      </header>
      {selected ? (
        <Schedule
          weekday={weekday}
          time={time}
          meetings={rooms[selected] ?? []}
          onView={onView}
        />
      ) : (
        <RoomList
          weekday={weekday}
          time={time}
          buildingCode={building.code}
          rooms={rooms}
          onSelect={setSelected}
        />
      )}
    </>
  )
}

export type BuildingPanelProps = BuildingPanelContentProps & {
  visible: boolean
  rightPanelOpen: boolean
}
export function BuildingPanel ({
  visible,
  rightPanelOpen,
  ...props
}: BuildingPanelProps) {
  return (
    <div
      class={`building-panel ${visible ? '' : 'building-panel-invisible'} ${
        rightPanelOpen ? 'right-panel-open' : ''
      }`}
    >
      <BuildingPanelContent
        // Force new elements (disable transition) when building changes
        key={props.building}
        // For some reason this needs to be after `key` or then Deno gets pissed
        // about `react` not existing.
        {...props}
      />
    </div>
  )
}
