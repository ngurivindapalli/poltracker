import { LOCAL_ELECTIONS } from "@/lib/localData/elections";
import { LOCAL_EVENTS } from "@/lib/localData/events";
import { STATE_CODE_TO_NAME } from "@/lib/localData/usCounties";
import { countySlug } from "@/lib/localData/countySearch";
import { COMPILED_SOURCE_NAME } from "../types";
import type { AdapterResult } from "../types";
import { electionSourceKey, electionStatus, parseIsoDate, toCountyRecord } from "../normalize";

export function compiledOverlayForState(
  stateCode: string,
  countyFilter?: string
): AdapterResult {
  const code = stateCode.toUpperCase();
  const stateName = STATE_CODE_TO_NAME[code];
  const electionsByCounty = stateName ? LOCAL_ELECTIONS[stateName] || {} : {};
  const eventsByCounty = stateName ? LOCAL_EVENTS[stateName] || {} : {};
  const filterSlug = countyFilter ? countySlug(countyFilter) : null;
  let missingFields = 0;

  const elections = Object.entries(electionsByCounty).flatMap(([countyName, rows]) => {
    const countySlugValue = countySlug(countyName);
    if (filterSlug && filterSlug !== countySlugValue) return [];
    return rows.map((row) => {
      const date = parseIsoDate(row.date);
      if (!date) missingFields += 1;
      return {
        sourceKey: electionSourceKey([
          "compiled",
          code,
          countySlugValue,
          row.title,
          row.date,
        ]),
        state: code,
        countySlug: countySlugValue,
        electionName: row.title,
        electionType: row.type || null,
        electionCategory: (row.type === "Municipal"
          ? "MUNICIPAL"
          : row.type === "School"
            ? "SCHOOL"
            : row.type === "County"
              ? "COUNTY"
              : null) as "MUNICIPAL" | "SCHOOL" | "COUNTY" | null,
        subtype: null,
        electionDate: date,
        office: null,
        description: row.description || null,
        jurisdictionName: countyName,
        jurisdictionType: (row.type === "Municipal"
          ? "CITY"
          : row.type === "School"
            ? "SCHOOL_DISTRICT"
            : "COUNTY") as "CITY" | "SCHOOL_DISTRICT" | "COUNTY",
        sourceName: COMPILED_SOURCE_NAME,
        sourceUrl: null,
        lastVerified: null,
        status: electionStatus(date),
      };
    });
  });

  const events = Object.entries(eventsByCounty).flatMap(([countyName, rows]) => {
    const countySlugValue = countySlug(countyName);
    if (filterSlug && filterSlug !== countySlugValue) return [];
    return rows.map((row) => {
      const date = parseIsoDate(row.date);
      if (!date) missingFields += 1;
      return {
        sourceKey: electionSourceKey([
          "compiled-event",
          code,
          countySlugValue,
          row.title,
          row.date,
        ]),
        state: code,
        countySlug: countySlugValue,
        title: row.title,
        eventType: null,
        date,
        endDate: null,
        description: row.description || row.location || null,
        sourceName: COMPILED_SOURCE_NAME,
        sourceUrl: null,
        lastVerified: null,
      };
    });
  });

  const countyNames = new Set([
    ...Object.keys(electionsByCounty),
    ...Object.keys(eventsByCounty),
  ]);

  return {
    adapter: "compiled-overlay",
    stateCode: code,
    counties: [...countyNames]
      .filter((name) => !filterSlug || countySlug(name) === filterSlug)
      .map((name) => ({
        ...toCountyRecord(code, name),
        sourceName: COMPILED_SOURCE_NAME,
        sourceUrl: null,
        lastVerified: null,
      })),
    elections,
    events,
    emptyByDesign: elections.length === 0 && events.length === 0,
    missingFields,
  };
}
