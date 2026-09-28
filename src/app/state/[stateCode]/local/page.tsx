import Link from "next/link";
import { notFound } from "next/navigation";
import { CountyDirectory } from "@/components/state/CountyDirectory";
import { getCountyDirectory } from "@/lib/localData/directory";
import { STATE_CODE_TO_NAME } from "@/lib/localData/usCounties";

export const revalidate = 600;

export default async function StateLocalPage({
  params,
}: {
  params: { stateCode: string };
}) {
  const state = params.stateCode.toUpperCase();
  if (!STATE_CODE_TO_NAME[state]) notFound();
  const directory = await getCountyDirectory(state);

  return (
    <main className="mx-auto max-w-[900px] px-6 py-12">
      <Link
        href={`/state/${state}`}
        className="text-sm text-muted-foreground hover:text-foreground"
      >
        ← {directory.stateName}
      </Link>
      <p className="label-caps mt-6">{directory.stateName}</p>
      <CountyDirectory
        stateCode={state}
        stateName={directory.stateName}
        counties={directory.counties}
        hasAnyRecords={directory.hasAnyRecords}
        coverage={directory.coverage}
        authorityName={directory.authorityName}
        authorityUrl={directory.authorityUrl}
      />
    </main>
  );
}
