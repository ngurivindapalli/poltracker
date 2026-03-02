export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { fetchGermanMembers } from '@/lib/germany/memberProvider'
import { fetchGermanMemberNews } from '@/lib/germany/newsProvider'

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const members = await fetchGermanMembers()
    const member = members.find((m: any) => m.id === params.id)

    if (!member) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      )
    }

    const articles = await fetchGermanMemberNews(member.name)

    return NextResponse.json({ articles })
  } catch (err: any) {
    console.error('Error fetching German member news:', err)
    return NextResponse.json(
      { articles: [], error: err?.message ?? 'Failed to fetch news' },
      { status: 500 }
    )
  }
}
