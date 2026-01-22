import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/firebase/server';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';

interface FounderData {
  name?: string;
  company?: string;
  role?: string;
  looking_for?: string;
  company_info?: string;
  company_url?: string;
  linkedinurl?: string;
  email?: string;
  companyInfo?: string;
  linkedinInfo?: string;
}

interface OutreachData {
  founderData: FounderData;
  outreachType: 'job' | 'collaboration' | 'friendship';
  messageType: 'email' | 'linkedin';
  resumeText: string;
  userGoals: string;
  enrichedCompanyInfo?: string;
  enrichedLinkedinInfo?: string;
}

// Helper to check if a value is meaningful (not empty/n/a)
function hasValue(val: string | undefined | null): boolean {
  if (!val) return false;
  const trimmed = val.trim().toLowerCase();
  return trimmed !== '' && trimmed !== 'n/a' && trimmed !== 'na' && trimmed !== 'not specified' && trimmed !== 'not provided';
}

// Enrich person data with Jina.ai web scraping
async function enrichPersonData(jobData: FounderData): Promise<FounderData> {
  console.log('Starting data enrichment...');
  const enrichedData = { ...jobData };

  try {
    // If they have a company URL, scrape it directly
    if (jobData.company_url && hasValue(jobData.company_url)) {
      console.log('Scraping company website:', jobData.company_url);
      try {
        const response = await fetch(`https://r.jina.ai/${jobData.company_url}`, {
          headers: {
            'Accept': 'text/plain'
          }
        });
        if (response.ok) {
          const companyContent = await response.text();
          enrichedData.companyInfo = companyContent.substring(0, 2000); // Limit to 2000 chars
          console.log('Company info scraped, length:', companyContent.length);
        }
      } catch (error) {
        console.log('Company scraping failed:', error);
      }
    }

    // If they have LinkedIn, do a Google search to get cached info
    if (jobData.linkedinurl && hasValue(jobData.linkedinurl)) {
      console.log('Searching Google for LinkedIn profile:', jobData.linkedinurl);
      try {
        const searchQuery = encodeURIComponent(`site:linkedin.com/in ${jobData.name || ''} ${jobData.company || ''}`);
        const googleSearchUrl = `https://r.jina.ai/www.google.com/search?q=${searchQuery}`;

        const response = await fetch(googleSearchUrl, {
          headers: {
            'Accept': 'text/plain'
          }
        });
        if (response.ok) {
          const searchResults = await response.text();
          enrichedData.linkedinInfo = searchResults.substring(0, 1500); // Limit to 1500 chars
          console.log('LinkedIn search info scraped, length:', searchResults.length);
        }
      } catch (error) {
        console.log('LinkedIn search failed:', error);
      }
    }

  } catch (error) {
    console.error('Data enrichment failed:', error);
  }

  console.log('Data enrichment completed');
  return enrichedData;
}

// Build the outreach prompt for N8N
function buildOutreachPrompt(data: OutreachData): string {
  const { founderData, outreachType, messageType, resumeText, userGoals, enrichedCompanyInfo, enrichedLinkedinInfo } = data;

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

  // Build enriched context section from Jina.ai scraping
  let enrichedContextSection = '';
  if (enrichedCompanyInfo || enrichedLinkedinInfo) {
    enrichedContextSection = '\nENRICHED CONTEXT (from web scraping - use this for personalization):\n';
    if (enrichedCompanyInfo) {
      enrichedContextSection += `\nCOMPANY WEBSITE CONTENT:\n${enrichedCompanyInfo}\n`;
    }
    if (enrichedLinkedinInfo) {
      enrichedContextSection += `\nLINKEDIN PROFILE CONTEXT:\n${enrichedLinkedinInfo}\n`;
    }
  }

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
- Use the enriched context from web scraping to make the message highly specific and personalized

${targetSection}
${enrichedContextSection}
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
- Use the enriched context from web scraping to make the message highly specific and personalized

${targetSection}
${enrichedContextSection}
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
- Use the enriched context from web scraping to make the message highly specific and personalized

${targetSection}
${enrichedContextSection}
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

// Extract message from nested JSON response
function extractMessage(responseData: unknown): string | null {
  if (!responseData) return null;

  let message: unknown = responseData;

  // If it's an object with a message field, get that
  if (typeof message === 'object' && message !== null && 'message' in message) {
    message = (message as { message: unknown }).message;
  }

  // If the message is a string that looks like JSON, try to parse it
  if (typeof message === 'string') {
    // Check if it looks like JSON (starts with { or [)
    const trimmed = message.trim();
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        // Recursively extract if there's a nested message
        if (typeof parsed === 'object' && parsed !== null && 'message' in parsed) {
          return extractMessage(parsed);
        }
        return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
      } catch {
        // Not valid JSON, return as-is
        return message;
      }
    }
    return message;
  }

  return typeof message === 'string' ? message : null;
}

export async function POST(request: NextRequest) {
  console.log('Generate outreach API called');

  try {
    const { jobData, outreachType, messageType, contactId, saveToDatabase = true } = await request.json();
    console.log('Request data processed');

    // Enrich the person's data with web scraping (Jina.ai)
    const enrichedJobData = await enrichPersonData(jobData);

    // Get user from Clerk auth
    console.log('Getting user from Clerk auth...');
    const { userId } = await auth();
    console.log('User ID from auth:', userId ? 'Found' : 'Not found');

    if (!userId) {
      console.log('ERROR: No user ID found - returning 401');
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }

    // Get user profile from Firebase
    console.log('Fetching user profile from Firebase...');
    const userDocRef = doc(db, 'user_profiles', userId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      console.log('User document does not exist');
      return NextResponse.json(
        { error: 'User profile not found. Please set up your profile first.' },
        { status: 404 }
      );
    }

    const userProfile = userDoc.data();
    console.log('User profile found');
    const userGoals = userProfile?.goals || '';

    // Check for N8N webhook URL
    if (!process.env.N8N_WEBHOOK_URL) {
      console.log('N8N webhook URL not found in environment');
      return NextResponse.json(
        { error: 'N8N webhook URL not configured. Please set N8N_WEBHOOK_URL in environment variables.' },
        { status: 500 }
      );
    }

    console.log('N8N webhook URL found');

    // Determine if we have PDF or text resume
    const hasPdfResume = userProfile?.resumePdfBase64;
    const hasTextResume = userProfile?.resumeText;

    console.log('Resume check:', {
      hasPdfResume: !!hasPdfResume,
      hasTextResume: !!hasTextResume,
      pdfLength: hasPdfResume ? userProfile.resumePdfBase64.length : 0,
      textLength: hasTextResume ? userProfile.resumeText.length : 0
    });

    if (!hasPdfResume && !hasTextResume) {
      return NextResponse.json(
        { error: 'No resume found. Please upload a PDF or add resume text in your profile.' },
        { status: 400 }
      );
    }

    // For N8N, we need to send the resume as text
    // If only PDF exists, we'll need text extraction done client-side
    const resumeText = hasTextResume ? userProfile.resumeText :
      'Resume uploaded as PDF. Please extract text from the PDF in your profile settings for better results.';

    // Build the prompt for N8N
    const prompt = buildOutreachPrompt({
      founderData: enrichedJobData,
      outreachType,
      messageType,
      resumeText,
      userGoals,
      enrichedCompanyInfo: enrichedJobData.companyInfo,
      enrichedLinkedinInfo: enrichedJobData.linkedinInfo,
    });

    console.log('Making N8N webhook call...');

    try {
      const response = await fetch(process.env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        console.error('N8N webhook error:', response.status, response.statusText);
        throw new Error(`N8N webhook returned ${response.status}: ${response.statusText}`);
      }

      const responseTime = Date.now();
      console.log('N8N webhook response received');

      // Parse response
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

      console.log('Response data type:', typeof responseData);

      // Extract the message from potentially nested JSON
      const extractedMessage = extractMessage(responseData);

      if (!extractedMessage) {
        console.error('Failed to extract message from response:', responseData);
        throw new Error('Failed to extract message from N8N response');
      }

      console.log('Message extracted successfully, length:', extractedMessage.length);

      // Save the outreach record to database only if requested
      if (saveToDatabase) {
        try {
          const outreachRecord = {
            ownerUserId: userId,
            contactId: contactId || null,
            founderName: enrichedJobData.name || '',
            company: enrichedJobData.company || '',
            linkedinUrl: enrichedJobData.linkedinurl || '',
            email: enrichedJobData.email || '',
            messageType,
            outreachType,
            generatedMessage: extractedMessage,
            stage: messageType === 'email' ? 'sent' : 'sent', // Default first stage for both types
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            last_interaction_date: serverTimestamp(),
          };

          const outreachRecordsRef = collection(db, 'outreach_records');
          const docRef = await addDoc(outreachRecordsRef, outreachRecord);
          console.log('Outreach record saved with ID:', docRef.id);

          return NextResponse.json({
            message: extractedMessage,
            outreachRecordId: docRef.id
          });
        } catch (saveError) {
          console.error('Failed to save outreach record:', saveError);
          // Still return the message even if saving fails
          return NextResponse.json({
            message: extractedMessage,
            warning: 'Message generated but not saved to history'
          });
        }
      } else {
        // Just return the message without saving
        return NextResponse.json({
          message: extractedMessage
        });
      }
    } catch (n8nError) {
      console.error('N8N webhook error details:', n8nError);
      console.error('Error message:', n8nError instanceof Error ? n8nError.message : 'Unknown error');
      throw n8nError;
    }
  } catch (error) {
    console.error('Error generating outreach:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      {
        error: 'Failed to generate outreach message',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
