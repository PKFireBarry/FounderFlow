import type { Metadata } from 'next';

// Trial links are private, per-recipient URLs. They aren't linked anywhere, but
// without this nothing stops a leaked or shared one from being indexed.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function TrialLayout({ children }: { children: React.ReactNode }) {
  return children;
}
