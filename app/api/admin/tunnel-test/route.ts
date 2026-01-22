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

// Build web browsing instructions for Gemini CLI
function buildWebBrowsingInstructions(founderData: FounderData): string {
  const instructions: string[] = [];

  if (founderData.company_url && founderData.company_url.trim() && founderData.company_url.toLowerCase() !== 'n/a') {
    instructions.push(`- COMPANY WEBSITE: Visit ${founderData.company_url} to understand their product, mission, and culture`);
  }

  if (founderData.linkedinurl && founderData.linkedinurl.trim() && founderData.linkedinurl.toLowerCase() !== 'n/a') {
    const personRef = hasValue(founderData.name) ? founderData.name : 'this person';
    instructions.push(`- LINKEDIN PROFILE: Visit ${founderData.linkedinurl} to learn about ${personRef}s background and experience`);
  }

  if (instructions.length === 0) {
    return '';
  }

  return `
IMPORTANT: You have web browsing capabilities. Please visit these URLs to gather more context:

${instructions.join('\n')}

Use the information from these pages to make your outreach message highly specific and personalized. Reference specific details you find rather than generic statements.

`;
}

// Helper to check if a value is missing or n/a
function hasValue(val: string | undefined | null): boolean {
  if (!val) return false;
  const trimmed = val.trim().toLowerCase();
  return trimmed !== '' && trimmed !== 'n/a' && trimmed !== 'na' && trimmed !== 'not specified' && trimmed !== 'not provided';
}

// Build prompt using the same logic as generate-outreach route
// IMPORTANT: No quotation marks allowed in prompt - CLI interprets them as argument delimiters
function buildOutreachPrompt(data: OutreachData): string {
  const { founderData, outreachType, messageType, resumeText, userGoals } = data;

  // Build web browsing instructions if URLs are available
  const webBrowsingInstructions = buildWebBrowsingInstructions(founderData);

  // Build target info section - only include fields that have real values
  const targetInfo: string[] = [];
  if (hasValue(founderData.name)) targetInfo.push(`Person: ${founderData.name}`);
  if (hasValue(founderData.company)) targetInfo.push(`Company: ${founderData.company}`);
  if (hasValue(founderData.company_info)) targetInfo.push(`Company Description: ${founderData.company_info}`);
  if (hasValue(founderData.role)) targetInfo.push(`Role: ${founderData.role}`);
  if (hasValue(founderData.looking_for)) targetInfo.push(`What they are looking for: ${founderData.looking_for}`);
  if (hasValue(founderData.linkedinurl)) targetInfo.push(`LinkedIn URL: ${founderData.linkedinurl}`);
  if (hasValue(founderData.company_url)) targetInfo.push(`Company URL: ${founderData.company_url}`);

  const targetSection = targetInfo.length > 0
    ? `TARGET DETAILS (use what is available, skip what is missing):\n${targetInfo.join('\n')}`
    : 'TARGET DETAILS: Limited information available. Write a general but genuine message.';

  // JSON response format - unified format for frontend compatibility
  const jsonFormat = `{
  message: the complete ready-to-send ${messageType === 'email' ? 'email including Subject line at the top' : 'linkedin message'}
}`;

  let prompt = '';

  if (outreachType === 'job') {
    prompt = `You are an expert at crafting high-converting cold outreach messages. Write a message that cuts through the noise and gets a response.

CRITICAL PRINCIPLES:
- Keep it under 200 words
- Use plain, conversational language - no buzzwords or corporate speak
- Be specific with examples and concrete results from the resume when possible
- Have ONE clear, specific ask
- Show genuine interest based on available information about them
- Sound completely human - use contractions, natural flow, casual but professional tone
- If information about the target is missing, write around it naturally - do not mention that info is missing
${webBrowsingInstructions}
${targetSection}

USER RESUME:
${resumeText}

USER GOALS:
${userGoals || 'Not specified'}

MESSAGE TYPE: ${messageType}

${messageType === 'email' ? `EMAIL REQUIREMENTS:
- Open with who you are in 1 sentence max
- State why you are reaching out to them or their company
- Highlight 1-2 relevant achievements from the resume
- Make one clear ask like a 15-minute call or coffee chat
- Include a compelling subject line of 6-8 words max` : `LINKEDIN MESSAGE REQUIREMENTS:
- Much more casual and direct than email
- Keep under 100 words
- Get straight to the point
- Ask directly about opportunities
- Social media tone like messaging a friend
- No formal greetings or signatures needed`}

RESPONSE FORMAT:
Respond with ONLY a valid JSON object. No explanation, no reasoning, no preamble.
Do NOT describe your thought process or what you are doing.
Do NOT mention accessing websites or tools.
Do NOT say things like here is the plan or I will generate.
Just output the JSON directly.

${jsonFormat}

${messageType === 'email' ? 'For email, the message field should contain: Subject: your subject line here followed by two newlines then the email body.' : ''}`;
  } else if (outreachType === 'collaboration') {
    prompt = `You are crafting a collaboration outreach message between founders and builders. This is about mutual value creation, not job seeking.

COLLABORATION PRINCIPLES:
- Lead with specific value you can provide
- Show you understand their current challenges or projects if that info is available
- Propose concrete ways to work together
- Be peer-to-peer, not supplicant
- Under 200 words, plain language
- One clear next step
- If information about the target is missing, write around it naturally - do not mention that info is missing
${webBrowsingInstructions}
${targetSection}

USER RESUME:
${resumeText}

USER GOALS:
${userGoals || 'Not specified'}

MESSAGE TYPE: ${messageType}

${messageType === 'email' ? `EMAIL REQUIREMENTS:
- Open with a specific observation about their work or company if available
- Introduce yourself with relevant credibility in 1-2 sentences max
- Propose specific value you can provide based on your skills and experience
- Suggest concrete collaboration ideas
- Ask for one specific next step
- Include a subject line that hints at the collaboration opportunity` : `LINKEDIN MESSAGE REQUIREMENTS:
- Casual, founder-to-founder tone
- Talk openly about what you are both working on
- Focus on alignment and mutual benefit
- Keep under 100 words
- Direct and conversational`}

RESPONSE FORMAT:
Respond with ONLY a valid JSON object. No explanation, no reasoning, no preamble.
Do NOT describe your thought process or what you are doing.
Do NOT mention accessing websites or tools.
Do NOT say things like here is the plan or I will generate.
Just output the JSON directly.

${jsonFormat}

${messageType === 'email' ? 'For email, the message field should contain: Subject: your subject line here followed by two newlines then the email body.' : ''}`;
  } else if (outreachType === 'friendship') {
    prompt = `You are crafting a genuine networking message focused on building authentic professional relationships. This is about human connection and mutual learning, not immediate asks.

NETWORKING PRINCIPLES:
- Lead with genuine curiosity about their work
- Find authentic connection points like shared experiences or interests
- Offer value or insights, do not just take
- Be conversational but professional
- No immediate asks for jobs or favors
- Focus on learning and relationship building
- If information about the target is missing, write around it naturally - do not mention that info is missing
${webBrowsingInstructions}
${targetSection}

USER RESUME:
${resumeText}

USER GOALS:
${userGoals || 'Not specified'}

MESSAGE TYPE: ${messageType}

${messageType === 'email' ? `EMAIL REQUIREMENTS:
- Open with specific interest in their work or company, not generic praise
- Share a genuine connection point from your actual background
- Offer something of value based on your real experience
- Express curiosity about their experience or perspective
- Suggest low-pressure connection like coffee chat or informal call
- Sound genuinely interested in them as a person
- Include a warm subject line specific to them` : `LINKEDIN MESSAGE REQUIREMENTS:
- Super casual and friendly
- Like adding a friend on social media
- Focus on staying connected and seeing each others posts
- Keep under 80 words
- Natural, conversational tone
- About mutual following and engagement`}

RESPONSE FORMAT:
Respond with ONLY a valid JSON object. No explanation, no reasoning, no preamble.
Do NOT describe your thought process or what you are doing.
Do NOT mention accessing websites or tools.
Do NOT say things like here is the plan or I will generate.
Just output the JSON directly.

${jsonFormat}

${messageType === 'email' ? 'For email, the message field should contain: Subject: your subject line here followed by two newlines then the email body.' : ''}`;
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
