import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'barry0719@gmail.com';

interface FounderData {
  name: string;
  company: string;
  role: string;
  looking_for: string;
  company_info: string;
  company_url: string;
  linkedinurl: string;
  email: string;
}

interface OutreachData {
  founderData: FounderData;
  outreachType: 'job' | 'collaboration' | 'friendship';
  messageType: 'email' | 'linkedin';
  resumeText: string;
  userGoals: string;
}

// Build prompt using the same logic as generate-outreach route
function buildOutreachPrompt(data: OutreachData): string {
  const { founderData, outreachType, messageType, resumeText, userGoals } = data;

  let prompt = '';

  if (outreachType === 'job') {
    prompt = `
You are an expert at crafting high-converting cold outreach messages based on modern job market best practices. Your goal is to write a message that cuts through the noise and gets a response.

CRITICAL PRINCIPLES:
- Keep it under 200 words (less is more)
- Use plain, conversational language - no buzzwords, corporate speak, or AI-sounding phrases
- Be specific with examples and concrete results from the actual resume
- Have ONE clear, specific ask
- Show genuine interest based on what you know about them
- Sound completely human - use contractions, natural flow, casual but professional tone
- Format: Who you are → Why you're reaching out → Why they should care

TARGET DETAILS:
Person: ${founderData.name || 'Hiring team'}
Company: ${founderData.company || 'Unknown Company'}
Company Description: ${founderData.company_info || 'Not specified'}
Role: ${founderData.role || 'Not specified'}
What they're looking for: ${founderData.looking_for || 'Not specified'}
LinkedIn URL: ${founderData.linkedinurl || 'Not provided'}
Company URL: ${founderData.company_url || 'Not provided'}

HOW TO REFERENCE THEM:
${founderData.company_info ? '- Reference their company description: "' + founderData.company_info + '"' : ''}
${founderData.looking_for ? '- Specifically address what they\'re looking for: "' + founderData.looking_for + '"' : ''}
${founderData.role ? '- Reference their role: ' + founderData.role : ''}
${!founderData.company_info ? '- Use general but genuine language about their work/company' : ''}

USER'S RESUME:
${resumeText}

USER'S GOALS:
${userGoals}

MESSAGE TYPE: ${messageType} (email or LinkedIn)

${messageType === 'email' ? `
Write a complete, ready-to-send cold email with NO placeholders, brackets, or comments.

EMAIL STRUCTURE:
1. OPENS with who you are (1 sentence max)
2. STATES why you're reaching out specifically to them/their company
3. HIGHLIGHTS 1-2 most relevant achievements from the resume with specific results
4. MAKES one clear, specific ask (15-minute call, coffee chat, or specific next step)
5. SOUNDS completely human and conversational

Include a compelling subject line (6-8 words max).
` : `
Write a complete, ready-to-send LinkedIn DM with NO placeholders, brackets, or comments.

LINKEDIN MESSAGE STYLE:
- Much more casual and direct than email
- Keep under 100 words
- Get straight to the point
- Ask directly: "Do you have any open roles?" or similar
- Less about selling yourself, more about asking what's available
- Social media tone - like you're messaging a friend
- No formal greetings or signatures needed

STRUCTURE:
1. Quick intro (who you are in 5-7 words)
2. Direct question about opportunities
3. Brief mention of relevant experience
4. Simple ask for next step
`}

CRITICAL: Write the actual content. Do NOT use placeholders. If you don't have specific information, write around it naturally. The message must be ready to copy and send immediately.
`;
  } else if (outreachType === 'collaboration') {
    prompt = `
You are crafting a collaboration outreach message between founders/builders. This is about mutual value creation, not job seeking.

COLLABORATION PRINCIPLES:
- Lead with specific value you can provide
- Show you understand their current challenges/projects
- Propose concrete ways to work together
- Be peer-to-peer, not supplicant
- Under 200 words, plain language
- One clear next step

TARGET DETAILS:
Person: ${founderData.name || 'Team'}
Company: ${founderData.company || 'Unknown Company'}
Company Description: ${founderData.company_info || 'Not specified'}
What they're working on: ${founderData.looking_for || 'Not specified'}
LinkedIn URL: ${founderData.linkedinurl || 'Not provided'}
Company URL: ${founderData.company_url || 'Not provided'}

HOW TO REFERENCE THEM:
${founderData.company_info ? '- Reference their company description for collaboration fit: "' + founderData.company_info + '"' : ''}
${founderData.looking_for ? '- Specifically address what they\'re working on: "' + founderData.looking_for + '"' : ''}
${!founderData.company_info ? '- Use general but genuine language about their work/company' : ''}

USER'S RESUME:
${resumeText}

USER'S GOALS:
${userGoals}

MESSAGE TYPE: ${messageType} (email or LinkedIn)

${messageType === 'email' ? `
Write a complete, ready-to-send collaboration email with NO placeholders, brackets, or comments.

EMAIL STRUCTURE:
1. OPENS with a specific observation about their work/company
2. INTRODUCES yourself with relevant credibility (1-2 sentences max)
3. PROPOSES specific value you can provide based on your actual skills/experience
4. SUGGESTS concrete collaboration ideas
5. ASKS for one specific next step

Subject line should hint at the collaboration opportunity.
` : `
Write a complete, ready-to-send LinkedIn DM with NO placeholders, brackets, or comments.

LINKEDIN COLLABORATION STYLE:
- Casual, founder-to-founder tone
- Talk openly about what you're both working on
- Focus on alignment and mutual benefit
- Keep under 100 words
- Direct and conversational
- "Hey, I'm working on X, saw you're doing Y, think there might be some overlap"

STRUCTURE:
1. Quick intro about what you're working on
2. Mention what you saw about their work
3. Point out potential alignment/collaboration
4. Simple ask to chat more
`}

CRITICAL: Write the actual content with NO placeholders. Tone should be confident peer-to-peer. The message must be ready to copy and send immediately.
`;
  } else if (outreachType === 'friendship') {
    prompt = `
You are crafting a genuine networking message focused on building authentic professional relationships. This is about human connection and mutual learning, not immediate asks.

NETWORKING PRINCIPLES:
- Lead with genuine curiosity about their work
- Find authentic connection points (shared experiences, interests)
- Offer value or insights, don't just take
- Be conversational but professional
- No immediate asks for jobs/favors
- Focus on learning and relationship building

TARGET DETAILS:
Person: ${founderData.name || 'Professional'}
Company: ${founderData.company || 'Unknown Company'}
Company Description: ${founderData.company_info || 'Not specified'}
Their focus: ${founderData.looking_for || 'Not specified'}
LinkedIn URL: ${founderData.linkedinurl || 'Not provided'}
Company URL: ${founderData.company_url || 'Not provided'}

HOW TO REFERENCE THEM:
${founderData.company_info ? '- Reference their company description to show understanding: "' + founderData.company_info + '"' : ''}
${founderData.looking_for ? '- Show interest in what they\'re focused on: "' + founderData.looking_for + '"' : ''}
${!founderData.company_info ? '- Use general but genuine language about their work/company' : ''}

USER'S RESUME:
${resumeText}

USER'S GOALS:
${userGoals}

MESSAGE TYPE: ${messageType} (email or LinkedIn)

${messageType === 'email' ? `
Write a complete, ready-to-send networking email with NO placeholders, brackets, or comments.

EMAIL STRUCTURE:
1. OPENS with specific interest in their work/company (not generic praise)
2. SHARES a genuine connection point from your actual background
3. OFFERS something of value based on your real experience
4. EXPRESSES curiosity about their experience/perspective
5. SUGGESTS low-pressure connection (coffee chat, informal call)
6. SOUNDS genuinely interested in them as a person

Subject line should be warm and specific to them.
` : `
Write a complete, ready-to-send LinkedIn DM with NO placeholders, brackets, or comments.

LINKEDIN NETWORKING STYLE:
- Super casual and friendly
- Like adding a friend on social media
- Focus on staying connected and seeing each other's posts
- Keep under 80 words
- "Hey, I see you're also working on AI stuff. I'm really into AI too. Would be cool to stay connected!"
- Natural, conversational tone
- About mutual following and engagement

STRUCTURE:
1. Quick observation about shared interest/background
2. Mention your similar interest
3. Suggest staying connected to see each other's content
4. Keep it light and social
`}

CRITICAL: Write the actual content with NO placeholders. Use natural, conversational language. Tone should be curious and authentic like you're connecting with someone on social media.
`;
  }

  return prompt;
}

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

    const body = await request.json();
    const { webhookUrl, testPayload, mode, outreachData } = body;

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

    // Determine what to send based on mode
    let payloadToSend: any;

    if (mode === 'outreach' && outreachData) {
      // Build the full prompt
      const prompt = buildOutreachPrompt(outreachData as OutreachData);
      payloadToSend = { prompt };
    } else {
      // Simple connection test
      payloadToSend = testPayload || {
        test: true,
        ping: 'from-admin-test',
        timestamp: new Date().toISOString()
      };
    }

    // Make the request to the webhook
    const startTime = Date.now();

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payloadToSend),
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
        // Include the prompt that was sent (for debugging)
        ...(mode === 'outreach' ? { promptSent: payloadToSend.prompt.substring(0, 500) + '...' } : {}),
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
