import { useEffect, useMemo, useState } from "react"
import Clock from "./components/Clock"
import QuickLinks, { type QuickLink } from "./components/QuickLinks"
import SearchBox from "./components/SearchBox"
import { type OmnibarMode, resolveOmnibarTarget } from "./lib/search"
import { getLastQuery, setLastQuery } from "./lib/storage"

const getMessage = (key: string) => {
  const globals = globalThis as typeof globalThis & {
    browser?: { i18n?: { getMessage?: (key: string) => string } }
    chrome?: { i18n?: { getMessage?: (key: string) => string } }
  }
  const browserMessage = globals.browser?.i18n?.getMessage?.(key) ?? ""
  const chromeMessage = globals.chrome?.i18n?.getMessage?.(key) ?? ""
  return browserMessage || chromeMessage || ""
}

const t = (key: string, fallback: string) => getMessage(key) || fallback

const getGreetingKey = (date = new Date()) => {
  const hour = date.getHours()
  if (hour < 5) return "newtabGreetingNight"
  if (hour < 12) return "newtabGreetingMorning"
  if (hour < 18) return "newtabGreetingAfternoon"
  return "newtabGreetingEvening"
}

const defaultLinks: QuickLink[] = [
  { label: "Google", url: "https://www.google.com" },
  { label: "YouTube", url: "https://www.youtube.com" },
  { label: "GitHub", url: "https://github.com" },
]

export default function App() {
  const appName = useMemo(() => t("appName", "Lucky Tab"), [])
  const appDescription = useMemo(() => t("appDescription", ""), [])
  const greeting = useMemo(() => t(getGreetingKey(), "Welcome back"), [])
  const shortcutLabel = useMemo(() => t("newtabShortcutsLabel", "Shortcuts"), [])
  const [lastQuery, setLastQueryState] = useState<string>("")

  useEffect(() => {
    document.title = appName
  }, [appName])

  useEffect(() => {
    let cancelled = false
    getLastQuery()
      .then((value) => {
        if (cancelled) return
        setLastQueryState(value)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  const onSubmit = async (query: string, mode: OmnibarMode) => {
    const trimmed = query.trim()
    if (!trimmed) return
    setLastQueryState(trimmed)
    await setLastQuery(trimmed)

    const target = resolveOmnibarTarget(trimmed, mode)
    if (!target) return
    window.location.assign(target)
  }

  return (
    <div className="nt">
      <div className="nt-shell">
        <header className="nt-topbar">
          <div className="nt-brand">
            <div className="nt-brandTitle">{appName}</div>
            {appDescription ? <div className="nt-brandSubtitle">{appDescription}</div> : null}
          </div>
          <div className="nt-topRight" aria-hidden="true">
            <span className="nt-chip">{t("newtabTopChip", "AI-native new tab")}</span>
          </div>
        </header>

        <main className="nt-main">
          <div className="nt-hero">
            <div className="nt-greeting">
              <span className="nt-greetingKicker">{greeting}</span>
            </div>
            <Clock />
          </div>

          <div className="nt-omnibar">
            <SearchBox
              defaultValue={lastQuery}
              onSubmit={onSubmit}
              strings={{
                placeholderSearch: t("newtabPlaceholderSearch", "Search Google or type a URL"),
                placeholderGo: t("newtabPlaceholderGo", "Open a site (example.com)"),
                modeSearch: t("newtabModeSearch", "Search"),
                modeGo: t("newtabModeGo", "Go"),
                hint: t("newtabHint", "Tab: switch · Enter: open · Esc: clear"),
                ariaLabel: t("newtabAriaLabel", "Omnibar"),
                actionLabel: t("newtabActionLabel", "Open"),
              }}
            />
          </div>

          <QuickLinks links={defaultLinks} ariaLabel={shortcutLabel} />
        </main>

        <footer className="nt-footer">
          <span className="nt-footerText">{t("newtabFooter", "Built for fast, calm starts.")}</span>
        </footer>
      </div>
    </div>
  )
}
