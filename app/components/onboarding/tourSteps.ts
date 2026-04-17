export type Placement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TourStep {
  id: string;
  route: string | null;
  selector: string | null;
  title: string;
  body: string;
  placement: Placement;
  action?: 'click'; // programmatically click the target element ~700ms after spotlight appears
}

export const TOUR_STEPS: TourStep[] = [
  // ── Welcome ───────────────────────────────────────────────────────────────
  {
    id: 'welcome',
    route: null,
    selector: null,
    title: "Welcome to Founder Flow",
    body: "You've got 7 days of Pro access free. This 60-second tour shows you everything. Hit Skip any time.",
    placement: 'center',
  },

  // ── Directory ─────────────────────────────────────────────────────────────
  {
    id: 'filters',
    route: '/opportunities',
    selector: 'tour-filters',
    title: "Search & Filter",
    body: "Search by name or company. Use Filters to narrow by contact type — Email, LinkedIn, or Apply link.",
    placement: 'bottom',
  },
  {
    id: 'entry-card',
    route: '/opportunities',
    selector: 'tour-entry-card',
    title: "Browse Real Founders",
    body: "Every card is a real early-stage founder. Click to see their full profile, links, and what they're looking for.",
    placement: 'bottom',
  },
  {
    id: 'save-button',
    route: '/opportunities',
    selector: 'tour-save-button',
    title: "Save Founders You Like",
    body: "Hit Save on any card to add that founder to your Dashboard so you can message them later.",
    placement: 'left',
  },

  // ── Navigate to Dashboard ─────────────────────────────────────────────────
  {
    id: 'nav-dashboard',
    route: '/opportunities',
    selector: 'tour-nav-dashboard',
    title: "Go to Dashboard",
    body: "All your saved founders live in the Dashboard. Let's head there now.",
    placement: 'bottom',
  },

  // ── Dashboard — contacts ──────────────────────────────────────────────────
  {
    id: 'saved-contacts',
    route: '/dashboard',
    selector: 'tour-saved-contacts',
    title: "Your Saved Contacts",
    body: "Every founder you save appears here. Sort, search, and track where each conversation stands.",
    placement: 'bottom',
  },

  // ── AI Outreach Generation ────────────────────────────────────────────────
  {
    id: 'generate-ai',
    route: '/dashboard',
    selector: 'tour-generate-ai',
    title: "AI Outreach Generator",
    body: "Click Generate Outreach on any saved contact to open the AI writing tool. We'll open it now so you can see what it looks like.",
    placement: 'top',
    action: 'click', // opens the IntegratedOutreachModal on the first saved contact
  },
  {
    id: 'outreach-modal',
    route: '/dashboard',
    selector: 'tour-outreach-modal',
    title: "Craft Your Message",
    body: "Choose Email or LinkedIn, pick your outreach goal, then click Generate. The AI drafts a personalized message using the founder's profile and your background. Copy it and send.",
    placement: 'left',
  },

  // ── Context Settings (resume upload) ─────────────────────────────────────
  {
    id: 'resume-upload',
    route: '/dashboard?tab=context',
    selector: 'tour-context-section',
    title: "Add Your Context First",
    body: "Before generating outreach, upload your resume here. The AI reads it to make every message sound like you wrote it — not a generic template.",
    placement: 'bottom',
  },

  // ── Navigate to Outreach Board ────────────────────────────────────────────
  {
    id: 'nav-outreach',
    route: '/dashboard',
    selector: 'tour-nav-outreach',
    title: "Outreach Board",
    body: "Once you've sent a message, track it here. Let's take a look.",
    placement: 'bottom',
  },

  // ── Outreach Board ────────────────────────────────────────────────────────
  {
    id: 'kanban-tabs',
    route: '/outreach',
    selector: 'tour-kanban-tabs',
    title: "Email vs LinkedIn",
    body: "Switch between your Email and LinkedIn pipelines. Each has its own stages so you can track response rates separately.",
    placement: 'bottom',
  },
  {
    id: 'kanban-cols',
    route: '/outreach',
    selector: 'tour-kanban-cols',
    title: "Drag to Track Progress",
    body: "Drag cards left or right as conversations progress — Sent → Responded → In Talks, and so on. Click any card to add notes.",
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
