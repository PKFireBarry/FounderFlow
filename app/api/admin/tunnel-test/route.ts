import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'barry0719@gmail.com';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check admin access
    const user = await currentUser();
    const userEmail = user?.emailAddresses?.[0]?.emailAddress;

    if (userEmail !== ADMIN_EMAIL) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const { webhookUrl, testPayload } = await request.json();

    if (!webhookUrl) {
      return NextResponse.json(
        { error: 'Webhook URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(webhookUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Make the test request to the webhook
    const startTime = Date.now();

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload || { test: true, ping: 'from-admin-test', timestamp: new Date().toISOString() }),
      });

      const responseTime = Date.now() - startTime;

      // Try to parse response as JSON, fall back to text
      let responseData;
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('application/json')) {
        try {
          responseData = await response.json();
        } catch {
          responseData = await response.text();
        }
      } else {
        responseData = await response.text();
      }

      return NextResponse.json({
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        responseTime,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
      });
    } catch (fetchError) {
      const responseTime = Date.now() - startTime;

      // Connection error (tunnel down, DNS failure, etc.)
      return NextResponse.json({
        success: false,
        status: 0,
        statusText: 'Connection Failed',
        responseTime,
        error: fetchError instanceof Error ? fetchError.message : 'Unknown connection error',
        errorType: fetchError instanceof Error ? fetchError.name : 'UnknownError',
      });
    }
  } catch (error) {
    console.error('Tunnel test error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
