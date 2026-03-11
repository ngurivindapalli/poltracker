import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"
import posts from "@/data/candidatePosts.json"

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, office, state, party, content } = body

    // Validate required fields
    if (!name || !office || !state || !party || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Create new post
    const newPost = {
      id: Math.max(...posts.map((p: any) => p.id), 0) + 1,
      name,
      office,
      state,
      party,
      date: new Date().toISOString().split("T")[0],
      content,
    }

    // Append to posts array
    const updatedPosts = [...posts, newPost]

    // Write to file
    const filePath = path.join(process.cwd(), "src", "data", "candidatePosts.json")
    fs.writeFileSync(filePath, JSON.stringify(updatedPosts, null, 2), "utf-8")

    return NextResponse.json(newPost, { status: 201 })
  } catch (error) {
    console.error("Error creating post:", error)
    return NextResponse.json(
      { error: "Failed to create post" },
      { status: 500 }
    )
  }
}
