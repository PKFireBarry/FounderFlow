import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase/server';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  limitName: string;
}

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number; // Unix timestamp
  response?: Response;
}

/**
 * Firebase Firestore-based rate limiting
 * No external dependencies needed - uses existing Firebase setup
 */
export async function checkFirebaseRateLimit(
  userId: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const { maxRequests, windowMs, limitName } = config;
  const now = Date.now();
  const windowStart = now - windowMs;

  try {
    // Document path: rate_limits/{userId}_{limitName}
    const docId = `${userId}_${limitName.toLowerCase().replace(/\s+/g, '_')}`;
    const rateLimitRef = doc(db, 'rate_limits', docId);

    // Get existing rate limit data
    const rateLimitDoc = await getDoc(rateLimitRef);

    if (!rateLimitDoc.exists()) {
      // First request - create new rate limit entry
      await setDoc(rateLimitRef, {
        userId,
        limitName,
        requests: [now],
        createdAt: now,
        expiresAt: now + windowMs
      });

      return {
        allowed: true,
        limit: maxRequests,
        remaining: maxRequests - 1,
        reset: now + windowMs
      };
    }

    const data = rateLimitDoc.data();
    const requests: number[] = data.requests || [];

    // Filter out requests outside the current window
    const recentRequests = requests.filter((timestamp: number) => timestamp > windowStart);

    // Check if limit exceeded
    if (recentRequests.length >= maxRequests) {
      const oldestRequest = Math.min(...recentRequests);
      const resetTime = oldestRequest + windowMs;

      console.log(`⚠️ Rate limit exceeded for ${limitName}: ${userId}`);

      const response = new Response(
        JSON.stringify({
          error: `Rate limit exceeded for ${limitName}`,
          limit: maxRequests,
          remaining: 0,
          reset: new Date(resetTime).toISOString(),
          retryAfter: Math.ceil((resetTime - now) / 1000) // seconds
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': maxRequests.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(resetTime).toISOString(),
            'Retry-After': Math.ceil((resetTime - now) / 1000).toString()
          }
        }
      );

      return {
        allowed: false,
        limit: maxRequests,
        remaining: 0,
        reset: resetTime,
        response
      };
    }

    // Update requests array with current timestamp
    const updatedRequests = [...recentRequests, now];
    await setDoc(rateLimitRef, {
      userId,
      limitName,
      requests: updatedRequests,
      lastUpdated: now,
      expiresAt: now + windowMs
    });

    const remaining = maxRequests - updatedRequests.length;

    return {
      allowed: true,
      limit: maxRequests,
      remaining,
      reset: now + windowMs
    };

  } catch (error) {
    console.error(`Error checking rate limit for ${limitName}:`, error);
    // On error, allow the request (fail open)
    return {
      allowed: true,
      limit: maxRequests,
      remaining: maxRequests,
      reset: now + windowMs
    };
  }
}

/**
 * Cleanup expired rate limit entries (run periodically via cron or cloud function)
 */
export async function cleanupExpiredRateLimits(): Promise<number> {
  // This would need to be implemented as a scheduled function
  // For now, rate limits auto-expire by filtering old timestamps
  return 0;
}

// Pre-configured rate limit checks
export async function checkAIGenerationLimit(userId: string): Promise<RateLimitResult> {
  return checkFirebaseRateLimit(userId, {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 1 hour
    limitName: 'AI Generation'
  });
}

export async function checkCheckoutLimit(userId: string): Promise<RateLimitResult> {
  return checkFirebaseRateLimit(userId, {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 1 hour
    limitName: 'Checkout'
  });
}

export async function checkGeneralAPILimit(userId: string): Promise<RateLimitResult> {
  return checkFirebaseRateLimit(userId, {
    maxRequests: 60,
    windowMs: 60 * 1000, // 1 minute
    limitName: 'General API'
  });
}
