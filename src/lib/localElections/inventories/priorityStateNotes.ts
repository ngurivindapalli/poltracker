import type { LocalSourceInventoryEntry } from "../inventory";

/**
 * How local elections are administered in the priority states.
 * These notes are for discovery, not election dates.
 */
export const PRIORITY_STATE_ADMIN_NOTES: LocalSourceInventoryEntry[] = [
  {
    stateCode: "PA",
    jurisdiction: "Pennsylvania",
    jurisdictionType: "COUNTY",
    sourceName: "Pennsylvania Department of State",
    sourceUrl: "https://www.pa.gov/agencies/vote/contact-us/contact-your-election-officials",
    sourceType: "OFFICIAL",
    scope: "STATE",
    accessMethod: "HTML",
    status: "DISCOVERED",
    adapterRequired: false,
    notes:
      "Elections are administered by 67 county boards of elections, not by a statewide municipal clerk system. School director races typically appear on the municipal ballot and are also run by the county board. A state calendar is not a municipal calendar.",
  },
  {
    stateCode: "TX",
    jurisdiction: "Texas",
    jurisdictionType: "COUNTY",
    sourceName: "Texas Secretary of State",
    sourceUrl: "https://www.sos.state.tx.us/elections/voter/county.shtml",
    sourceType: "OFFICIAL",
    scope: "STATE",
    accessMethod: "HTML",
    status: "DISCOVERED",
    adapterRequired: false,
    notes:
      "County elections administrators or county clerks run most elections. Home-rule cities and independent school districts may administer their own elections. Uniform election dates are not a substitute for city or ISD calendars.",
  },
  {
    stateCode: "FL",
    jurisdiction: "Florida",
    jurisdictionType: "COUNTY",
    sourceName: "Florida Division of Elections",
    sourceUrl: "https://dos.fl.gov/elections/for-voters/election-dates",
    sourceType: "OFFICIAL",
    scope: "STATE",
    accessMethod: "HTML",
    status: "DISCOVERED",
    adapterRequired: false,
    notes:
      "Each county Supervisor of Elections administers elections. Municipal elections may be on different dates. DOS references a Local Elections Database that was not verified as a machine-readable ingest URL.",
  },
  {
    stateCode: "CA",
    jurisdiction: "California",
    jurisdictionType: "COUNTY",
    sourceName: "California Secretary of State",
    sourceUrl: "https://www.sos.ca.gov/elections/voting-resources/county-elections-offices",
    sourceType: "OFFICIAL",
    scope: "STATE",
    accessMethod: "HTML",
    status: "DISCOVERED",
    adapterRequired: false,
    notes:
      "County elections officials administer most elections. Some charter cities run their own. School and special-district contests are often consolidated onto county ballots. SOS PDF calendars were not parsed as county-specific local races.",
  },
  {
    stateCode: "NY",
    jurisdiction: "New York",
    jurisdictionType: "COUNTY",
    sourceName: "New York State Board of Elections",
    sourceUrl: "https://elections.ny.gov/county-boards-elections",
    sourceType: "OFFICIAL",
    scope: "STATE",
    accessMethod: "HTML",
    status: "DISCOVERED",
    adapterRequired: false,
    notes:
      "County boards of elections administer most elections outside New York City. NYC has a city Board of Elections. Towns, villages, and school districts may hold separate elections. Statewide SBOE calendars are PDFs / bot-protected.",
  },
];
