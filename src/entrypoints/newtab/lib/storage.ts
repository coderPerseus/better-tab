const LAST_QUERY_KEY = "newtab:lastQuery"

export const getLastQuery = async () => {
  const stored = await browser.storage.local.get(LAST_QUERY_KEY)
  const value = stored[LAST_QUERY_KEY]
  return typeof value === "string" ? value : ""
}

export const setLastQuery = async (value: string) => {
  await browser.storage.local.set({ [LAST_QUERY_KEY]: value })
}
