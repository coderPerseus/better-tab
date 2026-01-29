export const buildSearchUrl = (query: string) => {
  const url = new URL("https://www.google.com/search")
  url.searchParams.set("q", query)
  return url.toString()
}

export type OmnibarMode = "search" | "go"

const looksLikeUrl = (input: string) => {
  const value = input.trim()
  if (!value) return false
  if (value.startsWith("http://") || value.startsWith("https://")) return true
  if (value.startsWith("chrome://") || value.startsWith("edge://") || value.startsWith("about:"))
    return true

  if (/\s/.test(value)) return false
  if (value.includes("localhost")) return true
  if (value.includes(".")) return true
  return false
}

const normalizeUrl = (input: string) => {
  const value = input.trim()
  if (!value) return ""
  if (/\s/.test(value)) return ""
  if (value.startsWith("http://") || value.startsWith("https://")) return value
  if (value.startsWith("chrome://") || value.startsWith("edge://") || value.startsWith("about:"))
    return value
  return `https://${value}`
}

export const resolveOmnibarTarget = (input: string, mode: OmnibarMode) => {
  const trimmed = input.trim()
  if (!trimmed) return ""

  if (looksLikeUrl(trimmed)) return normalizeUrl(trimmed)
  if (mode === "go") return normalizeUrl(trimmed) || buildSearchUrl(trimmed)
  return buildSearchUrl(trimmed)
}
