/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useContext, useEffect, useRef } from 'preact/hooks'
import { Course } from '../../../scheduleofclasses/group-sections.ts'
import { OnView } from '../../View.ts'
import { AbbrevHeading } from '../AbbrevHeading.tsx'
import { CloseIcon } from '../icons/CloseIcon.tsx'
import { navigate } from '../Link.tsx'
import { CourseInfo } from './CourseInfo.tsx'
import { Professor, ProfInfo } from './ProfInfo.tsx'

export type ModalView =
  | { type: 'course'; course: Course }
  | { type: 'professor'; professor: Professor }

export type ResultModalProps = {
  view: ModalView
  open: boolean
}
export function ResultModal ({ view, open }: ResultModalProps) {
  const onView = useContext(OnView)
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (open) {
      ref.current?.showModal()
    } else {
      ref.current?.close('force-closed')
    }
  }, [open])

  return (
    <dialog
      class='modal'
      ref={ref}
      onClick={e => {
        if (e.target === e.currentTarget) {
          e.currentTarget.close('shaded-area')
        }
      }}
      onClose={e => {
        if (e.currentTarget.returnValue !== 'force-closed') {
          onView({ type: 'default' })
          navigate({ type: 'default' }, true)
        }
      }}
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
          <button class='close' type='submit' value='close-btn'>
            <CloseIcon />
          </button>
        </header>
        {view.type === 'course' ? (
          <CourseInfo course={view.course} />
        ) : (
          <ProfInfo professor={view.professor} />
        )}
      </form>
    </dialog>
  )
}
