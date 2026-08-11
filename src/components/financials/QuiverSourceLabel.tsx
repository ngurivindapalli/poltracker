"use client";

/** Shared source attribution for all Quiver-powered UI. */
export function QuiverSourceLabel({
  lastUpdated,
  estimateDisclaimer,
}: {
  lastUpdated?: string | null;
  estimateDisclaimer?: boolean;
}) {
  return (
    <div className="text-[11px] text-[#94A3B8] space-y-0.5">
      <div>
        Source:{" "}
        <span className="font-medium text-[#64748B]">Quiver Quantitative</span>
        {lastUpdated ? (
          <>
            {" · "}
            Last updated:{" "}
            <time dateTime={lastUpdated}>
              {new Date(lastUpdated).toLocaleString()}
            </time>
          </>
        ) : null}
      </div>
      {estimateDisclaimer ? (
        <div className="italic">
          Estimated Net Worth is a Quiver estimate — not an official government
          figure.
        </div>
      ) : null}
    </div>
  );
}
