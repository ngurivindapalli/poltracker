import { S3Client, GetObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

/**
 * User memory structure stored in S3
 */
export interface UserMemory {
  brand_context: string | null
  [key: string]: any // Allow for future memory fields
}

/**
 * In-memory cache entry with TTL
 */
interface CacheEntry {
  memory: UserMemory
  expiresAt: number
}

/**
 * S3-backed memory store with in-memory caching
 * S3 is the single source of truth; cache is for performance only
 */
class MemoryStore {
  private s3Client: S3Client | null = null
  private bucketName: string
  private prefix: string
  private cache: Map<string, CacheEntry> = new Map()
  private cacheTTL: number

  constructor() {
    this.bucketName = process.env.S3_BUCKET_NAME || ''
    this.prefix = process.env.MEMORY_S3_PREFIX || 'memories/'
    this.cacheTTL = (process.env.MEMORY_CACHE_TTL_SECONDS ? parseInt(process.env.MEMORY_CACHE_TTL_SECONDS, 10) : 60) * 1000

    if (this.bucketName) {
      this.s3Client = new S3Client({
        region: process.env.AWS_REGION || 'us-east-1',
        credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
          ? {
              accessKeyId: process.env.AWS_ACCESS_KEY_ID,
              secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            }
          : undefined,
      })
    }
  }

  /**
   * Get the S3 key for a user's memory file
   */
  private getUserKey(userId: string): string {
    return `${this.prefix}${userId}.json`
  }

  /**
   * Check if cache entry is still valid
   */
  private isCacheValid(entry: CacheEntry): boolean {
    return Date.now() < entry.expiresAt
  }

  /**
   * Invalidate cache for a user
   */
  private invalidateCache(userId: string): void {
    this.cache.delete(userId)
  }

  /**
   * Get user memory from S3 (with cache fallback)
   * Always fetches from S3 to ensure consistency
   */
  async get_user_memory(userId: string, bypassCache = false): Promise<UserMemory> {
    if (!this.s3Client || !this.bucketName) {
      throw new Error('S3 not configured. Set S3_BUCKET_NAME and AWS credentials.')
    }

    const key = this.getUserKey(userId)

    try {
      // Always fetch from S3 (single source of truth)
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      })

      const response = await this.s3Client.send(command)
      
      if (!response.Body) {
        // User has no memory yet, return default
        return { brand_context: null }
      }

      const bodyString = await response.Body.transformToString()
      const memory: UserMemory = JSON.parse(bodyString)

      // Update cache (unless bypassing)
      if (!bypassCache) {
        this.cache.set(userId, {
          memory,
          expiresAt: Date.now() + this.cacheTTL,
        })
      }

      return memory
    } catch (error: any) {
      // If object doesn't exist, return default memory
      if (error.name === 'NoSuchKey' || error.$metadata?.httpStatusCode === 404) {
        const defaultMemory: UserMemory = { brand_context: null }
        return defaultMemory
      }

      // Only check cache as fallback if not bypassing and S3 fails
      if (!bypassCache) {
        const cached = this.cache.get(userId)
        if (cached && this.isCacheValid(cached)) {
          console.warn(`S3 fetch failed for user ${userId}, using cached value:`, error.message)
          return cached.memory
        }
      }

      // If no cache and S3 fails, return default
      console.error(`Failed to fetch memory for user ${userId}:`, error)
      return { brand_context: null }
    }
  }

  /**
   * Set brand context for a user
   * Writes to S3 and invalidates cache
   */
  async set_brand_context(userId: string, brand_context: string): Promise<void> {
    if (!this.s3Client || !this.bucketName) {
      throw new Error('S3 not configured. Set S3_BUCKET_NAME and AWS credentials.')
    }

    // Get existing memory first (bypass cache to ensure we have latest)
    const existingMemory = await this.get_user_memory(userId, true)

    // Update brand context
    const updatedMemory: UserMemory = {
      ...existingMemory,
      brand_context,
    }

    // Write to S3
    const key = this.getUserKey(userId)
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: JSON.stringify(updatedMemory, null, 2),
      ContentType: 'application/json',
    })

    await this.s3Client.send(command)

    // Invalidate cache to force fresh fetch next time
    this.invalidateCache(userId)
  }

  /**
   * Delete brand context for a user
   * Sets brand_context to null in S3 and invalidates cache
   */
  async delete_brand_context(userId: string): Promise<void> {
    if (!this.s3Client || !this.bucketName) {
      throw new Error('S3 not configured. Set S3_BUCKET_NAME and AWS credentials.')
    }

    // Get existing memory first (bypass cache to ensure we have latest)
    const existingMemory = await this.get_user_memory(userId, true)

    // Set brand_context to null
    const updatedMemory: UserMemory = {
      ...existingMemory,
      brand_context: null,
    }

    // Write to S3
    const key = this.getUserKey(userId)
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: JSON.stringify(updatedMemory, null, 2),
      ContentType: 'application/json',
    })

    await this.s3Client.send(command)

    // Invalidate cache to ensure deletion is reflected
    this.invalidateCache(userId)
  }
}

// Export singleton instance
export const memoryStore = new MemoryStore()

// Export convenience functions
export async function get_user_memory(userId: string, bypassCache = false): Promise<UserMemory> {
  return memoryStore.get_user_memory(userId, bypassCache)
}

export async function set_brand_context(userId: string, brand_context: string): Promise<void> {
  return memoryStore.set_brand_context(userId, brand_context)
}

export async function delete_brand_context(userId: string): Promise<void> {
  return memoryStore.delete_brand_context(userId)
}
