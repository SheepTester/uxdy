/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useRef } from 'preact/hooks'
import { Course } from '../../../scheduleofclasses/group-sections.ts'
import { AbbrevHeading } from '../AbbrevHeading.tsx'

export type ModalView =
  | { type: 'course'; course: Course }
  | { type: 'professor' }

export type ResultModalProps = {
  view: ModalView
  open: boolean
  onClose: () => void
}
export function ResultModal ({ view, open, onClose }: ResultModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (ref.current && open) {
      ref.current.showModal()
    }
  }, [open])

  return (
    <dialog
      class='modal'
      ref={ref}
      onClick={e => {
        if (e.target === e.currentTarget) {
          e.currentTarget.close()
        }
      }}
      onClose={onClose}
    >
      <form method='dialog' class='modal-body'>
        {view.type === 'course' ? (
          <AbbrevHeading
            heading='h1'
            abbrev={view.course.code}
            class='modal-title-course-code'
          >
            {view.course.title}
          </AbbrevHeading>
        ) : (
          'Professor Name'
        )}
      </form>
    </dialog>
  )
}
