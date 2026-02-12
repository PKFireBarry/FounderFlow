import { NextResponse } from 'next/server';

/**
 * Sanitized API Error Handler
 * Prevents leaking internal details, stack traces, and system information to clients
 */

export interface ApiError {
  message: string;
  statusCode: number;
  code?: string;
}

/**
 * Maps internal error types to safe, user-friendly messages
 */
const ERROR_MESSAGES: Record<string, string> = {
  // Authentication & Authorization
  UNAUTHORIZED: 'Authentication required. Please sign in.',
  FORBIDDEN: 'You do not have permission to access this resource.',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please try again later.',

  // Data & Validation
  INVALID_INPUT: 'Invalid input data provided.',
  NOT_FOUND: 'The requested resource was not found.',
  PROFILE_NOT_FOUND: 'User profile not found. Please set up your profile first.',

  // External Services
  FIREBASE_ERROR: 'Database operation failed. Please try again.',
  STRIPE_ERROR: 'Payment processing error. Please try again.',
  AI_GENERATION_ERROR: 'Message generation failed. Please try again.',
  WEBHOOK_ERROR: 'External service communication failed.',

  // Generic
  INTERNAL_ERROR: 'An unexpected error occurred. Please try again.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
};

/**
 * Logs error details server-side for monitoring
 */
function logError(error: unknown, context: {
  endpoint: string;
  userId?: string;
  action?: string;
}): void {
  const timestamp = new Date().toISOString();
  const errorDetails = error instanceof Error ? {
    name: error.name,
    message: error.message,
    stack: error.stack
  } : { raw: error };

  console.error(`[API Error] ${timestamp}`, {
    ...context,
    error: errorDetails
  });
}

/**
 * Creates a safe error response that doesn't leak internal details
 */
export function createErrorResponse(
  error: unknown,
  context: {
    endpoint: string;
    userId?: string;
    action?: string;
    defaultMessage?: string;
    statusCode?: number;
  }
): NextResponse {
  // Log full error details server-side
  logError(error, context);

  // Determine status code
  let statusCode = context.statusCode || 500;
  let errorCode = 'INTERNAL_ERROR';
  let userMessage = context.defaultMessage || ERROR_MESSAGES.INTERNAL_ERROR;

  // Handle known error patterns
  if (error instanceof Error) {
    const errorMessage = error.message.toLowerCase();

    // Firebase errors
    if (errorMessage.includes('firebase') || errorMessage.includes('firestore')) {
      errorCode = 'FIREBASE_ERROR';
      userMessage = ERROR_MESSAGES.FIREBASE_ERROR;
      statusCode = 500;
    }
    // Stripe errors
    else if (errorMessage.includes('stripe')) {
      errorCode = 'STRIPE_ERROR';
      userMessage = ERROR_MESSAGES.STRIPE_ERROR;
      statusCode = 500;
    }
    // Rate limit errors (should be handled separately, but as fallback)
    else if (errorMessage.includes('rate limit')) {
      errorCode = 'RATE_LIMIT_EXCEEDED';
      userMessage = ERROR_MESSAGES.RATE_LIMIT_EXCEEDED;
      statusCode = 429;
    }
    // Authentication errors
    else if (errorMessage.includes('unauthorized') || errorMessage.includes('authentication')) {
      errorCode = 'UNAUTHORIZED';
      userMessage = ERROR_MESSAGES.UNAUTHORIZED;
      statusCode = 401;
    }
    // Authorization errors
    else if (errorMessage.includes('forbidden') || errorMessage.includes('permission')) {
      errorCode = 'FORBIDDEN';
      userMessage = ERROR_MESSAGES.FORBIDDEN;
      statusCode = 403;
    }
    // Not found errors
    else if (errorMessage.includes('not found')) {
      errorCode = 'NOT_FOUND';
      userMessage = ERROR_MESSAGES.NOT_FOUND;
      statusCode = 404;
    }
    // Validation errors
    else if (errorMessage.includes('invalid') || errorMessage.includes('validation')) {
      errorCode = 'INVALID_INPUT';
      userMessage = ERROR_MESSAGES.INVALID_INPUT;
      statusCode = 400;
    }
  }

  // Return sanitized error response (no stack traces, no internal details)
  return NextResponse.json(
    {
      error: userMessage,
      code: errorCode,
      // Only in development: include more details
      ...(process.env.NODE_ENV === 'development' && error instanceof Error && {
        _dev: {
          originalMessage: error.message,
          // Don't include stack in response even in dev (check logs instead)
        }
      })
    },
    { status: statusCode }
  );
}

/**
 * Specific error response creators for common scenarios
 */
export const ApiErrors = {
  unauthorized: () => NextResponse.json(
    { error: ERROR_MESSAGES.UNAUTHORIZED, code: 'UNAUTHORIZED' },
    { status: 401 }
  ),

  forbidden: () => NextResponse.json(
    { error: ERROR_MESSAGES.FORBIDDEN, code: 'FORBIDDEN' },
    { status: 403 }
  ),

  notFound: (resource?: string) => NextResponse.json(
    {
      error: resource ? `${resource} not found.` : ERROR_MESSAGES.NOT_FOUND,
      code: 'NOT_FOUND'
    },
    { status: 404 }
  ),

  invalidInput: (details?: string) => NextResponse.json(
    {
      error: details || ERROR_MESSAGES.INVALID_INPUT,
      code: 'INVALID_INPUT'
    },
    { status: 400 }
  ),

  rateLimit: (retryAfter?: number) => NextResponse.json(
    {
      error: ERROR_MESSAGES.RATE_LIMIT_EXCEEDED,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter
    },
    {
      status: 429,
      headers: retryAfter ? { 'Retry-After': retryAfter.toString() } : {}
    }
  ),

  serviceUnavailable: () => NextResponse.json(
    { error: ERROR_MESSAGES.SERVICE_UNAVAILABLE, code: 'SERVICE_UNAVAILABLE' },
    { status: 503 }
  ),
};
