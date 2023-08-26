/** @jsxImportSource preact */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="deno.ns" />

import { useEffect, useRef, useState } from 'preact/hooks'
import { termCode } from '../../../terms/index.ts'
import { Term } from '../../lib/TermCache.ts'
import { SearchIcon } from '../icons/SearchIcon.tsx'
import { SearchData, SearchResults, View } from './SearchResults.tsx'

export type State =
  | { type: 'unloaded' }
  | { type: 'loading' }
  | {
      type: 'loaded'
      termId: string
      data: Omit<SearchData, 'buildings'>
      offline: Term[]
    }

export type SearchBarProps = {
  state: State
  terms: Term[]
  termId: string
  buildings: string[]
  visible: boolean
  onLoadTerms: () => void
  onView: (view: View) => void
}
export function SearchBar ({
  state,
  terms,
  termId,
  buildings,
  visible,
  onLoadTerms,
  onView
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const [showResults, setShowResults] = useState(true)
  const ref = useRef<HTMLInputElement>(null)

  const termsId = terms.map(term => termCode(term.year, term.quarter)).join(' ')
  const loaded = state.type === 'loaded' && state.termId === termId

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.shiftKey || e.ctrlKey || e.altKey || e.metaKey) {
        return
      }
      if ((e.key === '/' || e.key === 's') && e.target === document.body) {
        ref.current?.focus()
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  // TODO: show loading, offline errors with retry button
  return (
    <div
      class={`search-wrapper ${visible ? '' : 'hide-search'} ${
        loaded && showResults && query !== '' ? 'showing-results' : ''
      }`}
    >
      <label class='search-bar'>
        <SearchIcon />
        <input
          type='search'
          title="Press '/' to jump to the search box."
          placeholder='Search courses, people, buildings...'
          class='search-input'
          value={query}
          onInput={e => {
            setQuery(e.currentTarget.value)
            setIndex(0)
            setShowResults(true)
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
            setShowResults(true)
            if (
              state.type === 'unloaded' ||
              (state.type === 'loaded' && state.termId !== termsId)
            ) {
              onLoadTerms()
            }
          }}
          ref={ref}
        />
      </label>
      {loaded && showResults && (
        <SearchResults
          terms={terms}
          query={query}
          data={{ ...state.data, buildings }}
          index={index}
          onSelect={view => {
            setShowResults(false)
            onView(view)
          }}
        />
      )}
    </div>
  )
}
