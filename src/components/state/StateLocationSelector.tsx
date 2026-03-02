"use client";

import { useState } from "react";
// @ts-ignore
import { STATE_LOCATIONS } from "../../../data/stateLocations";

interface StateLocationSelectorProps {
  stateCode: string;
  stateName: string;
  onLocationChange: (scope: string, value?: string) => void;
}

export default function StateLocationSelector({ stateCode, stateName, onLocationChange }: StateLocationSelectorProps) {
  const [scope, setScope] = useState<string>("state");
  const [locationValue, setLocationValue] = useState<string>("");

  const locations = STATE_LOCATIONS[stateCode] ?? { cities: [], counties: [] };
  const hasOptions = (locations.counties && locations.counties.length > 0) || (locations.cities && locations.cities.length > 0);

  if (!hasOptions) {
    return null;
  }

  function handleScopeChange(newScope: string) {
    setScope(newScope);
    setLocationValue("");
    onLocationChange(newScope, undefined);
  }

  function handleLocationChange(value: string) {
    setLocationValue(value);
    onLocationChange(scope, value || undefined);
  }

  return (
    <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px] p-6 mb-6">
      <h3 className="text-[14px] font-semibold text-[#1E3A5F] mb-4 uppercase tracking-wide">
        Filter Coverage Area
      </h3>
      
      <div className="flex flex-wrap gap-6">
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-[#64748B] uppercase">Scope</label>
          <select
            value={scope}
            onChange={(e) => handleScopeChange(e.target.value)}
            className="h-[40px] px-3 rounded-[8px] border border-[#E2E8F0] bg-white text-[#1E3A5F] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] min-w-[140px]"
          >
            <option value="state">Statewide</option>
            {locations.counties && locations.counties.length > 0 && (
              <option value="county">County</option>
            )}
            {locations.cities && locations.cities.length > 0 && (
              <option value="city">City</option>
            )}
          </select>
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-[12px] font-medium text-[#64748B] uppercase">Location</label>
          <select
            value={locationValue}
            onChange={(e) => handleLocationChange(e.target.value)}
            disabled={scope === "state"}
            className={`h-[40px] px-3 rounded-[8px] border border-[#E2E8F0] text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB] min-w-[200px] ${
              scope === "state" 
                ? "bg-[#F1F5F9] text-[#94A3B8] cursor-not-allowed" 
                : "bg-white text-[#1E3A5F] cursor-pointer"
            }`}
          >
            <option value="">— Select Location —</option>
            {scope === "county" && locations.counties?.map((county: string, index: number) => (
              <option key={index} value={county}>{county}</option>
            ))}
            {scope === "city" && locations.cities?.map((city: string, index: number) => (
              <option key={index} value={city}>{city}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
