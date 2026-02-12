'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SignInButton, useUser } from '@clerk/nextjs';
import Navigation from './components/Navigation';
import FounderDetailModal from './components/FounderDetailModal';
import { clientDb } from '@/lib/firebase/client';
import { collection, getDocs, query, orderBy, limit, getCountFromServer } from 'firebase/firestore';
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
  const [carouselFounders, setCarouselFounders] = useState<any[]>([]);
  const [isLoadingCarousel, setIsLoadingCarousel] = useState(true);
  const [totalFounderCount, setTotalFounderCount] = useState<number>(0);
  const [displayCount, setDisplayCount] = useState<number>(0);
  const [showBackground, setShowBackground] = useState(false);
  const [isPageReady, setIsPageReady] = useState(false);
  const counterAnimated = useRef(false);

  // Helper functions
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
      initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
    } else if (company) {
      const parts = company.split(' ');
      initials = parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : parts[0].slice(0, 2).toUpperCase();
    }
    return { faviconUrl, initials, displayName: name || company || 'Unknown' };
  }, []);

  const isNAValue = (value: string | undefined | null): boolean => {
    if (!value || typeof value !== 'string') return true;
    const normalized = value.trim().toLowerCase();
    return normalized === '' || normalized === 'na' || normalized === 'n/a' || normalized === 'unknown' || normalized === 'unknown company';
  };

  const getCompanyDisplayName = (company: string | undefined | null): string => {
    return isNAValue(company) ? 'Stealth Company' : company!;
  };

  const formatPublishedDate = (publishedStr: string) => {
    if (!publishedStr || publishedStr === 'N/A' || publishedStr === 'Unknown') return 'Recently';
    try {
      const publishedDate = new Date(publishedStr);
      if (isNaN(publishedDate.getTime())) return 'Recently';
      const now = new Date();
      const diffDays = Math.ceil(Math.abs(now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24));
      const dateStr = publishedDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const timeAgo = diffDays === 1 ? '1 day ago' : diffDays < 7 ? `${diffDays} days ago` : diffDays < 30 ? `${Math.ceil(diffDays / 7)} weeks ago` : diffDays < 365 ? `${Math.ceil(diffDays / 30)} months ago` : `${Math.ceil(diffDays / 365)} years ago`;
      return `${dateStr} • ${timeAgo}`;
    } catch { return 'Recently'; }
  };

  // Animated counter effect
  useEffect(() => {
    if (totalFounderCount > 0 && !counterAnimated.current) {
      counterAnimated.current = true;
      const target = totalFounderCount;
      const duration = 200;
      const startTime = performance.now();
      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutQuad
        const eased = 1 - (1 - progress) * (1 - progress);
        setDisplayCount(Math.round(eased * target));
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    }
  }, [totalFounderCount]);

  // Defer background rendering
  useEffect(() => {
    const id = setTimeout(() => setShowBackground(true), 2000);
    return () => clearTimeout(id);
  }, []);

  // Page ready
  useEffect(() => {
    if (!isLoadingFounders && demoItems.length > 0) {
      const id = setTimeout(() => setIsPageReady(true), 200);
      return () => clearTimeout(id);
    }
  }, [isLoadingFounders, demoItems.length]);

  // Fetch latest founders + demo data
  useEffect(() => {
    const DEMO_KEY = 'home-kanban-demo-v2';

    const processDemoData = () => {
      const demoSeed = [
        { id: 'h1', name: 'Alex Rivera', role: 'Founder', company: 'DataFlow AI', initials: 'AR', stage: 'sent', channel: 'email', type: 'Job Opportunity', subject: 'Senior Frontend Engineer Position - DataFlow AI', message: `Hi Alex,\n\nI hope this message finds you well. I came across DataFlow AI and was really impressed by your approach to democratizing data analytics through AI.\n\nI'm a senior frontend engineer with 5+ years of experience in React, TypeScript, and modern web technologies. I've built scalable user interfaces for fintech and AI companies, and I'm particularly excited about the intersection of AI and user experience.\n\nYour recent Series A funding and the team's background in ML engineering caught my attention. I'd love to learn more about your frontend engineering needs and discuss how I could contribute to DataFlow AI's mission.\n\nWould you be open to a brief conversation this week?\n\nBest regards,\nJordan`, email: 'alex@dataflow-ai.com', linkedin: 'https://linkedin.com/in/alexrivera' },
        { id: 'h2', name: 'Priya Shah', role: 'CTO', company: 'HealthTech Labs', initials: 'PS', stage: 'sent', channel: 'email', type: 'Collaboration', subject: 'Potential Partnership Opportunity', message: `Hi Priya,\n\nI've been following HealthTech Labs' work in digital health solutions and was impressed by your recent FDA approval for the remote monitoring platform.\n\nI'm working on an open-source project for healthcare data visualization that could complement your platform. I believe there might be synergies between our approaches to patient data presentation.\n\nWould you be interested in a quick call to explore potential collaboration opportunities?\n\nLooking forward to hearing from you,\nSam`, email: 'priya@healthtech-labs.com', linkedin: 'https://linkedin.com/in/priyashah' },
        { id: 'h3', name: 'Ben Lee', role: 'Founder', company: 'GreenTech Solutions', initials: 'BL', stage: 'responded', channel: 'email', type: 'Job Opportunity', subject: 'Re: Backend Developer Position', message: `Hi Ben,\n\nThanks for reaching out about the backend developer position at GreenTech Solutions. Your sustainability-focused mission really resonates with me.\n\nI have 4 years of experience building scalable APIs with Node.js, Python, and cloud platforms. I'm particularly interested in how technology can address climate challenges.\n\nCould we schedule a call next week to discuss the role further?\n\nBest,\nCasey`, email: 'ben@greentech-solutions.com', linkedin: 'https://linkedin.com/in/benlee' },
        { id: 'h4', name: 'Mina Okafor', role: 'Head of Eng', company: 'CloudSecure', initials: 'MO', stage: 'connected', channel: 'linkedin', type: 'Networking', subject: 'Thanks for connecting!', message: `Hey Mina!\n\nThanks for accepting my connection request! Just read your post about CloudSecure's zero-trust architecture migration - brilliant insights on the implementation challenges.\n\nI'm also in the security space and would love to chat about modern security practices sometime. Always valuable to connect with fellow security engineers who really get it.\n\nDrop me a line if you're ever up for grabbing coffee or jumping on a quick call!`, email: 'mina@cloudsecure.io', linkedin: 'https://linkedin.com/in/minaokafor' },
        { id: 'h5', name: 'David Chen', role: 'Founder', company: 'MobileTech Inc', initials: 'DC', stage: 'sent', channel: 'linkedin', type: 'Job Opportunity', subject: 'Mobile Engineer Opportunity', message: `Hi David!\n\nSaw your post about MobileTech Inc's recent app launch hitting 100K+ downloads - that's incredible growth!\n\nI'm a mobile engineer specializing in React Native and Flutter. Your cross-platform approach really caught my attention, especially how you've scaled user engagement.\n\nWould love to connect and learn more about your engineering team's roadmap. Any openings for senior mobile talent?\n\nCheers!`, email: 'david@mobiletech.com', linkedin: 'https://linkedin.com/in/davidchen' },
        { id: 'h6', name: 'Sarah Johnson', role: 'CTO', company: 'EdTech Pro', initials: 'SJ', stage: 'responded', channel: 'linkedin', type: 'Collaboration', subject: 'Following up on EdTech chat', message: `Hey! Thanks for connecting\n\nReally enjoyed our brief exchange about personalized learning algorithms. Your insights on adaptive AI in education were spot-on.\n\nI've been working on some similar research that might complement what EdTech Pro is building. Would you be up for a quick coffee chat or video call?\n\nAlways great to meet fellow EdTech innovators!`, email: 'sarah@edtech-pro.com', linkedin: 'https://linkedin.com/in/sarahjohnson' }
      ];

      localStorage.removeItem('home-kanban-demo-v1');
      try {
        const raw = JSON.parse(localStorage.getItem(DEMO_KEY) || '[]');
        const items = Array.isArray(raw) && raw.length && raw[0].channel ? raw : [...demoSeed];
        setDemoItems(items);
      } catch { setDemoItems([...demoSeed]); }
    };

    const fetchLatestFounders = async () => {
      try {
        const q = query(collection(clientDb, 'entry'), orderBy('published', 'desc'), limit(3));
        const snap = await getDocs(q);

        if (snap.docs.length === 0) {
          await getDocs(query(collection(clientDb, 'entry')));
        }

        const allFounders = snap.docs.map((d) => {
          const data = d.data();
          let publishedStr = '';
          if (data.published) {
            if (data.published.toDate && typeof data.published.toDate === 'function') {
              try { publishedStr = data.published.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }); } catch { publishedStr = 'Unknown'; }
            } else if (typeof data.published === 'string') { publishedStr = data.published; }
            else { publishedStr = String(data.published); }
          } else { publishedStr = 'Unknown'; }

          return {
            id: d.id, name: data.name || '', role: data.role || '', company_info: data.company_info || '', company: data.company || '',
            published: publishedStr, linkedinurl: data.linkedinurl || '', email: data.email || '', company_url: data.company_url || '',
            apply_url: data.apply_url || '', url: data.url || '', looking_for: data.looking_for || ''
          };
        });

        const founders = allFounders
          .filter((f) => typeof f.company === 'string' && f.company.trim() !== '' && typeof f.name === 'string' && f.name.trim() !== '')
          .sort((a, b) => {
            const aD = a.published && a.published !== 'Unknown' ? new Date(a.published) : new Date(0);
            const bD = b.published && b.published !== 'Unknown' ? new Date(b.published) : new Date(0);
            if (!isNaN(aD.getTime()) && !isNaN(bD.getTime()) && aD.getTime() !== bD.getTime()) return bD.getTime() - aD.getTime();
            const aS = (a.linkedinurl && a.linkedinurl !== 'N/A' ? 1 : 0) + (a.email && a.email !== 'N/A' ? 1 : 0) + (a.company_url && a.company_url !== 'N/A' ? 1 : 0);
            const bS = (b.linkedinurl && b.linkedinurl !== 'N/A' ? 1 : 0) + (b.email && b.email !== 'N/A' ? 1 : 0) + (b.company_url && b.company_url !== 'N/A' ? 1 : 0);
            return bS - aS;
          })
          .slice(0, 3);

        setLatestFounders(founders);
      } catch (error) { console.error('Failed to fetch latest founders:', error); }
      finally { setIsLoadingFounders(false); }
    };

    fetchLatestFounders();
    if (typeof window !== 'undefined') setTimeout(processDemoData, 100);
  }, []);

  // Fetch total count
  useEffect(() => {
    const fetchTotalCount = async () => {
      try {
        const snapshot = await getCountFromServer(collection(clientDb, 'entry'));
        setTotalFounderCount(snapshot.data().count);
      } catch { setTotalFounderCount(500); }
    };
    const id = setTimeout(fetchTotalCount, 500);
    return () => clearTimeout(id);
  }, []);

  // Fetch carousel founders
  useEffect(() => {
    const fetchCarouselFounders = async () => {
      setIsLoadingCarousel(true);
      try {
        const q = query(collection(clientDb, 'entry'), orderBy('published', 'desc'), limit(30));
        const snap = await getDocs(q);
        const founders = snap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Founder[];
        const validated: any[] = [];

        for (let i = 0; i < Math.min(founders.length, 30); i++) {
          const f = founders[i];
          if (isNAValue(f.company)) continue;
          if (!f.company_info || f.company_info.length <= 30 || f.company_info === 'N/A' || f.company_info === 'NA') continue;
          const website = f.company_url || f.url;
          if (!website || website === 'N/A' || website === 'NA' || website === 'n/a') continue;
          const domain = getDomainFromUrl(website);
          if (!domain || domain.length <= 3) continue;
          const iconUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
          const hasValidName = typeof f.name === 'string' && f.name !== 'N/A' && f.name !== 'NA' && f.name.trim().length > 0;
          validated.push({
            id: f.id, name: hasValidName ? f.name : 'Unknown Founder',
            role: f.role && f.role !== 'N/A' ? f.role : 'Founder',
            company: f.company, company_info: f.company_info, iconUrl, website, domain, hasValidIcon: true
          });
          if (validated.length >= 25) break;
        }
        setCarouselFounders(validated);
      } catch (error) { console.error('Failed to fetch carousel founders:', error); }
      finally { setIsLoadingCarousel(false); }
    };
    const id = setTimeout(fetchCarouselFounders, 300);
    return () => clearTimeout(id);
  }, []);

  // Demo kanban handlers
  const saveDemoItems = (items: any[]) => {
    try { localStorage.setItem('home-kanban-demo-v2', JSON.stringify(items)); setDemoItems(items); } catch { }
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    e.dataTransfer.setData('text/plain', itemId);
    e.dataTransfer.effectAllowed = 'move';
    (e.target as HTMLElement).classList.add('dragging');
  };
  const handleDragEnd = (e: React.DragEvent) => { (e.target as HTMLElement).classList.remove('dragging'); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); (e.currentTarget as HTMLElement).classList.add('drop-target'); };
  const handleDragLeave = (e: React.DragEvent) => { (e.currentTarget as HTMLElement).classList.remove('drop-target'); };
  const handleDrop = (e: React.DragEvent, newStage: string) => {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('drop-target');
    const itemId = e.dataTransfer.getData('text/plain');
    saveDemoItems(demoItems.map(item => item.id === itemId ? { ...item, stage: newStage } : item));
  };

  const EMAIL_STAGES = ['sent', 'responded', 'in_talks', 'interviewing'];
  const LINKEDIN_STAGES = ['sent', 'responded', 'connected', 'ghosted'];
  const STAGE_DISPLAY_NAMES: Record<string, string> = { sent: 'Sent', responded: 'Responded', in_talks: 'In Talks', interviewing: 'Interviewing', connected: 'Connected', ghosted: 'Ghosted' };

  const generateInitials = useCallback((name: string): string => {
    return name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2);
  }, []);

  const handleCardClick = (item: any) => { setSelectedMessage(item); setShowModal(true); };

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
        <div className="card-initials flex h-8 w-8 items-center justify-center rounded-lg text-xs flex-shrink-0">{item.initials}</div>
        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="flex items-start justify-between gap-1 mb-1">
            <h3 className="truncate text-[12px] font-semibold leading-tight text-white">{item.name}</h3>
            <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide role-badge-founder flex-shrink-0">{item.role}</span>
          </div>
          <div className="flex flex-wrap items-center gap-1 mb-2">
            <span className="tag inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] leading-none">{item.type}</span>
            <span className="text-[10px] text-neutral-400">• {item.channel === 'email' ? 'Email' : 'LinkedIn'}</span>
          </div>
          <button className="w-full text-left rounded-lg panel px-2 py-1.5 hover:bg-[#18192a] mb-2" onClick={(e) => { e.stopPropagation(); handleCardClick(item); }}>
            <div className="truncate text-[11px] font-semibold text-white leading-tight">{item.subject}</div>
            <div className="mt-0.5 line-clamp-2 text-[10px] text-neutral-300 leading-tight">{item.message?.length > 80 ? item.message.slice(0, 79) + '…' : item.message}</div>
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
      {/* Loading Overlay */}
      {!isPageReady && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{
            background: 'linear-gradient(180deg, #0c0d16, #090a11 40%, #070810)',
          }}
        >
          <div className="flex flex-col items-center gap-6">
            <div className="spinner-premium">
              <div className="inner"></div>
            </div>
            <p className="font-display text-lg text-white">Loading Founder Flow...</p>
          </div>
        </div>
      )}

      {/* Background ripple - deferred */}
      {showBackground && (
        <div className="hidden lg:block absolute inset-0 z-0 opacity-60">
          <BackgroundRippleEffect autoDimensions={true} cellSize={80} />
        </div>
      )}

      {/* Main content */}
      <div className={`relative z-10 pointer-events-none transition-opacity duration-500 ${isPageReady ? 'opacity-100' : 'opacity-0'}`}>
        <div className="pointer-events-auto">
          <Navigation />
        </div>

        <main className="pointer-events-auto">
          {/* ==================== HERO — Asymmetric Split ==================== */}
          <section className="mx-auto max-w-7xl px-4 pt-12 sm:pt-16 lg:pt-20 pb-12 sm:pb-16">
            <div className="lg:grid lg:gap-12" style={{ gridTemplateColumns: '1.1fr 0.9fr' }}>
              {/* Left column */}
              <div className="flex flex-col justify-center text-center lg:text-left">
                {/* Badge pill */}
                <div className="flex justify-center lg:justify-start">
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs pill"
                    style={{ boxShadow: '0 4px 20px rgba(180, 151, 214, 0.2)' }}
                  >
                    <span className="pulse-dot-green" />
                    <span className="font-semibold">{displayCount > 0 ? `${displayCount}+` : '500+'}</span> founders in database
                  </div>
                </div>

                {/* Headline */}
                <h1
                  className="mt-8 font-display text-white"
                  style={{
                    fontSize: 'clamp(3rem, 7vw, 5.5rem)',
                    lineHeight: '1.08',
                    letterSpacing: '-0.03em',
                  }}
                >
                  Find Early-Stage{' '}
                  <em className="not-italic" style={{ fontStyle: 'italic', color: 'var(--wisteria)' }}>
                    Startup Founders
                  </em>
                </h1>

                {/* Subheadline */}
                <p className="mt-6 text-lg text-neutral-400 max-w-xl mx-auto lg:mx-0" style={{ lineHeight: '1.7' }}>
                  Access verified contact info, generate AI-powered outreach messages, and track relationships with early-stage founders—all before they blow up.
                </p>

                {/* CTA */}
                <div className="mt-10 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  {!isSignedIn ? (
                    <SignInButton mode="modal">
                      <button className="btn btn-primary btn-lg px-10 py-4 text-base font-bold rounded-full">
                        Start Connecting Free
                        <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                      </button>
                    </SignInButton>
                  ) : (
                    <Link href="/opportunities" className="btn btn-primary btn-lg px-10 py-4 text-base font-bold rounded-full">
                      Browse Founders
                      <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </Link>
                  )}
                </div>

                {/* Trust signals */}
                <div className="mt-6 flex flex-col sm:flex-row items-center gap-3 sm:gap-5 text-sm text-neutral-500 justify-center lg:justify-start">
                  <div className="flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="var(--wisteria)" className="h-4 w-4"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>Free forever</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="var(--wisteria)" className="h-4 w-4"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    <span>No credit card</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="var(--wisteria)" className="h-4 w-4"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                    <span>1,200+ builders</span>
                  </div>
                </div>
              </div>

              {/* Right column — Floating founder card stack */}
              <div className="hidden lg:flex flex-col items-center justify-center mt-12 lg:mt-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500 mb-5">
                  This week&apos;s founders
                </p>

                {isLoadingFounders ? (
                  <div className="flex items-center justify-center h-[320px]">
                    <div className="spinner-premium"><div className="inner"></div></div>
                  </div>
                ) : latestFounders.length > 0 ? (
                  <div className="hero-card-stack relative w-full max-w-sm h-[340px]">
                    {latestFounders.map((founder, index) => {
                      const avatarInfo = getAvatarInfo(founder.name, founder.company, founder.company_url, founder.url);
                      const offsets = [
                        { x: -20, y: 20, rotate: -4 },
                        { x: 0, y: 0, rotate: 0 },
                        { x: 20, y: 20, rotate: 4 },
                      ];
                      const { x, y, rotate } = offsets[index] || offsets[1];

                      return (
                        <div
                          key={founder.id}
                          className="stack-card absolute inset-0 outline bg-[#0e0f1a] rounded-2xl p-5 cursor-pointer"
                          style={{
                            transform: `translateX(${x}px) translateY(${y}px) rotate(${rotate}deg)`,
                            zIndex: index === 1 ? 3 : 1,
                            opacity: index === 1 ? 1 : 0.7,
                          }}
                          onClick={() => { setSelectedFounder(founder); setShowFounderModal(true); }}
                        >
                          {/* Card header */}
                          <div className="flex items-start gap-3 mb-4">
                            <div className="card-initials flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden flex-shrink-0" style={{ background: 'rgba(5,32,74,.20)', color: 'var(--lavender-web)', border: '1px solid var(--oxford-blue)' }}>
                              {avatarInfo.faviconUrl ? (
                                <img src={avatarInfo.faviconUrl} alt="" className="w-8 h-8 rounded-sm" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; const next = e.currentTarget.nextElementSibling as HTMLElement; if (next) next.style.display = 'block'; }} />
                              ) : null}
                              <span className={`font-semibold text-sm ${avatarInfo.faviconUrl ? 'hidden' : 'block'}`}>{avatarInfo.initials}</span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-base font-semibold text-white truncate">{getCompanyDisplayName(founder.company)}</h3>
                              <div className="text-xs text-neutral-400 line-clamp-2 mt-1">
                                {founder.company_info && typeof founder.company_info === 'string'
                                  ? (founder.company_info.length > 80 ? `${founder.company_info.substring(0, 80)}...` : founder.company_info)
                                  : 'Technology company'}
                              </div>
                            </div>
                          </div>

                          {/* Contact */}
                          <div className="mb-3">
                            <span className="text-[10px] font-medium text-neutral-500 uppercase tracking-wider">Contact</span>
                            <div className="text-sm font-medium text-white truncate mt-0.5">
                              {(!founder.name || founder.name === 'Unknown' || founder.name === 'N/A') ? 'Unknown' : founder.name}
                            </div>
                          </div>

                          {/* Role badge */}
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ border: '1px solid rgba(180,151,214,.3)', background: 'rgba(180,151,214,.12)', color: 'var(--wisteria)' }}>
                            {founder.role && !['N/A', 'NA', 'n/a', 'na', 'Unknown', 'unknown'].includes(founder.role) ? founder.role : 'Founder'}
                          </span>

                          {/* Published */}
                          <div className="text-[10px] text-neutral-500 mt-3">{formatPublishedDate(founder.published)}</div>
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>
            </div>

            {/* Mobile: horizontal scroll founder cards */}
            <div className="lg:hidden mt-10">
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-neutral-500 mb-4 text-center">
                This week&apos;s founders
              </p>
              {!isLoadingFounders && latestFounders.length > 0 && (
                <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-4 px-4" style={{ scrollbarWidth: 'none' }}>
                  {latestFounders.map((founder) => {
                    const avatarInfo = getAvatarInfo(founder.name, founder.company, founder.company_url, founder.url);
                    return (
                      <div
                        key={founder.id}
                        className="snap-center flex-shrink-0 w-[280px] glass-card rounded-2xl p-5 cursor-pointer"
                        onClick={() => { setSelectedFounder(founder); setShowFounderModal(true); }}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <div className="card-initials flex h-9 w-9 items-center justify-center rounded-lg overflow-hidden flex-shrink-0" style={{ background: 'rgba(5,32,74,.20)', color: 'var(--lavender-web)', border: '1px solid var(--oxford-blue)' }}>
                            {avatarInfo.faviconUrl ? (
                              <img src={avatarInfo.faviconUrl} alt="" className="w-7 h-7 rounded-sm" loading="lazy" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; const next = e.currentTarget.nextElementSibling as HTMLElement; if (next) next.style.display = 'block'; }} />
                            ) : null}
                            <span className={`font-semibold text-xs ${avatarInfo.faviconUrl ? 'hidden' : 'block'}`}>{avatarInfo.initials}</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-white truncate">{getCompanyDisplayName(founder.company)}</h3>
                            <div className="text-xs text-neutral-400 line-clamp-2 mt-0.5">
                              {founder.company_info && typeof founder.company_info === 'string' ? (founder.company_info.length > 60 ? `${founder.company_info.substring(0, 60)}...` : founder.company_info) : 'Technology company'}
                            </div>
                          </div>
                        </div>
                        <div className="text-xs text-white font-medium">{(!founder.name || founder.name === 'Unknown' || founder.name === 'N/A') ? 'Unknown' : founder.name}</div>
                        <span className="mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide" style={{ border: '1px solid rgba(180,151,214,.3)', background: 'rgba(180,151,214,.12)', color: 'var(--wisteria)' }}>
                          {founder.role && !['N/A', 'NA', 'n/a', 'na', 'Unknown', 'unknown'].includes(founder.role) ? founder.role : 'Founder'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>

          {/* Section divider */}
          <div className="section-divider" />

          {/* ==================== SOCIAL PROOF CAROUSEL ==================== */}
          <section className={`mx-auto max-w-7xl px-4 py-12 sm:py-16 transition-opacity duration-500 ${isLoadingCarousel ? 'opacity-0' : 'opacity-100'}`}>
            <div className="text-center mb-10">
              <p className="text-sm font-medium text-neutral-500 mb-3 tracking-wide uppercase">Trusted by builders reaching out to founders at</p>
              <h2 className="font-display text-2xl sm:text-3xl text-white mb-1" style={{ lineHeight: '1.15', letterSpacing: '-0.02em' }}>
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
                  }}
                >
                  {[...carouselFounders, ...carouselFounders].map((founder, index) => (
                    <div key={`${founder.id}-${index}`} className="flex-shrink-0 flex flex-col items-center hover-scale" style={{ transition: 'transform var(--transition-base)' }}>
                      <div className="w-14 h-14 rounded-xl bg-white/95 border border-white/30 flex items-center justify-center overflow-hidden relative shadow-lg">
                        <img src={founder.iconUrl} alt={`${founder.company} logo`} className="w-full h-full object-cover" loading="lazy" decoding="async" onError={(e) => { e.currentTarget.style.display = 'none'; const fallback = e.currentTarget.nextElementSibling as HTMLElement; if (fallback) fallback.style.display = 'flex'; }} />
                        <div className="hidden w-full h-full items-center justify-center text-xs font-bold text-neutral-700 absolute inset-0">{getCompanyDisplayName(founder.company).slice(0, 2).toUpperCase()}</div>
                      </div>
                      <div className="mt-2 text-[11px] text-neutral-500 text-center max-w-[85px] truncate font-medium">{getCompanyDisplayName(founder.company)}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <style jsx>{`
              @keyframes scroll-left {
                0% { transform: translateX(0); }
                100% { transform: translateX(-50%); }
              }
              .group:hover .carousel-scroll {
                animation-play-state: paused;
              }
            `}</style>
          </section>

          <div className="section-divider" />

          {/* ==================== BENEFITS — Step Flow ==================== */}
          <Benefits />

          <div className="section-divider" />

          {/* ==================== PRICING — Asymmetric ==================== */}
          <section className="mx-auto max-w-5xl px-4 py-16 sm:py-24" aria-labelledby="pricing-heading">
            <div className="text-center mb-14">
              <h2 id="pricing-heading" className="font-display text-3xl sm:text-4xl text-white" style={{ lineHeight: '1.15', letterSpacing: '-0.02em' }}>
                Simple pricing. Start free.
              </h2>
              <p className="mt-4 text-neutral-400 text-base">No surprises. Upgrade when you&apos;re ready.</p>
            </div>

            {/* Pricing grid — asymmetric */}
            <div className="grid gap-8 grid-cols-1 lg:grid-cols-5 items-start">
              {/* Free card — 40% */}
              <div className="lg:col-span-2 rounded-2xl border border-white/8 bg-[#0e0f1a] p-8 flex flex-col order-2 lg:order-1">
                <h3 className="text-lg font-semibold text-neutral-400 mb-4">Free</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-display text-white" style={{ fontSize: '56px', lineHeight: '1' }}>$0</span>
                  <span className="text-neutral-500 text-sm">/month</span>
                </div>
                <p className="text-neutral-500 text-sm mb-8">Get started with founder outreach</p>

                <div className="space-y-3 flex-1">
                  {['Browse unlimited opportunities', 'Save to dashboard', 'Basic company information'].map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-base">
                      <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                      <span className="text-neutral-400">{f}</span>
                    </div>
                  ))}
                  {['No LinkedIn or email access', 'No AI outreach generation', 'No outreach tracking boards'].map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-base opacity-40">
                      <svg className="w-4 h-4 text-neutral-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                      <span className="text-neutral-500">{f}</span>
                    </div>
                  ))}
                </div>

                <SignInButton mode="modal">
                  <button className="btn btn-ghost w-full mt-8 py-3 text-sm rounded-xl">Get Started</button>
                </SignInButton>
              </div>

              {/* Pro card — 60% */}
              <div className="lg:col-span-3 pro-gradient-border relative order-1 lg:order-2">
                <span className="recommended-pill">RECOMMENDED</span>
                <div className="rounded-2xl p-8 flex flex-col" style={{ background: 'linear-gradient(135deg, rgba(18,19,32,1), rgba(14,15,26,1))' }}>
                  <h3 className="text-lg font-semibold text-white mb-4">Pro</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-display text-white" style={{ fontSize: '72px', lineHeight: '1' }}>$3</span>
                    <span className="text-neutral-400 text-sm">/month</span>
                  </div>
                  <p className="text-neutral-400 text-sm mb-8">Everything you need for professional outreach</p>

                  <div className="space-y-3 flex-1">
                    {[
                      { text: 'Everything in Free', bold: false },
                      { text: 'LinkedIn profiles & email addresses', bold: true },
                      { text: 'AI outreach generation', bold: true },
                      { text: 'Outreach tracking kanban boards', bold: true },
                      { text: 'Message archive & history', bold: false },
                      { text: '7-day free trial included', bold: false },
                    ].map((f) => (
                      <div key={f.text} className="flex items-center gap-2.5 text-base">
                        <svg className="w-4 h-4 text-green-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                        <span className={`text-neutral-300 ${f.bold ? 'font-semibold' : ''}`}>{f.text}</span>
                      </div>
                    ))}
                  </div>

                  <SignInButton mode="modal">
                    <button className="btn btn-primary w-full mt-8 py-3.5 text-sm rounded-xl font-bold">
                      Start Free Trial
                    </button>
                  </SignInButton>
                </div>
              </div>
            </div>
          </section>

          <div className="section-divider" />

          {/* ==================== KANBAN — Merged Section ==================== */}
          <section id="kanban-demo" className="hidden lg:block mx-auto max-w-7xl px-4 py-16 sm:py-24" role="region" aria-labelledby="demo-heading">
            <div className="text-center mb-6">
              <h2 id="demo-heading" className="font-display text-3xl sm:text-4xl text-white" style={{ lineHeight: '1.15', letterSpacing: '-0.02em' }}>
                See It In Action
              </h2>
              <p className="mt-4 text-neutral-400 max-w-2xl mx-auto text-base">
                Track conversations with a visual kanban board.{' '}
                <span className="inline-flex items-center gap-1.5 text-[var(--wisteria)]">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>
                  Try dragging a card
                </span>
              </p>
              {/* Inline benefit pills */}
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {['Visual relationship tracking', 'Manual status updates', 'Email + LinkedIn in one CRM'].map((pill) => (
                  <span key={pill} className="pill rounded-full px-4 py-1.5 text-xs font-medium text-neutral-300">{pill}</span>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-2xl p-6 mt-8">
              {/* Demo Tabs */}
              <div className="mb-6">
                <div role="tablist" aria-label="Demo outreach channels" className="inline-flex rounded-xl bg-[#141522] ring-1 ring-white/10 p-1 text-sm shadow-lg">
                  <button role="tab" aria-selected={currentDemoTab === 'email'} className={`tab-btn focus-ring rounded-lg px-4 py-2 font-semibold ${currentDemoTab === 'email' ? 'bg-[var(--lavender-web)] text-[#0f1018] shadow-md' : 'text-neutral-200 hover:text-white'}`} style={{ transition: 'all var(--transition-fast)' }} onClick={() => setCurrentDemoTab('email')}>Email Board</button>
                  <button role="tab" aria-selected={currentDemoTab === 'linkedin'} className={`tab-btn focus-ring rounded-lg px-4 py-2 font-semibold ${currentDemoTab === 'linkedin' ? 'bg-[var(--lavender-web)] text-[#0f1018] shadow-md' : 'text-neutral-200 hover:text-white'}`} style={{ transition: 'all var(--transition-fast)' }} onClick={() => setCurrentDemoTab('linkedin')}>LinkedIn Board</button>
                </div>
                <span className="ml-4 text-sm text-neutral-500 hidden xl:inline">Click cards to view messages • Drag between stages</span>
              </div>

              {/* Kanban board */}
              <div className="kanban-container">
                <div className="kanban-board columns-4">
                  {(currentDemoTab === 'email' ? EMAIL_STAGES : LINKEDIN_STAGES).map(stage => (
                    <div key={stage} className="kanban-col rounded-2xl" data-stage={stage} data-channel={currentDemoTab}>
                      <div className="kanban-col-header flex items-center justify-between rounded-t-2xl">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex h-4 w-4 items-center justify-center rounded brand-badge text-[10px] font-bold">{stage[0].toUpperCase()}</span>
                          <span className="text-[12px] font-semibold text-white">{STAGE_DISPLAY_NAMES[stage] || stage}</span>
                        </div>
                        <span className="text-[10px] text-neutral-400">{demoItems.filter(item => item.stage === stage && item.channel === currentDemoTab).length}</span>
                      </div>
                      <div className="p-1.5 flex flex-col gap-2 flex-1 min-h-[300px]" onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={(e) => handleDrop(e, stage)}>
                        {demoItems.filter(item => item.stage === stage && item.channel === currentDemoTab).map(renderDemoCard)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <div className="section-divider" />

          {/* ==================== FAQ ==================== */}
          <FAQ />

          {/* ==================== FINAL CTA ==================== */}
          <section className="mx-auto max-w-4xl px-4 py-20 sm:py-28 text-center">
            <h2
              className="font-display text-3xl sm:text-4xl text-white mb-4"
              style={{ lineHeight: '1.15', letterSpacing: '-0.02em' }}
            >
              Ready to start connecting?
            </h2>
            <p className="text-neutral-400 text-base mb-10">
              Join 1,200+ builders already using Founder Flow to discover and reach early-stage founders.
            </p>
            {!isSignedIn ? (
              <SignInButton mode="modal">
                <button className="btn btn-primary btn-lg px-10 py-4 text-base font-bold rounded-full">
                  Get Started Free
                  <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </SignInButton>
            ) : (
              <Link href="/opportunities" className="btn btn-primary btn-lg px-10 py-4 text-base font-bold rounded-full">
                Browse Founders
                <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
            )}
          </section>
        </main>

        {/* Footer */}
        <footer className="mx-auto max-w-7xl px-4 pb-10">
          <div className="rounded-2xl p-4 glass-card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-[12px] text-neutral-400">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 shrink-0 rounded-full ring-2 ring-white/30 overflow-hidden bg-white/10">
                  <Image src="/favicon.png" alt="Founder Flow Logo" width={28} height={28} className="w-full h-full object-cover" />
                </div>
                <span>&copy; {new Date().getFullYear()} Founder Flow</span>
              </div>
              <div className="flex items-center gap-3">
                <a href="#" className="hover:text-neutral-200 transition-colors">Terms</a>
                <a href="#" className="hover:text-neutral-200 transition-colors">Privacy</a>
                <a href="mailto:support@founderflow.space" className="hover:text-neutral-200 transition-colors">Contact</a>
              </div>
            </div>
          </div>
        </footer>

        {/* Demo Message Modal */}
        {showModal && selectedMessage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-auto modal-backdrop" style={{ background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'var(--blur-lg)' }} onClick={() => setShowModal(false)}>
            <div className="relative w-full max-w-3xl max-h-[90vh] mx-4 bg-[#0f1015] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-scale-in" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg card-initials text-white font-bold">{selectedMessage.initials}</div>
                  <div>
                    <h2 className="text-xl font-semibold text-white">{selectedMessage.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-neutral-400">
                      <span>{selectedMessage.role}</span><span>•</span><span>{selectedMessage.company}</span><span>•</span>
                      <span className="inline-flex items-center gap-1">
                        {selectedMessage.channel === 'email' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                        )}
                        {selectedMessage.channel === 'email' ? 'Email' : 'LinkedIn'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="tag inline-flex items-center rounded-full px-2 py-0.5 text-[11px]">{selectedMessage.type}</span>
                  <button className="focus-ring rounded-lg px-3 py-2 text-sm font-semibold btn-primary" onClick={() => setShowModal(false)}>Close</button>
                </div>
              </div>
              <div className="px-6 py-3 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1"><svg className="w-4 h-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg><span className="text-neutral-300">{selectedMessage.email}</span></div>
                  <div className="flex items-center gap-1"><svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg><span className="text-blue-400">LinkedIn Profile</span></div>
                  <span className="px-2 py-1 rounded-md bg-green-500/20 text-green-400 text-xs font-medium">Demo Data</span>
                </div>
              </div>
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-white mb-2">{selectedMessage.subject}</h3>
                  <div className="text-sm text-neutral-400 mb-4">Outreach Type: {selectedMessage.type} • Channel: {selectedMessage.channel === 'email' ? 'Email' : 'LinkedIn Message'}</div>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="text-sm text-neutral-200 leading-relaxed whitespace-pre-wrap">{selectedMessage.message}</div>
                </div>
                <div className="mt-4 text-xs text-neutral-500"><strong>Note:</strong> This is demo data. Upgrade to Pro to access real founder contact information and AI-powered message generation.</div>
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
              role: selectedFounder.role && !['N/A', 'NA', 'n/a', 'na'].includes(selectedFounder.role) ? selectedFounder.role : 'Founder',
              lookingForTags: selectedFounder.looking_for ? selectedFounder.looking_for.split(',').map(tag => tag.trim()) : [],
              companyUrl: selectedFounder.company_url,
              rolesUrl: selectedFounder.url,
              apply_url: selectedFounder.apply_url,
              linkedinUrl: selectedFounder.linkedinurl,
              emailHref: selectedFounder.email ? `mailto:${selectedFounder.email}` : null,
              published: selectedFounder.published
            }}
            onClose={() => { setShowFounderModal(false); setSelectedFounder(null); }}
            onSave={() => { alert('Save functionality requires sign in. Visit /dashboard to save founders.'); }}
            isSaved={false}
            isHomePage={true}
          />
        )}
      </div>
    </div>
  );
}
