import { NextRequest, NextResponse } from 'next/server'
import { get_user_memory, set_brand_context, delete_brand_context } from '@/lib/memory/store'

export const dynamic = 'force-dynamic'

/**
 * GET /api/memory/[userId]
 * Get user memory (including brand context)
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const memory = await get_user_memory(userId)

    return NextResponse.json({
      userId,
      memory,
    })
  } catch (error: any) {
    console.error('Error fetching user memory:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch user memory' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/memory/[userId]
 * Set brand context for a user
 * Body: { brand_context: string }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const body = await req.json()
    const { brand_context } = body

    if (typeof brand_context !== 'string') {
      return NextResponse.json(
        { error: 'brand_context must be a string' },
        { status: 400 }
      )
    }

    await set_brand_context(userId, brand_context)

    return NextResponse.json({
      userId,
      success: true,
      message: 'Brand context updated',
    })
  } catch (error: any) {
    console.error('Error setting brand context:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to set brand context' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/memory/[userId]
 * Delete brand context for a user
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    await delete_brand_context(userId)

    return NextResponse.json({
      userId,
      success: true,
      message: 'Brand context deleted',
    })
  } catch (error: any) {
    console.error('Error deleting brand context:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to delete brand context' },
      { status: 500 }
    )
  }
}
