'use client';

import { useAuth } from '@clerk/nextjs';
import { useState, useRef, useEffect } from 'react';
import Navigation from '../../components/Navigation';
import { clientDb } from '@/lib/firebase/client';
import { collection, query, orderBy, limit, getDocs, Timestamp } from 'firebase/firestore';

// PDF.js will be loaded dynamically on client side only
let pdfjsLib: typeof import('pdfjs-dist') | null = null;

interface TestResult {
  success: boolean;
  status: number;
  statusText: string;
  responseTime: number;
  headers?: Record<string, string>;
  data?: string | Record<string, unknown>;
  error?: string;
  errorType?: string;
}

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

type OutreachType = 'job' | 'collaboration' | 'friendship';
type MessageType = 'email' | 'linkedin';

export default function TunnelTestPage() {
  const { isLoaded, userId } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pdfJsLoaded, setPdfJsLoaded] = useState(false);

  // Load PDF.js dynamically on client side
  useEffect(() => {
    const loadPdfJs = async () => {
      if (typeof window !== 'undefined' && !pdfjsLib) {
        const pdfjs = await import('pdfjs-dist');
        pdfjs.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.min.js';
        pdfjsLib = pdfjs;
        setPdfJsLoaded(true);
      }
    };
    loadPdfJs();
  }, []);

  // Connection test state
  const [webhookUrl, setWebhookUrl] = useState('');
  const [activeTab, setActiveTab] = useState<'connection' | 'outreach'>('connection');

  // Resume state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState('');
  const [extractingPdf, setExtractingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // Founder data state
  const [founderData, setFounderData] = useState<FounderData>({
    name: '',
    company: '',
    role: '',
    looking_for: '',
    company_info: '',
    company_url: '',
    linkedinurl: '',
    email: '',
  });

  // Outreach options
  const [outreachType, setOutreachType] = useState<OutreachType>('job');
  const [messageType, setMessageType] = useState<MessageType>('email');
  const [userGoals, setUserGoals] = useState('');

  // Test state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Sample loading state
  const [loadingSample, setLoadingSample] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);
  const [loadedSampleName, setLoadedSampleName] = useState<string | null>(null);

  // Loading animation state
  const [currentSayingIndex, setCurrentSayingIndex] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const MAX_GENERATION_TIME = 105; // 1 minute 45 seconds

  // Fun loading messages that rotate during generation
  const loadingSayings = [
    "Brewing up something special...",
    "Teaching the AI some manners...",
    "Consulting the oracle...",
    "Channeling creative energy...",
    "Crafting the perfect words...",
    "Reading between the lines...",
    "Searching for that perfect opener...",
    "Making it sound human...",
    "Adding a dash of personality...",
    "Polishing the prose...",
    "Scanning LinkedIn for clues...",
    "Checking the company vibe...",
    "Finding common ground...",
    "Avoiding corporate buzzwords...",
    "Making sure it doesn't sound like AI...",
    "Sprinkling in some authenticity...",
    "Removing the cringe...",
    "Double-checking the tone...",
    "Almost there...",
    "This is taking a bit, but trust the process...",
  ];

  // Rotate loading sayings every 4 seconds during loading
  useEffect(() => {
    if (!loading) {
      setCurrentSayingIndex(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentSayingIndex((prev) => (prev + 1) % loadingSayings.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [loading, loadingSayings.length]);

  // Track elapsed time during loading
  useEffect(() => {
    if (!loading) {
      setElapsedTime(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedTime((prev) => Math.min(prev + 1, MAX_GENERATION_TIME));
    }, 1000);

    return () => clearInterval(interval);
  }, [loading]);

  // Helper function to validate URL
  const isValidUrl = (url: string): boolean => {
    if (!url || typeof url !== 'string') return false;
    const trimmed = url.trim().toLowerCase();
    if (!trimmed || trimmed === 'n/a' || trimmed === 'na' || trimmed === '-') return false;
    try {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      return parsed.protocol === 'http:' || parsed.protocol === 'https:';
    } catch {
      return false;
    }
  };

  // Helper function to validate email
  const isValidEmail = (email: string): boolean => {
    if (!email || typeof email !== 'string') return false;
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || trimmed === 'n/a' || trimmed === 'na' || trimmed === '-') return false;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  };

  // Load a sample founder from database with complete data
  const loadSampleFromDatabase = async () => {
    setLoadingSample(true);
    setSampleError(null);
    setLoadedSampleName(null);

    try {
      // Query recent entries
      const entriesRef = collection(clientDb, 'entry');
      const q = query(
        entriesRef,
        orderBy('published', 'desc'),
        limit(100)  // Get recent entries, filter client-side for completeness
      );

      const querySnapshot = await getDocs(q);
      const entries: any[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        entries.push({ id: doc.id, ...data });
      });

      // Filter for entries with complete data
      const completeEntries = entries.filter((entry) => {
        const hasCompanyUrl = isValidUrl(entry.company_url);
        const hasLinkedIn = isValidUrl(entry.linkedinurl);
        const hasEmail = isValidEmail(entry.email);
        const hasName = entry.name && entry.name.trim() && entry.name.toLowerCase() !== 'n/a';
        const hasCompany = entry.company && entry.company.trim() && entry.company.toLowerCase() !== 'n/a';

        return hasCompanyUrl && hasLinkedIn && hasEmail && hasName && hasCompany;
      });

      if (completeEntries.length === 0) {
        setSampleError('No entries found with complete data (company_url, linkedinurl, and email)');
        return;
      }

      // Pick the first complete entry
      const sample = completeEntries[0];

      // Populate the form
      setFounderData({
        name: sample.name || '',
        company: sample.company || '',
        role: sample.role || '',
        looking_for: sample.looking_for || '',
        company_info: sample.company_info || '',
        company_url: sample.company_url || '',
        linkedinurl: sample.linkedinurl || '',
        email: sample.email || '',
      });

      setLoadedSampleName(`${sample.name} @ ${sample.company}`);

      // Auto-switch to outreach tab if on connection tab
      if (activeTab === 'connection') {
        setActiveTab('outreach');
      }

    } catch (err) {
      console.error('Error loading sample:', err);
      setSampleError(err instanceof Error ? err.message : 'Failed to load sample from database');
    } finally {
      setLoadingSample(false);
    }
  };

  // Extract text from PDF using pdfjs-dist with improved spacing
  const extractTextFromPdf = async (file: File): Promise<string> => {
    if (!pdfjsLib) {
      throw new Error('PDF.js is not loaded yet. Please wait and try again.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = '';

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      // Get items with their positions
      const items = textContent.items.map((item: any) => ({
        str: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height || 12, // default height
      }));

      // Sort by Y (descending - PDF coords start from bottom) then X (ascending)
      items.sort((a: any, b: any) => {
        const yDiff = b.y - a.y;
        if (Math.abs(yDiff) > 3) return yDiff; // Different lines
        return a.x - b.x; // Same line, sort by X
      });

      let lastY: number | null = null;
      let lastX: number | null = null;
      let lastWidth: number = 0;
      let pageText = '';

      for (const item of items) {
        if (!item.str.trim()) continue;

        if (lastY !== null) {
          const yGap = lastY - item.y;
          const xGap = item.x - (lastX! + lastWidth);

          // New line detection - if Y changed significantly
          if (yGap > 8) {
            // Large gap = new paragraph
            pageText += '\n\n';
          } else if (yGap > 3) {
            // Small gap = new line
            pageText += '\n';
          } else if (xGap > 20) {
            // Large horizontal gap on same line = tab/column
            pageText += '  ';
          } else if (xGap > 5) {
            // Normal word spacing
            pageText += ' ';
          }
        }

        pageText += item.str;
        lastY = item.y;
        lastX = item.x;
        lastWidth = item.width || item.str.length * 5;
      }

      fullText += pageText + '\n\n--- Page Break ---\n\n';
    }

    // Clean up and fix common PDF extraction issues
    let cleaned = fullText
      // Remove trailing page break
      .replace(/--- Page Break ---\n\n$/g, '')
      // Max 3 newlines
      .replace(/\n{4,}/g, '\n\n\n')
      // Max 2 spaces
      .replace(/[ ]{3,}/g, '  ')
      // Add space after colon if followed by letter/number (Languages:HTML -> Languages: HTML)
      .replace(/:([A-Za-z0-9])/g, ': $1')
      // Add space before opening paren if preceded by letter (Flow(Full -> Flow (Full)
      .replace(/([A-Za-z])\(([A-Za-z])/g, '$1 ($2')
      // Add space after closing paren if followed by letter (Stack)Next -> Stack) Next
      .replace(/\)([A-Za-z])/g, ') $1')
      // Add space between lowercase and uppercase (camelCase detection: FullStack -> Full Stack)
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      // Add space after comma if followed by letter (React,Next -> React, Next)
      .replace(/,([A-Za-z])/g, ', $1')
      // Fix common concatenations with ampersand (Development&Data -> Development & Data)
      .replace(/([A-Za-z])&([A-Za-z])/g, '$1 & $2')
      // Add space between number and letter if they look like separate items (15TypeScript -> 15, TypeScript)
      .replace(/(\d)([A-Z][a-z])/g, '$1, $2')
      // Fix double spaces that may have been created
      .replace(/  +/g, ' ')
      // Fix space before comma
      .replace(/ ,/g, ',')
      // Fix space before colon
      .replace(/ :/g, ':')
      .trim();

    return cleaned;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setResumeFile(file);
    setPdfError(null);

    if (file.type === 'application/pdf') {
      setExtractingPdf(true);
      try {
        const text = await extractTextFromPdf(file);
        setResumeText(text);
      } catch (err) {
        setPdfError(err instanceof Error ? err.message : 'Failed to extract PDF text');
        setResumeText('');
      } finally {
        setExtractingPdf(false);
      }
    } else if (file.type === 'text/plain') {
      const text = await file.text();
      setResumeText(text);
    } else {
      setPdfError('Please upload a PDF or text file');
    }
  };

  // Simple connection test
  const handleConnectionTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await fetch('/api/admin/tunnel-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          testPayload: { test: true, ping: 'connection-test', timestamp: new Date().toISOString() },
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
      } else {
        setError(data.error || 'Failed to test connection');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  // Full outreach generation test
  const handleOutreachTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setGeneratedMessage(null);
    setError(null);

    if (!resumeText.trim()) {
      setError('Please upload a resume or enter resume text');
      setLoading(false);
      return;
    }

    if (!webhookUrl.trim()) {
      setError('Please enter your N8N webhook URL');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/admin/tunnel-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl,
          mode: 'outreach',
          outreachData: {
            founderData,
            outreachType,
            messageType,
            resumeText,
            userGoals,
          },
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setResult(data);
        // Extract the generated message from the response, handling nested JSON
        const extractMessage = (responseData: any): string | null => {
          if (!responseData) return null;

          let message: any = responseData;

          // If it's an object with a message field, get that
          if (typeof message === 'object' && 'message' in message) {
            message = message.message;
          }

          // If the message is a string that looks like JSON, try to parse it
          if (typeof message === 'string') {
            // Check if it looks like JSON (starts with { or [)
            const trimmed = message.trim();
            if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
              try {
                const parsed = JSON.parse(trimmed);
                // Recursively extract if there's a nested message
                if (typeof parsed === 'object' && 'message' in parsed) {
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
        };

        const extractedMessage = extractMessage(data.data);
        if (extractedMessage) {
          setGeneratedMessage(extractedMessage);
        }
      } else {
        setError(data.error || 'Failed to generate outreach');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error');
    } finally {
      setLoading(false);
    }
  };

  if (!isLoaded) {
    return <div className="p-8">Loading...</div>;
  }

  if (!userId) {
    return (
      <div className="min-h-screen bg-[#0f1015]">
        <Navigation />
        <div className="p-8">
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 text-white">
            <h2 className="font-semibold">Access Denied</h2>
            <p className="text-red-300">Please sign in to access admin features.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1015]">
      <Navigation />

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-[#18192a] border border-purple-500/30 rounded-2xl p-8 max-w-lg w-full mx-4 text-center">
            {/* Animated spinner */}
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-purple-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-4 border-transparent border-t-cyan-400 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
            </div>

            {/* Current saying */}
            <p className="text-lg text-purple-200 font-medium mb-4 min-h-[28px]">
              {loadingSayings[currentSayingIndex]}
            </p>

            {/* Progress bar */}
            <div className="w-full mb-3">
              <div className="h-2 bg-[#0f1015] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 rounded-full transition-all duration-1000 ease-linear"
                  style={{ width: `${(elapsedTime / MAX_GENERATION_TIME) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Time display */}
            <div className="flex justify-between text-xs text-neutral-400">
              <span>{elapsedTime}s elapsed</span>
              <span>~{Math.max(0, MAX_GENERATION_TIME - elapsedTime)}s remaining</span>
            </div>

            <p className="text-sm text-neutral-500 mt-4">
              Generating via N8N...
            </p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-8">
        <div className="bg-[#11121b] rounded-xl border border-white/10 p-6">
          <div className="border-b border-white/10 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-white">N8N Integration Test Lab</h1>
            <p className="text-neutral-400 mt-2">
              Test your N8N webhook connection and outreach generation before deploying to production.
            </p>
          </div>

          {/* Webhook URL - Always visible */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              N8N Webhook URL
            </label>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://your-tunnel-domain.com/webhook/generate-outreach"
              className="w-full px-3 py-2 bg-[#0f1015] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:border-purple-400 focus:outline-none"
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('connection')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'connection'
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#18192a] text-neutral-400 hover:text-white'
              }`}
            >
              Connection Test
            </button>
            <button
              onClick={() => setActiveTab('outreach')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'outreach'
                  ? 'bg-purple-600 text-white'
                  : 'bg-[#18192a] text-neutral-400 hover:text-white'
              }`}
            >
              Outreach Generation Test
            </button>
          </div>

          {/* Connection Test Tab */}
          {activeTab === 'connection' && (
            <form onSubmit={handleConnectionTest} className="space-y-6">
              <button
                type="submit"
                disabled={loading || !webhookUrl}
                className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Test Connection
                  </>
                )}
              </button>
            </form>
          )}

          {/* Outreach Generation Test Tab */}
          {activeTab === 'outreach' && (
            <form onSubmit={handleOutreachTest} className="space-y-6">
              {/* Resume Upload Section */}
              <div className="bg-[#18192a] border border-white/10 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Your Resume</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Upload Resume (PDF or TXT)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.txt"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full px-4 py-3 bg-[#0f1015] border border-dashed border-white/20 rounded-lg text-neutral-400 hover:border-purple-400 hover:text-purple-400 transition-colors"
                    >
                      {extractingPdf ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Extracting text from PDF...
                        </span>
                      ) : resumeFile ? (
                        <span className="text-green-400">{resumeFile.name}</span>
                      ) : (
                        <span>Click to upload resume file</span>
                      )}
                    </button>
                    {pdfError && (
                      <p className="text-red-400 text-sm mt-1">{pdfError}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Resume Text {resumeFile && '(extracted)'}
                    </label>
                    <textarea
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                      placeholder="Paste your resume text here or upload a file above..."
                      className="w-full px-3 py-2 bg-[#0f1015] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:border-purple-400 focus:outline-none font-mono text-sm h-32"
                    />
                    {resumeText && (
                      <p className="text-neutral-400 text-xs mt-1">
                        {resumeText.length} characters
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Your Goals (what you're looking for)
                    </label>
                    <textarea
                      value={userGoals}
                      onChange={(e) => setUserGoals(e.target.value)}
                      placeholder="e.g., Looking for senior frontend roles at early-stage startups working on AI/ML products..."
                      className="w-full px-3 py-2 bg-[#0f1015] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:border-purple-400 focus:outline-none text-sm h-20"
                    />
                  </div>
                </div>
              </div>

              {/* Founder/Target Data Section */}
              <div className="bg-[#18192a] border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Target Person/Company</h3>
                  <button
                    type="button"
                    onClick={loadSampleFromDatabase}
                    disabled={loadingSample}
                    className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 disabled:bg-cyan-800 text-white text-sm font-medium rounded-lg transition-colors flex items-center"
                  >
                    {loadingSample ? (
                      <>
                        <svg className="animate-spin mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Load Sample from Database
                      </>
                    )}
                  </button>
                </div>

                {/* Sample Loaded Success Message */}
                {loadedSampleName && (
                  <div className="mb-4 bg-green-500/20 border border-green-500/30 rounded-lg p-3">
                    <p className="text-green-300 text-sm flex items-center">
                      <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Loaded: {loadedSampleName}
                    </p>
                  </div>
                )}

                {/* Sample Load Error */}
                {sampleError && (
                  <div className="mb-4 bg-red-500/20 border border-red-500/30 rounded-lg p-3">
                    <p className="text-red-300 text-sm">{sampleError}</p>
                  </div>
                )}

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Contact Name
                    </label>
                    <input
                      type="text"
                      value={founderData.name}
                      onChange={(e) => setFounderData({ ...founderData, name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full px-3 py-2 bg-[#0f1015] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Company
                    </label>
                    <input
                      type="text"
                      value={founderData.company}
                      onChange={(e) => setFounderData({ ...founderData, company: e.target.value })}
                      placeholder="Acme Inc"
                      className="w-full px-3 py-2 bg-[#0f1015] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Role
                    </label>
                    <input
                      type="text"
                      value={founderData.role}
                      onChange={(e) => setFounderData({ ...founderData, role: e.target.value })}
                      placeholder="Founder & CEO"
                      className="w-full px-3 py-2 bg-[#0f1015] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={founderData.email}
                      onChange={(e) => setFounderData({ ...founderData, email: e.target.value })}
                      placeholder="john@acme.com"
                      className="w-full px-3 py-2 bg-[#0f1015] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Company URL
                    </label>
                    <input
                      type="url"
                      value={founderData.company_url}
                      onChange={(e) => setFounderData({ ...founderData, company_url: e.target.value })}
                      placeholder="https://acme.com"
                      className="w-full px-3 py-2 bg-[#0f1015] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      LinkedIn URL
                    </label>
                    <input
                      type="url"
                      value={founderData.linkedinurl}
                      onChange={(e) => setFounderData({ ...founderData, linkedinurl: e.target.value })}
                      placeholder="https://linkedin.com/in/johndoe"
                      className="w-full px-3 py-2 bg-[#0f1015] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      What they're looking for
                    </label>
                    <input
                      type="text"
                      value={founderData.looking_for}
                      onChange={(e) => setFounderData({ ...founderData, looking_for: e.target.value })}
                      placeholder="Senior Frontend Engineer, React, TypeScript"
                      className="w-full px-3 py-2 bg-[#0f1015] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:border-purple-400 focus:outline-none"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Company Description
                    </label>
                    <textarea
                      value={founderData.company_info}
                      onChange={(e) => setFounderData({ ...founderData, company_info: e.target.value })}
                      placeholder="Brief description of what the company does..."
                      className="w-full px-3 py-2 bg-[#0f1015] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:border-purple-400 focus:outline-none h-20"
                    />
                  </div>
                </div>
              </div>

              {/* Outreach Options */}
              <div className="bg-[#18192a] border border-white/10 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-white mb-4">Outreach Options</h3>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Outreach Type
                    </label>
                    <select
                      value={outreachType}
                      onChange={(e) => setOutreachType(e.target.value as OutreachType)}
                      className="w-full px-3 py-2 bg-[#0f1015] border border-white/10 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                    >
                      <option value="job">Job Opportunity</option>
                      <option value="collaboration">Collaboration</option>
                      <option value="friendship">Networking/Friendship</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Message Type
                    </label>
                    <select
                      value={messageType}
                      onChange={(e) => setMessageType(e.target.value as MessageType)}
                      className="w-full px-3 py-2 bg-[#0f1015] border border-white/10 rounded-lg text-white focus:border-purple-400 focus:outline-none"
                    >
                      <option value="email">Email</option>
                      <option value="linkedin">LinkedIn Message</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <button
                type="submit"
                disabled={loading || !webhookUrl || !resumeText.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating via N8N...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Generate Outreach Message
                  </>
                )}
              </button>
            </form>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-6 bg-red-500/20 border border-red-500/30 rounded-lg p-4">
              <h3 className="text-red-200 font-semibold flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Error
              </h3>
              <p className="text-red-300 mt-1">{error}</p>
            </div>
          )}

          {/* Generated Message Display */}
          {generatedMessage && (
            <div className="mt-6 bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-green-200 font-semibold flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Generated Message
                </h3>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(generatedMessage);
                  }}
                  className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                >
                  Copy
                </button>
              </div>
              <div className="bg-[#0f1015] rounded-lg p-4">
                <pre className="text-neutral-200 text-sm whitespace-pre-wrap font-sans">
                  {generatedMessage}
                </pre>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className="mt-6 space-y-4">
              {/* Status Banner */}
              <div className={`rounded-lg p-4 ${
                result.success
                  ? 'bg-green-500/20 border border-green-500/30'
                  : 'bg-yellow-500/20 border border-yellow-500/30'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {result.success ? (
                      <svg className="w-6 h-6 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-yellow-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    )}
                    <div>
                      <h3 className={`font-semibold ${result.success ? 'text-green-200' : 'text-yellow-200'}`}>
                        {result.success ? 'Request Successful!' : 'Request Completed (with error response)'}
                      </h3>
                      <p className={`text-sm ${result.success ? 'text-green-300' : 'text-yellow-300'}`}>
                        Status: {result.status} {result.statusText}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${result.success ? 'text-green-200' : 'text-yellow-200'}`}>
                      {result.responseTime}ms
                    </div>
                    <div className={`text-xs ${result.success ? 'text-green-400' : 'text-yellow-400'}`}>
                      Response Time
                    </div>
                  </div>
                </div>
              </div>

              {/* Connection Error Details */}
              {result.error && (
                <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4">
                  <h4 className="text-red-200 font-semibold mb-2">Connection Error</h4>
                  <p className="text-red-300 text-sm font-mono">{result.error}</p>
                  {result.errorType && (
                    <p className="text-red-400 text-xs mt-1">Error Type: {result.errorType}</p>
                  )}
                </div>
              )}

              {/* Raw Response Data (collapsed by default if we have a generated message) */}
              {result.data !== undefined && (
                <details className="bg-[#18192a] border border-white/10 rounded-lg" open={!generatedMessage}>
                  <summary className="p-4 text-neutral-200 font-semibold cursor-pointer hover:bg-white/5">
                    Raw Response Data
                  </summary>
                  <div className="px-4 pb-4">
                    <pre className="text-neutral-300 text-sm font-mono overflow-x-auto whitespace-pre-wrap bg-[#0f1015] rounded-lg p-3">
                      {typeof result.data === 'string'
                        ? result.data
                        : JSON.stringify(result.data, null, 2)
                      }
                    </pre>
                  </div>
                </details>
              )}
            </div>
          )}

          {/* Info Section */}
          <div className="mt-8 bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
            <h3 className="font-semibold text-blue-200 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              How This Works
            </h3>
            <div className="text-blue-300 text-sm mt-2 space-y-1">
              <p>1. Your resume is converted to text (PDF extraction happens in the browser)</p>
              <p>2. The prompt is built using the same logic as the main app</p>
              <p>3. Everything is sent to your N8N webhook (prompt + context)</p>
              <p>4. N8N runs Gemini CLI and returns the generated message</p>
              <p>5. Once working, we'll retrofit this into the main generate-outreach API</p>
            </div>
          </div>

          {/* Expected N8N Response Format */}
          <div className="mt-4 bg-[#18192a] border border-white/10 rounded-lg p-4">
            <h3 className="font-semibold text-neutral-200 mb-2">Expected N8N Response Format</h3>
            <pre className="text-neutral-400 text-sm font-mono bg-[#0f1015] rounded-lg p-3">
{`{
  "message": "Generated outreach message here..."
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
