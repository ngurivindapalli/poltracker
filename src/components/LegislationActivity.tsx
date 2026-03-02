"use client";

import { useState, useEffect } from "react";

interface Bill {
  type: string;
  number: string;
  title: string;
  latestAction: string;
}

interface LegislationData {
  sponsored: Bill[];
  cosponsored: Bill[];
}

export default function LegislationActivity({ bioguideId }: { bioguideId: string }) {
  const [data, setData] = useState<LegislationData>({
    sponsored: [],
    cosponsored: []
  });

  const [tab, setTab] = useState<"sponsored" | "cosponsored">("sponsored");
  const [openBill, setOpenBill] = useState<string | null>(null);
  const [summary, setSummary] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/congress/${bioguideId}`)
      .then(r => r.json())
      .then(setData);
  }, [bioguideId]);

  const bills = tab === "sponsored" ? data.sponsored : data.cosponsored;

  return (
    <div className="bg-white p-6 rounded-xl shadow">
      <h2 className="text-xl font-semibold mb-6">
        Legislative Activity
      </h2>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setTab("sponsored")}
          className={`px-4 py-2 rounded ${
            tab === "sponsored"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Sponsored ({data.sponsored.length})
        </button>

        <button
          onClick={() => setTab("cosponsored")}
          className={`px-4 py-2 rounded ${
            tab === "cosponsored"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
          }`}
        >
          Cosponsored ({data.cosponsored.length})
        </button>
      </div>

      <div className="space-y-4">
        {bills.map(bill => {
          const id = bill.type + bill.number;
          const open = openBill === id;

          return (
            <div
              key={id}
              className="border rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold text-lg">
                    {bill.type.toUpperCase()} {bill.number}
                  </div>

                  <div className="text-gray-700">
                    {bill.title}
                  </div>

                  <div className="text-sm text-gray-500 mt-1">
                    {bill.latestAction}
                  </div>
                </div>

                <button
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm h-fit"
                  onClick={async () => {
                    if (open) {
                      setOpenBill(null);
                      return;
                    }

                    setLoading(id);

                    const res = await fetch("/api/bill-summary", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json"
                      },
                      body: JSON.stringify({
                        title: bill.title,
                        action: bill.latestAction
                      })
                    });

                    const data = await res.json();

                    setSummary(prev => ({
                      ...prev,
                      [id]: data.summary
                    }));

                    setLoading(null);
                    setOpenBill(id);
                  }}
                >
                  {open ? "Hide" : "Summarize"}
                </button>
              </div>

              {loading === id && (
                <div className="mt-3 text-gray-400">
                  Generating summary...
                </div>
              )}

              {open && summary[id] && (
                <div className="mt-4 bg-gray-50 border rounded-lg p-4">
                  <div className="text-sm leading-relaxed">
                    {summary[id]}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
