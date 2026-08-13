export type Placement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TourStep {
  id: string;
  route: string | null;
  selector: string | null;
  title: string;
  body: string;
  placement: Placement;
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
    body: "7 days of Pro, completely free. Take the 60-second tour and see exactly how founders land replies. Let's go.",
    placement: 'center',
  },

  // ── Directory ─────────────────────────────────────────────────────────────
  {
    id: 'filters',
    route: '/opportunities',
    selector: 'tour-filter-toggle',
    title: 'Find Your People, Fast',
    body: "Search any name or company. Pop open Filters (doing that now) to zero in by contact type: Email, LinkedIn, or Apply link. You can also filter by role tags like 'engineer', 'designer', or 'AI'.",
    placement: 'bottom',
  },
  {
    id: 'entry-card',
    route: '/opportunities',
    selector: 'tour-entry-card',
    title: 'Real Founders. Real Fast.',
    body: "Every card is a real early-stage founder, no fluff. Click through for their full profile, links, and exactly what they're hunting for.",
    placement: 'bottom',
  },
  {
    id: 'save-button',
    route: '/opportunities',
    selector: 'tour-save-button',
    title: 'Save the Ones That Click',
    body: 'See a founder worth chasing? Hit Save. They land on your Dashboard, ready to message whenever you are.',
    placement: 'left',
  },

  // ── Navigate to Dashboard ─────────────────────────────────────────────────
  {
    id: 'nav-dashboard',
    route: '/opportunities',
    selector: 'tour-nav-dashboard',
    title: 'Straight to Your Dashboard',
    body: "Every founder you save lives here. Let's jump over and take a look.",
    placement: 'bottom',
  },

  // ── Dashboard — contacts ──────────────────────────────────────────────────
  {
    id: 'saved-contacts',
    route: '/dashboard',
    selector: 'tour-saved-contacts',
    title: 'Your Hit List',
    body: 'Every saved founder shows up right here. Sort, search, and see where each conversation stands at a glance.',
    placement: 'bottom',
  },

  // ── AI Outreach — generate button ────────────────────────────────────────
  {
    id: 'generate-ai',
    route: '/dashboard',
    selector: 'tour-generate-ai',
    title: 'Let the AI Write It',
    body: "Every contact has a Generate Outreach button. One click opens the AI writer. Let's fire it up.",
    placement: 'top',
  },

  // ── AI Outreach — modal setup ─────────────────────────────────────────────
  {
    id: 'outreach-modal-setup',
    route: '/dashboard',
    selector: 'tour-modal-setup',
    title: 'Set the Play',
    body: 'Pick your channel, Email or LinkedIn, then your goal: Job Application, Partnership, or Networking. The AI shapes every word to match.',
    placement: 'right',
    showDemoModal: true,
  },

  // ── AI Outreach — generated result ───────────────────────────────────────
  {
    id: 'outreach-modal-result',
    route: '/dashboard',
    selector: 'tour-modal-result',
    title: 'Your Message, Written for You',
    body: "The AI blends the founder's profile with your resume into a message that actually sounds human. Tweak it, copy it, or drop it straight onto your board.",
    placement: 'left',
    showDemoModal: true,
  },

  // ── Context Settings (resume upload) ─────────────────────────────────────
  {
    id: 'resume-upload',
    route: '/dashboard',
    selector: 'tour-context-section',
    title: 'Feed It Your Story',
    body: 'Drop your resume here before you generate. The AI reads it so every message sounds like you wrote it, not some template a robot spat out.',
    placement: 'bottom',
  },

  // ── Navigate to Outreach Board ────────────────────────────────────────────
  {
    id: 'nav-outreach',
    route: '/dashboard',
    selector: 'tour-nav-outreach',
    title: 'Track Every Send',
    body: "Sent a message? This is where you watch it move. Let's check it out.",
    placement: 'bottom',
  },

  // ── Outreach Board ────────────────────────────────────────────────────────
  {
    id: 'kanban-tabs',
    route: '/outreach',
    selector: 'tour-kanban-tabs',
    title: 'Email vs LinkedIn',
    body: "Flip between your Email and LinkedIn pipelines. Separate stages, separate response rates, so you always know what's working.",
    placement: 'bottom',
  },
  {
    id: 'kanban-cols',
    route: '/outreach',
    selector: 'tour-kanban-cols',
    title: 'Drag. Track. Win.',
    body: 'Slide cards as things heat up: Sent → Responded → In Talks, and beyond. Click any card to drop in notes.',
    placement: 'top',
  },

  // ── Done ──────────────────────────────────────────────────────────────────
  {
    id: 'done',
    route: null,
    selector: null,
    title: "You're Ready to Roll",
    body: "That's the whole thing. Your 7-day Pro trial is live. Manage or upgrade anytime from Billing up top, then go land some replies.",
    placement: 'center',
  },
];
