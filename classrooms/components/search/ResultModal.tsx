/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useRef } from 'preact/hooks'
import { Course } from '../../../scheduleofclasses/group-sections.ts'
import { AbbrevHeading } from '../AbbrevHeading.tsx'
import { CloseIcon } from '../icons/CloseIcon.tsx'
import { CourseInfo } from './CourseInfo.tsx'
import { View } from './SearchResults.tsx'

export type Professor = {
  first: string
  last: string
}

export type ModalView =
  | { type: 'course'; course: Course }
  | { type: 'professor'; professor: Professor }

export type ResultModalProps = {
  view: ModalView
  open: boolean
  onClose: () => void
  onView: (view: View) => void
}
export function ResultModal ({
  view,
  open,
  onClose,
  onView
}: ResultModalProps) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (open) {
      ref.current?.showModal()
    } else {
      ref.current?.close()
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
        <header class='modal-header'>
          {view.type === 'course' ? (
            <AbbrevHeading
              heading='h1'
              abbrev={view.course.code}
              class='modal-title modal-title-course-code'
            >
              {view.course.title}
            </AbbrevHeading>
          ) : (
            <h1 class='modal-title modal-title-professor'>
              {view.professor.first}{' '}
              <span class='last-name'>{view.professor.last}</span>
            </h1>
          )}
          <button class='close' type='submit'>
            <CloseIcon />
          </button>
        </header>
        {view.type === 'course' ? (
          <CourseInfo course={view.course} onView={onView} />
        ) : null}
      </form>
    </dialog>
  )
}
