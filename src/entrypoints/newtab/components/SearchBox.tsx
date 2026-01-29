import { useEffect, useMemo, useRef, useState } from "react"
import type { OmnibarMode } from "../lib/search"

type Props = {
  defaultValue?: string
  onSubmit: (query: string, mode: OmnibarMode) => void | Promise<void>
  strings: {
    placeholderSearch: string
    placeholderGo: string
    modeSearch: string
    modeGo: string
    hint: string
    ariaLabel: string
    actionLabel: string
  }
}

const SearchIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </svg>
)

const ArrowIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
)

export default function SearchBox({ defaultValue = "", onSubmit, strings }: Props) {
  const [value, setValue] = useState(defaultValue)
  const [mode, setMode] = useState<OmnibarMode>("search")
  const inputRef = useRef<HTMLInputElement | null>(null)
  const hasValue = value.trim().length > 0
  const placeholder = useMemo(
    () => (mode === "search" ? strings.placeholderSearch : strings.placeholderGo),
    [mode, strings.placeholderGo, strings.placeholderSearch]
  )

  useEffect(() => {
    setValue(defaultValue)
  }, [defaultValue])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <form
      className="omni"
      data-mode={mode}
      onSubmit={(event) => {
        event.preventDefault()
        onSubmit(value, mode)
      }}
    >
      <button
        type="button"
        className="omni-mode"
        onClick={() => setMode((prev) => (prev === "search" ? "go" : "search"))}
        title="Press Tab to switch mode"
        aria-label={mode === "search" ? strings.modeSearch : strings.modeGo}
      >
        <span className="omni-modeIcon">{mode === "search" ? <SearchIcon /> : <ArrowIcon />}</span>
        <span className="omni-modeLabel">
          {mode === "search" ? strings.modeSearch : strings.modeGo}
        </span>
      </button>
      <input
        ref={inputRef}
        className="omni-input"
        type="text"
        inputMode="search"
        placeholder={placeholder}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Tab") {
            event.preventDefault()
            setMode((prev) => (prev === "search" ? "go" : "search"))
            return
          }
          if (event.key === "Escape") {
            setValue("")
            return
          }
        }}
        aria-label={strings.ariaLabel}
      />
      {hasValue ? (
        <button className="omni-action" type="submit" aria-label={strings.actionLabel}>
          <ArrowIcon />
        </button>
      ) : null}
      <div className="omni-hint" aria-hidden="true">
        {strings.hint}
      </div>
    </form>
  )
}
