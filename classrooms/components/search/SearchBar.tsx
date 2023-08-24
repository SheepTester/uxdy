/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useState } from 'preact/hooks'
import { termCode } from '../../../terms/index.ts'
import { Term, TermCache } from '../../lib/TermCache.ts'
import { SearchIcon } from '../icons/SearchIcon.tsx'
import { SearchData, SearchResults } from './SearchResults.tsx'

type State =
  | { type: 'unloaded' }
  | { type: 'loading' }
  | {
      type: 'loaded'
      terms: string
      data: Omit<SearchData, 'buildings'>
      offline: Term[]
    }

export type SearchBarProps = {
  termCache: TermCache
  terms: Term[]
  buildings: string[]
  onBuilding: (building: string) => void
  visible: boolean
}
export function SearchBar ({
  termCache,
  terms,
  buildings,
  onBuilding,
  visible
}: SearchBarProps) {
  const termsId = terms.map(term => termCode(term.year, term.quarter)).join(' ')
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState<number | null>(null)
  const [state, setState] = useState<State>({ type: 'unloaded' })
  const loaded = state.type === 'loaded' && state.terms === termsId

  async function loadTerms (): Promise<void> {
    const maybePromise = termCache.requestTerms(terms, true)
    if (maybePromise instanceof Promise) {
      // Show "Loading..."
      setState({ type: 'loading' })
    }
    const { successes, errors } =
      maybePromise instanceof Promise ? await maybePromise : maybePromise
    const courses = successes.flatMap(result => result.result.courses)
    setState({
      type: 'loaded',
      terms: termsId,
      data: {
        courses,
        professors: Array.from(
          new Set(
            courses.flatMap(course =>
              course.groups.flatMap(group =>
                group.instructors.map(({ first, last }) => `${last}, ${first}`)
              )
            )
          ),
          name => {
            const [last, first] = name.split(', ')
            return { first, last }
          }
        )
      },
      // Don't show `unavailable` errors since it's already shown by the term
      // status
      offline: errors
        .filter(error => error.type === 'offline')
        .map(error => error.request)
    })
  }

  // TODO: show loading, offline errors with retry button
  return (
    <div class={`search-wrapper ${visible ? '' : 'hide-search'}`}>
      <label class='search-bar'>
        <SearchIcon />
        <input
          type='search'
          placeholder='Search courses, people, buildings...'
          class='search-input'
          value={query}
          onInput={e => {
            setQuery(e.currentTarget.value)
            setIndex(null)
          }}
          onKeyDown={e => {
            if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
              return
            }
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
              setIndex(index =>
                index === null
                  ? e.key === 'ArrowUp'
                    ? -1
                    : 0
                  : index + (e.key === 'ArrowUp' ? -1 : 1)
              )
              e.preventDefault()
            }
            if (e.key === 'Enter') {
              // This sucks but I'm too lazy to think of a good React way to do
              // this
              const selected = e.currentTarget
                .closest('.search-wrapper')
                ?.querySelector('.result-selected')
              if (selected instanceof HTMLElement) {
                selected.click()
              }
              e.preventDefault()
            }
          }}
          onFocus={() => {
            if (
              state.type === 'unloaded' ||
              (state.type === 'loaded' && state.terms !== termsId)
            ) {
              loadTerms()
            }
          }}
        />
      </label>
      {loaded && (
        <SearchResults
          terms={terms}
          query={query}
          data={{ ...state.data, buildings }}
          index={index}
          onSelect={view => {
            if (view.type === 'building') {
              onBuilding(view.id)
            }
            console.log(view)
          }}
        />
      )}
    </div>
  )
}
