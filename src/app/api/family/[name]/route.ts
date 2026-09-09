export const dynamic = "force-dynamic"

import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

function emptyFamily(name: string) {
  return {
    name,
    image: null,
    wikipedia: null,
    family: {
      spouses: [],
      children: [],
      parents: [],
      siblings: [],
    },
    government_connections: false,
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { name: string } }
) {
  try {
    const name = decodeURIComponent(params.name || "").trim()
    const filePath = path.join(process.cwd(), "public", "data", "familyTrees.json")

    if (!name || !fs.existsSync(filePath)) {
      return NextResponse.json(emptyFamily(name || "Unknown"))
    }

    const raw = fs.readFileSync(filePath, "utf8")
    const data = JSON.parse(raw)

    if (Array.isArray(data)) {
      const match = data.find(
        (s: { name?: string }) =>
          s.name && s.name.toLowerCase() === name.toLowerCase()
      )
      if (match) return NextResponse.json(match)
    }

    return NextResponse.json(emptyFamily(name))
  } catch {
    return NextResponse.json(emptyFamily("Unknown"))
  }
}
