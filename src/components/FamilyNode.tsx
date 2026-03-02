import React from "react"

interface FamilyNodeProps {
  data: {
    name: string
    relationship?: string
    office?: string
  }
}

export default function FamilyNode({ data }: FamilyNodeProps) {
  return (
    <div
      style={{
        padding: "12px 16px",
        background: "white",
        borderRadius: "12px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        border: "1px solid #e5e7eb",
        minWidth: "160px",
        fontFamily: "Inter, sans-serif"
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: "15px",
          marginBottom: "4px"
        }}
      >
        {data.name}
      </div>

      <div
        style={{
          fontSize: "12px",
          color: "#6b7280",
          marginBottom: "6px"
        }}
      >
        {data.relationship}
      </div>

      {data.office && (
        <div
          style={{
            fontSize: "12px",
            background: "#eef2ff",
            padding: "3px 6px",
            borderRadius: "6px",
            display: "inline-block",
            color: "#3730a3"
          }}
        >
          {data.office}
        </div>
      )}
    </div>
  )
}
