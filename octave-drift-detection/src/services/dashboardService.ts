/**
 * Shared typings
 * -------------------------------------------------------------------------- */
export interface Entry {
  user: string
  Runtime: string
  BusinessUnit: string
  useCase: string
  ShortCode: string
  JSONLink: string
  alertKeeper: string
}

export interface EntriesTableFilter {
  user?: string
  Runtime?: string
  BusinessUnit?: string
  useCase?: string
  ShortCode?: string
  JSONLink?: string
  alertKeeper?: string          // single name – e.g. "Kalpa"
}

/**
 * Utility helpers
 * -------------------------------------------------------------------------- */
const eq = (a?: string, b?: string) =>
  a !== undefined && b !== undefined ? a.toLowerCase() === b.toLowerCase() : true

/**
 * Fetch the entries table from the API and **return only the rows that match
 * the supplied `filters` object**.  
 *
 * The API is *supposed* to filter server‑side, but we’ve seen it sometimes
 * return the full table (all business units, use‑cases, etc.).  To guarantee
 * correctness we:
 *
 *  1. Pass the query‑string parameters that mirror `filters`.
 *  2. Apply the same filters again in the client, so the caller *always* gets
 *     the precise subset it asked for, even if the backend forgets.
 */
export async function fetchEntriesTable(
  filters: EntriesTableFilter = {},
): Promise<Entry[]> {
  /* ------------------------------------------------------------------ */
  /* 1️⃣  Build the query string we’ll send to the server                */
  /* ------------------------------------------------------------------ */
  const params = new URLSearchParams()
  if (filters.user)         params.append('user',         filters.user)
  if (filters.Runtime)      params.append('Runtime',      filters.Runtime)
  if (filters.BusinessUnit) params.append('BusinessUnit', filters.BusinessUnit)
  if (filters.useCase)      params.append('useCase',      filters.useCase)
  if (filters.ShortCode)    params.append('ShortCode',    filters.ShortCode)
  if (filters.JSONLink)     params.append('JSONLink',     filters.JSONLink)
  if (filters.alertKeeper)  params.append('alertKeeper',  filters.alertKeeper)

  /* ------------------------------------------------------------------ */
  /* 2️⃣  Fetch from the API                                             */
  /* ------------------------------------------------------------------ */
  const res = await fetch(`/api/entries-table?${params.toString()}`, {
    credentials: 'include',
  })

  if (!res.ok) {
    throw new Error(`Failed to fetch entries table: ${res.status} ${res.statusText}`)
  }

  const allRows: Entry[] = await res.json()

  /* ------------------------------------------------------------------ */
  /* 3️⃣  Apply the same filters client‑side (safety‑net)                */
  /* ------------------------------------------------------------------ */
  const rows = allRows.filter((e) => {
    if (filters.user         && !eq(e.user,          filters.user        )) return false
    if (filters.Runtime      &&  e.Runtime         !== filters.Runtime     ) return false
    if (filters.BusinessUnit && !eq(e.BusinessUnit, filters.BusinessUnit)) return false
    if (filters.useCase      && !eq(e.useCase,      filters.useCase     )) return false
    if (filters.ShortCode    &&  e.ShortCode       !== filters.ShortCode   ) return false
    if (filters.JSONLink     &&  e.JSONLink        !== filters.JSONLink    ) return false

    /* alertKeeper: treat it as a comma‑separated list in the source    */
    if (filters.alertKeeper) {
      const keepers = e.alertKeeper
        .split(',')
        .map((s) => s.trim().toLowerCase())
      if (!keepers.includes(filters.alertKeeper.toLowerCase())) return false
    }

    return true
  })

  return rows
}
