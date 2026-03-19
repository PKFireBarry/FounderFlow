/**
 * Keyword extraction helpers for the opportunities tag filter.
 * Extracts normalized role keywords from freeform "looking_for" text.
 */

// ───── Value normalisation ──────────────────────────────────────────────

export function isNA(value: any): boolean {
  if (value == null) return true;
  const s = String(value)
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .trim()
    .toLowerCase();
  if (!s) return true;
  const stripped = s.replace(/[\s\./\\_\-–⁄]/g, "");
  return (
    s === "N/A" ||
    s === "-" ||
    stripped === "na" ||
    stripped === "none" ||
    stripped === "null" ||
    stripped === "undefined" ||
    stripped === "tbd"
  );
}

// ── Stop words to filter out when extracting role keywords ──────────────
const STOP_WORDS = new Set([
  // articles / prepositions / conjunctions
  "a", "an", "the", "in", "on", "at", "to", "for", "of", "with", "by",
  "from", "up", "about", "into", "through", "during", "before", "after",
  "above", "below", "between", "under", "over", "as", "but", "if",
  "or", "and", "nor", "not", "so", "yet", "both", "either", "neither",
  "across", "around", "along", "within", "without", "toward", "towards",
  // pronouns
  "i", "me", "my", "we", "us", "our", "you", "your", "he", "she",
  "it", "its", "they", "them", "their", "who", "whom", "that", "this",
  "these", "those", "which", "what",
  // verbs / auxiliaries
  "is", "are", "was", "were", "be", "been", "being", "have", "has",
  "had", "do", "does", "did", "will", "would", "shall", "should",
  "may", "might", "must", "can", "could",
  // common filler in job descriptions
  "looking", "seeking", "hiring", "need", "needs", "needed", "want",
  "wanted", "someone", "people", "person", "team", "help",
  "role", "roles", "position", "positions", "join", "work", "working",
  "experience", "experienced", "background", "strong", "good", "great",
  "etc", "also", "ideally", "preferably", "especially",
  "like", "able", "ability", "open", "new", "more", "very",
  "well", "all", "any", "some", "each", "every", "other",
  "just", "really", "based", "early", "stage",
  // noise words that commonly leak through from job descriptions
  "forward", "deployed", "members", "member", "minded",
  "driven", "focused", "passionate", "self", "starter",
  "level", "mid", "junior",
  "first", "department", "collaborators", "collaborator",
  "customer", "software", "development", "technical",
  // standalone modifiers that aren't useful as filters by themselves
  "founding", "senior", "staff", "principal", "associate",
  "own", "ideas", "venture", "enterprise", "revenue",
  "build", "talent", "focus", "representative", "specialist",
  "relations", "projects", "events",
]);

// ── Canonical alias map: normalise plurals, abbreviations, variants ─────
const CANONICAL_MAP = new Map<string, string>([
  ["engineers", "Engineer"],
  ["engineering", "Engineer"],
  ["developer", "Engineer"],
  ["developers", "Engineer"],
  ["managers", "Manager"],
  ["executives", "Executive"],
  ["designers", "Designer"],
  ["salespeople", "Sales"],
  ["salesperson", "Sales"],
  ["ops", "Operations"],
  ["operation", "Operations"],
  ["marketers", "Marketing"],
  ["marketer", "Marketing"],
  ["recruiters", "Recruiter"],
  ["recruiting", "Recruiter"],
  ["analysts", "Analyst"],
  ["investors", "Investor"],
  ["directors", "Director"],
  ["leads", "Lead"],
  ["leader", "Lead"],
  ["consultants", "Consultant"],
  ["coordinators", "Coordinator"],
  ["founders", "Co Founder"],
  ["strategists", "Strategist"],
  ["design", "Designer"],
  ["strategic", "Strategy"],
  ["partnerships", "Partnerships"],
  ["partner", "Partnerships"],
  ["partners", "Partnerships"],
  ["go to market", "GTM"],
  ["strategist", "Strategy"],
  ["founder", "Co Founder"],
  ["co-founders", "Co Founder"],
  ["management", "Manager"],
  ["biz", "Business"],
]);

// ── Known multi-word role phrases (checked first, case-insensitive) ─────
const KNOWN_PHRASES: string[] = [
  "technical co-founder", "tech co-founder", "non-technical co-founder",
  "business co-founder", "co-founder",
  "founding engineer", "founding designer", "founding pm",
  "founding product manager", "founding member",
  "founding marketer", "founding growth marketer",
  "founding sales", "founding cto", "founding ceo",
  "full stack", "full-stack", "fullstack",
  "front end", "front-end", "frontend",
  "back end", "back-end", "backend",
  "software engineer", "machine learning", "data scientist",
  "data engineer", "data analyst",
  "ai engineer", "ml engineer", "ai/ml",
  "mobile engineer", "ios engineer", "android engineer",
  "devops engineer", "site reliability",
  "blockchain engineer", "smart contract",
  "solutions engineer", "sales engineer",
  "product manager", "product designer", "product lead",
  "ux designer", "ui designer", "ux/ui", "ui/ux",
  "graphic designer",
  "growth marketer", "growth hacker", "growth lead",
  "content marketer", "content creator",
  "digital marketer", "performance marketer",
  "social media", "community manager",
  "business development", "biz dev",
  "chief of staff", "head of",
  "operations manager", "project manager",
  "account manager", "customer success",
  "general manager",
  "go to market", "go-to-market", "gtm",
  "supply chain",
];

// Pre-compile phrase patterns for performance
const PHRASE_PATTERNS = KNOWN_PHRASES.map((phrase) => ({
  pattern: new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\\/]/g, "\\$&").replace(/-/g, "[\\s-]?")}\\b`, "gi"),
  label: phrase
    .replace(/[-/]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" "),
}));

/**
 * Extract individual role keywords from human-written "looking for" text.
 * Returns de-duplicated, title-cased keywords suitable for global tag indexing.
 */
export function extractRoleKeywords(value: any): string[] {
  if (isNA(value)) return [];
  let text = String(value).trim();
  if (!text) return [];

  const keywords: string[] = [];
  const seen = new Set<string>();

  const addKeyword = (word: string) => {
    const lower = word.toLowerCase().trim();
    const canonical = CANONICAL_MAP.get(lower);
    let normalized: string;
    if (canonical) {
      normalized = canonical;
    } else {
      normalized = lower
        .split(/[\s]+/)
        .map((w) => {
          if (["cto", "ceo", "cfo", "coo", "cmo", "cpo", "cro", "vp", "pm", "qa", "ai", "ml", "ui", "ux", "gtm", "seo", "sre"].includes(w)) {
            return w.toUpperCase();
          }
          return w.charAt(0).toUpperCase() + w.slice(1);
        })
        .join(" ");
    }
    const key = normalized.toLowerCase();
    if (!seen.has(key) && key.length > 1) {
      seen.add(key);
      keywords.push(normalized);
    }
  };

  // Phase 1: Extract known multi-word phrases
  for (const { pattern, label } of PHRASE_PATTERNS) {
    pattern.lastIndex = 0;
    while (pattern.exec(text) !== null) {
      addKeyword(label);
    }
    text = text.replace(pattern, " ");
  }

  // Phase 2: Split remaining text into segments
  const segments = text
    .split(/[,\/&]|\band\b|\bor\b/i)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // Phase 3: Extract significant words from each segment
  for (const segment of segments) {
    const words = segment
      .replace(/[^a-zA-Z\s-]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 2 && !STOP_WORDS.has(w.toLowerCase()));

    for (const word of words) {
      addKeyword(word);
    }
  }

  return keywords;
}
