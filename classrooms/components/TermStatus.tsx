/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { termCode } from '../../terms/index.ts'
import { useLast } from '../../util/useLast.ts'
import { Term } from '../lib/TermCache.ts'

export type TermStatus = [Term, 'unavailable' | 'offline' | Date]

export type TermStatusProps = {
  status?: TermStatus[]
  visible: boolean
}
export function TermStatus ({
  status: currentStatus,
  visible
}: TermStatusProps) {
  const showStatus = visible && currentStatus && currentStatus.length > 0
  const statuses = useLast([], showStatus ? currentStatus : null)
  const omitTerm = statuses.length === 1 && statuses[0][0].quarter !== 'S3'
  const credit = (
    <span>
      Made by{' '}
      <a href='https://www.instagram.com/sheeptester/' class='link'>
        @sheeptester
      </a>
      .
    </span>
  )
  return (
    <div class={`term-statuses ${showStatus ? '' : 'hide-status'}`}>
      {statuses.map(([term, status]) => (
        <p
          key={termCode(term.year, term.quarter)}
          class={`term-updated ${
            status === 'offline'
              ? 'term-offline'
              : status === 'unavailable'
                ? 'term-unavailable'
                : ''
          }`}
        >
          {!omitTerm && (
            <>
              <span class='term-code'>{termCode(term.year, term.quarter)}</span>
              &nbsp;
            </>
          )}
          {status instanceof Date ? (
            <>
              {omitTerm ? 'Updated ' : 'last updated '}
              <span class='updated-date'>{status.toLocaleDateString()}</span>.
            </>
          ) : status === 'offline' ? (
            'failed to load.'
          ) : (
            'is unavailable.'
          )}{' '}
          {statuses.length === 1 ? credit : null}
        </p>
      ))}
      {statuses.length > 1 ? credit : null}
    </div>
  )
}
