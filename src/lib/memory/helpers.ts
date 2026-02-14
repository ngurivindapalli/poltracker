/**
 * Helper functions for AI/agent systems to use brand context
 * These functions always fetch fresh from S3 (no caching for AI prompts)
 */

import { get_user_memory } from './store'

/**
 * Get brand context for a user (always fresh from S3, bypasses cache)
 * Use this in AI prompts, agent systems, and graph builders
 * 
 * @param userId - The user ID
 * @returns The brand context string, or null if not set
 */
export async function getBrandContextForAI(userId: string): Promise<string | null> {
  // Bypass cache to ensure we always get the latest from S3
  const memory = await get_user_memory(userId, true)
  return memory.brand_context
}

/**
 * Get full user memory for AI systems
 * Always fetches fresh from S3 (bypasses cache) to ensure latest data
 * 
 * @param userId - The user ID
 * @returns The full user memory object
 */
export async function getUserMemoryForAI(userId: string) {
  // Bypass cache to ensure we always get the latest from S3
  return get_user_memory(userId, true)
}

/**
 * Build a system prompt with brand context injected
 * Fetches brand context fresh from S3 on every call
 * 
 * @param userId - The user ID
 * @param basePrompt - The base system prompt
 * @returns The system prompt with brand context appended if available
 */
export async function buildSystemPromptWithBrandContext(
  userId: string,
  basePrompt: string
): Promise<string> {
  const brandContext = await getBrandContextForAI(userId)
  
  if (!brandContext) {
    return basePrompt
  }

  return `${basePrompt}

## Brand Context
${brandContext}`
}
