'use client';

import { useState, useEffect, useMemo, useCallback, type CSSProperties } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SignInButton, useUser } from '@clerk/nextjs';
import Navigation from './components/Navigation';
import FounderDetailModal from './components/FounderDetailModal';
import { clientDb } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy, limit, where, getCountFromServer } from 'firebase/firestore';
import { BackgroundRippleEffect } from '@/components/ui/background-ripple-effect';
import Benefits from './components/landing/Benefits';
import FAQ from './components/landing/FAQ';

interface Founder {
  id: string;
  name: string;
  role: string;
  company_info: string;
  company: string;
  published: string;
  linkedinurl: string;
  email: string;
  company_url: string;
  apply_url?: string;
  url?: string;
  looking_for?: string;
}

export default function Home() {
  const { isSignedIn } = useUser();
  const [demoItems, setDemoItems] = useState<any[]>([]);
  const [latestFounders, setLatestFounders] = useState<Founder[]>([]);
  const [isLoadingFounders, setIsLoadingFounders] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [currentDemoTab, setCurrentDemoTab] = useState('email');
  const [selectedFounder, setSelectedFounder] = useState<Founder | null>(null);
  const [showFounderModal, setShowFounderModal] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [carouselFounders, setCarouselFounders] = useState<any[]>([]);
  const [isLoadingCarousel, setIsLoadingCarousel] = useState(true);
  const [totalFounderCount, setTotalFounderCount] = useState<number>(0);
  const [showBackground, setShowBackground] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);

  // Fun loading messages - pick one randomly
  const loadingMessages = useMemo(() => [
    { main: "Finding the coolest founders...", sub: "✨ hang tight, magic incoming" },
    { main: "Summoning startup superstars...", sub: "🚀 they're worth the wait" },
    { main: "Brewing founder connections...", sub: "☕ fresh batch coming up" },
    { main: "Hunting hidden gem builders...", sub: "💎 the good stuff takes a sec" },
    { main: "Assembling the builder squad...", sub: "🎯 almost ready to roll" },
    { main: "Loading awesome people...", sub: "⚡ preparing something special" },
  ], []);

  const [loadingMessage] = useState(() =>
    loadingMessages[Math.floor(Math.random() * loadingMessages.length)]
  );

  // Helper functions from opportunities page
  const getDomainFromUrl = (input?: string): string | null => {
    if (!input) return null;
    let str = input.trim();
    if (str.toLowerCase().startsWith('mailto:')) {
      const email = str.slice(7);
      const parts = email.split('@');
      return parts[1] ? parts[1].toLowerCase() : null;
    }
    if (str.includes('@') && !/^https?:\/\//i.test(str)) {
      const parts = str.split('@');
      return parts[1] ? parts[1].toLowerCase() : null;
    }
    try {
      if (!/^https?:\/\//i.test(str)) {
        str = `https://${str}`;
      }
      const u = new URL(str);
      return u.hostname.replace(/^www\./i, '').toLowerCase();
    } catch {
      const host = str.replace(/^https?:\/\/(www\.)?/i, '').split('/')[0];
      return host ? host.toLowerCase() : null;
    }
  };

  const getAvatarInfo = useCallback((name?: string, company?: string, companyUrl?: string, url?: string) => {
    const websiteUrl = companyUrl || url;
    let faviconUrl = null;

    if (websiteUrl) {
      const domain = getDomainFromUrl(websiteUrl);
      if (domain) {
        faviconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
      }
    }

    let initials = 'UN';
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else {
        initials = parts[0].slice(0, 2).toUpperCase();
      }
    } else if (company) {
      const parts = company.split(' ');
      if (parts.length >= 2) {
        initials = (parts[0][0] + parts[1][0]).toUpperCase();
      } else {
        initials = parts[0].slice(0, 2).toUpperCase();
      }
    }

    return { faviconUrl, initials, displayName: name || company || 'Unknown' };
  }, []);

  // Helper function to detect NA values in any form
  const isNAValue = (value: string | undefined | null): boolean => {
    if (!value || typeof value !== 'string') return true;
    const normalized = value.trim().toLowerCase();
    return normalized === '' ||
           normalized === 'na' ||
           normalized === 'n/a' ||
           normalized === 'unknown' ||
           normalized === 'unknown company';
  };

  // Helper function to get company display name, replacing NA values with "Stealth Company"
  const getCompanyDisplayName = (company: string | undefined | null): string => {
    return isNAValue(company) ? 'Stealth Company' : company!;
  };

  const formatPublishedDate = (publishedStr: string) => {
    if (!publishedStr || publishedStr === 'N/A' || publishedStr === 'Unknown') return 'Recently';

    try {
      const publishedDate = new Date(publishedStr);

      // Check if the date is valid
      if (isNaN(publishedDate.getTime())) {
        return 'Recently';
      }

      const now = new Date();
      const diffTime = Math.abs(now.getTime() - publishedDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const dateStr = publishedDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });

      const timeAgo = diffDays === 1 ? '1 day ago' :
        diffDays < 7 ? `${diffDays} days ago` :
          diffDays < 30 ? `${Math.ceil(diffDays / 7)} weeks ago` :
            diffDays < 365 ? `${Math.ceil(diffDays / 30)} months ago` :
              `${Math.ceil(diffDays / 365)} years ago`;

      return `${dateStr} • ${timeAgo}`;
    } catch {
      return 'Recently';
    }
  };

  // Defer background rendering for better initial load
  useEffect(() => {
    const timeoutId = setTimeout(() => setShowBackground(true), 1000);
    return () => clearTimeout(timeoutId);
  }, []);

  // Mark page as ready once critical content is loaded
  useEffect(() => {
    if (!isLoadingFounders && demoItems.length > 0) {
      // Small delay for smoother reveal
      const timeoutId = setTimeout(() => setIsPageReady(true), 200);
      return () => clearTimeout(timeoutId);
    }
  }, [isLoadingFounders, demoItems.length]);

  useEffect(() => {
    const DEMO_KEY = 'home-kanban-demo-v2';

    // Defer non-critical demo data processing to improve initial render performance
    const processDemoData = () => {
      // Mock outreach data with realistic examples
      const demoSeed = [
        {
          id: 'h1',
          name: 'Alex Rivera',
          role: 'Founder',
          company: 'DataFlow AI',
          initials: 'AR',
          stage: 'sent',
          channel: 'email',
          type: 'Job Opportunity',
          subject: 'Senior Frontend Engineer Position - DataFlow AI',
          message: `Hi Alex,

I hope this message finds you well. I came across DataFlow AI and was really impressed by your approach to democratizing data analytics through AI.

I'm a senior frontend engineer with 5+ years of experience in React, TypeScript, and modern web technologies. I've built scalable user interfaces for fintech and AI companies, and I'm particularly excited about the intersection of AI and user experience.

Your recent Series A funding and the team's background in ML engineering caught my attention. I'd love to learn more about your frontend engineering needs and discuss how I could contribute to DataFlow AI's mission.

Would you be open to a brief conversation this week?

Best regards,
Jordan`,
          email: 'alex@dataflow-ai.com',
          linkedin: 'https://linkedin.com/in/alexrivera'
        },
        {
          id: 'h2',
          name: 'Priya Shah',
          role: 'CTO',
          company: 'HealthTech Labs',
          initials: 'PS',
          stage: 'sent',
          channel: 'email',
          type: 'Collaboration',
          subject: 'Potential Partnership Opportunity',
          message: `Hi Priya,

I've been following HealthTech Labs' work in digital health solutions and was impressed by your recent FDA approval for the remote monitoring platform.

I'm working on an open-source project for healthcare data visualization that could complement your platform. I believe there might be synergies between our approaches to patient data presentation.

Would you be interested in a quick call to explore potential collaboration opportunities?

Looking forward to hearing from you,
Sam`,
          email: 'priya@healthtech-labs.com',
          linkedin: 'https://linkedin.com/in/priyashah'
        },
        {
          id: 'h3',
          name: 'Ben Lee',
          role: 'Founder',
          company: 'GreenTech Solutions',
          initials: 'BL',
          stage: 'responded',
          channel: 'email',
          type: 'Job Opportunity',
          subject: 'Re: Backend Developer Position',
          message: `Hi Ben,

Thanks for reaching out about the backend developer position at GreenTech Solutions. Your sustainability-focused mission really resonates with me.

I have 4 years of experience building scalable APIs with Node.js, Python, and cloud platforms. I'm particularly interested in how technology can address climate challenges.

Could we schedule a call next week to discuss the role further?

Best,
Casey`,
          email: 'ben@greentech-solutions.com',
          linkedin: 'https://linkedin.com/in/benlee'
        },
        {
          id: 'h4',
          name: 'Mina Okafor',
          role: 'Head of Eng',
          company: 'CloudSecure',
          initials: 'MO',
          stage: 'connected',
          channel: 'linkedin',
          type: 'Networking',
          subject: 'Thanks for connecting!',
          message: `Hey Mina! 🔐

Thanks for accepting my connection request! Just read your post about CloudSecure's zero-trust architecture migration - brilliant insights on the implementation challenges.

I'm also in the security space and would love to chat about modern security practices sometime. Always valuable to connect with fellow security engineers who really get it.

Drop me a line if you're ever up for grabbing coffee or jumping on a quick call!`,
          email: 'mina@cloudsecure.io',
          linkedin: 'https://linkedin.com/in/minaokafor'
        },
        // LinkedIn examples
        {
          id: 'h5',
          name: 'David Chen',
          role: 'Founder',
          company: 'MobileTech Inc',
          initials: 'DC',
          stage: 'sent',
          channel: 'linkedin',
          type: 'Job Opportunity',
          subject: 'Mobile Engineer Opportunity',
          message: `Hi David! 👋

Saw your post about MobileTech Inc's recent app launch hitting 100K+ downloads - that's incredible growth! 🚀

I'm a mobile engineer specializing in React Native and Flutter. Your cross-platform approach really caught my attention, especially how you've scaled user engagement.

Would love to connect and learn more about your engineering team's roadmap. Any openings for senior mobile talent?

Cheers!`,
          email: 'david@mobiletech.com',
          linkedin: 'https://linkedin.com/in/davidchen'
        },
        {
          id: 'h6',
          name: 'Sarah Johnson',
          role: 'CTO',
          company: 'EdTech Pro',
          initials: 'SJ',
          stage: 'responded',
          channel: 'linkedin',
          type: 'Collaboration',
          subject: 'Following up on EdTech chat',
          message: `Hey! Thanks for connecting 😊

Really enjoyed our brief exchange about personalized learning algorithms. Your insights on adaptive AI in education were spot-on.

I've been working on some similar research that might complement what EdTech Pro is building. Would you be up for a quick coffee chat or video call?

Always great to meet fellow EdTech innovators!`,
          email: 'sarah@edtech-pro.com',
          linkedin: 'https://linkedin.com/in/sarahjohnson'
        }
      ];

      // Clear old demo data and use fresh seed data
      localStorage.removeItem('home-kanban-demo-v1');

      try {
        const raw = JSON.parse(localStorage.getItem(DEMO_KEY) || '[]');
        const items = Array.isArray(raw) && raw.length && raw[0].channel ? raw : [...demoSeed];
        // Demo items loaded successfully
        setDemoItems(items);
      } catch {
        // Using demo seed data
        setDemoItems([...demoSeed]);
      }
    };

    // Fetch latest founders directly from Firestore (same as opportunities page)
    const fetchLatestFounders = async () => {
      try {
        // Fetching latest founders (reduced for performance)
        const q = query(
          collection(clientDb, "entry"),
          orderBy("published", "desc"),
          limit(3)
        );
        const snap = await getDocs(q);
        // Found documents in entry collection

        // Process raw entries
        if (snap.docs.length > 0) {
          // Sample raw entries processed
        }

        if (snap.docs.length === 0) {
          // No documents found in entry collection - database might be empty
          // Try to fetch just one document to test connection
          const testQuery = query(collection(clientDb, "entry"));
          const testSnap = await getDocs(testQuery);
          // Test query completed
        }

        // Get all entries, filter out N/A values, take best 3
        const allFounders = snap.docs.map((d) => {
          const data = d.data();

          // Handle Firebase Timestamp objects properly
          let publishedStr = '';
          if (data.published) {
            if (data.published.toDate && typeof data.published.toDate === 'function') {
              // It's a Firebase Timestamp
              try {
                publishedStr = data.published.toDate().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                });
              } catch (e) {
                console.warn('Failed to convert Timestamp to date:', e);
                publishedStr = 'Unknown';
              }
            } else if (typeof data.published === 'string') {
              // It's already a string
              publishedStr = data.published;
            } else {
              // Try to convert to string
              publishedStr = String(data.published);
            }
          } else {
            publishedStr = 'Unknown';
          }

          return {
            id: d.id,
            name: data.name || '',
            role: data.role || '',
            company_info: data.company_info || '',
            company: data.company || '',
            published: publishedStr,
            linkedinurl: data.linkedinurl || '',
            email: data.email || '',
            company_url: data.company_url || '',
            apply_url: data.apply_url || '',
            url: data.url || '',
            looking_for: data.looking_for || ''
          };
        });

        // Filter and rank entries - much more relaxed criteria
        // Starting with all founders

        const founders = allFounders
          .filter((founder) => {
            // Only filter out completely empty entries - be very permissive
            // Type guard: ensure company and name are strings
            const hasCompany = typeof founder.company === 'string' && founder.company.trim() !== '';
            const hasName = typeof founder.name === 'string' && founder.name.trim() !== '';

            const isValid = hasName && hasCompany;

            // Log why entries are being filtered out
            if (!isValid) {
              // Filtering out entry due to validation
            }

            return isValid;
          })
          .sort((a, b) => {
            // First sort by recency (published date)
            let aPublished = new Date(0);
            let bPublished = new Date(0);

            if (a.published && a.published !== 'Unknown') {
              const aDate = new Date(a.published);
              if (!isNaN(aDate.getTime())) {
                aPublished = aDate;
              }
            }

            if (b.published && b.published !== 'Unknown') {
              const bDate = new Date(b.published);
              if (!isNaN(bDate.getTime())) {
                bPublished = bDate;
              }
            }

            if (aPublished.getTime() !== bPublished.getTime()) {
              return bPublished.getTime() - aPublished.getTime(); // Most recent first
            }

            // Then prioritize entries with more contact info as a tiebreaker
            const aScore = (a.linkedinurl && a.linkedinurl !== 'N/A' ? 1 : 0) +
              (a.email && a.email !== 'N/A' ? 1 : 0) +
              (a.company_url && a.company_url !== 'N/A' ? 1 : 0);
            const bScore = (b.linkedinurl && b.linkedinurl !== 'N/A' ? 1 : 0) +
              (b.email && b.email !== 'N/A' ? 1 : 0) +
              (b.company_url && b.company_url !== 'N/A' ? 1 : 0);
            return bScore - aScore;
          })
          .slice(0, 3);

        // After filtering: founders processed
        // Final founders to display processed

        setLatestFounders(founders);
      } catch (error) {
        console.error('❌ Failed to fetch latest founders:', error);
      } finally {
        setIsLoadingFounders(false);
      }
    };

    // Fetch latest founders immediately (critical for page content)
    fetchLatestFounders();

    // Defer demo data processing to allow faster initial render
    if (typeof window !== 'undefined') {
      setTimeout(processDemoData, 100);
    }
  }, []);

  // Fetch total founder count for metrics - OPTIMIZED with count aggregation
  useEffect(() => {
    const fetchTotalCount = async () => {
      try {
        // Use Firestore count aggregation instead of fetching all docs
        const entriesRef = collection(clientDb, 'entry');
        const snapshot = await getCountFromServer(entriesRef);
        setTotalFounderCount(snapshot.data().count);
      } catch (error) {
        console.error('Failed to fetch total founder count:', error);
        setTotalFounderCount(500); // Fallback to approximate number
      }
    };
    // Defer this non-critical query to avoid blocking initial render
    const timeoutId = setTimeout(fetchTotalCount, 500);
    return () => clearTimeout(timeoutId);
  }, []);

  // Fetch and validate founders for carousel - OPTIMIZED
  useEffect(() => {
    const fetchCarouselFounders = async () => {
      setIsLoadingCarousel(true);
      try {
        const entriesRef = collection(clientDb, 'entry');
        // Reduced from 50 to 30 for better performance
        const q = query(entriesRef, orderBy('published', 'desc'), limit(30));
        const querySnapshot = await getDocs(q);

        const founders = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Founder[];

        // Validate founders - reduced max iterations
        const validatedFounders = [];

        for (let i = 0; i < Math.min(founders.length, 30); i++) {
          const founder = founders[i];

          // Filter out N/A entries and ensure we have good data
          const hasValidCompany = !isNAValue(founder.company);

          const hasValidName = typeof founder.name === 'string' &&
            founder.name !== 'N/A' &&
            founder.name !== 'NA' &&
            founder.name.trim().length > 0;

          // Check for bio content
          const hasBio = founder.company_info &&
            founder.company_info.length > 30 &&
            founder.company_info !== 'N/A' &&
            founder.company_info !== 'NA';

          // Only process if we have valid company and bio
          if (!hasValidCompany || !hasBio) continue;

          // Check for website and generate icon URL
          const website = founder.company_url || founder.url;
          let iconUrl = null;
          let domain = null;

          if (website && website !== 'N/A' && website !== 'NA' && website !== 'n/a') {
            domain = getDomainFromUrl(website);
            if (domain && domain.length > 3) { // Basic domain validation
              iconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
            }
          }

          // Include if we have a valid domain
          if (iconUrl && domain) {
            validatedFounders.push({
              id: founder.id,
              name: hasValidName ? founder.name : 'Unknown Founder',
              role: founder.role && founder.role !== 'N/A' ? founder.role : 'Founder',
              company: founder.company,
              company_info: founder.company_info,
              iconUrl,
              website,
              domain,
              hasValidIcon: true
            });

            // Stop at 25 validated founders for optimal performance
            if (validatedFounders.length >= 25) break;
          }
        }

        setCarouselFounders(validatedFounders);
      } catch (error) {
        console.error('Failed to fetch carousel founders:', error);
      } finally {
        setIsLoadingCarousel(false);
      }
    };

    // Defer carousel loading to prioritize critical content
    const timeoutId = setTimeout(fetchCarouselFounders, 300);
    return () => clearTimeout(timeoutId);
  }, []);


  const saveDemoItems = (items: any[]) => {
    try {
      localStorage.setItem('home-kanban-demo-v2', JSON.stringify(items));
      setDemoItems(items);
    } catch { }
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('text/plain', itemId);
    e.dataTransfer.effectAllowed = 'move';
    (e.target as HTMLElement).classList.add('dragging');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove('dragging');
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.add('drop-target');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).classList.remove('drop-target');
  };

  const handleDrop = (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('drop-target');

    const itemId = e.dataTransfer.getData('text/plain');
    // Moving item to new stage

    const updatedItems = demoItems.map(item =>
      item.id === itemId ? { ...item, stage: newStage } : item
    );

    // Items updated
    saveDemoItems(updatedItems);
  };

  // Demo board configuration
  const EMAIL_STAGES = ['sent', 'responded', 'in_talks', 'interviewing'];
  const LINKEDIN_STAGES = ['sent', 'responded', 'connected', 'ghosted'];

  const STAGE_DISPLAY_NAMES: Record<string, string> = {
    sent: "Sent",
    responded: "Responded",
    in_talks: "In Talks",
    interviewing: "Interviewing",
    connected: "Connected",
    ghosted: "Ghosted"
  };

  const generateInitials = useCallback((name: string): string => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }, []);

  // Memoize filtered demo items for better performance
  const filteredDemoItems = useMemo(() => {
    return demoItems.filter(item => item.stage && item.channel === currentDemoTab);
  }, [demoItems, currentDemoTab]);

  const handleCardClick = (item: any) => {
    setSelectedMessage(item);
    setShowModal(true);
  };

  const handleGetStartedMouseEnter = () => {
    setIsButtonHovered(true);
  };

  const handleGetStartedMouseLeave = () => {
    setIsButtonHovered(false);
  };

  const renderDemoCard = (item: any) => (
    <article
      key={item.id}
      className="kanban-card rounded-xl text-sm select-none cursor-pointer"
      draggable
      onDragStart={(e) => handleDragStart(e, item.id)}
      onDragEnd={handleDragEnd}
      onClick={() => handleCardClick(item)}
    >
      <div className="flex items-start gap-2">
        <div className="card-initials flex h-8 w-8 items-center justify-center rounded-lg text-xs flex-shrink-0">
          {item.initials}
        </div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-start justify-between gap-1 mb-1">
            <h3 className="truncate text-[12px] font-semibold leading-tight text-white">{item.name}</h3>
            <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide role-badge-founder flex-shrink-0">
              {item.role}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1 mb-2">
            <span className="tag inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] leading-none">
              {item.type}
            </span>
            <span className="text-[10px] text-neutral-400">
              • {item.channel === 'email' ? 'Email' : 'LinkedIn'}
            </span>
          </div>
          <button
            className="w-full text-left rounded-lg panel px-2 py-1.5 hover:bg-[#18192a] mb-2"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick(item);
            }}
          >
            <div className="truncate text-[11px] font-semibold text-white leading-tight">
              {item.subject}
            </div>
            <div className="mt-0.5 line-clamp-2 text-[10px] text-neutral-300 leading-tight">
              {item.message?.length > 80 ? item.message.slice(0, 79) + '…' : item.message}
            </div>
          </button>
          <div className="flex items-center gap-1 text-[10px] text-neutral-400">
            <span className="rounded px-1.5 py-0.5 panel text-[9px]">Demo</span>
            <span className="text-neutral-500">•</span>
            <span className="text-[9px]">{item.company}</span>
          </div>
        </div>
      </div>
    </article>
  );

  return (
    <div className="min-h-screen relative overflow-hidden bg-[#0a0b12] dark">
      {/* Loading Overlay - Shows until all critical content is ready */}
      {!isPageReady && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0b12]">
          <div className="flex flex-col items-center gap-6">
            {/* Bouncing dots animation */}
            <div className="flex gap-3">
              <div
                className="w-4 h-4 rounded-full bg-gradient-to-br from-[var(--wisteria)] to-[var(--lavender-web)] animate-bounce shadow-lg shadow-[var(--wisteria)]/50"
                style={{ animationDelay: '0ms', animationDuration: '0.6s' }}
              ></div>
              <div
                className="w-4 h-4 rounded-full bg-gradient-to-br from-[var(--wisteria)] to-[var(--lavender-web)] animate-bounce shadow-lg shadow-[var(--wisteria)]/50"
                style={{ animationDelay: '150ms', animationDuration: '0.6s' }}
              ></div>
              <div
                className="w-4 h-4 rounded-full bg-gradient-to-br from-[var(--wisteria)] to-[var(--lavender-web)] animate-bounce shadow-lg shadow-[var(--wisteria)]/50"
                style={{ animationDelay: '300ms', animationDuration: '0.6s' }}
              ></div>
            </div>
            {/* Loading text */}
            <div className="flex flex-col items-center gap-2">
              <p className="text-white font-semibold text-lg">{loadingMessage.main}</p>
              <p className="text-neutral-400 text-sm">{loadingMessage.sub}</p>
            </div>
          </div>
        </div>
      )}

      {/* Optimized background - desktop only, auto-calculates grid to fit screen perfectly, deferred load */}
      {showBackground && (
        <div className="hidden lg:block absolute inset-0 z-0">
          <BackgroundRippleEffect autoDimensions={true} cellSize={80} />
        </div>
      )}
      {/* Main content - Fade in when ready */}
      <div className={`relative z-10 pointer-events-none transition-opacity duration-500 ${isPageReady ? 'opacity-100' : 'opacity-0'}`}>
        {/* pointer-events-auto re-enables clicks for the navigation */}
        <div className="pointer-events-auto">
          <Navigation />
        </div>

        {/* Hero with headline - Main SEO content */}
        {/* pointer-events-auto re-enables clicks for the main content */}
        <main className="mx-auto max-w-7xl px-4 pt-8 sm:pt-12 lg:pt-16 pointer-events-auto">
          <header className="text-center">
            <div className="grid gap-6">
              <div>
                {/* Badge with social proof - real data from database - Enhanced */}
                <div
                  className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs pill animate-float shadow-lg"
                  style={{
                    boxShadow: '0 4px 20px rgba(180, 151, 214, 0.3)',
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full animate-pulse"
                    style={{
                      background: "var(--wisteria)",
                      boxShadow: '0 0 8px rgba(180, 151, 214, 0.6)',
                    }}
                  ></span>
                  <span className="font-semibold">{totalFounderCount > 0 ? `${totalFounderCount}+` : '500+'}</span> founders and builders in database
                </div>

                {/* MASSIVE headline with display font - Minimalist Redesign */}
                <h1
                  className="mt-8 font-display text-primary tracking-tight"
                  style={{
                    fontSize: 'clamp(2.5rem, 8vw, 4.5rem)',
                    lineHeight: '1.1',
                    letterSpacing: '-0.03em'
                  }}
                >
                  <span className="animate-fade-in inline-block">Connect</span>{' '}
                  <span className="animate-fade-in animate-delay-100 inline-block">with</span>{' '}
                  <span className="animate-fade-in animate-delay-200 inline-block text-accent">Startup</span>{' '}
                  <span className="animate-fade-in animate-delay-300 inline-block text-accent">Founders</span>
                  <br />
                  <span className="animate-fade-in animate-delay-400 inline-block">Before</span>{' '}
                  <span className="animate-fade-in animate-delay-500 inline-block">They</span>{' '}
                  <span className="animate-fade-in animate-delay-600 inline-block">Blow</span>{' '}
                  <span className="animate-fade-in animate-delay-700 inline-block">Up</span>
                </h1>

                {/* Refined subheadline */}
                <p className="mt-8 text-xl text-secondary max-w-3xl mx-auto" style={{ lineHeight: '1.7' }}>
                  Access verified contact info for early-stage founders, generate AI-powered outreach messages, and track relationships—all in one place.
                </p>

                {/* Enhanced CTA with social proof and urgency */}
                {!isSignedIn ? (
                  <div className="mt-10">
                    {/* Minimalist CTA - Solid purple, no gradient */}
                    <SignInButton mode="modal">
                      <button
                        className="inline-flex items-center gap-3 px-12 py-6 text-lg font-bold text-white rounded-full transition-all duration-300 hover:scale-105 active:scale-95 group"
                        style={{
                          background: 'var(--color-accent)',
                          boxShadow: '0 4px 14px 0 rgba(180, 151, 214, 0.39)'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'var(--color-accent-hover)';
                          e.currentTarget.style.transform = 'translateY(-2px)';
                          e.currentTarget.style.boxShadow = '0 10px 20px 0 rgba(180, 151, 214, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'var(--color-accent)';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(180, 151, 214, 0.39)';
                        }}
                      >
                        <span>Start Connecting Free</span>
                        <svg className="w-6 h-6 transition-transform group-hover:translate-x-2 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </SignInButton>

                    {/* Simplified trust signals - optimized for mobile and desktop */}
                    <div className="mt-5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-sm text-neutral-400">
                      <div className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" fill="var(--lavender-web)" className="h-6 w-6 flex-shrink-0">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="font-medium">Free forever • No credit card</span>
                      </div>
                      <span className="hidden sm:inline text-neutral-600">•</span>
                      <div className="flex items-center gap-2">
                        <svg viewBox="0 0 24 24" fill="var(--lavender-web)" className="h-6 w-6 flex-shrink-0">
                          <path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                        <span className="font-medium">Join 1,200+ builders</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-10">
                    <Link
                      href="/opportunities"
                      className="inline-flex items-center gap-3 px-12 py-6 text-lg font-bold text-white rounded-full transition-all duration-300 hover:scale-105 active:scale-95 group"
                      style={{
                        background: 'var(--color-accent)',
                        boxShadow: '0 4px 14px 0 rgba(180, 151, 214, 0.39)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'var(--color-accent-hover)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                        e.currentTarget.style.boxShadow = '0 10px 20px 0 rgba(180, 151, 214, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--color-accent)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(180, 151, 214, 0.39)';
                      }}
                    >
                      <span>Browse Founders</span>
                      <svg className="w-6 h-6 transition-transform group-hover:translate-x-2 duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Section divider */}
          <div className="section-divider"></div>

          {/* Social Proof Carousel - Show variety of founders IMMEDIATELY after hero */}
          <section className={`mx-auto max-w-7xl px-4 py-12 sm:py-16 transition-opacity duration-500 ${isLoadingCarousel ? 'opacity-0' : 'opacity-100'}`}>
            <div className="text-center mb-10">
              <p className="text-sm font-medium text-neutral-400 mb-3 tracking-wide uppercase">Trusted by builders reaching out to founders at</p>
              <h2 className="text-xl sm:text-2xl font-bold text-white mb-1 tracking-tight" style={{ lineHeight: '1.3' }}>
                {totalFounderCount > 0 ? `${totalFounderCount.toLocaleString()}+` : '500+'} Startups & Growing
              </h2>
            </div>

            {carouselFounders.length > 0 && (
              <div className="relative overflow-hidden group">
                <div
                  className="flex gap-8 carousel-scroll"
                  style={{
                    width: `${carouselFounders.length * 2 * 100}px`,
                    animation: 'scroll-left 80s linear infinite',
                    willChange: 'transform',
                    scrollSnapType: 'x mandatory'
                  }}
                >
                  {/* Duplicate array for seamless loop */}
                  {[...carouselFounders, ...carouselFounders].map((founder, index) => (
                    <div
                      key={`${founder.id}-${index}`}
                      className="flex-shrink-0 flex flex-col items-center cursor-pointer hover-scale"
                      style={{
                        transition: 'transform var(--transition-base), box-shadow var(--transition-base)'
                      }}
                    >
                      {/* Favicon with fallback */}
                      <div className="w-14 h-14 rounded-xl bg-white/95 border border-white/30 flex items-center justify-center overflow-hidden relative shadow-lg">
                        <img
                          src={founder.iconUrl}
                          alt={`${founder.company} logo`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          decoding="async"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        {/* Fallback for failed favicons */}
                        <div className="hidden w-full h-full items-center justify-center text-xs font-bold text-neutral-700 absolute inset-0">
                          {getCompanyDisplayName(founder.company).slice(0, 2).toUpperCase()}
                        </div>
                      </div>
                      {/* Company name underneath */}
                      <div className="mt-2 text-[11px] text-neutral-400 text-center max-w-[85px] truncate font-medium">
                        {getCompanyDisplayName(founder.company)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CSS for carousel animation and pricing card effects */}
            <style jsx>{`
              @keyframes scroll-left {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              @keyframes gradient-shift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
              }
              /* Pause carousel on hover */
              .group:hover .carousel-scroll {
                animation-play-state: paused;
              }
            `}</style>
          </section>

          {/* Section divider */}
          <div className="section-divider"></div>

          {/* Fresh this week preview - Early stage startup showcase */}
          <section id="fresh" className="mx-auto max-w-7xl px-4 py-12 sm:py-20 animate-fade-in-up animate-delayed-3" role="region" aria-labelledby="fresh-heading">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-6">
              <h2 id="fresh-heading" className="text-xl sm:text-2xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
                Discover Builders & Founders This Week
              </h2>
              <Link
                href="/opportunities"
                className="text-sm text-neutral-400 hover:text-white transition-colors self-start sm:self-auto inline-flex items-center gap-1 group"
                aria-label="Browse all builders and founders"
              >
                <span>Explore more builders</span>
                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="mt-4 grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {isLoadingFounders ? (
                // Skeleton loading cards - show 1 on mobile, 2 on tablet, 3 on desktop
                Array.from({ length: 3 }).map((_, index) => (
                  <article
                    key={`skeleton-${index}`}
                    className={`rounded-2xl bg-neutral-50 text-neutral-900 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] ring-1 ring-black/10 overflow-hidden dark:bg-[#11121b] dark:text-neutral-100 dark:ring-white/10 animate-pulse ${index === 0 ? '' : index === 1 ? 'hidden sm:block' : 'hidden lg:block'
                      }`}
                  >
                    <div className="p-4 h-[300px] flex flex-col">
                      {/* Header with Avatar and Company Info - Fixed Height */}
                      <div className="flex items-start gap-3 h-[60px]">
                        <div className="h-10 w-10 bg-neutral-200 dark:bg-neutral-700 rounded-xl flex-shrink-0"></div>
                        <div className="min-w-0 flex-1">
                          <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded mb-2 w-3/4"></div>
                          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded mb-1 w-full"></div>
                          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                        </div>
                      </div>

                      {/* Contact Name - Fixed Height */}
                      <div className="h-[40px] mt-3">
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded mb-1 w-1/4"></div>
                        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2"></div>
                      </div>

                      {/* Role - Fixed Height */}
                      <div className="h-[40px] mt-2">
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded mb-1 w-1/4"></div>
                        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded-full w-20 mt-1"></div>
                      </div>

                      {/* Contact Info - Fixed Height */}
                      <div className="h-[60px] mt-2">
                        <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded mb-2 w-1/3"></div>
                        <div className="flex gap-1">
                          <div className="h-7 bg-neutral-200 dark:bg-neutral-700 rounded-lg w-16"></div>
                          <div className="h-7 bg-neutral-200 dark:bg-neutral-700 rounded-lg w-14"></div>
                          <div className="h-7 bg-neutral-200 dark:bg-neutral-700 rounded-lg w-16"></div>
                        </div>
                      </div>

                      {/* Spacer */}
                      <div className="flex-1"></div>
                    </div>
                  </article>
                ))
              ) : latestFounders && latestFounders.length > 0 ? (
                latestFounders.map((founder, index) => {
                  const avatarInfo = getAvatarInfo(founder.name, founder.company, founder.company_url, founder.url);
                  return (
                    <article
                      key={founder.id}
                      className={`group rounded-2xl bg-neutral-50 text-neutral-900 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)] ring-1 ring-black/10 overflow-hidden dark:bg-[#11121b] dark:text-neutral-100 dark:ring-white/10 hover:ring-white/20 transition-all duration-300 cursor-pointer ${index === 0 ? '' : index === 1 ? 'hidden sm:block' : 'hidden lg:block'
                        }`}
                      style={{
                        transform: 'translateY(0) translateZ(0)',
                        transition: 'all var(--transition-base)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-8px) translateZ(0)';
                        e.currentTarget.style.boxShadow = 'var(--shadow-lg), var(--shadow-glow-lavender)';
                        e.currentTarget.style.borderColor = 'rgba(225, 226, 239, 0.15)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0) translateZ(0)';
                        e.currentTarget.style.boxShadow = '0 10px 30px -10px rgba(0,0,0,0.5)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                      }}
                      onClick={() => {
                        setSelectedFounder(founder);
                        setShowFounderModal(true);
                      }}
                    >
                      <div className="p-4 h-[300px] flex flex-col">
                        {/* Header with Avatar and Company Info - Fixed Height */}
                        <div className="flex items-start gap-3 h-[60px]">
                          <div className="card-initials flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden flex-shrink-0" style={{
                            background: 'rgba(5,32,74,.20)',
                            color: 'var(--lavender-web)',
                            border: '1px solid var(--oxford-blue)'
                          }}>
                            {avatarInfo.faviconUrl ? (
                              <img
                                src={avatarInfo.faviconUrl}
                                alt={`${avatarInfo.displayName} favicon`}
                                className="w-8 h-8 rounded-sm"
                                loading="lazy"
                                onError={(e) => {
                                  const target = e.currentTarget as HTMLImageElement;
                                  target.style.display = 'none';
                                  const nextElement = target.nextElementSibling as HTMLElement;
                                  if (nextElement) {
                                    nextElement.style.display = 'block';
                                  }
                                }}
                              />
                            ) : null}
                            <span
                              className={`font-semibold text-sm ${avatarInfo.faviconUrl ? 'hidden' : 'block'}`}
                            >
                              {avatarInfo.initials}
                            </span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold text-white mb-1 truncate">
                              {getCompanyDisplayName(founder.company)}
                            </h3>
                            <div className="text-xs text-neutral-300 mb-1 h-8 overflow-hidden">
                              <div className="line-clamp-2">
                                {founder.company_info && typeof founder.company_info === 'string'
                                  ? (founder.company_info.length > 80 ? `${founder.company_info.substring(0, 80)}...` : founder.company_info)
                                  : 'Technology company'
                                }
                              </div>
                            </div>
                            <div className="text-xs text-neutral-400">
                              <span>{formatPublishedDate(founder.published)}</span>
                            </div>
                          </div>
                        </div>

                        {/* Contact Name - Fixed Height */}
                        <div className="h-[40px] mt-3">
                          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Contact</span>
                          <div className="text-sm font-medium text-neutral-900 dark:text-white truncate mt-1">
                            {(!founder.name || founder.name === 'Unknown' || founder.name === 'N/A') ? "Unknown" : founder.name}
                          </div>
                        </div>

                        {/* Role - Fixed Height */}
                        <div className="h-[32px] mt-1">
                          <span className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">Role</span>
                          <div className="mt-2 flex flex-wrap gap-1">
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{
                              border: '1px solid rgba(180,151,214,.3)',
                              background: 'rgba(180,151,214,.12)',
                              color: 'var(--wisteria)'
                            }}>
                              {founder.role && !['N/A', 'NA', 'n/a', 'na', 'Unknown', 'unknown'].includes(founder.role) ? founder.role : "Founder"}
                            </span>
                          </div>
                        </div>

                        {/* Contact Info - Fixed Height */}
                        <div className="h-[60px] mt-6">
                          <div className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider mb-1">Contact Info</div>
                          <div className="flex flex-wrap gap-1">
                            {/* LinkedIn button - only show if available and valid */}
                            {founder.linkedinurl && !['N/A', 'NA', 'n/a', 'na', 'Unknown', 'unknown'].includes(founder.linkedinurl) && (
                              <button
                                disabled
                                className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-[#141522] transition-colors text-xs opacity-50 cursor-not-allowed"
                                title="Sign in to access LinkedIn profile"
                              >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-blue-600">
                                  <path d="M4.98 3.5C4.98 4.88 3.87 6 2.5 6S0 4.88 0 3.5 1.12 1 2.5 1s2.48 1.12 2.48 2.5zM0 8h5v16H0zM8 8h4.8v2.2h.07c.67-1.2 2.3-2.46 4.74-2.46 5.07 0 6 3.34 6 7.68V24h-5V16.4c0-1.81-.03-4.14-2.52-4.14-2.52 0-2.91 1.97-2.91 4v7.74H8z" />
                                </svg>
                                LinkedIn
                              </button>
                            )}
                            {/* Email button - only show if available and valid */}
                            {founder.email && !['N/A', 'NA', 'n/a', 'na', 'Unknown', 'unknown'].includes(founder.email) && (
                              <button
                                disabled
                                className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-[#141522] transition-colors text-xs opacity-50 cursor-not-allowed"
                                title="Sign in to access email address"
                              >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-green-600">
                                  <path d="M2 6.75A2.75 2.75 0 0 1 4.75 4h14.5A2.75 2.75 0 0 1 22 6.75v10.5A2.75 2.75 0 0 1 19.25 20H4.75A2.75 2.75 0 0 1 2 17.25V6.75Z" />
                                  <path d="m4 6 8 6 8-6" opacity=".35" />
                                </svg>
                                Email
                              </button>
                            )}
                            {/* Company Website (if available) */}
                            {founder.company_url && !['N/A', 'NA', 'n/a', 'na', 'Unknown', 'unknown'].includes(founder.company_url) && (
                              <button
                                disabled
                                className="inline-flex items-center gap-1 rounded-lg border border-neutral-200 bg-white px-2 py-1 dark:border-white/10 dark:bg-[#141522] transition-colors text-xs opacity-50 cursor-not-allowed"
                                title="Sign in to access company website"
                              >
                                <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3 text-neutral-600">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                                </svg>
                                Website
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Spacer to fill remaining space */}
                        <div className="flex-1"></div>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className="col-span-full text-center text-neutral-500 py-8">
                  No founders found matching the criteria.
                </div>
              )}
            </div>
            <p className="mt-3 text-[13px] text-neutral-500 max-w-2xl mx-auto text-center">Sign in to access founder contact information including verified LinkedIn profiles, email addresses, and direct application links. Connect with builders working on cutting-edge projects before they become mainstream or heavily recruited. Perfect for applying to early-stage startups, collaboration opportunities, or just staying connected with like-minded people in tech.</p>
          </section>

          {/* Section divider */}
          <div className="section-divider"></div>

          {/* Benefits Section - Consolidates Features + Problem/Solution */}
          <Benefits />

          {/* Section divider */}
          <div className="section-divider"></div>

          {/* Pricing Section */}
          <section className="mx-auto max-w-7xl px-4 py-12 sm:py-20" aria-labelledby="pricing-heading">
            <div className="mb-6">
              <h2 id="pricing-heading" className="text-xl sm:text-2xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>
                Simple, Transparent Pricing
              </h2>
            </div>

            {/* Pricing Cards */}
            <div className="mt-4 grid gap-6 grid-cols-1 sm:grid-cols-2">
                {/* Free Plan */}
                <div className="rounded-2xl border border-white/10 bg-[#11121b] p-6 flex flex-col">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Free</h3>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-3xl font-bold text-white">$0</span>
                      <span className="text-neutral-400">/month</span>
                    </div>
                    <p className="text-neutral-400 text-sm">
                      Perfect for getting started with founder outreach
                    </p>
                  </div>

                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-neutral-400">Browse unlimited opportunities</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-neutral-400">Save to opportunities dashboard</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-neutral-400">Basic company information</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm opacity-50">
                      <svg className="w-4 h-4 text-neutral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-neutral-500">No LinkedIn or email access</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm opacity-50">
                      <svg className="w-4 h-4 text-neutral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-neutral-500">No AI outreach generation</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm opacity-50">
                      <svg className="w-4 h-4 text-neutral-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      <span className="text-neutral-500">No outreach tracking boards</span>
                    </div>
                  </div>

                  <SignInButton mode="modal">
                    <button className="w-full rounded-lg px-4 py-3 text-sm font-semibold transition-all mt-6 bg-white/10 text-white hover:bg-white/20 border border-white/10">
                      Get Started
                    </button>
                  </SignInButton>
                </div>

                {/* Pro Plan */}
                <div className="rounded-2xl border-2 border-[var(--wisteria)] bg-[#11121b] p-6 flex flex-col relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-[var(--wisteria)] to-[var(--lavender-web)] text-[#0f1018] px-3 py-1 text-xs font-semibold rounded-bl-lg">
                    RECOMMENDED
                  </div>

                  <div className="mb-6">
                    <h3 className="text-xl font-semibold text-white mb-2">Pro</h3>
                    <div className="flex items-baseline gap-1 mb-3">
                      <span className="text-3xl font-bold text-white">$3</span>
                      <span className="text-neutral-400">/month</span>
                    </div>
                    <p className="text-neutral-400 text-sm">
                      Everything you need for professional outreach
                    </p>
                  </div>

                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-neutral-400">Everything in Free</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-neutral-400 font-semibold">LinkedIn profiles & email addresses</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-neutral-400 font-semibold">AI outreach generation</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-neutral-400 font-semibold">Outreach tracking kanban boards</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-neutral-400">Message archive & history</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-neutral-400">7-day free trial included</span>
                    </div>
                  </div>

                  <SignInButton mode="modal">
                    <button className="w-full rounded-lg px-4 py-3 text-sm font-semibold transition-all mt-6 bg-gradient-to-r from-[var(--wisteria)] to-[var(--lavender-web)] text-white hover:scale-105">
                      Get Started
                    </button>
                  </SignInButton>
                </div>
            </div>
          </section>

          {/* Section divider */}
          <div className="section-divider"></div>

          {/* Why Kanban CRM matters for community outreach */}
          <section id="kanban-why" className="mx-auto max-w-7xl px-4 py-12 sm:py-20 animate-fade-in-up animate-delayed-4" role="region" aria-labelledby="kanban-heading">
            <div className="animate-scale-in animate-delayed-5 rounded-2xl p-6 bg-[#11121b] ring-1 ring-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="max-w-3xl">
                  <h2 id="kanban-heading" className="text-xl font-bold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>Why Use a Kanban Board for Community Outreach?</h2>
                  <p className="text-base leading-relaxed text-[#d4d6e1]">Email inbox gets cluttered fast when networking with multiple builders and founders. Our visual Kanban board helps you <span className="font-semibold" style={{ color: 'var(--lavender-web)' }}>manually track multiple conversations</span> at once. After checking your email or LinkedIn, simply drag cards to update their status and see your relationship building progress at a glance.</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-3 w-full lg:w-auto">
                  <div className="animate-fade-in-left animate-delayed-6 rounded-lg p-3 border border-white/10 bg-[#171828] flex flex-col min-h-[100px] hover-scale">
                    <div className="text-[12px] font-semibold text-white mb-1">Visual relationship tracking</div>
                    <div className="text-[12px] text-neutral-400">See all conversations at a glance.</div>
                  </div>
                  <div className="animate-fade-in-left animate-delayed-6 rounded-lg p-3 border border-white/10 bg-[#171828] flex flex-col min-h-[100px] hover-scale">
                    <div className="text-[12px] font-semibold text-white mb-1">Manual status updates</div>
                    <div className="text-[12px] text-neutral-400">Drag cards to update conversation stages manually.</div>
                  </div>
                  <div className="animate-fade-in-left animate-delayed-6 rounded-lg p-3 border border-white/10 bg-[#171828] flex flex-col min-h-[100px] hover-scale">
                    <div className="text-[12px] font-semibold text-white mb-1">One CRM for all outreach channels</div>
                    <div className="text-[12px] text-neutral-400">Track Email + LinkedIn together.</div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Section divider */}
          <div className="section-divider"></div>

          {/* Interactive Kanban Demo - CRM for startup networking */}
          <section id="kanban-demo" className="hidden xl:block mx-auto max-w-7xl px-4 py-12 sm:py-20 animate-fade-in-up animate-delayed-5" role="region" aria-labelledby="demo-heading">
            <div className="rounded-2xl p-6 bg-[#11121b] ring-1 ring-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6">
                <h2 id="demo-heading" className="text-xl font-bold text-white" style={{ letterSpacing: '-0.02em' }}>Try Our Outreach CRM (Demo)</h2>
                <span className="text-sm text-neutral-400">Click cards to view messages • Drag between stages • Demo data</span>
              </div>

              {/* Demo Tabs - Enhanced */}
              <div className="mb-6">
                <div role="tablist" aria-label="Demo outreach channels" className="inline-flex rounded-xl bg-[#141522] ring-1 ring-white/10 p-1 text-sm shadow-lg">
                  <button
                    role="tab"
                    aria-selected={currentDemoTab === 'email'}
                    className={`tab-btn focus-ring rounded-lg px-4 py-2 font-semibold ${
                      currentDemoTab === 'email'
                        ? 'bg-[var(--lavender-web)] text-[#0f1018] shadow-md'
                        : 'text-neutral-200 hover:text-white'
                    }`}
                    style={{
                      transition: 'all var(--transition-fast)'
                    }}
                    onClick={() => setCurrentDemoTab('email')}
                  >
                    Email Board
                  </button>
                  <button
                    role="tab"
                    aria-selected={currentDemoTab === 'linkedin'}
                    className={`tab-btn focus-ring rounded-lg px-4 py-2 font-semibold ${
                      currentDemoTab === 'linkedin'
                        ? 'bg-[var(--lavender-web)] text-[#0f1018] shadow-md'
                        : 'text-neutral-200 hover:text-white'
                    }`}
                    style={{
                      transition: 'all var(--transition-fast)'
                    }}
                    onClick={() => setCurrentDemoTab('linkedin')}
                  >
                    LinkedIn Board
                  </button>
                </div>
              </div>

              {/* Demo Kanban Board */}
              <div className="kanban-container">
                <div className="kanban-board columns-4">
                  {(currentDemoTab === 'email' ? EMAIL_STAGES : LINKEDIN_STAGES).map(stage => (
                    <div key={stage} className="kanban-col rounded-2xl" data-stage={stage} data-channel={currentDemoTab}>
                      <div className="kanban-col-header flex items-center justify-between rounded-t-2xl">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded brand-badge text-[10px] font-bold">
                            {stage[0].toUpperCase()}
                          </span>
                          <span className="text-[12px] font-semibold text-white">{STAGE_DISPLAY_NAMES[stage] || stage}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400">
                          {demoItems.filter(item => item.stage === stage && item.channel === currentDemoTab).length}
                        </span>
                      </div>
                      <div
                        className="p-1.5 flex flex-col gap-2 flex-1 min-h-[300px]"
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, stage)}
                      >
                        {demoItems
                          .filter(item => {
                            const match = item.stage === stage && item.channel === currentDemoTab;
                            if (stage === 'sent' && currentDemoTab === 'email') {
                              // Filtering for stage and channel
                            }
                            return match;
                          })
                          .map(renderDemoCard)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Section divider */}
          <div className="section-divider"></div>

          {/* FAQ Section */}
          <FAQ />

          {/* Footer */}
        </main>
        <footer className="mx-auto max-w-7xl px-4 pb-10">
          <div className="rounded-2xl p-4 bg-[#11121b] ring-1 ring-white/10 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-[12px] text-neutral-400">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 shrink-0 rounded-full ring-2 ring-white/30 overflow-hidden bg-white/10">
                  <Image
                    src="/favicon.png"
                    alt="Founder Flow Logo"
                    width={28}
                    height={28}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span>© {new Date().getFullYear()} Founder Flow</span>
              </div>
              <div className="flex items-center gap-3">
                <a href="#" className="hover:text-neutral-200">Terms</a>
                <a href="#" className="hover:text-neutral-200">Privacy</a>
                <a href="#" className="hover:text-neutral-200">Contact</a>
              </div>
            </div>
          </div>
        </footer>

        {/* Demo Message Modal - Enhanced */}
        {showModal && selectedMessage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto modal-backdrop"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'var(--blur-lg)'
            }}
            onClick={() => setShowModal(false)}
          >
            <div
              className="relative w-full max-w-3xl max-h-[90vh] mx-4 bg-[#0f1015] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg card-initials text-white font-bold">
                    {selectedMessage.initials}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{selectedMessage.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <span>{selectedMessage.role}</span>
                      <span>•</span>
                      <span>{selectedMessage.company}</span>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1">
                        {selectedMessage.channel === 'email' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                          </svg>
                        )}
                        {selectedMessage.channel === 'email' ? 'Email' : 'LinkedIn'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tag inline-flex items-center rounded-full px-2 py-0.5 text-[11px]">
                    {selectedMessage.type}
                  </span>
                  <button
                    className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold btn-primary"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="px-6 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="text-neutral-300">{selectedMessage.email}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                    <span className="text-blue-400">LinkedIn Profile</span>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-green-500/20 text-green-400 text-xs font-medium">Demo Data</span>
                </div>
              </div>

              {/* Message Content */}
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {selectedMessage.subject}
                  </h3>
                  <div className="text-sm text-neutral-400 mb-4">
                    Outreach Type: {selectedMessage.type} • Channel: {selectedMessage.channel === 'email' ? 'Email' : 'LinkedIn Message'}
                  </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">
                    {selectedMessage.message}
                  </div>
                </div>

                <div className="mt-4 text-xs text-neutral-500">
                  <strong>Note:</strong> This is demo data showing how outreach messages appear in the full application.
                  Upgrade to Pro to access real founder contact information and AI-powered message generation.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Founder Detail Modal */}
        {showFounderModal && selectedFounder && (
          <FounderDetailModal
            founderData={{
              id: selectedFounder.id,
              company: selectedFounder.company,
              companyInfo: selectedFounder.company_info,
              name: selectedFounder.name,
              role: selectedFounder.role && selectedFounder.role !== 'N/A' && selectedFounder.role !== 'NA' && selectedFounder.role !== 'n/a' && selectedFounder.role !== 'na' ? selectedFounder.role : "Founder",
              lookingForTags: selectedFounder.looking_for ? selectedFounder.looking_for.split(',').map(tag => tag.trim()) : [],
              companyUrl: selectedFounder.company_url,
              rolesUrl: selectedFounder.url,
              apply_url: selectedFounder.apply_url,
              linkedinUrl: selectedFounder.linkedinurl,
              emailHref: selectedFounder.email ? `mailto:${selectedFounder.email}` : null,
              published: selectedFounder.published
            }}
            onClose={() => {
              setShowFounderModal(false);
              setSelectedFounder(null);
            }}
            onSave={(jobData) => {
              // For the home page, we don't have save functionality 
              // This would normally save to the user's dashboard
              // Save founder to dashboard functionality
              alert('Save functionality requires sign in. Visit /dashboard to save founders.');
            }}
            isSaved={false}
            isHomePage={true}
          />
        )}
      </div>
    </div>
  );
}
