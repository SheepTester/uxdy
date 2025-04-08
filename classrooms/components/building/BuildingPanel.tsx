/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'preact/hooks'
import { useLast } from '../../../util/useLast.ts'
import { BuildingDatum, buildings } from '../../lib/buildings.ts'
import { RoomMeeting } from '../../lib/coursesToClassrooms.ts'
import { AbbrevHeading } from '../AbbrevHeading.tsx'
import { BackIcon } from '../icons/BackIcon.tsx'
import { CloseIcon } from '../icons/CloseIcon.tsx'
import { Link } from '../Link.tsx'
import { RoomList } from './RoomList.tsx'
import { RoomSchedule } from './RoomSchedule.tsx'
import { Image } from '../Image.tsx'

type BuildingPanelContentProps = {
  building: BuildingDatum
  room: string | null
  rooms: Record<string, RoomMeeting[]>
}
function BuildingPanelContent ({
  building: { code, images, college, name },
  room,
  rooms
}: BuildingPanelContentProps) {
  const lastRoom = useLast('', room)

  // Make Imgur compress the image.
  // https://thomas.vanhoutte.be/miniblog/imgur-thumbnail-trick/
  const imageUrl = images[0]?.replace(/\.jpeg$/, 'l.jpeg')

  return (
    <>
      <header
        class={`building-name ${
          room ? 'schedule-view' : 'list-view'
        } college-${college}`}
      >
        {images.length > 0 && (
          <Image class='building-header-image' src={imageUrl} key={imageUrl} />
        )}
        <Link
          view={room ? { type: 'building', building: code } : null}
          class='icon-btn back'
          back={([previous]) => {
            // If the user just came from a room list then go back to it
            if (previous && previous.type === 'building' && !previous.room) {
              return 0
            } else {
              return null
            }
          }}
        >
          <BackIcon />
        </Link>
        <AbbrevHeading
          heading='h2'
          abbrev={
            <span>
              {code} <span class='room-number'>{lastRoom}</span>
            </span>
          }
        >
          {name}
        </AbbrevHeading>
        <Link
          view={{ type: 'default' }}
          class='icon-btn close'
          back={([previous, before]) => {
            if (!previous) {
              return null
            }
            // If the building panel was directly opened, go back
            if (previous.type === 'default') {
              return 0
            }
            // If the building panel was opened two pages ago, and this is a
            // room schedule,
            if (room && before && before.type === 'default') {
              // Ensure that the direct previous entry was a room list
              if (previous.type === 'building' && !previous.room) {
                return 1
              }
            }
            return null
          }}
        >
          <CloseIcon />
        </Link>
      </header>
      {room ? (
        <RoomSchedule meetings={rooms[room] ?? []} />
      ) : (
        <>
          <div class='gradient gradient-sticky gradient-top' />
          <RoomList building={code} rooms={rooms} />
          {images.length > 0 ? (
            <div class='building-images'>
              {images.map(image => {
                const imageUrl = image.replace(/\.jpeg$/, 'l.jpeg')
                return (
                  <a href={image} class='building-image-link' key={imageUrl}>
                    <Image
                      class='building-image'
                      src={imageUrl}
                      loading='lazy'
                    />
                  </a>
                )
              })}
            </div>
          ) : null}
          <div class='gradient gradient-sticky gradient-bottom' />
        </>
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
        key={props.building.code}
        // For some reason this needs to be after `key` or then Deno gets pissed
        // about `react` not existing.
        {...props}
      />
    </div>
  )
}
