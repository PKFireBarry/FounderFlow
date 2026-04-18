export type Placement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TourStep {
  id: string;
  route: string | null;
  selector: string | null;
  title: string;
  body: string;
  placement: Placement;
  /** Tour renders MockContactCard overlay on this step */
  showMockCard?: boolean;
  /** Tour renders DemoOutreachModal overlay on this step */
  showDemoModal?: boolean;
}

export const TOUR_STEPS: TourStep[] = [
  // ── Welcome ───────────────────────────────────────────────────────────────
  {
    id: 'welcome',
    route: null,
    selector: null,
    title: 'Welcome to Founder Flow',
    body: "You've got 7 days of Pro access free. This 60-second tour shows you everything. Hit Skip any time.",
    placement: 'center',
  },

  // ── Directory ─────────────────────────────────────────────────────────────
  {
    id: 'filters',
    route: '/opportunities',
    selector: 'tour-filter-toggle',
    title: 'Search & Filter',
    body: "Search by name or company. The Filters panel (opening now) lets you narrow by contact type — Email, LinkedIn, Apply link — or filter by role tags like 'engineer', 'designer', or 'AI'.",
    placement: 'bottom',
  },
  {
    id: 'entry-card',
    route: '/opportunities',
    selector: 'tour-entry-card',
    title: 'Browse Real Founders',
    body: "Every card is a real early-stage founder. Click to see their full profile, links, and what they're looking for.",
    placement: 'bottom',
  },
  {
    id: 'save-button',
    route: '/opportunities',
    selector: 'tour-save-button',
    title: 'Save Founders You Like',
    body: 'Hit Save on any card to add that founder to your Dashboard so you can message them later.',
    placement: 'left',
  },

  // ── Navigate to Dashboard ─────────────────────────────────────────────────
  {
    id: 'nav-dashboard',
    route: '/opportunities',
    selector: 'tour-nav-dashboard',
    title: 'Go to Dashboard',
    body: 'All your saved founders live in the Dashboard. Let\'s head there now.',
    placement: 'bottom',
  },

  // ── Dashboard — contacts ──────────────────────────────────────────────────
  {
    id: 'saved-contacts',
    route: '/dashboard',
    selector: 'tour-saved-contacts',
    title: 'Your Saved Contacts',
    body: 'Every founder you save appears here. Sort, search, and track where each conversation stands.',
    placement: 'bottom',
  },

  // ── AI Outreach — demo contact card ──────────────────────────────────────
  {
    id: 'mock-card',
    route: '/dashboard',
    selector: 'tour-mock-card',
    title: 'Generate Outreach',
    body: 'Each saved founder card has a Generate Outreach button. Click it to open the AI writing tool — we\'ll show you on this demo contact.',
    placement: 'right',
    showMockCard: true,
  },

  // ── AI Outreach — modal setup ─────────────────────────────────────────────
  {
    id: 'outreach-modal-setup',
    route: '/dashboard',
    selector: 'tour-modal-setup',
    title: 'Pick Your Channel & Goal',
    body: 'Choose Email or LinkedIn. Then set the outreach goal: Job Application, Partnership, or Networking. The AI tailors the message to match.',
    placement: 'right',
    showDemoModal: true,
  },

  // ── AI Outreach — generated result ───────────────────────────────────────
  {
    id: 'outreach-modal-result',
    route: '/dashboard',
    selector: 'tour-modal-result',
    title: 'AI-Generated Message',
    body: "The AI writes a personalized message using the founder's profile and your resume. Edit it, copy it, or save it straight to your outreach board.",
    placement: 'left',
    showDemoModal: true,
  },

  // ── Context Settings (resume upload) ─────────────────────────────────────
  {
    id: 'resume-upload',
    route: '/dashboard',
    selector: 'tour-context-section',
    title: 'Add Your Context',
    body: 'Upload your resume here before generating outreach. The AI reads it so every message sounds like you wrote it — not a generic template.',
    placement: 'bottom',
  },

  // ── Navigate to Outreach Board ────────────────────────────────────────────
  {
    id: 'nav-outreach',
    route: '/dashboard',
    selector: 'tour-nav-outreach',
    title: 'Outreach Board',
    body: "Once you've sent a message, track it here. Let's take a look.",
    placement: 'bottom',
  },

  // ── Outreach Board ────────────────────────────────────────────────────────
  {
    id: 'kanban-tabs',
    route: '/outreach',
    selector: 'tour-kanban-tabs',
    title: 'Email vs LinkedIn',
    body: 'Switch between your Email and LinkedIn pipelines. Each has its own stages so you can track response rates separately.',
    placement: 'bottom',
  },
  {
    id: 'kanban-cols',
    route: '/outreach',
    selector: 'tour-kanban-cols',
    title: 'Drag to Track Progress',
    body: 'Drag cards left or right as conversations progress — Sent → Responded → In Talks, and so on. Click any card to add notes.',
    placement: 'top',
  },

  // ── Done ──────────────────────────────────────────────────────────────────
  {
    id: 'done',
    route: null,
    selector: null,
    title: "You're all set!",
    body: "That's everything. Your 7-day Pro trial is running — upgrade or manage it anytime from Billing in the nav.",
    placement: 'center',
  },
];
