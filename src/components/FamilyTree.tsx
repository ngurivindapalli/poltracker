"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";

interface FamilyTreeProps {
  senatorName: string;
}

interface FamilyMember {
  name: string;
  office?: string;
}

interface FamilyData {
  name: string;
  image?: string | null;
  wikipedia?: string | null;
  family: {
    spouses: FamilyMember[];
    children: FamilyMember[];
    parents: FamilyMember[];
    siblings: FamilyMember[];
  };
  government_connections?: boolean;
  office?: string;
}

interface TreeNodeProps {
  title: string;
  subtitle?: string;
  office?: string;
}

function TreeNode({ title, subtitle, office }: TreeNodeProps) {
  return (
    <Card className="min-w-[180px] max-w-[220px] text-center p-4 bg-white border border-[#E2E8F0] shadow-sm rounded-[12px] z-10 relative">
      <div className="font-bold text-[14px] text-[#111827] leading-tight">{title}</div>
      {subtitle && (
        <div className="mt-1 text-[11px] text-[#64748B] font-medium uppercase tracking-wide">
          {subtitle}
        </div>
      )}
      {office && (
        <div className="mt-2 inline-block px-2 py-0.5 text-[10px] font-semibold text-[#1D4ED8] bg-[#EFF6FF] border border-[#DBEAFE] rounded-full">
          {office}
        </div>
      )}
    </Card>
  );
}

function SectionEmpty({ label }: { label: string }) {
  return (
    <div className="text-[12px] text-[#94A3B8] italic text-center p-2">
      {label} not listed
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-12 justify-center items-center flex-wrap relative z-10">
      {children}
    </div>
  );
}

function VLine() {
  return (
    <div className="w-[2px] h-[50px] bg-[#CBD5E1] mx-auto rounded-full my-[-4px] relative z-0" />
  );
}

function HConnector() {
  return (
    <div className="h-[2px] bg-[#CBD5E1] mx-auto w-[80%] max-w-[500px] rounded-full my-6 relative z-0" />
  );
}

export default function FamilyTree({ senatorName }: FamilyTreeProps) {
  const [family, setFamily] = useState<FamilyData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/family/${encodeURIComponent(senatorName)}`)
      .then((r) => r.json())
      .then((data) => {
        setFamily(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [senatorName]);

  const parents = useMemo(() => family?.family?.parents ?? [], [family]);
  const siblings = useMemo(() => family?.family?.siblings ?? [], [family]);
  const spouseList = useMemo(() => family?.family?.spouses ?? [], [family]);
  const children = useMemo(() => family?.family?.children ?? [], [family]);

  if (loading) return (
      <Card className="p-8 text-center text-[#64748B]">Loading family connections...</Card>
  );
  
  if (!family) return null;

  const spouse = spouseList.length ? spouseList[0] : null;

  return (
    <Card className="bg-[#F8FAFC] border border-[#E2E8F0] p-8 py-12 overflow-x-auto">
      <div className="relative min-w-[600px] flex flex-col items-center">
        {/* Parents */}
        <div className="mb-4 w-full flex justify-center">
          {parents.length ? (
            <Row>
              {parents.map((p, i) => (
                <TreeNode key={`parent-${i}`} title={p.name} subtitle="Parent" office={p.office} />
              ))}
            </Row>
          ) : (
            <SectionEmpty label="Parents" />
          )}
        </div>

        <VLine />

        {/* Middle Generation */}
        <div className="flex gap-16 items-center justify-center w-full my-6">
          {/* Siblings */}
          <div className="flex flex-col gap-4">
            {siblings.length ? (
                siblings.map((s, i) => (
                  <TreeNode key={`sib-${i}`} title={s.name} subtitle="Sibling" office={s.office} />
                ))
            ) : (
              <SectionEmpty label="Siblings" />
            )}
          </div>

          {/* Senator */}
          <div className="scale-110 z-20 shadow-md rounded-[12px]">
            <TreeNode title={family.name} subtitle="U.S. Senator" office={family.office} />
          </div>

          {/* Spouse */}
          <div>
            {spouse ? (
              <TreeNode title={spouse.name} subtitle="Spouse" office={spouse.office} />
            ) : (
              <SectionEmpty label="Spouse" />
            )}
          </div>
        </div>

        {children.length > 0 && (
            <>
                <VLine />
                <HConnector />
                {/* Children */}
                <div className="mt-4 w-full flex justify-center">
                    <Row>
                    {children.map((c, i) => (
                        <TreeNode key={`child-${i}`} title={c.name} subtitle="Child" office={c.office} />
                    ))}
                    </Row>
                </div>
            </>
        )}
      </div>
    </Card>
  );
}
