import { COMPILED_SOURCE_NAME } from "@/lib/localElections/types";
import { isCompiledSource, isOfficialSource } from "@/lib/localElections/normalize";

function formatVerified(value: string | null | undefined) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function SourceAttribution({
  sourceName,
  sourceUrl,
  lastVerified,
}: {
  sourceName: string | null | undefined;
  sourceUrl?: string | null;
  lastVerified?: string | null;
}) {
  const verified = formatVerified(lastVerified || null);
  const name = sourceName?.trim() || "";
  const compiled = isCompiledSource(name);
  const official = isOfficialSource(name);
  const label = compiled
    ? "Compiled dataset"
    : official
      ? "Official source"
      : null;

  return (
    <div className="mt-3 text-xs leading-relaxed text-muted-foreground">
      {label ? <p className="label-caps mb-1">{label}</p> : null}
      <p>
        Source:{" "}
        {name && sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {name}
          </a>
        ) : (
          <span>{name || "Source information unavailable"}</span>
        )}
      </p>
      {verified ? <p>Last verified: {verified}</p> : null}
    </div>
  );
}

export { COMPILED_SOURCE_NAME };
