"use client";

import React, { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { collection, getDocs, query, orderBy, addDoc, doc, deleteDoc, where } from "firebase/firestore";
import { useUser } from "@clerk/nextjs";
import { clientDb } from "../../lib/firebase/client";
import Navigation from "../components/Navigation";
import IntegratedOutreachModal from "../components/IntegratedOutreachModal";

import {
  type EntryDoc,
  type FounderData,
  isNA,
  chooseLinks,
  tagsFrom,
  formatPublished,
  getEntryDateMs,
  toFounderData,
  toJobData,
  firstNonNA,
} from "../../lib/entry-helpers";
import { isValidApplyUrl } from "../../lib/url-validation";

import ViewToggle, { type ViewMode } from "./components/ViewToggle";
import TagFilter from "./components/TagFilter";
import EntryCard from "./components/EntryCard";
import EntryRow from "./components/EntryRow";
import FounderSidePanel from "./components/FounderSidePanel";

// ───── Toast ────────────────────────────────────────────────────────────

function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 2600);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="pointer-events-auto rounded-xl border px-3 py-2 text-sm shadow-lg"
      style={{
        borderColor: "rgba(180,151,214,.3)",
        background: "rgba(180,151,214,.12)",
        color: "var(--wisteria)",
      }}
    >
      {message}
    </div>
  );
}

// ───── Main page ────────────────────────────────────────────────────────

export default function EntryPage() {
  const { isSignedIn, user } = useUser();

  // Data
  const [items, setItems] = useState<EntryDoc[]>([]);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // View
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Panel / modal
  const [selectedFounder, setSelectedFounder] = useState<FounderData | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [outreachTarget, setOutreachTarget] = useState<FounderData | null>(null);

  // Filters & pagination
  const [q, setQ] = useState("");
  const [skillsQ, setSkillsQ] = useState("");
  const [onlyRoles, setOnlyRoles] = useState(false);
  const [onlyLinkedIn, setOnlyLinkedIn] = useState(false);
  const [onlyEmail, setOnlyEmail] = useState(false);
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"date_desc" | "date_asc" | "company_az">("date_desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(20);

  const prevFiltersRef = useRef({
    q: "", skillsQ: "", onlyRoles: false, onlyLinkedIn: false, onlyEmail: false,
    sortBy: "date_desc" as "date_desc" | "date_asc" | "company_az", selectedTagsSize: 0,
  });

  // Reset to page 1 when filters change
  useEffect(() => {
    const prev = prevFiltersRef.current;
    if (
      prev.q !== q || prev.skillsQ !== skillsQ ||
      prev.onlyRoles !== onlyRoles || prev.onlyLinkedIn !== onlyLinkedIn ||
      prev.onlyEmail !== onlyEmail || prev.sortBy !== sortBy ||
      prev.selectedTagsSize !== selectedTags.size
    ) {
      prevFiltersRef.current = { q, skillsQ, onlyRoles, onlyLinkedIn, onlyEmail, sortBy, selectedTagsSize: selectedTags.size };
      setCurrentPage(1);
    }
  }, [q, skillsQ, onlyRoles, onlyLinkedIn, onlyEmail, sortBy, selectedTags.size]);

  // ── Fetch entries ──
  useEffect(() => {
    const run = async () => {
      try {
        const q = query(collection(clientDb, "entry"), orderBy("published", "desc"));
        const snap = await getDocs(q);
        const rows = snap.docs.map((d) => {
          const anyD: any = d as any;
          const createdSec = anyD?._document?.createTime?.timestamp?.seconds ?? anyD?._document?.createTime?.seconds;
          const updatedSec = anyD?._document?.updateTime?.timestamp?.seconds ?? anyD?._document?.updateTime?.seconds;
          const createdMs = typeof createdSec === "number" ? createdSec * 1000 : undefined;
          const updatedMs = typeof updatedSec === "number" ? updatedSec * 1000 : undefined;
          return { id: d.id, __createdAtMillis: createdMs, __updatedAtMillis: updatedMs, ...d.data() } as EntryDoc;
        });
        setItems(rows);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, []);

  // ── Load saved jobs ──
  useEffect(() => {
    if (!isSignedIn || !user?.id) {
      setSavedJobIds(new Set());
      return;
    }
    const loadSavedJobs = async () => {
      try {
        const q = query(collection(clientDb, "saved_jobs"), where("userId", "==", user.id));
        const snapshot = await getDocs(q);
        const jobIds = new Set(snapshot.docs.map((doc) => doc.data().jobId));
        setSavedJobIds(jobIds);
      } catch (error) {
        console.error("Error loading saved jobs:", error);
      }
    };
    loadSavedJobs();
  }, [isSignedIn, user?.id]);

  // ── Save / unsave ──
  const saveJob = useCallback(async (jobData: any) => {
    if (!isSignedIn || !user?.id) return;
    try {
      if (savedJobIds.has(jobData.id)) {
        const q = query(collection(clientDb, "saved_jobs"), where("userId", "==", user.id), where("jobId", "==", jobData.id));
        const snapshot = await getDocs(q);
        await Promise.all(snapshot.docs.map((doc) => deleteDoc(doc.ref)));
        setSavedJobIds((prev) => {
          const n = new Set(prev);
          n.delete(jobData.id);
          return n;
        });
      } else {
        const cleanJobData = Object.fromEntries(Object.entries(jobData).filter(([_, v]) => v !== undefined));
        await fetch("/api/debug-saved-jobs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "create", jobData: { id: jobData.id, company: jobData.company } }),
        });
        await addDoc(collection(clientDb, "saved_jobs"), { userId: user.id, jobId: jobData.id, savedAt: new Date(), ...cleanJobData });
        setSavedJobIds((prev) => new Set([...prev, jobData.id]));
      }
    } catch (error) {
      console.error("Error saving/unsaving job:", error);
    }
  }, [isSignedIn, user?.id, savedJobIds]);

  // ── Tag index (computed from all items) ──
  const tagIndex = useMemo<[string, number][]>(() => {
    const counts = new Map<string, number>();
    for (const it of items) {
      const tags = tagsFrom(it.looking_for, 20);
      for (const tag of tags) {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [items]);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }, []);

  const clearTags = useCallback(() => setSelectedTags(new Set()), []);

  // ── Filtering + sorting ──
  const hasActiveFilters = Boolean(q.trim() || skillsQ.trim() || onlyRoles || onlyLinkedIn || onlyEmail || sortBy !== "date_desc" || selectedTags.size > 0);

  let filtered = items.filter((it) => {
    const { rolesUrl, apply_url, linkedinUrl, emailHref, companyUrl } = chooseLinks(it);
    // Without active filters, require at least one actionable link to reduce noise
    if (!hasActiveFilters && !(companyUrl || rolesUrl || apply_url || linkedinUrl)) return false;
    if (onlyRoles && (!apply_url || !isValidApplyUrl(apply_url))) return false;
    if (onlyLinkedIn && !linkedinUrl) return false;
    if (onlyEmail && !emailHref) return false;
    return true;
  });

  // Text filter
  if (q.trim()) {
    const s = q.trim().toLowerCase();
    filtered = filtered.filter((it) => {
      const hay = [it?.company, it?.name, it?.company_info]
        .map((v) => (v == null ? "" : String(v).toLowerCase()))
        .join(" ");
      return hay.includes(s);
    });
  }

  // Skills / roles filter
  if (skillsQ.trim()) {
    const s = skillsQ.trim().toLowerCase();
    filtered = filtered.filter((it) => {
      const hay = [it?.looking_for, it?.role]
        .map((v) => (v == null ? "" : String(v).toLowerCase()))
        .join(" ");
      return hay.includes(s);
    });
  }

  // Tag filter (OR logic)
  if (selectedTags.size > 0) {
    filtered = filtered.filter((it) => {
      const tags = tagsFrom(it.looking_for, 20);
      return tags.some((t) => selectedTags.has(t));
    });
  }

  // Sort
  filtered = [...filtered];
  if (sortBy === "date_desc") {
    filtered.sort((a, b) => getEntryDateMs(b) - getEntryDateMs(a));
  } else if (sortBy === "date_asc") {
    filtered.sort((a, b) => getEntryDateMs(a) - getEntryDateMs(b));
  } else if (sortBy === "company_az") {
    filtered.sort((a, b) => String(a?.company ?? "").localeCompare(String(b?.company ?? "")));
  }

  // Pagination
  const totalEntries = filtered.length;
  const totalPages = Math.ceil(totalEntries / entriesPerPage);
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedEntries = filtered.slice(startIndex, startIndex + entriesPerPage);

  // ── Handlers ──
  const openPanel = useCallback((founder: FounderData) => {
    setSelectedFounder(founder);
    setPanelOpen(true);
  }, []);

  const closePanel = useCallback(() => {
    setPanelOpen(false);
    // Delay clearing data so exit animation can play
    setTimeout(() => setSelectedFounder(null), 300);
  }, []);

  const openOutreach = useCallback((founder: FounderData) => {
    setOutreachTarget(founder);
  }, []);

  // ── Render ──
  if (loading) {
    return (
      <div className="min-h-screen" style={{
        background: `radial-gradient(900px 500px at 10% -10%, rgba(5,32,74,.12) 0%, transparent 60%),
          radial-gradient(900px 500px at 90% -10%, rgba(180,151,214,.12) 0%, transparent 60%),
          linear-gradient(180deg, #0c0d14, #0a0b12 60%, #08090f 100%)`,
        color: "#ececf1",
      }}>
        <Navigation />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-transparent border-t-white/60 border-r-white/60" />
            <div className="text-sm text-neutral-400">Loading opportunities...</div>
          </div>
        </div>
      </div>
    );
  }

  if (error) return <div className="p-6 text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen" style={{
      background: `radial-gradient(900px 500px at 10% -10%, rgba(5,32,74,.12) 0%, transparent 60%),
        radial-gradient(900px 500px at 90% -10%, rgba(180,151,214,.12) 0%, transparent 60%),
        linear-gradient(180deg, #0c0d14, #0a0b12 60%, #08090f 100%)`,
      color: "#ececf1",
    }}>
      <Navigation />

      <main className={`max-w-7xl mx-auto px-6 py-8 space-y-6 ${panelOpen ? "overflow-hidden max-h-screen" : ""}`}>
        {/* Header */}
        <header className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <h1
              className="text-lg sm:text-xl font-semibold"
              style={{
                background: "linear-gradient(135deg, #fff, var(--lavender-web))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Browse Opportunities
            </h1>
            <div className="flex items-center gap-3">
              <div className="text-sm text-[#ccceda]">
                Showing {paginatedEntries.length} of {totalEntries}
              </div>
              <ViewToggle value={viewMode} onChange={setViewMode} />
            </div>
          </div>

          {/* Filters Panel */}
          <section
            className="rounded-2xl p-4"
            style={{ border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.03)" }}
          >
            <div className="grid gap-4 lg:grid-cols-12">
              <div className="lg:col-span-6 grid gap-2">
                <div className="text-xs uppercase tracking-wide text-[#ccceda]">Filter by content</div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#141522] px-3 py-1.5 text-sm text-neutral-200">
                    <input type="checkbox" checked={onlyRoles} onChange={(e) => setOnlyRoles(e.target.checked)} className="text-[var(--amber)] focus:ring-[var(--amber)]" />
                    Apply Link
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#141522] px-3 py-1.5 text-sm text-neutral-200">
                    <input type="checkbox" checked={onlyLinkedIn} onChange={(e) => setOnlyLinkedIn(e.target.checked)} className="text-[var(--amber)] focus:ring-[var(--amber)]" />
                    LinkedIn
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#141522] px-3 py-1.5 text-sm text-neutral-200">
                    <input type="checkbox" checked={onlyEmail} onChange={(e) => setOnlyEmail(e.target.checked)} className="text-[var(--amber)] focus:ring-[var(--amber)]" />
                    Email
                  </label>
                </div>
              </div>
              <div className="lg:col-span-3 grid gap-2">
                <div className="text-xs uppercase tracking-wide text-[#ccceda]">Sort</div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full rounded-xl border border-white/10 bg-[#141522] px-2 py-2 text-sm text-white focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": "var(--amber)" } as any}
                >
                  <option value="date_desc">Newest</option>
                  <option value="date_asc">Oldest</option>
                  <option value="company_az">Name A → Z</option>
                </select>
              </div>
              <div className="lg:col-span-3 grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs uppercase tracking-wide text-[#ccceda]">Search</div>
                  <label className="text-xs uppercase tracking-wide text-[#ccceda]">
                    Per page
                    <select
                      value={entriesPerPage}
                      onChange={(e) => setEntriesPerPage(Number(e.target.value))}
                      className="ml-2 rounded-lg border border-white/10 bg-[#141522] px-2 py-1 text-xs text-white"
                    >
                      <option value="20">20</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </label>
                </div>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  type="text"
                  placeholder="Search within cards"
                  className="w-full rounded-xl border border-white/10 bg-[#141522] px-3.5 py-2 text-sm text-white placeholder-[#a9abb6] focus:outline-none focus:ring-2"
                  style={{ "--tw-ring-color": "var(--amber)" } as any}
                />
              </div>
            </div>
          </section>

          {/* Tag filter */}
          {tagIndex.length > 0 && (
            <div className="mt-4">
              <TagFilter
                tagIndex={tagIndex}
                selectedTags={selectedTags}
                onToggle={toggleTag}
                onClear={clearTags}
              />
            </div>
          )}
        </header>

        {/* Main Content */}
        <section className="mb-6">
          {totalEntries === 0 ? (
            <div className="text-center py-12">
              <div className="text-[#ccceda] text-lg">No entries found</div>
              <p className="text-[#a9abb6] text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : (
            <>
              {/* View transition wrapper */}
              <div key={viewMode} className="view-transition">
                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" style={{ gridAutoRows: "1fr" }}>
                    {paginatedEntries.map((it) => {
                      const founder = toFounderData(it);
                      return (
                        <EntryCard
                          key={it.id}
                          founder={founder}
                          isSaved={savedJobIds.has(it.id)}
                          onSave={saveJob}
                          onCardClick={() => openPanel(founder)}
                          onOutreach={() => openOutreach(founder)}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className="rounded-xl overflow-hidden"
                    style={{ border: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.02)" }}
                  >
                    {/* List header */}
                    <div
                      className="flex items-center gap-3 px-4 h-10 text-[10px] font-semibold text-neutral-500 uppercase tracking-wider border-b border-white/6"
                    >
                      <div className="w-8 flex-shrink-0" />
                      <div className="w-[160px] flex-shrink-0">Company</div>
                      <div className="w-[140px] flex-shrink-0 hidden sm:block">Founder</div>
                      <div className="w-[120px] flex-shrink-0 hidden md:block">Role</div>
                      <div className="flex-1 hidden lg:block">Tags</div>
                      <div className="flex-shrink-0">Info</div>
                      <div className="w-[88px] flex-shrink-0" />
                      <div className="w-[40px] text-right flex-shrink-0">Date</div>
                    </div>
                    {paginatedEntries.map((it, idx) => {
                      const founder = toFounderData(it);
                      return (
                        <EntryRow
                          key={it.id}
                          founder={founder}
                          isSaved={savedJobIds.has(it.id)}
                          onSave={saveJob}
                          onClick={() => openPanel(founder)}
                          onOutreach={() => openOutreach(founder)}
                          even={idx % 2 === 0}
                        />
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav className="mt-6 flex items-center justify-center gap-1">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className={`rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                      currentPage === 1
                        ? "opacity-50 cursor-not-allowed text-[#ccceda]"
                        : "text-[#ccceda] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Prev
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) pageNum = i + 1;
                    else if (currentPage <= 3) pageNum = i + 1;
                    else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                    else pageNum = currentPage - 2 + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                          currentPage === pageNum
                            ? "bg-[var(--amber)] text-black"
                            : "text-[#ccceda] hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className={`rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                      currentPage === totalPages
                        ? "opacity-50 cursor-not-allowed text-[#ccceda]"
                        : "text-[#ccceda] hover:text-white hover:bg-white/5"
                    }`}
                  >
                    Next
                  </button>
                </nav>
              )}
            </>
          )}
        </section>

        {/* Toast */}
        <div className="pointer-events-none fixed right-4 top-16 z-50 space-y-2">
          {toast && <Toast message={toast} onClose={() => setToast(null)} />}
        </div>
      </main>

      {/* Side panel */}
      {selectedFounder && (
        <FounderSidePanel
          founder={selectedFounder}
          open={panelOpen}
          onClose={closePanel}
          onSave={saveJob}
          isSaved={savedJobIds.has(selectedFounder.id)}
          onOutreach={() => openOutreach(selectedFounder)}
        />
      )}

      {/* Outreach modal */}
      {outreachTarget && (
        <IntegratedOutreachModal
          jobData={toJobData(outreachTarget)}
          userProfile={null}
          onClose={() => setOutreachTarget(null)}
        />
      )}
    </div>
  );
}
