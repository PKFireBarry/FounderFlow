export type Placement = 'top' | 'bottom' | 'left' | 'right' | 'center';

export interface TourStep {
  id: string;
  route: string | null;
  selector: string | null; // data-tour attribute value; null = centered modal (no spotlight)
  title: string;
  body: string;
  placement: Placement;
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'welcome',
    route: null,
    selector: null,
    title: "Welcome to Founder Flow",
    body: "You've got 7 days of Pro access free. This 60-second tour will show you everything. Skip any time.",
    placement: 'center',
  },
  {
    id: 'filters',
    route: '/opportunities',
    selector: 'tour-filters',
    title: "Search & Filter the Directory",
    body: "Search by name or company, then use Filters to narrow by contact type (Email, LinkedIn, Apply link) or sort by date.",
    placement: 'bottom',
  },
  {
    id: 'entry-card',
    route: '/opportunities',
    selector: 'tour-entry-card',
    title: "Browse Real Founders",
    body: "Each card is a real early-stage founder. Click a card to see their full profile, contact links, and what they're looking for.",
    placement: 'bottom',
  },
  {
    id: 'save-button',
    route: '/opportunities',
    selector: 'tour-save-button',
    title: "Save Founders You Like",
    body: "Hit Save to add anyone to your Dashboard so you can reach out later. It shows up instantly.",
    placement: 'left',
  },
  {
    id: 'nav-dashboard',
    route: '/opportunities',
    selector: 'tour-nav-dashboard',
    title: "Your Dashboard",
    body: "All your saved founders live in the Dashboard. Let's go there now.",
    placement: 'bottom',
  },
  {
    id: 'saved-contacts',
    route: '/dashboard',
    selector: 'tour-saved-contacts',
    title: "Saved Founder Contacts",
    body: "Every founder you save appears here. Sort, search, and track where each conversation stands.",
    placement: 'bottom',
  },
  {
    id: 'generate-ai',
    route: '/dashboard',
    selector: 'tour-generate-ai',
    title: "Generate AI Outreach",
    body: "Click Generate Outreach on any contact to draft a personalized email or LinkedIn DM. The AI pulls from their profile and your background.",
    placement: 'top',
  },
  {
    id: 'resume-upload',
    route: '/dashboard',
    selector: 'tour-resume-upload',
    title: "Upload Your Resume",
    body: "The Context Settings tab lets you upload a resume and set goals. The AI uses this so every message sounds like you, not a template.",
    placement: 'bottom',
  },
  {
    id: 'nav-outreach',
    route: '/dashboard',
    selector: 'tour-nav-outreach',
    title: "Outreach Board",
    body: "Track every conversation in your Outreach Board. Let's take a look.",
    placement: 'bottom',
  },
  {
    id: 'kanban-board',
    route: '/outreach',
    selector: 'tour-kanban-board',
    title: "Track Your Pipeline",
    body: "Drag cards across stages as conversations progress. Use the Email and LinkedIn tabs to keep each channel separate.",
    placement: 'top',
  },
  {
    id: 'done',
    route: null,
    selector: null,
    title: "You're all set",
    body: "That covers everything. Your 7-day Pro trial is running — manage it anytime from Billing in the nav.",
    placement: 'center',
  },
];
