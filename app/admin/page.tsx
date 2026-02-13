'use client';

import { useAuth } from '@clerk/nextjs';
import { useState } from 'react';
import Link from 'next/link';
import Navigation from '../components/Navigation';

export default function AdminDashboard() {
  const { isLoaded, userId } = useAuth();
  const [grantProForm, setGrantProForm] = useState({
    targetUserId: '',
    durationDays: 365,
    loading: false,
    message: ''
  });

  const handleGrantPro = async (e: React.FormEvent) => {
    e.preventDefault();
    setGrantProForm(prev => ({ ...prev, loading: true, message: '' }));

    try {
      const response = await fetch('/api/admin/grant-pro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetUserId: grantProForm.targetUserId || undefined,
          durationDays: grantProForm.durationDays
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setGrantProForm(prev => ({
          ...prev,
          message: `✅ ${result.message}`,
          targetUserId: '',
        }));
      } else {
        setGrantProForm(prev => ({
          ...prev,
          message: `❌ Error: ${result.error || 'Failed to grant Pro access'}`
        }));
      }
    } catch (error) {
      setGrantProForm(prev => ({
        ...prev,
        message: `❌ Error: ${error instanceof Error ? error.message : 'Network error'}`
      }));
    } finally {
      setGrantProForm(prev => ({ ...prev, loading: false }));
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

  const navCards = [
    {
      href: '/admin/data-management',
      title: 'Data Management',
      desc: 'Full CRUD, export, and data quality tools',
      color: 'blue',
      iconBg: 'bg-blue-500/15',
      iconColor: 'text-blue-400',
      hoverColor: 'group-hover:text-blue-300',
      borderHover: 'hover:border-blue-500/40',
      glowHover: 'hover:shadow-blue-500/10',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
        </svg>
      ),
      features: ['Edit entries inline & add new ones', 'Export filtered data as CSV', 'Detect duplicates & junk data', 'Sort, search, and bulk delete'],
    },
    {
      href: '/admin/trials',
      title: 'Trial Links',
      desc: 'Track and manage trial access tokens',
      color: 'pink',
      iconBg: 'bg-pink-500/15',
      iconColor: 'text-pink-400',
      hoverColor: 'group-hover:text-pink-300',
      borderHover: 'hover:border-pink-500/40',
      glowHover: 'hover:shadow-pink-500/10',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
        </svg>
      ),
      features: ['View all generated tokens', 'Check redemption status', 'Monitor expiration dates', 'Track usage sources'],
    },
    {
      href: '/admin/linkedin-posts',
      title: 'LinkedIn Posts',
      desc: 'Generate LinkedIn posts from startup data',
      color: 'green',
      iconBg: 'bg-green-500/15',
      iconColor: 'text-green-400',
      hoverColor: 'group-hover:text-green-300',
      borderHover: 'hover:border-green-500/40',
      glowHover: 'hover:shadow-green-500/10',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ),
      features: ['Select startups from database', 'Generate copy-paste ready posts', 'Promote Founder Flow organically', 'Customizable website links'],
    },
    {
      href: '/admin/tunnel-test',
      title: 'Tunnel Test',
      desc: 'Test N8N reverse tunnel connection',
      color: 'cyan',
      iconBg: 'bg-cyan-500/15',
      iconColor: 'text-cyan-400',
      hoverColor: 'group-hover:text-cyan-300',
      borderHover: 'hover:border-cyan-500/40',
      glowHover: 'hover:shadow-cyan-500/10',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      features: ['Test webhook connectivity', 'Verify tunnel is working', 'Check response times', 'Debug connection issues'],
    },
    {
      href: '/admin/clear-entries',
      title: 'Clear All Entries',
      desc: 'Bulk delete all entries from the database',
      color: 'red',
      iconBg: 'bg-red-500/15',
      iconColor: 'text-red-400',
      hoverColor: 'group-hover:text-red-300',
      borderHover: 'hover:border-red-500/40',
      glowHover: 'hover:shadow-red-500/10',
      icon: (
        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      ),
      features: ['Batch deletion with safe limits', 'Progress tracking', 'Firebase Spark plan optimized', 'Complete database clearing'],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0f1015]">
      <Navigation />

      <div className="mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-neutral-400 mt-2">
            Manage and maintain the application data and settings.
          </p>
        </div>

        {/* Navigation Cards — 2 columns on large screens */}
        <div className="grid md:grid-cols-2 gap-5 mb-8">
          {navCards.map(card => (
            <Link key={card.href} href={card.href} className="group">
              <div className={`bg-gradient-to-br from-[#11121b] to-[#13141f] border border-white/10 ${card.borderHover} rounded-xl p-6 transition-all duration-200 hover:shadow-xl ${card.glowHover} hover:scale-[1.01] h-full`}>
                <div className="flex items-start gap-4 mb-4">
                  <div className={`${card.iconBg} w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${card.iconColor}`}>
                    {card.icon}
                  </div>
                  <div className="min-w-0">
                    <h3 className={`text-xl font-semibold text-white ${card.hoverColor} transition-colors`}>
                      {card.title}
                    </h3>
                    <p className="text-neutral-400 text-sm mt-0.5">
                      {card.desc}
                    </p>
                  </div>
                  <svg className="w-5 h-5 text-neutral-600 group-hover:text-neutral-400 transition-colors flex-shrink-0 mt-1 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm text-neutral-400">
                  {card.features.map((f, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-neutral-600 mt-0.5">&#8226;</span>
                      <span>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Bottom section: Grant Pro + Notice side by side */}
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Grant Pro Access */}
          <div className="bg-gradient-to-br from-[#11121b] to-[#13141f] border border-white/10 rounded-xl p-6">
            <div className="flex items-start gap-4 mb-5">
              <div className="bg-purple-500/15 w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 text-purple-400">
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white">Grant Pro Access</h3>
                <p className="text-neutral-400 text-sm mt-0.5">
                  Grant Pro access with full duration flexibility (creates Stripe customers too)
                </p>
              </div>
            </div>

            <form onSubmit={handleGrantPro} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  User ID <span className="text-neutral-500 font-normal">(leave empty for yourself)</span>
                </label>
                <input
                  type="text"
                  value={grantProForm.targetUserId}
                  onChange={(e) => setGrantProForm(prev => ({ ...prev, targetUserId: e.target.value }))}
                  placeholder="user_2xxxxx... (optional)"
                  className="w-full px-4 py-2.5 bg-[#0f1015] border border-white/10 rounded-lg text-white placeholder-neutral-500 focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all text-sm"
                  disabled={grantProForm.loading}
                />
                {grantProForm.targetUserId.trim() && (
                  <p className="text-xs text-green-400 mt-1">
                    Full duration flexibility for all users
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-300 mb-1.5">
                  Duration
                </label>
                <select
                  value={grantProForm.durationDays}
                  onChange={(e) => setGrantProForm(prev => ({ ...prev, durationDays: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2.5 bg-[#0f1015] border border-white/10 rounded-lg text-white focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 focus:outline-none transition-all text-sm cursor-pointer"
                  disabled={grantProForm.loading}
                >
                  <option value={7}>7 days</option>
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={180}>6 months</option>
                  <option value={365}>1 year</option>
                  <option value={730}>2 years</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={grantProForm.loading}
                className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center shadow-lg hover:shadow-purple-600/20 hover:scale-[1.02] disabled:hover:scale-100"
              >
                {grantProForm.loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Granting...
                  </>
                ) : (
                  'Grant Pro Access'
                )}
              </button>

              {grantProForm.message && (
                <div className={`p-3 rounded-lg text-sm ${grantProForm.message.includes('✅')
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-red-500/20 text-red-300 border border-red-500/30'
                  }`}>
                  {grantProForm.message}
                </div>
              )}
            </form>
          </div>

          {/* Admin Access Notice */}
          <div className="bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border border-yellow-500/20 rounded-xl p-6 flex flex-col">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-yellow-500/15 w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="font-semibold text-yellow-200 text-lg">Admin Access Notice</h3>
            </div>
            <div className="text-yellow-300/80 text-sm space-y-3 flex-1">
              {[
                'Admin features are restricted to authorized users only',
                'All admin actions are logged and monitored',
                'Data deletion operations are permanent and cannot be undone',
                'Pro access grants now create Stripe customers for seamless upgrades',
                'Always backup critical data before performing bulk operations',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <span className="text-yellow-500/60 mt-0.5">&#8226;</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
